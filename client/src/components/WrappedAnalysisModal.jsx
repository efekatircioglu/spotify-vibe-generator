import React, { useEffect, useState } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';
import { lookupTrackMBID, getTrackISRC, setTrackISRC, setTrackMBID, getTrackMBID } from '../utils/trackAnalysisCache';
import styles from './WrappedAnalysisModal.module.css'; // Import the CSS module
import WrappedResultsModal from './WrappedResultsModal';

// Mobile detection hook
const useIsMobile = (breakpoint = 760) => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
};

export default function WrappedAnalysisModal({ open, onClose, tracks }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const isMobile = useIsMobile(760);

  useEffect(() => {
    if (!open || !tracks || tracks.length === 0) return;

    const analyzeTracks = async () => {
      setLoading(true);
      setResults(null);
      setShowResults(false);
      
      // Filter out duplicate tracks based on Spotify track ID
      const uniqueTracks = [];
      const seenTrackIds = new Set();
      
      tracks.forEach(track => {
        if (track.id && !seenTrackIds.has(track.id)) {
          seenTrackIds.add(track.id);
          uniqueTracks.push(track);
        } else if (!track.id) {
          // If no Spotify ID, use name+artist as fallback for uniqueness
          const trackKey = `${track.name}-${track.artist || (track.artists ? track.artists.map(a => a.name).join(", ") : '')}`;
          if (!seenTrackIds.has(trackKey)) {
            seenTrackIds.add(trackKey);
            uniqueTracks.push(track);
          }
        }
      });
      
      console.log(`Original tracks: ${tracks.length}, Unique tracks: ${uniqueTracks.length}`);
      if (tracks.length > uniqueTracks.length) {
        console.log(`Skipped ${tracks.length - uniqueTracks.length} duplicate tracks`);
      }
      
      setProgress({ done: 0, total: uniqueTracks.length });

      let initialStatuses = uniqueTracks.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: 'Queued',
      }));
      setStatuses(initialStatuses);

      // Step 1: MBID lookup
      const tracksWithMbids = await Promise.all(
        uniqueTracks.map(async (track, index) => {
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
      const total = uniqueTracks.length;
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

        <div className={styles.modalBody} style={{ 
          overflowY: isMobile ? 'auto' : 'visible',
          maxHeight: isMobile ? '70vh' : 'none',
          padding: isMobile ? '20px' : '24px',
          height: isMobile ? '70vh' : 'auto'
        }}>
          {!showResults && (
            <>
              {!loading && numDone > 0 && (
                <button
                  style={{ 
                    marginBottom: 24, 
                    background: '#38bdf8', 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: isMobile ? 16 : 18, 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: isMobile ? '10px 24px' : '12px 32px', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 24px #000a', 
                    transition: 'background 0.18s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onClick={() => setShowResults(true)}
                >
                  View Wrapped Results
                </button>
              )}
              
              {/* Close button when no songs analyzed successfully */}
              {!loading && numDone === 0 && (
                <button
                  style={{ 
                    marginBottom: 24, 
                    background: '#6b7280', 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: isMobile ? 16 : 18, 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: isMobile ? '10px 24px' : '12px 32px', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 24px #000a', 
                    transition: 'background 0.18s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onClick={onClose}
                >
                  Close
                </button>
              )}
              
              {loading ? (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16 }}>
                  Fetching metrics... {progress.done} / {progress.total}
                </div>
              ) : (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16 }}>
                  {numDone === 0 ? 'No songs analyzed successfully.' : `${numDone} songs have analysed successfully`}
                </div>
              )}
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: loading ? `${progress.total ? (progress.done / progress.total) * 100 : 0}%` : '100%' }} />
              </div>
              
              {/* Status display - mobile vs desktop layout */}
              {isMobile ? (
                // Mobile layout - card-based design similar to NewTrackTable
                <div style={{ marginTop: 24 }}>
                  <div style={{ 
                    fontWeight: 900, 
                    color: '#fff', 
                    marginBottom: 16, 
                    fontSize: '1.1rem', 
                    letterSpacing: 0.5,
                    textAlign: 'center'
                  }}>
                    Analysis Status ({statuses.length} unique tracks)
                    {tracks.length > statuses.length && (
                      <div style={{ fontSize: '0.8em', color: '#9ca3af', marginTop: 4, fontWeight: 400 }}>
                        {tracks.length - statuses.length} duplicates skipped
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    height: isMobile ? '50vh' : 'auto',
                    maxHeight: isMobile ? '50vh' : 'none',
                    overflowY: isMobile ? 'auto' : 'visible',
                    padding: '0 4px',
                    WebkitOverflowScrolling: 'touch',
                    minHeight: isMobile ? '200px' : 'auto'
                  }}>
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
                      
                      // Status styling
                      let statusStyle = {};
                      let statusText = s.status;
                      
                      if (s.status === 'Skipped (no MBID)' || s.status === 'Skipped (no analysis data)') {
                        statusStyle = {
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        };
                        statusText = s.status.includes('no MBID') ? 'Skipped (no MBID)' : 'Skipped (no data)';
                      } else if (s.status === 'Done') {
                        statusStyle = {
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.4)'
                        };
                      } else if (s.status.includes('Fetching') || s.status.includes('Checking')) {
                        statusStyle = {
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.4)'
                        };
                      } else {
                        statusStyle = {
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.4)'
                        };
                      }
                      
                      return (
                        <div key={i} style={{
                          background: i % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                          borderRadius: 14,
                          padding: 14,
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          alignItems: 'center',
                          gap: 12,
                          boxShadow: '0 2px 8px #0002',
                          position: 'relative',
                        }}>
                          {/* 1st Column: Cover Art */}
                          <div>
                            {img ? (
                              <img src={img} alt={album} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#232323' }} />
                            ) : (
                              <div style={{
                                width: 48, height: 48, borderRadius: '50%', 
                                background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][i % 8],
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', 
                                boxShadow: '0 2px 8px #0004',
                              }}>{s.name ? s.name[0] : '?'}</div>
                            )}
                          </div>
                          
                          {/* 2nd Column: Song Info */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 700, color: '#fff', fontSize: 14, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.name}
                            </div>
                            <div style={{ 
                              color: '#d1d5db', fontSize: 13, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.artist}
                            </div>
                            <div style={{
                              color: '#b3b3b3',
                              fontSize: 12,
                              maxWidth: 120,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {album}
                            </div>
                            <div style={{ color: '#b3b3b3', fontSize: 11 }}>
                              {year} • {duration}
                            </div>
                          </div>
                          
                          {/* 3rd Column: Status and Track Number */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 4
                          }}>
                            <div style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              textAlign: 'center',
                              minWidth: 70,
                              ...statusStyle
                            }}>
                              {statusText}
                            </div>
                            <div style={{
                              fontSize: 10,
                              color: '#b3b3b3',
                              fontWeight: 600
                            }}>
                              #{i + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Desktop layout - original table design
                <div style={{ 
                  marginTop: 24,
                  maxHeight: '60vh', // Limit height to prevent overflow
                  overflowY: 'auto', // Enable vertical scrolling
                  overflowX: 'auto', // Enable horizontal scrolling if needed
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '8px 0'
                }}>
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
                              {img ? <img src={img} alt="cover" style={{ 
                                width: isMobile ? 36 : 48, 
                                height: isMobile ? 36 : 48, 
                                borderRadius: 6, 
                                objectFit: 'cover', 
                                boxShadow: '0 2px 8px #0004' 
                              }} /> : '--'}
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
                </div>
              )}
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