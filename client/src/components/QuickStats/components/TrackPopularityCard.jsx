import React from 'react';

/**
 * TrackPopularityCard Component
 * 
 * Displays track popularity analysis showing average popularity scores
 * Shows popularity statistics for different time periods
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles track popularity display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function TrackPopularityCard({ popularity }) {
  if (!popularity) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No track popularity data available
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
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Track Popularity
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Average popularity of your songs
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Time Period Comparisons */}
        {Object.entries(popularity).map(([period, data]) => {
          if (data.count === 0) return null;
          
          let popularityLabel = 'Unknown';
          let popularityColor = '#8b5cf6';
          
          if (data.average >= 80) {
            popularityLabel = 'Very Popular';
            popularityColor = '#10b981';
          } else if (data.average >= 60) {
            popularityLabel = 'Popular';
            popularityColor = '#3b82f6';
          } else if (data.average >= 40) {
            popularityLabel = 'Moderate';
            popularityColor = '#f59e0b';
          } else if (data.average >= 20) {
            popularityLabel = 'Niche';
            popularityColor = '#ef4444';
          } else {
            popularityLabel = 'Underground';
            popularityColor = '#6b7280';
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
                  background: popularityColor,
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {popularityLabel}
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
                    Average / 100
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
                    Range: {data.min} - {data.max}
                  </p>
                  <p style={{
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0'
                  }}>
                    {data.average >= 80 ? '🔥 Mainstream' : 
                     data.average >= 60 ? '⭐ Trending' : 
                     data.average >= 40 ? '📻 Radio Friendly' : 
                     data.average >= 20 ? '🎵 Alternative' : '🎧 Hidden Gems'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        {popularity.all_tracks && popularity['12_months'] && (
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
              Popularity Pattern Analysis
            </h5>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: '0',
              lineHeight: '1.4'
            }}>
              {(() => {
                const overallAvg = popularity.all_tracks.average;
                const longTermAvg = popularity['12_months'].average;
                
                if (overallAvg >= 80) {
                  return "You love mainstream hits! Your music taste leans heavily toward popular, chart-topping tracks.";
                } else if (overallAvg >= 60) {
                  return "You enjoy trending music! You're into popular songs but also discover some hidden gems.";
                } else if (overallAvg >= 40) {
                  return "You have a balanced taste! You mix popular hits with more alternative and niche tracks.";
                } else if (overallAvg >= 20) {
                  return "You're an alternative music lover! You prefer less mainstream, more unique tracks.";
                } else {
                  return "You're a true music explorer! You discover underground and hidden gems that most people haven't heard.";
                }
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
