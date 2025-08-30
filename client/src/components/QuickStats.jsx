import React, { useState, useEffect, useCallback } from 'react';
import { getCachedTopTracks, isCacheValid, hasCompleteCache } from '../utils/topDataCache';
import { getCachedTopArtists, calculateAveragePopularity } from '../utils/topArtistsCache';

/**
 * QuickStats Component with Secure Caching Strategy
 * 
 * SECURITY IMPLEMENTATION:
 * - Uses sessionStorage for non-sensitive user data (genres, styles)
 * - No OAuth tokens stored client-side (server handles all authentication)
 * - Cache automatically expires when browser tab closes
 * - No sensitive authentication data stored in client-side storage
 * 
 * CURRENT SECURITY STATUS:
 * ✅  No OAuth tokens stored client-side (secure against XSS)
 * ✅  QuickStats cache uses sessionStorage (secure for non-sensitive data)
 * 🔄  Cache automatically clears when user logs out or session expires
 * 🔒  Pure session-based authentication (server-side)
 * 
 * AUTHENTICATION APPROACH:
 * - Server maintains Spotify OAuth session
 * - Client only stores non-sensitive user data
 * - All API calls include credentials for session validation
 * - No token management on client side
 * 
 * This provides maximum security with minimal client-side complexity.
 */
// Cache for QuickStats data - expires with session
// This cache stores genres and styles for top artists
// Cache key is based on artist names and rankings
// Cache automatically expires when tab is closed or component unmounts
// Can be manually cleared when token expires using window.clearQuickStatsCache()
const CACHE_KEY = 'quickStatsCache';

// Helper functions for sessionStorage cache management
const getCacheFromStorage = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading QuickStats cache from sessionStorage:', error);
    return {};
  }
};

const setCacheToStorage = (cacheData) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing QuickStats cache to sessionStorage:', error);
  }
};

const clearCacheFromStorage = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing QuickStats cache from sessionStorage:', error);
  }
};

// 🚀 NEW: Comprehensive cache for all calculated results
const COMPREHENSIVE_CACHE_KEY = 'quickStatsComprehensiveCache';

