import React from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches } from '../../../utils/recentSearchesCache';

// Shared utility function for navigating to artist page with server-side search
const navigateToArtistPage = async (router, artistName, artistId) => {
  try {
    console.log(`[ListeningEvolutionCard] Searching for artist: ${artistName}`);
    
    // Make server-side API call for enhanced artist search
    const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        console.log(`[ListeningEvolutionCard] Server search successful for: ${artistName}`, data);
        
        // Navigate using server-provided parameters
        router.push(data.navigationUrl);
        return;
      } else {
        console.log(`[ListeningEvolutionCard] Server search failed for: ${artistName}`, data.message);
      }
    } else {
      console.log(`[ListeningEvolutionCard] Server search failed for: ${artistName}`, response.status);
    }
  } catch (error) {
    console.error(`[ListeningEvolutionCard] Error during server search for: ${artistName}`, error);
  }
  
  // Fallback to basic navigation if server search fails
  console.log(`[ListeningEvolutionCard] Using fallback navigation for: ${artistName}`);
  
  const params = [`name=${encodeURIComponent(artistName)}`];
  
  // Add spotifyId if available
  if (artistId) {
    params.push(`spotifyId=${encodeURIComponent(artistId)}`);
  }
  
  // Check localStorage for ticketmasterId (now protected)
  const recents = getRecentSearches();
  const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
  if (cachedArtist?.ticketmasterId) {
    params.push(`ticketmasterId=${encodeURIComponent(cachedArtist.ticketmasterId)}`);
  }
  
  // Navigate to artist page
  router.push(`/artist?${params.join('&')}`);
};

/**
 * ListeningEvolutionCard Component
 * 
 * Displays listening evolution analysis showing new vs break songs/artists
 * Shows newly discovered content and content taking breaks
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles listening evolution display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Clickable - artist names navigate to artist pages
 */
export default function ListeningEvolutionCard({ evolution }) {
  const router = useRouter();

  if (!evolution) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No evolution data available
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
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
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
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Listening Evolution
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Your music discovery journey
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Newly Discovered Songs */}
        {evolution.newSongs.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <h4 style={{
              color: '#22c55e',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🆕</span>
              Newly Discovered Songs ({evolution.newSongs.length})
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {evolution.newSongs.map((song, index) => (
                <div key={song.id} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Album Image */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {song.album && song.album.images && song.album.images[0] && song.album.images[0].url ? (
                        <img
                          src={song.album.images[0].url}
                          alt={song.album.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          🎵
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        margin: '0 0 2px 0'
                      }}>
                        {song.name}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '0'
                      }}>
                        {song.artists.map(artist => (
                          <span
                            key={artist.id}
                            style={{
                              color: '#22c55e',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                              textDecoration: 'underline'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = '#16a34a';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = '#22c55e';
                            }}
                            onClick={() => navigateToArtistPage(router, artist.name, artist.id)}
                          >
                            {artist.name}
                          </span>
                        )).reduce((prev, curr) => [prev, ', ', curr])}
                      </p>
                    </div>
                    
                    <span style={{
                      background: '#22c55e',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      New
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Newly Discovered Artists */}
        {evolution.newArtists.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h4 style={{
              color: '#3b82f6',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎤</span>
              Newly Discovered Artists ({evolution.newArtists.length})
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {evolution.newArtists.map((artist, index) => (
                <div key={artist.id} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Artist Image */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {artist.images && artist.images[0] && artist.images[0].url ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : artist.albumImage ? (
                        <img
                          src={artist.albumImage}
                          alt={artist.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {artist.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p 
                        style={{
                          color: '#3b82f6',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          margin: '0 0 2px 0',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease',
                          textDecoration: 'underline'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#3b82f6';
                        }}
                        onClick={() => navigateToArtistPage(router, artist.name, artist.id)}
                      >
                        {artist.name}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '0'
                      }}>
                        {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <span style={{
                      background: '#3b82f6',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      New
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Songs Taking a Break */}
        {evolution.breakSongs.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <h4 style={{
              color: '#f59e0b',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⏸️</span>
              Songs Taking a Break ({evolution.breakSongs.length})
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {evolution.breakSongs.map((song, index) => (
                <div key={song.id} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Album Image */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {song.album && song.album.images && song.album.images[0] && song.album.images[0].url ? (
                        <img
                          src={song.album.images[0].url}
                          alt={song.album.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          🎵
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        margin: '0 0 2px 0'
                      }}>
                        {song.name}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '0'
                      }}>
                        {song.artists.map(artist => (
                          <span
                            key={artist.id}
                            style={{
                              color: '#f59e0b',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                              textDecoration: 'underline'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = '#d97706';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = '#f59e0b';
                            }}
                            onClick={() => navigateToArtistPage(router, artist.name, artist.id)}
                          >
                            {artist.name}
                          </span>
                        )).reduce((prev, curr) => [prev, ', ', curr])}
                      </p>
                    </div>
                    
                    <span style={{
                      background: '#f59e0b',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      Break
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artists Taking a Break */}
        {evolution.breakArtists.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <h4 style={{
              color: '#ef4444',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎭</span>
              Artists Taking a Break ({evolution.breakArtists.length})
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {evolution.breakArtists.map((artist, index) => (
                <div key={artist.id} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Artist Image */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {artist.images && artist.images[0] && artist.images[0].url ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : artist.albumImage ? (
                        <img
                          src={artist.albumImage}
                          alt={artist.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {artist.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p 
                        style={{
                          color: '#ef4444',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          margin: '0 0 2px 0',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease',
                          textDecoration: 'underline'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#ef4444';
                        }}
                        onClick={() => navigateToArtistPage(router, artist.name, artist.id)}
                      >
                        {artist.name}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '0'
                      }}>
                        {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      Break
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
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
              const newSongsCount = evolution.newSongs.length;
              const breakSongsCount = evolution.breakSongs.length;
              const newArtistsCount = evolution.newArtists.length;
              const breakArtistsCount = evolution.breakArtists.length;
              
              if (newSongsCount > breakSongsCount && newArtistsCount > breakArtistsCount) {
                return "You're actively discovering new music! Your listening habits show a strong trend toward exploring fresh artists and songs.";
              } else if (newSongsCount > breakSongsCount) {
                return "You're discovering new songs while maintaining some of your favorite artists. A balanced approach to music exploration.";
              } else if (newArtistsCount > breakArtistsCount) {
                return "You're exploring new artists but sticking to familiar songs. You like to discover new voices through trusted tracks.";
              } else if (breakSongsCount > 0 || breakArtistsCount > 0) {
                return "You're taking breaks from some of your previous favorites, possibly making room for new discoveries or returning to classics.";
              } else {
                return "Your listening patterns are stable, with consistent favorites across different time periods.";
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
