// Top Artists Cache Utility
// Manages localStorage caching for user's top artists to avoid redundant API calls

const CACHE_KEY = 'spotify_top_artists';

/**
 * Get cached top artists if they exist and are not expired
 * @returns {Array|null} Cached artists array or null if not found/expired
 */
export const getCachedTopArtists = () => {
  try {
    // Check if cache exists
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return null;
    }
    
    // Parse cached data
    const cacheObject = JSON.parse(cachedData);
    
    // Cache validity is now managed centrally by CacheManager
    // Just check if the data exists and is valid
    
    // Return cached artists
    return cacheObject.artists;
    
  } catch (error) {
    console.error('[TopArtistsCache] Error reading cache:', error);
    clearTopArtistsCache(); // Clear corrupted cache
    return null;
  }
};

/**
 * Merge artists from different time periods into a unified structure
 * @param {Array} artists - Array of artist objects from different time periods
 * @returns {Array} Merged artists with rankings for all time periods
 */
const mergeArtistsByTimePeriod = (artists) => {
  const artistMap = new Map();
  
  artists.forEach(artist => {
    const artistId = artist.id;
    const timePeriod = artist.timePeriod;
    
    // Extract ranking - try multiple possible fields
    let rank = null;
    if (artist.originalRank !== null && artist.originalRank !== undefined) {
      rank = artist.originalRank;
    } else if (artist.rank !== null && artist.rank !== undefined) {
      rank = artist.rank;
    } else if (artist.position !== null && artist.position !== undefined) {
      rank = artist.position;
    }
    
    if (!artistMap.has(artistId)) {
      // Initialize artist with all time periods set to null
      artistMap.set(artistId, {
        ...artist,
        rankings: {
          '4_weeks': null,
          '6_months': null,
          '12_months': null
        }
      });
    }
    
    const existingArtist = artistMap.get(artistId);
    
    // Set the ranking for this time period
    if (timePeriod === '4_weeks') {
      existingArtist.rankings['4_weeks'] = rank;
    } else if (timePeriod === '6_months') {
      existingArtist.rankings['6_months'] = rank;
    } else if (timePeriod === '12_months') {
      existingArtist.rankings['12_months'] = rank;
    }
    
    // Keep the most complete artist data (prefer the one with most info)
    if (artist.followers?.total && artist.popularity && artist.genres?.length > 0) {
      Object.assign(existingArtist, artist);
    }
  });
  
  const mergedArtists = Array.from(artistMap.values());
  
  // Sort artists by priority: 12 months → 6 months → 4 weeks
  // Artists with higher rankings in longer time periods get priority
  mergedArtists.sort((a, b) => {
    // First priority: 12 months ranking (lower number = higher rank)
    const a12m = a.rankings['12_months'];
    const b12m = b.rankings['12_months'];
    
    if (a12m !== null && b12m !== null) {
      if (a12m !== b12m) return a12m - b12m;
    } else if (a12m !== null) return -1; // a has 12m ranking, b doesn't
    else if (b12m !== null) return 1;  // b has 12m ranking, a doesn't
    
    // Second priority: 6 months ranking
    const a6m = a.rankings['6_months'];
    const b6m = b.rankings['6_months'];
    
    if (a6m !== null && b6m !== null) {
      if (a6m !== b6m) return a6m - b6m;
    } else if (a6m !== null) return -1; // a has 6m ranking, b doesn't
    else if (b6m !== null) return 1;  // b has 6m ranking, a doesn't
    
    // Third priority: 4 weeks ranking
    const a4w = a.rankings['4_weeks'];
    const b4w = b.rankings['4_weeks'];
    
    if (a4w !== null && b4w !== null) {
      if (a4w !== b4w) return a4w - b4w;
    } else if (a4w !== null) return -1; // a has 4w ranking, b doesn't
    else if (b4w !== null) return 1;  // b has 4w ranking, a doesn't
    
    // If all rankings are equal or null, maintain original order
    return 0;
  });
  
  // Log a sample merged artist for debugging
  if (mergedArtists.length > 0) {
    console.log('[TopArtistsCache] Sample merged artist:', mergedArtists[0]);
    console.log('[TopArtistsCache] First 5 artists after sorting:', mergedArtists.slice(0, 5).map(a => ({
      name: a.name,
      rankings: a.rankings
    })));
  }
  
  return mergedArtists;
};

/**
 * Clear old cache format and force refresh
 */
