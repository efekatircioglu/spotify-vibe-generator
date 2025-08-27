"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import Sidebar from '../../components/Sidebar';
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
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    <>
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div style={{ 
        padding: 32, 
        background: '#101114', 
        minHeight: '100vh',
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <main style={{ background: '#101114', minHeight: '100vh' }}>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && !loading && !error && (
        <div style={{ 
          marginBottom: 48,
          display: 'flex',
          justifyContent: 'center',
          width: 'clamp(95vw, 98vw, 98vw)', 
          maxWidth: '100vw', 
          boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 32px', 
          position: 'relative', 
          fontSize: 'clamp(0.75rem, 1vw, 1.08rem)',
         }}>
          <NewTrackTable
            tracks={data.tracks}
            title="Top Tracks Of Last Month"
            playlistKey="last4weeks"
            loading={loading}
            error={error}
            onExploreGenre={handleExploreGenre}
            onExploreContributions={handleExploreContributions}
            showCreatePlaylist={true}
            showViewPlaylist={true}
            wrappedLabel={'Create Your Custom Wrapped'}
            isArtistContext={false}
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
      </div>
    </>
  );
} 