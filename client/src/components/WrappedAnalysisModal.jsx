import React, { useEffect, useState } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';
import { lookupTrackMBID, getTrackISRC, setTrackISRC, setTrackMBID, getTrackMBID } from '../utils/trackAnalysisCache';
import styles from './WrappedAnalysisModal.module.css'; // Import the CSS module
import WrappedResultsModal from './WrappedResultsModal';

export default function WrappedAnalysisModal({ open, onClose, tracks }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!open || !tracks || tracks.length === 0) return;

    const analyzeTracks = async () => {
      setLoading(true);
      setResults(null);
      setShowResults(false);
      setProgress({ done: 0, total: tracks.length });

      let initialStatuses = tracks.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: 'Queued',
      }));
      setStatuses(initialStatuses);

      // Step 1: MBID lookup
      const tracksWithMbids = await Promise.all(
        tracks.map(async (track, index) => {
          const newStatuses = [...initialStatuses];
          newStatuses[index].status = 'Checking cache...';
          setStatuses(newStatuses);

          let mbid = getTrackMBID(track.id);
          let mbidWasCached = !!mbid && mbid !== 'Not Found';
          if (!mbidWasCached) {
            mbid = await lookupTrackMBID(track.id);
            if (mbid) {
              let isrc = getTrackISRC(track.id);
              if (!isrc || isrc === 'Not found') {
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

      // Step 2: Fetch high-level and low-level data for tracks with MBID
      const tracksToFetch = tracksWithMbids.filter(t => t.mbid);
      let finalStatuses = tracksWithMbids.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: track.mbid ? 'Fetching Analysis...' : 'Skipped (no MBID)',
      }));
      setStatuses(finalStatuses);

      let done = 0;
      const total = tracks.length;
      setProgress({ done, total });

      const fetchAllAnalysis = async () => {
        const analysisResults = await Promise.all(
          tracksWithMbids.map(async (track, idx) => {
            if (!track.mbid) return { track, highLevel: null, lowLevel: null };
            let highLevel = null;
            let lowLevel = null;
            let error = null;
            try {
              const highRes = await fetch(`https://acousticbrainz.org/${track.mbid}/high-level`);
              if (highRes.ok) {
                highLevel = await highRes.json();
              }
              const lowRes = await fetch(`http://127.0.0.1:8000/${track.mbid}/low-level`);
              if (lowRes.ok) {
                lowLevel = await lowRes.json();
              }
            } catch (e) {
              error = e.message || 'Error fetching analysis';
            }
            done++;
            const newStatuses = [...finalStatuses];
            if (!track.mbid) {
              newStatuses[idx].status = 'Skipped (no MBID)';
            } else if (!highLevel || !lowLevel) {
              newStatuses[idx].status = 'Skipped (no analysis data)';
            } else {
              newStatuses[idx].status = 'Done';
            }
            setStatuses(newStatuses);
            setProgress({ done, total });
            return { track, highLevel, lowLevel, error };
          })
        );
        setResults(analysisResults);
        setLoading(false);
      };
      await fetchAllAnalysis();
    };

    analyzeTracks();
  }, [open, tracks]);

  if (!open) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Done': return styles.statusDone;
      case 'Skipped (no MBID)':
      case 'Skipped (no analysis data)':
        return styles.statusError ? styles.statusError : styles.statusSkipped;
      case 'Fetching Analysis...': return styles.statusFetching;
      default: return styles.statusDefault;
    }
  };

  // Calculate number of successfully analyzed tracks
  const numDone = statuses.filter(s => s.status === 'Done').length;
  const totalTracks = statuses.length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Your Songs Wrapped</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          {!showResults && (
            <>
              {!loading && (
                <button
                  style={{ marginBottom: 24, background: '#38bdf8', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', boxShadow: '0 4px 24px #000a', transition: 'background 0.18s' }}
                  onClick={() => setShowResults(true)}
                >
                  View Wrapped Results
                </button>
              )}
              {loading ? (
                <div className={styles.progressText}>
                  Fetching metrics... {progress.done} / {progress.total}
                </div>
              ) : (
                <div className={styles.progressText}>
                  {numDone} songs have analysed successfully
                </div>
              )}
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: loading ? `${progress.total ? (progress.done / progress.total) * 100 : 0}%` : '100%' }} />
              </div>
              <table className={styles.statusTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>#</th>
                    <th className={styles.tableHeader}>Cover</th>
                    <th className={styles.tableHeader}>Song</th>
                    <th className={styles.tableHeader}>Artist</th>
                    <th className={styles.tableHeader}>Album</th>
                    <th className={styles.tableHeader}>Year</th>
                    <th className={styles.tableHeader}>Duration</th>
                    <th className={`${styles.tableHeader} ${styles.statusCell}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.map((s, i) => {
                    // Try to find the original track object for extra info
                    const track = tracks[i] || {};
                    // Album name
                    let album = track.album?.name || track.album || '--';
                    // Year
                    let year = track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '');
                    if (!year) year = '--';
                    // Duration (ms to mm:ss)
                    let duration = track.duration_ms || track.duration || null;
                    if (duration) {
                      const mins = Math.floor(duration / 60000);
                      const secs = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
                      duration = `${mins}:${secs}`;
                    } else {
                      duration = '--';
                    }
                    // Image
                    let img = track.album_image || track.album?.images?.[0]?.url || track.images?.[0]?.url || track.cover || null;
                    let statusCell;
                    if (s.status === 'Skipped (no MBID)') {
                      statusCell = (
                        <span className={styles.statusError}>
                          Skipped
                          <span style={{ display: 'block', fontSize: 13, marginTop: 2 }} className={styles.statusError}>
                            (no MBID)
                          </span>
                        </span>
                      );
                    } else if (s.status === 'Skipped (no analysis data)') {
                      statusCell = (
                        <span className={styles.statusError}>
                          Skipped
                          <span style={{ display: 'block', fontSize: 13, marginTop: 2 }} className={styles.statusError}>
                            (no analysis data found)
                          </span>
                        </span>
                      );
                    } else {
                      statusCell = <span className={getStatusClass(s.status)}>{s.status}</span>;
                    }
                    return (
                      <tr key={i} className={i === statuses.length - 1 ? '' : styles.tableRow}>
                        <td className={styles.tableCell}>{i + 1}</td>
                        <td className={styles.tableCell}>
                          {img ? <img src={img} alt="cover" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', boxShadow: '0 2px 8px #0004' }} /> : '--'}
                        </td>
                        <td className={styles.tableCell}>{s.name}</td>
                        <td className={`${styles.tableCell} ${styles.artistCell}`}>{s.artist}</td>
                        <td className={styles.tableCell}>{album}</td>
                        <td className={styles.tableCell}>{year}</td>
                        <td className={styles.tableCell}>{duration}</td>
                        <td className={`${styles.tableCell} ${styles.statusCell}`}>{statusCell}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {showResults && results && !loading && (
            <WrappedResultsModal
              open={showResults}
              onClose={onClose}
              results={results}
              tracks={tracks}
            />
          )}
        </div>
      </div>
    </div>
  );
}