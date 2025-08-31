import React, { useState, useEffect } from 'react';

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
  console.log('🎵 TrackPopularityCard received popularity data:', popularity);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedPopularity, setSelectedPopularity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Get recent searches from cache
  const getRecentSearches = () => {
    try {
      const cached = localStorage.getItem('recentSearchesCache');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error reading recent searches cache:', error);
      return [];
    }
  };

  // Navigate to artist page
  const navigateToArtistPage = async (artistName) => {
    try {
      const recentSearches = getRecentSearches();
      const existingSearch = recentSearches.find(search => 
        search.name.toLowerCase() === artistName.toLowerCase()
      );

      if (existingSearch) {
        // Use existing data
        const url = `/artist?spotifyId=${encodeURIComponent(existingSearch.spotifyId || '')}&ticketmasterId=${encodeURIComponent(existingSearch.ticketmasterId || '')}&name=${encodeURIComponent(artistName)}`;
        window.location.href = url;
      } else {
        // Search for artist
        const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?query=${encodeURIComponent(artistName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.spotifyId || data.ticketmasterId) {
            const url = `/artist?spotifyId=${encodeURIComponent(data.spotifyId || '')}&ticketmasterId=${encodeURIComponent(data.ticketmasterId || '')}&name=${encodeURIComponent(artistName)}`;
            window.location.href = url;
          }
        }
      }
    } catch (error) {
      console.error('Error navigating to artist page:', error);
    }
  };

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

  // Get cached top tracks
  const getCachedTopTracks = () => {
    try {
      const cached = localStorage.getItem('unified_top_tracks');
      const tracks = cached ? JSON.parse(cached) : [];
      console.log('📊 Retrieved tracks from cache:', {
        count: tracks.length,
        sample: tracks[0],
        hasRankings: tracks[0]?.rankings,
        hasPopularity: tracks[0]?.popularity
      });
      return tracks;
    } catch (error) {
      console.error('Error reading top tracks cache:', error);
      return [];
    }
  };

  // Modal visibility effect
  useEffect(() => {
    if (showModal) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showModal]);

  // Filter songs when modal opens
  useEffect(() => {
    if (showModal && selectedPeriod && selectedPopularity) {
      setLoadingSongs(true);
      
      const topTracks = getCachedTopTracks();
      const periodKey = selectedPeriod.replace(' ', '_');
      const popularityRange = getPopularityRange(selectedPopularity);
      
      console.log('🔍 Filtering tracks:', {
        selectedPeriod,
        selectedPopularity,
        periodKey,
        popularityRange,
        totalTracks: topTracks.length
      });
      
      // Filter tracks that are in the selected time period and popularity range
      const filtered = topTracks.filter(track => {
        // Check if track is in the selected time period
        const hasRanking = track.rankings && track.rankings[periodKey];
        if (!hasRanking) return false;
        
        // Check if track is in the popularity range
        const songPopularity = track.popularity || 0;
        const inRange = songPopularity >= popularityRange.min && songPopularity <= popularityRange.max;
        
        if (inRange) {
          console.log('✅ Found matching track:', {
            name: track.name,
            artists: track.artists?.map(a => a.name).join(', '),
            popularity: songPopularity,
            ranking: track.rankings[periodKey]
          });
        }
        
        return inRange;
      }).sort((a, b) => {
        // Sort by ranking (lower number = higher rank)
        const aRank = a.rankings?.[periodKey] || Infinity;
        const bRank = b.rankings?.[periodKey] || Infinity;
        return aRank - bRank;
      });
      
      // If no tracks found in specific range, show all tracks from that period
      if (filtered.length === 0) {
        console.log('⚠️ No tracks found in specific popularity range, showing all tracks from period');
        const allTracksInPeriod = topTracks.filter(track => {
          const hasRanking = track.rankings && track.rankings[periodKey];
          return hasRanking;
        }).sort((a, b) => {
          const aRank = a.rankings?.[periodKey] || Infinity;
          const bRank = b.rankings?.[periodKey] || Infinity;
          return aRank - bRank;
        });
        
        console.log('📋 All tracks in period:', {
          count: allTracksInPeriod.length,
          sample: allTracksInPeriod[0]
        });
        
        setFilteredSongs(allTracksInPeriod);
        setLoadingSongs(false);
        return;
      }
      
      console.log('📋 Filtered results:', {
        filteredCount: filtered.length,
        sample: filtered[0]
      });
      
      setFilteredSongs(filtered);
      setLoadingSongs(false);
    }
  }, [showModal, selectedPeriod, selectedPopularity]);
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
    <>
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
          console.log(`📊 Period ${period}:`, data);
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
              console.log('🖱️ Card clicked:', {
                period: period.replace('_', ' '),
                popularityLabel: averageDescription.label,
                periodData: data
              });
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

      </div>
    </div>

    {/* Songs Modal */}
    {showModal && (
      <>
        <div 
          className={`genius-modal-overlay ${isVisible ? 'visible' : ''}`}
          onClick={() => setShowModal(false)}
        />
        
        <div className={`genius-modal-container ${isVisible ? 'visible' : ''}`}>
          <div className="genius-modal-content">
            <div className="genius-modal-header">
              <h2 className="genius-modal-title">
                {selectedPeriod} - {selectedPopularity}
              </h2>
              <button className="genius-close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="genius-section">
              <div style={{
                fontSize: '1rem',
                color: '#a0a0a0',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                {loadingSongs ? 'Loading songs...' : `${filteredSongs.length} tracks found`}
              </div>

              <div style={{
                maxHeight: '600px',
                overflowY: 'auto',
                padding: '16px'
              }}>
                {loadingSongs ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#a0a0a0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid #22ca7b',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    Loading songs...
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#a0a0a0'
                  }}>
                    No songs found for this popularity range.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {filteredSongs.map((track, index) => {
                      const songPopularityDescription = getPopularityDescription(track.popularity || 0);
                      
                      return (
                        <div
                          key={track.id || index}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: track.album && track.album.images && track.album.images[0] ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            height: '120px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Background album image layer */}
                          {track.album && track.album.images && track.album.images[0] && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${track.album.images[0].url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              zIndex: 0
                            }} />
                          )}
                          {/* Song Info Overlay */}
                          <div style={{
                            position: 'relative',
                            zIndex: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>

                            
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: '600',
                                margin: '0 0 4px 0',
                                textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {track.name}
                              </h4>
                              {track.album?.name && (
                                <p style={{
                                  color: '#b3b3b3',
                                  fontSize: '0.9rem',
                                  margin: '0',
                                  textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {track.album.name}
                                </p>
                              )}
                            </div>
                            
                            {/* Artists Section */}
                            {track.artists && track.artists.length > 0 && (
                              <div style={{ marginTop: '4px' }}>
                                <p 
                                  style={{
                                    color: '#b3b3b3',
                                    fontSize: '0.8rem',
                                    margin: '0',
                                    textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  onClick={() => navigateToArtistPage(track.artists[0].name)}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = '#22ca7b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#b3b3b3';
                                  }}
                                >
                                  {track.artists.map(artist => artist.name).join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                          

                          
                          {/* Artists Section */}
                          {track.artists && track.artists.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {track.artists.map((artist, artistIndex) => (
                                  <div
                                    key={artist.id || artistIndex}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 10px',
                                      borderRadius: '20px',
                                      background: 'rgba(29, 185, 84, 0.1)',
                                      border: '1px solid rgba(29, 185, 84, 0.3)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)';
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onClick={() => navigateToArtistPage(artist.name)}
                                  >
                                    <span style={{
                                      color: '#1db954',
                                      fontSize: '0.8rem',
                                      fontWeight: '500'
                                    }}>
                                      {artist.name}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1db954' }}>
                                      <path d="M5 12h14"></path>
                                      <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Styles */}
        <style jsx global>{`
          .genius-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 40;
            opacity: 0;
            transition: opacity 200ms ease-out;
            pointer-events: none;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          .genius-modal-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }
          .genius-modal-container {
            position: fixed;
            z-index: 50;
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 90%;
            max-width: 800px;
            max-height: 85vh;
          }
          .genius-modal-container.visible {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            pointer-events: auto;
          }
          .genius-modal-content {
            background-color: #181818;
            border: 1px solid #3f3f46;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: none;
            padding: 1.5rem;
            max-height: 85vh;
            overflow-y: auto;
          }
          .genius-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            position: relative;
          }
          .genius-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f4f4f5;
            margin: 0;
            flex: 1;
            padding-right: 3rem;
          }
          .genius-close-button {
            background: rgba(24, 24, 24, 0.9);
            border: 1px solid #3f3f46;
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 700;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.2s ease;
            min-width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 0;
            right: 0;
            z-index: 100;
          }
          .genius-close-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transform: scale(1.1);
          }
          .genius-section {
            margin-bottom: 1.5rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )}
  </>
  );
}
