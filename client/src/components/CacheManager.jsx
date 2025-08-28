"use client";

import { useEffect } from "react";
import TopDataCacheInitializer from "./TopDataCacheInitializer";
import CacheStatusIndicator from "./CacheStatusIndicator";
import { setupCacheMonitoring, clearAllCaches } from "../utils/cacheManager";

export default function CacheManager() {
  useEffect(() => {
    // Setup centralized cache monitoring
    const cleanupCacheMonitoring = setupCacheMonitoring();
    
    // Clear cache when user leaves the app
    const handleBeforeUnload = () => {
      clearAllCaches();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearAllCaches();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup cache monitoring
      if (cleanupCacheMonitoring) {
        cleanupCacheMonitoring();
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <TopDataCacheInitializer />
      <CacheStatusIndicator />
    </>
  );
}
