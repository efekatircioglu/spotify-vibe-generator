// Centralized Cache Manager
// Manages spotify_top_artists, unified_top_tracks, and spotify_recent_tracks caches
// Initializes caches when tokens are generated, clears them when tokens expire

import { fetchAndCacheAllTimePeriods } from './topArtistsCache';
import { fetchAndCacheTopData } from './topDataCache';
import { clearResultsCache } from '../components/QuickStats/utils/quickStatsResultsCache';
import { clearRecentTracksCache, fetchAndCacheRecentTracks } from './recentTracksCache';

const CACHE_KEYS = {
  SPOTIFY_TOP_ARTISTS: 'spotify_top_artists',
  UNIFIED_TOP_TRACKS: 'unified_top_tracks',
  SPOTIFY_RECENT_TRACKS: 'spotify_recent_tracks'
};

/**
 * Initialize all caches when a new token is generated
 * This should be called after successful authentication
 */
export const initializeAllCaches = async () => {
  try {
    // Check if caches already exist to prevent unnecessary re-initialization
    if (doCachesExist()) {
      console.log('[CacheManager] Caches already exist, skipping initialization');
      return true;
    }
    
    console.log('[CacheManager] Initializing all caches...');
    
    console.log('[CacheManager] Starting cache initialization...');
    // Initialize all caches in parallel
    const [artistsResult, tracksResult, recentTracksResult] = await Promise.allSettled([
      fetchAndCacheAllTimePeriods(),
      fetchAndCacheTopData(),
      fetchAndCacheRecentTracks()
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
    
    if (recentTracksResult.status === 'fulfilled') {
      console.log(`[CacheManager] Recent tracks cache initialized: ${recentTracksResult.value.trackCount} tracks`);
    } else {
      console.error('[CacheManager] Failed to initialize recent tracks cache:', recentTracksResult.reason);
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
    
    // Clear sessionStorage caches
    sessionStorage.removeItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    sessionStorage.removeItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    sessionStorage.removeItem(CACHE_KEYS.SPOTIFY_RECENT_TRACKS);
    
    // Clear QuickStats cache from sessionStorage
    if (typeof window !== 'undefined' && window.clearQuickStatsCache) {
      window.clearQuickStatsCache();
    } else {
      // Fallback: clear directly from sessionStorage
      try {
        sessionStorage.removeItem('quickStatsCache');
        console.log('[CacheManager] QuickStats cache cleared from sessionStorage');
      } catch (error) {
        console.warn('[CacheManager] Could not clear QuickStats cache:', error);
      }
    }
    
    // Clear QuickStats results cache from sessionStorage
    try {
      clearResultsCache();
      console.log('[CacheManager] QuickStats results cache cleared from sessionStorage');
    } catch (error) {
      console.warn('[CacheManager] Could not clear QuickStats results cache:', error);
    }
    
    // Clear recent tracks cache
    try {
      clearRecentTracksCache();
      console.log('[CacheManager] Recent tracks cache cleared from sessionStorage');
    } catch (error) {
      console.warn('[CacheManager] Could not clear recent tracks cache:', error);
    }
    
    console.log('[CacheManager] All caches cleared successfully');
    
  } catch (error) {
    console.error('[CacheManager] Error clearing caches:', error);
  }
};

/**
 * Check if caches are valid (always true since we don't use time-based expiration)
 */
export const areCachesValid = () => {
  try {
    // Since we don't use time-based expiration, caches are valid as long as they exist
    return doCachesExist();
    
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
    const artistsCache = sessionStorage.getItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    const tracksCache = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    const recentTracksCache = sessionStorage.getItem(CACHE_KEYS.SPOTIFY_RECENT_TRACKS);
    
    if (!artistsCache || !tracksCache || !recentTracksCache) return false;
    
    // Parse and check if they have actual data
    const artistsData = JSON.parse(artistsCache);
    const tracksData = JSON.parse(tracksCache);
    const recentTracksData = JSON.parse(recentTracksCache);
    
    // More lenient check - just ensure the data structures exist
    const hasArtists = artistsData && typeof artistsData === 'object' && artistsData.artists;
    const hasTracks = tracksData && Array.isArray(tracksData);
    const hasRecentTracks = recentTracksData && typeof recentTracksData === 'object' && recentTracksData.tracks;
    
    return hasArtists && hasTracks && hasRecentTracks;
    
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
    const artistsCache = sessionStorage.getItem(CACHE_KEYS.SPOTIFY_TOP_ARTISTS);
    const tracksCache = sessionStorage.getItem(CACHE_KEYS.UNIFIED_TOP_TRACKS);
    const recentTracksCache = sessionStorage.getItem(CACHE_KEYS.SPOTIFY_RECENT_TRACKS);
    
    return {
      exists: !!(artistsCache && tracksCache && recentTracksCache),
      valid: true, // Always valid since we don't use time-based expiration
      artistsCount: artistsCache ? JSON.parse(artistsCache)?.artists?.length || 0 : 0,
      tracksCount: tracksCache ? JSON.parse(tracksCache)?.length || 0 : 0,
      recentTracksCount: recentTracksCache ? JSON.parse(recentTracksCache)?.tracks?.length || 0 : 0
    };
    
  } catch (error) {
    console.error('[CacheManager] Error getting cache status:', error);
    return {
      exists: false,
      valid: false,
      artistsCount: 0,
      tracksCount: 0
    };
  }
};

/**
 * Setup cache monitoring for session changes
 * This should be called once when the app initializes
 */
export const setupCacheMonitoring = () => {
  try {
    console.log('[CacheManager] Setting up cache monitoring...');
    
    // Monitor for session changes instead of localStorage tokens
    
    const handleSessionChange = () => {
      // Check if user is still authenticated
      checkAuthStatus().then(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('[CacheManager] User not authenticated, clearing caches...');
          clearAllCaches();
        }
      });
    };
    
    // Monitor for token refresh events
    const handleTokenRefreshed = () => {
      console.log('[CacheManager] Session refreshed, caches remain valid');
      // No need to reinitialize caches on session refresh
    };
    
    // Add event listeners
    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    
    console.log('[CacheManager] Cache monitoring setup complete');
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
    };
    
  } catch (error) {
    console.error('[CacheManager] Error setting up cache monitoring:', error);
  }
};

// Clean up any existing localStorage tokens (security fix)
export const cleanupLocalStorageTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    console.log('🔒 Cleaned up localStorage tokens for security');
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
  setupCacheMonitoring,
  cleanupLocalStorageTokens
};
