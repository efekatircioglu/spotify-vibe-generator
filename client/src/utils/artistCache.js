// localStorage utilities for artist name -> Ticketmaster ID caching
const CACHE_KEY = 'artistNameToTicketmasterId';
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit
const MAX_CACHE_ENTRIES = 1000; // Maximum number of cached artists

// Helper function to estimate cache size
const estimateCacheSize = (cache) => {
  try {
    return new Blob([JSON.stringify(cache)]).size;
  } catch (error) {
    // Fallback: rough estimation based on string length
    return JSON.stringify(cache).length * 2; // UTF-16 characters
  }
};

// Helper function to clean old cache entries
const cleanCache = (cache) => {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_CACHE_ENTRIES / 2) return cache; // Don't clean if cache is small
  
  // Sort by timestamp (if available) or keep most recent entries
  const sortedEntries = entries.sort((a, b) => {
    const aTime = a[1].timestamp || 0;
    const bTime = b[1].timestamp || 0;
    return bTime - aTime;
  });
  
  // Keep only the most recent entries
  const cleanedCache = {};
  const entriesToKeep = Math.floor(MAX_CACHE_ENTRIES * 0.7); // Keep 70% of max
  
  for (let i = 0; i < Math.min(entriesToKeep, sortedEntries.length); i++) {
    const [key, value] = sortedEntries[i];
    cleanedCache[key] = value;
  }
  
  return cleanedCache;
};

export const getArtistCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading artist cache:', error);
    // If reading fails, try to clear and start fresh
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (clearError) {
      console.error('Error clearing corrupted cache:', clearError);
    }
    return {};
  }
};

export const setArtistCache = (artistName, ticketmasterId, imageUrl = null, spotifyId = null) => {
  try {
    const cache = getArtistCache();
    
    // Add timestamp for cache management
    cache[artistName.toLowerCase()] = {
      id: ticketmasterId,
      image: imageUrl,
      spotifyId: spotifyId,
      timestamp: Date.now()
    };
    
    // Check if cache is getting too large
    const estimatedSize = estimateCacheSize(cache);
    
    if (estimatedSize > MAX_CACHE_SIZE || Object.keys(cache).length > MAX_CACHE_ENTRIES) {
      console.warn('Cache size limit reached, cleaning old entries...');
      const cleanedCache = cleanCache(cache);
      
      // Try to save the cleaned cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
        console.log('Cache cleaned and saved successfully');
      } catch (cleanError) {
        console.error('Error saving cleaned cache:', cleanError);
        // If even the cleaned cache fails, clear everything
        try {
          localStorage.removeItem(CACHE_KEY);
          console.log('Cache cleared due to storage issues');
        } catch (clearError) {
          console.error('Error clearing cache:', clearError);
        }
        return;
      }
    } else {
      // Normal save operation
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      console.warn('localStorage quota exceeded, attempting to clean cache...');
      
      try {
        // Try to clean the cache and save again
        const cache = getArtistCache();
        const cleanedCache = cleanCache(cache);
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
        console.log('Cache cleaned and saved after quota error');
      } catch (cleanError) {
        console.error('Failed to clean cache after quota error:', cleanError);
        // Last resort: clear everything
        try {
          localStorage.removeItem(CACHE_KEY);
          console.log('Cache cleared due to persistent quota issues');
        } catch (clearError) {
          console.error('Error clearing cache:', clearError);
        }
      }
    } else {
      console.error('Error writing artist cache:', error);
    }
  }
};

export const getCachedArtistId = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached ? (typeof cached === 'string' ? cached : cached.id) : null;
};

export const getCachedArtistImage = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached && typeof cached === 'object' ? cached.image : null;
};

export const getCachedSpotifyId = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached && typeof cached === 'object' ? cached.spotifyId : null;
};

export const clearArtistCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing artist cache:', error);
  }
};

export const getCacheStats = () => {
  try {
    const cache = getArtistCache();
    return {
      total: Object.keys(cache).length,
      valid: Object.keys(cache).length,
      expired: 0
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total: 0, valid: 0, expired: 0 };
  }
}; 