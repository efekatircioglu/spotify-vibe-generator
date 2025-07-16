import React, { useState } from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';
import WrappedAnalysisModal from './WrappedAnalysisModal';

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, loading, error }) {
  const [showWrapped, setShowWrapped] = useState(false);

  return (
    <div className={styles.songsTableWrapper}>
      <div className={styles.songsTableTitle}>{title}</div>
      <PlaylistActions tracks={tracks} playlistKey={playlistKey} playlistNameLabel={title} onWrapped={() => setShowWrapped(true)} />
      <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && tracks && tracks.length > 0 && (
        <table className={styles.songsTable}>
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
              <tr key={track.id ? `${track.id}-${idx}` : idx}>
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
    </div>
  );
} 