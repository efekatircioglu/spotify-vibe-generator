import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches, getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../../../utils/recentSearchesCache';
import { getApiBaseUrl } from '../../../config/api';
import { MusicNoteIcon } from '../../ui/icons';

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
  const navigateToArtistPage = async (artistName) => {
    
    // Build navigation parameters
    const params = [`name=${encodeURIComponent(artistName)}`];
    
    // Check recent searches for ticketmasterId first (fastest)
    let ticketmasterId = getTicketmasterIdFromRecentSearch(artistName);
    if (ticketmasterId) {
      params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
    }
    
    // Check cached top artists for Spotify ID
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
              spotifyId: cachedArtist?.id,
              ticketmasterId: ticketmasterId
            };
            updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
            
            params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
          } else {
          }
        } else {
        }
      } catch (error) {
        console.error(`[TopAlbumsCard] Error fetching Ticketmaster ID for ${artistName}:`, error);
      }
    }
    
    // Navigate with whatever data we have
    router.push(`/artist?${params.join('&')}`);
  };

  // Get artist images from cached data when component mounts
  useEffect(() => {
    const getArtistImagesFromCache = () => {
      if (!albums || albums.length === 0) return;

      try {
        // Get cached top artists
        const topArtists = getCachedTopArtists();
        
        // Map albums with artist images from cache
        const albumsWithImages = albums.map(album => {
          if (!album.artist || album.artist === 'Unknown') {
            return { ...album, artistImage: null };
          }

          // Find artist in cached data
          const cachedArtist = topArtists?.find(a => a.name.toLowerCase() === album.artist.toLowerCase());
          
          return {
            ...album,
            artistImage: cachedArtist?.images?.[0]?.url || null
          };
        });

        setAlbumsWithArtistImages(albumsWithImages);
      } catch (error) {
        console.error('Error getting artist images from cache:', error);
        setAlbumsWithArtistImages(albums);
      }
    };

    getArtistImagesFromCache();
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
                  <MusicNoteIcon size={24} color="#000" />
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
