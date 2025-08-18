# localStorage Protection & Management

This application now includes comprehensive protection against localStorage quota exceeded errors, which can cause crashes when the browser's storage limit is reached.

## 🚨 Problem Solved

**Before**: The app would crash with errors like:
```
Error: Failed to execute 'setItem' on 'Storage': Setting the value of 'artistNameToTicketmasterId' exceeded the quota.
```

**After**: The app automatically manages storage, cleans up old data, and prevents crashes.

## 🛡️ Protection Features

### 1. **Automatic Size Monitoring**
- Tracks total localStorage usage across all caches
- Prevents adding data that would exceed quota
- Monitors individual cache sizes

### 2. **Smart Cache Cleanup**
- Automatically removes old entries when storage is full
- Keeps most recent data (70% of max entries)
- Timestamps all cache entries for intelligent cleanup

### 3. **Emergency Cleanup**
- When quota is exceeded, automatically clears all caches
- Removes large items that might be taking space
- Graceful fallback to prevent app crashes

### 4. **Size Limits**
- **Artist Cache**: 5MB, 1000 entries max
- **Track Analysis Cache**: 10MB, 2000 entries max
- **Recent Searches Cache**: 1MB, 5 entries max (strict FIFO limit)
- **Total App Storage**: 45MB limit (leaving 5MB buffer)

## 🔧 How It Works

### **Artist Cache (`artistCache.js`)**
```javascript
// Automatically adds timestamps and manages size
setArtistCache('Artist Name', 'ticketmasterId', 'imageUrl', 'spotifyId');
```

### **Track Analysis Cache (`trackAnalysisCache.js`)**
```javascript
// Automatically manages size and cleans up old entries
setTrackISRC(spotifyId, isrc);
setTrackMBID(spotifyId, mbid);
setTrackAnalysis(spotifyId, analysis);
```

### **Recent Searches Cache (`recentSearchesCache.js`)**
```javascript
// Automatically manages size and cleans up old entries
saveRecentSearch(artistObj);
updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
getTicketmasterIdFromRecentSearch(artistName);
```

**FIFO Behavior**: 
- **Strict 5-entry limit**: Never exceeds 5 recent searches
- **Automatic removal**: When adding a 6th entry, the oldest one is automatically removed
- **Storage safety**: Even if localStorage is full, it will clear space to maintain the 5-entry limit
- **Guaranteed operation**: Will always work regardless of storage conditions

### **Global Storage Manager (`localStorageManager.js`)**
```javascript
// Provides safe storage operations with quota protection
import { localStorageManager } from './utils/localStorageManager';

localStorageManager.safeSetItem('key', value);
localStorageManager.safeGetItem('key');
localStorageManager.emergencyCleanup();
```

## 📊 Monitoring & Debugging

### **Development Console**
In development mode, storage stats are automatically logged:
```
🔍 localStorage Stats: {
  Total Size: 2.45 MB
  Available Space: 42.55 MB
  Usage: 5.4%
  Cache Keys: 2
  localStorage Items: 15
}
```

### **Manual Monitoring**
```javascript
import { logStorageStats, checkStorageHealth } from './utils/storageMonitor';

// Log current storage status
logStorageStats();

// Check storage health
const health = checkStorageHealth();
console.log(health); // { healthy: true, level: 'good', ... }
```

### **Browser Console Commands** (Development Only)
```javascript
// Get storage statistics
window.storageMonitor.getStats();

// Clear all caches
window.storageMonitor.clearAll();

// Force emergency cleanup
window.storageMonitor.emergencyCleanup();

// Check if storage is available
window.storageMonitor.isAvailable();
```

## 🚀 Usage Examples

### **Safe Storage Operations**
```javascript
import { safeSetItem, safeGetItem } from './utils/localStorageManager';

// Safe set - won't crash if storage is full
const success = safeSetItem('myKey', myData);
if (!success) {
  console.log('Storage is full, data not saved');
}

// Safe get - handles corrupted data gracefully
const data = safeGetItem('myKey');
```

### **Cache Management**
```javascript
import { clearAllCaches } from './utils/localStorageManager';

// Clear all application caches
clearAllCaches();
```

## 🔍 Troubleshooting

### **If Storage Still Gets Full**
1. Check console for storage warnings
2. Use `window.storageMonitor.getStats()` to see usage
3. Manually clear caches with `window.storageMonitor.clearAll()`
4. Check if other browser extensions are using localStorage

### **If App Still Crashes**
1. Check browser console for error messages
2. Verify storage monitor is imported in main page
3. Check if localStorage is available in browser
4. Clear browser data and restart

## 📈 Performance Impact

- **Minimal**: Size checking adds ~1-2ms per cache operation
- **Automatic**: Cleanup happens in background when needed
- **Smart**: Only cleans up when storage is actually getting full
- **Efficient**: Uses Blob API for accurate size estimation

## 🎯 Best Practices

1. **Always use safe storage functions** for new cache implementations
2. **Monitor storage usage** in development
3. **Set reasonable size limits** for new caches
4. **Implement cache expiration** for time-sensitive data
5. **Test with large datasets** to ensure protection works

## 🔄 Migration

Existing code continues to work unchanged. The protection is automatically applied to:
- `artistCache.js` - Artist name to Ticketmaster ID mapping
- `trackAnalysisCache.js` - Track ISRC/MBID/analysis data
- `recentSearchesCache.js` - Recent artist searches and ticketmaster IDs
- Any new caches using the `localStorageManager`

## 📝 Configuration

Storage limits can be adjusted in the respective cache files:
```javascript
// In artistCache.js
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CACHE_ENTRIES = 1000; // 1000 entries

// In trackAnalysisCache.js  
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CACHE_ENTRIES = 2000; // 2000 entries

// In recentSearchesCache.js
const MAX_CACHE_SIZE = 1 * 1024 * 1024; // 1MB (reduced for safety)
const MAX_RECENT_SEARCHES = 5; // 5 entries (strict FIFO limit)
```
