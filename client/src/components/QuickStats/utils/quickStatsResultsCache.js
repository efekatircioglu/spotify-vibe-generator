/**
 * QuickStats Results Cache System
 * 
 * This cache stores all calculated results from QuickStats components
 * to prevent recalculation on page refresh/navigation.
 * 
 * CACHE STRUCTURE:
 * {
 *   [cacheKey]: {
 *     timestamp: number,
 *     basicStats: { bestArtist, bestTimeRange, bestTrack, bestTrackTimeRange },
 *     genres: { genres: [], genreDetails: {} },
 *     albumsDecades: { albums: [], decades: [] },
 *     popularity: { averagePopularity data },
 *     yearAnalysis: { year analysis data },
 *     trackPopularity: { track popularity data },
 *     listeningEvolution: { evolution analysis },
 *     timeOfDayAnalysis: { time of day data },
 *     listenerTypeAnalysis: { listener type data },
 *     recentTracks: []
 *   }
 * }
 */

const QUICKSTATS_RESULTS_CACHE_KEY = 'quickStatsResultsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate a unique cache key based on user's top data
 */
export const generateResultsCacheKey = (topArtists, topTracks) => {
  if (!topArtists || !topTracks || topArtists.length === 0 || topTracks.length === 0) {
    return null;
  }
  
  // Create a hash based on the first few items to ensure uniqueness
  const artistHash = topArtists.slice(0, 3).map(a => a.id).join('_');
  const trackHash = topTracks.slice(0, 3).map(t => t.id).join('_');
  const dataHash = `${topArtists.length}_${topTracks.length}_${artistHash}_${trackHash}`;
  
  return `quickstats_results_${dataHash}`;
};

/**
 * Get the entire results cache from sessionStorage
 */
export const getResultsCache = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {};
    }
    const cached = sessionStorage.getItem(QUICKSTATS_RESULTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading QuickStats results cache:', error);
    return {};
  }
};

/**
 * Set the entire results cache to sessionStorage
 */
export const setResultsCache = (data) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    sessionStorage.setItem(QUICKSTATS_RESULTS_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing QuickStats results cache:', error);
  }
};

/**
 * Get cached results for a specific user data
 */
export const getCachedResults = (topArtists, topTracks) => {
  const cacheKey = generateResultsCacheKey(topArtists, topTracks);
  if (!cacheKey) {
    console.log('❌ QuickStats: No cache key generated');
    return null;
  }
  
  const cache = getResultsCache();
  const cachedData = cache[cacheKey];
  
  if (!cachedData) {
    console.log('❌ QuickStats: No cached data found for key:', cacheKey);
    return null;
  }
  
  // Check if cache is still valid
  if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
    // Cache expired, remove it
    console.log('⚠️ QuickStats: Cache expired, removing');
    delete cache[cacheKey];
    setResultsCache(cache);
    return null;
  }
  
  console.log('✅ QuickStats: Found valid cached data for key:', cacheKey);
  return cachedData;
};

/**
 * Set cached results for a specific user data
 */
export const setCachedResults = (topArtists, topTracks, results) => {
  const cacheKey = generateResultsCacheKey(topArtists, topTracks);
  if (!cacheKey) {
    console.log('❌ QuickStats: Could not generate cache key for setCachedResults');
    return;
  }
  
  const cache = getResultsCache();
  
  cache[cacheKey] = {
    timestamp: Date.now(),
    ...results
  };
  
  setResultsCache(cache);
  console.log('✅ QuickStats: Cached results for key:', cacheKey, {
    sections: Object.keys(results)
  });
};

/**
 * Update a specific section in the cached results
 */
export const updateCachedSection = (topArtists, topTracks, sectionName, sectionData) => {
  const cacheKey = generateResultsCacheKey(topArtists, topTracks);
  if (!cacheKey) {
    console.log('❌ QuickStats: Could not generate cache key for updateCachedSection');
    return;
  }
  
  const cache = getResultsCache();
  
  if (!cache[cacheKey]) {
    cache[cacheKey] = { timestamp: Date.now() };
    console.log('🆕 QuickStats: Created new cache entry for key:', cacheKey);
  }
  
  cache[cacheKey][sectionName] = sectionData;
  setResultsCache(cache);
  console.log('✅ QuickStats: Updated section in cache:', sectionName, 'for key:', cacheKey);
};

/**
 * Check if results cache exists and is valid for given data
 */
export const hasValidResultsCache = (topArtists, topTracks) => {
  const cached = getCachedResults(topArtists, topTracks);
  return cached !== null;
};

/**
 * Clear the entire results cache
 */
export const clearResultsCache = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    sessionStorage.removeItem(QUICKSTATS_RESULTS_CACHE_KEY);
    console.log('QuickStats results cache cleared');
  } catch (error) {
    console.error('Error clearing QuickStats results cache:', error);
  }
};

/**
 * Get cache status information
 */
export const getResultsCacheStatus = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        exists: false,
        cacheCount: 0,
        cacheKeys: [],
        totalSize: 0
      };
    }
    
    const cache = getResultsCache();
    const cacheKeys = Object.keys(cache);
    
    return {
      exists: cacheKeys.length > 0,
      cacheCount: cacheKeys.length,
      cacheKeys: cacheKeys,
      totalSize: JSON.stringify(cache).length
    };
  } catch (error) {
    console.error('Error getting results cache status:', error);
    return {
      exists: false,
      cacheCount: 0,
      cacheKeys: [],
      totalSize: 0
    };
  }
};

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return 0;
    }
    
    const cache = getResultsCache();
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_DURATION) {
        delete cache[key];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      setResultsCache(cache);
      console.log(`Cleaned up ${cleanedCount} expired QuickStats cache entries`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
    return 0;
  }
};
