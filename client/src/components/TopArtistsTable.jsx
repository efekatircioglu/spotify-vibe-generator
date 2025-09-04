import React, { useState } from 'react';
import { getApiBaseUrl } from '../config/api';
import styles from './topartists.module.css';
import { useRouter } from 'next/navigation';
import { getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../utils/recentSearchesCache';

export default function TopArtistsTable({ artists, title }) {
  const router = useRouter();

  if (!artists || artists.length === 0) return null;

  const artistsToShow = artists.slice(0, 50);

  const [artistList, setArtistList] = useState(artistsToShow);
  const [loadingIdx, setLoadingIdx] = useState(null);

  // Helper to get ticketmasterId from localStorage (now protected)
  function getTicketmasterIdFromLocalStorage(artistName) {
    return getTicketmasterIdFromRecentSearch(artistName);
  }

  // Helper to update ticketmasterId in localStorage (now protected)
  function updateTicketmasterIdInLocalStorage(artistName, ticketmasterId, artistObj) {
    return updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
  }

  const handleArtistClick = async (artist, idx) => {
    // This logic remains the same as it's perfectly fine.
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
      const backendBase = getApiBaseUrl();
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
    <div className={styles.artistsSectionContainer}>
      <div className={styles.songsTableTitle}>{title}</div>
      
      <div className={styles.artistsGridContainer}>
        {artistsToShow.map((artist, idx) => (
          <div
            key={artist.id || artist.name || idx}
            className={styles.artistNode}
            onClick={() => handleArtistClick(artist, idx)}
          >
            <div className={styles.artistNumberBadge}>{idx + 1}</div>

            {loadingIdx === idx && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
              </div>
            )}

            {artist.image || artist.images?.[0]?.url ? (
              <img
                src={artist.image || artist.images[0].url}
                alt={artist.name}
                className={styles.artistImage}
              />
            ) : (
              <div className={styles.artistImagePlaceholder}>
                {artist.name?.[0] || '?'}
              </div>
            )}

            <div className={styles.artistName} title={artist.name}>
              {artist.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}