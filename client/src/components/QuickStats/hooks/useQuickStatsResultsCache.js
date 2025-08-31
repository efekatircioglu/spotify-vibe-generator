import { useCallback } from 'react';
import {
  getCachedResults,
  setCachedResults,
  updateCachedSection,
  hasValidResultsCache,
  clearResultsCache,
  getResultsCacheStatus,
  cleanupExpiredCache
} from '../utils/quickStatsResultsCache';

/**
 * useQuickStatsResultsCache Hook
 * 
 * Manages the QuickStats results cache system
 * Provides functions to get, set, and manage cached calculation results
 * 
 * BENEFITS:
 * ✅ Prevents recalculation on page refresh/navigation
 * ✅ Stores all analysis results in one place
 * ✅ Automatic cache expiration (24 hours)
 * ✅ Easy cache management and cleanup
 */
export const useQuickStatsResultsCache = () => {
  /**
   * Get cached results for given top artists and tracks
   */
  const getCachedResultsData = useCallback((topArtists, topTracks) => {
    return getCachedResults(topArtists, topTracks);
  }, []);

  /**
   * Set cached results for given top artists and tracks
   */
  const setCachedResultsData = useCallback((topArtists, topTracks, results) => {
    setCachedResults(topArtists, topTracks, results);
  }, []);

  /**
   * Update a specific section in the cache
   */
  const updateCachedSectionData = useCallback((topArtists, topTracks, sectionName, sectionData) => {
    updateCachedSection(topArtists, topTracks, sectionName, sectionData);
  }, []);

  /**
   * Check if valid cache exists for given data
   */
  const hasValidCache = useCallback((topArtists, topTracks) => {
    return hasValidResultsCache(topArtists, topTracks);
  }, []);

  /**
   * Clear all results cache
   */
  const clearCache = useCallback(() => {
    clearResultsCache();
  }, []);

  /**
   * Get cache status information
   */
  const getCacheStatus = useCallback(() => {
    return getResultsCacheStatus();
  }, []);

  /**
   * Clean up expired cache entries
   */
  const cleanupExpired = useCallback(() => {
    return cleanupExpiredCache();
  }, []);

  return {
    getCachedResults: getCachedResultsData,
    setCachedResults: setCachedResultsData,
    updateCachedSection: updateCachedSectionData,
    hasValidCache,
    clearCache,
    getCacheStatus,
    cleanupExpired
  };
};
