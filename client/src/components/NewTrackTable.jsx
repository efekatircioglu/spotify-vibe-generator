import React, { useState, useEffect, useRef } from 'react';
import PlaylistActions from './PlaylistActions';
import styles from '../app/page.module.css';
import WrappedAnalysisModal from './WrappedAnalysisModal';
import DropdownPortal from './DropdownPortal';
import ContributorFinder from './ContributorFinder';
import { lookupTrackMBID } from '../utils/trackAnalysisCache';
import NewSongAnalysisModal from './NewSongAnalysisModal';

export default function TrackTable({ tracks, title, playlistKey, onExploreGenre, onExploreContributions, loading, error, showCreatePlaylist = true, showViewPlaylist = true, genres = [] }) {
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
    <div style={{
      background: '#181818',
      borderRadius: 18,
      padding: '3vw 2vw 2vw 2vw',
      margin: '3vw auto',
      maxWidth: '98vw',
      boxShadow: '0 4px 32px #0003',
      position: 'relative',
      minHeight,
      fontSize: 'clamp(0.85rem, 1.1vw, 1.08rem)', // base font size for all text
    }}>
      {/* Header: Title, Genres, and Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: genres && genres.length > 0 ? 10 : 0,
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
            fontWeight: 900,
            color: '#f3f3f3',
            letterSpacing: 1,
            textShadow: '0 2px 8px #0008',
          }}>{title || 'Your Last 50 Songs'}</span>
          <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 16px)', flexWrap: 'wrap' }}>
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
        {/* Genres/Tags row */}
        {genres && genres.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(6px, 1vw, 12px)',
            marginTop: 6,
            marginBottom: 2,
            width: '100%',
          }}>
            {genres.map((genre, i) => (
              <span key={i} style={{
                display: 'inline-block',
                background: '#232323',
                color: '#1db954',
                borderRadius: 999,
                padding: 'clamp(2px, 0.5vw, 6px) clamp(10px, 2vw, 18px)',
                fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
                fontWeight: 700,
                letterSpacing: 0.2,
                boxShadow: '0 1px 4px #0003',
                border: '1.5px solid #1db954',
                marginBottom: 2,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>{genre}</span>
            ))}
          </div>
        )}
      </div>
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
      <WrappedAnalysisModal open={showWrapped} onClose={() => setShowWrapped(false)} tracks={tracks} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* Table Section */}
      <div style={{ width: '100%', overflowX: 'auto', marginTop: 8 }}>
        {!loading && !error && tracks && tracks.length > 0 && (
          <table style={{
            width: '98%',
            maxWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'transparent',
            color: '#f3f3f3',
            fontSize: 'clamp(0.85rem, 1.08vw, 1.04rem)',
            minWidth: 700,
            boxShadow: 'none',
            margin: '0 auto',
          }} key={tableKey}>
            <thead>
              <tr style={{ background: 'none', color: '#b3b3b3', fontWeight: 700, fontSize: 'clamp(0.93rem, 1.08vw, 1.04rem)' }}>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>#</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Cover</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Artist</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Album</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Year</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Analyze</th>
                <th style={{ padding: '18px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)', textAlign: 'left', fontWeight: 700 }}>Play</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => (
                <tr
                  key={track.id ? `${track.id}-${idx}` : idx}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                    borderRadius: 12,
                    transition: 'background 0.18s',
                    fontSize: '1.13em',
                  }}
                >
                  <td style={{ padding: '16px 0 16px 12px', fontWeight: 700, fontSize: '1.08em', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>
                    {track.album_image || track.album?.images?.[0]?.url ? (
                      <img src={track.album_image || track.album?.images?.[0]?.url} alt={track.album?.name || track.album} style={{ width: 'clamp(32px, 7vw, 56px)', height: 'clamp(32px, 7vw, 56px)', borderRadius: 10, objectFit: 'cover', background: '#232323', marginRight: 'clamp(8px, 2vw, 18px)' }} />
                    ) : (
                      <div style={{
                        width: 'clamp(32px, 7vw, 56px)',
                        height: 'clamp(32px, 7vw, 56px)',
                        borderRadius: '50%',
                        background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][idx % 8],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 'clamp(1.1rem, 2vw, 1.75rem)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px #0004',
                        marginRight: 'clamp(8px, 2vw, 18px)',
                      }}>{track.name ? track.name[0] : '?'}</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 0', fontWeight: 700, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.name}</td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '')}</td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.album?.name || track.album}</td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')}</td>
                  <td style={{ padding: '16px 0', color: '#b3b3b3', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                  <td style={{ padding: '16px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>{/* Analyze button remains as is for now */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        ref={el => { if (el) buttonRefs.current[idx] = el; }}
                        style={{
                          background: '#232323',
                          color: '#fff',
                          borderRadius: 10,
                          fontWeight: 700,
                          padding: '12px 28px',
                          fontSize: '1.08rem',
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
                          e.currentTarget.style.background = '#232323';
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
                        Breakdown
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
                  <td style={{ padding: '16px 0', paddingLeft: 'clamp(6px, 1vw, 18px)', paddingRight: 'clamp(6px, 1vw, 18px)' }}>
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
