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
 */
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
            Average of your top artists
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
            <h4 style={{
              color: '#fff',
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 0 4px 0'
            }}>
              {popularity.average}
            </h4>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
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
              Range
            </p>
            <p style={{
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              margin: '0'
            }}>
              {popularity.min} - {popularity.max}
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
              {popularity.topPopular.map((artist, index) => (
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
                  <span style={{
                    color: '#ec4899',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {artist.popularity}
                  </span>
                </div>
              ))}
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
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#22c55e',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} />
              Hidden Gems
            </h5>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {popularity.hiddenGems.map((artist, index) => (
                <div key={artist.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#22c55e',
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                    <span style={{
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {artist.name}
                    </span>
                  </div>
                  <span style={{
                    color: '#22c55e',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {artist.popularity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
