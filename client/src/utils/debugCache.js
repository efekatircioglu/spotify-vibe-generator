// Debug script for cache troubleshooting
// Run this in the browser console to check cache status

import { getCacheStatus, doCachesExist, forceRefreshAllCaches } from './cacheManager.js';

/**
 * Debug cache status
 */
export const debugCacheStatus = () => {
  console.log('🔍 Debugging cache status...');
  
  // Check centralized cache status
  const status = getCacheStatus();
  console.log('📊 Cache Status:', status);
  
  // Check if caches exist
  const exists = doCachesExist();
  console.log('✅ Caches exist:', exists);
  
      // Check sessionStorage directly
    const artistsCache = sessionStorage.getItem('spotify_top_artists');
    const tracksCache = sessionStorage.getItem('unified_top_tracks');
    const recentTracksCache = sessionStorage.getItem('spotify_recent_tracks');
  const timestamp = localStorage.getItem('cache_timestamp');
  
  console.log('🎵 Artists cache:', artistsCache ? 'EXISTS' : 'MISSING');
  console.log('🎧 Tracks cache:', tracksCache ? 'EXISTS' : 'MISSING');
  console.log('🕐 Recent tracks cache:', recentTracksCache ? 'EXISTS' : 'MISSING');
  console.log('⏰ Cache timestamp:', timestamp ? 'EXISTS' : 'MISSING');
  
  if (artistsCache) {
    try {
      const artistsData = JSON.parse(artistsCache);
      console.log('👥 Artists data:', {
        count: artistsData?.artists?.length || 0,
        hasArtists: !!artistsData?.artists,
        structure: Object.keys(artistsData || {})
      });
    } catch (e) {
      console.error('❌ Error parsing artists cache:', e);
    }
  }
  
  if (tracksCache) {
    try {
      const tracksData = JSON.parse(tracksCache);
      console.log('🎵 Tracks data:', {
        count: tracksData?.length || 0,
        hasTracks: !!tracksData,
        structure: Array.isArray(tracksData) ? 'Array' : typeof tracksData
      });
    } catch (e) {
      console.error('❌ Error parsing tracks cache:', e);
    }
  }
  
  if (recentTracksCache) {
    try {
      const recentTracksData = JSON.parse(recentTracksCache);
      console.log('🕐 Recent tracks data:', {
        count: recentTracksData?.tracks?.length || 0,
        hasTracks: !!recentTracksData?.tracks,
        timestamp: new Date(recentTracksData?.timestamp).toLocaleString(),
        structure: Object.keys(recentTracksData || {})
      });
    } catch (e) {
      console.error('❌ Error parsing recent tracks cache:', e);
    }
  }
  
  
  return { status, exists, artistsCache: !!artistsCache, tracksCache: !!tracksCache, recentTracksCache: !!recentTracksCache };
};

/**
 * Force refresh all caches
 */
export const refreshCaches = async () => {
  console.log('🔄 Force refreshing all caches...');
  try {
    const result = await forceRefreshAllCaches();
    console.log('✅ Cache refresh result:', result);
    
    // Check status after refresh
    setTimeout(() => {
      debugCacheStatus();
    }, 1000);
    
    return result;
  } catch (error) {
    console.error('❌ Error refreshing caches:', error);
    return false;
  }
};

/**
 * Clear all caches
 */
export const clearCaches = () => {
  console.log('🗑️ Clearing all caches...');
      sessionStorage.removeItem('spotify_top_artists');
    sessionStorage.removeItem('unified_top_tracks');
    sessionStorage.removeItem('spotify_recent_tracks');
  localStorage.removeItem('cache_timestamp');
  console.log('✅ Caches cleared');
  
  // Check status after clearing
  setTimeout(() => {
    debugCacheStatus();
  }, 100);
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugCacheStatus = debugCacheStatus;
  window.refreshCaches = refreshCaches;
  window.clearCaches = clearCaches;
}
