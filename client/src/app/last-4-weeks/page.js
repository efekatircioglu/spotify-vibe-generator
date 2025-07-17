"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { Doughnut } from 'react-chartjs-2';
import SongAnalysisModal from '../../components/SongAnalysisModal';
import TrackTable from '../../components/TrackTable';
import TopArtistsTable from '../../components/TopArtistsTable';
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
  // Add state for info modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSongInfo, setSelectedSongInfo] = useState(null);
  const handleExploreGenre = (track) => {
    setSelectedSongInfo({
      ...track,
      artist: track.artists.map(a => a.name).join(', ')
    });
    setShowInfoModal(true);
  };
  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setSelectedSongInfo(null);
  };

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
        <TrackTable
          tracks={data.tracks}
          title="Top Tracks: Last 4 Weeks"
          playlistKey="last4weeks"
          loading={loading}
          error={error}
          onExploreGenre={handleExploreGenre}
        />
      )}
      {data && data.artists && (
        <TopArtistsTable artists={data.artists} title="Top Artists" />
      )}
      
      {/* Info Modal */}
      {showInfoModal && selectedSongInfo && (
        <SongAnalysisModal open={showInfoModal} onClose={handleCloseInfoModal} songInfo={selectedSongInfo} />
      )}
    </main>
  );
} 