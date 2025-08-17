import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AudioAnalysisInterface from './AudioAnalysisInterface';
import GenreBasedAnalysisModal from './GenreBasedAnalysisModal';
import { lookupTrackMBID } from '../utils/trackAnalysisCache';

export default function NewSongAnalysisModal({ open, onClose, songInfo }) {
  const [mbid, setMbid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artistGenre, setArtistGenre] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);

  useEffect(() => {
    if (open && songInfo) {
      setLoading(true);
      setError(null);
      setArtistGenre(null);
      setShowGenreModal(false);
      
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
      setShowGenreModal(false);
    }
  }, [open, songInfo]);

  const checkArtistGenre = async () => {
    try {
      // Get artist name from song info
      const artistName = songInfo.artists ? songInfo.artists[0].name : songInfo.artist;
      
      if (!artistName) {
        // No artist name available
        setError('No MBID found and no artist information available.');
        setLoading(false);
        return;
      }

      // Fetch artist genre from Spotify
      const response = await fetch(`http://127.0.0.1:8000/artist-genre-by-name?artistName=${encodeURIComponent(artistName)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.primaryGenre) {
          // Scenario 2: No MBID but artist has genre
          setArtistGenre(data.primaryGenre);
          setError(null);
          setLoading(false);
        } else {
          // Scenario 3: No MBID and no genre
          setError('No MBID found and no artist genre available on Spotify.');
          setLoading(false);
        }
      } else {
        // API error
        setError('No MBID found and unable to fetch artist genre from Spotify.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking artist genre:', err);
      setError('No MBID found and unable to fetch artist genre from Spotify.');
      setLoading(false);
    }
  };

  const handleGenreButtonClick = () => {
    setShowGenreModal(true);
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
              <div style={{ color: '#f87171', marginBottom: '20px' }}>{error}</div>
              {artistGenre && (
                <button
                  onClick={handleGenreButtonClick}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(90deg, #60a5fa, #a855f7)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.8'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  View Genre Analysis
                </button>
              )}
            </div>
          ) : mbid ? (
            // Scenario 1: MBID exists - show detailed analysis
            <AudioAnalysisInterface mbid={mbid} onClose={onClose} />
          ) : artistGenre ? (
            // Scenario 2: No MBID but has genre - show genre info and button
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Genre-Based Analysis Available
              </div>
              <div style={{ color: '#d1d5db', marginBottom: '24px' }}>
                While we couldn't find a MusicBrainz ID for this track, we can provide analysis based on the artist's genre: <strong>{artistGenre}</strong>
              </div>
              <button
                onClick={handleGenreButtonClick}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #60a5fa, #a855f7)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                View Genre Analysis
              </button>
            </div>
          ) : (
            <div style={{ color: '#f87171', textAlign: 'center', padding: '50px' }}>No analysis available for this track.</div>
          )}
        </div>
      </div>

      {/* Genre Analysis Modal */}
      <GenreBasedAnalysisModal
        open={showGenreModal}
        onClose={() => setShowGenreModal(false)}
        songInfo={songInfo}
        artistGenre={artistGenre}
      />
    </>
  );
}

NewSongAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
};
