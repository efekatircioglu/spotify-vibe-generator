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

        {/* Overview of Unified Top Tracks */}
        {(() => {
          // Get unified top tracks data from sessionStorage
          const unifiedTopTracksData = sessionStorage.getItem('unified_top_tracks');
          const unifiedTopTracks = unifiedTopTracksData ? JSON.parse(unifiedTopTracksData) : [];
          
          if (unifiedTopTracks.length === 0) return null;
          
          // Calculate overview metrics
          const currentYear = new Date().getFullYear();
          const years = unifiedTopTracks
            .map(track => {
              const releaseDate = track.release_date || track.album?.release_date;
              return releaseDate ? new Date(releaseDate).getFullYear() : null;
            })
            .filter(year => year !== null);
          
          if (years.length === 0) return null;
          
          const averageYear = Math.round(years.reduce((sum, year) => sum + year, 0) / years.length);
          const yearsDiff = currentYear - averageYear;
          const oldestYear = Math.min(...years);
          const newestYear = Math.max(...years);
          const yearSpan = newestYear - oldestYear;
          
          // Get decade distribution
          const decadeCounts = {};
          years.forEach(year => {
            const decade = Math.floor(year / 10) * 10;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
          });
          
          const mostCommonDecade = Object.entries(decadeCounts)
            .sort(([,a], [,b]) => b - a)[0];
          
          // Get decade label for average year
          const getDecadeLabel = (year) => {
            if (year >= 2020) return { label: 'New Releases', color: '#3b82f6' };
            if (year >= 2010) return { label: 'Digital Age', color: '#8b5cf6' };
            if (year >= 2000) return { label: '2000s Nostalgia', color: '#f59e0b' };
            if (year >= 1990) return { label: '90s Golden Age', color: '#fbbf24' };
            if (year >= 1980) return { label: '80s Pop', color: '#ef4444' };
            if (year >= 1970) return { label: '70s Rock', color: '#dc2626' };
            if (year >= 1960) return { label: '60s Revolution', color: '#7c3aed' };
            if (year >= 1950) return { label: '50s Classics', color: '#059669' };
            return { label: 'Vintage', color: '#6b7280' };
          };
          
          const averageDecadeInfo = getDecadeLabel(averageYear);
          
          return (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  Overall Music Timeline Analysis
                </h5>
                <span style={{
                  background: averageDecadeInfo.color,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {averageDecadeInfo.label}
                </span>
              </div>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0',
                lineHeight: '1.4'
              }}>
                {(() => {
                  const totalTracks = unifiedTopTracks.length;
                  const tracksWithYears = years.length;
                  
                  if (yearSpan <= 5) {
                    return `Your music collection spans a focused ${yearSpan}-year period (${oldestYear}-${newestYear}), with an average release year of ${averageYear} (${yearsDiff} years ago). You prefer ${averageDecadeInfo.label.toLowerCase()} music, showing a consistent taste for ${averageDecadeInfo.label.toLowerCase()} era.`;
                  } else if (yearSpan <= 15) {
                    return `Your music collection covers a moderate ${yearSpan}-year range (${oldestYear}-${newestYear}), averaging ${averageYear} (${yearsDiff} years ago). You enjoy ${averageDecadeInfo.label.toLowerCase()} music while exploring a good variety of eras.`;
                  } else if (yearSpan <= 30) {
                    return `Your music collection spans a wide ${yearSpan}-year range (${oldestYear}-${newestYear}), with an average of ${averageYear} (${yearsDiff} years ago). You're a musical explorer who appreciates ${averageDecadeInfo.label.toLowerCase()} music alongside diverse historical periods.`;
                  } else {
                    return `Your music collection covers an extensive ${yearSpan}-year range (${oldestYear}-${newestYear}), averaging ${averageYear} (${yearsDiff} years ago). You're a true music historian who embraces ${averageDecadeInfo.label.toLowerCase()} music and spans multiple musical eras.`;
                  }
                })()}
              </p>
            </div>
          );
        })()}
        
        {/* Time Period Comparisons */}
        {(() => {
          // Sort periods: recent_50 first, then 4_weeks, 6_months, 12_months
          const sortedEntries = Object.entries(yearAnalysis).sort(([a], [b]) => {
            const order = ['recent_50', '4_weeks', '6_months', '12_months'];
            const aIndex = order.indexOf(a);
            const bIndex = order.indexOf(b);
            
            // If both are in the order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            
            // If only one is in the order array, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither is in the order array, sort alphabetically
            return a.localeCompare(b);
          });
          
          return sortedEntries.map(([period, data]) => {
            // Always show recent_50 data, even if count is 0
            if (data.count === 0 && period !== 'recent_50') return null;
          
          const currentYear = new Date().getFullYear();
          const yearsDiff = currentYear - data.average;
          
          // Get decade label based on average year
          const getDecadeLabel = (year) => {
            if (year >= 2020) return { 
              label: 'New Releases', 
              color: '#3b82f6', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )
            };
            if (year >= 2010) return { 
              label: 'Digital Age', 
              color: '#8b5cf6', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="21" x2="22" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              )
            };
            if (year >= 2000) return { 
              label: '2000s Nostalgia', 
              color: '#f59e0b', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              )
            };
            if (year >= 1990) return { 
              label: '90s Golden Age', 
              color: '#fbbf24', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              )
            };
            if (year >= 1980) return { 
              label: '80s Pop', 
              color: '#ef4444', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              )
            };
            if (year >= 1970) return { 
              label: '70s Rock', 
              color: '#dc2626', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m14.5 3.5-3 3L6 12v6h6l5.5-5.5-3-3z"></path><path d="m18 2-6 6"></path><path d="m2 22 6-6"></path>
                </svg>
              )
            };
            if (year >= 1960) return { 
              label: '60s Revolution', 
              color: '#7c3aed', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )
            };
            if (year >= 1950) return { 
              label: '50s Classics', 
              color: '#059669', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V10M12 10C12 5.58172 8.41828 2 4 2C-0.418278 2 3.44211e-05 10 3.44211e-05 10M12 10C12 5.58172 15.5817 2 20 2C24.4183 2 24 10 24 10"></path>
                  <path d="M4 16H0"></path><path d="M24 16H20"></path><path d="M8 22H5"></path>
                </svg>
              )
            };
            return { 
              label: 'Vintage', 
              color: '#6b7280', 
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 11h18"></path>
                </svg>
              )
            };
          };
          
          const decadeInfo = getDecadeLabel(data.average);
          
          return (
                        <div key={period} style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Header Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0',
                  textTransform: 'capitalize'
                }}>
                  {period.replace('_', ' ')}
                </h4>
                <span style={{
                  background: decadeInfo.color,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {decadeInfo.icon}
                  {decadeInfo.label}
                </span>
              </div>
              
              {/* Main Content Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <h5 style={{
                    color: '#fff',
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0'
                  }}>
                    {data.average}
                  </h5>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0'
                  }}>
                    Average Year
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    {yearsDiff > 0 ? `${yearsDiff} years ago` : `${Math.abs(yearsDiff)} years ahead`}
                  </p>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    {data.count} songs analyzed
                  </p>
                </div>
              </div>
            </div>
          );
        });
        })()}
        

      </div>
    </div>
  );
}
