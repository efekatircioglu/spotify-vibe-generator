/**
 * Safe localStorage operations that handle quota exceeded errors gracefully
 */

/**
 * Safely set an item in localStorage
 * @param {string} key - The key to store
 * @param {any} value - The value to store
 * @param {boolean} silent - If true, don't log warnings
 * @returns {boolean} - True if successful, false if quota exceeded
 */
export const safeSetItem = (key, value, silent = false) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      if (!silent) {
        console.warn(`Storage quota exceeded for key: ${key}. Cannot save new data.`);
      }
      return false;
    } else {
      // Re-throw other errors
      throw error;
    }
  }
};

/**
 * Safely get an item from localStorage
 * @param {string} key - The key to retrieve
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - The stored value or default
 */
export const safeGetItem = (key, defaultValue = null) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    try {
      return JSON.parse(item);
    } catch {
      return item; // Return as string if not JSON
    }
  } catch (error) {
    console.warn(`Error reading from localStorage for key: ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Safely remove an item from localStorage
 * @param {string} key - The key to remove
 * @returns {boolean} - True if successful
 */
export const safeRemoveItem = (key) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage for key: ${key}:`, error);
    return false;
  }
};

/**
 * Check if localStorage has available space
 * @param {number} requiredBytes - Bytes needed
 * @returns {boolean} - True if space is available
 */
export const hasStorageSpace = (requiredBytes = 0) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    // Test if we can write a small amount
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(Math.max(100, requiredBytes));
    
    try {
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.warn('Error checking storage space:', error);
    return false;
  }
};

/**
 * Get current localStorage usage info
 * @returns {object} - Usage information
 */
export const getStorageInfo = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { keyCount: 0, totalSize: 0, totalSizeMB: '0.00' };
  }
  
  try {
    let totalSize = 0;
    let keyCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalSize += new Blob([key, value]).size;
      keyCount++;
    }
    
    return {
      keyCount,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.warn('Error getting storage info:', error);
    return { keyCount: 0, totalSize: 0, totalSizeMB: '0.00' };
  }
};
