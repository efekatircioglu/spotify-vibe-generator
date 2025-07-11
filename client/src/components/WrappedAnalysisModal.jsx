import React, { useEffect, useState } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';

export default function WrappedAnalysisModal({ open, onClose, tracks }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (!open || !tracks || tracks.length === 0) return;
    console.log("[WrappedAnalysisModal] tracks prop:", tracks);
    setLoading(true);
    setResults(null);
    // Prepare status for each track
    const initialStatuses = tracks.map(track => {
      const hasMBID = !!(track.mbid || track.MBID);
      return {
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: hasMBID ? 'Fetching...' : 'Skipped (no MBID)'
      };
    });
    console.log("[WrappedAnalysisModal] initialStatuses:", initialStatuses);
    setStatuses(initialStatuses);
    // Only fetch for tracks with MBID
    fetchTrackMetrics(tracks, ({ done, total }) => {
      setProgress({ done, total });
      setStatuses(prev => {
        // Mark the next 'Fetching...' as 'Done' as each finishes
        let count = 0;
        return prev.map((s, i) => {
          const hasMBID = s.status !== 'Skipped (no MBID)';
          if (hasMBID) {
            count++;
            if (count === done) {
              return { ...s, status: 'Done' };
            }
          }
          return s;
        });
      });
    })
      .then(res => setResults(res))
      .finally(() => setLoading(false));
  }, [open, tracks]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(20,20,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxHeight: 650, overflowY: 'auto', padding: '56px 48px 40px 48px', background: '#18181b', borderRadius: 24, minWidth: 420, minWidth: 520, minHeight: 320, boxShadow: '0 8px 48px #000b', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2 }}>×</button>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 34, margin: 0, letterSpacing: 1 }}>Wrapped Analysis</h2>
        {loading && (
          <>
            <div style={{ margin: '32px 0', color: '#1db954', fontWeight: 700, fontSize: 20 }}>
              Fetching metrics... {progress.done} / {progress.total}
              <div style={{ background: '#333', borderRadius: 8, height: 16, marginTop: 12, width: 320 }}>
                <div style={{ background: 'linear-gradient(90deg, #1db954 60%, #00ffff 100%)', height: '100%', borderRadius: 8, width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
            <table style={{ width: '100%', background: '#232323', borderRadius: 12, marginTop: 18, color: '#fff', fontSize: 15, boxShadow: '0 2px 12px #0004' }}>
              <thead>
                <tr style={{ color: '#1db954', fontWeight: 800 }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Song</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Artist</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: 8 }}>{s.name}</td>
                    <td style={{ padding: 8 }}>{s.artist}</td>
                    <td style={{ padding: 8, textAlign: 'center', color: s.status === 'Skipped (no MBID)' ? '#fbbf24' : s.status === 'Done' ? '#1db954' : '#fff' }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {results && !loading && (
          <div style={{ marginTop: 32, color: '#fff', fontSize: 15, maxWidth: 600, wordBreak: 'break-all' }}>
            {/* Results UI will go here */}
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#232323', borderRadius: 12, padding: 16, maxHeight: 300, overflowY: 'auto' }}>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 