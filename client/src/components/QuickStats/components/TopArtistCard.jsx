import React from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSearches } from '../../../utils/recentSearchesCache';

// Shared utility function for navigating to artist page with server-side search
const navigateToArtistPage = async (router, artistName, artistId) => {
  try {
    // Make server-side API call for enhanced artist search
    const response = await fetch(`http://127.0.0.1:8000/api/artist-search-navigate?artistName=${encodeURIComponent(artistName)}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        // Navigate using server-provided parameters
        router.push(data.navigationUrl);
        return;
      }
    }
  } catch (error) {
    console.error(`[TopArtistCard] Error during server search for: ${artistName}`, error);
  }
  
  // Fallback to basic navigation if server search fails
  
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
 * TopArtistCard Component
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles top artist display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Maintainable - small, focused file
 * ✅ Clickable - artist name navigates to artist page
 */
export default function TopArtistCard({ artist, timeRange }) {
  const router = useRouter();

  if (!artist) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No artist data available
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
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {artist.images && artist.images[0] && artist.images[0].url ? (
          <img
            src={artist.images[0].url}
            alt={artist.name}
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
            {artist.name?.[0] || '?'}
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h4 
            style={{
              color: '#fff',
              fontSize: '1.3rem',
              fontWeight: '700',
              margin: '0 0 8px 0',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#1db954';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#fff';
            }}
            onClick={() => navigateToArtistPage(router, artist.name, artist.id)}
          >
            {artist.name || 'Unknown Artist'}
          </h4>
          
          {/* Show rankings if available */}
          {artist.rankings && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(artist.rankings).map(([period, rank]) => (
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
    </div>
  );
}
