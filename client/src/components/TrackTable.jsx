import React, { useState, useEffect } from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';
import WrappedAnalysisModal from './WrappedAnalysisModal';

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, loading, error, showCreatePlaylist = true, showViewPlaylist = true }) {
  const [showWrapped, setShowWrapped] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  // When tracks change, increment tableKey to trigger animation
  useEffect(() => {
    setTableKey(k => k + 1);
  }, [tracks]);

  // Estimate row height for minHeight reservation
  const rowHeight = 72; // px, adjust as needed
  const minHeight = tracks && tracks.length > 0 ? tracks.length * rowHeight + 120 : 0; // +120 for header/buttons

  return (
    <div className={styles.songsTableWrapper} style={{ position: 'relative', minHeight }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 72, padding: '0 24px 0 12px', marginBottom: 8 }}>
        <div className={styles.songsTableTitle} style={{ margin: 0 }}>{title}</div>
        <div style={{ display: 'flex', gap: 24 }}>
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
      <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && tracks && tracks.length > 0 && (
        <table className={styles.songsTable} key={tableKey}>
          <thead>
            <tr>
              <th>#</th>
              <th>Cover</th>
              <th>Name</th>
              <th>Artist</th>
              <th>Album</th>
              <th>Year</th>
              <th>Duration</th>
              <th>Analyze</th>
              <th>Play</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, idx) => (
              <tr
                key={track.id ? `${track.id}-${idx}` : idx}
                className={styles.animatedRow}
                style={{
                  animationDelay: `${idx * 60}ms`,
                  animationName: 'fadeInUp',
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                  opacity: 0,
                  animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <td>{idx + 1}</td>
                <td>{track.album_image || track.album?.images?.[0]?.url ? <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 64, height: 64, borderRadius: 8 }} /> : ''}</td>
                <td>{track.name}</td>
                <td>{track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')}</td>
                <td>{track.album?.name || track.album}</td>
                <td>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                <td>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                <td>
                  <button
                    className={styles.analyzePillButton}
                    style={{
                      background: '#e0e7ff',
                      color: '#2563eb',
                      borderRadius: 9999,
                      fontWeight: 700,
                      padding: '6px 18px',
                      fontSize: '1rem',
                      margin: '0 4px',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      border: 'none',
                      outline: 'none',
                      display: 'inline-block',
                    }}
                    onClick={() => onExploreGenre && onExploreGenre(track)}
                  >
                    Genre
                  </button>
                </td>
                <td>
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
      `}</style>
    </div>
  );
} 