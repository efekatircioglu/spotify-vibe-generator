// Centralized Cache Manager
// Manages both spotify_top_artists and unified_top_tracks caches
// Initializes caches when tokens are generated, clears them when tokens expire

import { fetchAndCacheAllTimePeriods } from './topArtistsCache';
import { fetchAndCacheTopData } from './topDataCache';

const CACHE_KEYS = {
  SPOTIFY_TOP_ARTISTS: 'spotify_top_artists',
  UNIFIED_TOP_TRACKS: 'unified_top_tracks',
  CACHE_TIMESTAMP: 'cache_timestamp'
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Initialize all caches when a new token is generated
 * This should be called after successful authentication
 */
export const initializeAllCaches = async () => {
  try {
    console.log('[CacheManager] Initializing all caches...');
    
    // Set cache timestamp
    const timestamp = Date.now();
    localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, timestamp.toString());
    
    console.log('[CacheManager] Starting artists cache initialization...');
    // Initialize both caches in parallel
    const [artistsResult, tracksResult] = await Promise.allSettled([
      fetchAndCacheAllTimePeriods(),
      fetchAndCacheTopData()
    ]);
    
    // Log results
    if (artistsResult.status === 'fulfilled') {
      console.log(`[CacheManager] Artists cache initialized: ${artistsResult.value.artistCount} artists`);
    } else {
      console.error('[CacheManager] Failed to initialize artists cache:', artistsResult.reason);
    }
    
    if (tracksResult.status === 'fulfilled') {
      console.log('[CacheManager] Tracks cache initialized successfully');
    } else {
      console.error('[CacheManager] Failed to initialize tracks cache:', tracksResult.reason);
    }
    
    // Verify caches were created
    const cachesExist = doCachesExist();
    console.log('[CacheManager] Caches exist after initialization:', cachesExist);
    
    console.log('[CacheManager] All caches initialized');
    return true;
    
  } catch (error) {
    console.error('[CacheManager] Error initializing caches:', error);
    return false;
  }
};

/**
 * Clear all caches when token expires or user logs out
 */
export const clearAllCaches = () => {
  try {
    console.log('[CacheManager] Clearing all caches...');
    
    // Clear both caches
    localStorage.removeItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    localStorage.removeItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    
    console.log('[CacheManager] All caches cleared');
    return true;
    
  } catch (error) {
    console.error('[CacheManager] Error clearing caches:', error);
    return false;
  }
};

/**
 * Check if caches are valid and not expired
 */
export const areCachesValid = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp);
    return age < CACHE_DURATION;
    
  } catch (error) {
    console.error('[CacheManager] Error checking cache validity:', error);
    return false;
  }
};

/**
 * Check if caches exist and have data
 */
export const doCachesExist = () => {
  try {
    const artistsCache = localStorage.getItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    const tracksCache = localStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    
    if (!artistsCache || !tracksCache) return false;
    
    // Parse and check if they have actual data
    const artistsData = JSON.parse(artistsCache);
    const tracksData = JSON.parse(tracksCache);
    
    return artistsData?.artists?.length > 0 && tracksData?.length > 0;
    
  } catch (error) {
    console.error('[CacheManager] Error checking cache existence:', error);
    return false;
  }
};

/**
 * Force refresh all caches
 */
export const forceRefreshAllCaches = async () => {
  try {
    console.log('[CacheManager] Force refreshing all caches...');
    
    // Clear existing caches first
    clearAllCaches();
    
    // Wait a moment to ensure caches are cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Re-initialize all caches
    const result = await initializeAllCaches();
    
    return result;
    
  } catch (error) {
    console.error('[CacheManager] Error force refreshing caches:', error);
    return false;
  }
};

/**
 * Get cache status information
 */
export const getCacheStatus = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    const artistsCache = localStorage.getItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    const tracksCache = localStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    
    const now = Date.now();
    const age = timestamp ? now - parseInt(timestamp) : 0;
    const isValid = age < CACHE_DURATION;
    
    return {
      exists: !!(artistsCache && tracksCache),
      valid: isValid,
      age: age,
      ageMinutes: Math.floor(age / (60 * 1000)),
      expiresIn: Math.max(0, CACHE_DURATION - age),
      expiresInMinutes: Math.max(0, Math.floor((CACHE_DURATION - age) / (60 * 1000))),
      artistsCount: artistsCache ? JSON.parse(artistsCache)?.artists?.length || 0 : 0,
      tracksCount: tracksCache ? JSON.parse(tracksCache)?.length || 0 : 0
    };
    
  } catch (error) {
    console.error('[CacheManager] Error getting cache status:', error);
    return {
      exists: false,
      valid: false,
      age: 0,
      ageMinutes: 0,
      expiresIn: 0,
      expiresInMinutes: 0,
      artistsCount: 0,
      tracksCount: 0
    };
  }
};

/**
 * Setup cache monitoring for token changes
 * This should be called once when the app initializes
 */
export const setupCacheMonitoring = () => {
  try {
    console.log('[CacheManager] Setting up cache monitoring...');
    
    // Monitor localStorage changes for token removal
    const handleStorageChange = (e) => {
      if (e.key === 'spotify_token' && e.newValue === null) {
        // Token was removed (user logged out or token expired)
        console.log('[CacheManager] Token removed, clearing caches...');
        clearAllCaches();
      } else if (e.key === 'spotify_token' && e.newValue && e.oldValue === null) {
        // New token was added (user just authenticated)
        console.log('[CacheManager] New token detected, initializing caches...');
        // Small delay to ensure token is fully set
        setTimeout(() => initializeAllCaches(), 100);
      }
    };
    
    // Monitor for token refresh events
    const handleTokenRefreshed = () => {
      console.log('[CacheManager] Token refreshed, checking cache validity...');
      if (!areCachesValid()) {
        console.log('[CacheManager] Caches expired, reinitializing...');
        initializeAllCaches();
      }
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    
    console.log('[CacheManager] Cache monitoring setup complete');
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
    };
    
  } catch (error) {
    console.error('[CacheManager] Error setting up cache monitoring:', error);
  }
};

// Export for use in other modules
export default {
  initializeAllCaches,
  clearAllCaches,
  areCachesValid,
  doCachesExist,
  forceRefreshAllCaches,
  getCacheStatus,
  setupCacheMonitoring
};
