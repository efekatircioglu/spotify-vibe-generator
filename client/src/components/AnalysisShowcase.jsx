import React from 'react';
import styles from './AnalysisShowcase.module.css';

export default function AnalysisShowcase({ results }) {
  const analyzedTracks = results.filter(r => r.highLevel && r.lowLevel);

  if (analyzedTracks.length === 0) {
    return <p className={styles.container}>No analysis data could be found for these tracks.</p>;
  }

  return (
    <div className={styles.container}>
      {analyzedTracks.map(({ track, highLevel, lowLevel }) => (
        <div key={track.id} className={styles.trackContainer}>
          <h3 className={styles.trackTitle}>{track.name} - {track.artist || track.artists.map(a => a.name).join(', ')}</h3>
          <div className={styles.metricsGrid}>
            {/* Rhythm */}
            <div className={styles.metricBox}>
              <h4>Rhythm</h4>
              <p><b>BPM:</b> {Math.round(lowLevel.rhythm.bpm)}</p>
              <p><b>Danceability:</b> {Math.round(highLevel.highlevel.danceability.all.danceable * 100)}%</p>
            </div>
            {/* Harmony */}
            <div className={styles.metricBox}>
              <h4>Harmony</h4>
              <p><b>Key:</b> {lowLevel.tonal.key_key} {lowLevel.tonal.key_scale}</p>
              <p><b>Valence:</b> {Math.round(highLevel.highlevel.valence.all.positive * 100)}%</p>
            </div>
            {/* Timbre */}
            <div className={styles.metricBox}>
              <h4>Timbre</h4>
              <p><b>Acousticness:</b> {Math.round(highLevel.highlevel.acousticness.all.acoustic * 100)}%</p>
              <p><b>Energy:</b> {Math.round(highLevel.highlevel.energy.all.energetic * 100)}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
