import React, { useState } from 'react';
import { optimizedArtistSearch, getConcertApiCacheStats, clearConcertApiCache } from '../utils/concertApiOptimizer';

export default function ApiOptimizationDemo() {
  const [demoResults, setDemoResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  const testArtistNames = [
    'Taylor Swift',
    'Drake',
    'Ed Sheeran',
    'Bad Bunny',
    'The Weeknd',
    'Post Malone',
    'Dua Lipa',
    'Billie Eilish'
  ];

  const runDemo = async () => {
    setIsRunning(true);
    setDemoResults([]);
    
    try {
      console.log('Starting API optimization demo...');
      
      const results = await optimizedArtistSearch(testArtistNames, 200);
      
      const formattedResults = results.map((result, index) => ({
        artistName: testArtistNames[index],
        success: result.success,
        cached: result.cached,
        data: result.data,
        error: result.error
      }));
      
      setDemoResults(formattedResults);
      
      // Update cache stats
      setCacheStats(getConcertApiCacheStats());
      
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    clearConcertApiCache();
    setCacheStats(getConcertApiCacheStats());
    setDemoResults([]);
  };

  const getCacheStats = () => {
    setCacheStats(getConcertApiCacheStats());
  };

  return (
    <div style={{ 
      background: '#181818', 
      padding: '24px', 
      borderRadius: '16px',
      marginBottom: '24px',
      border: '1px solid #333'
    }}>
      <h3 style={{ color: '#1db954', marginBottom: '16px', textAlign: 'center' }}>
        🧪 API Optimization Demo
      </h3>
      
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ color: '#b3b3b3', marginBottom: '16px' }}>
          This demo shows how the optimized API system works with intelligent caching and delays.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={runDemo}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              background: isRunning ? '#666' : '#1db954',
              color: isRunning ? '#999' : '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isRunning ? '🔄 Running Demo...' : '🚀 Run Demo'}
          </button>
          
          <button
            onClick={getCacheStats}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📊 Cache Stats
          </button>
          
          <button
            onClick={clearCache}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🗑️ Clear Cache
          </button>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div style={{ 
          background: '#232323', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#1db954', marginBottom: '12px' }}>Cache Statistics</h4>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {cacheStats.total}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>Total Entries</div>
            </div>
            <div>
              <div style={{ color: '#1db954', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {cacheStats.valid}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>Valid Entries</div>
            </div>
            <div>
              <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {cacheStats.expired}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>Expired Entries</div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Results */}
      {demoResults.length > 0 && (
        <div>
          <h4 style={{ color: '#fff', marginBottom: '16px', textAlign: 'center' }}>
            Demo Results
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {demoResults.map((result, index) => (
              <div
                key={index}
                style={{
                  background: result.success ? '#1db954' : '#ef4444',
                  color: result.success ? '#000' : '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {result.artistName}
                </div>
                
                {result.success ? (
                  <div>
                    <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                      Status: {result.cached ? '🟢 Cache Hit (Instant)' : '🟡 API Call (200ms delay)'}
                    </div>
                    {result.data && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Ticketmaster ID: {result.data.id}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem' }}>
                    Error: {result.error?.message || 'Unknown error'}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div style={{ 
            background: '#232323', 
            padding: '16px', 
            borderRadius: '8px', 
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <h5 style={{ color: '#1db954', marginBottom: '12px' }}>Performance Summary</h5>
            <div style={{ color: '#b3b3b3', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {demoResults.filter(r => r.cached).length} cache hits (instant) • {' '}
              {demoResults.filter(r => !r.cached && r.success).length} API calls (with 200ms delays) • {' '}
              {demoResults.filter(r => !r.success).length} failures
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
