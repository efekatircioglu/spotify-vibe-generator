'use client'; // This is a client component, so we can use hooks

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../page.module.css';
import React from 'react';
import { useRouter } from 'next/navigation';
import SongAnalysisModal from '../../components/SongAnalysisModal';
import NewTrackTable from '../../components/NewTrackTable';
import UserProfile from '../../components/UserProfile';
import ArtistSearch from '../../components/ArtistSearch';
import ConcertsList from '../../components/ConcertsList';
import Sidebar from '../../components/Sidebar';
import GenreLeaderboardChart from '../../components/GenreLeaderboardChart';
import WrappedAnalysisModal from '../../components/WrappedAnalysisModal';
import { getCachedArtistId, setArtistCache, getCachedArtistImage, getCachedSpotifyId } from '../../utils/artistCache';
import { getRecentSearches, saveRecentSearch } from '../../utils/recentSearchesCache';
import '../../utils/storageMonitor'; // Import storage monitoring utilities
import QuickStats from '../../components/QuickStats/index';
import TopDataCacheInitializer from '../../components/TopDataCacheInitializer';
import { getApiBaseUrl, LOGIN_URL } from '../../config/api';
import { initializeAllCaches, cleanupLocalStorageTokens } from '../../utils/cacheManager';




export default function Home() {
  /*
   * MOBILE DETECTION & PLAYLIST CONTROLS
   * 
   * This app automatically detects if the user is on a mobile device or desktop:
   * 
   * 1. Screen Size Detection: Devices with width <= 768px are considered small screens
   * 2. Touch Capability Detection: Checks if device supports touch events
   * 3. Pointer Capability Detection: Checks if device has fine pointer (mouse) vs coarse pointer (touch)
   * 
   * Mobile devices are identified as:
   * - Small screens (<= 768px) OR
   * - Devices with touch but no mouse
   * 
   * On mobile devices:
   * - Playlist controls (Genres, Artists, Play buttons) are hidden by default
   * - Tapping a playlist shows controls for 3 seconds
   * - Controls automatically hide after 3 seconds
   * 
   * On desktop devices:
   * - Playlist controls appear on hover
   * - No automatic hiding
   * 
   * Usage:
   * - Use `isMobile` state variable to check current device type
   * - Use `isDeviceMobile()` function for real-time device detection
   * - Use `mobilePlaylistControlsIndex` to track which playlist controls are visible
   */
  


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
  const [showPlaylistsTable, setShowPlaylistsTable] = useState(false);
  const [artistAnalysis, setArtistAnalysis] = useState(null);
  const [analyzingArtistPlaylistId, setAnalyzingArtistPlaylistId] = useState(null);
  const [topData, setTopData] = useState(null);
  const [showTopModal, setShowTopModal] = useState(false);
  const [topLoading, setTopLoading] = useState(false);

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


  const [hoveredPlaylistIndex, setHoveredPlaylistIndex] = useState(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [timeRangeDropdownOpen, setTimeRangeDropdownOpen] = useState(false);
  const [timeRangeDropdownPosition, setTimeRangeDropdownPosition] = useState({ top: 0, left: 0 });
  const timeRangeButtonRef = useRef(null);
  
  // Mobile playlist controls state
  const [mobilePlaylistControlsIndex, setMobilePlaylistControlsIndex] = useState(null);
  const mobileControlsTimerRef = useRef(null);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetectionComplete, setDeviceDetectionComplete] = useState(false);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Wrapped modal state
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [selectedPlaylistForWrapped, setSelectedPlaylistForWrapped] = useState(null);

  // Handle mobile playlist press to show controls for 3 seconds
  const handleMobilePlaylistPress = (idx) => {
    // Clear any existing timer
    if (mobileControlsTimerRef.current) {
      clearTimeout(mobileControlsTimerRef.current);
    }
    
    // Clear any existing hover state to prevent conflicts
    setHoveredPlaylistIndex(null);
    
    // Show controls
    setMobilePlaylistControlsIndex(idx);
    
    // Add haptic feedback on mobile devices (if supported)
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50); // Short vibration
    }
    
    // Hide controls after 3 seconds
    mobileControlsTimerRef.current = setTimeout(() => {
      setMobilePlaylistControlsIndex(null);
      // Also clear hover state to ensure clean transition
      setHoveredPlaylistIndex(null);
    }, 3000);
  };

  // Utility function to check if device is mobile (can be used throughout the app)
  const isDeviceMobile = () => {
    // Check screen width
    const isSmallScreen = window.innerWidth <= 768;
    
    // Check for touch capabilities
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check for pointer capabilities (mouse vs touch)
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    
    // Consider mobile if small screen OR has touch but no mouse
    return isSmallScreen || (hasTouch && !hasMouse);
  };

  const handleAnalyzeNewGenres = async (playlist) => {
    try {
        setAnalyzingPlaylistId(playlist.id);
        const res = await fetch(`${getApiBaseUrl()}/playlist-genres/${playlist.id}`);
        if (!res.ok) throw new Error('Failed to analyze playlist genres');
        const data = await res.json();
        // GenreLeaderboardChart expects: { genreName: count, ... }
        setNewGenreAnalysis({ 
            name: playlist.name, 
            genres: data.genres,
            genreDetails: data.genreDetails || {}
        });
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
      const res = await fetch(`${getApiBaseUrl()}/playlist-artists/${playlist.id}`);
      if (!res.ok) throw new Error('Failed to analyze playlist artists');
      const data = await res.json();
      // GenreLeaderboardChart expects: { artistName: count, ... }
      setNewArtistAnalysis({ 
          name: playlist.name, 
          artists: data.artists,
          artistDetails: data.artistDetails || {}
      });
      setShowNewArtistModal(true);
    } catch (error) {
      alert('Could not analyze playlist artists. Please try again.');
    } finally {
      setAnalyzingArtistPlaylistId(null);
    }
  };

  const handleCreatePlaylistWrapped = async (playlist) => {
    try {
      // Fetch playlist tracks for wrapped analysis (same pattern as Genres feature)
      const res = await fetch(`${getApiBaseUrl()}/playlist-tracks-for-wrapped/${playlist.id}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch playlist tracks for wrapped: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const tracks = data.tracks || [];
      
      if (tracks.length === 0) {
        alert('No tracks found in this playlist.');
        return;
      }
      
      // Open the wrapped analysis modal with the playlist tracks
      setSelectedPlaylistForWrapped({
        ...playlist,
        tracks: tracks
      });
      setShowWrappedModal(true);
    } catch (error) {
      console.error('Error creating playlist wrapped:', error);
      alert(`Could not create playlist wrapped: ${error.message}`);
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

  const handleGenerateFromRecents = useCallback(async () => {
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
    } catch (error) {
      alert('Could not fetch recent tracks. Please try again.');
    } finally {
      setIsAnalyzingRecents(false);
    }
  }, []);

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
        // Clean up localStorage tokens for security
        cleanupLocalStorageTokens();
        // Initialize caches when user is logged in
        initializeAllCaches();
        // Auto-load last 50 songs when user is logged in (playlists will be loaded manually)
        handleGenerateFromRecents();
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
  }, [handleGenerateFromRecents]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);



  const handleGenerateFromPlaylist = async () => {
    setIsAnalyzingPlaylists(true);
    setShowPlaylistsTable(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/playlists-with-duration`);
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      setPlaylists(data.playlists || []);
      
      // Scroll to playlists section after a short delay to ensure it's rendered
      setTimeout(() => {
        if (playlistsTableRef.current) {
          playlistsTableRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
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
      const res = await fetch(`${getApiBaseUrl()}/playlist-genres/${playlist.id}`);
      if (!res.ok) throw new Error('Failed to analyze playlist genres');
      const data = await res.json();
      setGenreAnalysis({ name: playlist.name, genres: data.genres });
      // Don't show the old modal - let the GenreLeaderboardChart appear in the main page
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
      const res = await fetch(`${getApiBaseUrl()}/playlist-artists/${playlist.id}`);
      if (!res.ok) throw new Error('Failed to analyze playlist artists');
      const data = await res.json();
      setArtistAnalysis({ 
        name: playlist.name, 
        artists: data.artists,
        artistDetails: data.artistDetails || {}
      });
      // Don't show the old modal - let the GenreLeaderboardChart appear in the main page
    } catch (error) {
      alert('Could not analyze playlist artists. Please try again.');
    } finally {
      setAnalyzingArtistPlaylistId(null);
    }
  };



  const handleConcertSearch = async (artistNameParam) => {
    setConcertError('');
    setConcerts([]);
    const searchName = artistNameParam || concertArtist;
    if (!searchName) return;
    setConcertSearchLoading(true);
    try {
      // 1. Search for artist
      const res1 = await fetch(`${getApiBaseUrl()}/concerts/artist-search?name=${encodeURIComponent(searchName)}`);
      if (!res1.ok) throw new Error('Failed to search artist');
      const data1 = await res1.json();
      const attractions = data1._embedded?.attractions || [];
      if (attractions.length === 0) throw new Error('No artist found');
      const artistId = attractions[0].id;
      // 2. Get events
      const res2 = await fetch(`${getApiBaseUrl()}/concerts/events?artistId=${artistId}`);
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
  // Note: getRecentSearches and saveRecentSearch are now imported from recentSearchesCache.js
  // These functions include localStorage quota protection and automatic cleanup

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);
  
  // Cleanup mobile controls timer on unmount
  useEffect(() => {
    return () => {
      if (mobileControlsTimerRef.current) {
        clearTimeout(mobileControlsTimerRef.current);
      }
    };
  }, []);

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (showNewArtistModal || showNewGenreModal || showWrappedModal || showInfoModal || showMetricsModal || showTopModal || showPlaylistModal) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Method 1: Prevent scrolling by setting body to fixed position and overflow hidden
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Method 2: Also prevent scroll on html element for extra security
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showNewArtistModal, showNewGenreModal, showWrappedModal, showInfoModal, showMetricsModal, showTopModal, showPlaylistModal]);
  

  
  // Clear mobile controls when component unmounts or when manually clearing
  useEffect(() => {
    if (mobilePlaylistControlsIndex === null) {
      // Ensure hover state is also cleared when mobile controls are hidden
      setHoveredPlaylistIndex(null);
    }
  }, [mobilePlaylistControlsIndex]);
  
  // Enhanced mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth <= 768;
      
      // Check for touch capabilities
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check for pointer capabilities (mouse vs touch)
      const hasMouse = window.matchMedia('(pointer: fine)').matches;
      
      // Consider mobile if small screen OR has touch but no mouse
      const isMobileDevice = isSmallScreen || (hasTouch && !hasMouse);
      
      setIsMobile(isMobileDevice);
      setDeviceDetectionComplete(true);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Add orientation change listener for mobile devices
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
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
          const spRes = await fetch(`${getApiBaseUrl()}/spotify/artist-search?name=${encodeURIComponent(value)}`);
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
          const tmRes = await fetch(`${getApiBaseUrl()}/concerts/artist-search?name=${encodeURIComponent(value)}`);
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
      ticketmasterId = cachedId;
      // Get cached image if available
      const cachedImage = getCachedArtistImage(artist.name);
      if (cachedImage && !image) {
        image = cachedImage;
      }
    } else {
      // Always use the Spotify name for Ticketmaster search
      try {
        const tmData = await fetchWithRetry(`${getApiBaseUrl()}/concerts/artist-search?name=${encodeURIComponent(artist.name)}`);
        const attractions = tmData._embedded?.attractions || [];
        // Find an exact name match (case-insensitive)
        const exact = attractions.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
        if (exact && exact.id) {
          ticketmasterId = exact.id;
          // Cache the successful result with image and Spotify ID
          const imageUrl = exact.images?.[0]?.url || image;
          setArtistCache(artist.name, exact.id, imageUrl, spotifyId);
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
    const tmRes = await fetch(`${getApiBaseUrl()}/concerts/artist-search?name=${encodeURIComponent(searchArtist)}`);
    const tmData = await tmRes.json();
    // Optionally extract ticketmasterId, spotifyId from tmData

    // 2. Call Spotify
    const spRes = await fetch(`${getApiBaseUrl()}/spotify/artist-search?name=${encodeURIComponent(searchArtist)}`);
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
        fetch(`${getApiBaseUrl()}/top-tracks?time_range=${time_range}`),
        fetch(`${getApiBaseUrl()}/top-artists?time_range=${time_range}`)
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
    try {
      router.push(endpoint);
    } catch (error) {
        console.error('Navigation error:', error);
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
      
      const response = await fetch(`${getApiBaseUrl()}/create-playlist`, {
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
            // Try to save playlist URL to cache
        try {
          localStorage.setItem('last50songs_playlist_url', result.playlistUrl);
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            console.warn('Cannot save playlist URL - storage quota exceeded');
          }
        }
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

  // --- LOGGED IN ---
  const handleLogout = async () => {
    await fetch(`${getApiBaseUrl()}/logout`);
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

  // Don't render until device detection is complete to prevent hydration mismatch
  if (!deviceDetectionComplete) {
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

  // Desktop vs Mobile layout logic
  const isDesktop = !isMobile;

  return (
    <>
      <TopDataCacheInitializer />
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div className={`${styles.dashboardBackground} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.dashboardContainer}>
        <main className={styles.main} style={{ padding: 0, margin: 0, background: '#101114', minHeight: '100vh', width: '100vw' }}>
          {/* New Artist-Style Header */}
          <div
            className="dashboard-header-container"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: isDesktop ? 'flex-start' : 'center',
              gap: isDesktop ? '48px' : 'clamp(16px, 3vw, 32px)',
              minHeight: isDesktop ? '400px' : 'clamp(300px, 50vh, 500px)',
              width: '100vw',
              borderRadius: '0 0 32px 32px',
              boxShadow: '0 4px 32px #0002',
              padding: isDesktop ? '48px 64px' : 'clamp(24px, 6vh, 48px) clamp(24px, 5vw, 64px)',
              overflow: 'hidden',
              zIndex: 10,
              marginTop: '-32px',
              background: 'none',
              boxSizing: 'border-box',
            }}
          >
            {/* Blurred, stretched background image */}
            {user?.images?.[0]?.url && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url('${user.images[0].url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(22px) brightness(0.7)',
                  zIndex: 1,
                }}
              />
            )}
            {/* Dark overlay for contrast */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(16,17,20,0.7)',
                zIndex: 2,
              }}
            />
            
            {/* Main content */}
            {user?.images?.[0]?.url && (
              <img 
                src={user.images[0].url} 
                alt={user.display_name || 'User'} 
                style={{ 
                  width: isDesktop ? '180px' : 'clamp(120px, 25vw, 180px)', 
                  aspectRatio: '1 / 1',
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  boxShadow: '0 4px 24px #0004', 
                  border: '4px solid #fff', 
                  zIndex: 4,
                  marginTop: isDesktop ? '0' : 'clamp(16px, 4vh, 24px)'
                }} 
              />
            )}
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: isDesktop ? 'flex-start' : 'center', 
              gap: isDesktop ? '24px' : 'clamp(8px, 2vh, 16px)', 
              zIndex: 4,
              marginTop: isDesktop ? '0' : 'clamp(8px, 2vh, 16px)',
              textAlign: isDesktop ? 'left' : 'center',
              flex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  fontSize: isDesktop ? '3.5rem' : 'clamp(2.5rem, 6vw, 4rem)', 
                  fontWeight: 900, 
                  color: '#fff', 
                  letterSpacing: 1,
                  fontFamily: 'inherit'
                }}>
                  {user?.display_name || 'Spotify User'}
                </span>
              </div>
              
              {/* Additional user info */}
              <div style={{
                display: 'flex',
                flexDirection: isDesktop ? 'row' : 'column',
                gap: isDesktop ? 24 : 8,
                alignItems: isDesktop ? 'center' : 'flex-start',
                flexWrap: 'wrap'
              }}>
                                 {/* Follower count */}
                 {user?.followerCount !== null && user?.followerCount !== undefined && (
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: 8,
                     color: '#b3b3b3',
                     fontSize: isDesktop ? '1rem' : '0.9rem',
                     fontWeight: 500,
                     padding: '8px 16px',
                     background: 'rgba(255, 255, 255, 0.1)',
                     borderRadius: '20px',
                     border: '1px solid rgba(255, 255, 255, 0.2)'
                   }}>
                     <svg 
                       width={isDesktop ? 18 : 16} 
                       height={isDesktop ? 18 : 16} 
                       viewBox="0 0 24 24" 
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="2"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       style={{ opacity: 0.8 }}
                     >
                       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                       <circle cx="9" cy="7" r="4"></circle>
                       <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                       <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                     </svg>
                                          <span>
                       {user.followerCount.toLocaleString()} {user.followerCount === 1 ? 'follower' : 'followers'}
                     </span>
                   </div>
                 )}
                 
                 {/* Following count - using the Follow icon */}
                 {user?.followingCount !== null && user?.followingCount !== undefined && (
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: 8,
                     color: '#b3b3b3',
                     fontSize: isDesktop ? '1rem' : '0.9rem',
                     fontWeight: 500,
                     padding: '8px 16px',
                     background: 'rgba(255, 255, 255, 0.1)',
                     borderRadius: '20px',
                     border: '1px solid rgba(255, 255, 255, 0.2)'
                   }}>
                     <svg 
                       width={isDesktop ? 18 : 16} 
                       height={isDesktop ? 18 : 16} 
                       viewBox="0 0 24 24" 
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="2"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       style={{ opacity: 0.8 }}
                     >
                       <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                       <circle cx="8.5" cy="7" r="4"></circle>
                       <line x1="20" y1="8" x2="20" y2="14"></line>
                       <line x1="17" y1="11" x2="23" y2="11"></line>
                     </svg>
                     <span>
                       {user.followingCount.toLocaleString()} following
                     </span>
                   </div>
                 )}
                 
                 {/* Account type */}
                {user?.product && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#1db954',
                    fontSize: isDesktop ? '1rem' : '0.9rem',
                    fontWeight: 600,
                    padding: '8px 16px',
                    background: 'rgba(29, 185, 84, 0.1)',
                    borderRadius: '20px',
                    border: '1px solid rgba(29, 185, 84, 0.3)'
                  }}>
                    <svg 
                      width={isDesktop ? 18 : 16} 
                      height={isDesktop ? 18 : 16} 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>
                      {user.product === 'premium' ? 'Premium' : user.product === 'free' ? 'Free' : user.product}
                    </span>
                  </div>
                )}
                
                {/* Country */}
                {user?.country && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#b3b3b3',
                    fontSize: isDesktop ? '1rem' : '0.9rem',
                    fontWeight: 500,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <svg 
                      width={isDesktop ? 18 : 16} 
                      height={isDesktop ? 18 : 16} 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      style={{ opacity: 0.8 }}
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span>{user.country}</span>
                  </div>
                )}
              </div>
              

              
              {/* Action Button - Only Show Playlists */}
              <div style={{ 
                display: 'flex', 
                gap: 16, 
                marginTop: isDesktop ? 0 : 24, 
                flexWrap: 'wrap',
                justifyContent: isDesktop ? 'flex-start' : 'center'
              }}>
                <button
                  className={styles.mainActionButton}
                  onClick={() => {
                    if (!showPlaylistsTable) {
                      handleGenerateFromPlaylist();
                    } else {
                      setTimeout(() => {
                        if (playlistsTableRef.current) {
                          playlistsTableRef.current.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
                      }, 100);
                    }
                  }}
                  disabled={isAnalyzingPlaylists}
                  style={{
                    background: isAnalyzingPlaylists ? '#666' : '#1db954',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 24,
                    padding: isDesktop ? '16px 32px' : '12px 24px',
                    fontSize: isDesktop ? '1.2rem' : 'clamp(1rem, 1.5vw, 1.1rem)',
                    cursor: isAnalyzingPlaylists ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px #1db95433',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnalyzingPlaylists) {
                      e.currentTarget.style.background = '#1ed760';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px #1db95440';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnalyzingPlaylists) {
                      e.currentTarget.style.background = '#1db954';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px #1db95433';
                    }
                  }}
                >
                  {isAnalyzingPlaylists ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Show Playlists
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* QuickStats Section */}
          <QuickStats isMobile={isMobile} />

          {/* Removed empty state message */}
          {/* Table section for last 50 songs */}
          {showSongsTable && (
           <div style={{ 
             marginBottom: 48,
             display: 'flex',
             justifyContent: 'center'
            }}>
             <NewTrackTable
               tracks={songs}
               title="Your Last 50 Songs"
               playlistKey="last50"
               loading={isAnalyzingRecents}
               error={null}
               onExploreGenre={handleExploreGenre}
               showCreatePlaylist={true}
               showViewPlaylist={true}
               wrappedLabel={'Create Wrapped Analysis'}
               isArtistContext={false}
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
             boxSizing: 'border-box',
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
                          gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: isDesktop ? '32px' : 'clamp(12px, 2vw, 24px)',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          justifyItems: 'center',
                          width: '100%',
                          minHeight: 120,
                        }}>
           {/* 
            * PLAYLIST GRID WITH MOBILE SUPPORT
            * 
            * Desktop: Controls appear on hover
            * Mobile: Controls appear on tap for 3 seconds
            * 
            * Each playlist shows:
            * - Cover image or colored placeholder
            * - Name and track count
            * - Overlay with Genres, Artists, and Play buttons
            * - Mobile indicator showing "3s" countdown
            */}
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
                   // Handle mobile press to show controls (only on mobile)
                   if (isMobile) {
                     handleMobilePlaylistPress(idx);
                   } else {
                     // On desktop, open Spotify playlist if available
                     if (playlist.external_urls?.spotify) {
                       window.open(playlist.external_urls.spotify, '_blank');
                     }
                   }
                 }}
                 onMouseEnter={() => !isMobile && setHoveredPlaylistIndex(idx)}
                 onMouseLeave={() => !isMobile && setHoveredPlaylistIndex(null)}
               >

                 {/* Cover */}
                 <div className="relative mb-3 playlist-card">
                   {playlist.images && playlist.images.length > 0 ? (
                     <img
                       src={playlist.images[0].url}
                       alt={playlist.name}
                       className="w-full h-auto rounded-md transition-all duration-300"
                       style={{
                         width: isDesktop ? '180px' : '120px',
                         height: isDesktop ? '180px' : '120px',
                         borderRadius: 6,
                         objectFit: 'cover',
                         transition: 'all 0.3s',
                       }}
                     />
                   ) : (
                     <div className="w-full h-auto rounded-md transition-all duration-300" style={{
                       width: isDesktop ? '180px' : '120px',
                       height: isDesktop ? '180px' : '120px',
                       borderRadius: 6,
                       background: color,
                       color: '#fff',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontWeight: '900',
                       fontSize: isDesktop ? '2rem' : '1.5rem',
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
                     fontSize: isDesktop ? '1.1rem' : '0.875rem',
                     color: '#fff',
                     marginTop: isDesktop ? 16 : 8,
                     marginBottom: isDesktop ? 12 : 8,
                     textAlign: 'left',
                     width: '100%',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap',
                   }}>{playlist.name}</h3>
                   <p style={{
                     color: '#9ca3af',
                     fontSize: isDesktop ? '0.9rem' : '0.75rem',
                     marginBottom: 0,
                     textAlign: 'left',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     fontWeight: '400',
                     lineHeight: '1.2',
                     letterSpacing: '0.025em',
                     fontFamily: 'inherit',
                   }}>{playlist.trackCount} tracks • {playlist.totalDurationMs ? `${Math.floor(playlist.totalDurationMs / 3600000)}h ${Math.floor((playlist.totalDurationMs % 3600000) / 60000)}m` : ''}</p>
                 </div>
                 
                 {/* Overlay with action buttons */}
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-md overlay" style={{
                   position: 'absolute',
                   inset: 0,
                   background: mobilePlaylistControlsIndex === idx ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: 6,
                   opacity: (mobilePlaylistControlsIndex === idx || (!isMobile && hoveredPlaylistIndex === idx)) ? 1 : 0,
                   transition: 'opacity 0.3s ease',
                   pointerEvents: (mobilePlaylistControlsIndex === idx || (!isMobile && hoveredPlaylistIndex === idx)) ? 'auto' : 'none',
                   // Add a subtle glow effect when mobile controls are active
                   boxShadow: mobilePlaylistControlsIndex === idx ? '0 0 20px rgba(29, 185, 84, 0.3)' : 'none',
                 }}>

                   <button 
                     className="bg-gray-800 bg-opacity-75 hover:bg-opacity-100 text-white font-semibold py-1 px-3 rounded-full text-xs mb-2 transition-all"
                     style={{
                       background: '#1db954',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '9999px',
                       fontWeight: 600,
                       fontSize: isDesktop ? '1rem' : (isMobile ? '0.9rem' : '0.75rem'),
                       padding: isDesktop ? '12px 20px' : (isMobile ? '8px 16px' : '4px 12px'),
                       marginBottom: isDesktop ? 12 : 8,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                     }}
                     onClick={e => {
                       e.stopPropagation();
                       handleCreatePlaylistWrapped(playlist);
                     }}
                   >
                     Create Wrapped
                   </button>
                   <button 
                     className="bg-gray-800 bg-opacity-75 hover:bg-opacity-100 text-white font-semibold py-1 px-3 rounded-full text-xs mb-2 transition-all"
                     style={{
                       background: '#374151',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '9999px',
                       fontWeight: 600,
                       fontSize: isDesktop ? '1rem' : (isMobile ? '0.9rem' : '0.75rem'),
                       padding: isDesktop ? '12px 20px' : (isMobile ? '8px 16px' : '4px 12px'),
                       marginBottom: isDesktop ? 12 : 8,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                     }}
                     onClick={e => {
                       e.stopPropagation();
                       handleAnalyzeNewGenres(playlist);
                     }}
                   >
                     Genre Count
                   </button>
                   <button 
                     className="bg-gray-800 bg-opacity-75 hover:bg-opacity-100 text-white font-semibold py-1 px-3 rounded-full text-xs mb-2 transition-all"
                     style={{
                       background: '#374151',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '9999px',
                       fontWeight: 600,
                       fontSize: isDesktop ? '1rem' : (isMobile ? '0.9rem' : '0.75rem'),
                       padding: isDesktop ? '12px 20px' : (isMobile ? '8px 16px' : '4px 12px'),
                       marginBottom: isDesktop ? 12 : 8,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                     }}
                     onClick={e => {
                       e.stopPropagation();
                       handleAnalyzeNewArtists(playlist);
                     }}
                   >
                     Artist Count
                   </button>
                                        <a
                       href={`https://open.spotify.com/playlist/${playlist.id}`}
                       target="_blank"
                        rel="noopener noreferrer"
                       className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center transform transition-transform duration-200 hover:scale-110"
                       style={{
                         width: isDesktop ? 56 : (isMobile ? 48 : 40),
                         height: isDesktop ? 56 : (isMobile ? 48 : 40),
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
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: isDesktop ? 28 : (isMobile ? 24 : 20), height: isDesktop ? 28 : (isMobile ? 24 : 20), color: '#000' }}>
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
                       </svg>
                     </a>
                   

                 </div>
                 
                   {/* Responsive text sizing CSS */}
                   {/* Essential CSS only */}
                   <style jsx>{`
                     @keyframes pulse {
                       0% { transform: scale(1); }
                       50% { transform: scale(1.1); }
                       100% { transform: scale(1); }
                     }
                   `}</style>
                 

                 

               </div>
             );
           })}
         </div>


       </div>
     )}

          {/* Genre Analysis Results - Displayed directly in main page */}
          {genreAnalysis && (
            <div style={{ marginTop: '40px', marginBottom: '40px', position: 'relative' }}>
              <GenreLeaderboardChart
                genres={genreAnalysis.genres}
                title={`Genre Analysis for ${genreAnalysis.name}`}
                timeRange=""
                genreDetails={{}}
                mainArtistsData={[]}
                onClose={() => setGenreAnalysis(null)}
              />
            </div>
          )}

          {/* Artist Analysis Results - Displayed directly in main page */}
          {artistAnalysis && (
            <div style={{ marginTop: '40px', marginBottom: '40px', position: 'relative' }}>
              <GenreLeaderboardChart
                genres={artistAnalysis.artists}
                title={`Artist Analysis for ${artistAnalysis.name}`}
                timeRange=""
                genreDetails={artistAnalysis.artistDetails || {}}
                mainArtistsData={[]}
                onClose={() => setArtistAnalysis(null)}
              />
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
          <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              zIndex: 1000,
              padding: '20px',
              overflow: 'auto',
              paddingTop: 'max(20px, 5vh)',
              paddingBottom: 'max(20px, 5vh)'
          }}
          onClick={() => setShowNewArtistModal(false)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          >


                  {/* Use GenreLeaderboardChart component for artists */}
                  <GenreLeaderboardChart
                      genres={newArtistAnalysis.artists}
                      title={`Artist Analysis for ${newArtistAnalysis.name}`}
                      timeRange=""
                      genreDetails={newArtistAnalysis.artistDetails || {}}
                      mainArtistsData={[]}
                      onClose={() => setShowNewArtistModal(false)}
                  />
          </div>
      )}

      {/* New Genre Analysis Modal */}
      {showNewGenreModal && newGenreAnalysis && (
          <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              zIndex: 1000,
              padding: '20px',
              overflow: 'auto',
              paddingTop: 'max(20px, 5vh)',
              paddingBottom: 'max(20px, 5vh)'
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          >


                  {/* Use GenreLeaderboardChart component for genres */}
                  <GenreLeaderboardChart
                      genres={newGenreAnalysis.genres}
                      title={`Genre Analysis for ${newGenreAnalysis.name}`}
                      timeRange=""
                      genreDetails={newGenreAnalysis.genreDetails || {}}
                      mainArtistsData={[]}
                      onClose={() => setShowNewGenreModal(false)}
                  />
          </div>
      )}


      
      {/* Wrapped Analysis Modal for Playlists */}
      {showWrappedModal && selectedPlaylistForWrapped && (
        <WrappedAnalysisModal
          open={showWrappedModal}
          onClose={() => setShowWrappedModal(false)}
          tracks={selectedPlaylistForWrapped.tracks}
        />
      )}

    </main>
      </div>
    </div>
    </>
  );
}