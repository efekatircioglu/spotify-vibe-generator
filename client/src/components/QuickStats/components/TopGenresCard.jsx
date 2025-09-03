import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches, getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../../../utils/recentSearchesCache';
import { getApiBaseUrl } from '../../../config/api';

// Get cached top artists from sessionStorage
const getCachedTopArtists = () => {
  try {
    const cached = sessionStorage.getItem('spotify_top_artists');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data.artists || data; // Handle both formats
  } catch (error) {
    console.error('Error reading top artists cache:', error);
    return null;
  }
};

// Enhanced navigation function with Ticketmaster ID lookup
const navigateToArtistPage = async (router, artistName, artistId) => {
  
  // Build navigation parameters
  const params = [`name=${encodeURIComponent(artistName)}`];
  
  // Add Spotify ID if available
  if (artistId) {
    params.push(`spotifyId=${encodeURIComponent(artistId)}`);
  }
  
  // Check recent searches for ticketmasterId first (fastest)
  let ticketmasterId = getTicketmasterIdFromRecentSearch(artistName);
  if (ticketmasterId) {
    params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
  }
  
  // If we have both Spotify ID and Ticketmaster ID, navigate immediately
  if (artistId && ticketmasterId) {
    router.push(`/artist?${params.join('&')}`);
    return;
  }
  
  // If no artistId, check cached top artists
  if (!artistId) {
    const topArtists = getCachedTopArtists();
    const cachedArtist = topArtists?.find(a => a.name.toLowerCase() === artistName.toLowerCase());
    
    if (cachedArtist) {
      params.push(`spotifyId=${encodeURIComponent(cachedArtist.id)}`);
      
      // Navigate if we have both IDs
      if (ticketmasterId) {
        router.push(`/artist?${params.join('&')}`);
        return;
      }
    }
  }
  
  // If we still don't have Ticketmaster ID, try to fetch it
  if (!ticketmasterId) {
    try {
      const ticketmasterResponse = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`, {
        credentials: 'include'
      });
      
      if (ticketmasterResponse.ok) {
        const ticketmasterData = await ticketmasterResponse.json();
        
        // Look for exact match
        const exactMatch = ticketmasterData.allAttractions?.find(
          attraction => attraction.name.toLowerCase() === artistName.toLowerCase()
        );
        
        if (exactMatch) {
          ticketmasterId = exactMatch.ticketmasterId || exactMatch.id;
          
          // Update cache with Ticketmaster ID
          const artistObj = {
            name: artistName,
            spotifyId: artistId,
            ticketmasterId: ticketmasterId
          };
          updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
          
          params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error(`[TopGenresCard] Error fetching Ticketmaster ID for ${artistName}:`, error);
    }
  }
  
  // Navigate with whatever data we have
  router.push(`/artist?${params.join('&')}`);
};

// Genre Artists Modal Component
function GenreArtistsModal({ isOpen, onClose, genre, artistCount, artists, genreDetails }) {
  const router = useRouter();

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Get the stored scroll position
      const scrollY = document.body.style.top;
      
      // Unlock scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px #0006',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#a0a0a0',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Modal content */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            color: '#f3f3f3',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            textTransform: 'capitalize'
          }}>
            {genre}
          </h2>
          <p style={{
            color: '#a0a0a0',
            fontSize: '1rem',
            marginBottom: '20px'
          }}>
            {artistCount} artist{artistCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Artists list */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            color: '#e5e5e5',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Artists in this genre:
          </h3>
          
          {artists && artists.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {artists.map((artistName, index) => {
                const artistObj = genreDetails?.[genre]?.artists?.find(a => a.name === artistName);
                
                return (
                  <div
                    key={index}
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(34, 202, 123, 0.15)',
                      borderRadius: '12px',
                      border: '2px solid rgba(34, 202, 123, 0.3)',
                      color: '#e5e5e5',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 202, 123, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(34, 202, 123, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 202, 123, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 202, 123, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(34, 202, 123, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={async () => {
                      // Use the optimized navigation function with artist ID from genreDetails
                      const artistId = artistObj?.spotifyId || artistObj?.id;
                      await navigateToArtistPage(router, artistName, artistId);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Artist image or placeholder */}
                      {artistObj?.image || artistObj?.images?.[0]?.url ? (
                        <img
                          src={artistObj.image || artistObj.images[0].url}
                          alt={artistName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(34, 202, 123, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#22ca7b',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {artistName[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <span>{artistName}</span>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div style={{
                      color: '#22ca7b',
                      fontSize: '18px',
                      transition: 'transform 0.2s ease'
                    }}>
                      →
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#a0a0a0',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              Artist data not available yet. 
              <br />
              <small>Backend needs to be updated to include artist lists per genre.</small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          
        </div>
      </div>
    </div>
  );
}

/**
 * TopGenresCard Component
 * 
 * Displays the most common genres from user's top artists
 * Shows all available genres from top artists
 * Shows top 5 initially with scrollable list for more
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles genres display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Scrollable - shows top 5 with scroll for more
 * ✅ Clickable - each genre opens modal with artists
 * ✅ Navigable - artists link to their pages
 */
export default function TopGenresCard({ genres, genreDetails }) {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);

  if (!genres || genres.length === 0) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No genre data available
      </div>
    );
  }

  // Handle genre click
  const handleGenreClick = (genre, count) => {
    setSelectedGenre({ name: genre, count });
    setShowGenreModal(true);
  };

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
            Most listened genres
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '300px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}
      className="custom-scrollbar">
        {genres.map((genre, index) => (
            <div 
              key={genre.name} 
              style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 202, 123, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(34, 202, 123, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => handleGenreClick(genre.name, genre.count)}
            >
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
              <h4 style={{
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0',
                textTransform: 'capitalize',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}>
                {genre.name}
              </h4>
            </div>
            
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
            <span style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {genre.count} artists
            </span>
                <span style={{
                  color: '#22ca7b',
                  fontSize: '16px',
                  transition: 'transform 0.2s ease'
                }}>
                  →
                </span>
              </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c084fc;
        }
      `}</style>
    </div>

      {/* Genre Artists Modal */}
      <GenreArtistsModal
        isOpen={showGenreModal}
        onClose={() => setShowGenreModal(false)}
        genre={selectedGenre?.name}
        artistCount={selectedGenre?.count}
        artists={genreDetails?.[selectedGenre?.name]?.artists?.map(a => a.name) || []}
        genreDetails={genreDetails}
      />
    </>
  );
}
