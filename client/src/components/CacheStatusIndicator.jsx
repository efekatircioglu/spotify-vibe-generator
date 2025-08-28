import { useState, useEffect } from 'react';
import { getCacheStats } from '../utils/topDataCache';

export default function CacheStatusIndicator() {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = getCacheStats();
      setStats(currentStats);
    };

    // Update stats immediately
    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with Ctrl+Shift+C (for debugging)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#181c24',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '12px',
      color: '#fff',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      minWidth: '200px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1db954' }}>
        🗄️ Cache Status
      </div>
      
      {stats ? (
        <>
          <div style={{ marginBottom: '4px' }}>
            Status: {stats.hasCache ? '✅ Valid' : '❌ Invalid'}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Complete: {stats.isComplete ? '✅ Yes' : '❌ No'}
          </div>
          {stats.age !== null && (
            <div style={{ marginBottom: '4px' }}>
              Age: {stats.age} min
            </div>
          )}
          <div style={{ marginBottom: '4px' }}>
            Size: {stats.size} KB
          </div>
          <div style={{ marginBottom: '4px' }}>
            Tracks: {stats.trackCount}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Version: {stats.version || 'N/A'}
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        color: '#b3b3b3',
        textAlign: 'center'
      }}>
        Press Ctrl+Shift+C to hide
      </div>
    </div>
  );
}
