"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';
import AlbumSelector from '../../components/AlbumSelector';
import TrackTable from '../../components/TrackTable';
import ConcertsList from '../../components/ConcertsList';

export default function ArtistConcertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artistName = searchParams.get('name') || '';
  const spotifyId = searchParams.get('spotifyId') || '';
  const ticketmasterId = searchParams.get('ticketmasterId') || '';
  
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableZoomedOut, setTableZoomedOut] = useState(false);
  const tableRef = useRef(null);

  // New state for albums and tracks
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [albumError, setAlbumError] = useState('');
  const [tracksError, setTracksError] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [artistFollowers, setArtistFollowers] = useState(null);
  const [isFollowing, setIsFollowing] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Album group filter state
  const [albumGroup, setAlbumGroup] = useState('album');
  const albumGroups = [
    { label: 'Albums', value: 'album' },
    { label: 'Singles', value: 'single' },
    { label: 'Compilations', value: 'compilation' },
    { label: 'Appears On', value: 'appears_on' },
  ];

  // Helper to format date as '20 April 2025'
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${monthNames[monthIndex]} ${year}`;
  }

  // Fetch albums when artist or group changes
  useEffect(() => {
    if (!selectedArtist?.id) return;
    setLoadingAlbums(true);
    setAlbumError('');
    setAlbums([]);
    setSelectedAlbumId(null);
    fetch(`http://127.0.0.1:8000/artist-albums/${selectedArtist.id}?group=${albumGroup}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch albums');
        return res.json();
      })
      .then(data => {
        setAlbums(data.albums || []);
        if (data.albums && data.albums.length > 0) {
          setSelectedAlbumId(data.albums[0].id);
        }
      })
      .catch(err => {
        setAlbumError(err.message || 'Failed to fetch albums');
      })
      .finally(() => setLoadingAlbums(false));
  }, [selectedArtist, albumGroup]);

  // Fetch tracks for selected album
  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumTracks([]);
      return;
    }
    setLoadingTracks(true);
    setTracksError('');
    // Do NOT clear albumTracks here; keep old data visible while loading
    fetch(`http://127.0.0.1:8000/album-tracks/${selectedAlbumId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch album tracks');
        return res.json();
      })
      .then(data => {
        setAlbumTracks(data.tracks || []);
      })
      .catch(err => {
        setTracksError(err.message || 'Failed to fetch album tracks');
      })
      .finally(() => setLoadingTracks(false));
  }, [selectedAlbumId]);

  // Initialize artist from URL params
  useEffect(() => {
    if (artistName && spotifyId) {
      setSelectedArtist({
        id: spotifyId,
        name: artistName,
      });
    }
  }, [artistName, spotifyId]);

  // Fetch artist image and followers from Spotify
  useEffect(() => {
    if (!spotifyId) return;
    fetch(`http://127.0.0.1:8000/spotify/artist-details/${spotifyId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          setArtistImage(data.images[0].url);
        }
        if (data && data.followers && data.followers.total) {
          setArtistFollowers(data.followers.total);
        }
      });
  }, [spotifyId]);

  // Fetch follow status when artist is loaded
  useEffect(() => {
    if (!spotifyId) return;
    setIsFollowing(null);
    fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`)
      .then(res => res.ok ? res.json() : { isFollowing: false })
      .then(data => setIsFollowing(data.isFollowing))
      .catch(() => setIsFollowing(false));
  }, [spotifyId]);

  // Fetch concerts (existing logic, but after albums)
  useEffect(() => {
    if (!ticketmasterId) return;
    setLoading(true);
    setError('');
    setConcerts([]);
    fetch(`http://127.0.0.1:8000/concerts/events?artistId=${ticketmasterId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to get events');
        return res.json();
      })
      .then(data2 => {
        let events = data2._embedded?.events || [];
        events = events.slice().sort((a, b) => {
          const dateA = a.dates?.start?.localDate || '';
          const dateB = b.dates?.start?.localDate || '';
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          const timeA = a.dates?.start?.localTime || '';
          const timeB = b.dates?.start?.localTime || '';
          if (!timeA && !timeB) return 0;
          if (!timeA) return 1;
          if (!timeB) return -1;
          return timeA.localeCompare(timeB);
        });
        setConcerts(events);
      })
      .catch(err => {
        setError(err.message || 'Concert search failed');
      })
      .finally(() => setLoading(false));
  }, [ticketmasterId]);

  return (
    <main style={{ padding: 0, margin: 0 }}>
      {/* Artist Info and Albums */}
      {selectedArtist && (
        <>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              minHeight: '60vh',
              width: '100vw',
              borderRadius: '0 0 32px 32px',
              boxShadow: '0 4px 32px #0002',
              padding: '64px 64px 56px 64px',
              overflow: 'hidden',
              zIndex: 10,
              marginTop: '-32px',
              background: 'none', // Remove previous background
            }}
          >
            {/* Blurred, stretched background image */}
            {artistImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url('${artistImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(28px) brightness(0.7)',
                  zIndex: 1,
                }}
              />
            )}
            {/* Dark overlay for contrast */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(16,17,20,0.7)',
                zIndex: 2,
              }}
            />
            {/* Main content */}
            <button
              onClick={() => router.push('/')}
              className={styles.vibeButton}
              style={{
                position: 'absolute',
                top: 24,
                left: 32,
                zIndex: 4,
                marginBottom: 0,
                background: 'transparent',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 24,
                padding: '10px 28px',
                fontSize: '1.08rem',
                border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
            >
              <span style={{ fontSize: '1.3em', marginRight: 6 }}>←</span> Profile
            </button>
            {artistImage && (
              <img src={artistImage} alt={selectedArtist.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 24px #0004', border: '4px solid #fff', zIndex: 4 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, zIndex: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{selectedArtist.name}</span>
              </div>
              {artistFollowers !== null && (
                <span style={{ color: '#b3b3b3', fontSize: '1.15rem', fontWeight: 500, marginTop: 2 }}>
                  {artistFollowers.toLocaleString()} Followers
                </span>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  style={{
                    background: isFollowing ? '#232323' : '#1db954',
                    color: isFollowing ? '#1db954' : '#181818',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 24,
                    padding: '10px 28px',
                    fontSize: '1.08rem',
                    cursor: followLoading || isFollowing === null ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: followLoading || isFollowing === null ? 0.7 : 1,
                    pointerEvents: followLoading || isFollowing === null ? 'none' : 'auto',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  disabled={followLoading || isFollowing === null}
                  onClick={async () => {
                    if (isFollowing === null) return;
                    setFollowLoading(true);
                    try {
                      if (isFollowing) {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'DELETE' });
                      } else {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'PUT' });
                      }
                      // Always re-fetch the follow status after the action
                      const res = await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`);
                      const data = await res.json();
                      setIsFollowing(data.isFollowing);
                    } catch (e) {}
                    setFollowLoading(false);
                  }}
                >
                  {isFollowing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#1db954"/><path d="M6 10.5L9 13.5L14 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Followed
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
                <button
                  style={{ background: '#232323', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 24, padding: '10px 28px', fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px #0001' }}
                  onClick={() => {
                    if (spotifyId) {
                      window.open(`https://open.spotify.com/artist/${spotifyId}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >Play</button>
              </div>
            </div>
          </div>
          
          {/* Album Selector */}
          <div style={{ marginBottom: 64, marginTop: 48 }}>
            <div style={{ display: 'flex', gap: 12, marginLeft: 50, marginBottom: 18 }}>
              {albumGroups.map(group => (
                <button
                  key={group.value}
                  onClick={() => setAlbumGroup(group.value)}
                  style={{
                    background: albumGroup === group.value ? '#1db954' : '#232323',
                    color: albumGroup === group.value ? '#181818' : '#fff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 18,
                    padding: '8px 18px',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                    boxShadow: albumGroup === group.value ? '0 2px 8px #1db95433' : 'none',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <AlbumSelector
              albums={albums}
              selectedAlbumId={selectedAlbumId}
              onAlbumSelect={album => setSelectedAlbumId(album.id)}
            />
            {loadingAlbums && <div>Loading albums...</div>}
            {albumError && <div style={{ color: 'red' }}>{albumError}</div>}
          </div>

          {/* Track Table for selected album */}
          {selectedAlbumId && albumTracks.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <TrackTable
                tracks={albumTracks}
                title={albums.find(a => a.id === selectedAlbumId)?.name || 'Album Tracks'}
                playlistKey={selectedAlbumId}
                loading={loadingTracks}
                error={tracksError}
                showCreatePlaylist={false}
                showViewPlaylist={false}
              />
            </div>
          )}

          {/* Concerts Section */}
          {loading && <div>Loading concerts...</div>}
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {!loading && !error && (
            <ConcertsList concerts={concerts} />
          )}
        </>
      )}
    </main>
  );
} 