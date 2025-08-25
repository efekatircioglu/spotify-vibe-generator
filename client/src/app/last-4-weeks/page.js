"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { Doughnut } from 'react-chartjs-2';
import SongAnalysisModal from '../../components/SongAnalysisModal';
import NewTrackTable from '../../components/NewTrackTable';
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
import NewContributorFinder from '../../components/NewContributorFinder';
import { lookupTrackMBID } from '../../utils/spotifyIdToMBID';
import GenreLeaderboardChart from '../../components/GenreLeaderboardChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Last4WeeksPage() {
  const [data, setData] = useState(null);
  const [genreDetails, setGenreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  // Add state for info modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSongInfo, setSelectedSongInfo] = useState(null);
  // Contributor modal state
  const [fetchingMbidForTrackId, setFetchingMbidForTrackId] = useState(null);
  const [selectedTrackForContributors, setSelectedTrackForContributors] = useState(null);
  const [showContributorModal, setShowContributorModal] = useState(false);

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
  // Contributor logic
  const handleExploreContributions = async (track) => {
    if (!track || !track.id) return;
    setFetchingMbidForTrackId(track.id);
    const mbid = await lookupTrackMBID(track.id);
    setFetchingMbidForTrackId(null);
    if (mbid) {
      setSelectedTrackForContributors({ ...track, mbid });
      setShowContributorModal(true);
    } else {
      alert("Could not find contributor information for this track. The ISRC or MusicBrainz ID could not be located.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mainData, genreData] = await Promise.all([
          fetch("http://127.0.0.1:8000/last-4-weeks").then(res => res.json()),
          fetch("http://127.0.0.1:8000/genre-details/4-weeks").then(res => res.json())
        ]);
        
        setData(mainData);
        setGenreDetails(genreData.genres);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <main style={{ padding: 32, background: '#101114', minHeight: '100vh' }}>
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
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && !loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <NewTrackTable
            tracks={data.tracks}
            title="Top Tracks Of Last Month"
            playlistKey="last4weeks"
            loading={loading}
            error={error}
            onExploreGenre={handleExploreGenre}
            onExploreContributions={handleExploreContributions}
          />
      </div>
      )}
      {data && data.artists && (
        <TopArtistsTable artists={data.artists} title="Top Artists" />
      )}
      
      {/* Genre Leaderboard Chart */}
      {data && data.genres && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <GenreLeaderboardChart 
            genres={data.genres} 
            title="Genre Breakdown of Last Month" 
            timeRange="Short Term (4 Weeks)"
            genreDetails={genreDetails}
            mainArtistsData={data.artists}
          />
        </div>
      )}
      
      {/* Info Modal */}
      {showInfoModal && selectedSongInfo && (
        <SongAnalysisModal open={showInfoModal} onClose={handleCloseInfoModal} songInfo={selectedSongInfo} />
      )}
      {/* Contributor Modal */}
      {showContributorModal && selectedTrackForContributors && (
        <SongAnalysisModal open={false} onClose={() => {}} songInfo={null} /> /* keep modal tree stable */
      )}
      {showContributorModal && selectedTrackForContributors && (
        <NewContributorFinder mbid={selectedTrackForContributors.mbid} track={selectedTrackForContributors} />
      )}
    </main>
  );
} 