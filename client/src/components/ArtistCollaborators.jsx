"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';
import React from 'react';
import NewContributorFinder from './NewContributorFinder';
import NewSongAnalysisModal from './NewSongAnalysisModal';
import GeniusSongModal from './GeniusSongModal';
import { lookupTrackMBID } from '../utils/spotifyIdToMBID';



export default function ArtistCollaborators({ artistId, artistName, collaborators = [], loading = false, error = '', stats = null, onAnalyze }) {
  const selectedAlbumTypes = 'album,single,compilation,appears_on'; // Always use all types
  const [expandedCollaborator, setExpandedCollaborator] = useState(null);
  const [isComponentExpanded, setIsComponentExpanded] = useState(false); // Main expand/collapse state - starts collapsed
  const hasTriggeredAnalysis = useRef(false);
  
  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(null); // "collaboratorId-trackIndex" for open dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  
  // Modal states
  const [contributorModalOpen, setContributorModalOpen] = useState(false);
  const [selectedTrackMBID, setSelectedTrackMBID] = useState(null);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [isContribLoading, setIsContribLoading] = useState(false);
  
  const [showNewSongAnalysisModal, setShowNewSongAnalysisModal] = useState(false);
  const [selectedTrackForNewAnalysis, setSelectedTrackForNewAnalysis] = useState(null);
  
  const [showGeniusModal, setShowGeniusModal] = useState(false);
  const [geniusSongInfo, setGeniusSongInfo] = useState(null);
  const [isGeniusLoading, setIsGeniusLoading] = useState(false);
  const [geniusError, setGeniusError] = useState(null);
  
  const router = useRouter();

  const handleAnalyzeClick = () => {
    if (onAnalyze) {
      // Start the analysis
      onAnalyze(selectedAlbumTypes);
      
      // Automatically expand the component to show loading state
      setIsComponentExpanded(true);
      
      // Mark that analysis has been triggered
      hasTriggeredAnalysis.current = true;
    }
  };

  // Remove automatic analysis trigger - now optional
  // useEffect(() => {
  //   // Trigger analysis when component mounts if no collaborators data yet
  //   if (!loading && !collaborators?.length && !error && artistId && !hasTriggeredAnalysis.current) {
  //     hasTriggeredAnalysis.current = true;
  //     handleAnalyzeClick();
  //   }
  // }, [artistId]);

  // Auto-expand when results are available
  useEffect(() => {
    if (collaborators.length > 0 && !loading && !error) {
      setIsComponentExpanded(true);
    }
  }, [collaborators.length, loading, error]);



  // Close contributor modal on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle contributor modal closing logic if needed
    }
    if (contributorModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contributorModalOpen]);

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
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [dropdownOpen]);

  const handleCollaboratorClick = (collaborator) => {
    // Navigate to the collaborator's artist page
    router.push(`/artist?name=${encodeURIComponent(collaborator.name)}&spotifyId=${collaborator.id}`);
  };

  const handleRowClick = (collaborator) => {
    // Toggle the expanded view for this collaborator
    setExpandedCollaborator(expandedCollaborator === collaborator.id ? null : collaborator.id);
  };

  // Helper function to render clickable artist names (from NewTrackTable)
  const renderArtistNames = (track, trackIndex) => {
    const artistNames = track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '');
    
    if (!artistNames) return '';
    
    // Split by comma and handle multiple artists
    const artists = artistNames.split(',').map(name => name.trim()).filter(name => name);
    
    // For collaboration view, we'll keep it simple and just show clickable artist names
    return artists.map((artist, index) => {
      return (
        <React.Fragment key={index}>
          <span
            style={{
              color: '#b3b3b3',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleArtistClick(artist);
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

  const handleArtistClick = (artistName) => {
    // Navigate to the artist page
    router.push(`/artist?name=${encodeURIComponent(artistName)}`);
  };

  // Breakdown button handlers (from NewTrackTable)
  const handleContributionsClick = async (track) => {
    setSelectedTrackInfo(track);
    setContributorModalOpen(true);
    setIsContribLoading(true);

    const mbid = await lookupTrackMBID(track.id);
    setSelectedTrackMBID(mbid);

    setIsContribLoading(false);
  };

  const handleGeniusClick = async (track) => {
    try {
      setShowGeniusModal(true);
      setIsGeniusLoading(true);
      setGeniusError(null);
      
      // Extract artist name from track data
      let artistName = '';
      if (track.artist && typeof track.artist === 'string') {
        artistName = track.artist.split(',')[0].trim(); // Take first artist if multiple
      } else if (track.artists && Array.isArray(track.artists)) {
        artistName = track.artists[0]?.name || track.artists[0];
      }
      
      if (!artistName) {
        throw new Error('Unable to determine artist name');
      }
      
      console.log(`[Genius] Fetching info for: "${track.name}" by "${artistName}"`);
      
      // Call Genius API
      const response = await fetch(`http://127.0.0.1:8000/genius/song-info?songName=${encodeURIComponent(track.name)}&artistName=${encodeURIComponent(artistName)}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log('[Genius] Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const songInfo = await response.json();
      
      // Validate the response structure
      if (!songInfo || !songInfo.songDetails || !songInfo.songDetails.title) {
        console.error('[Genius] Invalid response structure:', songInfo);
        throw new Error('Invalid response from Genius API');
      }
      
      setGeniusSongInfo(songInfo);
      
    } catch (error) {
      console.error('[Genius] Error:', error);
      setGeniusError(error.message);
    } finally {
      setIsGeniusLoading(false);
    }
  };

  const handleGenreClick = async (track) => {
    try {
      console.log('[Genre Click] Preparing track data for modal:', track);
      
      // Prepare the track data with proper artist structure
      let preparedTrack = { ...track };
      
      // If the track doesn't have artists array with IDs, we need to create it
      if (!track.artists || !Array.isArray(track.artists) || !track.artists[0]?.id) {
        console.log('[Genre Click] Track missing artists array with IDs, preparing data...');
        
        // Extract artist name from track.artist (string) or track.artists
        let artistName = null;
        if (track.artist && typeof track.artist === 'string') {
          // Handle comma-separated artist names - take the first one as main artist
          artistName = track.artist.split(',')[0].trim();
        } else if (track.artists && Array.isArray(track.artists)) {
          artistName = track.artists[0]?.name || track.artists[0];
        }
        
        if (artistName) {
          console.log(`[Genre Click] Searching for artist: "${artistName}"`);
          
          try {
            // Search Spotify API for the artist to get their ID
            const spData = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(artistName)}`).then(res => res.json());
            const spotifyArtists = spData.artists || [];
            
            // Find exact match
            const exactSpotify = spotifyArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
            if (exactSpotify && exactSpotify.id) {
              console.log(`[Genre Click] Found Spotify artist ID: ${exactSpotify.id} for "${artistName}"`);
              
              // Create the proper artists array structure
              preparedTrack.artists = [{
                name: exactSpotify.name,
                id: exactSpotify.id,
                images: exactSpotify.images || []
              }];
              
              console.log('[Genre Click] Prepared track data:', preparedTrack);
            } else {
              console.log(`[Genre Click] No exact match found for "${artistName}"`);
            }
          } catch (err) {
            console.error('[Genre Click] Error searching Spotify API:', err);
          }
        }
      } else {
        console.log('[Genre Click] Track already has proper artists array with IDs');
      }
      
      // Set the prepared track data and open modal
      setSelectedTrackForNewAnalysis(preparedTrack);
      setShowNewSongAnalysisModal(true);
      
    } catch (error) {
      console.error('[Genre Click] Error preparing track data:', error);
      // Fallback: use original track data
      setSelectedTrackForNewAnalysis(track);
      setShowNewSongAnalysisModal(true);
    }
  };

  return (
      <div style={{
        background: '#181818',
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div 
          onClick={() => {
            // Only allow clicking if we have results or analysis is in progress
            if (collaborators.length > 0 || loading || stats) {
              setIsComponentExpanded(!isComponentExpanded);
            }
          }}
          style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 18,
            width: '95%',
            margin: '0 auto 18px',
            cursor: (collaborators.length > 0 || loading || stats) ? 'pointer' : 'default',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            // Only show hover effect if clickable
            if (collaborators.length > 0 || loading || stats) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ 
            fontWeight: 900, 
            fontSize: '1.6rem', 
            color: '#f3f3f3', 
            letterSpacing: 1, 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'inherit'
          }}>
            <span>Frequent Collaborators {artistName && `for ${artistName}`}</span>
            
            {/* Show expand/collapse button only if we have results or have started analysis */}
            {(collaborators.length > 0 || loading || stats) ? (
              <span 
                onClick={() => setIsComponentExpanded(!isComponentExpanded)}
                style={{ 
                  color: '#1db954', 
                  fontWeight: 'bold', 
                  fontSize: '20px',
                  transition: 'transform 0.2s ease',
                  transform: isComponentExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  cursor: 'pointer'
                }}
              >
                ▼
              </span>
            ) : null}
          </div>
          
          {stats && (
            <div className="stats-container" style={{ 
              fontSize: '12px', 
              color: '#b3b3b3', 
              textAlign: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <span className="stats-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg className="stats-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#6366f1" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                {stats.totalAlbums} releases
              </span>
              <span>•</span>
              <span className="stats-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg className="stats-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4" style={{ width: '14px', height: '14px' }}>
                  <path d="M12 3v10.55A4.001 4.001 0 1 0 14 17V7h4V3h-6Z" />
                </svg>
                {stats.totalTracks} tracks
              </span>
              <span>•</span>
              <span className="stats-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg className="stats-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#10b981" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {collaborators.length} collaborators
              </span>
            </div>
          )}
        </div>

        {/* Show start button when no analysis has been done and not currently loading */}
        {!loading && !error && collaborators.length === 0 && !stats && !hasTriggeredAnalysis.current && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            margin: '0 20px',
            borderRadius: '8px'
          }}>
            <div style={{ 
              color: '#b3b3b3', 
              fontSize: '0.9rem', 
              marginBottom: '16px' 
            }}>
              Discover who {artistName} frequently collaborates with
            </div>
            <button 
              onClick={handleAnalyzeClick}
              style={{
                backgroundColor: '#1db954',
                color: '#000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(29, 185, 84, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1ed760';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1db954';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(29, 185, 84, 0.3)';
              }}
            >
              Start Collaboration Analysis
            </button>
          </div>
        )}

        {/* Show content only when expanded */}
        {isComponentExpanded && (
          <>
            {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '50px 0',
            flexDirection: 'column'
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#a1a1aa', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Analyzing collaborations...
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #1db954',
                borderTopColor: 'rgba(24, 24, 27, 0.8)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>
            {error}
          </div>
        )}



        {!loading && !error && collaborators.length === 0 && stats && (
          <div style={{ color: '#b3b3b3', textAlign: 'center', padding: '20px' }}>
            No frequent collaborators found.
          </div>
        )}

        {/* Mobile collaborators list */}
        {!loading && !error && collaborators.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: 576,
            overflowY: 'auto',
            width: '95%',
            margin: '0 auto',
          }}>
            <style>{`
              @media (max-width: 500px) {
                .mobile-song-name { font-size: 0.85rem !important; }
                .mobile-artist-name { font-size: 0.8rem !important; }
                .mobile-album-name { font-size: 0.75rem !important; }
                .collaborator-name-span { font-size: 14px !important; }
              }
              @media (max-width: 400px) {
                .mobile-song-name { font-size: 0.75rem !important; }
                .mobile-artist-name { font-size: 0.7rem !important; }
                .mobile-album-name { font-size: 0.65rem !important; }
                .mobile-duration-year { font-size: 0.6rem !important; }
                .collaborator-name-span { font-size: 12px !important; }
                .stats-container { font-size: 10px !important; }
                .stats-icon { width: 12px !important; height: 12px !important; }
              }
              @media (min-width: 600px) {
                .stats-container { font-size: 16px !important; }
                .stats-icon { width: 18px !important; height: 18px !important; }
                .expanded-tracks-container { 
                  padding-left: 12px !important; 
                  padding-right: 12px !important; 
                  max-width: 90% !important;
                  margin: 0 auto !important;
                }
              }
              @media (min-width: 800px) {
                .artist-image-container { width: 50px !important; height: 50px !important; }
                .artist-image { width: 50px !important; height: 50px !important; }
                .artist-image-fallback { width: 50px !important; height: 50px !important; font-size: 20px !important; }
              }
              @media (min-width: 1400px) {
                .stats-container { font-size: 20px !important; }
                .stats-icon { width: 22px !important; height: 22px !important; }
                .artist-image-container { width: 60px !important; height: 60px !important; }
                .artist-image { width: 60px !important; height: 60px !important; }
                .artist-image-fallback { width: 60px !important; height: 60px !important; font-size: 24px !important; }
              }
            `}</style>
            
            {collaborators.map((collaborator, collaboratorIndex) => (
              <div key={collaborator.id}>
                {/* Collaborator header */}
                <div
                  onClick={() => handleRowClick(collaborator)}
                  style={{
                    background: collaboratorIndex % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px #0002',
                    cursor: 'pointer',
                    marginBottom: expandedCollaborator === collaborator.id ? '8px' : '0'
                  }}
                >
                  {/* Index */}
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    minWidth: 24,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {collaboratorIndex + 1}
                  </div>
                  
                  {/* Artist Image */}
                  <div className="artist-image-container" style={{ width: '40px', height: '40px' }}>
                    {collaborator.images && collaborator.images.length > 0 ? (
                      <img 
                        className="artist-image"
                        src={collaborator.images[0].url} 
                        alt={collaborator.name} 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          background: '#333'
                        }} 
                      />
                    ) : (
                      <div className="artist-image-fallback" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][collaboratorIndex % 8],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '16px',
                        color: '#fff',
                        textTransform: 'uppercase'
                      }}>
                        {collaborator.name ? collaborator.name[0] : '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Collaborator info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 700, 
                      color: '#fff', 
                      fontSize: '16px',
                      marginBottom: '2px'
                    }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCollaboratorClick(collaborator);
                        }}
                        className="collaborator-name-span"
                        style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '18px',
                          textDecoration: 'none',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.1)';
                          e.currentTarget.style.color = '#1ed760';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#fff';
                        }}
                      >
                        {collaborator.name}
                      </span>
                    </div>
                    <div style={{ 
                      color: '#b3b3b3', 
                      fontSize: '12px' 
                    }}>
                      {collaborator.count} collaboration{collaborator.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Expand indicator */}
                  <div style={{ color: '#1db954', fontWeight: 'bold', fontSize: '18px' }}>
                    {expandedCollaborator === collaborator.id ? '▼' : '▶'}
                  </div>
                </div>
                
                {/* Expanded tracks list */}
                {expandedCollaborator === collaborator.id && (
                  <div className="expanded-tracks-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  }}>
                    {collaborator.tracks.map((track, trackIndex) => (
                      <div 
                        key={`${track.id}-${trackIndex}`} 
                        style={{
                          background: trackIndex % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          alignItems: 'flex-start',
                          gap: '12px',
                          boxShadow: '0 2px 8px #0002',
                          position: 'relative'
                        }}
                      >
                        {/* Album Cover with Index on top */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          {/* Index Number */}
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: '#1db954',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px #0002'
                          }}>
                            {trackIndex + 1}
                          </div>
                          {/* Album Cover */}
                          {track.album_image ? (
                            <img 
                              src={track.album_image} 
                              alt={track.album} 
                              style={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: 10, 
                                objectFit: 'cover', 
                                background: '#232323' 
                              }} 
                            />
                          ) : (
                            <div style={{
                              width: 48, 
                              height: 48, 
                              borderRadius: '50%', 
                              background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][trackIndex % 8],
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontWeight: 900, 
                              fontSize: 22, 
                              color: '#fff', 
                              textTransform: 'uppercase', 
                              boxShadow: '0 2px 8px #0004',
                            }}>
                              {track.name ? track.name[0] : '?'}
                            </div>
                          )}
                        </div>
                        
                        {/* Track info */}
                        <div style={{ minWidth: 0 }}>
                          <div className="mobile-song-name" style={{
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px'
                          }}>
                            {track.name}
                          </div>
                          <div className="mobile-artist-name" style={{
                            color: '#d1d5db',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px'
                          }}>
                            {renderArtistNames(track, trackIndex)}
                          </div>
                          <div className="mobile-album-name" style={{
                            color: '#b3b3b3',
                            fontSize: '11px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px'
                          }}>
                            {track.album}
                          </div>
                          <div className="mobile-duration-year" style={{
                            color: '#b3b3b3',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>
                              {track.year && `${track.year} • `}
                              {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                            </span>
                            {track.albumType && (
                              <span style={{ 
                                backgroundColor: track.albumType === 'album' ? '#4a5568' : 
                                               track.albumType === 'single' ? '#2b6cb0' :
                                               track.albumType === 'compilation' ? '#9f7aea' : '#1db954',
                                color: '#fff',
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                flexShrink: 0
                              }}>
                                {track.albumType === 'appears_on' ? 'guest' : track.albumType}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 8, 
                          alignItems: 'flex-end', 
                          position: 'relative' 
                        }}>
                          <button
                            style={{
                              background: '#232323', 
                              color: '#fff', 
                              borderRadius: 8, 
                              fontWeight: 700, 
                              padding: '6px 8px', 
                              fontSize: 12, 
                              border: 'none', 
                              cursor: 'pointer', 
                              marginBottom: 4
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdownId = `${collaborator.id}-${trackIndex}`;
                              if (dropdownOpen === dropdownId) {
                                setDropdownOpen(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX,
                                });
                                setDropdownOpen(dropdownId);
                              }
                            }}
                          >
                            Breakdown
                          </button>
                          
                          {dropdownOpen === `${collaborator.id}-${trackIndex}` && (
                            <div
                              ref={dropdownRef}
                              style={{
                                position: 'absolute',
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                background: '#232323',
                                borderRadius: 8,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                zIndex: 999999,
                                minWidth: 120,
                                padding: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                            >
                              <button
                                style={{
                                  background: 'none', 
                                  color: '#fff', 
                                  border: 'none', 
                                  borderRadius: 0, 
                                  fontWeight: 700, 
                                  fontSize: 12, 
                                  padding: '8px 12px', 
                                  textAlign: 'left', 
                                  cursor: 'pointer', 
                                  width: '100%'
                                }}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  setDropdownOpen(null); 
                                  handleGeniusClick(track); 
                                }}
                              >
                                About
                              </button>
                              <button
                                style={{
                                  background: 'none', 
                                  color: '#fff', 
                                  border: 'none', 
                                  borderRadius: 0, 
                                  fontWeight: 700, 
                                  fontSize: 12, 
                                  padding: '8px 12px', 
                                  textAlign: 'left', 
                                  cursor: 'pointer', 
                                  width: '100%'
                                }}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  setDropdownOpen(null); 
                                  handleGenreClick(track); 
                                }}
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
                                  fontSize: 12, 
                                  padding: '8px 12px', 
                                  textAlign: 'left', 
                                  cursor: 'pointer', 
                                  width: '100%'
                                }}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  setDropdownOpen(null); 
                                  handleContributionsClick(track); 
                                }}
                              >
                                Contributors
                              </button>
                            </div>
                          )}
                          
                          {track.id && (
                            <a 
                              href={`https://open.spotify.com/track/${track.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1db954',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                fontWeight: 700,
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px #1db95433',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none',
                              }}
                              title="Play on Spotify"
                            >
                              <svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                                <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
        
        {/* Mobile modals */}
        {contributorModalOpen && (
          <>
            <style jsx global>{`
              #contrib-popup-overlay-mobile {
                position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5);
                z-index: 99940; opacity: 0; transition: opacity 200ms ease-out;
                pointer-events: none; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
              }
              #contrib-popup-overlay-mobile.visible { opacity: 1; pointer-events: auto; }
              #contrib-popup-container-mobile {
                position: fixed; z-index: 99950; opacity: 0; transform: scale(0.95);
                transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0.2, 1);
                pointer-events: none;
                left: 50% !important; 
                top: 50% !important; 
                transform: translate(-50%, -50%) scale(0.95) !important;
                width: 95% !important;
                max-width: 100vw !important;
              }
              #contrib-popup-container-mobile.visible { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1) !important; 
                pointer-events: auto; 
              }
            `}</style>

            <div 
              id="contrib-popup-overlay-mobile" 
              className={contributorModalOpen ? 'visible' : ''} 
              onClick={(e) => {
                if (e.target.id === 'contrib-popup-overlay-mobile') {
                  setContributorModalOpen(false);
                }
              }} 
            />
            
            <div 
              id="contrib-popup-container-mobile" 
              className={contributorModalOpen ? 'visible' : ''}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                backgroundColor: '#181818',
                border: '1px solid #3f3f46',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: 'none',
                padding: '1.5rem'
              }}>
                {isContribLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <div style={{ width: 32, height: 32, border: '4px solid #1db954', borderTopColor: 'rgba(24, 24, 27, 0.8)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : selectedTrackMBID ? (
                  <NewContributorFinder 
                    mbid={selectedTrackMBID} 
                    track={selectedTrackInfo} 
                    closeButton={() => setContributorModalOpen(false)}
                  />
                ) : (
                  <p style={{ textAlign: 'center', color: '#a1a1aa' }}>
                    Contributor information is not available for this track.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
        
        <NewSongAnalysisModal
          open={showNewSongAnalysisModal}
          onClose={() => setShowNewSongAnalysisModal(false)}
          songInfo={selectedTrackForNewAnalysis}
        />
        
        <GeniusSongModal
          open={showGeniusModal}
          onClose={() => setShowGeniusModal(false)}
          songInfo={geniusSongInfo}
          loading={isGeniusLoading}
          error={geniusError}
        />
      </div>
    );
}

ArtistCollaborators.propTypes = {
  artistId: PropTypes.string.isRequired,
  artistName: PropTypes.string
};
