// localStorage utilities for artist name -> Ticketmaster ID caching
import { safeSetItem, safeGetItem, safeRemoveItem } from './safeStorage';

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
  
  // Since we no longer store timestamps, keep entries in order they were added
  // This is a simple FIFO (First In, First Out) approach
  const cleanedCache = {};
  const entriesToKeep = Math.floor(MAX_CACHE_ENTRIES * 0.7); // Keep 70% of max
  
  // Keep the first entries (oldest) to maintain some cache history
  for (let i = 0; i < Math.min(entriesToKeep, entries.length); i++) {
    const [key, value] = entries[i];
    cleanedCache[key] = value;
  }
  
  return cleanedCache;
};

export const getArtistCache = () => {
  try {
    return safeGetItem(CACHE_KEY, {});
  } catch (error) {
    console.error('Error reading artist cache:', error);
    // If reading fails, try to clear and start fresh
    try {
      safeRemoveItem(CACHE_KEY);
    } catch (clearError) {
      console.error('Error clearing corrupted cache:', clearError);
    }
    return {};
  }
};

export const setArtistCache = (artistName, ticketmasterId, imageUrl = null, spotifyId = null) => {
  try {
    // Validate inputs
    if (!artistName || typeof artistName !== 'string' || artistName.trim() === '') {
      console.error('Invalid artist name provided to setArtistCache:', artistName);
      return;
    }
    
    if (!ticketmasterId || typeof ticketmasterId !== 'string') {
      console.error('Invalid ticketmaster ID provided to setArtistCache:', ticketmasterId);
      return;
    }
    
    let cache = getArtistCache();
    
    // Ensure cache is an object
    if (typeof cache !== 'object' || cache === null) {
      console.warn('Cache was not an object, initializing new cache');
      cache = {};
    }
    
    // Add artist data to cache (without timestamp for new items)
    cache[artistName.toLowerCase()] = {
      id: ticketmasterId,
      image: imageUrl,
      spotifyId: spotifyId
    };
    
    // Check if cache is getting too large
    const estimatedSize = estimateCacheSize(cache);
    
    if (estimatedSize > MAX_CACHE_SIZE || Object.keys(cache).length > MAX_CACHE_ENTRIES) {
      console.warn('Cache size limit reached, cleaning old entries...');
      const cleanedCache = cleanCache(cache);
      
      // Try to save the cleaned cache
      const saveSuccess = safeSetItem(CACHE_KEY, cleanedCache);
      if (saveSuccess) {
        console.log('Cache cleaned and saved successfully');
      } else {
        console.warn('Cannot save cleaned cache - storage quota exceeded');
      }
    } else {
      // Normal save operation
      const saveSuccess = safeSetItem(CACHE_KEY, cache);
      if (!saveSuccess) {
        console.warn('Cannot save cache - storage quota exceeded');
      }
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

export const clearSpecificArtistCache = (artistName) => {
  try {
    if (!artistName || typeof artistName !== 'string') {
      console.error('Invalid artist name provided to clearSpecificArtistCache:', artistName);
      return;
    }
    
    let cache = getArtistCache();
    if (cache && typeof cache === 'object') {
      delete cache[artistName.toLowerCase()];
      safeSetItem(CACHE_KEY, cache);
      console.log(`Cleared cache for artist: ${artistName}`);
    }
  } catch (error) {
    console.error('Error clearing specific artist cache:', error);
  }
};

// New function specifically for caching Spotify artist data (without requiring ticketmaster ID)
export const setSpotifyArtistCache = (artistName, imageUrl, spotifyId) => {
  try {
    // Validate inputs
    if (!artistName || typeof artistName !== 'string' || artistName.trim() === '') {
      console.error('Invalid artist name provided to setSpotifyArtistCache:', artistName);
      return;
    }
    
    if (!spotifyId || typeof spotifyId !== 'string') {
      console.error('Invalid Spotify ID provided to setSpotifyArtistCache:', spotifyId);
      return;
    }
    
    let cache = getArtistCache();
    
    // Ensure cache is an object
    if (typeof cache !== 'object' || cache === null) {
      console.warn('Cache was not an object, initializing new cache');
      cache = {};
    }
    
    // Add or update Spotify artist data in cache
    const existingData = cache[artistName.toLowerCase()] || {};
    cache[artistName.toLowerCase()] = {
      ...existingData,
      image: imageUrl,
      spotifyId: spotifyId
    };
    
    // Check if cache is getting too large
    const estimatedSize = estimateCacheSize(cache);
    
    if (estimatedSize > MAX_CACHE_SIZE || Object.keys(cache).length > MAX_CACHE_ENTRIES) {
      console.warn('Cache size limit reached, cleaning old entries...');
      const cleanedCache = cleanCache(cache);
      
      // Try to save the cleaned cache
      const saveSuccess = safeSetItem(CACHE_KEY, cleanedCache);
      if (saveSuccess) {
        console.log('Cache cleaned and saved successfully');
      } else {
        console.warn('Cannot save cleaned cache - storage quota exceeded');
      }
    } else {
      // Normal save operation
      const saveSuccess = safeSetItem(CACHE_KEY, cache);
      if (!saveSuccess) {
        console.warn('Cannot save cache - storage quota exceeded');
      }
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
      console.error('Error writing Spotify artist cache:', error);
    }
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