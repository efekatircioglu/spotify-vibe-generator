// Recent Tracks Cache Utility
// Manages sessionStorage caching for user's recent tracks to avoid redundant API calls

const CACHE_KEY = 'spotify_recent_tracks';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Get cached recent tracks if they exist and are not expired
 * @returns {Array|null} Cached tracks array or null if not found/expired
 */
export const getCachedRecentTracks = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return null;
    }
    
    // Parse cached data
    const cacheObject = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - cacheObject.timestamp > CACHE_DURATION) {
      console.log('[RecentTracksCache] Cache expired, clearing...');
      clearRecentTracksCache();
      return null;
    }
    
    // Return cached tracks
    return cacheObject.tracks;
    
  } catch (error) {
    console.error('[RecentTracksCache] Error reading cache:', error);
    clearRecentTracksCache(); // Clear corrupted cache
    return null;
  }
};

/**
 * Set recent tracks in cache
 * @param {Array} tracks - Array of recent track objects
 */
export const setCachedRecentTracks = (tracks) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    const cacheObject = {
      tracks: tracks,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    
    console.log(`[RecentTracksCache] Cached ${tracks.length} recent tracks`);
    
  } catch (error) {
    console.error('[RecentTracksCache] Error caching tracks:', error);
  }
};

/**
 * Clear the recent tracks cache
 */
export const clearRecentTracksCache = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    sessionStorage.removeItem(CACHE_KEY);
    console.log('[RecentTracksCache] Cache cleared');
  } catch (error) {
    console.error('[RecentTracksCache] Error clearing cache:', error);
  }
};

/**
 * Check if cache exists and is valid (not expired)
 * @returns {boolean} True if cache exists and is valid
 */
export const isRecentTracksCacheValid = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }
    
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return false;
    }
    
    const cacheObject = JSON.parse(cachedData);
    const now = Date.now();
    
    return now - cacheObject.timestamp <= CACHE_DURATION;
  } catch (error) {
    console.error('[RecentTracksCache] Error checking cache validity:', error);
    return false;
  }
};

/**
 * Get cache info for debugging
 * @returns {Object} Cache information
 */
export const getRecentTracksCacheInfo = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return { exists: false, tracksCount: 0 };
    }
    
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return { exists: false, tracksCount: 0 };
    }
    
    const cacheObject = JSON.parse(cachedData);
    const isExpired = Date.now() - cacheObject.timestamp > CACHE_DURATION;
    
    return {
      exists: true,
      valid: !isExpired,
      tracksCount: cacheObject.tracks?.length || 0,
      timestamp: new Date(cacheObject.timestamp).toLocaleString(),
      age: Math.round((Date.now() - cacheObject.timestamp) / 1000 / 60) + ' minutes'
    };
  } catch (error) {
    console.error('[RecentTracksCache] Error getting cache info:', error);
    return { exists: false, tracksCount: 0 };
  }
};

/**
 * Fetch and cache recent tracks from API
 * @returns {Promise<Object>} Result object with success status and tracks
 */
export const fetchAndCacheRecentTracks = async () => {
  try {
    console.log('[RecentTracksCache] Fetching recent tracks from API...');
    
    const response = await fetch('http://127.0.0.1:8000/recent-tracks');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent tracks: ${response.status}`);
    }
    
    const data = await response.json();
    const tracks = data.tracks || [];
    
    // Cache the tracks
    setCachedRecentTracks(tracks);
    
    console.log(`[RecentTracksCache] Successfully cached ${tracks.length} recent tracks`);
    
    return {
      success: true,
      tracks: tracks,
      trackCount: tracks.length
    };
    
  } catch (error) {
    console.error('[RecentTracksCache] Error fetching recent tracks:', error);
    return {
      success: false,
      error: error.message,
      tracks: [],
      trackCount: 0
    };
  }
};
