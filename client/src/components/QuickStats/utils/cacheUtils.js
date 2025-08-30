/**
 * Cache Utilities for QuickStats Components
 * 
 * Contains all cache-related functions for managing QuickStats data
 * Handles localStorage and sessionStorage operations
 * 
 * BENEFITS:
 * ✅ Centralized cache management
 * ✅ Reusable across different components
 * ✅ Easy to test and maintain
 * ✅ Clear separation of concerns
 */

const CACHE_KEY = 'quickStatsCache';
const COMPREHENSIVE_CACHE_KEY = 'quickStatsComprehensiveCache';

/**
 * Get cached data from sessionStorage
 */
export const getCacheFromStorage = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading cache from storage:', error);
    return {};
  }
};

/**
 * Set cache data to sessionStorage
 */
export const setCacheToStorage = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing cache to storage:', error);
  }
};

/**
 * Clear cache from sessionStorage
 */
export const clearCacheFromStorage = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache from storage:', error);
  }
};

/**
 * Get comprehensive cache from sessionStorage
 */
export const getComprehensiveCacheFromStorage = () => {
  try {
    const cached = sessionStorage.getItem(COMPREHENSIVE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading comprehensive cache from storage:', error);
    return {};
  }
};

/**
 * Set comprehensive cache data to sessionStorage
 */
export const setComprehensiveCacheToStorage = (data) => {
  try {
    sessionStorage.setItem(COMPREHENSIVE_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing comprehensive cache to storage:', error);
  }
};

/**
 * Clear comprehensive cache from sessionStorage
 */
export const clearComprehensiveCacheFromStorage = () => {
  try {
    sessionStorage.removeItem(COMPREHENSIVE_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing comprehensive cache from storage:', error);
  }
};

/**
 * Check if cache is valid (less than 1 hour old)
 */
export const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() - timestamp < oneHour;
};

/**
 * Check if cache has complete data
 */
export const hasCompleteCache = (cache) => {
  return cache && 
         cache.timestamp && 
         isCacheValid(cache.timestamp) && 
         cache.topArtist && 
         cache.topSong;
};

/**
 * Generate a comprehensive cache key based on user data
 */
export const generateComprehensiveCacheKey = (topArtists, topTracks) => {
  if (!topArtists || !topTracks) return null;
  
  // Use user ID and data hash for reliable caching
  const userHash = topArtists.length + '_' + topTracks.length;
  const dataHash = topArtists.length + '_' + topTracks.length + '_' + 
                  (topArtists[0]?.name || '') + '_' + 
                  (topTracks[0]?.name || '');
  
  return `quickstats_${userHash}_${dataHash}`;
};

/**
 * Get cached section data
 */
export const getCachedSection = (sectionName, topArtists, topTracks) => {
  const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
  if (!cacheKey) return null;
  
  const cached = getComprehensiveCacheFromStorage()[cacheKey];
  return cached?.[sectionName] || null;
};

/**
 * Set cached section data
 */
export const setCachedSection = (sectionName, data, topArtists, topTracks) => {
  const cacheKey = generateComprehensiveCacheKey(topArtists, topTracks);
  if (!cacheKey) return;
  
  const currentCache = getComprehensiveCacheFromStorage();
  if (!currentCache[cacheKey]) {
    currentCache[cacheKey] = { timestamp: Date.now() };
  }
  currentCache[cacheKey][sectionName] = data;
  setComprehensiveCacheToStorage(currentCache);
};

/**
 * Clear all QuickStats caches
 */
export const clearAllQuickStatsCaches = () => {
  clearCacheFromStorage();
  clearComprehensiveCacheFromStorage();
};
