import { useCallback } from 'react';
import { 
  getCachedSection, 
  setCachedSection, 
  clearAllQuickStatsCaches,
  generateComprehensiveCacheKey 
} from '../utils/cacheUtils';

/**
 * useQuickStatsCache Hook
 * 
 * Manages caching functionality for QuickStats components
 * Provides functions for getting, setting, and clearing cached data
 * 
 * BENEFITS:
 * ✅ Centralized cache management
 * ✅ Reusable across different components
 * ✅ Easy to test and maintain
 * ✅ Clear separation of concerns
 */
export const useQuickStatsCache = () => {
  /**
   * Get cached section data
   */
  const getCachedSectionData = useCallback((sectionName, topArtists, topTracks) => {
    return getCachedSection(sectionName, topArtists, topTracks);
  }, []);

  /**
   * Set cached section data
   */
  const setCachedSectionData = useCallback((sectionName, data, topArtists, topTracks) => {
    setCachedSection(sectionName, data, topArtists, topTracks);
  }, []);

  /**
   * Clear all QuickStats caches
   */
  const clearCache = useCallback(() => {
    clearAllQuickStatsCaches();
  }, []);

  /**
   * Generate cache key for given data
   */
  const generateCacheKey = useCallback((topArtists, topTracks) => {
    return generateComprehensiveCacheKey(topArtists, topTracks);
  }, []);

  return {
    getCachedSection: getCachedSectionData,
    setCachedSection: setCachedSectionData,
    clearCache,
    generateCacheKey
  };
};
