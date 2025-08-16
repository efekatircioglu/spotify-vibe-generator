'use client'; // This is a client component, so we can use hooks

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import React from 'react';
import { useRouter } from 'next/navigation';
import SongAnalysisModal from '../components/SongAnalysisModal';
import NewTrackTable from '../components/NewTrackTable';
import UserProfile from '../components/UserProfile';
import ArtistSearch from '../components/ArtistSearch';
import ConcertsList from '../components/ConcertsList';

import { StyledModal, StyledAnalysisChart } from '../components/Charts';
import ContributorFinder from '../components/ContributorFinder';
import { getCachedArtistId, setArtistCache, getCachedArtistImage, getCachedSpotifyId } from '../utils/artistCache';




export default function Home() {
  const [fetchingMbidForTrackId, setFetchingMbidForTrackId] = useState(null);

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
  const GENRES_PER_PAGE = 7;
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
  const ARTISTS_PER_PAGE = 7;
  const [analyzingArtistPlaylistId, setAnalyzingArtistPlaylistId] = useState(null);
  const [topData, setTopData] = useState(null);
  const [showTopModal, setShowTopModal] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
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

  // Add at the top of the Home component, after useState declarations
  const [dropdownOpen, setDropdownOpen] = useState(null); // row index for open dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);

  const [showNewArtistModal, setShowNewArtistModal] = useState(false);
  const [newArtistAnalysis, setNewArtistAnalysis] = useState(null);
  const [showNewGenreModal, setShowNewGenreModal] = useState(false);
  const [newGenreAnalysis, setNewGenreAnalysis] = useState(null);

  const [selectedTrackForContributors, setSelectedTrackForContributors] = useState(null);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [hoveredPlaylistIndex, setHoveredPlaylistIndex] = useState(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [timeRangeDropdownOpen, setTimeRangeDropdownOpen] = useState(false);
  const [timeRangeDropdownPosition, setTimeRangeDropdownPosition] = useState({ top: 0, left: 0 });
  const timeRangeButtonRef = useRef(null);

  const handleAnalyzeNewGenres = async (playlist) => {
    try {
        setAnalyzingPlaylistId(playlist.id);
        const res = await fetch(`http://127.0.0.1:8000/playlist-genres/${playlist.id}`);
        if (!res.ok) throw new Error('Failed to analyze playlist genres');
        const data = await res.json();
        const formattedData = Object.entries(data.genres).map(([name, count]) => ({
            name: name,
            'Number of Songs': count,
        }));
        setNewGenreAnalysis({ name: playlist.name, genres: formattedData });
        setShowNewGenreModal(true);
    } catch (error) {
        alert('Could not analyze playlist genres. Please try again.');
    } finally {
        setAnalyzingPlaylistId(null);
    }
};

const handleAnalyzeNewArtists = async (playlist) => {
    try {
        setAnalyzingArtistPlaylistId(playlist.id);
        const res = await fetch(`http://127.0.0.1:8000/playlist-artists/${playlist.id}`);
        if (!res.ok) throw new Error('Failed to analyze playlist artists');
        const data = await res.json();
        const formattedData = Object.entries(data.artists).map(([name, count]) => ({
            name: name,
            'Number of Songs': count,
        }));
        setNewArtistAnalysis({ name: playlist.name, artists: formattedData });
        setShowNewArtistModal(true);
    } catch (error) {
        alert('Could not analyze playlist artists. Please try again.');
    } finally {
        setAnalyzingArtistPlaylistId(null);
    }
};

const handleExploreContributions = async (track) => {
  if (!track || !track.id) return;

  setFetchingMbidForTrackId(track.id);
  const mbid = await getMbidForTrack(track);
  setFetchingMbidForTrackId(null);

  if (mbid) {
      // Store the entire track object, ensuring it has the found mbid
      setSelectedTrackForContributors({ ...track, mbid });
      setShowContributorModal(true);
  } else {
      alert("Could not find contributor information for this track. The ISRC or MusicBrainz ID could not be located.");
  }
};

  // Close dropdown on outside click
  useEffect(() => {
    if (dropdownOpen === null) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          (!buttonRefs.current[dropdownOpen] || !buttonRefs.current[dropdownOpen].contains(e.target))) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close time range dropdown on outside click
  useEffect(() => {
    if (!timeRangeDropdownOpen) return;
    function handleClick(e) {
      // Check if click is on the button or inside the dropdown
      const isButtonClick = timeRangeButtonRef.current && timeRangeButtonRef.current.contains(e.target);
      const isDropdownClick = e.target.closest('[data-dropdown="time-range"]');
      
      if (!isButtonClick && !isDropdownClick) {
        setTimeRangeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [timeRangeDropdownOpen]);

  // Dynamic API base URL based on current hostname
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === '192.168.1.4') {
      return 'http://192.168.1.4:8000';
    }
    return 'http://127.0.0.1:8000';
  };

  // This is the URL to our backend's login route
  // Always use 127.0.0.1 for login to avoid Spotify's HTTPS requirement
  const LOGIN_URL = 'http://127.0.0.1:8000/login';

  // This function runs when the page loads
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/me`)
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
      const res = await fetch(`${getApiBaseUrl()}/recent-tracks`);
      if (!res.ok) throw new Error('Failed to fetch recent tracks');
      const data = await res.json();
      
      // Filter out consecutive duplicates
      const tracks = data.tracks || [];
      const filteredTracks = tracks.filter((track, index) => {
        // Keep the first track
        if (index === 0) return true;
        // Remove if this track has the same ID as the previous track
        return track.id !== tracks[index - 1].id;
      });
      
      setSongs(filteredTracks);
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
      const res = await fetch(`${getApiBaseUrl()}/playlists`);
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
      const res = await fetch(`${getApiBaseUrl()}/audio-features/${song.id}`);
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
    const spotifyId = artistObj.spotifyId || artistObj.id;
    const name = artistObj.name;
    if (!spotifyId || !name) {
      // Do not add entry if no valid Spotify ID or name
      return;
    }
    let searches = getRecentSearches();
    // Remove any previous entry with the same name or spotifyId
    searches = searches.filter(
      s => s.name !== name && s.spotifyId !== spotifyId
    );
    const entry = {
      name,
      spotifyId,
      image: artistObj.image || (artistObj.images && artistObj.images[0]?.url) || null,
      ticketmasterId: artistObj.ticketmasterId || null,
    };
    searches = [entry, ...searches];
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearchInputFocus = () => {
    if (!(searchArtist || '').trim()) {
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

  // Retry function for API calls (same as concerts page)
  const fetchWithRetry = async (url, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        } else if (response.status === 500 && attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed with 500 error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  };

  const handleSuggestionClick = async (artist) => {
    // Use the exact name from Spotify to search Ticketmaster
    let spotifyId = artist.spotifyId || null;
    let image = artist.image || null;
    let genres = artist.genres || [];
    let ticketmasterId = null;
    
    // Check cache first
    const cachedId = getCachedArtistId(artist.name);
    if (cachedId) {
      console.log(`Found cached Ticketmaster ID for "${artist.name}": ${cachedId}`);
      ticketmasterId = cachedId;
      // Get cached image if available
      const cachedImage = getCachedArtistImage(artist.name);
      if (cachedImage && !image) {
        image = cachedImage;
      }
    } else {
      // Always use the Spotify name for Ticketmaster search
      try {
        const tmData = await fetchWithRetry(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(artist.name)}`);
        const attractions = tmData._embedded?.attractions || [];
        // Find an exact name match (case-insensitive)
        const exact = attractions.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
        if (exact && exact.id) {
          ticketmasterId = exact.id;
          // Cache the successful result with image and Spotify ID
          const imageUrl = exact.images?.[0]?.url || image;
          setArtistCache(artist.name, exact.id, imageUrl, spotifyId);
          console.log(`Cached Ticketmaster ID for "${artist.name}": ${exact.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
        }
      } catch (err) {
        console.error('Error searching Ticketmaster:', err);
      }
    }
    
    // Save full object to recents
    saveRecentSearch({ name: artist.name, spotifyId, ticketmasterId, image });
    setRecentSearches(getRecentSearches());
    setSearchArtist(artist.name);
    setShowSuggestions(false);
    // Only include name, spotifyId, and ticketmasterId in the URL
    const urlParamsArr = [
      `name=${encodeURIComponent(artist.name)}`
    ];
    if (spotifyId) urlParamsArr.push(`spotifyId=${spotifyId}`);
    if (ticketmasterId) urlParamsArr.push(`ticketmasterId=${ticketmasterId}`);
    const urlParams = urlParamsArr.join('&');
    router.push(`/artist?${urlParams}`);
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
    console.log('Navigating to:', endpoint);
    try {
      router.push(endpoint);
    } catch (error) {
      console.error('Navigation error:', error);
    }
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
        {/* Top Bar: centered search */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
  {/* MODIFIED: Added position: 'relative' to the form */}
  <form className={styles.topBar} onSubmit={e => e.preventDefault()} style={{ display: 'flex', width: '90%', position: 'relative' }}>
    <input
      type="text"
      className={styles.searchInput}
      placeholder="Search for an artist..."
      value={searchArtist || ""}
      onChange={handleArtistInput}
      onFocus={handleSearchInputFocus}
      onKeyDown={handleArtistKeyDown}
      autoComplete="off"
      ref={searchInputRef}
    />

    {/* MODIFIED: Moved the suggestions div inside the form */}
    {showSuggestions && artistSuggestions.length > 0 && (
      <div
        ref={suggestionsRef}
        style={{
          position: 'absolute',
          top: '100%', // This will now be 100% of the form's height
          left: 0,
          right: 0,
          background: '#232323',
          border: '1px solid #444',
          borderRadius: '8px',
          marginTop: '8px', // Added a small gap
          maxHeight: '320px',
          overflowY: 'auto',
          zIndex: 1000,
          width: '100%', // This is now 100% of the form's width
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
  </form>
</div>
        <main className={styles.main} style={{ padding: 0, margin: 0, background: '#101114', minHeight: '100vh', width: '100vw' }}>
          <UserProfile user={user} onLogout={handleLogout} clickableTitle={false} showSubtitle={false} onFeedback={() => setShowFeedbackModal(true)}>
            <h2 className={styles.reportTitle}>Create Your Listening Report</h2>
            <div className={styles.reportSubtitle}>Explore your top songs, favorite artists, and personal playlists.</div>
            
            {/* Analyze Buttons and Time Range Row */}
            <div className="responsive-container" style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '16px', 
              marginTop: '24px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              flexDirection: 'row'
            }}>
              {/* All Action Buttons with Equal Spacing */}
              <div className={styles.actionButtons} style={{ 
                display: 'flex', 
                gap: '16px', 
                flexWrap: 'wrap',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <button
  onClick={handleGenerateFromPlaylist}
  className={styles.mainActionButton}
  disabled={isAnalyzingPlaylists}
>
  {isAnalyzingPlaylists ? 'Analyzing...' : 'Analyze Your Playlists'}
</button>
                
                {/* Analyze Your Listening History Dropdown Button */}
                <div style={{ position: 'relative' }}>
                <button
  ref={timeRangeButtonRef}
  className={styles.mainActionButton}
  onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTimeRangeDropdownPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setTimeRangeDropdownOpen(!timeRangeDropdownOpen);
  }}
  
>
  Analyze Your Listening History
  <span style={{
    transform: timeRangeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  }}>
    ▼
  </span>
</button>
                
                {/* Analyze Your Listening History Dropdown */}
                {timeRangeDropdownOpen && (
                  <div
                    data-dropdown="time-range"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
                      zIndex: 1000,
                      minWidth: '140px',
                      overflow: 'hidden',
                      marginTop: '8px'
                    }}
                  >
                      <button 
                        className={styles.timeRangeButton}
                        onClick={(e) => {
                          console.log('Last 50 Songs button clicked!');
                          e.stopPropagation();
                          handleGenerateFromRecents();
                          setTimeout(() => setTimeRangeDropdownOpen(false), 100);
                        }}
                        style={{
                          width: '100%',
                          borderRadius: '0',
                          borderBottom: '1px solid #333',
                          background: 'transparent',
                          transition: 'background 0.2s ease',
                          fontSize: '0.85rem',
                          padding: '4px 8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Last 50 Songs
                      </button>
                      <button 
                        className={styles.timeRangeButton}
                        onClick={(e) => {
                          console.log('Last Month button clicked!');
                          e.stopPropagation();
                          handleTimeRangeNav('/last-4-weeks');
                          setTimeout(() => setTimeRangeDropdownOpen(false), 100);
                        }}
                        style={{
                          width: '100%',
                          borderRadius: '0',
                          borderBottom: '1px solid #333',
                          background: 'transparent',
                          transition: 'background 0.2s ease',
                          fontSize: '0.85rem',
                          padding: '4px 8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Last Month
                      </button>
                      <button 
                        className={styles.timeRangeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeRangeNav('/last-6-months');
                          setTimeout(() => setTimeRangeDropdownOpen(false), 100);
                        }}
                        style={{
                          width: '100%',
                          borderRadius: '0',
                          borderBottom: '1px solid #333',
                          background: 'transparent',
                          transition: 'background 0.2s ease',
                          fontSize: '0.85rem',
                          padding: '4px 8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Last 6 Months
                      </button>
                      <button 
                        className={styles.timeRangeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeRangeNav('/last-12-months');
                          setTimeout(() => setTimeRangeDropdownOpen(false), 100);
                        }}
                        style={{
                          width: '100%',
                          borderRadius: '0',
                          background: 'transparent',
                          transition: 'background 0.2s ease',
                          fontSize: '0.85rem',
                          padding: '4px 8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Last Year
                      </button>
                    </div>
                )}
              </div>
              </div>
              
              {/* Responsive CSS */}
              <style jsx>{`
                @media (max-width: 768px) {
                  .responsive-container {
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                  }
                
                  .responsive-container > div {
                    width: 100% !important;
                    max-width: 300px !important;
                    display: flex !important;
                    justify-content: center !important;
                  }

                  .profileContainer {
      /* Keep the container itself centered on the page */
      text-align: left !important;
    }

    .profileContainer > div {
      /* Align all content within the profile box to the left */
      align-items: flex-start !important;
      /* Add some space on the left for the profile image */
      padding-left: 24px !important; 
    }

    .profileContainer > div > div:first-child {
      /* This targets the row with the user image and name */
      justify-content: flex-start !important; /* Align this row to the left */
      flex-direction: row !important;
      gap: 16px !important;
      align-items: center !important;
      width: 100% !important;
    }
    
    .profileContainer > div > div:first-child > div:first-child {
      justify-content: flex-start !important;
    }

    .profileContainer .prettyName {
      /* Make the username bigger on mobile */
      font-size: 1.6rem !important; 
    }
    
    .profileContainer > div > div:first-child > div:last-child {
      /* Reposition the logout button correctly */
      position: absolute !important;
      top: 16px !important;
      right: 16px !important;
    }
                  
                }
                
                /* Additional mobile-specific styles */
                @media (max-width: 430px) {
                  // .actionButtons {
                  //   flex-direction: column !important;
                  //   gap: 12px !important;
                  // }
                  // .actionButtons button,
                  // .actionButtons > div {
                  //   width: 100% !important;
                  //   max-width: 300px !important;
                  // }
                  
                  /* Fix outer color elements for very small screens */
                  .profileContainer {
                    min-width: 280px !important;
                    max-width: 95% !important;
                    width: 95% !important;
                    padding: 20px 16px !important;
                    margin: 20px auto !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    background: #181818 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                  }
                  
                  .profileContainer::before {
                    width: 120% !important;
                    height: 120% !important;
                    top: -10% !important;
                    left: -10% !important;
                    animation: none !important;
                  }
                  
                  .profileContainer::after {
                    inset: 1px !important;
                    border-radius: 11px !important;
                  }
                }
                
                /* Desktop-specific styles for larger button text */
              
                
                /* Enable outer color elements only for screens > 430px */
                @media (min-width: 431px) {
                  .profileContainer {
                    background: linear-gradient(145deg, #181818 60%, #232323 100%) !important;
                    border: 2px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 0 24px rgba(0, 255, 255, 0.08) !important;
                  }
                  
                  .profileContainer::before {
                    display: block !important;
                  }
                  
                  .profileContainer::after {
                    display: block !important;
                  }
                }
                
                /* Fix user profile centering on small screens */
                @media (max-width: 768px) {
                  .profileContainer {
                    text-align: center !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                  }
                  .profileContainer > div {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-align: center !important;
                  }
                  .profileContainer > div > div:first-child {
                    justify-content: center !important;
                    flex-direction: column !important;
                    gap: 16px !important;
                    align-items: center !important;
                    width: 100% !important;
                  }
                  .profileContainer > div > div:first-child > div:first-child {
                    justify-content: center !important;
                    align-items: center !important;
                    width: 100% !important;
                  }
                  .profileContainer > div > div:first-child > div:last-child {
                    position: absolute !important;
                    top: 16px !important;
                    right: 16px !important;
                  }
                }
                
                /* Make everything smaller on mobile */
                @media (max-width: 768px) {
                  .profileContainer {
                    min-width: 300px !important;
                    max-width: 95% !important;
                    width: 95% !important;
                    padding: 16px !important;
                    margin-top: 32px !important;
                    margin-bottom: 64px !important;
                  }
                  
                  .profileContainer > div {
                    min-height: 120px !important;
                    padding: 8px !important;
                    margin: 2px auto !important;
                    border-radius: 8px !important;
                    max-width: 70% !important;
                    width: 70% !important;
                  }
                }
                
                /* iPhone 15 Pro Max and similar devices (430px width) */
                @media (max-width: 430px) {
                  .profileContainer {
                    min-width: 200px !important;
                    max-width: 60% !important;
                    width: 60% !important;
                    padding: 8px !important;
                    margin-top: 20px !important;
                    margin-bottom: 40px !important;
                  }
                  
                  /* Force override with higher specificity */
                  body .profileContainer,
                  html .profileContainer,
                  .main .profileContainer,
                  [class*="profileContainer"],
                  div[class*="profileContainer"] {
                    min-width: 200px !important;
                    max-width: 60% !important;
                    width: 60% !important;
                    padding: 8px !important;
                    margin-top: 20px !important;
                    margin-bottom: 40px !important;
                  }
                  
                  .profileContainer > div {
                    min-height: 60px !important;
                    padding: 4px !important;
                    margin: 1px auto !important;
                    border-radius: 6px !important;
                    max-width: 45% !important;
                    width: 45% !important;
                  }
                  
                  .profileContainer > div > div:first-child {
                    margin-bottom: 4px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > img {
                    width: 20px !important;
                    height: 20px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > div {
                    font-size: 0.4rem !important;
                  }
                  
                  /* Mobile styles removed - only apply to iPhone 15 Pro Max and smaller */
                  
                  .reportSubtitle {
                    font-size: 0.3rem !important;
                    line-height: 1.1 !important;
                    margin-bottom: 3px !important;
                  }
                  
                  .responsive-container {
                    margin-top: 4px !important;
                    gap: 3px !important;
                  }
                  
                  .responsive-container button {
                    font-size: 0.25rem !important;
                    padding: 1px 3px !important;
                    min-width: 30px !important;
                  }
                  
                  /* Time Range button and dropdown buttons */
                  .responsive-container button[class*="analyzeButton"] {
                    font-size: 0.6rem !important;
                    padding: 6px 12px !important;
                    min-width: 120px !important;
                    min-height: 30px !important;
                    font-weight: 600 !important;
                  }
                  
                  .responsive-container [data-dropdown="time-range"] button {
                    font-size: 1rem !important;
                    padding: 8px 16px !important;
                    min-height: 40px !important;
                    font-weight: 600 !important;
                  }
                  
                  // .responsive-container .actionButtons button {
                  //   font-size: 0.2rem !important;
                  //   padding: 1px 2px !important;
                  // }
                  
                  /* Make Find Concerts section smaller */
                  .profileContainer > div > div:nth-child(4) {
                    margin-top: 8px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 0.7rem !important;
                    margin-bottom: 3px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 0.5rem !important;
                    margin-bottom: 6px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) button {
                    font-size: 0.5rem !important;
                    padding: 4px 12px !important;
                  }
                }
                  
                  .profileContainer > div > div:first-child {
                    margin-bottom: 8px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > img {
                    width: 32px !important;
                    height: 32px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > div {
                    font-size: 0.8rem !important;
                  }
                  
                  .reportTitle {
                    font-size: 0.7rem !important;
                    margin-bottom: 4px !important;
                  }
                  
                  .reportSubtitle {
                    font-size: 0.5rem !important;
                    line-height: 1.1 !important;
                    margin-bottom: 6px !important;
                  }
                  
                  .responsive-container {
                    margin-top: 8px !important;
                    gap: 6px !important;
                  }
                  
                  .responsive-container button {
                    font-size: 0.7rem !important;
                    padding: 6px 12px !important;
                    min-width: 100px !important;
                  }
                  
                  /* Time Range button and dropdown buttons */
                  .responsive-container button[class*="analyzeButton"] {
                    font-size: 0.6rem !important;
                    padding: 6px 12px !important;
                    min-width: 120px !important;
                    min-height: 30px !important;
                    font-weight: 600 !important;
                  }
                  
                  .responsive-container [data-dropdown="time-range"] button {
                    font-size: 1rem !important;
                    padding: 8px 16px !important;
                    min-height: 40px !important;
                    font-weight: 600 !important;
                  }
                  
                  // .responsive-container .actionButtons button {
                  //   font-size: 0.65rem !important;
                  //   padding: 4px 8px !important;
                  // }
                  
                  /* Make Find Concerts section smaller */
                  .profileContainer > div > div:nth-child(4) {
                    margin-top: 12px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 0.9rem !important;
                    margin-bottom: 4px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 0.65rem !important;
                    margin-bottom: 8px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) button {
                    font-size: 0.7rem !important;
                    padding: 6px 16px !important;
                  }
                }
                
                /* Ultra compact for phones */
                @media (max-width: 360px) {
                  .profileContainer > div {
                    min-height: 80px !important;
                    padding: 4px !important;
                    margin: 1px auto !important;
                    max-width: 60% !important;
                    width: 60% !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > img {
                    width: 28px !important;
                    height: 28px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > div {
                    font-size: 0.7rem !important;
                  }
                  
                  .reportTitle {
                    font-size: 0.85rem !important;
                    margin-bottom: 6px !important;
                  }
                  
                  .reportSubtitle {
                    font-size: 0.6rem !important;
                    margin-bottom: 8px !important;
                  }
                  
                  .responsive-container {
                    margin-top: 8px !important;
                    gap: 6px !important;
                  }
                  
                  .responsive-container button {
                    font-size: 0.55rem !important;
                    padding: 3px 6px !important;
                    min-width: 70px !important;
                  }
                  
                  /* Time Range button and dropdown buttons */
                  .responsive-container button[class*="analyzeButton"] {
                    font-size: 0.6rem !important;
                    padding: 6px 12px !important;
                    min-width: 120px !important;
                    min-height: 30px !important;
                    font-weight: 600 !important;
                  }
                  
                  .responsive-container [data-dropdown="time-range"] button {
                    font-size: 0.5rem !important;
                    padding: 2px 4px !important;
                  }
                  
                  // .responsive-container .actionButtons button {
                  //   font-size: 0.5rem !important;
                  //   padding: 2px 4px !important;
                  // }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 0.7rem !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 0.5rem !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) button {
                    font-size: 0.55rem !important;
                    padding: 3px 10px !important;
                  }
                }
                
                /* Extra narrow screens */
                // @media (max-width: 320px) {
                //   .profileContainer > div {
                //     min-height: 80px !important;
                //     padding: 2px !important;
                //     margin: 1px auto !important;
                //     max-width: 60% !important;
                //     width: 60% !important;
                //   }
                  
                //   .profileContainer > div > div:first-child > div:first-child > img {
                //     width: 20px !important;
                //     height: 20px !important;
                //   }
                  
                //   .profileContainer > div > div:first-child > div:first-child > div {
                //     font-size: 0.5rem !important;
                //   }
                  
                //   .reportTitle {
                //     font-size: 0.65rem !important;
                //     margin-bottom: 3px !important;
                //   }
                  
                //   .reportSubtitle {
                //     font-size: 0.4rem !important;
                //     margin-bottom: 4px !important;
                //   }
                  
                //   .responsive-container {
                //     margin-top: 4px !important;
                //     gap: 3px !important;
                //   }
                  
                //   .responsive-container button {
                //     font-size: 0.35rem !important;
                //     padding: 1px 3px !important;
                //     min-width: 50px !important;
                //   }
                  
                //   /* Time Range button and dropdown buttons */
                //   .responsive-container button[class*="analyzeButton"] {
                //     font-size: 0.6rem !important;
                //     padding: 6px 12px !important;
                //     min-width: 120px !important;
                //     min-height: 30px !important;
                //     font-weight: 600 !important;
                //   }
                  
                //   .responsive-container [data-dropdown="time-range"] button {
                //     font-size: 0.3rem !important;
                //     padding: 1px 2px !important;
                //   }
                  
                //   // .responsive-container .actionButtons button {
                //   //   font-size: 0.3rem !important;
                //   //   padding: 1px 2px !important;
                //   // }
                  
                //   .profileContainer > div > div:nth-child(4) h3 {
                //     font-size: 0.5rem !important;
                //   }
                  
                //   .profileContainer > div > div:nth-child(4) p {
                //     font-size: 0.3rem !important;
                //   }
                  
                //   .profileContainer > div > div:nth-child(4) button {
                //     font-size: 0.35rem !important;
                //     padding: 1px 6px !important;
                //   }
                // }
                
                /* Super compact for very small screens */
                @media (max-width: 280px) {
                  .profileContainer > div {
                    min-height: 60px !important;
                    padding: 1px !important;
                    margin: 0 auto !important;
                    max-width: 50% !important;
                    width: 50% !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > img {
                    width: 16px !important;
                    height: 16px !important;
                  }
                  
                  .profileContainer > div > div:first-child > div:first-child > div {
                    font-size: 0.4rem !important;
                  }
                  
                  .reportTitle {
                    font-size: 0.55rem !important;
                    margin-bottom: 2px !important;
                  }
                  
                  .reportSubtitle {
                    font-size: 0.3rem !important;
                    margin-bottom: 3px !important;
                  }
                  
                  .responsive-container {
                    margin-top: 3px !important;
                    gap: 2px !important;
                  }
                  
                  .responsive-container button {
                    font-size: 0.25rem !important;
                    padding: 1px 2px !important;
                    min-width: 40px !important;
                  }
                  
                  /* Time Range button and dropdown buttons */
                  .responsive-container button[class*="analyzeButton"] {
                    font-size: 0.6rem !important;
                    padding: 6px 12px !important;
                    min-width: 120px !important;
                    min-height: 30px !important;
                    font-weight: 600 !important;
                  }
                  
                  .responsive-container [data-dropdown="time-range"] button {
                    font-size: 0.2rem !important;
                    padding: 1px 1px !important;
                  }
                  
                  // .responsive-container .actionButtons button {
                  //   font-size: 0.2rem !important;
                  //   padding: 1px 1px !important;
                  // }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 0.4rem !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 0.25rem !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) button {
                    font-size: 0.3rem !important;
                    padding: 1px 4px !important;
                  }
                }
                /* Desktop styles - ensure proper sizing for larger screens */
                @media (min-width: 769px) {
                  .reportTitle {
                    font-size: 2.1rem !important;
                    margin-bottom: 18px !important;
                  }
                  
                  .reportSubtitle {
                    font-size: 1.3rem !important;
                    margin-bottom: 28px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 1.5rem !important;
                    margin-bottom: 8px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 1.1rem !important;
                    margin-bottom: 20px !important;
                  }
                }
                
                /* Mobile-specific styles - only for phones */
                @media (max-width: 430px) {
                  .reportTitle {
                    font-size: 1.1rem !important;
                    margin-bottom: 2px !important;
                  }
                  
                  /* Force override for the title on mobile only */
                  .profileContainer h2,
                  .profileContainer .reportTitle,
                  .profileContainer > div > div:nth-child(2) h2 {
                    font-size: 1.1rem !important;
                    margin-bottom: 2px !important;
                  }
                  
                  .reportSubtitle {
                    font-size: 0.9rem !important;
                    margin-bottom: 4px !important;
                  }
                  
                  /* Force override for the title on mobile only */
                  .profileContainer h2,
                  .profileContainer .reportTitle,
                  .profileContainer > div > div:nth-child(2) h2 {
                    font-size: 1.1rem !important;
                    margin-bottom: 2px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) h3 {
                    font-size: 1.1rem !important;
                    margin-bottom: 2px !important;
                  }
                  
                  .profileContainer > div > div:nth-child(4) p {
                    font-size: 0.9rem !important;
                    margin-bottom: 3px !important;
                  }
                }
              `}</style>
            </div>
            

        
        {/* Horizontal line */}
        <div style={{ 
          width: '100%', 
          height: '2px', 
          background: '#333', 
          margin: '16px 0',
          opacity: 0.6
        }}></div>
        
        {/* Find Concerts Section */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '2.1rem', 
            fontWeight: 800, 
            marginBottom: 10,
            marginTop: 0
          }}>
            Find Concerts For You
          </h3>
          <p style={{ 
            color: '#b3b3b3', 
            fontSize: '1.1rem', 
            marginBottom: 24,
            lineHeight: 1.4,
            textAlign: 'center'
          }}>
            Use your listening report to discover upcoming shows from your favorite artists.
          </p>
          <button 
            onClick={() => router.push('/concerts')} 
            style={{
              background: '#1db954',
              color: '#000',
              border: 'none',
              borderRadius: 25,
              padding: '12px 32px',
              fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(29, 185, 84, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1ed760';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(29, 185, 84, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1db954';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(29, 185, 84, 0.3)';
            }}
          >
            Find Concerts
          </button>
        </div>
          </UserProfile>
          {/* Removed empty state message */}
          <div className={styles.dashboardContentArea}>
            <div className={styles.resultsCard}>
       {/* Table section for last 50 songs */}
       {showSongsTable && (
        <div 
          ref={tableRef} 
          style={{ 
            display: 'flex', 
            justifyContent: 'center' 
          }}
        >
          <NewTrackTable
            tracks={songs}
            title="Your Last 50 Songs"
            playlistKey="last50"
            loading={isAnalyzingRecents}
            error={null}
            onExploreGenre={handleExploreGenre}
                // Add the new prop on the next line
                onExploreContributions={handleExploreContributions}
          />
        </div>
      
      )}
      {/* Table section for playlists */}
      {showPlaylistsTable && playlists.length > 0 && (
        <div ref={playlistsTableRef} style={{
          background: '#181818',
          borderRadius: 18,
          padding: '3vw 2vw 2vw 2vw',
          margin: '3vw auto',
          maxWidth: '98vw',
          width: '90vw',
          boxShadow: '0 4px 32px #0003',
          position: 'relative',
          minHeight: 120,
          fontSize: 'clamp(0.85rem, 1.1vw, 1.08rem)',
        }}>
          <span
            style={{ position: 'absolute', top: 8, right: 12, cursor: 'pointer', fontSize: 20, color: '#888', zIndex: 2 }}
            title="Hide table"
            onClick={handleHidePlaylistsTable}
          >
            ×
          </span>
                     <h1 className="text-2xl font-bold mb-6" style={{
                       fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
                       fontWeight: 900,
                       color: '#f3f3f3',
                       letterSpacing: 1,
                       textShadow: '0 2px 8px #0008',
                       marginBottom: 24,
                     }}>
                       Your Playlists
                     </h1>
                     {/* The grid is responsive. It will show 2 columns on mobile, and more on larger screens. */}
                     <div className="grid grid-cols-2 gap-4" style={{
                       display: 'grid',
                       gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                       gap: 'clamp(12px, 2vw, 24px)',
                       justifyContent: 'center',
                       alignItems: 'flex-start',
                       justifyItems: 'center',
                       width: '100%',
                       minHeight: 120,
                     }}>
            {playlists.map((playlist, idx) => {
              const palette = ['#7c6fc9','#b86b4b','#4b8bb8','#000000','#c92b2b','#f7f7c2','#1db954','#f87171','#fbbf24','#818cf8'];
              const color = palette[idx % palette.length];
              return (
                                    <div
                      key={playlist.id || playlist.name || idx}
                      className="bg-[#181818] rounded-lg p-3 group"
                      style={{
                        background: '#181818',
                        borderRadius: 8,
                        padding: 12,
                        cursor: playlist.external_urls?.spotify ? 'pointer' : 'default',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                  onClick={() => {
                    if (playlist.external_urls?.spotify) {
                      window.open(playlist.external_urls.spotify, '_blank');
                    }
                  }}
                  onMouseEnter={() => setHoveredPlaylistIndex(idx)}
                  onMouseLeave={() => setHoveredPlaylistIndex(null)}
                >

                  {/* Cover */}
                  <div className="relative mb-3 playlist-card">
                    {playlist.images && playlist.images.length > 0 ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-full h-auto rounded-md transition-all duration-300"
                        style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: 6,
                          objectFit: 'cover',
                          transition: 'all 0.3s',
                        }}
                      />
                    ) : (
                      <div className="w-full h-auto rounded-md transition-all duration-300" style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: 6,
                        background: color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.5rem',
                        transition: 'all 0.3s',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                      }}>{playlist.name?.split(' ')[0]?.slice(0,8) || '?'}</div>
                    )}
                                    </div>
                  {/* Playlist name */}
                  <div>
                    <h3 className="font-bold text-white text-sm truncate" style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#fff',
                      marginBottom: 4,
                      textAlign: 'left',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{playlist.name}</h3>
                    <p className="text-xs text-gray-400" style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      marginBottom: 0,
                      textAlign: 'left',
                    }}>{playlist.trackCount} tracks • {playlist.totalDurationMs ? `${Math.floor(playlist.totalDurationMs / 3600000)}h ${Math.floor((playlist.totalDurationMs % 3600000) / 60000)}m` : ''}</p>
                  </div>
                  
                  {/* Overlay with action buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-md overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    opacity: hoveredPlaylistIndex === idx ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: hoveredPlaylistIndex === idx ? 'auto' : 'none',
                  }}>
                    <button 
                      className="bg-gray-800 bg-opacity-75 hover:bg-opacity-100 text-white font-semibold py-1 px-3 rounded-full text-xs mb-2 transition-all"
                      style={{
                        background: '#374151',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        marginBottom: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleAnalyzeNewGenres(playlist);
                      }}
                    >
                      Genres
                    </button>
                    <button 
                      className="bg-gray-800 bg-opacity-75 hover:bg-opacity-100 text-white font-semibold py-1 px-3 rounded-full text-xs mb-2 transition-all"
                      style={{
                        background: '#374151',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        marginBottom: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleAnalyzeNewArtists(playlist);
                      }}
                    >
                      Artists
                    </button>
                    <a
                      href={`https://open.spotify.com/playlist/${playlist.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center transform transition-transform duration-200 hover:scale-110"
                      style={{
                        width: 40,
                        height: 40,
                        background: '#1db954',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        textDecoration: 'none',
                      }}
                      title="Play on Spotify"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20, color: '#000' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </a>
                  </div>
                  
                  {/* Responsive text sizing CSS */}
                  <style jsx>{`
                    @media (max-width: 1000px) {
                      .playlist-name {
                        font-size: 0.9rem !important;
                      }
                      .playlist-details {
                        font-size: 0.75rem !important;
                      }
                    }
                    
                    /* Below 750px - make nodes smaller to fit more */
                    @media (max-width: 750px) {
                      .playlist-node {
                        min-width: 120px !important;
                        max-width: 140px !important;
                        padding: 12px !important;
                      }
                      
                      .playlist-node img {
                        width: 80px !important;
                        height: 80px !important;
                        margin-bottom: 12px !important;
                      }
                      
                      .playlist-name {
                        font-size: 0.85rem !important;
                        margin-bottom: 6px !important;
                      }
                      
                      .playlist-details {
                        font-size: 0.7rem !important;
                      }
                      
                      /* Adjust grid for smaller nodes */
                      .playlist-grid {
                        gap: 12px !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                      }
                    }
                    
                    /* Below 600px - even smaller nodes */
                    @media (max-width: 600px) {
                      .playlist-node {
                        min-width: 120px !important;
                        max-width: 140px !important;
                        padding: 10px !important;
                      }
                      
                      .playlist-node img {
                        width: 80px !important;
                        height: 80px !important;
                        margin-bottom: 10px !important;
                      }
                      
                      .playlist-name {
                        font-size: 0.8rem !important;
                        margin-bottom: 4px !important;
                      }
                      
                      .playlist-details {
                        font-size: 0.65rem !important;
                      }
                      
                      .playlist-grid {
                        gap: 8px !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                      }
                    }
                    
                    /* Below 750px - make nodes smaller to fit more */
                    @media (max-width: 750px) {
                      .playlist-node {
                        min-width: 100px !important;
                        max-width: 120px !important;
                        padding: 8px !important;
                      }
                      
                      .playlist-node img {
                        width: 70px !important;
                        height: 70px !important;
                        margin-bottom: 8px !important;
                      }
                      
                      .playlist-name {
                        font-size: 0.8rem !important;
                        margin-bottom: 4px !important;
                      }
                      
                      .playlist-details {
                        font-size: 0.65rem !important;
                      }
                      
                      /* Adjust grid for smaller nodes */
                      .playlist-grid {
                        gap: 10px !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        justify-content: center !important;
                        justify-items: center !important;
                      }
                    }
                    
                    /* Below 499px - ensure minimum 2 columns */
                    @media (max-width: 499px) {
                      .playlist-node {
                        min-width: 80px !important;
                        max-width: 100px !important;
                        padding: 6px !important;
                        width: 80px !important;
                      }
                      
                      .playlist-node img {
                        width: 60px !important;
                        height: 60px !important;
                        margin-bottom: 6px !important;
                      }
                      
                      .playlist-name {
                        font-size: 0.7rem !important;
                        margin-bottom: 3px !important;
                      }
                      
                      .playlist-details {
                        font-size: 0.55rem !important;
                      }
                      
                      .playlist-grid {
                        gap: 6px !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        justify-content: center !important;
                        justify-items: center !important;
                        max-width: 300px !important;
                        margin: 0 auto !important;
                      }
                      
                      /* Force override inline styles */
                      .playlist-node[style*="minWidth"] {
                        min-width: 80px !important;
                        max-width: 100px !important;
                        width: 80px !important;
                      }
                    }
                    
                    @media (min-width: 501px) and (max-width: 900px) {
                      .playlist-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 20px !important;
                      }
                      .playlist-node {
                        min-width: 180px !important;
                        max-width: 200px !important;
                      }
                    }
                    
                    @media (min-width: 901px) {
                      .playlist-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 24px !important;
                        justify-content: center !important;
                      }
                      .playlist-node {
                        min-width: 200px !important;
                        max-width: 240px !important;
                      }
                    }
                  `}</style>
                  

                  

                </div>
              );
            })}
          </div>


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
                        ticks: { maxRotation: 0, minRotation: 0, autoSkip: false, padding: 10 },
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
                        ticks: { maxRotation: 0, minRotation: 0, autoSkip: false, padding: 10 },
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

            {/* New Artist Analysis Modal */}
      {showNewArtistModal && newArtistAnalysis && (
          <StyledModal
              isOpen={showNewArtistModal}
              onClose={() => setShowNewArtistModal(false)}
              title={`Artist Analysis for ${newArtistAnalysis.name}`}
          >
              <StyledAnalysisChart
                  data={newArtistAnalysis.artists}
                  xAxisKey="name"
                  yAxisLabel="Number of Songs"
              />
          </StyledModal>
      )}

      {/* New Genre Analysis Modal */}
      {showNewGenreModal && newGenreAnalysis && (
          <StyledModal
              isOpen={showNewGenreModal}
              onClose={() => setShowNewGenreModal(false)}
              title={`Genre Analysis for ${newGenreAnalysis.name}`}
          >
              <StyledAnalysisChart
                  data={newGenreAnalysis.genres}
                  xAxisKey="name"
                  yAxisLabel="Number of Songs"
              />
          </StyledModal>
      )}

      {/* Add the Contributor Modal here */}
      {showContributorModal && selectedTrackForContributors && (
          <StyledModal
              isOpen={showContributorModal}
              onClose={() => setShowContributorModal(false)}
              title={`Contributors for ${selectedTrackForContributors.name}`}
          >
              <ContributorFinder mbid={selectedTrackForContributors.mbid} />
          </StyledModal>
      )}
      

    </main>
      </div>
    </div>
  );
}