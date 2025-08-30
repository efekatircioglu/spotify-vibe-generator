import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches } from '../../../utils/recentSearchesCache';

/**
 * TopAlbumsCard Component
 * 
 * Displays the top 3 albums with most songs from user's tracks
 * Shows album artwork, name, artist, and song count
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles albums display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function TopAlbumsCard({ albums }) {
  const router = useRouter();
  const [albumsWithArtistImages, setAlbumsWithArtistImages] = useState(albums);

  // Shared utility function for navigating to artist page with server-side search
  const navigateToArtistPage = async (artistName) => {
    try {
      console.log(`[TopAlbumsCard] Searching for artist: ${artistName}`);
      
      // Make server-side API call for enhanced artist search
      const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log(`[TopAlbumsCard] Server search successful for: ${artistName}`, data);
          
          // Navigate using server-provided parameters
          router.push(data.navigationUrl);
          return;
        } else {
          console.log(`[TopAlbumsCard] Server search failed for: ${artistName}`, data.message);
        }
      } else {
        console.log(`[TopAlbumsCard] Server search failed for: ${artistName}`, response.status);
      }
    } catch (error) {
      console.error(`[TopAlbumsCard] Error during server search for: ${artistName}`, error);
    }
    
    // Fallback to basic navigation if server search fails
    console.log(`[TopAlbumsCard] Using fallback navigation for: ${artistName}`);
    
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

  // Fetch artist images when component mounts
  useEffect(() => {
    const fetchArtistImages = async () => {
      if (!albums || albums.length === 0) return;

      try {
        // Get unique artist names from albums
        const artistNames = [...new Set(albums.map(album => album.artist).filter(Boolean))];
        
        // Search for each artist to get their image
        const albumsWithImages = await Promise.all(
          albums.map(async (album) => {
            if (!album.artist || album.artist === 'Unknown') {
              return { ...album, artistImage: null };
            }

            try {
              const response = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(album.artist)}`);
              if (response.ok) {
                const data = await response.json();
                const artist = data.artists?.find(a => a.name.toLowerCase() === album.artist.toLowerCase());
                return {
                  ...album,
                  artistImage: artist?.image || null
                };
              }
            } catch (error) {
              console.error(`Error fetching image for ${album.artist}:`, error);
            }
            
            return { ...album, artistImage: null };
          })
        );

        setAlbumsWithArtistImages(albumsWithImages);
      } catch (error) {
        console.error('Error fetching artist images:', error);
        setAlbumsWithArtistImages(albums);
      }
    };

    fetchArtistImages();
  }, [albums]);

  if (!albumsWithArtistImages || albumsWithArtistImages.length === 0) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No album data available
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Top Albums
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Most listened albums
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {albumsWithArtistImages.map((album, index) => (
          <div key={album.id} style={{
            padding: '12px',
            borderRadius: '12px',
            border: album.images && album.images[0] ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            {/* Background album image layer */}
            {album.images && album.images[0] && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${album.images[0].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 0
              }} />
            )}
            
            {/* Content layer */}
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{
                background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#d97706',
                color: '#000',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                #{index + 1}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {album.artistImage ? (
                <img
                  src={album.artistImage}
                  alt={album.artist}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  {album.artist ? album.artist[0] : '🎵'}
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <h4 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 4px 0',
                  textShadow: album.images && album.images[0] ? '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)' : 'none'
                }}>
                  {album.name}
                </h4>
                <p 
                  style={{
                    color: '#b3b3b3',
                    fontSize: '0.9rem',
                    margin: '0',
                    textShadow: album.images && album.images[0] ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onClick={() => navigateToArtistPage(album.artist)}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#22ca7b';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#b3b3b3';
                  }}
                >
                  {album.artist}
                </p>
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
