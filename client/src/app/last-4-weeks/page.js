"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Last4WeeksPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistCreationStatus, setPlaylistCreationStatus] = useState('');
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState('');

  useEffect(() => {
    fetch("http://127.0.0.1:8000/last-4-weeks")
      .then(res => res.json())
      .then(setData)
      .catch(() => setError("Failed to fetch data"))
      .finally(() => setLoading(false));
    
    // Load persisted playlist URL from localStorage
    const savedPlaylistUrl = localStorage.getItem('last4weeks_playlist_url');
    if (savedPlaylistUrl) {
      setCreatedPlaylistUrl(savedPlaylistUrl);
    }
  }, []);

  const handleCreatePlaylist = () => {
    setPlaylistName('');
    setCreatedPlaylistUrl('');
    localStorage.removeItem('last4weeks_playlist_url');
    setShowPlaylistModal(true);
  };

  const handleViewPlaylist = () => {
    if (createdPlaylistUrl) {
      window.open(createdPlaylistUrl, '_blank');
    }
  };

  const handleCreatePlaylistSubmit = async () => {
    if (!playlistName.trim()) {
      setPlaylistCreationStatus('Please enter a playlist name.');
      return;
    }

    setIsCreatingPlaylist(true);
    setPlaylistCreationStatus('Creating playlist...');

    try {
      const trackUris = data.tracks.map(track => `spotify:track:${track.id}`);
      
      const response = await fetch('http://127.0.0.1:8000/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          trackUris: trackUris,
          timeRange: 'Last 4 Weeks',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPlaylistCreationStatus(`Playlist created successfully! ${result.trackCount} tracks added.`);
        setTimeout(() => {
          setShowPlaylistModal(false);
          setPlaylistCreationStatus('');
          setPlaylistName('');
          if (result.playlistUrl) {
            setCreatedPlaylistUrl(result.playlistUrl);
            localStorage.setItem('last4weeks_playlist_url', result.playlistUrl);
          }
        }, 2000);
      } else {
        const error = await response.json();
        setPlaylistCreationStatus(`Failed to create playlist: ${error.error}`);
      }
    } catch (error) {
      setPlaylistCreationStatus('Failed to create playlist. Please try again.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/')}
          className={styles.vibeButton}
        >
          Profile
        </button>
        <button
          onClick={() => router.push('/last-6-months')}
          className={styles.vibeButton}
        >
          Last 6 Months
        </button>
        <button
          onClick={() => router.push('/last-12-months')}
          className={styles.vibeButton}
        >
          Last 12 Months
        </button>
      </div>
      <h1 style={{ marginBottom: 24 }}>Your Spotify Stats (Last 4 Weeks)</h1>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && !loading && !error && (
        <>
          <div className={styles.songsTableWrapper}>
            <div className={styles.songsTableTitle}>Top Tracks</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'flex-end' }}>
              <button 
                onClick={createdPlaylistUrl ? handleViewPlaylist : handleCreatePlaylist} 
                className={styles.vibeButton}
                style={{ 
                  fontSize: '14px', 
                  padding: '8px 16px',
                  background: createdPlaylistUrl ? '#8B5CF6' : undefined,
                  borderColor: createdPlaylistUrl ? '#8B5CF6' : undefined
                }}
              >
                {createdPlaylistUrl ? 'View Playlist' : 'Create Playlist'}
              </button>
            </div>
            <table className={styles.songsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cover</th>
                  <th>Name</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Year</th>
                  <th>Duration</th>
                  <th>Play</th>
                </tr>
              </thead>
              <tbody>
                {data.tracks.map((track, idx) => (
                  <tr key={track.id}>
                    <td>{idx + 1}</td>
                    <td>{track.album?.images?.[0]?.url ? <img src={track.album.images[0].url} alt={track.album.name} style={{ width: 48, height: 48, borderRadius: 8 }} /> : ''}</td>
                    <td>{track.name}</td>
                    <td>{track.artists.map(a => a.name).join(", ")}</td>
                    <td>{track.album?.name}</td>
                    <td>{track.album?.release_date ? track.album.release_date.split('-')[0] : ''}</td>
                    <td>{track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}</td>
                    <td>
                      <a href={`https://open.spotify.com/track/${track.id}`} target="_blank" rel="noopener noreferrer">
                        <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.songsTableWrapper}>
            <div className={styles.songsTableTitle}>Top Artists</div>
            <table className={styles.songsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Genres</th>
                  <th>Play</th>
                </tr>
              </thead>
              <tbody>
                {data.artists.map((artist, idx) => (
                  <tr key={artist.id}>
                    <td>{idx + 1}</td>
                    <td>{artist.images?.[0]?.url ? <img src={artist.images[0].url} alt={artist.name} style={{ width: 48, height: 48, borderRadius: '50%' }} /> : <span style={{ color: '#888' }}>Unknown</span>}</td>
                    <td>{artist.name}</td>
                    <td>{artist.genres && artist.genres.length > 0 ? artist.genres.join(', ') : <span style={{ color: '#888' }}>Unknown</span>}</td>
                    <td>
                      <a href={`https://open.spotify.com/artist/${artist.id}`} target="_blank" rel="noopener noreferrer">
                        <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Genre Chart */}
          <div className={styles.songsTableWrapper}>
            <div className={styles.songsTableTitle}>Genre Distribution</div>
            <div style={{ margin: '32px 0', background: '#222', borderRadius: 8, padding: 24, minWidth: 900, overflowX: 'auto' }}>
              <Bar
                data={{
                  labels: Object.keys(data.genres),
                  datasets: [
                    {
                      label: '',
                      data: Object.values(data.genres),
                      backgroundColor: '#1db954',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: { enabled: false },
                  },
                  scales: {
                    x: {
                      title: { display: false },
                      ticks: { color: '#fff', maxRotation: 45, minRotation: 45, autoSkip: false },
                      grid: { display: false },
                    },
                    y: {
                      display: false,
                      beginAtZero: true,
                      ticks: { display: false },
                      grid: { display: false },
                    }
                  }
                }}
                height={300}
                width={1200}
              />
            </div>
          </div>
        </>
      )}
      {/* Playlist Creation Modal */}
      {showPlaylistModal && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowPlaylistModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()} style={{ minWidth: 400, maxWidth: 500 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Create Playlist</h2>
            <p style={{ textAlign: 'center', marginBottom: 16, color: '#888' }}>
              Creating playlist from: <span style={{ color: '#1db954' }}>Last 4 Weeks</span>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff' }}>
                Playlist Name:
              </label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#222',
                  color: '#fff',
                  fontSize: '16px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePlaylistSubmit();
                  }
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#888', fontSize: '14px' }}>
                This will create a playlist with {data?.tracks?.length || 0} tracks from your last 4 weeks.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCreatePlaylistSubmit}
                className={styles.vibeButton}
                disabled={isCreatingPlaylist}
                style={{ flex: 1 }}
              >
                {isCreatingPlaylist ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className={styles.closeModalButton}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
            {playlistCreationStatus && (
              <div style={{ 
                textAlign: 'center', 
                color: playlistCreationStatus.includes('successfully') ? '#1db954' : 'red', 
                marginTop: 12,
                fontSize: '14px'
              }}>
                {playlistCreationStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
} 