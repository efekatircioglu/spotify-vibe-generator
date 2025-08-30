import React from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches } from '../../../utils/recentSearchesCache';

/**
 * TimeOfDayCard Component
 * 
 * Displays time of day analysis showing when user listens to music most
 * Shows time slots and most active listening periods
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles time of day display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function TimeOfDayCard({ timeAnalysis }) {
  const router = useRouter();

  // Navigation utility function
  const navigateToArtistPage = async (artistName, artistId) => {
    try {
      console.log(`[TimeOfDayCard] Searching for artist: ${artistName}`);
      
      // Make server-side API call for enhanced artist search
      const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log(`[TimeOfDayCard] Server search successful for: ${artistName}`, data);
          
          // Navigate using server-provided parameters
          router.push(data.navigationUrl);
          return;
        } else {
          console.log(`[TimeOfDayCard] Server search failed for: ${artistName}`, data.message);
        }
      } else {
        console.log(`[TimeOfDayCard] Server search failed for: ${artistName}`, response.status);
      }
    } catch (error) {
      console.error(`[TimeOfDayCard] Error during server search for: ${artistName}`, error);
    }
    
    // Fallback to basic navigation if server search fails
    console.log(`[TimeOfDayCard] Using fallback navigation for: ${artistName}`);
    
    const params = [`name=${encodeURIComponent(artistName)}`];
    
    // Check localStorage for ticketmasterId (now protected)
    const recents = getRecentSearches();
    const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
    if (cachedArtist?.ticketmasterId) {
      params.push(`ticketmasterId=${encodeURIComponent(cachedArtist.ticketmasterId)}`);
    }
    
    // Navigate to artist page
    router.push(`/artist?${params.join('&')}`);
  };
  if (!timeAnalysis) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No time analysis data available
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
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <polyline points="12,1 12,3"></polyline>
            <polyline points="12,21 12,23"></polyline>
            <polyline points="4.22,4.22 5.64,5.64"></polyline>
            <polyline points="18.36,18.36 19.78,19.78"></polyline>
            <polyline points="1,12 3,12"></polyline>
            <polyline points="21,12 23,12"></polyline>
            <polyline points="4.22,19.78 5.64,18.36"></polyline>
            <polyline points="18.36,5.64 19.78,4.22"></polyline>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Time of Day Analysis
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            When you listen to music most
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Most Active Time */}
        {timeAnalysis.mostActiveSlot && (
          <div style={{
            padding: '16px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            textAlign: 'center'
          }}>
            <h4 style={{
              color: '#f59e0b',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              Your Most Active Time
            </h4>
            <p style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 4px 0'
            }}>
              {timeAnalysis.mostActiveSlot}
            </p>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: '0'
            }}>
              {timeAnalysis.timeSlots[timeAnalysis.mostActiveSlot].count} songs played
            </p>
          </div>
        )}

        {/* Time Slots Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {Object.entries(timeAnalysis.timeSlots).map(([slotName, slot]) => {
            if (slot.count === 0) return null;
            
            const isMostActive = slotName === timeAnalysis.mostActiveSlot;
            const percentage = Math.round((slot.count / timeAnalysis.analyzedSongs) * 100);
            
            return (
              <div key={slotName} style={{
                padding: '16px',
                background: isMostActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: isMostActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative'
              }}>
                {isMostActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#f59e0b',
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    Most Active
                  </div>
                )}
                
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  {slotName}
                </h5>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {slot.count}
                  </span>
                  <span style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem'
                  }}>
                    {percentage}%
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: isMostActive ? '#f59e0b' : '#3b82f6',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.8rem',
                  margin: '8px 0 0 0'
                }}>
                  {slot.start.toString().padStart(2, '0')}:00 - {slot.end.toString().padStart(2, '0')}:00
                </p>
              </div>
            );
          })}
        </div>

        {/* Sample Songs from Most Active Time */}
        {timeAnalysis.mostActiveSlot && timeAnalysis.timeSlots[timeAnalysis.mostActiveSlot].songs.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h5 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Most Recent Songs from {timeAnalysis.mostActiveSlot}
            </h5>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {timeAnalysis.timeSlots[timeAnalysis.mostActiveSlot].songs.slice(0, 8).map((song, index) => (
                <div key={index} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1
                    }}>
                      {/* Artist Image */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {song.artists && song.artists[0] && song.artists[0].images && song.artists[0].images[0] && song.artists[0].images[0].url ? (
                          <img 
                            src={song.artists[0].images[0].url} 
                            alt={song.artists[0].name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : song.album && song.album.images && song.album.images[0] && song.album.images[0].url ? (
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: '600'
                          }}>
                            {song.artists && song.artists[0] ? song.artists[0].name.charAt(0).toUpperCase() : '?'}
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
                          {song.artists.map((artist, artistIndex) => (
                            <span key={artist.id}>
                              <span
                                style={{
                                  color: '#b3b3b3',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s ease',
                                  textDecoration: 'underline'
                                }}
                                onMouseEnter={(e) => { e.target.style.color = '#f59e0b'; }}
                                onMouseLeave={(e) => { e.target.style.color = '#b3b3b3'; }}
                                onClick={() => navigateToArtistPage(artist.name, artist.id)}
                              >
                                {artist.name}
                              </span>
                              {artistIndex < song.artists.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      background: '#f59e0b',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      {song.hour.toString().padStart(2, '0')}:{song.minute ? song.minute.toString().padStart(2, '0') : '00'}
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
            Listening Pattern Summary
          </h5>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0',
            lineHeight: '1.4'
          }}>
            {(() => {
              const mostActive = timeAnalysis.mostActiveSlot;
              const count = timeAnalysis.timeSlots[mostActive].count;
              const total = timeAnalysis.analyzedSongs;
              const percentage = Math.round((count / total) * 100);
              
              if (mostActive === '8-12 AM') {
                return `You're a morning person! ${percentage}% of your music listening happens during morning hours (8:00-12:00). You start your day with great tunes!`;
              } else if (mostActive === '12-4 PM') {
                return `You're an afternoon listener! ${percentage}% of your music happens during afternoon hours (12:00-16:00). Perfect timing for a midday energy boost!`;
              } else if (mostActive === '4-8 PM') {
                return `You're an evening music lover! ${percentage}% of your listening happens during evening hours (16:00-20:00). Great way to unwind after work!`;
              } else if (mostActive === '8-12 PM') {
                return `You're a night owl! ${percentage}% of your music listening happens during night hours (20:00-24:00). Music keeps you company during late hours!`;
              } else  {
                return `You're a late-night/early-morning listener! ${percentage}% of your music happens during late night, or early morning hours (0:00-8:00). Music accompanies your late night activities or early morning wakeups!`;
              } 
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
