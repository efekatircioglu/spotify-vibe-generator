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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/last-4-weeks")
      .then(res => res.json())
      .then(setData)
      .catch(() => setError("Failed to fetch data"))
      .finally(() => setLoading(false));
  }, []);

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
    </main>
  );
} 