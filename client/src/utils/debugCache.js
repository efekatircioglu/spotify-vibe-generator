// Debug utility to check cache status
export const debugCacheStatus = () => {
  console.log('🔍 DEBUG: Checking cache status...');
  
  // Check sessionStorage for all cache keys
  const cacheKeys = [
    'spotify_top_artists',
    'unified_top_tracks', 
    'spotify_recent_tracks',
    'quickStatsCache'
  ];
  
  cacheKeys.forEach(key => {
    try {
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`✅ ${key}:`, {
          exists: true,
          type: typeof parsed,
          length: Array.isArray(parsed) ? parsed.length : 'N/A',
          hasData: parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)
        });
      } else {
        console.log(`❌ ${key}: Not found`);
      }
    } catch (error) {
      console.log(`⚠️ ${key}: Error parsing -`, error.message);
    }
  });
  
  // Check specific cache utilities
  try {
    const { getCachedTopArtists } = require('./topArtistsCache');
    const { getCachedTopTracks, isCacheValid } = require('./topDataCache');
    const { getCachedRecentTracks } = require('./recentTracksCache');
    
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    const recentTracks = getCachedRecentTracks();
    
    console.log('🔍 Cache utility results:');
    console.log('  Top Artists:', topArtists ? `${topArtists.length} artists` : 'null');
    console.log('  Top Tracks:', topTracks ? `${topTracks.length} tracks` : 'null');
    console.log('  Recent Tracks:', recentTracks ? `${recentTracks.length} tracks` : 'null');
    console.log('  Cache Valid:', isCacheValid());
  } catch (error) {
    console.log('⚠️ Error checking cache utilities:', error.message);
  }
};

// Function to manually trigger cache initialization
export const manualCacheInit = async () => {
  console.log('🔄 Manually triggering cache initialization...');
  try {
    const { initializeAllCaches } = await import('./cacheManager');
    const result = await initializeAllCaches();
    console.log('✅ Manual cache init result:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual cache init failed:', error);
    return false;
  }
};
