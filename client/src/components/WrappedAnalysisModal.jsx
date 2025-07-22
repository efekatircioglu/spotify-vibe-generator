import React, { useEffect, useState } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';
import { lookupTrackMBID, getTrackISRC, setTrackISRC, setTrackMBID, getTrackMBID } from '../utils/trackAnalysisCache';
import styles from './WrappedAnalysisModal.module.css'; // Import the CSS module

export default function WrappedAnalysisModal({ open, onClose, tracks }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (!open || !tracks || tracks.length === 0) return;

    const analyzeTracks = async () => {
      console.log("[WrappedAnalysisModal] Starting analysis for", tracks.length, "tracks.");
      setLoading(true);
      setResults(null);
      setProgress({ done: 0, total: tracks.length });

      let initialStatuses = tracks.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: 'Queued'
      }));
      setStatuses(initialStatuses);

      const tracksWithMbids = await Promise.all(
        tracks.map(async (track, index) => {
          const newStatuses = [...initialStatuses];
          newStatuses[index].status = 'Checking cache...';
          setStatuses(newStatuses);

          // Check if MBID is already cached
          let mbid = getTrackMBID(track.id);
          let mbidWasCached = !!mbid && mbid !== 'Not Found';
          if (!mbidWasCached) {
            mbid = await lookupTrackMBID(track.id);
            // If we found MBID (not from cache), ensure ISRC and MBID are stored
            if (mbid) {
              let isrc = getTrackISRC(track.id);
              if (!isrc || isrc === 'Not found') {
                // Try to fetch ISRC if not present
                try {
                  const isrcRes = await fetch(`http://127.0.0.1:8000/track-isrc/${track.id}`);
                  if (isrcRes.ok) {
                    const isrcData = await isrcRes.json();
                    isrc = isrcData.isrc || 'Not found';
                    setTrackISRC(track.id, isrc);
                  }
                } catch {}
              }
              setTrackMBID(track.id, mbid);
            }
          }

          if (mbid) {
            newStatuses[index].status = 'MBID Found';
            setStatuses([...newStatuses]);
            return { ...track, mbid };
          } else {
            newStatuses[index].status = 'Skipped (no MBID)';
            setStatuses([...newStatuses]);
            return { ...track, mbid: null };
          }
        })
      );

      const tracksToFetch = tracksWithMbids.filter(t => t.mbid);
      console.log(`[WrappedAnalysisModal] Found MBIDs for ${tracksToFetch.length}/${tracks.length} tracks.`);

      let finalStatuses = tracksWithMbids.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: track.mbid ? 'Fetching Metrics...' : 'Skipped (no MBID)'
      }));
      setStatuses(finalStatuses);

      if (tracksToFetch.length > 0) {
        fetchTrackMetrics(tracksToFetch, ({ done, total }) => {
          setProgress({ done, total });
          let completedCount = 0;
          const newStatuses = [...finalStatuses];
          for (let i = 0; i < newStatuses.length; i++) {
            if (newStatuses[i].status === 'Fetching Metrics...') {
              if (completedCount < done) {
                newStatuses[i].status = 'Done';
                completedCount++;
              }
            }
          }
          setStatuses(newStatuses);
        })
        .then(res => {
          console.log("[WrappedAnalysisModal] Analysis results:", res);
          setResults(res);
        })
        .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };

    analyzeTracks();
  }, [open, tracks]);

  if (!open) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Done': return styles.statusDone;
      case 'Skipped (no MBID)': return styles.statusSkipped;
      case 'Fetching Metrics...': return styles.statusFetching;
      default: return styles.statusDefault;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Analysis Dashboard</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <>
              <div className={styles.progressText}>Fetching metrics... {progress.done} / {progress.total}</div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
              <table className={styles.statusTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Song</th>
                    <th className={styles.tableHeader}>Artist</th>
                    <th className={`${styles.tableHeader} ${styles.statusCell}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.map((s, i) => (
                    <tr key={i} className={i === statuses.length - 1 ? '' : styles.tableRow}>
                      <td className={styles.tableCell}>{s.name}</td>
                      <td className={`${styles.tableCell} ${styles.artistCell}`}>{s.artist}</td>
                      <td className={`${styles.tableCell} ${styles.statusCell} ${getStatusClass(s.status)}`}>{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {results && !loading && (
            <div>
              {(() => {
                const analyzedTracks = results.filter(r => r.highLevel && r.lowLevel);
                if (analyzedTracks.length === 0) {
                  return <p>No analysis data could be found for these tracks.</p>;
                }

                const avgMetrics = { danceability: 0, energy: 0, valence: 0, acousticness: 0 };
                const genreCounts = {};

                analyzedTracks.forEach(r => {
                  if (r.highLevel && r.highLevel.highlevel) {
                    avgMetrics.danceability += r.highLevel.highlevel.danceability?.all?.danceable || 0;
                    avgMetrics.energy += r.highLevel.highlevel.energy?.all?.energetic || 0;
                    avgMetrics.valence += r.highLevel.highlevel.valence?.all?.positive || 0;
                    avgMetrics.acousticness += r.highLevel.highlevel.acousticness?.all?.acoustic || 0;

                    if (r.highLevel.highlevel.genre_dortmund && r.highLevel.highlevel.genre_dortmund.all) {
                      const genres = r.highLevel.highlevel.genre_dortmund.all;
                      for (const genre in genres) {
                        genreCounts[genre] = (genreCounts[genre] || 0) + genres[genre];
                      }
                    }
                  }
                });

                for (const key in avgMetrics) {
                  avgMetrics[key] /= analyzedTracks.length;
                }

                const topGenres = Object.entries(genreCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);

                return (
                  <div className={styles.resultsGrid}>
                    <div className={styles.card}>
                      <h3 className={styles.sectionTitle}>Overall Vibe</h3>
                      <div>
                        {Object.entries(avgMetrics).map(([key, value]) => (
                          <div key={key} className={styles.metricItem}>
                            <div className={styles.metricLabel}>{key}</div>
                            <div className={styles.metricBar}>
                              <div className={styles.metricBarFill} style={{ width: `${value * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.card}>
                      <h3 className={styles.sectionTitle}>Top Genres</h3>
                      <ul className={styles.genreList}>
                        {topGenres.map(([genre, count]) => (
                          <li key={genre} className={styles.genreListItem}>
                            <span className={styles.genreName}>{genre}</span>
                            <span className={styles.genreCount}>{count.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`${styles.card} ${styles.trackListContainer}`}>
                      <h3 className={styles.sectionTitle}>Analyzed Tracks ({analyzedTracks.length}/{results.length})</h3>
                      <ul className={styles.trackList}>
                        {analyzedTracks.map(({ track }) => (
                          <li key={track.id} className={styles.trackListItem}>
                            {track.name} - <span className={styles.artistName}>{track.artist || track.artists.map(a => a.name).join(', ')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}