const clearOldCacheFormat = () => {
  try {
    // Clear the old cache format if it exists
    const oldCacheData = localStorage.getItem('spotify_top_artists');
    if (oldCacheData) {
      const oldCache = JSON.parse(oldCacheData);
      console.log('[TopArtistsCache] Found existing cache:', oldCache);
      
      // If old cache doesn't have the new rankings structure, clear it
      if (oldCache.artists && oldCache.artists.length > 0 && !oldCache.artists[0].rankings) {
        console.log('[TopArtistsCache] Clearing old cache format (no rankings structure)...');
        localStorage.removeItem('spotify_top_artists');
        return true; // Indicate cache was cleared
      } else if (oldCache.artists && oldCache.artists.length > 0) {
        console.log('[TopArtistsCache] Cache already has rankings structure, keeping it');
        return false; // Indicate cache was not cleared
      }
    }
    return false;
  } catch (error) {
    console.warn('[TopArtistsCache] Error checking old cache format:', error);
    return false;
  }
};

/**
 * Fetch and cache top artists from all time periods
 * This function fetches data from all three time period endpoints and merges them
 */
export const fetchAndCacheAllTimePeriods = async () => {
  try {
    // Clear old cache format first
    clearOldCacheFormat();
    
    console.log('[TopArtistsCache] Fetching artists from all time periods...');
    
    const endpoints = [
      { url: 'http://127.0.0.1:8000/last-4-weeks', timePeriod: '4_weeks' },
      { url: 'http://127.0.0.1:8000/last-6-months', timePeriod: '6_months' },
      { url: 'http://127.0.0.1:8000/last-12-months', timePeriod: '12_months' }
    ];
    
    // Fetch from all endpoints in parallel
    const results = await Promise.all(
      endpoints.map(async ({ url, timePeriod }) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[TopArtistsCache] HTTP ${response.status} for ${url}`);
            return { success: false, timePeriod, artists: [] };
          }
          const data = await response.json();
          
          // Log the structure of the response for debugging
          console.log(`[TopArtistsCache] ${timePeriod} response structure:`, {
            hasArtists: !!data.artists,
            artistsLength: data.artists?.length || 0,
            sampleArtist: data.artists?.[0] || 'No artists'
          });
          
          return { 
            success: true, 
            timePeriod, 
            artists: data.artists || [] 
          };
        } catch (error) {
          console.warn(`[TopArtistsCache] Error fetching ${url}:`, error);
          return { success: false, timePeriod, artists: [] };
        }
      })
    );
    
    // Extract all artists with their time periods and rankings
    const allArtists = [];
    results.forEach(({ success, timePeriod, artists }) => {
      if (success && artists.length > 0) {
        artists.forEach((artist, index) => {
          // Extract ranking from various possible fields
          let ranking = null;
          if (artist.originalRank !== null && artist.originalRank !== undefined) {
            ranking = artist.originalRank;
          } else if (artist.rank !== null && artist.rank !== undefined) {
            ranking = artist.rank;
          } else if (artist.position !== null && artist.position !== undefined) {
            ranking = artist.position;
          } else {
            // Fallback to array index + 1 if no ranking field found
            ranking = index + 1;
            console.log(`[TopArtistsCache] No ranking found for ${artist.name}, using index: ${ranking}`);
          }
          
          allArtists.push({
            ...artist,
            timePeriod,
            originalRank: ranking
          });
        });
      }
    });
    
    console.log(`[TopArtistsCache] Fetched ${allArtists.length} total artist entries`);
    
    // Cache the merged results
    setCachedTopArtists(allArtists);
    
    return { success: true, artistCount: allArtists.length };
    
  } catch (error) {
    console.error('[TopArtistsCache] Error fetching all time periods:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cache top artists with expiry timestamp
 * @param {Array} artists - Array of artist objects
 */
export const setCachedTopArtists = (artists) => {
  try {
    // Merge artists by time period before caching
    const mergedArtists = mergeArtistsByTimePeriod(artists);
    
    const cacheObject = {
      artists: mergedArtists
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    
    console.log(`[TopArtistsCache] Cached ${mergedArtists.length} merged artists`);
    
  } catch (error) {
    console.error('[TopArtistsCache] Error caching artists:', error);
  }
};

/**
 * Clear the top artists cache
 */
export const clearTopArtistsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[TopArtistsCache] Cache cleared');
  } catch (error) {
    console.error('[TopArtistsCache] Error clearing cache:', error);
  }
};

/**
 * Force refresh the cache by clearing it and fetching new data
 */
export const forceRefreshArtistsCache = async () => {
  try {
    console.log('[TopArtistsCache] Force refreshing artists cache...');
    
    // Clear the existing cache first
    clearTopArtistsCache();
    
    // Wait a moment to ensure cache is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fetch fresh data
    const result = await fetchAndCacheAllTimePeriods();
    
    if (result.success) {
      console.log(`[TopArtistsCache] Cache refreshed successfully with ${result.artistCount} artists`);
      
      // Verify the new cache structure
      const cacheInfo = inspectTopArtistsCache();
      console.log('[TopArtistsCache] New cache structure:', cacheInfo);
      
      return { 
        success: true, 
        artistCount: result.artistCount,
        cacheInfo 
      };
    } else {
      console.error('[TopArtistsCache] Failed to refresh cache:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('[TopArtistsCache] Error force refreshing cache:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if cache exists and is valid (not expired)
 * @returns {boolean} True if cache exists and is valid
 */
export const isTopArtistsCacheValid = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return false;
    }
    
    const cacheObject = JSON.parse(cachedData);
    const now = Date.now();
    
    return now <= cacheObject.expiry;
  } catch (error) {
    console.error('[TopArtistsCache] Error checking cache validity:', error);
    return false;
  }
};

/**
 * Get cache info for debugging
 * @returns {Object} Cache information
 */
export const getTopArtistsCacheInfo = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return { exists: false, artistsCount: 0 };
    }
    
    const cacheObject = JSON.parse(cachedData);
    
    return {
      exists: true,
      artistsCount: cacheObject.artists?.length || 0
    };
  } catch (error) {
    console.error('[TopArtistsCache] Error getting cache info:', error);
    return { exists: false, artistsCount: 0 };
  }
};

/**
 * Debug function to inspect the current cache structure
 * @returns {Object} Detailed cache inspection
 */
export const inspectTopArtistsCache = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return { exists: false, message: 'No cache found' };
    }
    
    const cacheObject = JSON.parse(cachedData);
    
    // Analyze the artists structure
    const artists = cacheObject.artists || [];
    const rankingsAnalysis = {
      total: artists.length,
      with4Weeks: artists.filter(a => a.rankings?.['4_weeks'] !== null).length,
      with6Months: artists.filter(a => a.rankings?.['6_months'] !== null).length,
      with12Months: artists.filter(a => a.rankings?.['12_months'] !== null).length,
      withAnyRanking: artists.filter(a => 
        a.rankings?.['4_weeks'] !== null || 
        a.rankings?.['6_months'] !== null || 
        a.rankings?.['12_months'] !== null
      ).length
    };
    
    // Sample artists for inspection
    const sampleArtists = artists.slice(0, 3).map(artist => ({
      name: artist.name,
      id: artist.id,
      rankings: artist.rankings,
      hasOriginalRank: artist.originalRank !== null && artist.originalRank !== undefined
    }));
    
    return {
      exists: true,
      artistsCount: artists.length,
      rankingsAnalysis,
      sampleArtists,
      cacheStructure: {
        hasArtists: Array.isArray(cacheObject.artists),
        artistsType: typeof cacheObject.artists
      }
    };
    
  } catch (error) {
    console.error('[TopArtistsCache] Error inspecting cache:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Calculate average popularity of top artists
 * @returns {Object} Object containing average popularity and statistics
 */
export const calculateAveragePopularity = () => {
  try {
    const artists = getCachedTopArtists();
    
    if (!artists || artists.length === 0) {
      return {
        average: 0,
        total: 0,
        count: 0,
        min: 0,
        max: 0,
        message: 'No artists found in cache'
      };
    }
    
    // Filter artists that have popularity data
    const artistsWithPopularity = artists.filter(artist => 
      artist.popularity !== null && 
      artist.popularity !== undefined && 
      !isNaN(artist.popularity)
    );
    
    if (artistsWithPopularity.length === 0) {
      return {
        average: 0,
        total: 0,
        count: 0,
        min: 0,
        max: 0,
        message: 'No artists with popularity data found'
      };
    }
    
    // Calculate statistics
    const popularities = artistsWithPopularity.map(artist => artist.popularity);
    const total = popularities.reduce((sum, pop) => sum + pop, 0);
    const average = Math.round(total / popularities.length);
    const min = Math.min(...popularities);
    const max = Math.max(...popularities);
    
    // Get top 5 most popular artists
    const topPopular = artistsWithPopularity
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map(artist => ({
        name: artist.name,
        popularity: artist.popularity,
        genres: artist.genres || []
      }));
    
    return {
      average,
      total,
      count: popularities.length,
      min,
      max,
      topPopular,
      message: `Average popularity: ${average}/100 (${popularities.length} artists)`
    };
    
  } catch (error) {
    console.error('[TopArtistsCache] Error calculating average popularity:', error);
    return {
      average: 0,
      total: 0,
      count: 0,
      min: 0,
      max: 0,
      message: 'Error calculating popularity'
    };
  }
};