const getComprehensiveCacheFromStorage = () => {
  try {
    const cached = sessionStorage.getItem(COMPREHENSIVE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading comprehensive QuickStats cache from sessionStorage:', error);
    return {};
  }
};

const setComprehensiveCacheToStorage = (cacheData) => {
  try {
    sessionStorage.setItem(COMPREHENSIVE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing comprehensive QuickStats cache to sessionStorage:', error);
  }
};

const clearComprehensiveCacheFromStorage = () => {
  try {
    sessionStorage.removeItem(COMPREHENSIVE_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing comprehensive QuickStats cache from sessionStorage:', error);
  }
};

// Check if session has changed (indicating new login or token refresh)
const hasSessionChanged = () => {
  // We no longer check localStorage for tokens
  // Instead, we'll use a session-based approach
  const currentSession = sessionStorage.getItem('current_session_id');
  const lastSession = sessionStorage.getItem('last_session_id');
  
  if (lastSession !== currentSession) {
    sessionStorage.setItem('last_session_id', currentSession);
    return true;
  }
  return false;
};

export default function QuickStats({ isMobile }) {
  const [topArtist, setTopArtist] = useState(null);
  const [topSong, setTopSong] = useState(null);
  const [topGenres, setTopGenres] = useState([]);
  const [topStyles, setTopStyles] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [topDecades, setTopDecades] = useState([]);
  const [averagePopularity, setAveragePopularity] = useState(null);
  const [yearAnalysis, setYearAnalysis] = useState(null);
  const [trackPopularityAnalysis, setTrackPopularityAnalysis] = useState(null);
  const [listeningEvolution, setListeningEvolution] = useState(null);
  const [timeOfDayAnalysis, setTimeOfDayAnalysis] = useState(null);
  const [listenerTypeAnalysis, setListenerTypeAnalysis] = useState(null);
  const [topArtistTimeRange, setTopArtistTimeRange] = useState(null);
  const [topSongTimeRange, setTopSongTimeRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoadedDiscogs, setHasLoadedDiscogs] = useState(false);
  
  // 🚀 Progressive loading states - track what's ready
  const [loadingStates, setLoadingStates] = useState({
    basicStats: false,      // Top artist/song
    genresStyles: false,    // Genres and styles
    albumsDecades: false,   // Top albums and decades
    popularity: false,      // Average popularity
    yearAnalysis: false,    // Year analysis
    trackPopularity: false, // Track popularity
    listeningEvolution: false, // Listening evolution
    timeOfDay: false,      // Time of day
    listenerType: false    // Listener type
  });

  // Generate cache key based on top 3 artists (since that's what we fetch)
  const generateCacheKey = useCallback((top3Artists) => {
    if (!top3Artists || top3Artists.length === 0) return null;
    
    // Create a stable key based on artist names and rankings
    // Sort by ranking to ensure consistent key regardless of order
    const artistKey = top3Artists
      .sort((a, b) => a.rankings['12_months'] - b.rankings['12_months'])
      .map(artist => `${artist.name}_${artist.rankings['12_months']}`)
      .join('|');
    
    return `quickstats_${artistKey}`;
  }, []);

  // Check if we have cached data for the current top 3 artists
  const getCachedQuickStats = useCallback((top3Artists) => {
    const cacheKey = generateCacheKey(top3Artists);
    if (!cacheKey) return null;
    
    const cached = getCacheFromStorage()[cacheKey];
    return cached;
  }, [generateCacheKey]);

  // Store data in cache
  const setCachedQuickStats = useCallback((top3Artists, genres, styles) => {
    const cacheKey = generateCacheKey(top3Artists);
    if (!cacheKey) return;
    
    const currentCache = getCacheFromStorage();
    currentCache[cacheKey] = { genres, styles };
    setCacheToStorage(currentCache);
  }, [generateCacheKey]);

  // 🚀 NEW: Generate comprehensive cache key based on all data sources
  const generateComprehensiveCacheKey = useCallback((topArtists, topTracks) => {
    if (!topArtists || !topTracks) return null;
    
    // 🚀 SIMPLIFIED: Use user ID and data hash for reliable caching
    const userHash = topArtists.length + '_' + topTracks.length;
    const dataHash = topArtists.length + '_' + topTracks.length + '_' + 
                    (topArtists[0]?.name || '') + '_' + 
                    (topTracks[0]?.name || '');
    
    return `quickstats_${userHash}_${dataHash}`;
  }, []);

  // 🚀 NEW: Check if we have comprehensive cached data
  const getCachedComprehensiveStats = useCallback((topArtists, topTracks) => {
    const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
    if (!cacheKey) return null;
    
    const cached = getComprehensiveCacheFromStorage()[cacheKey];
    return cached;
  }, [generateComprehensiveCacheKey]);

  // 🚀 NEW: Store comprehensive data in cache
  const setCachedComprehensiveStats = useCallback((topArtists, topTracks, comprehensiveData) => {
    const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
    if (!cacheKey) return;
    
    const currentCache = getComprehensiveCacheFromStorage();
    currentCache[cacheKey] = {
      ...comprehensiveData,
      timestamp: Date.now(),
      cacheKey
    };
    setComprehensiveCacheToStorage(currentCache);
  }, [generateComprehensiveCacheKey]);

  // 🚀 NEW: Individual section cache functions
  const getCachedSection = useCallback((sectionName, topArtists, topTracks) => {
    const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
    if (!cacheKey) return null;
    
    const cached = getComprehensiveCacheFromStorage()[cacheKey];
    return cached?.[sectionName] || null;
  }, [generateComprehensiveCacheKey]);

  const setCachedSection = useCallback((sectionName, data, topArtists, topTracks) => {
    const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
    if (!cacheKey) return;
    
    const currentCache = getComprehensiveCacheFromStorage();
    if (!currentCache[cacheKey]) {
      currentCache[cacheKey] = { timestamp: Date.now() };
    }
    currentCache[cacheKey][sectionName] = data;
    setComprehensiveCacheToStorage(currentCache);
  }, [generateComprehensiveCacheKey]);

  // Clear cache when token expires (this will be called from parent component)
  const clearQuickStatsCache = useCallback(() => {
    clearCacheFromStorage();
    clearComprehensiveCacheFromStorage(); // 🚀 NEW: Also clear comprehensive cache
  }, []);

  // Expose clear function to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.clearQuickStatsCache = clearQuickStatsCache;
      // Also expose cache info for debugging
      window.getQuickStatsCacheInfo = () => {
        const cache = getCacheFromStorage();
        return {
          size: Object.keys(cache).length,
          keys: Object.keys(cache),
          cacheData: cache,
          localStorageKey: CACHE_KEY
        };
      };
      
      // Cache initialized silently
    }
  }, [clearQuickStatsCache]);

  // Clear cache when component unmounts (cleanup)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        delete window.clearQuickStatsCache;
        delete window.getQuickStatsCacheInfo;
      }
    };
  }, []);

  // Check for token changes and clear cache if needed
  useEffect(() => {
    if (hasSessionChanged()) {
      clearQuickStatsCache();
      clearComprehensiveCacheFromStorage(); // 🚀 NEW: Also clear comprehensive cache
    }
  }, []);

  // 🚀 OPTIMIZED ANALYSIS FUNCTIONS - Accept data as parameters instead of fetching
  const analyzeListeningEvolution = async (tracks, recentTracks) => {
    const evolution = {
      newSongs: [],
      newArtists: [],
      breakSongs: [],
      breakArtists: []
    };

    try {
      // Create sets for easy comparison
      const recentSongIds = new Set(recentTracks.map(track => track.id));
      const recentArtistIds = new Set();
      recentTracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => recentArtistIds.add(artist.id));
        }
      });

      // Get 4 weeks tracks (last month)
      const fourWeeksTracks = tracks.filter(track => track.rankings && track.rankings['4_weeks']);
      const fourWeeksSongIds = new Set(fourWeeksTracks.map(track => track.id));
      const fourWeeksArtistIds = new Set();
      fourWeeksTracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => fourWeeksArtistIds.add(artist.id));
        }
      });

      // Get 6-12 months tracks (longer term)
      const longTermTracks = tracks.filter(track => 
        (track.rankings && track.rankings['6_months']) || 
        (track.rankings && track.rankings['12_months'])
      );
      const longTermSongIds = new Set(longTermTracks.map(track => track.id));
      const longTermArtistIds = new Set();
      longTermTracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => longTermArtistIds.add(artist.id));
        }
      });

      // Find newly discovered songs (in recent + 4 weeks but not in 6-12 months)
      const recentAndFourWeeksSongIds = new Set([...recentSongIds, ...fourWeeksSongIds]);
      tracks.forEach(track => {
        if (recentAndFourWeeksSongIds.has(track.id) && !longTermSongIds.has(track.id)) {
          evolution.newSongs.push({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            rankings: track.rankings
          });
        }
      });

      // Find songs taking a break (in 6-12 months but not in recent + 4 weeks)
      const allRecentSongIds = new Set([...recentSongIds, ...fourWeeksSongIds]);
      longTermTracks.forEach(track => {
        if (!allRecentSongIds.has(track.id)) {
          evolution.breakSongs.push({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            rankings: track.rankings
          });
        }
      });

      // Find newly discovered artists (in recent + 4 weeks but not in 6-12 months)
      const recentAndFourWeeksArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
      tracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => {
            if (recentAndFourWeeksArtistIds.has(artist.id) && !longTermArtistIds.has(artist.id)) {
              const existingArtist = evolution.newArtists.find(a => a.id === artist.id);
              if (!existingArtist) {
                evolution.newArtists.push({
                  id: artist.id,
                  name: artist.name,
                  trackCount: 1
                });
              } else {
                existingArtist.trackCount++;
              }
            }
          });
        }
      });

      // Find artists taking a break (in 6-12 months but not in recent + 4 weeks)
      const allRecentArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
      longTermTracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => {
            if (!allRecentArtistIds.has(artist.id)) {
              const existingArtist = evolution.breakArtists.find(a => a.id === artist.id);
              if (!existingArtist) {
                evolution.breakArtists.push({
                  id: artist.id,
                  name: artist.name,
                  trackCount: 1
                });
              } else {
                existingArtist.trackCount++;
              }
            }
          });
        }
      });

      // Sort by track count for artists
      evolution.newArtists.sort((a, b) => b.trackCount - a.trackCount);
      evolution.breakArtists.sort((a, b) => b.trackCount - a.trackCount);
    } catch (error) {
      console.error('Error analyzing listening evolution:', error);
    }

    return evolution;
  };

  const analyzeTimeOfDay = async (recentTracks) => {
    const timeSlots = {
      '8-12 AM': { start: 8, end: 12, count: 0, songs: [] },        // 8:00 - 12:00
      '12-4 PM': { start: 12, end: 16, count: 0, songs: [] },       // 12:00 - 16:00
      '4-8 PM': { start: 16, end: 20, count: 0, songs: [] },        // 16:00 - 20:00
      '8-12 PM': { start: 20, end: 24, count: 0, songs: [] },       // 20:00 - 24:00
      '12-8 AM': { start: 0, end: 8, count: 0, songs: [] },         // 0:00 - 8:00
    };

    try {
      // Process each track
      recentTracks.forEach(track => {
        if (track.played_at) {
          // Convert to UTC+2 (assuming user is in UTC+2 timezone)
          const playedAt = new Date(track.played_at);
          const utcPlus2 = new Date(playedAt.getTime() + (2 * 60 * 60 * 1000)); // UTC+2
          const hour = utcPlus2.getUTCHours();
          
          // Find which time slot this hour belongs to
          let slotFound = false;
          Object.keys(timeSlots).forEach(slotName => {
            const slot = timeSlots[slotName];
            if (slot.start <= slot.end) {
              // Normal case: start < end (e.g., 9-12)
              if (hour >= slot.start && hour < slot.end) {
                slot.count++;
                slot.songs.push({
                  name: track.name,
                  artists: track.artists,
                  played_at: utcPlus2,
                  hour: hour
                });
                slotFound = true;
              }
            } else {
              // Wrapping case: start > end (e.g., 21-5 for night)
              if (hour >= slot.start || hour < slot.end) {
                slot.count++;
                slot.songs.push({
                  name: track.name,
                  artists: track.artists,
                  played_at: utcPlus2,
                  hour: hour
                });
                slotFound = true;
              }
            }
          });
        }
      });

      // Find the most active time slot
      let mostActiveSlot = null;
      let maxCount = 0;
      Object.keys(timeSlots).forEach(slotName => {
        if (timeSlots[slotName].count > maxCount) {
          maxCount = timeSlots[slotName].count;
          mostActiveSlot = slotName;
        }
      });

      return {
        timeSlots,
        mostActiveSlot,
        totalSongs: recentTracks.length,
        analyzedSongs: Object.values(timeSlots).reduce((sum, slot) => sum + slot.count, 0)
      };
    } catch (error) {
      console.error('Error analyzing time of day:', error);
    }

    return null;
  };

  const analyzeListenerType = async (recentTracks) => {
    const analysis = {
      type: null,
      confidence: 0,
      topArtist: null,
      artistDiversity: 0,
      superfanMetrics: {},
      explorerMetrics: {}
    };

    try {
      // Count unique artists in recent tracks
      const artistCounts = {};
      recentTracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => {
            artistCounts[artist.id] = {
              id: artist.id,
              name: artist.name,
              count: (artistCounts[artist.id]?.count || 0) + 1
            };
          });
        }
      });

      // Calculate diversity metrics
      const uniqueArtists = Object.keys(artistCounts).length;
      const totalSongs = recentTracks.length;
      const artistDiversity = uniqueArtists / totalSongs; // Higher = more diverse

      // Find top artist in recent tracks
      const sortedArtists = Object.values(artistCounts).sort((a, b) => b.count - a.count);
      const topRecentArtist = sortedArtists[0];
      const topArtistPercentage = (topRecentArtist.count / totalSongs) * 100;

      // Get top artists from cache for comparison
      const topArtists = getCachedTopArtists();
      const topArtistFromCache = topArtists && topArtists.length > 0 ? topArtists[0] : null;

      // Superfan indicators
      const superfanIndicators = {
        highTopArtistPercentage: topArtistPercentage > 30, // More than 30% from one artist
        lowDiversity: artistDiversity < 0.3, // Less than 30% unique artists
        consistentTopArtist: topRecentArtist && topArtistFromCache && 
                            topRecentArtist.id === topArtistFromCache.id,
        artistConcentration: topArtistPercentage
      };

      // Explorer indicators
      const explorerIndicators = {
        lowTopArtistPercentage: topArtistPercentage < 15, // Less than 15% from one artist
        highDiversity: artistDiversity > 0.6, // More than 60% unique artists
        manyUniqueArtists: uniqueArtists > 20, // More than 20 unique artists
        artistDiversity: artistDiversity
      };

      // Calculate superfan score
      let superfanScore = 0;
      if (superfanIndicators.highTopArtistPercentage) superfanScore += 30;
      if (superfanIndicators.lowDiversity) superfanScore += 25;
      if (superfanIndicators.consistentTopArtist) superfanScore += 25;
      superfanScore += Math.min(superfanIndicators.artistConcentration / 2, 20);

      // Calculate explorer score
      let explorerScore = 0;
      if (explorerIndicators.lowTopArtistPercentage) explorerScore += 30;
      if (explorerIndicators.highDiversity) explorerScore += 25;
      if (explorerIndicators.manyUniqueArtists) explorerScore += 25;
      explorerScore += Math.min(explorerIndicators.artistDiversity * 50, 20);

      // Determine listener type
      if (superfanScore > explorerScore && superfanScore > 50) {
        analysis.type = 'Superfan';
        analysis.confidence = Math.min(superfanScore, 100);
        analysis.topArtist = topRecentArtist;
        analysis.artistDiversity = artistDiversity;
        analysis.superfanMetrics = {
          topArtistPercentage: topArtistPercentage,
          uniqueArtists: uniqueArtists,
          totalSongs: totalSongs,
          score: superfanScore
        };
      } else if (explorerScore > superfanScore && explorerScore > 50) {
        analysis.type = 'Artist Explorer';
        analysis.confidence = Math.min(explorerScore, 100);
        analysis.topArtist = topRecentArtist;
        analysis.artistDiversity = artistDiversity;
        analysis.explorerMetrics = {
          topArtistPercentage: topArtistPercentage,
          uniqueArtists: uniqueArtists,
          totalSongs: totalSongs,
          score: explorerScore
        };
      } else {
        analysis.type = 'Balanced Listener';
        analysis.confidence = Math.max(superfanScore, explorerScore);
        analysis.topArtist = topRecentArtist;
        analysis.artistDiversity = artistDiversity;
      }

      // Add all artists for display
      analysis.allArtists = sortedArtists;
    } catch (error) {
      console.error('Error analyzing listener type:', error);
    }

    return analysis;
  };

    const loadQuickStats = useCallback(async () => {
    if (!isCacheValid() || !hasCompleteCache()) {
      return;
    }

    try {
      // Get top artists from cache
      const topArtists = getCachedTopArtists();
      const topTracks = getCachedTopTracks();
      
      // 🚀 NEW: Check partial cache for each section
      const checkAndSetCachedSection = (sectionName, setter, loadingStateKey) => {
        const cached = getCachedSection(sectionName, topArtists, topTracks);
        if (cached) {
          setter(cached);
          setLoadingStates(prev => ({ ...prev, [loadingStateKey]: true }));
          return true; // Cache hit
        }
        return false; // Cache miss
      };
      
      if (topArtists && topArtists.length > 0) {
        // 🚀 Check cache for basic stats first
        const cachedBasicStats = checkAndSetCachedSection('basicStats', (data) => {
          setTopArtist(data.bestArtist);
          setTopArtistTimeRange(data.bestTimeRange);
        }, 'basicStats');
        
        if (!cachedBasicStats) {
          // Calculate basic stats
          let bestArtist = topArtists[0];
          let bestRank = Infinity;
          let bestTimeRange = null;

          topArtists.forEach(artist => {
            const rankings = artist.rankings || {};
            
            // Priority 1: 12 months (last year) - highest priority
            if (rankings['12_months'] && rankings['12_months'] < bestRank) {
              bestRank = rankings['12_months'];
              bestArtist = artist;
              bestTimeRange = '12_months';
            }
          });

          // If no 12 months data, fall back to 6 months
          if (bestTimeRange !== '12_months') {
            topArtists.forEach(artist => {
              const rankings = artist.rankings || {};
              if (rankings['6_months'] && rankings['6_months'] < bestRank) {
                bestRank = rankings['6_months'];
                bestArtist = artist;
                bestTimeRange = '6_months';
              }
            });
          }

          // If still no data, fall back to 4 weeks
          if (bestTimeRange === null) {
            topArtists.forEach(artist => {
              const rankings = artist.rankings || {};
              if (rankings['4_weeks'] && rankings['4_weeks'] < bestRank) {
                bestRank = rankings['4_weeks'];
                bestArtist = artist;
                bestTimeRange = '4_weeks';
              }
            });
          }

          setTopArtist(bestArtist);
          setTopArtistTimeRange(bestTimeRange);

          // 🚀 Mark basic stats as ready
          setLoadingStates(prev => ({ ...prev, basicStats: true }));
          
          // 🚀 Cache basic stats
          setCachedSection('basicStats', { bestArtist, bestTimeRange }, topArtists, topTracks);
        }

        // Get top 3 artists ranked by 12_months from spotify_top_artists
        const top3Artists = topArtists
          .filter(artist => artist.rankings && artist.rankings['12_months'])
          .sort((a, b) => a.rankings['12_months'] - b.rankings['12_months'])
          .slice(0, 3);

        if (top3Artists.length > 0) {
          
          // Check cache first
          const cached = getCachedQuickStats(top3Artists);
          if (cached) {
            setTopGenres(cached.genres);
            setTopStyles(cached.styles);
            setHasLoadedDiscogs(true);
          } else {
            // Only fetch Discogs data if we haven't already
            if (!hasLoadedDiscogs) {
              // Make individual Discogs API calls for each artist
              const discogsPromises = top3Artists.map(async (artist, index) => {
                try {
                  const artistName = artist.name;
                  const apiUrl = `http://127.0.0.1:8000/discogs/artist/${encodeURIComponent(artistName)}/genre-style-map`;
                  
                  const response = await fetch(apiUrl);
                  
                  if (response.ok) {
                    const data = await response.json();
                    
                    // Extract genres and styles from the genre-style map
                    const allGenres = new Set();
                    const allStyles = new Set();
                    
                    if (data.map && typeof data.map === 'object') {
                      Object.values(data.map).forEach(albumData => {
                        if (Array.isArray(albumData) && albumData[0]) {
                          // albumData[0] contains genres array
                          albumData[0].forEach(genre => allGenres.add(genre));
                        }
                        if (Array.isArray(albumData) && albumData[1]) {
                          // albumData[1] contains styles array
                          albumData[1].forEach(style => allStyles.add(style));
                        }
                      });
                    }
                    
                    return {
                      name: artistName,
                      rank: artist.rankings['12_months'],
                      genres: Array.from(allGenres),
                      styles: Array.from(allStyles)
                    };
                  } else {
                    const errorText = await response.text();
                    console.error(`[${index + 1}/3] Failed to fetch Discogs data for "${artistName}":`, response.status, errorText);
                    return null;
                  }
                } catch (err) {
                  console.error(`[${index + 1}/3] Network error for "${artist.name}":`, err);
                  return null;
                }
              });

              const discogsResults = await Promise.all(discogsPromises);
              
              const validResults = discogsResults.filter(result => result !== null);

              if (validResults.length > 0) {
                // Calculate most common genres
                const genreCounts = {};
                validResults.forEach(result => {
                  result.genres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                  });
                });

                const sortedGenres = Object.entries(genreCounts)
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count)
                  .filter(genre => genre.count >= 2); // Only show genres with 2+ artists

                setTopGenres(sortedGenres);

                // Calculate most common styles
                const styleCounts = {};
                validResults.forEach(result => {
                  result.styles.forEach(style => {
                    styleCounts[style] = (styleCounts[style] || 0) + 1;
                  });
                });

                const sortedStyles = Object.entries(styleCounts)
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count)
                  .filter(style => style.count >= 2); // Only show styles with 2+ artists
                setTopStyles(sortedStyles);

                // Cache the results
                setCachedQuickStats(top3Artists, sortedGenres, sortedStyles);
              } else {
                setTopGenres([]);
                setTopStyles([]);
              }
              
              // Mark that we've loaded Discogs data to prevent duplicate calls
              setHasLoadedDiscogs(true);
              
              // 🚀 Mark genres/styles as ready
              setLoadingStates(prev => ({ ...prev, genresStyles: true }));
            } else {
              // If cached data exists, use it
              const cached = getCachedQuickStats(top3Artists);
              if (cached) {
                setTopGenres(cached.genres);
                setTopStyles(cached.styles);
              } else {
                setTopGenres([]);
                setTopStyles([]);
              }
              
              // 🚀 Mark genres/styles as ready (cached case)
              setLoadingStates(prev => ({ ...prev, genresStyles: true }));
            }
          }
        } else {
          setTopGenres([]);
          setTopStyles([]);
          
          // 🚀 Mark genres/styles as ready (no artists case)
          setLoadingStates(prev => ({ ...prev, genresStyles: true }));
        }
      }

      // Get top tracks from cache (already declared above)
      if (topTracks && topTracks.length > 0) {
        // Find the track with the best overall ranking, prioritizing 12 months
        let bestTrack = topTracks[0];
        let bestRank = Infinity;
        let bestTimeRange = null;
        
        topTracks.forEach(track => {
          const rankings = track.rankings || {};
          
          // Priority 1: 12 months (last year) - highest priority
          if (rankings['12_months'] && rankings['12_months'] < bestRank) {
            bestRank = rankings['12_months'];
            bestTrack = track;
            bestTimeRange = '12_months';
          }
        });

        // If no 12 months data, fall back to 6 months
        if (bestTimeRange !== '12_months') {
          topTracks.forEach(track => {
            const rankings = track.rankings || {};
            if (rankings['6_months'] && rankings['6_months'] < bestRank) {
              bestRank = rankings['6_months'];
              bestTrack = track;
              bestTimeRange = '6_months';
            }
          });
        }

        // If still no data, fall back to 4 weeks
        if (bestTimeRange === null) {
          topTracks.forEach(track => {
            const rankings = track.rankings || {};
            if (rankings['4_weeks'] && rankings['4_weeks'] < bestRank) {
              bestRank = rankings['4_weeks'];
              bestTrack = track;
              bestTimeRange = '4_weeks';
            }
          });
        }

        setTopSong(bestTrack);
        setTopSongTimeRange(bestTimeRange);

        // Calculate top 3 albums from all tracks
        const calculateTopAlbums = (tracks) => {
          const albumCounts = {};
          
          tracks.forEach(track => {
            if (track.album && track.album.name) {
              const albumKey = `${track.album.name}_${track.album.id}`;
              if (!albumCounts[albumKey]) {
                albumCounts[albumKey] = {
                  name: track.album.name,
                  id: track.album.id,
                  images: track.album.images || [],
                  artist: track.artists && track.artists[0] ? track.artists[0].name : 'Unknown Artist',
                  count: 0,
                  tracks: []
                };
              }
              albumCounts[albumKey].count++;
              albumCounts[albumKey].tracks.push({
                name: track.name,
                ranking: track.rankings ? Math.min(...Object.values(track.rankings).filter(r => r !== null)) : null
              });
            }
          });
          
          // Sort by count and get top 3 albums
          const sortedAlbums = Object.values(albumCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          
          return sortedAlbums;
        };

        // Calculate top 3 decades from all tracks
        const calculateTopDecades = (tracks) => {
          const decadeCounts = {};
          
          tracks.forEach(track => {
            let trackYear = null;
            
            // Try to get release date from track
            if (track.release_date) {
              trackYear = new Date(track.release_date).getFullYear();
            }
            // Try to get release date from album
            else if (track.album && track.album.release_date) {
              trackYear = new Date(track.album.release_date).getFullYear();
            }
            
            if (trackYear && trackYear >= 1900 && trackYear <= 2030) {
              const decade = Math.floor(trackYear / 10) * 10;
              const decadeLabel = `${decade}s`;
              
              if (!decadeCounts[decadeLabel]) {
                decadeCounts[decadeLabel] = {
                  decade: decade,
                  label: decadeLabel,
                  count: 0,
                  tracks: []
                };
              }
              decadeCounts[decadeLabel].count++;
              decadeCounts[decadeLabel].tracks.push({
                name: track.name,
                artist: track.artists && track.artists[0] ? track.artists[0].name : 'Unknown Artist',
                year: trackYear,
                ranking: track.rankings ? Math.min(...Object.values(track.rankings).filter(r => r !== null)) : null
              });
            }
          });
          
          // Sort by count and get top 3 decades
          const sortedDecades = Object.values(decadeCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          
          return sortedDecades;
        };

        // Calculate top albums and decades
        const topAlbumsResult = calculateTopAlbums(topTracks);
        const topDecadesResult = calculateTopDecades(topTracks);

        setTopAlbums(topAlbumsResult);
        setTopDecades(topDecadesResult);

        // 🚀 Mark albums/decades as ready
        setLoadingStates(prev => ({ ...prev, albumsDecades: true }));

        // Calculate average popularity of top artists
        const popularityStats = calculateAveragePopularity();
        setAveragePopularity(popularityStats);

        // 🚀 Mark popularity as ready
        setLoadingStates(prev => ({ ...prev, popularity: true }));

        // Analyze publish years for different time periods
        const analyzePublishYears = (tracks) => {
          const yearData = {
            '4_weeks': { years: [], average: 0, count: 0 },
            '6_months': { years: [], average: 0, count: 0 },
            '12_months': { years: [], average: 0, count: 0 },
            'recent_50': { years: [], average: 0, count: 0 }
          };

          // Analyze tracks by time period
          tracks.forEach(track => {
            let trackYear = null;
            
            // Try to get release date from track
            if (track.release_date) {
              trackYear = new Date(track.release_date).getFullYear();
            }
            // Try to get release date from album
            else if (track.album && track.album.release_date) {
              trackYear = new Date(track.album.release_date).getFullYear();
            }
            
            if (trackYear && trackYear >= 1900 && trackYear <= 2030) {
              // Add to appropriate time periods based on rankings
              if (track.rankings) {
                if (track.rankings['4_weeks']) {
                  yearData['4_weeks'].years.push(trackYear);
                }
                if (track.rankings['6_months']) {
                  yearData['6_months'].years.push(trackYear);
                }
                if (track.rankings['12_months']) {
                  yearData['12_months'].years.push(trackYear);
                }
              }
            }
          });

          // Calculate averages for each time period
          Object.keys(yearData).forEach(period => {
            const years = yearData[period].years;
            if (years.length > 0) {
              yearData[period].average = Math.round(years.reduce((sum, year) => sum + year, 0) / years.length);
              yearData[period].count = years.length;
            }
          });

          // Get recent 50 songs (we'll need to fetch this separately)
          return yearData;
        };

        const yearAnalysisResult = analyzePublishYears(topTracks);
        setYearAnalysis(yearAnalysisResult);

        // 🚀 Mark year analysis as ready
        setLoadingStates(prev => ({ ...prev, yearAnalysis: true }));

        // Analyze track popularity for different time periods
        const analyzeTrackPopularity = (tracks) => {
          const popularityData = {
            '4_weeks': { popularities: [], average: 0, count: 0, min: 0, max: 0 },
            '6_months': { popularities: [], average: 0, count: 0, min: 0, max: 0 },
            '12_months': { popularities: [], average: 0, count: 0, min: 0, max: 0 },
            'all_tracks': { popularities: [], average: 0, count: 0, min: 0, max: 0 }
          };

          // Analyze tracks by time period
          tracks.forEach(track => {
            if (track.popularity !== null && track.popularity !== undefined && !isNaN(track.popularity)) {
              // Add to all tracks
              popularityData.all_tracks.popularities.push(track.popularity);
              
              // Add to specific time periods based on rankings
              if (track.rankings) {
                if (track.rankings['4_weeks']) {
                  popularityData['4_weeks'].popularities.push(track.popularity);
                }
                if (track.rankings['6_months']) {
                  popularityData['6_months'].popularities.push(track.popularity);
                }
                if (track.rankings['12_months']) {
                  popularityData['12_months'].popularities.push(track.popularity);
                }
              }
            }
          });

          // Calculate statistics for each time period
          Object.keys(popularityData).forEach(period => {
            const popularities = popularityData[period].popularities;
            if (popularities.length > 0) {
              popularityData[period].average = Math.round(popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length);
              popularityData[period].count = popularities.length;
              popularityData[period].min = Math.min(...popularities);
              popularityData[period].max = Math.max(...popularities);
            }
          });

          return popularityData;
        };

        const trackPopularityResult = analyzeTrackPopularity(topTracks);
        setTrackPopularityAnalysis(trackPopularityResult);

        // 🚀 Mark track popularity as ready
        setLoadingStates(prev => ({ ...prev, trackPopularity: true }));

        // 🚀 OPTIMIZATION: Fetch all external data in parallel
        const [recentTracksResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/recent-tracks')
        ]);

        let recentTracks = [];
        if (recentTracksResponse.ok) {
          const recentData = await recentTracksResponse.json();
          recentTracks = recentData.tracks || [];
        }

        // 🚀 OPTIMIZATION: Run all analyses in parallel with shared data
        const [
          listeningEvolutionResult,
          timeOfDayResult,
          listenerTypeResult
        ] = await Promise.all([
          analyzeListeningEvolution(topTracks, recentTracks),
          analyzeTimeOfDay(recentTracks),
          analyzeListenerType(recentTracks)
        ]);

        setListeningEvolution(listeningEvolutionResult);
        setTimeOfDayAnalysis(timeOfDayResult);
        setListenerTypeAnalysis(listenerTypeResult);

        // 🚀 Mark external analyses as ready
        setLoadingStates(prev => ({ 
          ...prev, 
          listeningEvolution: true,
          timeOfDay: true,
          listenerType: true
        }));

        // Update year analysis with recent tracks
        if (recentTracks.length > 0) {
          const recentYears = [];
          recentTracks.forEach(track => {
            let trackYear = null;
            
            if (track.release_date) {
              trackYear = new Date(track.release_date).getFullYear();
            } else if (track.album && track.album.release_date) {
              trackYear = new Date(track.album.release_date).getFullYear();
            }
            
            if (trackYear && trackYear >= 1900 && trackYear <= 2030) {
              recentYears.push(trackYear);
            }
          });
          
          if (recentYears.length > 0) {
            yearAnalysisResult.recent_50 = {
              years: recentYears,
              average: Math.round(recentYears.reduce((sum, year) => sum + year, 0) / recentYears.length),
              count: recentYears.length
            };
            setYearAnalysis({ ...yearAnalysisResult });
          }
        }
      }

      setLoading(false);
      
      // 🚀 NEW: Store comprehensive results in cache for next time
      const comprehensiveData = {
        topArtist,
        topArtistTimeRange,
        topSong,
        topSongTimeRange,
        topGenres,
        topStyles,
        topAlbums,
        topDecades,
        averagePopularity,
        yearAnalysis,
        trackPopularityAnalysis,
        listeningEvolution,
        timeOfDayAnalysis,
        listenerTypeAnalysis
      };
      
      setCachedComprehensiveStats(topArtists, topTracks, comprehensiveData);
      console.log('🚀 Comprehensive cache stored for next load!');
    } catch (err) {
      console.error('Error loading quick stats:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [hasLoadedDiscogs, getCachedQuickStats, setCachedQuickStats, getCachedSection, setCachedSection]); // Add new cache functions to dependency array

  useEffect(() => {
    const loadData = async () => {
      await loadQuickStats();
    };

    // Initial load
    loadData();

    // Set up polling to check for cache updates every 5 seconds (reduced from 2 seconds)
    const cacheCheckInterval = setInterval(() => {
      if (isCacheValid() && hasCompleteCache() && (!topArtist || !topSong)) {
        loadData();
      }
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(cacheCheckInterval);
    };
  }, [loadQuickStats]); // Add loadQuickStats to dependency array

  // Don't render anything if no data is available
  if (loading || !topArtist || !topSong) {
    return null;
  }

  // 🚀 Progressive loading - show cards as they become ready
  const shouldShowCard = (cardType) => {
    return loadingStates[cardType] || false;
  };

  // Show loading state while fetching Discogs data
  if (topGenres.length === 0 && topStyles.length === 0) {
    return (
      <div style={{
        padding: '32px 16px',
        margin: '32px auto',
        maxWidth: '1200px',
        width: '95%'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '0.5px'
        }}>
          Your Music Highlights
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Top Artist Card */}
          {shouldShowCard('basicStats') && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #1db954, #1ed760)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <img 
                  src="/3580649-200.png" 
                  alt="Artist Icon" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Artist
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most listened to
                </p>
              </div>
            </div>
            
            {topArtist ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {topArtist.images && topArtist.images[0] && topArtist.images[0].url ? (
                  <img
                    src={topArtist.images[0].url}
                    alt={topArtist.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #1db954, #1ed760)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '1.5rem'
                  }}>
                    {topArtist.name?.[0] || '?'}
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0'
                  }}>
                    {topArtist.name || 'Unknown Artist'}
                  </h4>
                  
                  {/* Show rankings if available */}
                  {topArtist.rankings && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.entries(topArtist.rankings).map(([period, rank]) => (
                        rank && (
                          <span key={period} style={{
                            background: '#1db954',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {period.replace('_', ' ')}: #{rank}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No artist data available
              </div>
            )}
          </div>
          )}

          {/* Top Song Card */}
          {shouldShowCard('basicStats') && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Song
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most played track
                </p>
              </div>
            </div>
            
            {topSong ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {topSong.album && topSong.album.images && topSong.album.images[0] && topSong.album.images[0].url ? (
                  <img
                    src={topSong.album.images[0].url}
                    alt={topSong.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '1.5rem'
                  }}>
                    🎵
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0'
                  }}>
                    {topSong.name || 'Unknown Song'}
                  </h4>
                  
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '1rem',
                    margin: '0 0 8px 0'
                  }}>
                    {topSong.artists && topSong.artists[0] ? topSong.artists[0].name : 'Unknown Artist'}
                  </p>
                  
                  {/* Show rankings if available */}
                  {topSong.rankings && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.entries(topSong.rankings).map(([period, rank]) => (
                        rank && (
                          <span key={period} style={{
                            background: '#ff6b6b',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {period.replace('_', ' ')}: #{rank}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No song data available
              </div>
            )}
          </div>
          )}

          {/* Loading message for genres and styles */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: '#b3b3b3',
            fontStyle: 'italic'
          }}>
            Loading detailed music analysis...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '24px',
        margin: '32px auto',
        maxWidth: '1200px',
        width: '95%',
        minHeight: '200px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <div style={{
          color: '#ff6b6b',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px 16px',
      margin: '32px auto',
      maxWidth: '1200px',
      width: '95%'
    }}>
      <h2 style={{
        color: '#fff',
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '16px',
        letterSpacing: '0.5px'
      }}>
        Your Music Highlights
      </h2>
      
      
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Top Artist Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #1db954, #1ed760)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <img 
                src="/3580649-200.png" 
                alt="Artist Icon" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Artist
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                Most listened to
              </p>
            </div>
          </div>
          
          {topArtist ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {topArtist.images && topArtist.images[0] && topArtist.images[0].url ? (
                <img
                  src={topArtist.images[0].url}
                  alt={topArtist.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #1db954, #1ed760)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
                  {topArtist.name?.[0] || '?'}
                </div>
              )}
              
              <div style={{ flex: 1 }}>

                
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {topArtist.name || 'Unknown Artist'}
                </h4>
                
                {/* Show rankings if available */}
                {topArtist.rankings && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {Object.entries(topArtist.rankings).map(([period, rank]) => (
                      rank && (
                        <span key={period} style={{
                          background: '#1db954',
                          color: '#000',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}: #{rank}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              color: '#b3b3b3',
              textAlign: 'center',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No artist data available
            </div>
          )}
        </div>

        {/* Top Song Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Song
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                Most played track
              </p>
            </div>
          </div>
          
          {topSong ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {topSong.album && topSong.album.images && topSong.album.images[0] && topSong.album.images[0].url ? (
                <img
                  src={topSong.album.images[0].url}
                  alt={topSong.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
                  🎵
                </div>
              )}
              
              <div style={{ flex: 1 }}>

                
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {topSong.name || 'Unknown Song'}
                </h4>
                
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '1rem',
                  margin: '0 0 8px 0'
                }}>
                  {topSong.artists && topSong.artists[0] ? topSong.artists[0].name : 'Unknown Artist'}
                </p>
                
                {/* Show rankings if available */}
                {topSong.rankings && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {Object.entries(topSong.rankings).map(([period, rank]) => (
                      rank && (
                        <span key={period} style={{
                          background: '#ff6b6b',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}: #{rank}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              color: '#b3b3b3',
              textAlign: 'center',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No song data available
            </div>
          )}
        </div>

        {/* Top Genres Card - Only show if there are genres with 2+ artists */}
        {shouldShowCard('genresStyles') && topGenres.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #a855f7, #c084fc)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Genres
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                From your top artists
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {topGenres.length > 0 ? (
              topGenres.map((genre, index) => (
                <div key={genre.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#ffd700' : 
                                 index === 1 ? '#c0c0c0' : 
                                 index === 2 ? '#cd7f32' : '#a855f7',
                      color: index < 3 ? '#000' : '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {genre.name}
                    </span>
                  </div>
                  
                  <span style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {genre.count} artists
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No genre data available
              </div>
            )}
          </div>
        </div>
        )}

        {/* Top Styles Card - Only show if there are styles with 2+ artists */}
        {shouldShowCard('genresStyles') && topStyles.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Styles
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                From your top artists
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {topStyles.length > 0 ? (
              topStyles.map((style, index) => (
                <div key={style.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#ffd700' : 
                                 index === 1 ? '#c0c0c0' : 
                                 index === 2 ? '#cd7f32' : '#f59e0b',
                      color: index < 3 ? '#000' : '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {style.name}
                    </span>
                  </div>
                  
                  <span style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {style.count} artists
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No style data available
              </div>
            )}
          </div>
        </div>
        )}

        {/* Top Albums Card - Show top 3 albums */}
        {shouldShowCard('albumsDecades') && topAlbums.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Albums
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most songs per album
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {topAlbums.map((album, index) => (
                <div key={album.id} style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#d97706',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{
                      color: '#b3b3b3',
                      fontSize: '0.8rem'
                    }}>
                      {album.count} songs
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {album.images && album.images[0] ? (
                      <img
                        src={album.images[0].url}
                        alt={album.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #10b981, #34d399)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontWeight: '700',
                        fontSize: '1rem'
                      }}>
                        🎵
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {album.name}
                      </h4>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.9rem',
                        margin: '0'
                      }}>
                        {album.artist}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Decades Card - Show top 3 decades */}
        {shouldShowCard('albumsDecades') && topDecades.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Decades
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most songs from each era
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {topDecades.map((decade, index) => (
                <div key={decade.decade} style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#d97706',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{
                      color: '#b3b3b3',
                      fontSize: '0.8rem'
                    }}>
                      {decade.count} songs
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}>
                      {decade.decade}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {decade.label}
                      </h4>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.9rem',
                        margin: '0'
                      }}>
                        {decade.decade}-{decade.decade + 9}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average Popularity Card */}
        {shouldShowCard('popularity') && averagePopularity && averagePopularity.count > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #ec4899, #f472b6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Artist Popularity
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Average of your top artists
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Main Stats */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {averagePopularity.average}
                  </h4>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0'
                  }}>
                    Average / 100
                  </p>
                </div>
                <div style={{
                  textAlign: 'right'
                }}>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0 0 4px 0'
                  }}>
                    Range
                  </p>
                  <p style={{
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0'
                  }}>
                    {averagePopularity.min} - {averagePopularity.max}
                  </p>
                </div>
              </div>

              {/* Top Popular Artists */}
              {averagePopularity.topPopular && averagePopularity.topPopular.length > 0 && (
                <div>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0'
                  }}>
                    Most Popular Artists
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {averagePopularity.topPopular.map((artist, index) => (
                      <div key={artist.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            background: index === 0 ? '#ffd700' : 
                                       index === 1 ? '#c0c0c0' : 
                                       index === 2 ? '#cd7f32' : '#ec4899',
                            color: index < 3 ? '#000' : '#fff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: '700'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            {artist.name}
                          </span>
                        </div>
                        <span style={{
                          color: '#ec4899',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {artist.popularity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🚀 NEW: Hidden Gems */}
              {averagePopularity.hiddenGems && averagePopularity.hiddenGems.length > 0 && (
                <div>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>💎</span>
                    Hidden Gems
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {averagePopularity.hiddenGems.map((artist, index) => (
                      <div key={artist.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(34, 197, 94, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(34, 197, 94, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            background: '#22c55e',
                            color: '#000',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: '700'
                          }}>
                            💎
                          </span>
                          <span style={{
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            {artist.name}
                          </span>
                        </div>
                        <span style={{
                          color: '#22c55e',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {artist.popularity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Year Analysis Card */}
        {shouldShowCard('yearAnalysis') && yearAnalysis && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Music Timeline
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Nostalgia vs New Releases
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Time Period Comparisons */}
              {Object.entries(yearAnalysis).map(([period, data]) => {
                if (data.count === 0) return null;
                
                const currentYear = new Date().getFullYear();
                const yearsDiff = currentYear - data.average;
                const isNostalgic = yearsDiff > 5;
                const isNew = yearsDiff <= 2;
                
                let trendLabel = 'Balanced';
                let trendColor = '#10b981';
                
                if (isNostalgic) {
                  trendLabel = 'Nostalgic';
                  trendColor = '#f59e0b';
                } else if (isNew) {
                  trendLabel = 'Fresh';
                  trendColor = '#3b82f6';
                }
                
                return (
                  <div key={period} style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}
                        </h4>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0'
                        }}>
                          {data.count} songs analyzed
                        </p>
                      </div>
                      <span style={{
                        background: trendColor,
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {trendLabel}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h5 style={{
                          color: '#fff',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          margin: '0 0 4px 0'
                        }}>
                          {data.average}
                        </h5>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0'
                        }}>
                          Average Year
                        </p>
                      </div>
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0 0 4px 0'
                        }}>
                          {yearsDiff > 0 ? `${yearsDiff} years ago` : `${Math.abs(yearsDiff)} years ahead`}
                        </p>
                        <p style={{
                          color: '#fff',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          margin: '0'
                        }}>
                          {isNostalgic ? '🎵 Classic Vibes' : isNew ? '🚀 Fresh Finds' : '⚖️ Balanced Mix'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary */}
              {yearAnalysis.recent_50 && yearAnalysis['12_months'] && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  marginTop: '8px'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    Listening Pattern Analysis
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    {(() => {
                      const recentAvg = yearAnalysis.recent_50.average;
                      const longTermAvg = yearAnalysis['12_months'].average;
                      const diff = recentAvg - longTermAvg;
                      
                      if (diff > 2) {
                        return "You're exploring newer music lately! Your recent listens are fresher than your long-term favorites.";
                      } else if (diff < -2) {
                        return "You're diving into classics! Your recent listens are more nostalgic than your usual taste.";
                      } else {
                        return "Your recent listening pattern matches your long-term music taste - consistent vibes!";
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Track Popularity Analysis Card */}
        {shouldShowCard('trackPopularity') && trackPopularityAnalysis && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Track Popularity
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Average popularity of your songs
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Time Period Comparisons */}
              {Object.entries(trackPopularityAnalysis).map(([period, data]) => {
                if (data.count === 0) return null;
                
                let popularityLabel = 'Unknown';
                let popularityColor = '#8b5cf6';
                
                if (data.average >= 80) {
                  popularityLabel = 'Very Popular';
                  popularityColor = '#10b981';
                } else if (data.average >= 60) {
                  popularityLabel = 'Popular';
                  popularityColor = '#3b82f6';
                } else if (data.average >= 40) {
                  popularityLabel = 'Moderate';
                  popularityColor = '#f59e0b';
                } else if (data.average >= 20) {
                  popularityLabel = 'Niche';
                  popularityColor = '#ef4444';
                } else {
                  popularityLabel = 'Underground';
                  popularityColor = '#6b7280';
                }
                
                return (
                  <div key={period} style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}
                        </h4>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0'
                        }}>
                          {data.count} songs analyzed
                        </p>
                      </div>
                      <span style={{
                        background: popularityColor,
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {popularityLabel}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h5 style={{
                          color: '#fff',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          margin: '0 0 4px 0'
                        }}>
                          {data.average}
                        </h5>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0'
                        }}>
                          Average / 100
                        </p>
                      </div>
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: '0 0 4px 0'
                        }}>
                          Range: {data.min} - {data.max}
                        </p>
                        <p style={{
                          color: '#fff',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          margin: '0'
                        }}>
                          {data.average >= 80 ? '🔥 Mainstream' : 
                           data.average >= 60 ? '⭐ Trending' : 
                           data.average >= 40 ? '📻 Radio Friendly' : 
                           data.average >= 20 ? '🎵 Alternative' : '🎧 Hidden Gems'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary */}
              {trackPopularityAnalysis.all_tracks && trackPopularityAnalysis['12_months'] && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  marginTop: '8px'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    Popularity Pattern Analysis
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    {(() => {
                      const overallAvg = trackPopularityAnalysis.all_tracks.average;
                      const longTermAvg = trackPopularityAnalysis['12_months'].average;
                      
                      if (overallAvg >= 80) {
                        return "You love mainstream hits! Your music taste leans heavily toward popular, chart-topping tracks.";
                      } else if (overallAvg >= 60) {
                        return "You enjoy trending music! You're into popular songs but also discover some hidden gems.";
                      } else if (overallAvg >= 40) {
                        return "You have a balanced taste! You mix popular hits with more alternative and niche tracks.";
                      } else if (overallAvg >= 20) {
                        return "You're an alternative music lover! You prefer less mainstream, more unique tracks.";
                      } else {
                        return "You're a true music explorer! You discover underground and hidden gems that most people haven't heard.";
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listening Evolution Card */}
        {shouldShowCard('listeningEvolution') && listeningEvolution && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  <path d="M12 2v20"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Listening Evolution
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Your music discovery journey
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Newly Discovered Songs */}
              {listeningEvolution.newSongs.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <h4 style={{
                    color: '#22c55e',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🆕</span>
                    Newly Discovered Songs ({listeningEvolution.newSongs.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {listeningEvolution.newSongs.map((song, index) => (
                      <div key={song.id} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {song.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {song.artists.map(artist => artist.name).join(', ')}
                            </p>
                          </div>
                          <span style={{
                            background: '#22c55e',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            New
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly Discovered Artists */}
              {listeningEvolution.newArtists.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <h4 style={{
                    color: '#3b82f6',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎤</span>
                    Newly Discovered Artists ({listeningEvolution.newArtists.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {listeningEvolution.newArtists.map((artist, index) => (
                      <div key={artist.id} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {artist.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span style={{
                            background: '#3b82f6',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            New
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Songs Taking a Break */}
              {listeningEvolution.breakSongs.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <h4 style={{
                    color: '#f59e0b',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⏸️</span>
                    Songs Taking a Break ({listeningEvolution.breakSongs.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {listeningEvolution.breakSongs.map((song, index) => (
                      <div key={song.id} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {song.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {song.artists.map(artist => artist.name).join(', ')}
                            </p>
                          </div>
                          <span style={{
                            background: '#f59e0b',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            Break
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Taking a Break */}
              {listeningEvolution.breakArtists.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <h4 style={{
                    color: '#ef4444',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎭</span>
                    Artists Taking a Break ({listeningEvolution.breakArtists.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {listeningEvolution.breakArtists.map((artist, index) => (
                      <div key={artist.id} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {artist.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span style={{
                            background: '#ef4444',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            Break
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '8px'
              }}>
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  Listening Pattern Analysis
                </h5>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {(() => {
                    const newSongsCount = listeningEvolution.newSongs.length;
                    const breakSongsCount = listeningEvolution.breakSongs.length;
                    const newArtistsCount = listeningEvolution.newArtists.length;
                    const breakArtistsCount = listeningEvolution.breakArtists.length;
                    
                    if (newSongsCount > breakSongsCount && newArtistsCount > breakArtistsCount) {
                      return "You're actively discovering new music! Your listening habits show a strong trend toward exploring fresh artists and songs.";
                    } else if (newSongsCount > breakSongsCount) {
                      return "You're discovering new songs while maintaining some of your favorite artists. A balanced approach to music exploration.";
                    } else if (newArtistsCount > breakArtistsCount) {
                      return "You're exploring new artists but sticking to familiar songs. You like to discover new voices through trusted tracks.";
                    } else if (breakSongsCount > 0 || breakArtistsCount > 0) {
                      return "You're taking breaks from some of your previous favorites, possibly making room for new discoveries or returning to classics.";
                    } else {
                      return "Your listening patterns are stable, with consistent favorites across different time periods.";
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time of Day Analysis Card */}
        {shouldShowCard('timeOfDay') && timeOfDayAnalysis && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <polyline points="12,1 12,3"></polyline>
                  <polyline points="12,21 12,23"></polyline>
                  <polyline points="4.22,4.22 5.64,5.64"></polyline>
                  <polyline points="18.36,18.36 19.78,19.78"></polyline>
                  <polyline points="1,12 3,12"></polyline>
                  <polyline points="21,12 23,12"></polyline>
                  <polyline points="4.22,19.78 5.64,18.36"></polyline>
                  <polyline points="18.36,5.64 19.78,4.22"></polyline>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Time of Day Analysis
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  When you listen to music most
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Most Active Time */}
              {timeOfDayAnalysis.mostActiveSlot && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  textAlign: 'center'
                }}>
                  <h4 style={{
                    color: '#f59e0b',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    🎵 Your Most Active Time
                  </h4>
                  <p style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {timeOfDayAnalysis.mostActiveSlot}
                  </p>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0'
                  }}>
                    {timeOfDayAnalysis.timeSlots[timeOfDayAnalysis.mostActiveSlot].count} songs played
                  </p>
                </div>
              )}

              {/* Time Slots Breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(timeOfDayAnalysis.timeSlots).map(([slotName, slot]) => {
                  if (slot.count === 0) return null;
                  
                  const isMostActive = slotName === timeOfDayAnalysis.mostActiveSlot;
                  const percentage = Math.round((slot.count / timeOfDayAnalysis.analyzedSongs) * 100);
                  
                  return (
                    <div key={slotName} style={{
                      padding: '16px',
                      background: isMostActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: isMostActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      position: 'relative'
                    }}>
                      {isMostActive && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#f59e0b',
                          color: '#000',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          Most Active
                        </div>
                      )}
                      
                      <h5 style={{
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: '0 0 8px 0'
                      }}>
                        {slotName}
                      </h5>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          color: '#fff',
                          fontSize: '1.5rem',
                          fontWeight: '700'
                        }}>
                          {slot.count}
                        </span>
                        <span style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem'
                        }}>
                          {percentage}%
                        </span>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: isMostActive ? '#f59e0b' : '#3b82f6',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '8px 0 0 0'
                      }}>
                        {slot.start.toString().padStart(2, '0')}:00 - {slot.end.toString().padStart(2, '0')}:00
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Sample Songs from Most Active Time */}
              {timeOfDayAnalysis.mostActiveSlot && timeOfDayAnalysis.timeSlots[timeOfDayAnalysis.mostActiveSlot].songs.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0'
                  }}>
                    Sample Songs from {timeOfDayAnalysis.mostActiveSlot}
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {timeOfDayAnalysis.timeSlots[timeOfDayAnalysis.mostActiveSlot].songs.slice(0, 8).map((song, index) => (
                      <div key={index} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {song.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {song.artists.map(artist => artist.name).join(', ')}
                            </p>
                          </div>
                          <span style={{
                            background: '#f59e0b',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            {song.hour.toString().padStart(2, '0')}:00
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '8px'
              }}>
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  Listening Pattern Summary
                </h5>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {(() => {
                    const mostActive = timeOfDayAnalysis.mostActiveSlot;
                    const count = timeOfDayAnalysis.timeSlots[mostActive].count;
                    const total = timeOfDayAnalysis.analyzedSongs;
                    const percentage = Math.round((count / total) * 100);
                    
                    if (mostActive === '8-12 AM') {
                      return `You're a morning person! ${percentage}% of your music listening happens during morning hours (8:00-12:00). You start your day with great tunes!`;
                    } else if (mostActive === '12-4 PM') {
                      return `You're an afternoon listener! ${percentage}% of your music happens during afternoon hours (12:00-16:00). Perfect timing for a midday energy boost!`;
                    } else if (mostActive === '4-8 PM') {
                      return `You're an evening music lover! ${percentage}% of your listening happens during evening hours (16:00-20:00). Great way to unwind after work!`;
                    } else if (mostActive === '8-12 PM') {
                      return `You're a night owl! ${percentage}% of your music listening happens during night hours (20:00-24:00). Music keeps you company during late hours!`;
                    } else  {
                      return `You're a late-night/early-morning listener! ${percentage}% of your music happens during late night, or early morning hours (0:00-8:00). Music accompanies your late night activities or early morning wakeups!`;
                    } 
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Listener Type Analysis Card */}
        {shouldShowCard('listenerType') && listenerTypeAnalysis && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: listenerTypeAnalysis.type === 'Superfan' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                           listenerTypeAnalysis.type === 'Artist Explorer' ? 'linear-gradient(135deg, #10b981, #059669)' :
                           'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                {listenerTypeAnalysis.type === 'Superfan' ? '🎵' :
                 listenerTypeAnalysis.type === 'Artist Explorer' ? '🔍' : '⚖️'}
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Listener Type Analysis
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Your music discovery style
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Listener Type Badge */}
              <div style={{
                padding: '20px',
                background: listenerTypeAnalysis.type === 'Superfan' ? 'rgba(239, 68, 68, 0.1)' :
                           listenerTypeAnalysis.type === 'Artist Explorer' ? 'rgba(16, 185, 129, 0.1)' :
                           'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px',
                border: listenerTypeAnalysis.type === 'Superfan' ? '1px solid rgba(239, 68, 68, 0.2)' :
                        listenerTypeAnalysis.type === 'Artist Explorer' ? '1px solid rgba(16, 185, 129, 0.2)' :
                        '1px solid rgba(139, 92, 246, 0.2)',
                textAlign: 'center'
              }}>
                <h4 style={{
                  color: listenerTypeAnalysis.type === 'Superfan' ? '#ef4444' :
                         listenerTypeAnalysis.type === 'Artist Explorer' ? '#10b981' : '#8b5cf6',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {listenerTypeAnalysis.type === 'Superfan' ? '🎵 Superfan' :
                   listenerTypeAnalysis.type === 'Artist Explorer' ? '🔍 Artist Explorer' : '⚖️ Balanced Listener'}
                </h4>
                <p style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  {listenerTypeAnalysis.confidence}% Confidence
                </p>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Based on your recent listening patterns
                </p>
              </div>

              {/* Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {Math.round(listenerTypeAnalysis.artistDiversity * 100)}%
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    Artist Diversity
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {listenerTypeAnalysis.allArtists.length}
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    Unique Artists
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {listenerTypeAnalysis.topArtist ? Math.round((listenerTypeAnalysis.topArtist.count / (listenerTypeAnalysis.superfanMetrics?.totalSongs || listenerTypeAnalysis.explorerMetrics?.totalSongs || 1)) * 100) : 0}%
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    Top Artist %
                  </p>
                </div>
              </div>

              {/* Top Artists List */}
              {listenerTypeAnalysis.allArtists.length > 0 && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 12px 0'
                  }}>
                    Recent Artist Activity
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {listenerTypeAnalysis.allArtists.slice(0, 10).map((artist, index) => (
                      <div key={artist.id} style={{
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <p style={{
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              margin: '0 0 2px 0'
                            }}>
                              {artist.name}
                            </p>
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              margin: '0'
                            }}>
                              {artist.count} song{artist.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span style={{
                            background: index === 0 ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '8px'
              }}>
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  Listening Style Analysis
                </h5>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {(() => {
                    const type = listenerTypeAnalysis.type;
                    const diversity = Math.round(listenerTypeAnalysis.artistDiversity * 100);
                    const uniqueArtists = listenerTypeAnalysis.allArtists.length;
                    
                    if (type === 'Superfan') {
                      return `You're a dedicated superfan! You focus deeply on specific artists, with ${diversity}% artist diversity. You prefer to explore the full catalog of artists you love rather than constantly discovering new ones.`;
                    } else if (type === 'Artist Explorer') {
                      return `You're an artist explorer! You love discovering new voices, with ${diversity}% artist diversity and ${uniqueArtists} unique artists in your recent tracks. You're always on the hunt for fresh musical discoveries.`;
                    } else {
                      return `You're a balanced listener! You mix deep dives into favorite artists with discovering new voices. You have ${diversity}% artist diversity, showing a healthy mix of both approaches.`;
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
