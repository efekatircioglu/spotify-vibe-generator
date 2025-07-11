import React from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, loading, error }) {
  return (
    <div className={styles.songsTableWrapper}>
      <div className={styles.songsTableTitle}>{title}</div>
      <PlaylistActions tracks={tracks} playlistKey={playlistKey} playlistNameLabel={title} />
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
              <th>Genre</th>
              <th>Play</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, idx) => (
              <tr key={track.id ? `${track.id}-${idx}` : idx}>
                <td>{idx + 1}</td>
                <td>{track.album_image || track.album?.images?.[0]?.url ? <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 48, height: 48, borderRadius: 8 }} /> : ''}</td>
                <td>{track.name}</td>
                <td>{track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')}</td>
                <td>{track.album?.name || track.album}</td>
                <td>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                <td>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                <td>
                  <span
                    className={styles.analyzeGenreButton}
                    style={{
                      background: 'none',
                      color: '#1db954',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: 0,
                      boxShadow: 'none',
                      borderRadius: 0,
                      transition: 'color 0.2s',
                      display: 'inline-block',
                    }}
                    onClick={() => onExploreGenre && onExploreGenre(track)}
                  >
                    Explore Genre
                  </span>
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