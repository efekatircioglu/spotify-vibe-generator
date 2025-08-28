"use client";

import { useEffect } from "react";
import TopDataCacheInitializer from "./TopDataCacheInitializer";
import CacheStatusIndicator from "./CacheStatusIndicator";
import { setupCacheMonitoring, clearAllCaches } from "../utils/cacheManager";

export default function CacheManager() {
  useEffect(() => {
    // Setup centralized cache monitoring
    const cleanupCacheMonitoring = setupCacheMonitoring();
    
    // Don't clear caches on tab switch or minimize - only when token expires
    // This prevents the aggressive cache clearing that was causing issues

    return () => {
      // Cleanup cache monitoring
      if (cleanupCacheMonitoring) {
        cleanupCacheMonitoring();
      }
    };
  }, []);

  return (
    <>
      <TopDataCacheInitializer />
      <CacheStatusIndicator />
    </>
  );
}
