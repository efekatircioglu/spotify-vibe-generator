'use client'; // This is a client component, so we can use hooks

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import React from 'react';
import { useRouter } from 'next/navigation';
import SongAnalysisModal from '../components/SongAnalysisModal';
import TrackTable from '../components/TrackTable';
import UserProfile from '../components/UserProfile';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const tableRef = useRef(null);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const playlistsTableRef = useRef(null);
  const [selectedSongMetrics, setSelectedSongMetrics] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [genreAnalysis, setGenreAnalysis] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [genreChartStart, setGenreChartStart] = useState(0);
  const GENRES_PER_PAGE = 20;
  const [analyzingPlaylistId, setAnalyzingPlaylistId] = useState(null);
  const [isAnalyzingRecents, setIsAnalyzingRecents] = useState(false);
  const [isAnalyzingPlaylists, setIsAnalyzingPlaylists] = useState(false);
  const [concertArtist, setConcertArtist] = useState('');
  const [concerts, setConcerts] = useState([]);
  const [concertSearchLoading, setConcertSearchLoading] = useState(false);
  const [concertError, setConcertError] = useState('');
  const router = useRouter();
  const [searchArtist, setSearchArtist] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const [showSongsTable, setShowSongsTable] = useState(false);
  const [showPlaylistsTable, setShowPlaylistsTable] = useState(true);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [artistAnalysis, setArtistAnalysis] = useState(null);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistChartStart, setArtistChartStart] = useState(0);
  const ARTISTS_PER_PAGE = 20;
  const [analyzingArtistPlaylistId, setAnalyzingArtistPlaylistId] = useState(null);
  const [topData, setTopData] = useState(null);
  const [showTopModal, setShowTopModal] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
  const timeRanges = [
    { label: 'Last 4 Weeks', value: 'short_term' },
    { label: 'Last 6 Months', value: 'medium_term' },
    { label: 'Last 12 Months', value: 'long_term' },
  ];
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEmoji, setFeedbackEmoji] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistTimeRange, setPlaylistTimeRange] = useState('');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistCreationStatus, setPlaylistCreationStatus] = useState('');
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSongInfo, setSelectedSongInfo] = useState(null);

  // This is the URL to our backend's login route
  const LOGIN_URL = 'http://127.0.0.1:8000/login';

  // This function runs when the page loads
  useEffect(() => {
    fetch('http://127.0.0.1:8000/me')
      .then((res) => {
        if (!res.ok) throw new Error('User not logged in');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
    
    // Load persisted playlist URL from localStorage
    const savedPlaylistUrl = localStorage.getItem('last50songs_playlist_url');
    if (savedPlaylistUrl) {
      setCreatedPlaylistUrl(savedPlaylistUrl);
    }
  }, []);

  useEffect(() => {
    if (showSongsTable && songs.length > 0 && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showSongsTable, songs.length]);

  const handleGenerateFromRecents = async () => {
    setIsAnalyzingRecents(true);
    setAnalysis(null);
    setShowSongsTable(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/recent-tracks');
      if (!res.ok) throw new Error('Failed to fetch recent tracks');
      const data = await res.json();
      setSongs(data.tracks || []);
      setTimeout(() => {
        if (tableRef.current) {
          tableRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (error) {
      alert('Could not fetch recent tracks. Please try again.');
    } finally {
      setIsAnalyzingRecents(false);
    }
  };

  const handleGenerateFromPlaylist = async () => {
    setIsAnalyzingPlaylists(true);
    setShowPlaylistsTable(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/playlists');
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      setPlaylists(data.playlists || []);
      setTimeout(() => {
        if (playlistsTableRef.current) {
          playlistsTableRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (error) {
      alert('Could not fetch playlists. Please try again.');
    } finally {
      setIsAnalyzingPlaylists(false);
    }
  };

  // Fetch metrics for a single song by its ID (only when clicking the name cell)
  const handleSongNameClick = async (song) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/audio-features/${song.id}`);
      if (!res.ok) throw new Error('Failed to fetch audio features');
      const data = await res.json();
      setSelectedSongMetrics({ ...data, name: song.name, artist: song.artist });
      setShowMetricsModal(true);
    } catch (error) {
      alert('Could not fetch song metrics. Please try again.');
    }
  };

  // Analyze genres for a playlist by playlist ID
  const handleAnalyzeGenres = async (playlist) => {
    try {
      setAnalyzingPlaylistId(playlist.id);
      setGenreChartStart(0);
      const res = await fetch(`http://127.0.0.1:8000/playlist-genres/${playlist.id}`);
      if (!res.ok) throw new Error('Failed to analyze playlist genres');
      const data = await res.json();
      setGenreAnalysis({ name: playlist.name, genres: data.genres });
      setShowGenreModal(true);
    } catch (error) {
      alert('Could not analyze playlist genres. Please try again.');
    } finally {
      setAnalyzingPlaylistId(null);
    }
  };

  // Analyze artists for a playlist by playlist ID
  const handleAnalyzeArtists = async (playlist) => {
    try {
      setAnalyzingArtistPlaylistId(playlist.id);
      setArtistChartStart(0);
      const res = await fetch(`http://127.0.0.1:8000/playlist-artists/${playlist.id}`);
      if (!res.ok) throw new Error('Failed to analyze playlist artists');
      const data = await res.json();
      setArtistAnalysis({ name: playlist.name, artists: data.artists });
      setShowArtistModal(true);
    } catch (error) {
      alert('Could not analyze playlist artists. Please try again.');
    } finally {
      setAnalyzingArtistPlaylistId(null);
    }
  };

  // Helper for paginated genres
  const getPaginatedGenres = () => {
    if (!genreAnalysis) return { labels: [], data: [] };
    const allLabels = Object.keys(genreAnalysis.genres);
    const allData = Object.values(genreAnalysis.genres).map(v => Math.round(v));
    const start = genreChartStart;
    const end = Math.min(start + GENRES_PER_PAGE, allLabels.length);
    return {
      labels: allLabels.slice(start, end),
      data: allData.slice(start, end),
      total: allLabels.length
    };
  };

  // Helper for paginated artists
  const getPaginatedArtists = () => {
    if (!artistAnalysis) return { labels: [], data: [] };
    const allLabels = Object.keys(artistAnalysis.artists);
    const allData = Object.values(artistAnalysis.artists).map(v => Math.round(v));
    const start = artistChartStart;
    const end = Math.min(start + ARTISTS_PER_PAGE, allLabels.length);
    return {
      labels: allLabels.slice(start, end),
      data: allData.slice(start, end),
      total: allLabels.length
    };
  };

  const handleConcertSearch = async (artistNameParam) => {
    setConcertError('');
    setConcerts([]);
    const searchName = artistNameParam || concertArtist;
    if (!searchName) return;
    setConcertSearchLoading(true);
    try {
      // 1. Search for artist
      const res1 = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(searchName)}`);
      if (!res1.ok) throw new Error('Failed to search artist');
      const data1 = await res1.json();
      const attractions = data1._embedded?.attractions || [];
      if (attractions.length === 0) throw new Error('No artist found');
      const artistId = attractions[0].id;
      // 2. Get events
      const res2 = await fetch(`http://127.0.0.1:8000/concerts/events?artistId=${artistId}`);
      if (!res2.ok) throw new Error('Failed to get events');
      const data2 = await res2.json();
      const events = data2._embedded?.events || [];
      setConcerts(events);
    } catch (err) {
      setConcertError(err.message || 'Concert search failed');
    } finally {
      setConcertSearchLoading(false);
    }
  };

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

  // Add a handler for clicking artist in songs table
  const handleArtistClick = (artistName) => {
    router.push(`/artist?name=${encodeURIComponent(artistName)}`);
  };

  // Fetch artist suggestions as user types
  const handleArtistInput = async (e) => {
    const value = e.target.value;
    setSearchArtist(value);
    setHighlightedSuggestion(-1);
    if (value.trim().length === 0) {
      setArtistSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      const suggestions = data._embedded?.attractions
        ?.filter(a => a.type === 'attraction' && a.classifications?.[0]?.segment?.name === 'Music' && a.classifications?.[0]?.primary)
        .filter(a => {
          const input = value.trim().toLowerCase();
          const name = a.name.toLowerCase();
          return name === input || name.startsWith(input);
        })
        .map(a => ({ name: a.name, id: a.id })) || [];
      setArtistSuggestions(suggestions);
      setShowSuggestions(true);
    } catch {
      setArtistSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Keyboard navigation for suggestions
  const handleArtistKeyDown = (e) => {
    if (!showSuggestions || artistSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestion(prev => {
        const next = prev + 1;
        if (next >= artistSuggestions.length) return 0;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestion(prev => {
        const next = prev - 1;
        if (next < 0) return artistSuggestions.length - 1;
        return next;
      });
    } else if (e.key === 'Enter') {
      if (highlightedSuggestion >= 0 && highlightedSuggestion < artistSuggestions.length) {
        handleSuggestionClick(artistSuggestions[highlightedSuggestion]);
      }
    }
  };

  // Update input value as user navigates
  useEffect(() => {
    if (highlightedSuggestion >= 0 && highlightedSuggestion < artistSuggestions.length) {
      setSearchArtist(artistSuggestions[highlightedSuggestion].name);
    }
    // eslint-disable-next-line
  }, [highlightedSuggestion]);

  // Handle suggestion click
  const handleSuggestionClick = (artist) => {
    setSearchArtist(artist.name);
    setShowSuggestions(false);
    router.push(`/artist?name=${encodeURIComponent(artist.name)}&id=${artist.id}`);
  };

  // Handle search submit
  const handleProfileSearch = (e) => {
    e.preventDefault();
    if (artistSuggestions.length > 0) {
      const artist = artistSuggestions[0];
      router.push(`/artist?name=${encodeURIComponent(artist.name)}&id=${artist.id}`);
    } else if (searchArtist.trim()) {
      router.push(`/artist?name=${encodeURIComponent(searchArtist.trim())}`);
    }
    setShowSuggestions(false);
  };

  // When hiding tables, reset analyzing state so 'Analyzing...' is only shown once per click
  const handleHideSongsTable = () => {
    setShowSongsTable(false);
    setIsAnalyzingRecents(false);
  };
  const handleHidePlaylistsTable = () => {
    setShowPlaylistsTable(false);
    setIsAnalyzingPlaylists(false);
  };

  const fetchTopData = async (time_range) => {
    setTopLoading(true);
    setShowTopModal(true);
    try {
      const [tracksRes, artistsRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/top-tracks?time_range=${time_range}`),
        fetch(`http://127.0.0.1:8000/top-artists?time_range=${time_range}`)
      ]);
      const tracks = await tracksRes.json();
      const artists = await artistsRes.json();
      // Collect genres from top artists
      let genreCounts = {};
      (artists || []).forEach(artist => {
        (artist.genres || []).forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      setTopData({ tracks, artists, genres: genreCounts });
    } catch (err) {
      setTopData({ error: 'Failed to fetch top data' });
    } finally {
      setTopLoading(false);
    }
  };

  // Add time range navigation buttons
  const handleTimeRangeNav = (endpoint) => {
    router.push(endpoint);
  };

  const handleSendFeedback = async () => {
    if (!feedbackEmoji) {
      setFeedbackStatus('Please select how you feel!');
      return;
    }
    setFeedbackStatus('');
    try {
      console.log('Sending feedback:', {
        username: user.display_name,
        emoji: feedbackEmoji,
        text: feedbackText,
      });
      const res = await fetch('http://127.0.0.1:8000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.display_name,
          emoji: feedbackEmoji,
          text: feedbackText,
        }),
      });
      if (res.ok) {
        setFeedbackStatus('Thank you for your feedback!');
        setFeedbackEmoji(null);
        setFeedbackText('');
        setTimeout(() => setShowFeedbackModal(false), 1200);
      } else {
        setFeedbackStatus('Failed to send feedback.');
      }
    } catch (e) {
      setFeedbackStatus('Failed to send feedback.');
    }
  };

  const handleCreatePlaylist = async (timeRange, tracks) => {
    setPlaylistTimeRange(timeRange);
    setPlaylistTracks(tracks);
    setPlaylistName('');
    setCreatedPlaylistUrl(''); // Reset when creating new playlist
    localStorage.removeItem('last50songs_playlist_url'); // Clear from localStorage
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
      const trackUris = playlistTracks.map(track => track.uri || `spotify:track:${track.id}`);
      
      const response = await fetch('http://127.0.0.1:8000/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          trackUris: trackUris,
          timeRange: playlistTimeRange,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPlaylistCreationStatus(`Playlist created successfully! ${result.trackCount} tracks added.`);
        setTimeout(() => {
          setShowPlaylistModal(false);
          setPlaylistCreationStatus('');
          setPlaylistName('');
          // Redirect to the playlist
          if (result.playlistUrl) {
            setCreatedPlaylistUrl(result.playlistUrl);
            localStorage.setItem('last50songs_playlist_url', result.playlistUrl);
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

  const handleExploreGenre = (song) => {
    setSelectedSongInfo(song);
    setShowInfoModal(true);
  };
  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setSelectedSongInfo(null);
  };

  // Helper to render a fuel gauge bar
  function FuelGauge({ label, value, color = '#8B5CF6' }) {
    // Clamp the left position for the percentage text
    const clampedLeft = Math.max(4, Math.min(value - 6, 88));
    return (
      <div style={{ margin: '28px 0 18px 0', transition: 'box-shadow 0.2s', boxShadow: '0 1px 6px #8B5CF611' }}
        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px #8B5CF633'}
        onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 6px #8B5CF611'}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#fff' }}>{label}</div>
        <div style={{ position: 'relative', height: 22, background: '#e5e7eb', borderRadius: 11, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: 11,
            transition: 'width 0.4s',
          }} />
          <div style={{ position: 'absolute', left: `${value}%`, top: 0, height: '100%', width: 2, background: '#fff', opacity: 0.7 }} />
          <div style={{ position: 'absolute', left: `${clampedLeft}%`, top: 0, height: '100%', width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 800, fontSize: 16 }}>
            {value.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <div className={styles.loginContainer}>
          <h1>Can't wait for Spotify Wrapped?</h1>
          <p>
            Analyze your recent songs and your playlist and get your
            <span className={styles.highlight + ' ' + styles.hoverUnderline}>custom wrapped for free!</span>
          </p>
          <a
            href={LOGIN_URL}
            className={styles.spotifyButton}
          >
            <img
              src="/spotify-logo.svg"
              alt="Spotify Logo"
              className={styles.spotifyLogo}
            />
            Login with Spotify
          </a>
        </div>
      </main>
    );
  }

  // --- LOGGED IN ---
  const handleLogout = async () => {
    await fetch('http://127.0.0.1:8000/logout');
    setUser(null);
    setAnalysis(null);
    // Clear all playlist URLs from localStorage
    localStorage.removeItem('last4weeks_playlist_url');
    localStorage.removeItem('last6months_playlist_url');
    localStorage.removeItem('last12months_playlist_url');
    localStorage.removeItem('last50songs_playlist_url');
    window.location.reload();
  };

  const genreColors = {
    Trance: '#4B0082',
    Ambient: '#00CED1',
    House: '#FFD700',
    Techno: '#FF6347',
    Dnb: '#9ACD32',
  };
  const defaultColors = [
    '#1db954', '#6ee7b7', '#a5b4fc', '#fbbf24', '#f87171', '#f472b6', '#60a5fa', '#facc15', '#34d399', '#818cf8'
  ];

  // Add a keyframes style for the shine animation at the top of the component (inside the Home function, before return):
  const shineKeyframes = `
@keyframes shine {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}`;

  return (
    <main className={styles.main}>
      {/* Search bar at the top */}
      <form onSubmit={handleProfileSearch} style={{ display: 'flex', alignItems: 'center', marginBottom: 32, position: 'relative', marginLeft: 32, marginTop: 24 }} autoComplete="off">
        <input
          type="text"
          value={searchArtist}
          onChange={handleArtistInput}
          onFocus={() => setShowSuggestions(artistSuggestions.length > 0)}
          onKeyDown={handleArtistKeyDown}
          placeholder="Search for an artist's concerts..."
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #444', marginRight: 8, width: 300 }}
          autoComplete="off"
        />
        <button type="submit" className={styles.logoutButton} style={{ position: 'static', marginRight: 16, marginTop: 0 }}>
          Search
        </button>
        <span className={styles.hoverUnderline} style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#fff', marginRight: 32, fontSize: 2.2 + 'rem', letterSpacing: 1, marginLeft: 16, textShadow: '0 2px 8px #0006' }}>
          How far back do you want to go?
        </span>
        <span style={{ display: 'flex', gap: 16 }}>
          <button type="button" onClick={() => handleTimeRangeNav('/last-4-weeks')} className={styles.vibeButton}>
            Last 4 Weeks
          </button>
          <button type="button" onClick={() => handleTimeRangeNav('/last-6-months')} className={styles.vibeButton}>
            Last 6 Months
          </button>
          <button type="button" onClick={() => handleTimeRangeNav('/last-12-months')} className={styles.vibeButton}>
            Last 12 Months
          </button>
        </span>
        {showSuggestions && artistSuggestions.length > 0 && (
          <ul ref={suggestionsRef} style={{
            position: 'absolute',
            top: 40,
            left: 0,
            width: 300,
            background: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: 4,
            zIndex: 10,
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 2px 8px #0004'
          }}>
            {artistSuggestions.map((artist, idx) => (
              <li
                key={artist.id}
                onClick={() => handleSuggestionClick(artist)}
                style={{
                  padding: 8,
                  cursor: 'pointer',
                  borderBottom: idx !== artistSuggestions.length - 1 ? '1px solid #333' : 'none',
                  background: idx === highlightedSuggestion ? '#1db954' : idx === 0 ? '#1db95422' : 'transparent',
                  color: idx === highlightedSuggestion ? '#fff' : undefined
                }}
                onMouseDown={e => e.preventDefault()}
              >
                {artist.name}
              </li>
            ))}
          </ul>
        )}
      </form>
      <hr style={{ width: '100%', border: 0, borderTop: '2px solid #333', margin: '48px 0 32px 0' }} />
      <UserProfile user={user} onLogout={handleLogout} clickableTitle={true} showSubtitle={true}>
        <div className={styles.actionButtons}>
          <button onClick={handleGenerateFromRecents} className={styles.vibeButton} disabled={isAnalyzingRecents}>
            {isAnalyzingRecents ? 'Analyzing...' : 'Analyze your last 50 songs'}
          </button>
          <button onClick={handleGenerateFromPlaylist} className={styles.vibeButton} disabled={isAnalyzingPlaylists}>
            {isAnalyzingPlaylists ? 'Analyzing...' : 'Analyze your playlists'}
          </button>
        </div>
        {analysis && (
          <div className={styles.analysisResults}>
            <h2>Recent Vibe Analysis:</h2>
            <ul>
              <li><strong>Danceability:</strong> {Math.round(analysis.danceability * 100)}%</li>
              <li><strong>Energy:</strong> {Math.round(analysis.energy * 100)}%</li>
              <li><strong>Positivity (Valence):</strong> {Math.round(analysis.valence * 100)}%</li>
              <li><strong>Acousticness:</strong> {Math.round(analysis.acousticness * 100)}%</li>
            </ul>
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button onClick={() => setShowFeedbackModal(true)} className={styles.vibeButton}>
            Feedback
          </button>
        </div>
      </UserProfile>
      {/* Table section for last 50 songs */}
      {showSongsTable && (
        <div ref={tableRef}>
          <TrackTable
            tracks={songs}
            title="Your Last 50 Songs"
            playlistKey="last50"
            loading={isAnalyzingRecents}
            error={null}
            onExploreGenre={handleExploreGenre}
          />
        </div>
      )}
      {/* Table section for playlists */}
      {showPlaylistsTable && playlists.length > 0 && (
        <div ref={playlistsTableRef} className={styles.songsTableWrapper} style={{ position: 'relative', marginTop: 40 }}>
          <span
            style={{ position: 'absolute', top: 8, right: 12, cursor: 'pointer', fontSize: 20, color: '#888', zIndex: 2 }}
            title="Hide table"
            onClick={handleHidePlaylistsTable}
          >
            ×
          </span>
          <div className={styles.songsTableTitle}>Your Playlists</div>
          <table className={styles.songsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Cover</th>
                <th>Name</th>
                <th>Number of Songs</th>
                <th>Total Duration</th>
                <th>Analyze Genres</th>
                <th>Analyze Artists</th>
                <th>Play</th>
              </tr>
            </thead>
            <tbody>
              {playlists.map((playlist, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{playlist.images && playlist.images.length > 0 ? <img src={playlist.images[0].url} alt={playlist.name} style={{ width: 48, height: 48, borderRadius: 8 }} /> : ''}</td>
                  <td>{playlist.name}</td>
                  <td>{playlist.trackCount}</td>
                  <td>{playlist.totalDurationMs ? `${Math.floor(playlist.totalDurationMs / 3600000)}h${Math.floor((playlist.totalDurationMs % 3600000) / 60000)}m` : ''}</td>
                  <td><button className={styles.analyzeGenreButton} onClick={() => handleAnalyzeGenres(playlist)} disabled={analyzingPlaylistId === playlist.id}>
                    {analyzingPlaylistId === playlist.id ? 'Analyzing...' : 'Analyze Genres'}
                  </button></td>
                  <td><button className={styles.analyzeGenreButton} onClick={() => handleAnalyzeArtists(playlist)} disabled={analyzingArtistPlaylistId === playlist.id}>
                    {analyzingArtistPlaylistId === playlist.id ? 'Analyzing...' : 'Analyze Artists'}
                  </button></td>
                  <td>
                    {playlist.id && (
                      <a href={`https://open.spotify.com/playlist/${playlist.id}`} target="_blank" rel="noopener noreferrer">
                        <img src="/spotify-logo-green.svg" alt="Open in Spotify" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Metrics Modal Overlay */}
      {showMetricsModal && selectedSongMetrics && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowMetricsModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()}>
            <h2>{selectedSongMetrics.name} <span style={{fontWeight:400}}>- {selectedSongMetrics.artist}</span></h2>
            <ul>
              <li><strong>Danceability:</strong> {selectedSongMetrics.danceability}</li>
              <li><strong>Energy:</strong> {selectedSongMetrics.energy}</li>
              <li><strong>Valence:</strong> {selectedSongMetrics.valence}</li>
              <li><strong>Acousticness:</strong> {selectedSongMetrics.acousticness}</li>
              <li><strong>Instrumentalness:</strong> {selectedSongMetrics.instrumentalness}</li>
              <li><strong>Speechiness:</strong> {selectedSongMetrics.speechiness}</li>
              <li><strong>Liveness:</strong> {selectedSongMetrics.liveness}</li>
              <li><strong>Tempo:</strong> {selectedSongMetrics.tempo}</li>
            </ul>
            <button className={styles.closeModalButton} onClick={() => setShowMetricsModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Genre Analysis Modal Overlay */}
      {showGenreModal && genreAnalysis && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowGenreModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()}>
            <h2>Genre Analysis for <span style={{color:'#1db954'}}>{genreAnalysis.name}</span></h2>
            <div className={styles.chartScrollContainer}>
              <button
                className={styles.chartNavButton}
                onClick={() => setGenreChartStart(Math.max(0, genreChartStart - GENRES_PER_PAGE))}
                disabled={genreChartStart === 0}
                style={{ marginRight: 16 }}
              >
                &#8592;
              </button>
              <div style={{ flex: 1, minWidth: 600 }}>
                <Line
                  data={{
                    labels: getPaginatedGenres().labels,
                    datasets: [
                      {
                        label: 'Number of Songs',
                        data: getPaginatedGenres().data,
                        borderColor: '#1db954',
                        backgroundColor: 'rgba(30,185,84,0.2)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: '#1db954',
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Genre' },
                        ticks: { maxRotation: 45, minRotation: 45, autoSkip: false, padding: 10 },
                        grid: { display: false },
                      },
                      y: { title: { display: true, text: 'Number of Songs' }, beginAtZero: true, precision: 0 }
                    }
                  }}
                />
              </div>
              <button
                className={styles.chartNavButton}
                onClick={() => setGenreChartStart(Math.min(getPaginatedGenres().total - GENRES_PER_PAGE, genreChartStart + GENRES_PER_PAGE))}
                disabled={genreChartStart + GENRES_PER_PAGE >= getPaginatedGenres().total}
                style={{ marginLeft: 16 }}
              >
                &#8594;
              </button>
            </div>
            <button className={styles.closeModalButton} onClick={() => setShowGenreModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Artist Analysis Modal Overlay */}
      {showArtistModal && artistAnalysis && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowArtistModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()}>
            <h2>Artist Analysis for <span style={{color:'#1db954'}}>{artistAnalysis.name}</span></h2>
            <div className={styles.chartScrollContainer}>
              <button
                className={styles.chartNavButton}
                onClick={() => setArtistChartStart(Math.max(0, artistChartStart - ARTISTS_PER_PAGE))}
                disabled={artistChartStart === 0}
                style={{ marginRight: 16 }}
              >
                &#8592;
              </button>
              <div style={{ flex: 1, minWidth: 600 }}>
                <Line
                  data={{
                    labels: getPaginatedArtists().labels,
                    datasets: [
                      {
                        label: 'Number of Songs',
                        data: getPaginatedArtists().data,
                        borderColor: '#1db954',
                        backgroundColor: 'rgba(30,185,84,0.2)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: '#1db954',
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Artist' },
                        ticks: { maxRotation: 45, minRotation: 45, autoSkip: false, padding: 10 },
                        grid: { display: false },
                      },
                      y: { title: { display: true, text: 'Number of Songs' }, beginAtZero: true, precision: 0 }
                    }
                  }}
                />
              </div>
              <button
                className={styles.chartNavButton}
                onClick={() => setArtistChartStart(Math.min(getPaginatedArtists().total - ARTISTS_PER_PAGE, artistChartStart + ARTISTS_PER_PAGE))}
                disabled={artistChartStart + ARTISTS_PER_PAGE >= getPaginatedArtists().total}
                style={{ marginLeft: 16 }}
              >
                &#8594;
              </button>
            </div>
            <button className={styles.closeModalButton} onClick={() => setShowArtistModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Top Data Modal */}
      {showTopModal && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowTopModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()}>
            <h2>Top Data</h2>
            {topLoading && <div>Loading...</div>}
            {topData && !topLoading && !topData.error && (
              <div style={{ maxHeight: 400, overflowY: 'auto', textAlign: 'left' }}>
                <h3>Top Tracks</h3>
                <ol>
                  {(topData.tracks || []).map(t => <li key={t.id}>{t.name} <span style={{ color: '#888' }}>({t.artists?.map(a => a.name).join(', ')})</span></li>)}
                </ol>
                <h3>Top Artists</h3>
                <ol>
                  {(topData.artists || []).map(a => <li key={a.id}>{a.name}</li>)}
                </ol>
                <h3>Top Genres</h3>
                <ol>
                  {Object.entries(topData.genres || {}).sort((a, b) => b[1] - a[1]).map(([genre, count]) => <li key={genre}>{genre} <span style={{ color: '#888' }}>({count})</span></li>)}
                </ol>
              </div>
            )}
            {topData && topData.error && <div style={{ color: 'red' }}>{topData.error}</div>}
            <button className={styles.closeModalButton} onClick={() => setShowTopModal(false)}>Close</button>
          </div>
        </div>
      )}
      {showFeedbackModal && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()} style={{ minWidth: 320, maxWidth: 400 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 16 }}>How do you feel about the app?</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 32, marginBottom: 16 }}>
              {['😡','🙁','😐','😊','😍'].map((emoji, idx) => (
                <span
                  key={emoji}
                  style={{
                    cursor: 'pointer',
                    filter: feedbackEmoji === emoji ? 'drop-shadow(0 0 12px #1db954) brightness(1.2)' : 'none',
                    transform: feedbackEmoji === emoji ? 'scale(1.2)' : 'scale(1)',
                    transition: 'filter 0.2s, transform 0.2s',
                    borderRadius: '50%',
                    background: feedbackEmoji === emoji ? 'rgba(29,185,84,0.15)' : 'transparent',
                    padding: feedbackEmoji === emoji ? '4px' : '0',
                  }}
                  onClick={() => setFeedbackEmoji(emoji)}
                  title={['Extremely Unhappy','Unhappy','Neutral','Happy','Extremely Happy'][idx]}
                >
                  {emoji}
                </span>
              ))}
            </div>
            <textarea
              placeholder="Optional: Tell us more..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #444', padding: 8, marginBottom: 12, resize: 'vertical', background: '#222', color: '#fff' }}
            />
            <button
              onClick={handleSendFeedback}
              className={styles.vibeButton}
              style={{ width: '100%', marginBottom: 8 }}
            >
              Send
            </button>
            {feedbackStatus && <div style={{ textAlign: 'center', color: feedbackStatus.startsWith('Thank') ? '#1db954' : 'red', marginTop: 8 }}>{feedbackStatus}</div>}
            <button className={styles.closeModalButton} onClick={() => setShowFeedbackModal(false)} style={{ marginTop: 8 }}>Close</button>
          </div>
        </div>
      )}
      {/* Playlist Creation Modal */}
      {showPlaylistModal && (
        <div className={styles.metricsModalOverlay} onClick={() => setShowPlaylistModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()} style={{ minWidth: 400, maxWidth: 500 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Create Playlist</h2>
            <p style={{ textAlign: 'center', marginBottom: 16, color: '#888' }}>
              Creating playlist from: <span style={{ color: '#1db954' }}>{playlistTimeRange}</span>
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
                This will create a playlist with {playlistTracks.length} tracks from your {playlistTimeRange.toLowerCase()}.
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
      {showInfoModal && selectedSongInfo && (
        <SongAnalysisModal open={showInfoModal} onClose={handleCloseInfoModal} songInfo={selectedSongInfo} />
      )}
    </main>
  );
}