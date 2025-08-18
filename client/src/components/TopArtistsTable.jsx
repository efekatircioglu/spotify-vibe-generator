import React, { useState, useEffect } from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';
import { getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../utils/recentSearchesCache';

function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function TopArtistsTable({ artists, title }) {
  const router = useRouter();
  const isMobile = useIsMobile(); // <-- Add this line

  if (!artists || artists.length === 0) return null;

  // Limit to 50 artists, 5 per row
  const maxArtists = 50;
  const artistsToShow = artists.slice(0, maxArtists);

  // Local state to hold ticketmasterIds as they are fetched (for spinner)
  const [artistList, setArtistList] = useState(artistsToShow);
  // Track loading state for each artist node
  const [loadingIdx, setLoadingIdx] = useState(null);

  // Helper to get ticketmasterId from localStorage (now protected)
  function getTicketmasterIdFromLocalStorage(artistName) {
    return getTicketmasterIdFromRecentSearch(artistName);
  }

  // Helper to update ticketmasterId in localStorage (now protected)
  function updateTicketmasterIdInLocalStorage(artistName, ticketmasterId, artistObj) {
    return updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
  }

  // Split into rows of 5
  const rows = [];
  for (let i = 0; i < artistList.length; i += 5) {
    rows.push(artistList.slice(i, i + 5));
  }

  // Helper to handle click and ensure ticketmasterId is present
  const handleArtistClick = async (artist, idx) => {
    console.log('[TopArtistsTable] Clicked artist node:', artist.name);
    const params = [
      `name=${encodeURIComponent(artist.name)}`
    ];
    const spotifyId = artist.spotifyId || artist.id;
    if (spotifyId) params.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
    // 1. Check localStorage for ticketmasterId
    console.log('[TopArtistsTable] Checking localStorage for ticketmasterId for:', artist.name);
    let ticketmasterId = getTicketmasterIdFromLocalStorage(artist.name) || artist.ticketmasterId;
    if (ticketmasterId) {
      console.log('[TopArtistsTable] Found ticketmasterId in localStorage:', ticketmasterId);
      params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
      console.log('[TopArtistsTable] Navigating to /artist with params:', params.join('&'));
      router.push(`/artist?${params.join('&')}`);
      return;
    }
    // 2. If not found, fetch it and show spinner
    console.log('[TopArtistsTable] ticketmasterId not found in localStorage, fetching from server for:', artist.name);
    setLoadingIdx(idx);
    try {
      const backendBase = 'http://127.0.0.1:8000';
      const res = await fetch(`${backendBase}/concerts/artist-search?name=${encodeURIComponent(artist.name)}`);
      if (res.ok) {
        const data = await res.json();
        const attractions = data?._embedded?.attractions || [];
        const exact = attractions.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
        if (exact && exact.id) {
          ticketmasterId = exact.id;
          params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
          console.log('[TopArtistsTable] Found ticketmasterId from server:', ticketmasterId);
          // Update local state so future clicks are instant
          setArtistList(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ticketmasterId };
            return updated;
          });
          // Update localStorage for future
          updateTicketmasterIdInLocalStorage(artist.name, ticketmasterId, artist);
          console.log('[TopArtistsTable] Updated ticketmasterId in localStorage for:', artist.name);
        } else {
          console.log('[TopArtistsTable] No ticketmasterId found from server for:', artist.name);
        }
      } else {
        console.log('[TopArtistsTable] Server returned error for ticketmasterId fetch:', res.status);
      }
    } catch (err) {
      console.log('[TopArtistsTable] Error fetching ticketmasterId from server:', err);
    }
    setLoadingIdx(null);
    console.log('[TopArtistsTable] Navigating to /artist with params:', params.join('&'));
    router.push(`/artist?${params.join('&')}`);
  };

  return (
    <div style={{ width: '100%', margin: '32px auto' }}>
      <div className={styles.songsTableTitle} style={{ marginTop: 32, color: '#fff', borderLeft: 'none', paddingLeft: '16px' }}>{title}</div>
      
      {/* This is our new CSS Grid container */}
      <div className={styles.artistsGridContainer}>
        {artistsToShow.map((artist, idx) => {
          const artistNumber = idx + 1;
          return (
            <div
              key={artist.id || artist.name || idx}
              className={styles.albumNode}
              style={{ cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.18s, transform 0.18s' }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 32px 4px #1db95488, 0 2px 16px #0006';
                e.currentTarget.style.transform = 'scale(1.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = '';
              }}
              onClick={() => handleArtistClick(artist, idx)}
            >
              {/* Number badge */}
              <div style={{
                position: 'absolute',
                top: isMobile ? 6 : 8,
                left: isMobile ? 6 : 8,
                background: '#1db954',
                color: '#fff',
                borderRadius: '50%',
                width: isMobile ? 24 : 32,
                height: isMobile ? 24 : 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: isMobile ? 14 : 18,
                boxShadow: '0 2px 8px #1db95433',
                zIndex: 2
              }}>{artistNumber}</div>
              {/* Loading spinner overlay */}
              {loadingIdx === idx && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 12
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    border: '4px solid #1db954',
                    borderTop: '4px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {artist.image || artist.images?.[0]?.url ? (
                <img
                  src={artist.image || artist.images?.[0]?.url}
                  alt={artist.name}
                  className={styles.albumCover}
                />
              ) : (
                <div className={styles.albumCover} style={{ background: '#444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {artist.name?.[0] || '?'}
                </div>
              )}
              <div className={styles.albumName} title={artist.name} style={{ marginTop: 12 }}>
                {artist.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 