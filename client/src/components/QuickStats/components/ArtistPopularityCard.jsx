import React from 'react';

/**
 * ArtistPopularityCard Component
 * 
 * Displays average artist popularity with most popular artists and hidden gems
 * Shows popularity statistics, top popular artists, and least popular artists
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles artist popularity display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Meaningful - shows descriptive labels instead of numbers
 */

// Popularity mapping function
const getPopularityDescription = (score) => {
  if (score >= 90) return { 
    label: 'Global Superstar', 
    color: '#ffd700', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    )
  };
  if (score >= 80) return { 
    label: 'International Fame', 
    color: '#ff6b6b', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <ellipse cx="12" cy="12" rx="4" ry="10"></ellipse>
      </svg>
    )
  };
  if (score >= 70) return { 
    label: 'Mainstream Success', 
    color: '#4ecdc4', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <circle cx="16" cy="14" r="2"></circle>
        <path d="M6 7v10"></path>
        <path d="M10 7v10"></path>
      </svg>
    )
  };
  if (score >= 60) return { 
    label: 'Rising Star', 
    color: '#45b7d1', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  };
  if (score >= 50) return { 
    label: 'Growing Popularity', 
    color: '#96ceb4', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 15 14 21 8"></polyline>
        <polyline points="15 8 21 8 21 14"></polyline>
      </svg>
    )
  };
  if (score >= 40) return { 
    label: 'Emerging Artist', 
    color: '#feca57', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8C8 10 5.5 16.5 12 22c6.5-5.5 4-12-5-14z"></path>
      </svg>
    )
  };
  if (score >= 30) return { 
    label: 'Underground Favorite', 
    color: '#ff9ff3', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.52 19c.64-2.2 1.84-4 3.22-5.5"></path>
        <path d="M18.48 19c-.64-2.2-1.84-4-3.22-5.5"></path>
        <path d="M13.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>
        <path d="M6.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>
        <path d="M12 2a10 10 0 0 0-9.68 7h19.36A10 10 0 0 0 12 2z"></path>
      </svg>
    )
  };
  if (score >= 20) return { 
    label: 'Indie Discovery', 
    color: '#60A5FA', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    )
  };
  if (score >= 10) return { 
    label: 'Hidden Gem', 
    color: '#5f27cd', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 22 22 7 12 2"></polygon>
        <line x1="2" y1="7" x2="12" y2="22"></line>
        <line x1="22" y1="7" x2="12" y2="22"></line>
        <line x1="12" y1="2" x2="12" y2="22"></line>
        <line x1="2" y1="7" x2="22" y2="7"></line>
      </svg>
    )
  };
  return { 
    label: 'Undiscovered Talent', 
    color: '#00d2d3', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    )
  };
};

export default function ArtistPopularityCard({ popularity }) {
  if (!popularity || popularity.count === 0) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No popularity data available
      </div>
    );
  }

  const averageDescription = getPopularityDescription(popularity.average);
  const minDescription = getPopularityDescription(popularity.min);
  const maxDescription = getPopularityDescription(popularity.max);

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
          background: 'linear-gradient(135deg, #ec4899, #f472b6)',
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
            Artist Popularity
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Your music taste profile
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Main Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <div style={{ color: averageDescription.color }}>
                {averageDescription.icon}
              </div>
              <h4 style={{
                color: averageDescription.color,
                fontSize: '1.3rem',
                fontWeight: '700',
                margin: '0'
              }}>
                {averageDescription.label}
              </h4>
            </div>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: '0'
            }}>
              Average of your top artists
            </p>
          </div>

        </div>

        {/* Top Popular Artists */}
        {popularity.topPopular && popularity.topPopular.length > 0 && (
          <div>
            <h5 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Most Popular Artists
            </h5>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {popularity.topPopular.map((artist, index) => {
                const artistDescription = getPopularityDescription(artist.popularity);
                return (
                  <div key={artist.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        background: index === 0 ? '#ffd700' : 
                                   index === 1 ? '#c0c0c0' : 
                                   index === 2 ? '#cd7f32' : '#ec4899',
                        color: index < 3 ? '#000' : '#fff',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        {artist.name}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{ color: artistDescription.color }}>
                        {artistDescription.icon}
                      </div>
                      <span style={{
                        color: artistDescription.color,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {artistDescription.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden Gems */}
        {popularity.hiddenGems && popularity.hiddenGems.length > 0 && (
          <div>
            <h5 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Hidden Gems
            </h5>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {popularity.hiddenGems.map((artist, index) => {
                const artistDescription = getPopularityDescription(artist.popularity);
                return (
                  <div key={artist.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(34, 197, 94, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 197, 94, 0.1)'
                  }}>
                    <span style={{
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {artist.name}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{ color: artistDescription.color }}>
                        {artistDescription.icon}
                      </div>
                      <span style={{
                        color: artistDescription.color,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {artistDescription.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
