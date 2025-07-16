import React from 'react';
import styles from '../app/page.module.css';

export default function TopArtistsTable({ artists, title }) {
  return (
    <div className={styles.songsTableWrapper}>
      <div className={styles.songsTableTitle}>{title}</div>
      <table className={styles.songsTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Image</th>
            <th>Name</th>
            <th>Genres</th>
            <th>Analyze</th>
            <th>Play</th>
          </tr>
        </thead>
        <tbody>
          {artists?.map((artist, idx) => (
            <tr key={artist.id}>
              <td>{idx + 1}</td>
              <td>{artist.images?.[0]?.url ? <img src={artist.images[0].url} alt={artist.name} style={{ width: 48, height: 48, borderRadius: '50%' }} /> : <span style={{ color: '#888' }}>Unknown</span>}</td>
              <td>{artist.name}</td>
              <td>{artist.genres && artist.genres.length > 0 ? artist.genres.join(', ') : <span style={{ color: '#888' }}>Unknown</span>}</td>
              <td><button className={styles.analyzePillButton}>Genre</button></td>
              <td>
                <a href={`https://open.spotify.com/artist/${artist.id}`} target="_blank" rel="noopener noreferrer">
                  <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 