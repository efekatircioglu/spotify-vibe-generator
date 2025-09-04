import React from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches, getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../../../utils/recentSearchesCache';
import { getApiBaseUrl } from '../../../config/api';
import { MusicNoteIcon } from '../../ui/icons';

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
        }
      }
    } catch (error) {
      console.error(`[TopSongCard] Error fetching Ticketmaster ID for ${artistName}:`, error);
    }
  }
  
  // Navigate with whatever data we have
  router.push(`/artist?${params.join('&')}`);
};

/**
 * TopSongCard Component
 * 
 * Displays the user's top song with album artwork and rankings
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles top song display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Clickable - artist name navigates to artist page
 */
export default function TopSongCard({ song, timeRange }) {
  const router = useRouter();

  if (!song) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No song data available
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
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {song.album && song.album.images && song.album.images[0] && song.album.images[0].url ? (
          <img
            src={song.album.images[0].url}
            alt={song.name}
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
            <MusicNoteIcon size={32} color="#000" />
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h4 style={{
            color: '#fff',
            fontSize: '1.3rem',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            {song.name || 'Unknown Song'}
          </h4>
          
          <p 
            style={{
              color: '#b3b3b3',
              fontSize: '1rem',
              margin: '0 0 8px 0',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#b3b3b3';
            }}
            onClick={() => {
              const artistName = song.artists && song.artists[0] ? song.artists[0].name : 'Unknown Artist';
              const artistId = song.artists && song.artists[0] ? song.artists[0].id : null;
              navigateToArtistPage(router, artistName, artistId);
            }}
          >
            {song.artists && song.artists[0] ? song.artists[0].name : 'Unknown Artist'}
          </p>
          
          {/* Show rankings if available */}
          {song.rankings && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(song.rankings).map(([period, rank]) => (
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
    </div>
  );
}
