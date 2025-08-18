// localStorage monitoring and debugging utility
import { localStorageManager } from './localStorageManager';
import { getRecentSearchesStats, demoRecentSearchesLimit } from './recentSearchesCache';

// Add to window for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.storageMonitor = {
    getStats: () => localStorageManager.getStorageStats(),
    clearAll: () => localStorageManager.clearAllCaches(),
    emergencyCleanup: () => localStorageManager.emergencyCleanup(),
    isAvailable: () => localStorageManager.isAvailable(),
    demoRecentSearches: () => demoRecentSearchesLimit()
  };
  
  // Log storage stats on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const stats = localStorageManager.getStorageStats();
      if (stats) {
        console.log('🔍 localStorage Stats:', {
          'Total Size': `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
          'Available Space': `${(stats.availableSpace / 1024 / 1024).toFixed(2)} MB`,
          'Usage': `${((stats.totalSize / stats.maxSize) * 100).toFixed(1)}%`,
          'Cache Keys': stats.cacheKeys.length,
          'localStorage Items': stats.localStorageLength
        });
        
        if (stats.cacheSizes) {
          console.log('📊 Individual Cache Sizes:');
          Object.entries(stats.cacheSizes).forEach(([key, size]) => {
            if (typeof size === 'number') {
              console.log(`  ${key}: ${(size / 1024).toFixed(2)} KB`);
            } else {
              console.log(`  ${key}: ${size}`);
            }
          });
        }
        
        // Add recent searches cache stats
        const recentSearchesStats = getRecentSearchesStats();
        if (recentSearchesStats) {
          console.log('🔍 Recent Searches Cache:', {
            'Total Entries': recentSearchesStats.totalEntries,
            'Max Entries': recentSearchesStats.maxEntries,
            'Size': `${(recentSearchesStats.estimatedSize / 1024).toFixed(2)} KB`,
            'Usage': `${recentSearchesStats.usagePercent.toFixed(1)}%`,
            'At Capacity': recentSearchesStats.isAtCapacity ? '⚠️ Yes' : '✅ No'
          });
        }
        
        // Warn if storage is getting full
        if (stats.totalSize > stats.maxSize * 0.8) {
          console.warn('⚠️ localStorage is getting full! Consider clearing some caches.');
        }
      }
    }, 1000);
  });
}

// Export monitoring functions
export const logStorageStats = () => {
  const stats = localStorageManager.getStorageStats();
  if (stats) {
    console.log('🔍 localStorage Stats:', {
      'Total Size': `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
      'Available Space': `${(stats.availableSpace / 1024 / 1024).toFixed(2)} MB`,
      'Usage': `${((stats.totalSize / stats.maxSize) * 100).toFixed(1)}%`
    });
  }
  return stats;
};

export const checkStorageHealth = () => {
  const stats = localStorageManager.getStorageStats();
  if (!stats) return { healthy: false, reason: 'Unable to get stats' };
  
  const usagePercent = (stats.totalSize / stats.maxSize) * 100;
  
  if (usagePercent > 90) {
    return { 
      healthy: false, 
      level: 'critical',
      reason: `Storage usage at ${usagePercent.toFixed(1)}%`,
      recommendation: 'Clear caches immediately'
    };
  } else if (usagePercent > 80) {
    return { 
      healthy: false, 
      level: 'warning',
      reason: `Storage usage at ${usagePercent.toFixed(1)}%`,
      recommendation: 'Consider clearing some caches'
    };
  } else if (usagePercent > 60) {
    return { 
      healthy: true, 
      level: 'notice',
      reason: `Storage usage at ${usagePercent.toFixed(1)}%`,
      recommendation: 'Monitor storage usage'
    };
  } else {
    return { 
      healthy: true, 
      level: 'good',
      reason: `Storage usage at ${usagePercent.toFixed(1)}%`,
      recommendation: 'Storage usage is healthy'
    };
  }
};

export const getStorageRecommendations = () => {
  const health = checkStorageHealth();
  const recommendations = [];
  
  if (health.level === 'critical') {
    recommendations.push('🚨 CRITICAL: Clear all caches immediately to prevent app crashes');
    recommendations.push('💡 Consider implementing more aggressive cache cleanup');
  } else if (health.level === 'warning') {
    recommendations.push('⚠️ WARNING: Storage is getting full, consider clearing old caches');
    recommendations.push('💡 Implement cache expiration for old entries');
  } else if (health.level === 'notice') {
    recommendations.push('📊 Storage usage is moderate, monitor for growth');
    recommendations.push('💡 Consider implementing cache size limits');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Storage usage is healthy');
  }
  
  return recommendations;
};

// Auto-monitor storage every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const health = checkStorageHealth();
    if (health.level === 'critical' || health.level === 'warning') {
      console.warn('🔄 Storage Health Check:', health);
      getStorageRecommendations().forEach(rec => console.log(rec));
    }
  }, 5 * 60 * 1000); // 5 minutes
}
