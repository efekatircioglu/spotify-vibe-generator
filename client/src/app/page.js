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
import ArtistSearch from '../components/ArtistSearch';
import ConcertsList from '../components/ConcertsList';

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
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const [showSongsTable, setShowSongsTable] = useState(false);
  const [showPlaylistsTable, setShowPlaylistsTable] = useState(true);
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
  const debounceTimerRef = useRef(null);

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
    setRecentSearches(getRecentSearches());
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

  // Utility functions for artist ID cache and recent searches
  const RECENT_SEARCHES_KEY = 'recent_artist_searches';
  function getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveRecentSearch(artistObj) {
    let searches = getRecentSearches();
    // Remove any previous entry with the same name or spotifyId
    searches = searches.filter(
      s => s.name !== artistObj.name && s.spotifyId !== artistObj.spotifyId
    );
    searches = [artistObj, ...searches];
    // Remove the .slice(0, 7) to keep all searches
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearchInputFocus = () => {
    if (!searchArtist.trim()) {
      // Only show the last 5 recent searches in the dropdown
      setArtistSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  const handleArtistInput = (e) => {
    const value = e.target.value;
    setSearchArtist(value);
    setHighlightedSuggestion(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length < 3) {
      setArtistSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Check recent_artist_searches for ticketmasterId before making API calls
        const recent = getRecentSearches().find(a => a.name.toLowerCase() === value.trim().toLowerCase());
        let spSuggestions = [];
        let tmSuggestions = [];
        if (recent) {
          // Use the cached ticketmasterId and spotifyId if available
          spSuggestions = recent.spotifyId ? [{
            name: recent.name,
            spotifyId: recent.spotifyId,
            ticketmasterId: recent.ticketmasterId || null,
            image: recent.image || null,
            genres: recent.genres || [],
            source: 'spotify'
          }] : [];
          tmSuggestions = recent.ticketmasterId ? [{
            name: recent.name,
            spotifyId: recent.spotifyId || null,
            ticketmasterId: recent.ticketmasterId,
            image: recent.image || null,
            genres: recent.genres || [],
            source: 'ticketmaster'
          }] : [];
        } else {
          // Spotify
          const spRes = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(value)}`);
          const spData = spRes.ok ? await spRes.json() : {};
          spSuggestions = spData.artists?.map(a => ({
            name: a.name,
            spotifyId: a.id,
            ticketmasterId: null,
            image: a.image || null,
            genres: a.genres || [],
            source: 'spotify'
          })) || [];
          // Ticketmaster
          const tmRes = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(value)}`);
          const tmData = tmRes.ok ? await tmRes.json() : {};
          tmSuggestions = tmData._embedded?.attractions
            ?.filter(a => a.type === 'attraction' && a.classifications?.[0]?.segment?.name === 'Music' && a.classifications?.[0]?.primary)
            .map(a => {
              let spotifyId = (() => {
                const spotifyLink = a.externalLinks?.spotify?.[0]?.url;
                if (spotifyLink) {
                  const match = spotifyLink.match(/artist\/([a-zA-Z0-9]+)/);
                  if (match) return match[1];
                }
                return null;
              })();
              return {
                name: a.name,
                spotifyId,
                ticketmasterId: a.id || null,
                image: a.images?.[0]?.url || null,
                genres: a.genres || [],
                source: 'ticketmaster'
              };
            }) || [];
        }
        // Merge by name: if both exist, merge ticketmasterId into spotify suggestion
        const merged = [];
        const usedNames = new Set();
        spSuggestions.forEach(sp => {
          const tm = tmSuggestions.find(t => t.name === sp.name);
          if (tm) {
            merged.push({ ...sp, ticketmasterId: tm.ticketmasterId });
            usedNames.add(sp.name);
          } else {
            merged.push(sp);
            usedNames.add(sp.name);
          }
        });
        tmSuggestions.forEach(tm => {
          if (!usedNames.has(tm.name)) {
            merged.push(tm);
          }
        });
        setArtistSuggestions(merged);
        setShowSuggestions(true);
      } catch {
        setArtistSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

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

  const handleSuggestionClick = async (artist) => {
    // Always prefer spotifyId if available
    let spotifyId = artist.spotifyId || null;
    let ticketmasterId = artist.ticketmasterId || null;
    let image = artist.image || null;
    let genres = artist.genres || [];
    if (!spotifyId) {
      // Fallback: search Spotify
      try {
        const spRes = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(artist.name)}`);
        if (spRes.ok) {
          const spData = await spRes.json();
          const spArtist = spData.artists?.[0];
          if (spArtist) {
            spotifyId = spArtist.id;
            image = image || spArtist.image || null;
            genres = spArtist.genres || [];
          }
        }
      } catch {}
    }
    // Save full object to recents
    saveRecentSearch({ name: artist.name, spotifyId, ticketmasterId, image });
    setRecentSearches(getRecentSearches());
    setSearchArtist(artist.name);
    setShowSuggestions(false);
    // Always include spotifyId if possible, ticketmasterId ONLY if it exists
    const paramsArr = [
      `name=${encodeURIComponent(artist.name)}`
    ];
    if (spotifyId) paramsArr.push(`spotifyId=${spotifyId}`);
    if (ticketmasterId && typeof ticketmasterId === 'string' && ticketmasterId.trim() !== '') {
      paramsArr.push(`ticketmasterId=${ticketmasterId}`);
    }
    const params = paramsArr.join('&');
    router.push(`/artist?${params}`);
  };

  // Handle search submit
  const handleProfileSearch = async (e) => {
    e.preventDefault();
    if (!searchArtist.trim()) return;

    // 1. Call Ticketmaster
    const tmRes = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(searchArtist)}`);
    const tmData = await tmRes.json();
    // Optionally extract ticketmasterId, spotifyId from tmData

    // 2. Call Spotify
    const spRes = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(searchArtist)}`);
    const spData = await spRes.json();
    // Optionally extract spotifyId from spData

    // 3. Navigate to /artist?name=... (optionally pass IDs as well)
    router.push(`/artist?name=${encodeURIComponent(searchArtist)}`);
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboardBackground}>
        <div className={styles.dashboardContainer}>
          <main className={styles.main}>
            <h1>Loading...</h1>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.dashboardBackground}>
        <div className={styles.dashboardContainer}>
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
        </div>
      </div>
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

  const handleArtistSelect = (artist) => {
    router.push(`/artist?name=${encodeURIComponent(artist.name)}&id=${artist.id}`);
  };

  return (
    <div className={styles.dashboardBackground}>
      <div className={styles.dashboardContainer}>
        {/* Top Bar: search + concerts button */}
        <div style={{ position: 'relative', width: '100%' }}>
          <form className={styles.topBar} onSubmit={e => e.preventDefault()} style={{ display: 'flex', width: '100%' }}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for an artist..."
              value={searchArtist}
              onChange={handleArtistInput}
              onFocus={handleSearchInputFocus}
              onKeyDown={handleArtistKeyDown}
              autoComplete="off"
              ref={searchInputRef}
            />
            <button
              className={styles.concertsButton}
              onClick={() => router.push('/concerts')}
              type="button"
            >
              Concerts
            </button>
          </form>
          {showSuggestions && artistSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              style={{
                position: 'absolute',
                top: '100%', // directly below the search bar
                left: 0,
                right: 0,
                background: '#232323',
                border: '1px solid #444',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '320px',
                overflowY: 'auto',
                zIndex: 1000,
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              {artistSuggestions.map((artist, index) => (
                <div
                  key={`${artist.spotifyId || ''}_${artist.ticketmasterId || ''}_${artist.name || ''}_${index}`}
                  onClick={() => handleSuggestionClick(artist)}
                  style={{
                    padding: '12px 18px',
                    background: highlightedSuggestion === index ? '#181818' : 'transparent',
                    color: highlightedSuggestion === index ? '#fff' : '#e5e7eb',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1.08rem',
                    borderBottom: '1px solid #232323',
                    transition: 'background 0.18s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={() => setHighlightedSuggestion(index)}
                >
                  {artist.image && (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <span>{artist.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <main className={styles.main}>
          <UserProfile user={user} onLogout={handleLogout} clickableTitle={false} showSubtitle={false} onFeedback={() => setShowFeedbackModal(true)}>
            <h2 className={styles.reportTitle}>Create Your Listening Report</h2>
            <div className={styles.reportSubtitle}>Select a time range to see your top artists and tracks.</div>
            <div className={styles.timeRangeRow}>
              <button className={styles.timeRangeButton} onClick={() => handleTimeRangeNav('/last-4-weeks')}>Last 4 Weeks</button>
              <button className={styles.timeRangeButton} onClick={() => handleTimeRangeNav('/last-6-months')}>Last 6 Months</button>
              <button className={styles.timeRangeButton} onClick={() => handleTimeRangeNav('/last-12-months')}>Last 12 Months</button>
            </div>
            <div className={styles.orDivider}><span>OR</span></div>
            <div className={styles.actionButtons}>
              <button onClick={handleGenerateFromRecents} className={styles.analyzeButton} disabled={isAnalyzingRecents}>
                {isAnalyzingRecents ? 'Analyzing...' : 'Analyze Your Last 50 Songs'}
              </button>
              <button onClick={handleGenerateFromPlaylist} className={styles.analyzeButton} disabled={isAnalyzingPlaylists}>
                {isAnalyzingPlaylists ? 'Analyzing...' : 'Analyze Your Playlists'}
              </button>
            </div>
          </UserProfile>
          {!(showSongsTable || (showPlaylistsTable && playlists.length > 0)) && (
            <div className={styles.emptyResultsBox}>
              <img src="/spotify-logo.svg" alt="Spotify Logo" style={{ width: 56, height: 56, opacity: 0.18, marginBottom: 18 }} />
              <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#222', marginBottom: 8, textAlign: 'center' }}>Your results will appear here</div>
              <div style={{ color: '#888', fontSize: '1.08rem', textAlign: 'center' }}>Select an analysis option above to get started.</div>
            </div>
          )}
          <div className={styles.dashboardContentArea}>
            <div className={styles.resultsCard}>
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
                        <th>Analyze</th>
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
                          <td>
                            <button
                              className={styles.analyzePillButton}
                              onClick={() => handleAnalyzeGenres(playlist)}
                              disabled={analyzingPlaylistId === playlist.id}
                              style={{
                                background: '#e0e7ff',
                                color: '#2563eb',
                                borderRadius: 9999,
                                fontWeight: 700,
                                padding: '6px 18px',
                                fontSize: '1rem',
                                margin: '0 4px 0 0',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                border: 'none',
                                outline: 'none',
                                display: 'inline-block',
                              }}
                            >
                              {analyzingPlaylistId === playlist.id ? 'Analyzing...' : 'Genres'}
                            </button>
                            <button
                              className={styles.analyzePillButtonArtist}
                              onClick={() => handleAnalyzeArtists(playlist)}
                              disabled={analyzingArtistPlaylistId === playlist.id}
                              style={{
                                background: '#f9a8d4',
                                color: '#fff',
                                borderRadius: 9999,
                                fontWeight: 700,
                                padding: '6px 18px',
                                fontSize: '1rem',
                                margin: '0 4px',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                border: 'none',
                                outline: 'none',
                                display: 'inline-block',
                              }}
                            >
                              {analyzingArtistPlaylistId === playlist.id ? 'Analyzing...' : 'Artists'}
                            </button>
                          </td>
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
            </div>
          </div>
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
      </div>
    </div>
  );
}