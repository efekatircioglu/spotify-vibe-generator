import React, { useState, useEffect, useRef } from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';
import WrappedAnalysisModal from './WrappedAnalysisModal';
import DropdownPortal from './DropdownPortal';
import ContributorFinder from './ContributorFinder';
import { lookupTrackMBID } from '../utils/trackAnalysisCache';
import NewSongAnalysisModal from './NewSongAnalysisModal';

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, onExploreContributions, loading, error, showCreatePlaylist = true, showViewPlaylist = true }) {
  const [showWrapped, setShowWrapped] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(null); // row index for open dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  const [contributorModalOpen, setContributorModalOpen] = useState(false);
  const [selectedTrackMBID, setSelectedTrackMBID] = useState(null);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [showNewSongAnalysisModal, setShowNewSongAnalysisModal] = useState(false);
  const [selectedTrackForNewAnalysis, setSelectedTrackForNewAnalysis] = useState(null);

  // When tracks change, increment tableKey to trigger animation
  useEffect(() => {
    setTableKey(k => k + 1);
  }, [tracks]);

  // Close dropdown on outside click
  useEffect(() => {
    if (dropdownOpen === null) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          (!buttonRefs.current[dropdownOpen] || !buttonRefs.current[dropdownOpen].contains(e.target))) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Handle contributions button click
  const handleContributionsClick = async (track) => {
    setSelectedTrackInfo(track);
    setContributorModalOpen(true);
    // Always use track.id for MBID lookup
    const mbid = await lookupTrackMBID(track.id);
    setSelectedTrackMBID(mbid);
  };

  const handleThirdGenreClick = (track) => {
    setSelectedTrackForNewAnalysis(track);
    setShowNewSongAnalysisModal(true);
  };

  // Estimate row height for minHeight reservation
  const rowHeight = 72; // px, adjust as needed
  const minHeight = tracks && tracks.length > 0 ? tracks.length * rowHeight + 120 : 0; // +120 for header/buttons

  return (
    <div className={styles.songsTableWrapper} style={{ position: 'relative', minHeight }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(24,24,24,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          borderRadius: 12,
        }}>
          <div style={{
            width: 48, height: 48, border: '6px solid #1db954', borderTop: '6px solid #232323', borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 72, padding: '0 24px 0 12px', marginBottom: 8 }}>
        <div className={styles.songsTableTitle} style={{ margin: 0 }}>{title}</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {tracks && tracks.length > 0 ? (
            <PlaylistActions
              tracks={tracks}
              playlistKey={playlistKey}
              playlistNameLabel={title}
              onWrapped={() => setShowWrapped(true)}
              showCreatePlaylist={showCreatePlaylist}
              showViewPlaylist={showViewPlaylist}
            />
          ) : (
            <div style={{ minWidth: 220, minHeight: 48 }} />
          )}
        </div>
      </div>
      <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && tracks && tracks.length > 0 && (
        <table className={styles.songsTable} key={tableKey}>
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
              <tr
                key={track.id ? `${track.id}-${idx}` : idx}
                className={styles.animatedRow}
                style={{
                  animationDelay: `${idx * 60}ms`,
                  animationName: 'fadeInUp',
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                  opacity: 0,
                  animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <td>{idx + 1}</td>
                <td>{track.album_image || track.album?.images?.[0]?.url ? <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 64, height: 64, borderRadius: 8 }} /> : ''}</td>
                <td>{track.name}</td>
                <td>{track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')}</td>
                <td>{track.album?.name || track.album}</td>
                <td>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                <td>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                <td className={styles.analyzeCol}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      ref={el => { if (el) buttonRefs.current[idx] = el; }}
                      style={{
                        background: '#2b2b2b',
                        color: '#fff',
                        borderRadius: 10,
                        fontWeight: 700,
                        padding: '8px 22px',
                        fontSize: '1rem',
                        margin: '0 4px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        border: 'none',
                        outline: 'none',
                        display: 'inline-block',
                        transition: 'background 0.18s, color 0.18s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#404040';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#2b2b2b';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onClick={e => {
                        if (dropdownOpen === idx) {
                          setDropdownOpen(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX,
                          });
                          setDropdownOpen(idx);
                        }
                      }}
                    >
                      Breakdown By
                    </button>
                    {dropdownOpen === idx && (
                      <DropdownPortal>
                        <div
                         ref={dropdownRef}
                          style={{
                            position: 'absolute',
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            background: '#232323',
                            borderRadius: 10,
                            boxShadow: '0 2px 16px #0003',
                            zIndex: 99999,
                            minWidth: 140,
                            padding: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <button
                            style={{
                              background: 'none',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: '0.92rem',
                              padding: '4px 10px',
                              lineHeight: 1.1,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background 0.18s, color 0.18s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#404040';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onClick={() => { setDropdownOpen(null); handleThirdGenreClick(track); }}
                          >
                            Genre
                          </button>
                          <button
                            style={{
                              background: 'none',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: '0.92rem',
                              padding: '4px 10px',
                              lineHeight: 1.1,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background 0.18s, color 0.18s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#404040';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onClick={() => { setDropdownOpen(null); handleContributionsClick(track); }}
                          >
                            Contributions
                          </button>
                        </div>
                      </DropdownPortal>
                    )}
                  </div>
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
      
      {/* Contributor Modal */}
      {contributorModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
        }} onClick={() => setContributorModalOpen(false)}>
          <div style={{
            background: '#232323',
            borderRadius: 18,
            padding: '40px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            color: '#fff',
            border: '2px solid #1db954',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Contributors for {selectedTrackInfo?.name}
              </h2>
              <button
                onClick={() => setContributorModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: -40,
                  marginRight: -60,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#1db954'}
                onMouseLeave={e => e.currentTarget.style.color = '#fff'}
              >
                ×
              </button>
            </div>
            {selectedTrackMBID ? (
              <ContributorFinder mbid={selectedTrackMBID} />
            ) : (
              <p style={{ textAlign: 'center', color: '#f87171' }}>
                Contributor information is not available for this track.
              </p>
            )}
          </div>
        </div>
      )}
      
      {showNewSongAnalysisModal && selectedTrackForNewAnalysis && (
        <NewSongAnalysisModal
          open={showNewSongAnalysisModal}
          onClose={() => setShowNewSongAnalysisModal(false)}
          songInfo={selectedTrackForNewAnalysis}
        />
      )}
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .${styles.animatedRow} {
          opacity: 0;
        }
        .${styles.animatedRow}[style*='animation-name'] {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
