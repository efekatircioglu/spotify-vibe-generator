import React, { useState, useEffect } from 'react';
import { getCachedTopTracks, isCacheValid, hasCompleteCache } from '../utils/topDataCache';
import { getCachedTopArtists } from '../utils/topArtistsCache';

export default function QuickStats({ isMobile }) {
  const [topArtist, setTopArtist] = useState(null);
  const [topSong, setTopSong] = useState(null);
  const [topGenres, setTopGenres] = useState([]);
  const [topStyles, setTopStyles] = useState([]);
  const [topArtistTimeRange, setTopArtistTimeRange] = useState(null);
  const [topSongTimeRange, setTopSongTimeRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuickStats = async () => {
      console.log('🔍 QuickStats: Checking cache validity...');
      console.log('Cache valid:', isCacheValid());
      console.log('Has complete cache:', hasCompleteCache());
      
      if (!isCacheValid() || !hasCompleteCache()) {
        console.log('❌ QuickStats: Cache not ready yet, will retry...');
        setLoading(false);
        return;
      }

      try {
        console.log('✅ QuickStats: Cache is ready, loading data...');
        
        // Get top artists from cache
        const topArtists = getCachedTopArtists();
        console.log('📊 Top artists from cache:', topArtists?.length || 0);
        
        if (topArtists && topArtists.length > 0) {
          // Find the artist with the best overall ranking, prioritizing 12 months
          let bestArtist = topArtists[0];
          let bestRank = Infinity;
          let bestTimeRange = null;
          
          topArtists.forEach(artist => {
            const rankings = artist.rankings || {};
            
            // Priority 1: 12 months (last year) - highest priority
            if (rankings['12_months'] && rankings['12_months'] < bestRank) {
              bestRank = rankings['12_months'];
              bestArtist = artist;
              bestTimeRange = '12_months';
            }
          });
          
          // If no 12 months data, fall back to 6 months
          if (bestTimeRange !== '12_months') {
            topArtists.forEach(artist => {
              const rankings = artist.rankings || {};
              if (rankings['6_months'] && rankings['6_months'] < bestRank) {
                bestRank = rankings['6_months'];
                bestArtist = artist;
                bestTimeRange = '6_months';
              }
            });
          }
          
          // If still no data, fall back to 4 weeks
          if (bestTimeRange === null) {
            topArtists.forEach(artist => {
              const rankings = artist.rankings || {};
              if (rankings['4_weeks'] && rankings['4_weeks'] < bestRank) {
                bestRank = rankings['4_weeks'];
                bestArtist = artist;
                bestTimeRange = '4_weeks';
              }
            });
          }
          
          console.log('🎯 Best artist found:', bestArtist?.name, 'with ranking:', bestRank, 'in period:', bestTimeRange);
          setTopArtist(bestArtist);
          setTopArtistTimeRange(bestTimeRange);

          // Get top 3 artists ranked by 12_months from spotify_top_artists
          const top3Artists = topArtists
            .filter(artist => artist.rankings && artist.rankings['12_months'])
            .sort((a, b) => a.rankings['12_months'] - b.rankings['12_months'])
            .slice(0, 3);

          console.log('Top 3 artists for 12 months:', top3Artists);
          console.log('Total artists in cache:', topArtists.length);
          console.log('Artists with 12_months rankings:', topArtists.filter(a => a.rankings && a.rankings['12_months']).length);

          if (top3Artists.length > 0) {
            console.log('Starting Discogs API calls for:', top3Artists.map(a => `${a.name} (#${a.rankings['12_months']})`));
            
            // Make individual Discogs API calls for each artist
            const discogsPromises = top3Artists.map(async (artist, index) => {
              try {
                const artistName = artist.name;
                const apiUrl = `http://127.0.0.1:8000/discogs/artist?name=${encodeURIComponent(artistName)}`;
                console.log(`[${index + 1}/3] Fetching Discogs data for "${artistName}" from:`, apiUrl);
                
                const response = await fetch(apiUrl);
                console.log(`[${index + 1}/3] Response status for "${artistName}":`, response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`[${index + 1}/3] Success! Discogs data for "${artistName}":`, data);
                  console.log(`[${index + 1}/3] Genres found:`, data.genres?.length || 0);
                  console.log(`[${index + 1}/3] Styles found:`, data.styles?.length || 0);
                  
                  return {
                    name: artistName,
                    rank: artist.rankings['12_months'],
                    genres: data.genres || [],
                    styles: data.styles || []
                  };
                } else {
                  const errorText = await response.text();
                  console.error(`[${index + 1}/3] Failed to fetch Discogs data for "${artistName}":`, response.status, errorText);
                  return null;
                }
              } catch (err) {
                console.error(`[${index + 1}/3] Network error for "${artist.name}":`, err);
                return null;
              }
            });

            console.log('Waiting for all Discogs API calls to complete...');
            const discogsResults = await Promise.all(discogsPromises);
            console.log('All Discogs API calls completed. Results:', discogsResults);
            
            const validResults = discogsResults.filter(result => result !== null);
            console.log('Valid Discogs results:', validResults);

            if (validResults.length > 0) {
              // Calculate most common genres
              const genreCounts = {};
              validResults.forEach(result => {
                result.genres.forEach(genre => {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
              });

              const sortedGenres = Object.entries(genreCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              console.log('Final top genres:', sortedGenres);
              setTopGenres(sortedGenres);

              // Calculate most common styles
              const styleCounts = {};
              validResults.forEach(result => {
                result.styles.forEach(style => {
                  styleCounts[style] = (styleCounts[style] || 0) + 1;
                });
              });

              const sortedStyles = Object.entries(styleCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              console.log('Final top styles:', sortedStyles);
              setTopStyles(sortedStyles);
            } else {
              console.log('No valid Discogs results found - setting empty arrays');
              setTopGenres([]);
              setTopStyles([]);
            }
          } else {
            console.log('No artists with 12_months rankings found - setting empty arrays');
            setTopGenres([]);
            setTopStyles([]);
          }
        }

        // Get top tracks from cache
        const topTracks = getCachedTopTracks();
        console.log('📊 Top tracks from cache:', topTracks?.length || 0);
        
        if (topTracks && topTracks.length > 0) {
          // Find the track with the best overall ranking, prioritizing 12 months
          let bestTrack = topTracks[0];
          let bestRank = Infinity;
          let bestTimeRange = null;
          
          topTracks.forEach(track => {
            const rankings = track.rankings || {};
            
            // Priority 1: 12 months (last year) - highest priority
            if (rankings['12_months'] && rankings['12_months'] < bestRank) {
              bestRank = rankings['12_months'];
              bestTrack = track;
              bestTimeRange = '12_months';
            }
          });
          
          // If no 12 months data, fall back to 6 months
          if (bestTimeRange !== '12_months') {
            topTracks.forEach(track => {
              const rankings = track.rankings || {};
              if (rankings['6_months'] && rankings['6_months'] < bestRank) {
                bestRank = rankings['6_months'];
                bestTrack = track;
                bestTimeRange = '6_months';
              }
            });
          }
          
          // If still no data, fall back to 4 weeks
          if (bestTimeRange === null) {
            topTracks.forEach(track => {
              const rankings = track.rankings || {};
              if (rankings['4_weeks'] && rankings['4_weeks'] < bestRank) {
                bestRank = rankings['4_weeks'];
                bestTrack = track;
                bestTimeRange = '4_weeks';
              }
            });
          }
          
          console.log('🎵 Best track found:', bestTrack?.name, 'with ranking:', bestRank, 'in period:', bestTimeRange);
          setTopSong(bestTrack);
          setTopSongTimeRange(bestTimeRange);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading quick stats:', err);
        // Don't show error, just don't render anything
        setLoading(false);
      }
    };

    // Initial load
    loadQuickStats();

    // Set up polling to check for cache updates every 2 seconds
    const cacheCheckInterval = setInterval(() => {
      console.log('🔄 QuickStats: Polling cache for updates...');
      if (isCacheValid() && hasCompleteCache() && (!topArtist || !topSong)) {
        console.log('🆕 QuickStats: Cache updated, reloading data...');
        loadQuickStats();
      }
    }, 2000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(cacheCheckInterval);
    };
  }, [topArtist, topSong]);

  // Don't render anything if no data is available
  if (loading || !topArtist || !topSong) {
    return null;
  }

  // Show loading state while fetching Discogs data
  if (topGenres.length === 0 && topStyles.length === 0) {
    return (
      <div style={{
        padding: '32px 16px',
        margin: '32px auto',
        maxWidth: '1200px',
        width: '95%'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '0.5px'
        }}>
          Your Music Highlights
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Top Artist Card */}
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
                background: 'linear-gradient(135deg, #1db954, #1ed760)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <img 
                  src="/3580649-200.png" 
                  alt="Artist Icon" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Artist
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most listened to
                </p>
              </div>
            </div>
            
            {topArtist ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {topArtist.images && topArtist.images[0] && topArtist.images[0].url ? (
                  <img
                    src={topArtist.images[0].url}
                    alt={topArtist.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #1db954, #1ed760)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '1.5rem'
                  }}>
                    {topArtist.name?.[0] || '?'}
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0'
                  }}>
                    {topArtist.name || 'Unknown Artist'}
                  </h4>
                  
                  {/* Show rankings if available */}
                  {topArtist.rankings && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.entries(topArtist.rankings).map(([period, rank]) => (
                        rank && (
                          <span key={period} style={{
                            background: '#1db954',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {period.replace('_', ' ')}: #{rank}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No artist data available
              </div>
            )}
          </div>

          {/* Top Song Card */}
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
                background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Top Song
                </h3>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Most played track
                </p>
              </div>
            </div>
            
            {topSong ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {topSong.album && topSong.album.images && topSong.album.images[0] && topSong.album.images[0].url ? (
                  <img
                    src={topSong.album.images[0].url}
                    alt={topSong.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '1.5rem'
                  }}>
                    🎵
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0'
                  }}>
                    {topSong.name || 'Unknown Song'}
                  </h4>
                  
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '1rem',
                    margin: '0 0 8px 0'
                  }}>
                    {topSong.artists && topSong.artists[0] ? topSong.artists[0].name : 'Unknown Artist'}
                  </p>
                  
                  {/* Show rankings if available */}
                  {topSong.rankings && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.entries(topSong.rankings).map(([period, rank]) => (
                        rank && (
                          <span key={period} style={{
                            background: '#ff6b6b',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {period.replace('_', ' ')}: #{rank}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No song data available
              </div>
            )}
          </div>

          {/* Loading message for genres and styles */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: '#b3b3b3',
            fontStyle: 'italic'
          }}>
            Loading detailed music analysis...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '24px',
        margin: '32px auto',
        maxWidth: '1200px',
        width: '95%',
        minHeight: '200px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <div style={{
          color: '#ff6b6b',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px 16px',
      margin: '32px auto',
      maxWidth: '1200px',
      width: '95%'
    }}>
      <h2 style={{
        color: '#fff',
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '16px',
        letterSpacing: '0.5px'
      }}>
        Your Music Highlights
      </h2>
      
      
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Top Artist Card */}
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
              background: 'linear-gradient(135deg, #1db954, #1ed760)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <img 
                src="/3580649-200.png" 
                alt="Artist Icon" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Artist
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                Most listened to
              </p>
            </div>
          </div>
          
          {topArtist ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {topArtist.images && topArtist.images[0] && topArtist.images[0].url ? (
                <img
                  src={topArtist.images[0].url}
                  alt={topArtist.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #1db954, #1ed760)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
                  {topArtist.name?.[0] || '?'}
                </div>
              )}
              
              <div style={{ flex: 1 }}>

                
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {topArtist.name || 'Unknown Artist'}
                </h4>
                
                {/* Show rankings if available */}
                {topArtist.rankings && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {Object.entries(topArtist.rankings).map(([period, rank]) => (
                      rank && (
                        <span key={period} style={{
                          background: '#1db954',
                          color: '#000',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}: #{rank}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              color: '#b3b3b3',
              textAlign: 'center',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No artist data available
            </div>
          )}
        </div>

        {/* Top Song Card */}
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
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Song
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                Most played track
              </p>
            </div>
          </div>
          
          {topSong ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {topSong.album && topSong.album.images && topSong.album.images[0] && topSong.album.images[0].url ? (
                <img
                  src={topSong.album.images[0].url}
                  alt={topSong.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
                  🎵
                </div>
              )}
              
              <div style={{ flex: 1 }}>

                
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {topSong.name || 'Unknown Song'}
                </h4>
                
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '1rem',
                  margin: '0 0 8px 0'
                }}>
                  {topSong.artists && topSong.artists[0] ? topSong.artists[0].name : 'Unknown Artist'}
                </p>
                
                {/* Show rankings if available */}
                {topSong.rankings && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {Object.entries(topSong.rankings).map(([period, rank]) => (
                      rank && (
                        <span key={period} style={{
                          background: '#ff6b6b',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {period.replace('_', ' ')}: #{rank}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              color: '#b3b3b3',
              textAlign: 'center',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No song data available
            </div>
          )}
        </div>

        {/* Top Genres Card */}
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
              background: 'linear-gradient(135deg, #a855f7, #c084fc)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Genres
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                From your top artists
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {topGenres.length > 0 ? (
              topGenres.map((genre, index) => (
                <div key={genre.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#ffd700' : 
                                 index === 1 ? '#c0c0c0' : 
                                 index === 2 ? '#cd7f32' : '#a855f7',
                      color: index < 3 ? '#000' : '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {genre.name}
                    </span>
                  </div>
                  
                  <span style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {genre.count} artists
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                color: '#b3b3b3',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No genre data available
              </div>
            )}
          </div>
        </div>

        {/* Top Styles Card */}
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
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
              </svg>
            </div>
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Top Styles
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0'
              }}>
                From your top artists
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {topStyles.length > 0 ? (
              topStyles.map((style, index) => (
                <div key={style.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      background: index === 0 ? '#ffd700' : 
                                 index === 1 ? '#c0c0c0' : 
                                 index === 2 ? '#cd7f32' : '#f59e0b',
                      color: index < 3 ? '#000' : '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {style.name}
                    </span>
                  </div>
                  
                  <span style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {style.count} artists
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No style data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
