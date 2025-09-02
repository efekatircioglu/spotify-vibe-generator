import { useEffect, useState } from 'react';
import { doCachesExist, getCacheStatus } from '../utils/cacheManager';

export default function TopDataCacheInitializer() {
  const [cacheStatus, setCacheStatus] = useState(null);

  useEffect(() => {
    const checkCacheStatus = () => {
      // Check cache status using centralized manager
      const status = getCacheStatus();
      setCacheStatus(status);
    };

    // Check cache status immediately
    checkCacheStatus();
    
    // Check again after a short delay to ensure app is fully loaded
    const timer = setTimeout(checkCacheStatus, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  // It just runs in the background to monitor cache status
  return null;
}
