"use client";
import { useEffect, useState } from 'react';
import jwtManager from '../../utils/jwtManager';
import { getApiBaseUrl, LOGIN_URL } from '../../config/api';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import Sidebar from '../../components/Sidebar';
// import { Doughnut } from 'react-chartjs-2';
import SongAnalysisModal from '../../components/SongAnalysisModal';
import NewTrackTable from '../../components/NewTrackTable';
import TopArtistsTable from '../../components/TopArtistsTable';
import NewContributorFinder from '../../components/NewContributorFinder';
import { lookupTrackMBID } from '../../utils/spotifyIdToMBID';
import GenreLeaderboardChart from '../../components/GenreLeaderboardChart';

export default function Last12MonthsPage() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [data, setData] = useState(null);
  const [genreDetails, setGenreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSongInfo, setSelectedSongInfo] = useState(null);
  // Contributor modal state
  const [fetchingMbidForTrackId, setFetchingMbidForTrackId] = useState(null);
  const [selectedTrackForContributors, setSelectedTrackForContributors] = useState(null);
  const [showContributorModal, setShowContributorModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mainDataRes, genreDataRes] = await Promise.all([
          jwtManager.makeAuthenticatedRequest(`${getApiBaseUrl()}/last-12-months`),
          jwtManager.makeAuthenticatedRequest(`${getApiBaseUrl()}/genre-details/12-months`)
        ]);
        
        // Check if responses are ok before parsing JSON
        if (!mainDataRes || !mainDataRes.ok) {
          const errorText = mainDataRes ? await mainDataRes.text() : 'No response';
          console.error('Main data response error:', errorText);
          throw new Error(`Failed to fetch main data: ${mainDataRes?.status || 'No response'} ${mainDataRes?.statusText || 'No response'}`);
        }
        
        if (!genreDataRes || !genreDataRes.ok) {
          const errorText = genreDataRes ? await genreDataRes.text() : 'No response';
          console.error('Genre data response error:', errorText);
          throw new Error(`Failed to fetch genre data: ${genreDataRes?.status || 'No response'} ${genreDataRes?.statusText || 'No response'}`);
        }
        
        const [mainData, genreData] = await Promise.all([
          mainDataRes.json(),
          genreDataRes.json()
        ]);
        
        setData(mainData);
        setGenreDetails(genreData.genres);
      } catch (err) {
        console.error('❌ Error fetching 12-months data:', err);
        
        // Check if it's an authentication error
        if (err.message === 'No authentication token available' || err.message.includes('authentication')) {
          console.log('🔐 Authentication error detected, redirecting to login');
          window.location.href = LOGIN_URL;
          return;
        }
        
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  return (
    <>
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div style={{ 
        background: '#101114', 
        minHeight: '100vh',
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <main style={{ background: '#101114', minHeight: '100vh', boxSizing: 'border-box' }}>
          
          {/* Page Heading */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            paddingTop: '24px',
            width: '100%'
          }}>
            <h1 style={{
              color: '#f3f3f3',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: 1,
              textShadow: '0 2px 8px #0008',
              marginTop: '50px',
              lineHeight: 1.2
            }}>
              Your Last 12 Months&apos; Report
            </h1>
          </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && !loading && !error && (
        <div style={{ 
          marginBottom: 48,
          display: 'flex',
          justifyContent: 'center'
         }}>
          <NewTrackTable
            tracks={data.tracks}
            title="Top Tracks Of Last Year"
            playlistKey="last12months"
            loading={loading}
            error={error}
            onExploreGenre={handleExploreGenre}
            onExploreContributions={handleExploreContributions}
            showCreatePlaylist={true}
            showViewPlaylist={true}
            wrappedLabel={'Create Wrapped Analysis'}
            isArtistContext={false}
          />
        </div>
      )}
      {data && data.artists && (
        <>
          <div style={{
            textAlign: 'left',
            marginBottom: '32px',
            paddingTop: '24px'
          }}>
            <h2 style={{
              color: '#f3f3f3',
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 900,
              letterSpacing: 1,
              textShadow: '0 2px 8px #0008',
              margin: 0,
              lineHeight: 1.2
            }}>
              Top Artists Last 12 Months
            </h2>
          </div>
          <TopArtistsTable artists={data.artists} title="" />
        </>
      )}
      
      {/* Genre Leaderboard Chart */}
      {data && data.genres && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <GenreLeaderboardChart 
            genres={data.genres} 
            title="Genre Breakdown of Last Year" 
            timeRange="Long Term (12 Months)"
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