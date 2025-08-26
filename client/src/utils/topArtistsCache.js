// Top Artists Cache Utility
// Manages localStorage caching for user's top artists to avoid redundant API calls

const CACHE_KEY = 'spotify_top_artists';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (1 day) in milliseconds

/**
 * Get cached top artists if they exist and are not expired
 * @returns {Array|null} Cached artists array or null if not found/expired
 */
export const getCachedTopArtists = () => {
  try {
    // Check if cache exists
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      console.log('[TopArtistsCache] No cached data found');
      return null;
    }
    
    // Parse cached data
    const cacheObject = JSON.parse(cachedData);
    
    // Check if cache is expired
    const now = Date.now();
    
    if (now > cacheObject.expiry) {
      console.log('[TopArtistsCache] Cache expired, clearing...');
      clearTopArtistsCache();
      return null;
    }
    
    // Return cached artists
    console.log(`[TopArtistsCache] Cache hit! Found ${cacheObject.artists.length} artists`);
    return cacheObject.artists;
    
  } catch (error) {
    console.error('[TopArtistsCache] Error reading cache:', error);
    clearTopArtistsCache(); // Clear corrupted cache
    return null;
  }
};

/**
 * Cache top artists with expiry timestamp
 * @param {Array} artists - Array of artist objects
 */
export const setCachedTopArtists = (artists) => {
  try {
    const expiryTime = Date.now() + CACHE_DURATION;
    
    const cacheObject = {
      artists: artists,
      expiry: expiryTime
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    
    console.log(`[TopArtistsCache] Cached ${artists.length} artists for 24 hours`);
    console.log(`[TopArtistsCache] Cache expires at: ${new Date(expiryTime).toLocaleString()}`);
    
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
      return { exists: false, expired: false, artistsCount: 0, timeRemaining: 0 };
    }
    
    const cacheObject = JSON.parse(cachedData);
    const now = Date.now();
    
    return {
      exists: true,
      expired: now > cacheObject.expiry,
      artistsCount: cacheObject.artists.length,
      timeRemaining: Math.max(0, cacheObject.expiry - now),
      timeRemainingMinutes: Math.max(0, Math.floor((cacheObject.expiry - now) / (60 * 1000)))
    };
  } catch (error) {
    console.error('[TopArtistsCache] Error getting cache info:', error);
    return { exists: false, expired: false, artistsCount: 0, timeRemaining: 0 };
  }
};
