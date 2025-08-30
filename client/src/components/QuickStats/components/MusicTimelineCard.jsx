import React from 'react';

/**
 * MusicTimelineCard Component
 * 
 * Displays music timeline analysis showing nostalgia vs new releases
 * Shows average publish years for different time periods
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles year analysis display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function MusicTimelineCard({ yearAnalysis }) {
  if (!yearAnalysis) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No timeline data available
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Music Timeline
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Nostalgia vs New Releases
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Time Period Comparisons */}
        {Object.entries(yearAnalysis).map(([period, data]) => {
          if (data.count === 0) return null;
          
          const currentYear = new Date().getFullYear();
          const yearsDiff = currentYear - data.average;
          const isNostalgic = yearsDiff > 5;
          const isNew = yearsDiff <= 2;
          
          let trendLabel = 'Balanced';
          let trendColor = '#10b981';
          
          if (isNostalgic) {
            trendLabel = 'Nostalgic';
            trendColor = '#f59e0b';
          } else if (isNew) {
            trendLabel = 'Fresh';
            trendColor = '#3b82f6';
          }
          
          return (
            <div key={period} style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    textTransform: 'capitalize'
                  }}>
                    {period.replace('_', ' ')}
                  </h4>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    {data.count} songs analyzed
                  </p>
                </div>
                <span style={{
                  background: trendColor,
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {trendLabel}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    {data.average}
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    Average Year
                  </p>
                </div>
                <div style={{
                  textAlign: 'right'
                }}>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0 0 4px 0'
                  }}>
                    {yearsDiff > 0 ? `${yearsDiff} years ago` : `${Math.abs(yearsDiff)} years ahead`}
                  </p>
                  <p style={{
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0'
                  }}>
                    {isNostalgic ? '🎵 Classic Vibes' : isNew ? '🚀 Fresh Finds' : '⚖️ Balanced Mix'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        {yearAnalysis.recent_50 && yearAnalysis['12_months'] && (
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: '8px'
          }}>
            <h5 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              Listening Pattern Analysis
            </h5>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: '0',
              lineHeight: '1.4'
            }}>
              {(() => {
                const recentAvg = yearAnalysis.recent_50.average;
                const longTermAvg = yearAnalysis['12_months'].average;
                const diff = recentAvg - longTermAvg;
                
                if (diff > 2) {
                  return "You're exploring newer music lately! Your recent listens are fresher than your long-term favorites.";
                } else if (diff < -2) {
                  return "You're diving into classics! Your recent listens are more nostalgic than your usual taste.";
                } else {
                  return "Your recent listening pattern matches your long-term music taste - consistent vibes!";
                }
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
