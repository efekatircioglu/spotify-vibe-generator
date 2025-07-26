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
  const [hoveredCell, setHoveredCell] = useState(null); // { row: number, col: string, content: string }
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [clickingArtist, setClickingArtist] = useState(null); // Track which artist is being clicked
  const [popoverStates, setPopoverStates] = useState({}); // Track popover states for each track
  const [truncatedStates, setTruncatedStates] = useState({}); // Track which tracks have truncated content

  // When tracks change, increment tableKey to trigger animation
  useEffect(() => {
    setTableKey(k => k + 1);
  }, [tracks]);

  // Check for truncated content when tracks change
  useEffect(() => {
    if (!tracks || tracks.length === 0) return;
    
    // Use setTimeout to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      const newTruncatedStates = {};
      
      tracks.forEach((track, index) => {
        if (track.artist && typeof track.artist === 'string') {
          const artists = track.artist.split(', ').map(a => a.trim());
          
          // Only check for truncation if there are 3+ artists
          if (artists.length >= 3) {
            // Find the artist cell in the DOM
            const artistCells = document.querySelectorAll(`[data-track-index="${index}"] .artist-cell`);
            if (artistCells.length > 0) {
              const cell = artistCells[0];
              const isOverflowing = cell.scrollWidth > cell.clientWidth;
              newTruncatedStates[index] = isOverflowing;
            }
          }
        }
      });
      
      setTruncatedStates(newTruncatedStates);
    }, 100);
    
    return () => clearTimeout(timeoutId);
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

  // Tooltip handlers
  const handleCellMouseEnter = (e, rowIndex, column, content) => {
    // Only show tooltip if content is actually truncated
    const element = e.currentTarget;
    if (element.scrollWidth > element.clientWidth) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
      setHoveredCell({ row: rowIndex, col: column, content });
    }
  };

  const handleCellMouseLeave = () => {
    // Delay hiding tooltip for 5 seconds
    window.tooltipTimeout = setTimeout(() => {
      setHoveredCell(null);
    }, 5000);
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
    
    setClickingArtist(artistName);
    
    try {
      let spotifyId = null;
      let ticketmasterId = null;
      let imageUrl = null;
      
      // Get Spotify ID and image from track data or search Spotify API
      const track = tracks[trackIndex];
      console.log('Full track data:', JSON.stringify(track, null, 2));
      console.log('Looking for artist:', artistName);
      
      // Try to get from track.artists array first (if it exists)
      if (track && track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
        const artist = track.artists[0];
        if (artist && artist.id) {
          spotifyId = artist.id;
          imageUrl = artist.images?.[0]?.url || null;
          console.log(`Extracted Spotify ID from track.artists: ${spotifyId}`);
          console.log(`Extracted image URL from track.artists: ${imageUrl}`);
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

  // Helper function to render clickable artist names with popover
  const renderArtistNames = (track, trackIndex) => {
    const artistNames = track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '');
    
    if (!artistNames) return '';
    
    // Split by comma and handle multiple artists
    const artists = artistNames.split(',').map(name => name.trim()).filter(name => name);
    
    if (artists.length === 1) {
      // Single artist - make it clickable
      const isClicking = clickingArtist === artists[0];
      return (
        <span
          style={{
            color: '#1db954',
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: '#1db954',
            textUnderlineOffset: '2px',
            transition: 'all 0.2s ease',
            opacity: isClicking ? 0.7 : 1,
            padding: '2px 4px',
            borderRadius: '4px',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1ed760';
            e.currentTarget.style.textDecorationColor = '#1ed760';
            e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#1db954';
            e.currentTarget.style.textDecorationColor = '#1db954';
            e.currentTarget.style.background = 'transparent';
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleArtistClick(artists[0], trackIndex);
          }}
          title={`Click to view ${artists[0]}'s profile`}
        >
          {artists[0]}
        </span>
      );
    } else if (artists.length <= 2) {
      // 2 or fewer artists - make each clickable without popover
      return artists.map((artist, index) => {
        const isClicking = clickingArtist === artist;
        return (
          <React.Fragment key={index}>
            <span
              style={{
                color: '#1db954',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: '#1db954',
                textUnderlineOffset: '2px',
                transition: 'all 0.2s ease',
                opacity: isClicking ? 0.7 : 1,
                padding: '2px 4px',
                borderRadius: '4px',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1ed760';
                e.currentTarget.style.textDecorationColor = '#1ed760';
                e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1db954';
                e.currentTarget.style.textDecorationColor = '#1db954';
                e.currentTarget.style.background = 'transparent';
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
    } else {
      // 3+ artists - check if content is actually truncated
      const showPopover = popoverStates[trackIndex] || false;
      const isTruncated = truncatedStates[trackIndex] || false;
      
      // If not truncated, render as simple clickable artists (like the 2-artist case)
      if (!isTruncated) {
        return artists.map((artist, index) => {
          const isClicking = clickingArtist === artist;
          return (
            <React.Fragment key={index}>
              <span
                style={{
                  color: '#1db954',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationColor: '#1db954',
                  textUnderlineOffset: '2px',
                  transition: 'all 0.2s ease',
                  opacity: isClicking ? 0.7 : 1,
                  padding: '2px 4px',
                  borderRadius: '4px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1ed760';
                  e.currentTarget.style.textDecorationColor = '#1ed760';
                  e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1db954';
                  e.currentTarget.style.textDecorationColor = '#1db954';
                  e.currentTarget.style.background = 'transparent';
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
      }
      
      // Only show popover if content is actually truncated
      return (
        <div 
          style={{ 
            position: 'relative', 
            display: 'inline-block',
            cursor: 'pointer',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={() => setPopoverStates(prev => ({ ...prev, [trackIndex]: true }))}
          onMouseLeave={() => setPopoverStates(prev => ({ ...prev, [trackIndex]: false }))}
          onClick={(e) => {
            e.stopPropagation();
            setPopoverStates(prev => ({ ...prev, [trackIndex]: !prev[trackIndex] }));
          }}
        >
          {/* Visible truncated list */}
          <span style={{ color: '#1db954' }}>
            {artists.slice(0, 2).map((artist, index) => (
              <React.Fragment key={index}>
                <span
                  style={{
                    color: '#1db954',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: '#1db954',
                    textUnderlineOffset: '2px',
                    transition: 'all 0.2s ease',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1ed760';
                    e.currentTarget.style.textDecorationColor = '#1ed760';
                    e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1db954';
                    e.currentTarget.style.textDecorationColor = '#1db954';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArtistClick(artist, trackIndex);
                  }}
                >
                  {artist}
                </span>
                {index < Math.min(2, artists.length - 1) && (
                  <span style={{ color: '#b3b3b3' }}>, </span>
                )}
              </React.Fragment>
            ))}
            {artists.length > 2 && (
              <span style={{ color: '#1db954', textDecoration: 'underline' }}>...</span>
            )}
          </span>
          
          {/* Hidden popover menu - only show if content is truncated */}
          {showPopover && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                left: '0',
                transform: 'translateY(-100%)',
                background: '#1a1a1a',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
                zIndex: 10000,
                minWidth: '200px',
                border: '1px solid #333',
              }}
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
                        color: '#1db954',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: '#1db954',
                        textUnderlineOffset: '2px',
                        transition: 'all 0.2s ease',
                        opacity: isClicking ? 0.7 : 1,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#1ed760';
                        e.currentTarget.style.textDecorationColor = '#1ed760';
                        e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1db954';
                        e.currentTarget.style.textDecorationColor = '#1db954';
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
          )}
        </div>
      );
    }
  };

  // Estimate row height for minHeight reservation
  const rowHeight = 72; // px, adjust as needed
  const minHeight = tracks && tracks.length > 0 ? tracks.length * rowHeight + 120 : 0; // +120 for header/buttons

  return (
    <div style={{
      background: '#181818',
      borderRadius: 18,
      padding: '3vw 2vw 2vw 2vw',
      margin: '3vw auto',
      maxWidth: '98vw',
      boxShadow: '0 4px 32px #0003',
      position: 'relative',
      minHeight,
      fontSize: 'clamp(0.85rem, 1.1vw, 1.08rem)', // base font size for all text
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
          flexWrap: 'wrap',
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
      <div style={{ width: '100%', overflowX: 'auto', marginTop: 8 }}>
        {!loading && !error && tracks && tracks.length > 0 && (
          <table style={{
            width: '98%',
            maxWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'transparent',
            color: '#f3f3f3',
            fontSize: 'clamp(0.85rem, 1.08vw, 1.04rem)',
            minWidth: 700,
            boxShadow: 'none',
            margin: '0 auto',
          }} key={tableKey}>
            <thead>
              <tr style={{ background: 'none', color: '#b3b3b3', fontWeight: 700, fontSize: 'clamp(0.93rem, 1.08vw, 1.04rem)' }}>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>#</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Cover</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Artist</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Album</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Year</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Analyze</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Play</th>
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
                    fontSize: '1.13em',
                    animationDelay: `${idx * 60}ms`,
                    animationName: 'fadeInUp',
                    animationDuration: '400ms',
                    animationFillMode: 'both',
                    opacity: 0,
                    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <td style={{ padding: '16px 0 16px 12px', fontWeight: 700, fontSize: '1.08em', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>
                    {track.album_image || track.album?.images?.[0]?.url ? (
                      <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 'clamp(32px, 7vw, 56px)', height: 'clamp(32px, 7vw, 56px)', borderRadius: 10, objectFit: 'cover', background: '#232323', marginRight: 'clamp(8px, 2vw, 18px)' }} />
                    ) : (
                      <div style={{
                        width: 'clamp(32px, 7vw, 56px)',
                        height: 'clamp(32px, 7vw, 56px)',
                        borderRadius: '50%',
                        background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][idx % 8],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 'clamp(1.1rem, 2vw, 1.75rem)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px #0004',
                        marginRight: 'clamp(8px, 2vw, 18px)',
                      }}>{track.name ? track.name[0] : '?'}</div>
                    )}
                  </td>
                  <td 
                    style={{ 
                      padding: '16px 0', 
                      fontWeight: 700, 
                      maxWidth: 180, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(6px, 1vw, 18px)', 
                      paddingRight: 'clamp(6px, 1vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      // Show tooltip when hovering anywhere in the cell
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: rect.left,
                        y: rect.top - 10, // Position tooltip slightly above the cell
                        width: rect.width,
                        height: rect.height
                      });
                      setHoveredCell({ 
                        row: idx, 
                        col: 'name', 
                        content: track.name
                      });
                    }}
                    onMouseLeave={() => {
                      // Delay hiding tooltip for 5 seconds
                      window.tooltipTimeout = setTimeout(() => {
                        setHoveredCell(null);
                      }, 5000);
                    }}
                  >
                    {track.name}
                  </td>
                  <td 
                    className="artist-cell"
                    style={{ 
                      padding: '16px 0', 
                      color: '#b3b3b3', 
                      maxWidth: 160, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(6px, 1vw, 18px)', 
                      paddingRight: 'clamp(6px, 1vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      // Show tooltip when hovering anywhere in the cell
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: rect.left,
                        y: rect.top - 10, // Position tooltip slightly above the cell
                        width: rect.width,
                        height: rect.height
                      });
                      setHoveredCell({ 
                        row: idx, 
                        col: 'artist', 
                        content: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')
                      });
                    }}
                    onMouseLeave={() => {
                      // Delay hiding tooltip for 5 seconds
                      window.tooltipTimeout = setTimeout(() => {
                        setHoveredCell(null);
                      }, 5000);
                    }}
                  >
                    {renderArtistNames(track, idx)}
                  </td>
                  <td 
                    style={{ 
                      padding: '16px 0', 
                      color: '#b3b3b3', 
                      maxWidth: 160, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      paddingLeft: 'clamp(6px, 1vw, 18px)', 
                      paddingRight: 'clamp(6px, 1vw, 18px)',
                      cursor: 'default',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      // Show tooltip when hovering anywhere in the cell
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: rect.left,
                        y: rect.top - 10, // Position tooltip slightly above the cell
                        width: rect.width,
                        height: rect.height
                      });
                      setHoveredCell({ 
                        row: idx, 
                        col: 'album', 
                        content: track.album?.name || track.album
                      });
                    }}
                    onMouseLeave={() => {
                      // Delay hiding tooltip for 5 seconds
                      window.tooltipTimeout = setTimeout(() => {
                        setHoveredCell(null);
                      }, 5000);
                    }}
                  >
                    {track.album?.name || track.album}
                  </td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                  <td style={{ padding: '16px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{/* Analyze button remains as is for now */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        ref={el => { if (el) buttonRefs.current[idx] = el; }}
                        style={{
                          background: '#232323',
                          color: '#fff',
                          borderRadius: 10,
                          fontWeight: 700,
                          padding: '12px 28px',
                          fontSize: '1.08rem',
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
                                fontSize: '0.92rem',
                                padding: '4px 10px',
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
                                fontSize: '0.92rem',
                                padding: '4px 10px',
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
      
      {/* Hover Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            width: tooltipPosition.width,
            minHeight: tooltipPosition.height,
            background: '#1a1a1a',
            color: '#fff',
            padding: '16px 0',
            paddingLeft: 'clamp(6px, 1vw, 18px)',
            paddingRight: 'clamp(6px, 1vw, 18px)',
            fontSize: 'clamp(0.85rem, 1.1vw, 1.08rem)',
            fontWeight: hoveredCell.col === 'name' ? 700 : 400,
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
            pointerEvents: 'auto',
            animation: 'tooltipFadeIn 0.2s ease-out',
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '8px',
          }}
          onMouseEnter={() => {
            // Keep tooltip visible when hovering over it - clear any pending timeout
            if (window.tooltipTimeout) {
              clearTimeout(window.tooltipTimeout);
              window.tooltipTimeout = null;
            }
          }}
          onMouseLeave={() => {
            // Hide tooltip after 5 seconds when leaving the tooltip
            window.tooltipTimeout = setTimeout(() => {
              setHoveredCell(null);
            }, 5000);
          }}
          onClick={(e) => {
            e.stopPropagation();
            // If it's an artist cell, make it clickable
            if (hoveredCell.col === 'artist') {
              const artistNames = hoveredCell.content;
              const artists = artistNames.split(',').map(name => name.trim()).filter(name => name);
              if (artists.length > 0) {
                // Click the first artist (or you could show a selection dialog)
                handleArtistClick(artists[0], hoveredCell.row);
              }
            }
          }}
        >
          {hoveredCell.col === 'artist' ? (
            // Render clickable artist names in tooltip
            <div style={{ width: '100%' }}>
              {hoveredCell.content.split(',').map((artist, index) => {
                const artistName = artist.trim();
                return (
                  <React.Fragment key={index}>
                    <span
                      style={{
                        color: '#1db954',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: '#1db954',
                        textUnderlineOffset: '2px',
                        transition: 'all 0.2s ease',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        margin: '2px 0',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#1ed760';
                        e.currentTarget.style.textDecorationColor = '#1ed760';
                        e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1db954';
                        e.currentTarget.style.textDecorationColor = '#1db954';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArtistClick(artistName, hoveredCell.row);
                      }}
                    >
                      {artistName}
                    </span>
                    {index < hoveredCell.content.split(',').length - 1 && (
                      <span style={{ color: '#b3b3b3' }}>, </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            hoveredCell.content
          )}
        </div>
      )}
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .${styles.animatedRow} {
          opacity: 0;
        }
        .${styles.animatedRow}[style*='animation-name'] {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
