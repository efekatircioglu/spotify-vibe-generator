import React, { useState, useEffect } from 'react';
import styles from '../app/page.module.css';

export default function PlaylistActions({ tracks, playlistNameLabel = 'Playlist', onWrapped }) {
  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState('');
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState('');

  // On mount, fetch the cached playlist URL for this table from the backend
  useEffect(() => {
    setCreatedPlaylistUrl('');
    fetch(`http://127.0.0.1:8000/cached-playlist-url?tableType=${encodeURIComponent(playlistNameLabel)}`)
      .then(res => res.json())
      .then(data => setCreatedPlaylistUrl(data.playlistUrl || ''));
  }, [playlistNameLabel]);

  const handleCreatePlaylist = () => {
    setPlaylistName('');
    setShowModal(true);
    setCreationStatus('');
  };

  const handleViewPlaylist = () => {
    if (createdPlaylistUrl) {
      window.open(createdPlaylistUrl, '_blank');
    }
  };

  const handleCreatePlaylistSubmit = async () => {
    if (!playlistName.trim()) {
      setCreationStatus('Please enter a playlist name.');
      return;
    }
    setIsCreating(true);
    setCreationStatus('Creating playlist...');
    try {
      // Get unique song IDs as a sorted array
      const trackUris = Array.from(new Set(tracks.map(t => t.id))).sort().map(id => `spotify:track:${id}`);
      const response = await fetch('http://127.0.0.1:8000/create-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlistName,
          trackUris,
          timeRange: playlistNameLabel,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setCreationStatus(`Playlist created successfully! ${result.trackCount} tracks added.`);
        setTimeout(() => {
          setShowModal(false);
          setCreationStatus('');
          setPlaylistName('');
          if (result.playlistUrl) {
            setCreatedPlaylistUrl(result.playlistUrl);
          }
        }, 2000);
      } else {
        const error = await response.json();
        setCreationStatus(`Failed to create playlist: ${error.error}`);
      }
    } catch (error) {
      setCreationStatus('Failed to create playlist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', height: '64px', minHeight: '64px', justifyContent: 'flex-end' }}>
      <button
        onClick={handleCreatePlaylist}
        className={styles.vibeButton}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          minWidth: 0,
        }}
      >
        Create Playlist
      </button>
      <button
        className={styles.vibeButton}
        style={{
          marginLeft: 12,
          background: '#e5e7eb',
          color: '#23272f',
          cursor: createdPlaylistUrl ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          minWidth: 0,
          fontWeight: 700,
          fontSize: '1.08rem',
          border: 'none',
          boxShadow: 'none',
          transition: 'background 0.18s, color 0.18s',
        }}
        onClick={handleViewPlaylist}
        disabled={!createdPlaylistUrl}
      >
        View Last Created Playlist
      </button>
      <button
        className={styles.vibeButton}
        style={{
          marginLeft: 12,
          background: '#e5e7eb',
          color: '#23272f',
          height: 48,
          minWidth: 0,
          fontWeight: 700,
          fontSize: '1.08rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          border: 'none',
          boxShadow: 'none',
          transition: 'background 0.18s, color 0.18s',
        }}
        onClick={() => onWrapped && onWrapped()}
        disabled={!tracks || tracks.length === 0}
      >
        Create Your Custom Wrapped
      </button>
      {showModal && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()} style={{ minWidth: 400, maxWidth: 500 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Create Playlist</h2>
            <p style={{ textAlign: 'center', marginBottom: 16, color: '#888' }}>
              Creating playlist from: <span style={{ color: '#1db954' }}>{playlistNameLabel}</span>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff' }}>
                Playlist Name:
              </label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#222',
                  color: '#fff',
                  fontSize: '16px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePlaylistSubmit();
                  }
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#888', fontSize: '14px' }}>
                This will create a playlist with {tracks.length} tracks from your {playlistNameLabel.toLowerCase()}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCreatePlaylistSubmit}
                className={styles.vibeButton}
                disabled={isCreating}
                style={{ flex: 1 }}
              >
                {isCreating ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeModalButton}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
            {creationStatus && (
              <div style={{ 
                textAlign: 'center', 
                color: creationStatus.includes('successfully') ? '#1db954' : 'red', 
                marginTop: 12,
                fontSize: '14px'
              }}>
                {creationStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 