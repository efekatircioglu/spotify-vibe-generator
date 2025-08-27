import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches } from '../utils/recentSearchesCache';

// Shared utility function for navigating to artist page with server-side search
const navigateToArtistPage = async (router, artistName, genreDetails) => {
  try {
    console.log(`[View Full Profile] Searching for artist: ${artistName}`);
    
    // Make server-side API call for enhanced artist search
    const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        console.log(`[View Full Profile] Server search successful for: ${artistName}`, data);
        
        // Navigate using server-provided parameters
        router.push(data.navigationUrl);
        return;
      } else {
        console.log(`[View Full Profile] Server search failed for: ${artistName}`, data.message);
      }
    } else {
      console.log(`[View Full Profile] Server search failed for: ${artistName}`, response.status);
    }
  } catch (error) {
    console.error(`[View Full Profile] Error during server search for: ${artistName}`, error);
  }
  
  // Fallback to basic navigation if server search fails
  console.log(`[View Full Profile] Using fallback navigation for: ${artistName}`);
  
  const params = [`name=${encodeURIComponent(artistName)}`];
  
  // Try to get spotifyId from genreDetails if available
  if (genreDetails && genreDetails[artistName]) {
    const spotifyId = genreDetails[artistName].spotifyId;
    if (spotifyId) {
      params.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
    }
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

// Artist Songs Modal Component
function ArtistSongsModal({ isOpen, onClose, artist, artistCount, songs, loading, genreDetails, mainArtistsData }) {
  const router = useRouter();
  
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
          Songs by {artist}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '1rem',
          color: '#a0a0a0',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {songs.length} tracks from playlist
        </div>

        {/* Songs Table */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid rgba(34, 202, 123, 0.2)',
          borderRadius: '12px',
          background: '#2a2a2a'
        }}>
          {loading ? (
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
          ) : songs.length > 0 ? (
            <>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 2fr 1fr 1fr',
                gap: '16px',
                padding: '16px 20px',
                background: 'rgba(34, 202, 123, 0.15)',
                borderBottom: '1px solid rgba(34, 202, 123, 0.3)',
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.9rem'
              }}>
                <div>Song Name</div>
                <div>Album</div>
                <div>Year</div>
                <div>Duration</div>
              </div>

              {/* Table Body */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {songs.map((song, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 2fr 1fr 1fr',
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
                      {song.album}
                    </div>
                    <div style={{
                      color: '#a0a0a0',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}>
                      {song.year}
                    </div>
                    <div style={{
                      color: '#a0a0a0',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}>
                      {song.duration}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#a0a0a0'
            }}>
              No songs found for this artist.
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
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={async () => {
                // Navigate to artist page using the shared function with server-side search
                await navigateToArtistPage(router, artist, genreDetails);
                onClose(); // Close the modal after navigation
              }}
              style={{
                padding: '10px 20px',
                background: 'rgba(34, 202, 123, 0.2)',
                border: '1px solid rgba(34, 202, 123, 0.4)',
                borderRadius: '8px',
                color: '#22ca7b',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(34, 202, 123, 0.3)';
                e.target.style.borderColor = 'rgba(34, 202, 123, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(34, 202, 123, 0.2)';
                e.target.style.borderColor = 'rgba(34, 202, 123, 0.4)';
              }}
            >
              🎵 View Full Artist Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Genre Artists Modal Component
function GenreArtistsModal({ isOpen, onClose, genre, artistCount, artists, genreDetails, mainArtistsData }) {
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
                      // Make server-side API call for artist search (just like View Full Artist Profile)
                      try {
                        console.log(`[Genre Modal] Searching for artist: ${artistName}`);
                        
                        const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
                        
                        if (response.ok) {
                          const data = await response.json();
                          
                          if (data.success) {
                            console.log(`[Genre Modal] Server search successful for: ${artistName}`, data);
                            
                            // Navigate using server-provided parameters
                            router.push(data.navigationUrl);
                          } else {
                            console.log(`[Genre Modal] Server search failed for: ${artistName}`, data.message);
                            
                            // Fallback to basic navigation
                            const fallbackParams = [`name=${encodeURIComponent(artistName)}`];
                            
                            // Try to get spotifyId from genreDetails if available
                            if (genreDetails && genreDetails[artistName]) {
                              const spotifyId = genreDetails[artistName].spotifyId;
                              if (spotifyId) {
                                fallbackParams.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
                              }
                            }
                            
                            // Check localStorage for ticketmasterId (now protected)
                            const recents = getRecentSearches();
                            const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
                            if (cachedArtist?.ticketmasterId) {
                              fallbackParams.push(`ticketmasterId=${encodeURIComponent(cachedArtist.ticketmasterId)}`);
                            }
                            
                            router.push(`/artist?${fallbackParams.join('&')}`);
                          }
                        } else {
                          console.log(`[Genre Modal] Server search failed for: ${artistName}`, response.status);
                          
                          // Fallback to basic navigation
                          const fallbackParams = [`name=${encodeURIComponent(artistName)}`];
                          
                          // Try to get spotifyId from genreDetails if available
                          if (genreDetails && genreDetails[artistName]) {
                            const spotifyId = genreDetails[artistName].spotifyId;
                            if (spotifyId) {
                              fallbackParams.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
                            }
                          }
                          
                          // Check localStorage for ticketmasterId (now protected)
                          const recents = getRecentSearches();
                          const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
                          if (cachedArtist?.ticketmasterId) {
                            fallbackParams.push(`ticketmasterId=${encodeURIComponent(cachedArtist.ticketmasterId)}`);
                          }
                          
                          router.push(`/artist?${fallbackParams.join('&')}`);
                        }
                      } catch (error) {
                        console.error(`[Genre Modal] Error during server search for: ${artistName}`, error);
                        
                        // Fallback to basic navigation
                        const fallbackParams = [`name=${encodeURIComponent(artistName)}`];
                        
                        // Try to get spotifyId from genreDetails if available
                        if (genreDetails && genreDetails[artistName]) {
                          const spotifyId = genreDetails[artistName].spotifyId;
                          if (spotifyId) {
                            fallbackParams.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
                          }
                        }
                        
                        // Check localStorage for ticketmasterId (now protected)
                        const recents = getRecentSearches();
                        const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
                        if (cachedArtist?.ticketmasterId) {
                          fallbackParams.push(`ticketmasterId=${encodeURIComponent(cachedArtist.ticketmasterId)}`);
                        }
                        
                        router.push(`/artist?${fallbackParams.join('&')}`);
                      }
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
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#e5e5e5',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GenreLeaderboardChart({ genres, title, timeRange, genreDetails, mainArtistsData, onClose }) {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showSongsModal, setShowSongsModal] = useState(false);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Handle cases where genres might be undefined, null, or empty
  if (!genres || typeof genres !== 'object' || Object.keys(genres).length === 0) {
    return (
      <div style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: 'clamp(20px, 3vw, 32px)',
        margin: 'clamp(20px, 3vw, 32px) auto',
        maxWidth: 'clamp(95vw, 98vw, 98vw)',
        width: 'clamp(95vw, 98vw, 98vw)',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        textAlign: 'center',
        color: '#a0a0a0'
      }}>
        {/* Close button - only show if onClose is provided (modal mode) */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(24, 28, 36, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(24, 28, 36, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
            aria-label="Close Modal"
          >
            ×
          </button>
        )}
        <div style={{
          fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
          fontWeight: 700,
          color: '#f3f3f3',
          letterSpacing: 1,
          textShadow: '0 2px 8px #0008',
          marginBottom: 24
        }}>
          {title}
        </div>
        <p>No data available.</p>
        
        {/* Add CSS for close button styling */}
        <style jsx>{`
          /* Ensure close button is always visible */
          button[aria-label="Close Modal"] {
            position: absolute !important;
            z-index: 1001 !important;
            top: 16px !important;
            right: 16px !important;
          }
          
          /* Close button hover effects */
          button[aria-label="Close Modal"]:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            transform: scale(1.1) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
          }
          
          /* Mobile adjustments for close button */
          @media (max-width: 768px) {
            button[aria-label="Close Modal"] {
              top: 12px !important;
              right: 12px !important;
              width: 32px !important;
              height: 32px !important;
              font-size: 18px !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Sort genres by count (descending)
  const sortedGenres = Object.entries(genres)
    .sort(([,a], [,b]) => b - a);

  // Determine if this is genre or artist data based on title
  const isGenreData = title.toLowerCase().includes('genre');
  const isArtistData = title.toLowerCase().includes('artist');
  const headerLabel = isGenreData ? 'Genre' : isArtistData ? 'Artist' : 'Item';





  // Handle genre click
  const handleGenreClick = (genre, count) => {
    setSelectedGenre({ name: genre, count });
    setShowGenreModal(true);
  };

  // Handle artist click to show songs
  const handleArtistClick = async (artistName, count) => {
    setSelectedArtist({ name: artistName, count });
    setLoadingSongs(true);
    setShowSongsModal(true);
    
    try {
      // Fetch songs for the artist
      const songs = await fetchArtistSongs(artistName);
      setArtistSongs(songs);
    } catch (error) {
      console.error('Error fetching artist songs:', error);
      setArtistSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  // Helper function to format duration from milliseconds to MM:SS
  const formatDuration = (durationMs) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fetch songs for a specific artist from the playlist data
  const fetchArtistSongs = async (artistName) => {
    try {
      // Check if we have the artist data in genreDetails (which contains the playlist data)
      if (genreDetails && genreDetails[artistName] && genreDetails[artistName].tracks) {
        console.log(`Found ${genreDetails[artistName].tracks.length} tracks for artist: ${artistName}`);
        
        const tracks = genreDetails[artistName].tracks;
        
        // Now we have enhanced track data with album, duration, and release date
        const songsWithDetails = tracks.map(track => ({
          name: track.name,
          id: track.id,
          uri: track.uri,
          album: track.album || 'Unknown Album',
          duration: track.duration_ms ? formatDuration(track.duration_ms) : 'Unknown',
          year: track.release_date ? track.release_date.split('-')[0] : 'Unknown',
          release_date: track.release_date || '1900-01-01' // For sorting
        }));
        
        // Sort songs by release date (newest first)
        return songsWithDetails.sort((a, b) => {
          if (a.release_date === '1900-01-01' && b.release_date === '1900-01-01') return 0;
          if (a.release_date === '1900-01-01') return 1; // Unknown dates go to the end
          if (b.release_date === '1900-01-01') return -1;
          return new Date(b.release_date) - new Date(a.release_date); // Newest first
        });
      } else {
        console.log(`No track data found for artist: ${artistName}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching artist songs:', error);
      return [];
    }
  };

















// Refactored and Unified Table View
return (
  <>
    <div className="chart-wrapper">
      {/* The close button is only rendered if the onClose prop is provided. */}
      {onClose && (
        <button onClick={onClose} className="close-button" aria-label="Close">
          ✕
        </button>
      )}

      <h2 className="chart-title">{title}</h2>
      
     
      
      <div className="table-container">
        {/* Table Header */}
        <div className="table-header">
          <div className="header-label">{headerLabel}</div>
          <div className="header-count">Count</div>
        </div>
        
        {/* Table Body - scrollable if content exceeds max height */}
        <div 
          className="table-body" 
          style={{ 
            maxHeight: sortedGenres.length > 8 ? '400px' : 'auto',
            overflowY: sortedGenres.length > 8 ? 'auto' : 'visible'
          }}
        >
          {sortedGenres.map(([name, count], index) => (
            <div
              key={index}
              className="table-row"
              onClick={() => {
                if (isGenreData) {
                  handleGenreClick(name, count);
                } else if (isArtistData) {
                  handleArtistClick(name, count);
                }
              }}
            >
              <div className="row-name">{name}</div>
              <div className="row-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dynamic Statistics Summary */}
      <div className="stats-summary">
        <p>
          <strong>Total {headerLabel}s:</strong> {Object.keys(genres).length}
        </p>
        <p>
          <strong>Top {headerLabel}:</strong> {sortedGenres[0]?.[0] || 'N/A'} ({sortedGenres[0]?.[1] || 0})
        </p>
      </div>
    </div>

    {/* Modals remain unchanged but are included for completeness */}
    <GenreArtistsModal
      isOpen={showGenreModal}
      onClose={() => setShowGenreModal(false)}
      genre={selectedGenre?.name}
      artistCount={selectedGenre?.count}
      artists={genreDetails?.[selectedGenre?.name]?.artists?.map(a => a.name) || []}
      genreDetails={genreDetails}
      mainArtistsData={mainArtistsData}
    />

    <ArtistSongsModal
      isOpen={showSongsModal}
      onClose={() => setShowSongsModal(false)}
      artist={selectedArtist?.name}
      artistCount={selectedArtist?.count}
      songs={artistSongs}
      loading={loadingSongs}
      genreDetails={genreDetails}
      mainArtistsData={mainArtistsData}
    />
      
    {/* Centralized styling using styled-jsx */}
    <style jsx>{`
      .chart-wrapper {
        background: #1e1e1e;
        border-radius: 18px;
        padding: clamp(20px, 3vw, 32px);
        margin: clamp(20px, 3vw, 32px) auto;
        max-width: min(95vw, 1200px);
        box-shadow: 0 4px 32px #0003;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .close-button {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        font-size: 20px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
      }
      
      .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
      }

      .chart-title {
        font-size: clamp(1.35rem, 2.5vw, 2.2rem);
        font-weight: 700;
        color: #f3f3f3;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px #0008;
        margin-bottom: 8px;
        text-align: center;
      }

      .chart-subtitle {
        color: #a0a0a0;
        font-size: 0.9rem;
        margin-bottom: 24px;
      }

      .table-container {
        width: 100%;
        max-width: 800px;
        background: #1e1e1e;
        border-radius: 12px;
        border: 1px solid rgba(34, 202, 123, 0.2);
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .table-header {
        display: flex;
        padding: 16px 20px;
        background: rgba(34, 202, 123, 0.15);
        border-bottom: 1px solid rgba(34, 202, 123, 0.3);
        font-weight: 700;
        font-size: 1rem;
        color: #ffffff;
      }

      .header-label { flex: 1; text-align: left; }
      .header-count { flex: 0; min-width: 80px; text-align: center; }

      .table-body {
        padding: 8px 0;
        scrollbar-width: thin;
        scrollbar-color: #22ca7b #1e1e1e;
      }
      
      /* Custom scrollbar for WebKit browsers */
      .table-body::-webkit-scrollbar { width: 8px; }
      .table-body::-webkit-scrollbar-track { background: #1e1e1e; border-radius: 4px; }
      .table-body::-webkit-scrollbar-thumb { background: #22ca7b; border-radius: 4px; }
      .table-body::-webkit-scrollbar-thumb:hover { background: #1db954; }

      .table-row {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        border-bottom: 1px solid rgba(34, 202, 123, 0.1);
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .table-row:last-child {
        border-bottom: none;
      }

      .table-row:hover {
        background-color: rgba(34, 202, 123, 0.1);
      }

      .row-name {
        flex: 1;
        color: #e5e5e5;
        font-size: 0.95rem;
        font-weight: 600;
        text-transform: capitalize;
        text-align: left;
      }

      .row-count {
        flex: 0;
        min-width: 80px;
        color: #22ca7b;
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        background: rgba(34, 202, 123, 0.2);
        padding: 6px 12px;
        border-radius: 16px;
      }

      .stats-summary {
        margin-top: 20px;
        padding: 16px 20px;
        background: rgba(34, 202, 123, 0.1);
        border-radius: 12px;
        border: 1px solid rgba(34, 202, 123, 0.2);
        color: #a0a0a0;
        font-size: 0.9rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .stats-summary p {
        margin: 0;
      }

      .stats-summary strong {
        color: #e5e5e5;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </>
);
}