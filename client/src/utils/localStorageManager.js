// Global localStorage manager with quota protection and automatic cleanup
class LocalStorageManager {
  constructor() {
    this.maxTotalSize = 45 * 1024 * 1024; // 45MB total limit (leaving 5MB buffer)
    this.cacheKeys = new Set();
    this.initializeCacheKeys();
  }

  // Initialize known cache keys from the application
  initializeCacheKeys() {
    this.cacheKeys.add('artistNameToTicketmasterId');
    this.cacheKeys.add('trackAnalysisCache');
    this.cacheKeys.add('recent_artist_searches');
    // Add other cache keys as needed
  }

  // Check if localStorage is available and has space
  isAvailable() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get total size of all cached data
  getTotalSize() {
    let totalSize = 0;
    try {
      for (const key of this.cacheKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
    } catch (error) {
      console.error('Error calculating total cache size:', error);
    }
    return totalSize;
  }

  // Check if adding new data would exceed quota
  wouldExceedQuota(newDataSize) {
    const currentSize = this.getTotalSize();
    return (currentSize + newDataSize) > this.maxTotalSize;
  }

  // Clean all caches when storage is full
  emergencyCleanup() {
    console.warn('Emergency localStorage cleanup initiated');
    
    try {
      // Clear all known caches
      for (const key of this.cacheKeys) {
        try {
          localStorage.removeItem(key);
          console.log(`Cleared cache: ${key}`);
        } catch (error) {
          console.error(`Error clearing cache ${key}:`, error);
        }
      }
      
      // Clear any other large items that might be taking space
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key && !this.cacheKeys.has(key)) {
            const size = new Blob([localStorage.getItem(key)]).size;
            if (size > 1024 * 1024) { // Clear items larger than 1MB
              localStorage.removeItem(key);
              console.log(`Cleared large item: ${key} (${size} bytes)`);
            }
          }
        } catch (error) {
          // Skip problematic items
        }
      }
      
      console.log('Emergency cleanup completed');
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
    }
  }

  // Safe setItem with quota protection
  safeSetItem(key, value) {
    try {
      const dataSize = new Blob([JSON.stringify(value)]).size;
      
      // Check if this would exceed quota
      if (this.wouldExceedQuota(dataSize)) {
        console.warn(`Data size ${dataSize} bytes would exceed quota, initiating cleanup...`);
        this.emergencyCleanup();
        
        // Try to save again after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(value));
          console.log(`Data saved after cleanup: ${key}`);
          return true;
        } catch (retryError) {
          console.error(`Failed to save data after cleanup: ${key}`, retryError);
          return false;
        }
      }
      
      // Normal save operation
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        console.warn('Quota exceeded, attempting emergency cleanup...');
        this.emergencyCleanup();
        
        // Try one more time
        try {
          localStorage.setItem(key, JSON.stringify(value));
          console.log(`Data saved after quota error: ${key}`);
          return true;
        } catch (retryError) {
          console.error(`Failed to save data after quota error: ${key}`, retryError);
          return false;
        }
      } else {
        console.error(`Error saving data: ${key}`, error);
        return false;
      }
    }
  }

  // Safe getItem with error handling
  safeGetItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading data: ${key}`, error);
      // Try to clear corrupted data
      try {
        localStorage.removeItem(key);
      } catch (clearError) {
        console.error(`Error clearing corrupted data: ${key}`, clearError);
      }
      return null;
    }
  }

  // Safe removeItem
  safeRemoveItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data: ${key}`, error);
      return false;
    }
  }

  // Get storage statistics
  getStorageStats() {
    try {
      const stats = {
        totalSize: this.getTotalSize(),
        maxSize: this.maxTotalSize,
        availableSpace: this.maxTotalSize - this.getTotalSize(),
        cacheKeys: Array.from(this.cacheKeys),
        localStorageLength: localStorage.length
      };
      
      // Get individual cache sizes
      stats.cacheSizes = {};
      for (const key of this.cacheKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            stats.cacheSizes[key] = new Blob([data]).size;
          }
        } catch (error) {
          stats.cacheSizes[key] = 'error';
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }

  // Clear all application caches
  clearAllCaches() {
    console.log('Clearing all application caches...');
    for (const key of this.cacheKeys) {
      this.safeRemoveItem(key);
    }
    console.log('All caches cleared');
  }
}

// Export singleton instance
export const localStorageManager = new LocalStorageManager();

// Export utility functions for backward compatibility
export const safeSetItem = (key, value) => localStorageManager.safeSetItem(key, value);
export const safeGetItem = (key) => localStorageManager.safeGetItem(key, value);
export const safeRemoveItem = (key) => localStorageManager.safeRemoveItem(key);
export const getStorageStats = () => localStorageManager.getStorageStats();
export const clearAllCaches = () => localStorageManager.clearAllCaches();
export const isStorageAvailable = () => localStorageManager.isAvailable();
