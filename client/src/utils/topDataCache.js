// Cache keys for sessionStorage
import { getApiBaseUrl } from '../config/api';

const CACHE_KEYS = {
  UNIFIED_TOP_TRACKS: 'unified_top_tracks',
  CACHE_TIMESTAMP: 'top_data_cache_timestamp'
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
  const trackNameMap = new Map(); // Use Map to avoid duplicates by name + artist
  
  console.log('🔄 Building unified tracks...');
  console.log(`4 weeks tracks: ${tracks4Weeks?.length || 0}`);
  console.log(`6 months tracks: ${tracks6Months?.length || 0}`);
  console.log(`12 months tracks: ${tracks12Months?.length || 0}`);
  
  // Helper function to create a unique key for a track
  const getTrackKey = (track) => {
    const artistNames = track.artists?.map(a => a.name.toLowerCase().trim()) || [];
    return `${track.name.toLowerCase().trim()}-${artistNames.sort().join(',')}`;
  };
  
  // Enhanced helper function to create a unique key based on duration and main artist
  const getEnhancedTrackKey = (track) => {
    const duration = track.duration_ms;
    const mainArtist = track.artists?.[0]?.name?.toLowerCase().trim() || '';
    const normalizedName = track.name.toLowerCase().trim()
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/\[.*?\]/g, '') // Remove bracket content
      .replace(/feat\.?/gi, '') // Remove "feat." variations
      .replace(/ft\.?/gi, '') // Remove "ft." variations
      .replace(/featuring/gi, '') // Remove "featuring"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return `${duration}-${mainArtist}-${normalizedName}`;
  };
  
  // Helper function to check if tracks are likely the same
  const areTracksSimilar = (track1, track2) => {
    // Check duration (should be very close)
    const durationDiff = Math.abs(track1.duration_ms - track2.duration_ms);
    if (durationDiff > 1000) return false; // More than 1 second difference
    
    // Check main artist
    const artist1 = track1.artists?.[0]?.name?.toLowerCase().trim() || '';
    const artist2 = track2.artists?.[0]?.name?.toLowerCase().trim() || '';
    if (artist1 !== artist2) return false;
    
    // Check normalized names
    const normalizeName = (name) => name.toLowerCase().trim()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/feat\.?/gi, '')
      .replace(/ft\.?/gi, '')
      .replace(/featuring/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const name1 = normalizeName(track1.name);
    const name2 = normalizeName(track2.name);
    
    // Check for exact match or very similar names
    if (name1 === name2) return true;
    
    // Check for slight variations (e.g., "Blinding Lights" vs "Blinding Lights (Single)")
    const similarity = calculateSimilarity(name1, name2);
    return similarity > 0.8; // 80% similarity threshold
  };
  
  // Simple string similarity function
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };
  
  // Levenshtein distance for string similarity
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };
  
  // Helper function to merge track data
  const mergeTrackData = (existing, newTrack, timePeriod, ranking) => {
    existing.rankings[timePeriod] = ranking;
    
    // Keep the best metadata (prefer the one with more info)
    if (newTrack.release_date && !existing.release_date) {
      existing.release_date = newTrack.release_date;
    }
    if (newTrack.popularity !== null && newTrack.popularity !== undefined && 
        (existing.popularity === null || existing.popularity === undefined || newTrack.popularity > existing.popularity)) {
      existing.popularity = newTrack.popularity;
    }
    if (newTrack.album && !existing.album) {
      existing.album = {
        id: newTrack.album.id,
        name: newTrack.album.name,
        images: newTrack.album.images || [],
        release_date: newTrack.album.release_date || null
      };
    }
    
    // Keep the track ID that appears first (usually the more popular version)
    if (!existing.id) {
      existing.id = newTrack.id;
    }
  };
  
  console.log('🔄 Building unified tracks...');
  console.log(`4 weeks tracks: ${tracks4Weeks?.length || 0}`);
  console.log(`6 months tracks: ${tracks6Months?.length || 0}`);
  console.log(`12 months tracks: ${tracks12Months?.length || 0}`);
  
  // Process 4 weeks tracks
  if (Array.isArray(tracks4Weeks)) {
    tracks4Weeks.forEach((track, index) => {
      if (track && track.id) {
        const trackKey = getTrackKey(track);
        const enhancedKey = getEnhancedTrackKey(track);
        
        // Try to find existing track using enhanced key first
        let existingTrack = null;
        let existingKey = null;
        
        // Check if we have a track with similar duration and main artist
        for (const [key, existing] of trackNameMap.entries()) {
          if (areTracksSimilar(track, existing)) {
            existingTrack = existing;
            existingKey = key;
            break;
          }
        }
        
        if (existingTrack) {
          // Merge with existing track
          console.log(`🔄 Merging similar tracks: "${track.name}" (${track.duration_ms}ms) by ${track.artists.map(a => a.name).join(', ')} with "${existingTrack.name}" (${existingTrack.duration_ms}ms)`);
          mergeTrackData(existingTrack, track, '4_weeks', index + 1);
        } else {
          // Create new track
          const newTrack = {
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
            duration_ms: track.duration_ms || null,
            rankings: {
              '4_weeks': index + 1,
              '6_months': null,
              '12_months': null
            }
          };
          
          trackNameMap.set(enhancedKey, newTrack);
          unifiedTracks.set(track.id, newTrack);
        }
      }
    });
  }
  
  console.log(`After 4 weeks processing: ${trackNameMap.size} unique tracks`);
  
  // Process 6 months tracks
  if (Array.isArray(tracks6Months)) {
    tracks6Months.forEach((track, index) => {
      if (track && track.id) {
        const trackKey = getTrackKey(track);
        const enhancedKey = getEnhancedTrackKey(track);
        
        // Try to find existing track using enhanced key first
        let existingTrack = null;
        let existingKey = null;
        
        // Check if we have a track with similar duration and main artist
        for (const [key, existing] of trackNameMap.entries()) {
          if (areTracksSimilar(track, existing)) {
            existingTrack = existing;
            existingKey = key;
            break;
          }
        }
        
        if (existingTrack) {
          // Merge with existing track
          console.log(`🔄 Merging similar tracks: "${track.name}" (${track.duration_ms}ms) by ${track.artists.map(a => a.name).join(', ')} with "${existingTrack.name}" (${existingTrack.duration_ms}ms)`);
          mergeTrackData(existingTrack, track, '6_months', index + 1);
        } else {
          // Create new track
          const newTrack = {
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
            duration_ms: track.duration_ms || null,
            rankings: {
              '4_weeks': null,
              '6_months': index + 1,
              '12_months': null
            }
          };
          
          trackNameMap.set(enhancedKey, newTrack);
          unifiedTracks.set(track.id, newTrack);
        }
      }
    });
  }
  
  console.log(`After 6 months processing: ${trackNameMap.size} unique tracks`);
  
  // Process 12 months tracks
  if (Array.isArray(tracks12Months)) {
    tracks12Months.forEach((track, index) => {
      if (track && track.id) {
        const trackKey = getTrackKey(track);
        const enhancedKey = getEnhancedTrackKey(track);
        
        // Try to find existing track using enhanced key first
        let existingTrack = null;
        let existingKey = null;
        
        // Check if we have a track with similar duration and main artist
        for (const [key, existing] of trackNameMap.entries()) {
          if (areTracksSimilar(track, existing)) {
            existingTrack = existing;
            existingKey = key;
            break;
          }
        }
        
        if (existingTrack) {
          // Merge with existing track
          console.log(`🔄 Merging similar tracks: "${track.name}" (${track.duration_ms}ms) by ${track.artists.map(a => a.name).join(', ')} with "${existingTrack.name}" (${existingTrack.duration_ms}ms)`);
          mergeTrackData(existingTrack, track, '12_months', index + 1);
        } else {
          // Create new track
          const newTrack = {
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
            duration_ms: track.duration_ms || null,
            rankings: {
              '4_weeks': null,
              '6_months': null,
              '12_months': index + 1
            }
          };
          
          trackNameMap.set(enhancedKey, newTrack);
          unifiedTracks.set(track.id, newTrack);
        }
      }
    });
  }
  
  console.log(`After 12 months processing: ${trackNameMap.size} unique tracks`);
  
  // Convert Map to array and sort by best overall ranking
  const result = Array.from(trackNameMap.values()).sort((a, b) => {
    // Get best ranking for each track (lower number = better ranking)
    const aBestRank = Math.min(...Object.values(a.rankings).filter(rank => rank !== null));
    const bBestRank = Math.min(...Object.values(b.rankings).filter(rank => rank !== null));
    
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
  
  console.log(`Final result: ${result.length} tracks`);
  console.log('Sample tracks with rankings:', result.slice(0, 3).map(t => ({
    name: t.name,
    rankings: t.rankings
  })));
  
  // Check for potential duplicates by name and artist
  const trackNames = new Map();
  result.forEach(track => {
    const key = `${track.name}-${track.artists.map(a => a.name).join(',')}`;
    if (trackNames.has(key)) {
      console.warn(`⚠️ Potential duplicate found: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`);
      console.warn(`  Existing: ${JSON.stringify(trackNames.get(key))}`);
      console.warn(`  Current: ${JSON.stringify(track)}`);
    } else {
      trackNames.set(key, track);
    }
  });
  
  return result;
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
    sessionStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    
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
      sessionStorage.removeItem(key);
    });
    console.log('🗑️ Top data cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Get cache statistics
export const getCacheStats = () => {
  try {
    const timestamp = sessionStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    const age = timestamp ? Date.now() - parseInt(timestamp) : null;
    
    // Calculate cache size
    let totalSize = 0;
    let trackCount = 0;
    
    const unifiedTracksData = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
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
