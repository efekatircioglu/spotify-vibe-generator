/**
 * QuickStats Cache Management Utility
 * 
 * This utility provides functions to manage the QuickStats cache
 * which stores genres and styles data for top artists.
 * 
 * The cache is stored in sessionStorage for better security and 
 * automatically expires when the browser tab is closed.
 * Cache is also cleared when the Spotify token changes.
 * 
 * Security Note: sessionStorage is used for non-sensitive user data,
 * while OAuth tokens should be stored in secure HttpOnly cookies.
 */

/**
 * Clear the QuickStats cache from sessionStorage
 * Call this when the Spotify token expires or user logs out
 */
export const clearQuickStatsCache = () => {
  if (typeof window !== 'undefined' && window.clearQuickStatsCache) {
    window.clearQuickStatsCache();
    return true;
  }
  return false;
};

/**
 * Get information about the current QuickStats cache
 * Useful for debugging and monitoring sessionStorage cache
 */
export const getQuickStatsCacheInfo = () => {
  if (typeof window !== 'undefined' && window.getQuickStatsCacheInfo) {
    return window.getQuickStatsCacheInfo();
  }
  return { size: 0, keys: [], cacheData: {}, storageType: 'sessionStorage' };
};

/**
 * Check if QuickStats cache is available
 */
export const isQuickStatsCacheAvailable = () => {
  return typeof window !== 'undefined' && window.clearQuickStatsCache;
};

/**
 * Clear cache and log the action
 * Use this in auth-related functions when token expires
 */
export const clearQuickStatsCacheOnTokenExpiry = () => {
  console.log('🔄 Clearing QuickStats cache due to token expiry...');
  const cleared = clearQuickStatsCache();
  if (cleared) {
    console.log('✅ QuickStats cache cleared successfully from sessionStorage');
  } else {
    console.log('⚠️ QuickStats cache not available or already cleared');
  }
  return cleared;
};

/**
 * Manually clear the cache from sessionStorage
 * Useful for debugging or manual cache management
 */
export const clearQuickStatsCacheManually = () => {
  try {
    sessionStorage.removeItem('quickStatsCache');
    console.log('🧹 QuickStats cache manually cleared from sessionStorage');
    return true;
  } catch (error) {
    console.error('Error manually clearing QuickStats cache:', error);
    return false;
  }
};

/**
 * Clear all sessionStorage data (nuclear option)
 * Use this when you want to completely reset the session
 */
export const clearAllSessionStorage = () => {
  try {
    sessionStorage.clear();
    console.log('🧹 All sessionStorage data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing all sessionStorage:', error);
    return false;
  }
};

/**
 * Get cache info directly from sessionStorage
 * Useful for debugging without component context
 */
export const getQuickStatsCacheDirectly = () => {
  try {
    const cached = sessionStorage.getItem('quickStatsCache');
    if (cached) {
      const data = JSON.parse(cached);
      return {
        size: Object.keys(data).length,
        keys: Object.keys(data),
        cacheData: data,
        storageType: 'sessionStorage'
      };
    }
    return { size: 0, keys: [], cacheData: {}, storageType: 'sessionStorage' };
  } catch (error) {
    console.error('Error reading QuickStats cache directly:', error);
    return { size: 0, keys: [], cacheData: {}, storageType: 'sessionStorage', error: error.message };
  }
};
