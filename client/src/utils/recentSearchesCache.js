// Protected cache for recent artist searches with localStorage quota management
import { safeSetItem, safeGetItem, safeRemoveItem } from './safeStorage';

const RECENT_SEARCHES_KEY = 'recent_artist_searches';
const MAX_RECENT_SEARCHES = 5; // Strict limit: exactly 5 recent searches
const MAX_CACHE_SIZE = 1 * 1024 * 1024; // 1MB limit (reduced for safety)

// Helper function to estimate cache size
const estimateCacheSize = (searches) => {
  try {
    return new Blob([JSON.stringify(searches)]).size;
  } catch (error) {
    // Fallback: rough estimation based on string length
    return JSON.stringify(searches).length * 2; // UTF-16 characters
  }
};

// Helper function to ensure exactly 5 entries (FIFO - First In, First Out)
const enforceMaxEntries = (searches) => {
  if (searches.length <= MAX_RECENT_SEARCHES) return searches;
  
  // Keep only the first 5 entries (remove oldest ones from the end)
  // Since new entries are added to the beginning, this maintains FIFO order
  return searches.slice(0, MAX_RECENT_SEARCHES);
};

// Safe get function with error handling
export const getRecentSearches = () => {
  try {
    const cached = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!cached) return [];
    
    const parsed = JSON.parse(cached);
    // Ensure we never return more than 5 entries
    return enforceMaxEntries(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('Error reading recent searches cache:', error);
    // If reading fails, try to clear and start fresh
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (clearError) {
      console.error('Error clearing corrupted recent searches cache:', clearError);
    }
    return [];
  }
};

// Safe save function with strict capacity management
export const saveRecentSearch = (artistObj) => {
  try {
    const spotifyId = artistObj.spotifyId || artistObj.id;
    const name = artistObj.name;
    
    if (!spotifyId || !name) {
      // Do not add entry if no valid Spotify ID or name
      return false;
    }
    
    let searches = getRecentSearches();
    
    // Remove any previous entry with the same name or spotifyId
    searches = searches.filter(
      s => s.name !== name && s.spotifyId !== spotifyId
    );
    
    const entry = {
      name,
      spotifyId,
      image: artistObj.image || (artistObj.images && artistObj.images[0]?.url) || null,
      ticketmasterId: artistObj.ticketmasterId || null
    };
    
    // Add new entry to the beginning
    searches = [entry, ...searches];
    
    // Enforce exactly 5 entries maximum
    searches = enforceMaxEntries(searches);
    
    // Check if this would exceed storage capacity
    const estimatedSize = estimateCacheSize(searches);
    
    if (estimatedSize > MAX_CACHE_SIZE) {
      console.warn('Recent searches would exceed storage capacity, clearing cache...');
      
      // If even 5 entries are too large, clear everything and try with just the new entry
      try {
        const singleEntry = [entry];
        const singleEntrySize = estimateCacheSize(singleEntry);
        
        if (singleEntrySize <= MAX_CACHE_SIZE) {
          // Save just the single entry
          const saveSuccess = safeSetItem(RECENT_SEARCHES_KEY, singleEntry);
          if (saveSuccess) {
            console.log('Saved single entry due to storage constraints');
          } else {
            console.warn('Cannot save single entry - storage quota exceeded');
          }
          return true;
        } else {
          // Even a single entry is too large, clear everything
          localStorage.removeItem(RECENT_SEARCHES_KEY);
          console.log('Cleared cache - even single entry exceeds capacity');
          return false;
        }
      } catch (clearError) {
        console.error('Error during capacity cleanup:', clearError);
        return false;
      }
    }
    
    // Normal save operation with guaranteed 5-entry limit
    try {
      const saveSuccess = safeSetItem(RECENT_SEARCHES_KEY, searches);
      if (saveSuccess) {
        return true;
      } else {
        console.warn('Cannot save searches - storage quota exceeded');
        return false;
      }
    } catch (saveError) {
      if (saveError.name === 'QuotaExceededError' || saveError.message.includes('quota')) {
        console.warn('localStorage quota exceeded, attempting emergency cleanup...');
        
        // Try to save with fewer entries
        for (let i = searches.length - 1; i >= 1; i--) {
          const reducedSearches = searches.slice(0, i);
          const reducedSize = estimateCacheSize(reducedSearches);
          
          if (reducedSize <= MAX_CACHE_SIZE) {
            try {
                          const saveSuccess = safeSetItem(RECENT_SEARCHES_KEY, reducedSearches);
            if (saveSuccess) {
              console.log(`Saved with ${i} entries after quota error`);
              return true;
            } else {
              console.warn('Cannot save reduced searches - storage quota exceeded');
              continue;
            }
            } catch (retryError) {
              continue; // Try with even fewer entries
            }
          }
        }
        
        // Last resort: try to save just the new entry
        try {
          const singleEntry = [entry];
          const saveSuccess = safeSetItem(RECENT_SEARCHES_KEY, singleEntry);
          if (saveSuccess) {
            console.log('Saved single entry after quota error');
            return true;
          } else {
            console.warn('Cannot save single entry after quota error - storage quota exceeded');
            return false;
          }
        } catch (finalError) {
          // Complete failure - clear everything
          try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
            console.log('Cache cleared due to persistent quota issues');
          } catch (clearError) {
            console.error('Error clearing cache:', clearError);
          }
          return false;
        }
      } else {
        console.error('Error writing recent searches cache:', saveError);
        return false;
      }
    }
  } catch (error) {
    console.error('Unexpected error in saveRecentSearch:', error);
    return false;
  }
};

