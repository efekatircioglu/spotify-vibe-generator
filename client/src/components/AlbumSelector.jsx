import React from 'react';
import styles from '../app/page.module.css';

export default function AlbumSelector({ albums, selectedAlbumId, onAlbumSelect }) {
  return (
    <div className={styles.albumSelectorContainer}>
      {albums.map(album => (
        <div
          key={album.id}
          className={
            styles.albumNode + (album.id === selectedAlbumId ? ' ' + styles.selectedAlbumNode : '')
          }
          onClick={() => onAlbumSelect(album)}
        >
          <img src={album.image} alt={album.name} className={styles.albumCover} />
          <div className={styles.albumName}>{album.name}</div>
          <div className={styles.albumYear}>{album.releaseYear}</div>
        </div>
      ))}
    </div>
  );
} 