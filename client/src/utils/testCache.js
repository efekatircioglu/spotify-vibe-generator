// Test script for TopArtistsCache
// Run this in the browser console to test the cache functionality

import { 
  getCachedTopArtists, 
  forceRefreshArtistsCache, 
  inspectTopArtistsCache,
  clearTopArtistsCache,
  getTopArtistsCacheInfo
} from './topArtistsCache.js';

/**
 * Test the cache functionality
 */
export const testTopArtistsCache = async () => {
  console.log('🧪 Testing TopArtistsCache...');
  
  try {
    // 1. Check current cache status
    console.log('\n📊 Current cache status:');
    const cacheInfo = getTopArtistsCacheInfo();
    console.log(cacheInfo);
    
    // 2. Inspect current cache structure (if exists)
    if (cacheInfo.exists) {
      console.log('\n🔍 Current cache structure:');
      const inspection = inspectTopArtistsCache();
      console.log(inspection);
    }
    
    // 3. Force refresh the cache
    console.log('\n🔄 Force refreshing cache...');
    const refreshResult = await forceRefreshArtistsCache();
    console.log('Refresh result:', refreshResult);
    
    // 4. Check the new cache
    console.log('\n📊 New cache status:');
    const newCacheInfo = getTopArtistsCacheInfo();
    console.log(newCacheInfo);
    
    // 5. Get cached artists
    console.log('\n🎵 Cached artists:');
    const cachedArtists = getCachedTopArtists();
    if (cachedArtists) {
      console.log(`Found ${cachedArtists.length} artists`);
      
      // Show first 5 artists with their rankings
      const sampleArtists = cachedArtists.slice(0, 5).map(artist => ({
        name: artist.name,
        rankings: artist.rankings,
        originalRank: artist.originalRank
      }));
      console.log('Sample artists:', sampleArtists);
      
      // Check rankings distribution
      const rankingsStats = {
        with4Weeks: cachedArtists.filter(a => a.rankings['4_weeks'] !== null).length,
        with6Months: cachedArtists.filter(a => a.rankings['6_months'] !== null).length,
        with12Months: cachedArtists.filter(a => a.rankings['12_months'] !== null).length,
        total: cachedArtists.length
      };
      console.log('Rankings distribution:', rankingsStats);
      
    } else {
      console.log('No cached artists found');
    }
    
    console.log('\n✅ Cache test completed!');
    
  } catch (error) {
    console.error('❌ Error during cache test:', error);
  }
};

/**
 * Clear cache and show status
 */
export const clearCacheTest = () => {
  console.log('🗑️ Clearing cache...');
  clearTopArtistsCache();
  
  const cacheInfo = getTopArtistsCacheInfo();
  console.log('Cache status after clearing:', cacheInfo);
};

/**
 * Quick cache inspection
 */
export const quickInspect = () => {
  const inspection = inspectTopArtistsCache();
  console.log('🔍 Cache inspection:', inspection);
  return inspection;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testTopArtistsCache = testTopArtistsCache;
  window.clearCacheTest = clearCacheTest;
  window.quickInspect = quickInspect;
}
