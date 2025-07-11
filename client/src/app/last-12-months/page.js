"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { Doughnut } from 'react-chartjs-2';
import SongAnalysisModal from '../../components/SongAnalysisModal';
import TrackTable from '../../components/TrackTable';
import TopArtistsTable from '../../components/TopArtistsTable';
import GenreDistributionChart from '../../components/GenreDistributionChart';

export default function Last12MonthsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSongInfo, setSelectedSongInfo] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/last-12-months")
      .then(res => res.json())
      .then(setData)
      .catch(() => setError("Failed to fetch data"))
      .finally(() => setLoading(false));
    
  }, []);

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
          onClick={() => router.push('/last-4-weeks')}
          className={styles.vibeButton}
        >
          Last 4 Weeks
        </button>
        <button
          onClick={() => router.push('/last-6-months')}
          className={styles.vibeButton}
        >
          Last 6 Months
        </button>
      </div>
      <h1 style={{ marginBottom: 24 }}>Your Spotify Stats (Last 12 Months)</h1>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && !loading && !error && (
        <TrackTable
          tracks={data.tracks}
          title="Top Tracks: Last 12 Months"
          playlistKey="last12months"
          loading={loading}
          error={error}
          onExploreGenre={handleExploreGenre}
        />
      )}
      {data && data.artists && (
        <TopArtistsTable artists={data.artists} title="Top Artists" />
      )}
      {/* Genre Chart */}
      {data && data.genres && <GenreDistributionChart genres={data.genres} />}
      {showInfoModal && selectedSongInfo && (
        <SongAnalysisModal open={showInfoModal} onClose={handleCloseInfoModal} songInfo={selectedSongInfo} />
      )}
    </main>
  );
} 