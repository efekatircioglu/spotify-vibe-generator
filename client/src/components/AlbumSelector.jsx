import React from 'react';
import styles from '../app/page.module.css';

function findDiscogsGenreStyle(albumName, genreStyleMap) {
  if (!albumName || !genreStyleMap) return null;
  const normalized = albumName.trim().toLowerCase();
  // Find a Discogs key that ends with the album name (case-insensitive)
  for (const key of Object.keys(genreStyleMap)) {
    if (key.toLowerCase().endsWith(normalized)) {
      return { discogsKey: key, genre: genreStyleMap[key][0], style: genreStyleMap[key][1] };
    }
  }
  return null;
}

export default function AlbumSelector({ albums, selectedAlbumId, onAlbumSelect, albumGenreStyleMap }) {
  return (
    <div className={styles.albumSelectorContainer}>
      {albums.map(album => {
        const discogs = findDiscogsGenreStyle(album.name, albumGenreStyleMap);
        return (
          <div
            key={album.id}
            className={
              styles.selectorAlbumNode + (album.id === selectedAlbumId ? ' ' + styles.selectedAlbumNode : '')
            }
            onClick={() => onAlbumSelect(album)}
          >
            <img src={album.image} alt={album.name} className={styles.albumCover} />
            <div className={styles.selectorAlbumName}>{album.name}</div>
            <div className={styles.albumYear}>{album.releaseYear}</div>
            {album.popularity !== undefined && album.popularity > 0 && (
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#1db954',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 8,
                border: '1px solid #1db954'
              }}>
                {album.popularity}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 