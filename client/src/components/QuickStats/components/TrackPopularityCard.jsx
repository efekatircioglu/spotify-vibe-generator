import React, { useState } from 'react';

// Popularity mapping function for tracks
const getPopularityDescription = (score) => {
  if (score >= 90) return { 
    label: 'Global Hit', 
    color: '#ffd700', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    )
  };
  if (score >= 80) return { 
    label: 'International Hit', 
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
    label: 'Mainstream Hit', 
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
    label: 'Rising Hit', 
    color: '#45b7d1', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  };
  if (score >= 50) return { 
    label: 'Growing Song', 
    color: '#96ceb4', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 15 14 21 8"></polyline>
        <polyline points="15 8 21 8 21 14"></polyline>
      </svg>
    )
  };
  if (score >= 40) return { 
    label: 'Emerging Song', 
    color: '#feca57', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8C8 10 5.5 16.5 12 22c6.5-5.5 4-12-5-14z"></path>
      </svg>
    )
  };
  if (score >= 30) return { 
    label: 'Underground Track', 
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
    label: 'Indie Track', 
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
    label: 'Undiscovered Track', 
    color: '#00d2d3', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    )
  };
};

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
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedPopularity, setSelectedPopularity] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to get popularity range for a label
  const getPopularityRange = (label) => {
    switch (label) {
      case 'Global Hit': return { min: 90, max: 100 };
      case 'International Hit': return { min: 80, max: 89 };
      case 'Mainstream Hit': return { min: 70, max: 79 };
      case 'Rising Hit': return { min: 60, max: 69 };
      case 'Growing Song': return { min: 50, max: 59 };
      case 'Emerging Song': return { min: 40, max: 49 };
      case 'Underground Track': return { min: 30, max: 39 };
      case 'Indie Track': return { min: 20, max: 29 };
      case 'Hidden Gem': return { min: 10, max: 19 };
      case 'Undiscovered Track': return { min: 0, max: 9 };
      default: return { min: 0, max: 100 };
    }
  };

  // Songs Modal Component
  const SongsModal = ({ isOpen, onClose, period, popularityLevel, songs }) => {
    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: '#1e1e1e',
          borderRadius: '18px',
          padding: '32px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(34, 202, 123, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            ✕
          </button>

          {/* Title */}
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {period} - {popularityLevel}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '1rem',
            color: '#a0a0a0',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {songs.length} tracks found
          </div>

          {/* Songs Table */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid rgba(34, 202, 123, 0.2)',
            borderRadius: '12px',
            background: '#2a2a2a'
          }}>
            {songs.length > 0 ? (
              <>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr 1fr',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'rgba(34, 202, 123, 0.15)',
                  borderBottom: '1px solid rgba(34, 202, 123, 0.3)',
                  fontWeight: '600',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}>
                  <div>Song Name</div>
                  <div>Artist</div>
                  <div>Popularity</div>
                </div>

                {/* Table Body */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {songs.map((song, index) => {
                    const songPopularity = getPopularityDescription(song.popularity);
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '3fr 2fr 1fr',
                          gap: '16px',
                          padding: '16px 20px',
                          borderBottom: index < songs.length - 1 ? '1px solid rgba(34, 202, 123, 0.1)' : 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(34, 202, 123, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          color: '#ffffff',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          {song.name}
                        </div>
                        <div style={{
                          color: '#a0a0a0',
                          fontSize: '0.9rem'
                        }}>
                          {song.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: songPopularity.color,
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {songPopularity.icon}
                          <span>{songPopularity.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#a0a0a0'
              }}>
                No songs found for this criteria.
              </div>
            )}
          </div>

          {/* Summary and Actions */}
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'rgba(34, 202, 123, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(34, 202, 123, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '16px' }}>
              <strong style={{ color: '#ffffff' }}>Total Songs:</strong> {songs.length}
            </div>
          </div>
        </div>
      </div>
    );
  };
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
          if (data.count === 0 || period === 'all_tracks') return null;
          
          const averageDescription = getPopularityDescription(data.average);
          const minDescription = getPopularityDescription(data.min);
          const maxDescription = getPopularityDescription(data.max);
          
          return (
            <div key={period} style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              setSelectedPeriod(period.replace('_', ' '));
              setSelectedPopularity(averageDescription.label);
              setShowModal(true);
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
                    margin: '0',
                    textTransform: 'capitalize'
                  }}>
                    {period.replace('_', ' ')}
                  </h4>
                </div>

              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ color: averageDescription.color }}>
                    {averageDescription.icon}
                  </div>
                  <h5 style={{
                    color: averageDescription.color,
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0'
                  }}>
                    {averageDescription.label}
                  </h5>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        {popularity['12_months'] && (
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
                const longTermAvg = popularity['12_months'].average;
                const longTermDescription = getPopularityDescription(longTermAvg);
                
                if (longTermAvg >= 80) {
                  return `You love ${longTermDescription.label.toLowerCase()} music! Your music taste leans heavily toward popular, chart-topping tracks.`;
                } else if (longTermAvg >= 60) {
                  return `You enjoy ${longTermDescription.label.toLowerCase()} music! You're into popular songs but also discover some hidden gems.`;
                } else if (longTermAvg >= 40) {
                  return `You have a balanced taste! You mix ${longTermDescription.label.toLowerCase()} hits with more alternative and niche tracks.`;
                } else if (longTermAvg >= 20) {
                  return `You're an alternative music lover! You prefer ${longTermDescription.label.toLowerCase()} tracks that are less mainstream.`;
                } else {
                  return `You're a true music explorer! You discover ${longTermDescription.label.toLowerCase()} tracks that most people haven't heard.`;
                }
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Songs Modal */}
      <SongsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        period={selectedPeriod}
        popularityLevel={selectedPopularity}
        songs={(() => {
          if (!selectedPeriod || !selectedPopularity) return [];
          
          // Find the period data
          const periodKey = selectedPeriod.replace(' ', '_');
          const periodData = popularity[periodKey];
          if (!periodData) return [];
          
          // If songs array doesn't exist, try to get from cache
          if (!periodData.songs) {
            console.log('No songs data available for period:', periodKey);
            return [];
          }
          
          // Filter songs by popularity level
          const popularityRange = getPopularityRange(selectedPopularity);
          const filteredSongs = periodData.songs.filter(song => {
            const songPopularity = song.popularity || 0;
            return songPopularity >= popularityRange.min && songPopularity <= popularityRange.max;
          });
          
          console.log(`Found ${filteredSongs.length} songs for ${selectedPeriod} - ${selectedPopularity} (range: ${popularityRange.min}-${popularityRange.max})`);
          return filteredSongs;
        })()}
      />
    </div>
  );
}