// Update ticketmasterId in existing search entry
export const updateTicketmasterIdInRecentSearch = (artistName, ticketmasterId, artistObj) => {
  try {
    let searches = getRecentSearches();
    let foundIdx = searches.findIndex(a => a.name.toLowerCase() === artistName.toLowerCase());
    
    // Always build the full structure
    const entry = {
      name: artistName,
      spotifyId: artistObj.spotifyId || artistObj.id || null,
      image: artistObj.image || (artistObj.images && artistObj.images[0] && artistObj.images[0].url) || null,
      ticketmasterId: ticketmasterId || null
    };
    
    if (foundIdx !== -1) {
      // Update existing entry
      searches[foundIdx] = entry;
    } else {
      // Add new entry and enforce 5-entry limit
      searches = [entry, ...searches];
      searches = enforceMaxEntries(searches);
    }
    
    // Use the safe save function
    return saveRecentSearch(entry);
  } catch (error) {
    console.error('Error updating ticketmasterId in recent search:', error);
    return false;
  }
};

// Get ticketmasterId from recent searches
export const getTicketmasterIdFromRecentSearch = (artistName) => {
  try {
    const searches = getRecentSearches();
    const found = searches.find(a => a.name.toLowerCase() === artistName.toLowerCase());
    return found?.ticketmasterId || null;
  } catch (error) {
    console.error('Error getting ticketmasterId from recent search:', error);
    return null;
  }
};

// Clear recent searches cache
export const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing recent searches cache:', error);
    return false;
  }
};

// Get cache statistics
export const getRecentSearchesStats = () => {
  try {
    const searches = getRecentSearches();
    const size = estimateCacheSize(searches);
    return {
      totalEntries: searches.length,
      maxEntries: MAX_RECENT_SEARCHES,
      estimatedSize: size,
      maxSize: MAX_CACHE_SIZE,
      usagePercent: (size / MAX_CACHE_SIZE) * 100,
      isAtCapacity: searches.length >= MAX_RECENT_SEARCHES
    };
  } catch (error) {
    console.error('Error getting recent searches stats:', error);
    return null;
  }
};

// Force cleanup to ensure exactly 5 entries
export const forceCleanupRecentSearches = () => {
  try {
    const searches = getRecentSearches();
    const cleanedSearches = enforceMaxEntries(searches);
    
    if (cleanedSearches.length !== searches.length) {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(cleanedSearches));
      console.log(`Forced cleanup: reduced from ${searches.length} to ${cleanedSearches.length} entries`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error during forced cleanup:', error);
    return false;
  }
};

// Demo function to show how the 5-entry limit works (development only)
export const demoRecentSearchesLimit = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🧪 Demo: Recent Searches 5-Entry Limit');
  console.log('=====================================');
  
  // Clear existing cache
  clearRecentSearches();
  
  // Add 6 entries to demonstrate the limit
  const testArtists = [
    { name: 'Artist 1', spotifyId: 'id1', ticketmasterId: 'tm1' },
    { name: 'Artist 2', spotifyId: 'id2', ticketmasterId: 'tm2' },
    { name: 'Artist 3', spotifyId: 'id3', ticketmasterId: 'tm3' },
    { name: 'Artist 4', spotifyId: 'id4', ticketmasterId: 'tm4' },
    { name: 'Artist 5', spotifyId: 'id5', ticketmasterId: 'tm5' },
    { name: 'Artist 6', spotifyId: 'id6', ticketmasterId: 'tm6' }
  ];
  
  testArtists.forEach((artist, index) => {
    console.log(`\n📝 Adding Artist ${index + 1}: ${artist.name}`);
    const success = saveRecentSearch(artist);
    const currentSearches = getRecentSearches();
    console.log(`   Success: ${success ? '✅' : '❌'}`);
    console.log(`   Current entries: ${currentSearches.length}/5`);
    console.log(`   Entries: ${currentSearches.map(s => s.name).join(', ')}`);
  });
  
  console.log('\n🎯 Final Result:');
  const finalSearches = getRecentSearches();
  console.log(`   Total entries: ${finalSearches.length}/5`);
  console.log(`   Entries: ${finalSearches.map(s => s.name).join(', ')}`);
  console.log(`   Note: Artist 1 was automatically removed when Artist 6 was added (FIFO order maintained)`);
  
  // Clean up demo data
  clearRecentSearches();
  console.log('\n🧹 Demo cache cleared');
};

