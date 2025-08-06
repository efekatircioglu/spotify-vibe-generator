import React, { useState, useEffect, useRef } from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';
import WrappedAnalysisModal from './WrappedAnalysisModal';
import DropdownPortal from './DropdownPortal';
import ContributorFinder from './ContributorFinder';
import { lookupTrackMBID } from '../utils/trackAnalysisCache';
import NewSongAnalysisModal from './NewSongAnalysisModal';
import { getCachedArtistId, setArtistCache, getCachedArtistImage, getCachedSpotifyId } from '../utils/artistCache';
import { useRouter } from 'next/navigation';

function useIsMobile(breakpoint = 680) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, onExploreContributions, loading, error, showCreatePlaylist = true, showViewPlaylist = true, genres = [] }) {
  const router = useRouter();
  const [showWrapped, setShowWrapped] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(null); // row index for open dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  const [contributorModalOpen, setContributorModalOpen] = useState(false);
  const [selectedTrackMBID, setSelectedTrackMBID] = useState(null);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [showNewSongAnalysisModal, setShowNewSongAnalysisModal] = useState(false);
  const [selectedTrackForNewAnalysis, setSelectedTrackForNewAnalysis] = useState(null);
  const [clickingArtist, setClickingArtist] = useState(null); // Track which artist is being clicked
  const [showPopover, setShowPopover] = useState(null); // Track which track's popover is open
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 }); // Track popover position
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null); // index of open dropdown
  const mobileDropdownRef = useRef(null);
  const FOUR_SONGS_HEIGHT_PX = 408;


  // When tracks change, increment tableKey to trigger animation
  useEffect(() => {
    setTableKey(k => k + 1);
  }, [tracks]);



  // Close dropdown on outside click
  useEffect(() => {
    if (dropdownOpen === null) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          (!buttonRefs.current[dropdownOpen] || !buttonRefs.current[dropdownOpen].contains(e.target))) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close popover on outside click
  useEffect(() => {
    if (showPopover === null) return;
    function handleClick(e) {
      // Check if click is inside the popover content (rendered by DropdownPortal)
      const popoverContent = document.querySelector('[data-dropdown-portal]');
      let clickedInsidePopover = false;
      
      if (popoverContent && popoverContent.contains(e.target)) {
        clickedInsidePopover = true;
      }
      
      // Also check if click is on the "..." button that opened the popover
      const ellipsisButton = e.target.closest('[data-ellipsis-button]');
      if (ellipsisButton) {
        clickedInsidePopover = true;
      }
      
      if (!clickedInsidePopover) {
        setShowPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  // Handle contributions button click
  const handleContributionsClick = async (track) => {
    setSelectedTrackInfo(track);
    setContributorModalOpen(true);
    // Always use track.id for MBID lookup
    const mbid = await lookupTrackMBID(track.id);
    setSelectedTrackMBID(mbid);
  };

  const handleThirdGenreClick = (track) => {
    setSelectedTrackForNewAnalysis(track);
    setShowNewSongAnalysisModal(true);
  };



  // Retry function for API calls (same as other pages)
  const fetchWithRetry = async (url, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        } else if (response.status === 500 && attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed with 500 error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  };

  // Handle artist click with caching
  const handleArtistClick = async (artistName, trackIndex) => {
    if (clickingArtist) return; // Prevent multiple simultaneous clicks
    
    console.log('=== handleArtistClick called ===');
    console.log('Artist name:', artistName);
    console.log('Track index:', trackIndex);
    
    setClickingArtist(artistName);
    
    try {
      let spotifyId = null;
      let ticketmasterId = null;
      let imageUrl = null;
      
      // Get Spotify ID and image from track data or search Spotify API
      const track = tracks[trackIndex];
      console.log('Track data:', track ? 'exists' : 'null');
      
      // Try to get from track.artists array first (if it exists)
      if (track && track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
        // Find the specific artist in the track.artists array
        const matchingArtist = track.artists.find(a => a.name && a.name.toLowerCase() === artistName.toLowerCase());
        if (matchingArtist && matchingArtist.id) {
          spotifyId = matchingArtist.id;
          imageUrl = matchingArtist.images?.[0]?.url || null;
          console.log(`Found Spotify ID from track.artists for "${artistName}": ${spotifyId}`);
          console.log(`Found image URL from track.artists: ${imageUrl}`);
        }
      }
      
      // If we don't have Spotify ID, search Spotify API
      if (!spotifyId) {
        try {
          console.log(`Searching Spotify API for "${artistName}"...`);
          const spData = await fetchWithRetry(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(artistName)}`);
          const spotifyArtists = spData.artists || [];
          console.log('Spotify search results:', spotifyArtists);
          
          // Find exact match
          const exactSpotify = spotifyArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
          if (exactSpotify && exactSpotify.id) {
            spotifyId = exactSpotify.id;
            imageUrl = exactSpotify.image || exactSpotify.images?.[0]?.url || imageUrl;
            console.log(`Found Spotify ID from API: ${spotifyId}`);
            console.log(`Found Spotify image from API: ${imageUrl}`);
          }
        } catch (err) {
          console.error('Error searching Spotify API:', err);
        }
      }
      
      // Check cache first
      const cachedId = getCachedArtistId(artistName);
      if (cachedId) {
        console.log(`Found cached Ticketmaster ID for "${artistName}": ${cachedId}`);
        ticketmasterId = cachedId;
        // Get cached image if available (only if we don't have it from track data)
        if (!imageUrl) {
          const cachedImage = getCachedArtistImage(artistName);
          if (cachedImage) {
            imageUrl = cachedImage;
          }
        }
        // Get cached Spotify ID if available (only if we don't have it from track data)
        if (!spotifyId) {
          const cachedSpotifyId = getCachedSpotifyId(artistName);
          if (cachedSpotifyId) {
            spotifyId = cachedSpotifyId;
          }
        }
      } else {
        // Search Spotify for the artist if we don't have Spotify ID
        if (!spotifyId) {
          try {
            console.log(`Searching Spotify for "${artistName}"...`);
            const spData = await fetchWithRetry(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(artistName)}`);
            const spotifyArtists = spData.artists || [];
            // Find an exact name match (case-insensitive)
            const exactSpotify = spotifyArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
            if (exactSpotify && exactSpotify.id) {
              spotifyId = exactSpotify.id;
              imageUrl = exactSpotify.image || exactSpotify.images?.[0]?.url || imageUrl;
              console.log(`Found Spotify ID for "${artistName}": ${spotifyId}`);
              console.log(`Found Spotify image: ${imageUrl}`);
            }
          } catch (err) {
            console.error('Error searching Spotify:', err);
          }
        }
        
        // Search Ticketmaster for the artist
        try {
          const tmData = await fetchWithRetry(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(artistName)}`);
          const attractions = tmData._embedded?.attractions || [];
          // Find an exact name match (case-insensitive)
          const exact = attractions.find(a => a.name.toLowerCase() === artistName.toLowerCase());
          if (exact && exact.id) {
            ticketmasterId = exact.id;
            // Use Ticketmaster image if we don't have one from Spotify
            if (!imageUrl) {
              imageUrl = exact.images?.[0]?.url || null;
            }
            // Cache the successful result with both Spotify ID and Ticketmaster ID
            setArtistCache(artistName, exact.id, imageUrl, spotifyId);
            console.log(`Cached Ticketmaster ID for "${artistName}": ${exact.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
          }
        } catch (err) {
          console.error('Error searching Ticketmaster:', err);
        }
      }
      
      // Build URL parameters
      const urlParamsArr = [`name=${encodeURIComponent(artistName)}`];
      if (spotifyId) urlParamsArr.push(`spotifyId=${spotifyId}`);
      if (ticketmasterId) urlParamsArr.push(`ticketmasterId=${ticketmasterId}`);
      const urlParams = urlParamsArr.join('&');
      
      console.log('Final URL params:', urlParams);
      console.log('Navigating to artist page...');
      
      // Navigate to artist page
      router.push(`/artist?${urlParams}`);
      
    } catch (error) {
      console.error('Error handling artist click:', error);
      // Still navigate with just the name if there's an error
      router.push(`/artist?name=${encodeURIComponent(artistName)}`);
    } finally {
      setClickingArtist(null);
    }
  };

  // Helper function to render clickable artist names
  const renderArtistNames = (track, trackIndex) => {
    const artistNames = track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '');
    
    if (!artistNames) return '';
    
    // Split by comma and handle multiple artists
    const artists = artistNames.split(',').map(name => name.trim()).filter(name => name);
    
    // Check if the full artist string is longer than 18 characters
    const isLongText = artistNames.length > 18;
    
    if (isLongText) {
      const isPopoverOpen = showPopover === trackIndex;
      
      // Handle single artist with long name
      if (artists.length === 1) {
        const artistName = artists[0];
        const truncatedName = artistName.length > 15 ? artistName.substring(0, 15) + '...' : artistName;
        
        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span
              style={{
                color: '#b3b3b3',
                cursor: 'pointer',
                opacity: clickingArtist === artistName ? 0.7 : 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleArtistClick(artistName, trackIndex);
              }}
              title={`Click to view ${artistName}'s profile`}
            >
              {truncatedName}
            </span>
          </div>
        );
      }
      
      // Handle multiple artists
      let visibleArtists = [];
      let visibleText = '';
      
      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        let artistToShow = artist;
        
        // If this is the first artist and it's too long, truncate it
        if (i === 0 && artist.length > 12) { // Leave room for ", ..."
          artistToShow = artist.substring(0, 12); // Remove the "..." since we'll have a button
        }
        
        const testText = visibleText + (visibleText ? ', ' : '') + artistToShow;
        if (testText.length <= 15) { // Leave room for "..."
          visibleArtists.push({ name: artist, display: artistToShow });
          visibleText = testText;
        } else {
          break;
        }
      }
      
      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Visible artists */}
          {visibleArtists.map((artistObj, index) => {
            const isClicking = clickingArtist === artistObj.name;
            return (
              <React.Fragment key={index}>
                <span
                  style={{
                    color: '#b3b3b3',
                    cursor: 'pointer',
                    opacity: isClicking ? 0.7 : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArtistClick(artistObj.name, trackIndex);
                  }}
                  title={`Click to view ${artistObj.name}'s profile`}
                >
                  {artistObj.display}
                </span>
                {index < visibleArtists.length - 1 && (
                  <span style={{ color: '#b3b3b3' }}>, </span>
                )}
              </React.Fragment>
            );
          })}
          
                      {/* "..." button - only show if there are hidden artists */}
            {visibleArtists.length < artists.length && (
              <span 
                data-ellipsis-button
                style={{ 
                  color: '#b3b3b3', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(179, 179, 179, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPopoverOpen) {
                    setShowPopover(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPopoverPosition({
                      top: rect.top + window.scrollY,
                      left: rect.left + window.scrollX
                    });
                    setShowPopover(trackIndex);
                  }
                }}
                title="Click to see all artists"
              >
                ...
              </span>
            )}
          
          {/* Popover */}
          {isPopoverOpen && (
            <DropdownPortal>
              <div
                data-dropdown-portal
                style={{
                  position: 'absolute',
                  top: popoverPosition.top,
                  left: popoverPosition.left,
                  transform: 'translateY(0)',
                  background: '#1a1a1a',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
                  zIndex: 999999,
                  minWidth: '200px',
                  border: '1px solid #333',
                }}
                onClick={(e) => e.stopPropagation()}
              >
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#b3b3b3', 
                marginBottom: '8px',
                fontWeight: 600
              }}>
                All Artists
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {artists.map((artist, index) => {
                  const isClicking = clickingArtist === artist;
                  return (
                    <span
                      key={index}
                      style={{
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        opacity: isClicking ? 0.7 : 1,
                        fontSize: '0.9rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(179, 179, 179, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArtistClick(artist, trackIndex);
                      }}
                    >
                      {artist}
                    </span>
                  );
                })}
              </div>
              </div>
            </DropdownPortal>
          )}
        </div>
      );
    }
    
    // For short text (≤18 characters), render normally
    return artists.map((artist, index) => {
      const isClicking = clickingArtist === artist;
      return (
        <React.Fragment key={index}>
          <span
            style={{
              color: '#b3b3b3',
              cursor: 'pointer',
              opacity: isClicking ? 0.7 : 1,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleArtistClick(artist, trackIndex);
            }}
            title={`Click to view ${artist}'s profile`}
          >
            {artist}
          </span>
          {index < artists.length - 1 && (
            <span style={{ color: '#b3b3b3' }}>, </span>
          )}
        </React.Fragment>
      );
    });
  };

  // Estimate row height for minHeight reservation
  const rowHeight = 72; // px, adjust as needed
  const minHeight = tracks && tracks.length > 0 ? tracks.length * rowHeight + 120 : 0; // +120 for header/buttons

  const isMobile = useIsMobile(680);

  useEffect(() => {
    if (mobileDropdownOpen === null) return;
    function handleClick(e) {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
        setMobileDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [mobileDropdownOpen]);

// Find this line in NewTrackTable.jsx...
if (isMobile) {
  // And replace everything inside it with this:
  
    // --- MOBILE LAYOUT ---
    return (
      <div style={{
        background: '#181818',
        padding: '6vw 0', // Vertical padding, no horizontal padding
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 18
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#f3f3f3', letterSpacing: 1, textAlign: 'center' }}>{title || 'Your Last 50 Songs'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '95%',
  justifyContent: 'center'}}>
            {tracks && tracks.length > 0 && (
              <PlaylistActions
                tracks={tracks}
                playlistKey={playlistKey}
                playlistNameLabel={title}
                onWrapped={() => setShowWrapped(true)}
                showCreatePlaylist={showCreatePlaylist}
                showViewPlaylist={showViewPlaylist}
              />
            )}
          </div>
        </div>
        
        {/* This is the container for the list of songs. We center this. */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 576,
          overflowY: 'auto',
          width: '95%',
          margin: '0 auto',
          maxHeight: 430,
        }}>
          {tracks && tracks.length > 0 && tracks.map((track, idx) => (
            <div key={track.id ? `${track.id}-${idx}` : idx} style={{
              background: idx % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
              borderRadius: 14,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 8px #0002',
              position: 'relative',
            }}>
              {/* 1st Column: Cover Art */}
              <div>
                {track.album_image || track.album?.images?.[0]?.url ? (
                  <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#232323' }} />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][idx % 8],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', boxShadow: '0 2px 8px #0004',
                  }}>{track.name ? track.name[0] : '?'}</div>
                )}
              </div>
              {/* 2nd Column: Song Info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
                <div style={{ color: '#d1d5db', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')}</div>
                <div
                  style={{
                    color: '#b3b3b3',
                    fontSize: 13,
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={track.album?.name || track.album}
                >
                  {track.album?.name || track.album}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 12 }}>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')} • {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</div>
              </div>
              {/* 3rd Column: Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', position: 'relative' }}>
                <button
                  style={{
                    background: '#232323', color: '#fff', borderRadius: 8, fontWeight: 700, padding: '8px 16px', fontSize: 14, border: 'none', cursor: 'pointer', marginBottom: 4
                  }}
                  onClick={() => setMobileDropdownOpen(mobileDropdownOpen === idx ? null : idx)}
                >Breakdown</button>
                {mobileDropdownOpen === idx && (
                  <div
                    ref={mobileDropdownRef}
                    style={{
                      position: 'absolute',
                      top: 38,
                      right: 0,
                      background: '#232323',
                      borderRadius: 8,
                      boxShadow: '0 2px 12px #0006',
                      zIndex: 1000,
                      minWidth: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                      overflow: 'hidden',
                    }}>
                    <button
                      style={{
                        background: 'none', color: '#fff', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 14, padding: '10px 18px', textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'background 0.18s',
                      }}
                      onClick={() => { setMobileDropdownOpen(null); handleThirdGenreClick(track); }}
                    >Genre</button>
                    <button
                      style={{
                        background: 'none', color: '#fff', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 14, padding: '10px 18px', textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'background 0.18s',
                      }}
                      onClick={() => { setMobileDropdownOpen(null); handleContributionsClick(track); }}
                    >Contributors</button>
                  </div>
                )}
                {track.id && (
                  <a href={`https://open.spotify.com/track/$${track.id}`} target="_blank" rel="noopener noreferrer">
                    <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 24, height: 24, verticalAlign: 'middle' }} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Modals go here */}
        <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
        {showNewSongAnalysisModal && selectedTrackForNewAnalysis && (
          <NewSongAnalysisModal
            open={showNewSongAnalysisModal}
            onClose={() => setShowNewSongAnalysisModal(false)}
            songInfo={selectedTrackForNewAnalysis}
          />
        )}
        {contributorModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000,
          }} onClick={() => setContributorModalOpen(false)}>
            <div style={{ background: '#232323', borderRadius: 18, padding: '40px', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', color: '#fff', border: '2px solid #1db954' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Contributors for {selectedTrackInfo?.name}
                </h2>
                <button
                  onClick={() => setContributorModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: 0, marginTop: -40, marginRight: -60, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1db954'}
                  onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                >×</button>
              </div>
              {selectedTrackMBID ? (
                <ContributorFinder mbid={selectedTrackMBID} />
              ) : (
                <p style={{ textAlign: 'center', color: '#f87171' }}>
                  Contributor information is not available for this track.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div       className="new-track-table-container"    style={{
      background: '#181818',
      borderRadius: 18,
      padding: 'clamp(16px, 2vw, 3vw) clamp(12px, 1.5vw, 2vw)',
      margin: 'clamp(16px, 2vw, 3vw) auto',
      maxWidth: 'clamp(95vw, 98vw, 98vw)',
      width: 'clamp(95vw, 98vw, 98vw)',
      boxShadow: '0 4px 32px #0003',
      position: 'relative',
      minHeight,
      fontSize: 'clamp(0.75rem, 1vw, 1.08rem)', // base font size for all text
    }}>
      {/* Header: Title, Genres, and Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: genres && genres.length > 0 ? 10 : 0,
      }}>
        <div style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'nowrap',
  gap: '16px'
}}>
          <span style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
            fontWeight: 900,
            color: '#f3f3f3',
            letterSpacing: 1,
            textShadow: '0 2px 8px #0008',
          }}>{title || 'Your Last 50 Songs'}</span>
          <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 16px)', flexWrap: 'wrap' }}>
            {tracks && tracks.length > 0 ? (
              <PlaylistActions
                tracks={tracks}
                playlistKey={playlistKey}
                playlistNameLabel={title}
                onWrapped={() => setShowWrapped(true)}
                showCreatePlaylist={showCreatePlaylist}
                showViewPlaylist={showViewPlaylist}
              />
            ) : (
              <div style={{ minWidth: 220, minHeight: 48 }} />
            )}
          </div>
        </div>
        {/* Genres/Tags row */}
        {genres && genres.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(6px, 1vw, 12px)',
            marginTop: 6,
            marginBottom: 2,
            width: '100%',
          }}>
            {genres.map((genre, i) => (
              <span key={i} style={{
                display: 'inline-block',
                background: '#232323',
                color: '#1db954',
                borderRadius: 999,
                padding: 'clamp(2px, 0.5vw, 6px) clamp(10px, 2vw, 18px)',
                fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
                fontWeight: 700,
                letterSpacing: 0.2,
                boxShadow: '0 1px 4px #0003',
                border: '1.5px solid #1db954',
                marginBottom: 2,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>{genre}</span>
            ))}
          </div>
        )}
      </div>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(24,24,24,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          borderRadius: 12,
        }}>
          <div style={{
            width: 48, height: 48, border: '6px solid #1db954', borderTop: '6px solid #232323', borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* Table Section */}
      <div className="table-container" style={{ width: '100%', overflowX: 'auto', marginTop: 8 }}>
        {!loading && !error && tracks && tracks.length > 0 && (
          <table style={{
            width: '98%',
            maxWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'transparent',
            color: '#f3f3f3',
            fontSize: 'clamp(0.75rem, 1vw, 1.04rem)',
            minWidth: 'clamp(600px, 90vw, 1200px)',
            boxShadow: 'none',
            margin: '0 auto',
          }} key={tableKey}>
            <thead>
              <tr style={{ background: 'none', color: '#b3b3b3', fontWeight: 700, fontSize: 'clamp(0.8rem, 1vw, 1.04rem)' }}>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>#</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Cover</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Name</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Artist</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Album</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Year</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Analyze</th>
                <th style={{ padding: 'clamp(12px, 1.5vw, 18px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Play</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => (
                <tr
                  key={track.id ? `${track.id}-${idx}` : idx}
                  data-track-index={idx}
                  className={styles.animatedRow}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                    borderRadius: 12,
                    transition: 'background 0.18s',
                    fontSize: 'clamp(0.75rem, 1vw, 1.13em)',
                    animationDelay: `${idx * 60}ms`,
                    animationName: 'fadeInUp',
                    animationDuration: '400ms',
                    animationFillMode: 'both',
                    opacity: 0,
                    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <td style={{ padding: 'clamp(12px, 1.5vw, 16px) 0', fontWeight: 700, fontSize: 'clamp(0.8rem, 1vw, 1.08em)', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)' }}>{idx + 1}</td>
                  <td style={{ padding: 'clamp(8px, 1.2vw, 10px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)' }}>
                    {track.album_image || track.album?.images?.[0]?.url ? (
                      <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 'clamp(28px, 6vw, 56px)', height: 'clamp(28px, 6vw, 56px)', borderRadius: 10, objectFit: 'cover', background: '#232323', marginRight: 'clamp(6px, 1.5vw, 18px)' }} />
                    ) : (
                      <div style={{
                        width: 'clamp(28px, 6vw, 56px)',
                        height: 'clamp(28px, 6vw, 56px)',
                        borderRadius: '50%',
                        background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][idx % 8],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 'clamp(0.9rem, 1.8vw, 1.75rem)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px #0004',
                        marginRight: 'clamp(6px, 1.5vw, 18px)',
                      }}>{track.name ? track.name[0] : '?'}</div>
                    )}
                  </td>
                  <td 
                    style={{ 
                      padding: 'clamp(12px, 1.5vw, 16px) 0', 
                      fontWeight: 700, 
                      maxWidth: 'clamp(120px, 15vw, 180px)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(4px, 0.8vw, 18px)', 
                      paddingRight: 'clamp(4px, 0.8vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {track.name}
                  </td>
                  <td 
                    className="artist-cell"
                    style={{ 
                      padding: 'clamp(12px, 1.5vw, 16px) 0', 
                      color: '#b3b3b3', 
                      maxWidth: 'clamp(100px, 12vw, 160px)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(4px, 0.8vw, 18px)', 
                      paddingRight: 'clamp(4px, 0.8vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {renderArtistNames(track, idx)}
                  </td>
                  <td 
                    style={{ 
                      padding: 'clamp(12px, 1.5vw, 16px) 0', 
                      color: '#b3b3b3', 
                      maxWidth: 'clamp(100px, 12vw, 160px)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(4px, 0.8vw, 18px)', 
                      paddingRight: 'clamp(4px, 0.8vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {track.album?.name || track.album}
                  </td>
                  <td style={{ padding: 'clamp(12px, 1.5vw, 16px) 0', color: '#b3b3b3', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)' }}>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                  <td style={{ padding: 'clamp(12px, 1.5vw, 16px) 0', color: '#b3b3b3', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)' }}>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                  <td style={{ padding: 'clamp(12px, 1.5vw, 16px) 0', paddingLeft: 'clamp(4px, 0.8vw, 18px)', paddingRight: 'clamp(4px, 0.8vw, 18px)' }}>{/* Analyze button remains as is for now */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        ref={el => { if (el) buttonRefs.current[idx] = el; }}
                        style={{
                          background: '#232323',
                          color: '#fff',
                          borderRadius: 10,
                          fontWeight: 700,
                          padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 2.5vw, 28px)',
                          fontSize: 'clamp(0.8rem, 1vw, 1.08rem)',
                          margin: '0 4px',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          border: 'none',
                          outline: 'none',
                          display: 'inline-block',
                          transition: 'background 0.18s, color 0.18s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#404040';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#232323';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onClick={e => {
                          if (dropdownOpen === idx) {
                            setDropdownOpen(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPosition({
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX,
                            });
                            setDropdownOpen(idx);
                          }
                        }}
                      >
                        Breakdown
                      </button>
                      {dropdownOpen === idx && (
                        <DropdownPortal>
                          <div
                            ref={dropdownRef}
                            style={{
                              position: 'absolute',
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                              background: '#232323',
                              borderRadius: 10,
                              boxShadow: '0 2px 16px #0003',
                              zIndex: 99999,
                              minWidth: 140,
                              padding: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <button
                              style={{
                                background: 'none',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: 'clamp(0.75rem, 0.9vw, 0.92rem)',
                                padding: 'clamp(3px, 0.8vw, 4px) clamp(8px, 1.5vw, 10px)',
                                lineHeight: 1.1,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background 0.18s, color 0.18s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#404040';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onClick={() => { setDropdownOpen(null); handleThirdGenreClick(track); }}
                            >
                              Genre
                            </button>
                            <button
                              style={{
                                background: 'none',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: 'clamp(0.75rem, 0.9vw, 0.92rem)',
                                padding: 'clamp(3px, 0.8vw, 4px) clamp(8px, 1.5vw, 10px)',
                                lineHeight: 1.1,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background 0.18s, color 0.18s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#404040';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onClick={() => { setDropdownOpen(null); handleContributionsClick(track); }}
                            >
                              Contributions
                            </button>
                          </div>
                        </DropdownPortal>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>
                    {track.id && (
                      <a href={`https://open.spotify.com/track/${track.id}`} target="_blank" rel="noopener noreferrer">
                        <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Contributor Modal */}
      {contributorModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
        }} onClick={() => setContributorModalOpen(false)}>
          <div style={{
            background: '#232323',
            borderRadius: 18,
            padding: '40px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            color: '#fff',
            border: '2px solid #1db954',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Contributors for {selectedTrackInfo?.name}
              </h2>
              <button
                onClick={() => setContributorModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: -40,
                  marginRight: -60,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#1db954'}
                onMouseLeave={e => e.currentTarget.style.color = '#fff'}
              >
                ×
              </button>
            </div>
            {selectedTrackMBID ? (
              <ContributorFinder mbid={selectedTrackMBID} />
            ) : (
              <p style={{ textAlign: 'center', color: '#f87171' }}>
                Contributor information is not available for this track.
              </p>
            )}
          </div>
        </div>
      )}
      
      {showNewSongAnalysisModal && selectedTrackForNewAnalysis && (
        <NewSongAnalysisModal
          open={showNewSongAnalysisModal}
          onClose={() => setShowNewSongAnalysisModal(false)}
          songInfo={selectedTrackForNewAnalysis}
        />
      )}
      

      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .${styles.animatedRow} {
          opacity: 0;
        }
        .${styles.animatedRow}[style*='animation-name'] {
          opacity: 1;
        }

         @media (min-width: 651px) {
          .new-track-table-container {
            margin-left: auto !important;
            margin-right: auto !important;
            float: none !important;
          }
        }
        
        /* Responsive table improvements for medium screens */
        @media (max-width: 1200px) and (min-width: 651px) {

        .new-track-table-container {
          margin-left: auto !important;
          margin-right: auto !important;
        }
          table {
            font-size: 0.8rem !important;
          }
          th, td {
            padding: 8px 4px !important;
          }
          button {
            font-size: 0.75rem !important;
            padding: 6px 12px !important;
          }
        }
        
        /* Ensure horizontal scroll on smaller screens */
        @media (max-width: 1000px) and (min-width: 651px) {
          .table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}
