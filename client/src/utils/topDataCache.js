// Cache keys for sessionStorage
import { getApiBaseUrl } from '../config/api';

const CACHE_KEYS = {
  UNIFIED_TOP_TRACKS: 'unified_top_tracks'
};

// Check if cache exists and is valid
export const isCacheValid = () => {
  try {
    const data = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    
    if (!data) return false;
    
    const hasData = JSON.parse(data)?.length > 0;
    
    return hasData;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};

// Check if cache has all required data
export const hasCompleteCache = () => {
  try {
    const data = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    return data && JSON.parse(data)?.length > 0;
  } catch (error) {
    console.error('Error checking cache completeness:', error);
    return false;
  }
};

// Build unified tracks with rankings across all time periods
const buildUnifiedTracks = (tracks4Weeks, tracks6Months, tracks12Months) => {
  const unifiedTracks = new Map(); // Use Map to avoid duplicates by track ID
  
  // Process 4 weeks tracks
  if (Array.isArray(tracks4Weeks)) {
    tracks4Weeks.forEach((track, index) => {
      if (track && track.id) {
        unifiedTracks.set(track.id, {
          id: track.id,
          name: track.name,
          artists: track.artists?.map(artist => ({
            id: artist.id,
            name: artist.name
          })) || [],
          album: track.album ? {
            id: track.album.id,
            name: track.album.name,
            images: track.album.images || [],
            release_date: track.album.release_date || null
          } : null,
          release_date: track.release_date || null,
          popularity: track.popularity || null,
          rankings: {
            '4_weeks': index + 1,
            '6_months': null,
            '12_months': null
          }
        });
      }
    });
  }
  
  // Process 6 months tracks
  if (Array.isArray(tracks6Months)) {
    tracks6Months.forEach((track, index) => {
      if (track && track.id) {
        if (unifiedTracks.has(track.id)) {
          // Update existing track with 6 months ranking
          const existing = unifiedTracks.get(track.id);
          existing.rankings['6_months'] = index + 1;
          // Preserve release date information if it exists in the new track
          if (track.release_date) {
            existing.release_date = track.release_date;
          }
          if (track.album && track.album.release_date) {
            if (!existing.album) {
              existing.album = {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images || []
              };
            }
            existing.album.release_date = track.album.release_date;
          }
          // Preserve popularity information if it exists in the new track
          if (track.popularity !== null && track.popularity !== undefined) {
            existing.popularity = track.popularity;
          }
        } else {
          // Add new track
          unifiedTracks.set(track.id, {
            id: track.id,
            name: track.name,
            artists: track.artists?.map(artist => ({
              id: artist.id,
              name: artist.name
            })) || [],
            album: track.album ? {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images || [],
              release_date: track.album.release_date || null
            } : null,
            release_date: track.release_date || null,
            popularity: track.popularity || null,
            rankings: {
              '4_weeks': null,
              '6_months': index + 1,
              '12_months': null
            }
          });
        }
      }
    });
  }
  
  // Process 12 months tracks
  if (Array.isArray(tracks12Months)) {
    tracks12Months.forEach((track, index) => {
      if (track && track.id) {
        if (unifiedTracks.has(track.id)) {
          // Update existing track with 12 months ranking
          const existing = unifiedTracks.get(track.id);
          existing.rankings['12_months'] = index + 1;
          // Preserve release date information if it exists in the new track
          if (track.release_date) {
            existing.release_date = track.release_date;
          }
          if (track.album && track.album.release_date) {
            if (!existing.album) {
              existing.album = {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images || []
              };
            }
            existing.album.release_date = track.album.release_date;
          }
          // Preserve popularity information if it exists in the new track
          if (track.popularity !== null && track.popularity !== undefined) {
            existing.popularity = track.popularity;
          }
        } else {
          // Add new track
          unifiedTracks.set(track.id, {
            id: track.id,
            name: track.name,
            artists: track.artists?.map(artist => ({
              id: artist.id,
              name: artist.name
            })) || [],
            album: track.album ? {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images || [],
              release_date: track.album.release_date || null
            } : null,
            release_date: track.release_date || null,
            popularity: track.popularity || null,
            rankings: {
              '4_weeks': null,
              '6_months': null,
              '12_months': index + 1
            }
          });
        }
      }
    });
  }
  
  // Convert Map to array and sort by best overall ranking
  return Array.from(unifiedTracks.values()).sort((a, b) => {
    // Get best ranking for each track (lower number = better ranking)
    const aBestRank = Math.min(...Object.values(a.rankings).filter(rank => rank !== null));
    const bBestRank = Math.min(...Object.values(a.rankings).filter(rank => rank !== null));
    
    // If both have rankings, sort by best rank
    if (aBestRank !== Infinity && bBestRank !== Infinity) {
      return aBestRank - bBestRank;
    }
    
    // If only one has rankings, prioritize the one with rankings
    if (aBestRank !== Infinity) return -1;
    if (bBestRank !== Infinity) return 1;
    
    // If neither has rankings, maintain original order
    return 0;
  });
};

// Fetch all top data and cache it
export const fetchAndCacheTopData = async () => {
  try {
    console.log('🔄 Fetching and building unified top tracks cache...');
    
    const endpoints = [
      { url: `${getApiBaseUrl()}/last-4-weeks`, name: '4_weeks' },
      { url: `${getApiBaseUrl()}/last-6-months`, name: '6_months' },
      { url: `${getApiBaseUrl()}/last-12-months`, name: '12_months' }
    ];

    // Fetch all data in parallel for maximum speed
    const promises = endpoints.map(async ({ url, name }) => {
      try {
        const response = await fetch(url, {
          credentials: 'include'
        });
        if (!response.ok) {
          console.warn(`HTTP ${response.status} for ${url}: ${response.statusText}`);
          return { success: false, name, error: `HTTP ${response.status}`, tracks: [] };
        }
        const data = await response.json();
        
        return { 
          success: true, 
          name, 
          tracks: data.tracks || [] 
        };
      } catch (error) {
        console.error(`❌ Error fetching data from ${url}:`, error);
        return { success: false, name, error: error.message, tracks: [] };
      }
    });

    const results = await Promise.all(promises);
    
    // Build unified tracks with rankings
    const tracks4Weeks = results.find(r => r.name === '4_weeks')?.tracks || [];
    const tracks6Months = results.find(r => r.name === '6_months')?.tracks || [];
    const tracks12Months = results.find(r => r.name === '12_months')?.tracks || [];
    
    // Debug: Check if tracks have release date information
    console.log('Sample track from 4 weeks:', tracks4Weeks[0]);
    console.log('Sample track from 6 months:', tracks6Months[0]);
    console.log('Sample track from 12 months:', tracks12Months[0]);
    
    const unifiedTracks = buildUnifiedTracks(tracks4Weeks, tracks6Months, tracks12Months);
    
    // Cache the unified tracks
    sessionStorage.setItem(CACHE_KEYS.UNIFIED_TOP_TRACKS, JSON.stringify(unifiedTracks));
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Built unified cache with ${unifiedTracks.length} unique tracks from ${successCount}/3 time ranges`);
    
    return { success: true, trackCount: unifiedTracks.length, successCount };
  } catch (error) {
    console.error('❌ Error in fetchAndCacheTopData:', error);
    throw error;
  }
};

// Get cached unified top tracks
export const getCachedTopTracks = () => {
  try {
    const data = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached unified top tracks:', error);
    return null;
  }
};

// Get cached top tracks filtered by time range
export const getCachedTopTracksByTimeRange = (timeRange) => {
  try {
    const unifiedTracks = getCachedTopTracks();
    if (!unifiedTracks) return null;
    
    // Filter tracks that have rankings for the specified time range
    return unifiedTracks
      .filter(track => track.rankings[timeRange] !== null)
      .sort((a, b) => a.rankings[timeRange] - b.rankings[timeRange]);
  } catch (error) {
    console.error('Error getting cached top tracks by time range:', error);
    return null;
  }
};



// Find artist's own ranking in top artists cache
export const findArtistRankings = (artistId, artistName) => {
  try {
    // Get the cached top artists data from sessionStorage
    const topArtistsData = sessionStorage.getItem('spotify_top_artists');
    if (!topArtistsData) return null;
    
    const topArtists = JSON.parse(topArtistsData);
    if (!topArtists.artists || !Array.isArray(topArtists.artists)) return null;
    
    // Find the artist in the merged cache
    const artist = topArtists.artists.find(a => {
      if (artistId && a.id === artistId) return true;
      if (artistName && a.name && a.name.toLowerCase() === artistName.toLowerCase()) return true;
      return false;
    });
    
    if (!artist) return null;
    
    // Use the rankings that are already merged in the cache
    const rankings = artist.rankings || {
      '4_weeks': null,
      '6_months': null,
      '12_months': null
    };
    
    return {
      artist: artist,
      rankings: rankings,
      source: 'cache',
      // Include all the rich artist data
      artistInfo: {
        id: artist.id,
        name: artist.name,
        images: artist.images,
        followers: artist.followers,
        popularity: artist.popularity,
        genres: artist.genres,
        external_urls: artist.external_urls,
        uri: artist.uri
      }
    };
  } catch (error) {
    console.error('Error finding artist rankings:', error);
    return null;
  }
};

// Find the most listened song by a specific artist from cached data
export const findMostListenedSongByArtist = (artistId, artistName) => {
  try {
    const unifiedTracks = getCachedTopTracks();
    if (!unifiedTracks) return null;
    
    // Find all tracks by this artist
    const artistTracks = unifiedTracks.filter(track => {
      if (!track.artists || !Array.isArray(track.artists)) return false;
      
      return track.artists.some(artist => {
        // Match by Spotify ID (preferred) or by name
        if (artistId && artist.id === artistId) return true;
        if (artistName && artist.name && artist.name.toLowerCase() === artistName.toLowerCase()) return true;
        return false;
      });
    });
    
    if (artistTracks.length === 0) return null;
    
    // Find the track with the best overall ranking
    let bestTrack = artistTracks[0];
    let bestRank = Infinity;
    let bestTimeRange = null;
    
    for (const track of artistTracks) {
      const rankings = track.rankings;
      
      // Check each time range and find the best ranking
      if (rankings['6_months'] && rankings['6_months'] < bestRank) {
        bestRank = rankings['6_months'];
        bestTrack = track;
        bestTimeRange = 'medium_term';
      }
      if (rankings['12_months'] && rankings['12_months'] < bestRank) {
        bestRank = rankings['12_months'];
        bestTrack = track;
        bestTimeRange = 'long_term';
      }
      if (rankings['4_weeks'] && rankings['4_weeks'] < bestRank) {
        bestRank = rankings['4_weeks'];
        bestTrack = track;
        bestTimeRange = 'short_term';
      }
    }
    
    if (bestRank === Infinity) return null;
    
    // Return the track with best ranking and ranking info
    return { 
      track: bestTrack, 
      timeRange: bestTimeRange, 
      source: 'cache',
      ranking: bestRank,
      allRankings: bestTrack.rankings,
      // Add some additional info for display
      displayInfo: {
        songName: bestTrack.name,
        artistName: bestTrack.artists?.[0]?.name || 'Unknown Artist',
        albumName: bestTrack.album?.name || 'Unknown Album',
        albumImage: bestTrack.album?.images?.[0]?.url || null
      }
    };
  } catch (error) {
    console.error('Error finding most listened song by artist:', error);
    return null;
  }
};

// Clear all cached data
export const clearTopDataCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Top data cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Get cache statistics
export const getCacheStats = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    const age = timestamp ? Date.now() - parseInt(timestamp) : null;
    
    // Calculate cache size
    let totalSize = 0;
    let trackCount = 0;
    
    const unifiedTracksData = localStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    if (unifiedTracksData) {
      totalSize += new Blob([unifiedTracksData]).size;
      const parsed = JSON.parse(unifiedTracksData);
      trackCount = parsed.length;
    }
    
    return {
      hasCache: isCacheValid(),
      isComplete: hasCompleteCache(),
      age: age ? Math.round(age / (1000 * 60)) : null, // age in minutes
      version: null, // Removed version as it's always "1.0"
      size: Math.round(totalSize / 1024), // size in KB
      trackCount
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { hasCache: false, isComplete: false, age: null, version: null, size: 0, trackCount: 0 };
  }
};
