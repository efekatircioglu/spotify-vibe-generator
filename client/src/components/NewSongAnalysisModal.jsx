import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AudioAnalysisInterface from './AudioAnalysisInterface';
import GenreBasedAnalysisModal from './GenreBasedAnalysisModal';
import { lookupTrackMBID } from '../utils/spotifyIdToMBID';

export default function NewSongAnalysisModal({ open, onClose, songInfo }) {
  const [mbid, setMbid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artistGenre, setArtistGenre] = useState(null);
  const [genreSource, setGenreSource] = useState('spotify');


  useEffect(() => {
    if (open && songInfo) {
      setLoading(true);
      setError(null);
      setArtistGenre(null);
      setGenreSource('spotify');
      
      const fetchMbid = async () => {
        try {
          const realMbid = await lookupTrackMBID(songInfo.id);
          if (realMbid) {
            // Scenario 1: MBID found - show detailed analysis
            setMbid(realMbid);
            setError(null);
            setLoading(false);
          } else {
            // Scenario 2 & 3: No MBID - check if artist has genre
            setMbid(null);
            await checkArtistGenre();
          }
        } catch (e) {
          setMbid(null);
          setError('Error fetching MBID.');
          setLoading(false);
        }
      };
      
      fetchMbid();
    } else {
      setMbid(null);
      setLoading(false);
      setError(null);
      setArtistGenre(null);
      setGenreSource('spotify');
    }
  }, [open, songInfo]);

  // Effect to handle body scrolling - prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      // Lock body scroll when modal is open (prevents desktop background scrolling)
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'auto';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const checkArtistGenre = async () => {
    try {
      // Get the main artist's Spotify ID from song info using the same structure as NewTrackTable.jsx
      let mainArtistSpotifyId = null;
      
      console.log('[Genre Check] songInfo structure:', songInfo);
      console.log('[Genre Check] songInfo.artists:', songInfo.artists);
      
      // Use the exact same logic as NewTrackTable.jsx
      if (songInfo && songInfo.artists && Array.isArray(songInfo.artists) && songInfo.artists.length > 0) {
        // Get the Spotify ID of the first artist (usually the main artist)
        const firstArtist = songInfo.artists[0];
        if (firstArtist && firstArtist.id) {
          mainArtistSpotifyId = firstArtist.id;
          console.log(`[Genre Check] Found Spotify artist ID from songInfo.artists[0]: ${mainArtistSpotifyId}`);
          console.log(`[Genre Check] Artist name: ${firstArtist.name}`);
        } else {
          console.log('[Genre Check] First artist exists but has no ID:', firstArtist);
        }
      } else if (songInfo.artist && songInfo.artist.id) {
        // Fallback to single artist with ID
        mainArtistSpotifyId = songInfo.artist.id;
        console.log(`[Genre Check] Found Spotify artist ID from songInfo.artist: ${mainArtistSpotifyId}`);
      } else {
        // Log the entire songInfo to debug what's available
        console.log('[Genre Check] No artists array or artist object with ID found');
        console.log('[Genre Check] songInfo.artist:', songInfo.artist);
      }
      
      if (!mainArtistSpotifyId) {
        // No Spotify artist ID available - try Discogs with artist name as fallback
        console.log('[Genre Check] No Spotify artist ID found, attempting Discogs fallback with artist name');
        
        try {
          const artistName = songInfo.artists ? songInfo.artists[0]?.name : songInfo.artist;
          if (artistName) {
            const discogsResponse = await fetch(`http://127.0.0.1:8000/discogs/artist/${encodeURIComponent(artistName)}/primary-genre`);
            
            if (discogsResponse.ok) {
              const discogsData = await discogsResponse.json();
                              if (discogsData && discogsData.primaryGenre) {
                  // No MBID, no Spotify ID, but Discogs has genre
                  console.log(`[Genre Check] Found Discogs genre "${discogsData.primaryGenre}" for artist "${artistName}"`);
                  setArtistGenre(discogsData.primaryGenre);
                  setGenreSource('discogs');
                  setError(null);
                  setLoading(false);
                  return;
                }
            }
          }
        } catch (discogsErr) {
          console.log('[Genre Check] Discogs fallback failed:', discogsErr);
        }
        
        // No genre found from either source
        console.error('[Genre Check] No Spotify artist ID or Discogs genre found in song data:', songInfo);
        setError('No MBID found and no artist genre available on Spotify or Discogs.');
        setLoading(false);
        return;
      }

      console.log(`[Genre Check] Checking genre for artist Spotify ID: ${mainArtistSpotifyId}`);

      // Fetch artist genre from Spotify using the Spotify artist ID
      const response = await fetch(`http://127.0.0.1:8000/artist-genre/${mainArtistSpotifyId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.genres && data.genres.length > 0) {
          // Scenario 2: No MBID but main artist has Spotify genre
          const primaryGenre = data.genres[0];
          console.log(`[Genre Check] Found Spotify genre "${primaryGenre}" for artist ID "${mainArtistSpotifyId}"`);
          setArtistGenre(primaryGenre);
          setGenreSource('spotify');
          setError(null);
          setLoading(false);
        } else {
          // Spotify genre not found, try Discogs as fallback
          console.log(`[Genre Check] No Spotify genre found, attempting Discogs fallback for artist: ${songInfo.artists ? songInfo.artists[0]?.name : songInfo.artist}`);
          
          try {
            const artistName = songInfo.artists ? songInfo.artists[0]?.name : songInfo.artist;
            const discogsResponse = await fetch(`http://127.0.0.1:8000/discogs/artist/${encodeURIComponent(artistName)}/primary-genre`);
            
            if (discogsResponse.ok) {
              const discogsData = await discogsResponse.json();
                              if (discogsData && discogsData.primaryGenre) {
                  // Scenario 2b: No MBID, no Spotify genre, but Discogs has genre
                  console.log(`[Genre Check] Found Discogs genre "${discogsData.primaryGenre}" for artist "${artistName}"`);
                  setArtistGenre(discogsData.primaryGenre);
                  setGenreSource('discogs');
                  setError(null);
                  setLoading(false);
                  return;
                }
            }
          } catch (discogsErr) {
            console.log('[Genre Check] Discogs fallback failed:', discogsErr);
          }
          
          // Scenario 3: No MBID and no genre from either source
          console.log(`[Genre Check] No genre found from Spotify or Discogs for artist ID "${mainArtistSpotifyId}"`);
          setError('No MBID found and no artist genre available on Spotify or Discogs.');
          setLoading(false);
        }
      } else {
        // API error
        console.error(`[Genre Check] API error when fetching genre for artist ID "${mainArtistSpotifyId}":`, response.status);
        setError('No MBID found and unable to fetch artist genre from Spotify.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking artist genre:', err);
      setError('No MBID found and unable to fetch artist genre from Spotify or Discogs.');
      setLoading(false);
    }
  };



  if (!open) return null;

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(20,20,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#444 #232323', background: '#18181b', borderRadius: 24, boxShadow: '0 8px 48px #000b', position: 'relative' }}>
          {loading ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Loading Analysis...</div>
          ) : error ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              {artistGenre ? (
                // If we have genre data, show genre analysis directly instead of error
                <GenreBasedAnalysisModal
                  open={true}
                  onClose={onClose}
                  songInfo={songInfo}
                  artistGenre={artistGenre}
                  genreSource={genreSource}
                />
              ) : (
                // Only show error if no genre data available
                <div style={{ color: '#f87171', marginBottom: '20px' }}>{error}</div>
              )}
            </div>
          ) : mbid ? (
            // Scenario 1: MBID exists - show detailed analysis
            <AudioAnalysisInterface mbid={mbid} onClose={onClose} songInfo={songInfo} />
          ) : artistGenre ? (
            // Scenario 2: No MBID but has genre - show genre analysis directly
            <GenreBasedAnalysisModal
              open={true}
              onClose={onClose}
              songInfo={songInfo}
              artistGenre={artistGenre}
              genreSource={genreSource}
            />
          ) : (
            <div style={{ color: '#f87171', textAlign: 'center', padding: '50px' }}>No analysis available for this track.</div>
          )}
        </div>
      </div>


    </>
  );
}

NewSongAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
};
