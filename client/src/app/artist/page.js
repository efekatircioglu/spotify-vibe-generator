"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';
import Sidebar from '../../components/Sidebar';
import AlbumSelector from '../../components/AlbumSelector';
import NewTrackTable from '../../components/NewTrackTable';
import ConcertsList from '../../components/ConcertsList';
import AlbumContributorsModal from '../../components/AlbumContributorsModal';
import ArtistCollaborators from '../../components/ArtistCollaborators';
import ArtistsMosts from '../../components/ArtistsMosts';
import { getCachedArtistId, setArtistCache, setFailedArtistCache } from '../../utils/artistCache';

// --- Add this entire helper function ---
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

// Add this helper function at the top-level (outside the component)
async function discogsProfileToLinks(profile) {
  if (!profile) return '';
  
  // [a=Name] or [l=Name] → just the name
  let result = profile
    .replace(/\[a=([^\]]+)\]/g, '$1')
    .replace(/\[l=([^\]]+)\]/g, '$1');
  
  // [a12345] → link to artist with real name
  const artistMatches = result.match(/\[a(\d+)\]/g);
  if (artistMatches) {
    // Extract all unique artist IDs
    const artistIds = [...new Set(artistMatches.map(match => match.match(/\[a(\d+)\]/)[1]))];
    
    // Make all API calls in parallel
    const artistPromises = artistIds.map(async (id) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/discogs/artist-id/${id}`);
        if (response.ok) {
          const artistData = await response.json();
          return { id, name: artistData.name || `Artist #${id}` };
        } else {
          return { id, name: `Artist #${id}` };
        }
      } catch (error) {
        console.error('Error fetching artist name:', error);
        return { id, name: `Artist #${id}` };
      }
    });
    
    // Wait for all API calls to complete
    const artistResults = await Promise.all(artistPromises);
    
    // Create a map for quick lookup
    const artistNameMap = Object.fromEntries(artistResults.map(r => [r.id, r.name]));
    
    // Replace all artist links with real names
    result = result.replace(/\[a(\d+)\]/g, (match, id) => {
      const artistName = artistNameMap[id] || `Artist #${id}`;
      return `<a href="https://www.discogs.com/artist/${id}" target="_blank" rel="noopener noreferrer" title="View ${artistName} on Discogs">${artistName}</a>`;
    });
  }
  
  // [l67890] → link to label with real name
  const labelMatches = result.match(/\[l(\d+)\]/g);
  if (labelMatches) {
    // Extract all unique label IDs
    const labelIds = [...new Set(labelMatches.map(match => match.match(/\[l(\d+)\]/)[1]))];
    
    // Make all API calls in parallel
    const labelPromises = labelIds.map(async (id) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/discogs/label-id/${id}`);
        if (response.ok) {
          const labelData = await response.json();
          return { id, name: labelData.name || `Label #${id}` };
        } else {
          return { id, name: `Label #${id}` };
        }
      } catch (error) {
        console.error('Error fetching label name:', error);
        return { id, name: `Label #${id}` };
      }
    });
    
    // Wait for all API calls to complete
    const labelResults = await Promise.all(labelPromises);
    
    // Create a map for quick lookup
    const labelNameMap = Object.fromEntries(labelResults.map(r => [r.id, r.name]));
    
    // Replace all label links with real names
    result = result.replace(/\[l(\d+)\]/g, (match, id) => {
      const labelName = labelNameMap[id] || `Label #${id}`;
      return `<a href="https://www.discogs.com/label/${id}" target="_blank" rel="noopener noreferrer" title="View ${labelName} on Discogs">${labelName}</a>`;
    });
  }
  
  // [r54321] → link to release with real name
  const releaseMatches = result.match(/\[r(\d+)\]/g);
  if (releaseMatches) {
    // Extract all unique release IDs
    const releaseIds = [...new Set(releaseMatches.map(match => match.match(/\[r(\d+)\]/)[1]))];
    
    // Make all API calls in parallel
    const releasePromises = releaseIds.map(async (id) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/discogs/release-id/${id}`);
        if (response.ok) {
          const releaseData = await response.json();
          return { id, name: releaseData.title || `Release #${id}` };
        } else {
          return { id, name: `Release #${id}` };
        }
      } catch (error) {
        console.error('Error fetching release name:', error);
        return { id, name: `Release #${id}` };
      }
    });
    
    // Wait for all API calls to complete
    const releaseResults = await Promise.all(releasePromises);
    
    // Create a map for quick lookup
    const releaseNameMap = Object.fromEntries(releaseResults.map(r => [r.id, r.name]));
    
    // Replace all release links with real names
    result = result.replace(/\[r(\d+)\]/g, (match, id) => {
      const releaseName = releaseNameMap[id] || `Release #${id}`;
      return `<a href="https://www.discogs.com/release/${id}" target="_blank" rel="noopener noreferrer" title="View ${releaseName} on Discogs">${releaseName}</a>`;
    });
  }
  // Remove any other [bracketed] codes
  result = result.replace(/\[[^\]]+\]/g, '');
  return result;
}

// Add this helper function for genre/style lookup (copied from AlbumSelector.jsx)
function findDiscogsGenreStyle(albumName, genreStyleMap) {
  if (!albumName || !genreStyleMap) return null;
  const normalized = albumName.trim().toLowerCase();
  for (const key of Object.keys(genreStyleMap)) {
    if (key.toLowerCase().endsWith(normalized)) {
      return { discogsKey: key, genre: genreStyleMap[key][0], style: genreStyleMap[key][1] };
    }
  }
  return null;
}

export default function ArtistConcertsPage() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Load handwriting fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Indie+Flower&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const artistName = searchParams.get('name') || '';
  const spotifyId = searchParams.get('spotifyId') || '';
  const ticketmasterId = searchParams.get('ticketmasterId') || '';
  const isMobile = useIsMobile(); 
  
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  

  // New state for albums and tracks
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [albumError, setAlbumError] = useState('');
  const [tracksError, setTracksError] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [artistFollowers, setArtistFollowers] = useState(null);
  const [artistGenres, setArtistGenres] = useState([]);
  const [isFollowing, setIsFollowing] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [discogsProfile, setDiscogsProfile] = useState(null);
  const [discogsRealName, setDiscogsRealName] = useState(null);
  // New state for processed Discogs profile with resolved artist names
  const [processedDiscogsProfile, setProcessedDiscogsProfile] = useState('');
  // New state for loading Discogs profile processing
  const [processingDiscogsProfile, setProcessingDiscogsProfile] = useState(false);
  // New state for genre/style map
  const [albumGenreStyleMap, setAlbumGenreStyleMap] = useState({});
  
  // State for extracted Discogs genres and styles
  const [discogsGenres, setDiscogsGenres] = useState([]);
  const [discogsStyles, setDiscogsStyles] = useState([]);
  
  // State for album contributors
  const [showAlbumContributorsModal, setShowAlbumContributorsModal] = useState(false);
  const [albumContributors, setAlbumContributors] = useState(null);
  const [albumContributorsLoading, setAlbumContributorsLoading] = useState(false);
  const [albumContributorsError, setAlbumContributorsError] = useState(null);
  
  // Pagination state for concerts
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for collaborators
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [collaboratorsError, setCollaboratorsError] = useState('');
  const [collaboratorsStats, setCollaboratorsStats] = useState(null);
  const concertsPerPage = 20;
  
  // State for Ticketmaster ID not found
  const [ticketmasterIdNotFound, setTicketmasterIdNotFound] = useState(false);
  
  // State for artist search
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Album group filter state - will be set dynamically based on available content
  const [albumGroup, setAlbumGroup] = useState(null);
  const albumGroups = [
    { label: 'Albums', value: 'album' },
    { label: 'Singles', value: 'single' },
    { label: 'Compilations', value: 'compilation' },
    { label: 'Appears On', value: 'appears_on' },
  ];
  
  // Album sorting state
  const [albumSortBy, setAlbumSortBy] = useState('release_date');
  const albumSortOptions = [
    { label: 'Release Date', value: 'release_date' },
    { label: 'Popularity', value: 'popularity' },
  ];
  const [isBioExpanded, setIsBioExpanded] = useState(false); // <-- Add this line
  const [isHeaderBioExpanded, setIsHeaderBioExpanded] = useState(false); // <-- Add this line for header bio
  const BIO_TRUNCATE_LENGTH = 300; // Characters to show before truncating
  

  // (removed unused formatDate)

  // Function to find the first available album type
  const findFirstAvailableAlbumType = async (artistId) => {
    const types = ['album', 'single', 'appears_on', 'compilation'];
    
    for (const type of types) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/artist-albums/${artistId}?group=${type}&sortBy=popularity`);
        if (response.ok) {
          const data = await response.json();
          if (data.albums && data.albums.length > 0) {
            return type;
          }
        }
      } catch (error) {
        console.error(`Error checking ${type}:`, error);
      }
    }
    return 'album'; // fallback
  };

  // Fetch albums when artist or group changes (but NOT when sort changes)
  useEffect(() => {
    if (!selectedArtist?.id || !selectedArtist?.name) return;
    const initializeAlbumGroup = async () => {
      // If no album group is set, find the first available one
      if (!albumGroup) {
        const firstAvailable = await findFirstAvailableAlbumType(selectedArtist.id);
        setAlbumGroup(firstAvailable);
        return; // Exit early, this will trigger the effect again
      }
      
      setLoadingAlbums(true);
      setAlbumError('');
      setAlbums([]);
      setSelectedAlbumId(null);
      
      // Always fetch with popularity data so we can sort client-side
      fetch(`http://127.0.0.1:8000/artist-albums/${selectedArtist.id}?group=${albumGroup}&sortBy=popularity`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch albums');
          return res.json();
        })
        .then(data => {
          setAlbums(data.albums || []);
          if (data.albums && data.albums.length > 0) {
            setSelectedAlbumId(data.albums[0].id);
          }
        })
        .catch(err => {
          setAlbumError(err.message || 'Failed to fetch albums');
        })
        .finally(() => setLoadingAlbums(false));
    };
    
    initializeAlbumGroup();
    
    // Explicitly fetch genre/style map from Discogs
    fetch(`http://localhost:8000/discogs/artist/${encodeURIComponent(selectedArtist.name)}/genre-style-map`)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }
        
        // Handle specific error cases
        if (res.status === 429) {
          console.warn(`[Discogs] Rate limit exceeded for "${selectedArtist.name}". Will retry later.`);
          return { map: {}, message: 'Rate limit exceeded - will retry automatically' };
        }
        
        if (res.status === 404) {
                  return { map: {}, message: 'No Discogs data available for this artist' };
      }
      
      // For other errors, try to get error details
      try {
        const errorData = await res.json();
        console.error(`[Discogs] API error ${res.status} for "${selectedArtist.name}":`, errorData);
      } catch (parseErr) {
        console.error(`[Discogs] API error ${res.status} for "${selectedArtist.name}":`, res.statusText);
      }
      
      return { map: {}, message: 'Failed to fetch Discogs data' };
    })
    .then(data => {
      setAlbumGenreStyleMap(data.map || {});
      
      // Extract and set unique genres and styles
      const { genres, styles } = extractDiscogsGenresAndStyles(data.map || {});
      setDiscogsGenres(genres);
      setDiscogsStyles(styles);
    })
      .catch((err) => {
        console.error(`[Discogs] Network error fetching genre/style map for "${selectedArtist.name}":`, err);
        setAlbumGenreStyleMap({});
        setDiscogsGenres([]);
        setDiscogsStyles([]);
      });
  }, [selectedArtist, albumGroup]);

  // Sort albums based on current sort option
  const sortedAlbums = [...albums].sort((a, b) => {
    switch (albumSortBy) {
      case 'popularity':
        return b.popularity - a.popularity; // Highest popularity first
      case 'release_date':
      default:
        // Sort by release date (newest first)
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
    }
  });

  // Merge genre/style info into sorted albums
  const albumsWithGenreStyle = sortedAlbums.map(album => {
    const genreStyle = albumGenreStyleMap[album.name] || [[], []];
    return { ...album, genre: genreStyle[0], style: genreStyle[1] };
  });

  // Extract unique Discogs genres and styles from all albums
  const extractDiscogsGenresAndStyles = (genreStyleMap) => {
    const allGenres = new Set();
    const allStyles = new Set();
    
    Object.values(genreStyleMap).forEach(([genres, styles]) => {
      if (Array.isArray(genres)) {
        genres.forEach(genre => allGenres.add(genre));
      }
      if (Array.isArray(styles)) {
        styles.forEach(style => allStyles.add(style));
      }
    });
    
    return {
      genres: Array.from(allGenres).sort(),
      styles: Array.from(allStyles).sort()
    };
  };

  // Handle getting album contributors
  const handleGetAlbumContributors = async () => {
    
    if (!selectedAlbum?.name || !selectedArtist?.name) {
      setAlbumContributorsError('Missing album or artist information');
      setShowAlbumContributorsModal(true);
      return;
    }

    setShowAlbumContributorsModal(true);
    setAlbumContributorsLoading(true);
    setAlbumContributorsError(null);

    const apiUrl = `http://127.0.0.1:8000/album-contributors?albumTitle=${encodeURIComponent(selectedAlbum.name)}&artistName=${encodeURIComponent(selectedArtist.name)}`;

    try {
      const startTime = Date.now();
      const response = await fetch(apiUrl);
      const endTime = Date.now();
      
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
    
      
      setAlbumContributors(data.contributors);
    } catch (error) {
      console.error(`❌ [CLIENT] Error fetching album contributors:`, error);
      setAlbumContributorsError(error.message || 'Failed to fetch album contributors');
    } finally {
      setAlbumContributorsLoading(false);
    }
  };

  // Fetch tracks for selected album
  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumTracks([]);
      return;
    }
    setLoadingTracks(true);
    setTracksError('');
    // Do NOT clear albumTracks here; keep old data visible while loading
    fetch(`http://127.0.0.1:8000/album-tracks/${selectedAlbumId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch album tracks');
        return res.json();
      })
      .then(data => {
        setAlbumTracks(data.tracks || []);
      })
      .catch(err => {
        setTracksError(err.message || 'Failed to fetch album tracks');
      })
      .finally(() => setLoadingTracks(false));
  }, [selectedAlbumId]);

  // Initialize artist from URL params
  useEffect(() => {
    if (artistName) {
      setSelectedArtist({
        id: spotifyId || null,
        name: artistName,
      });
    }
  }, [artistName, spotifyId]);

  // Fetch artist image, followers, and genres from Spotify
  useEffect(() => {
    if (!spotifyId) return;
    fetch(`http://127.0.0.1:8000/spotify/artist-details/${spotifyId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          setArtistImage(data.images[0].url);
        }
        if (data && data.followers && data.followers.total) {
          setArtistFollowers(data.followers.total);
        }
        if (data && data.genres && data.genres.length > 0) {
          setArtistGenres(data.genres);
        }
      });
  }, [spotifyId]);

  // Fetch follow status when artist is loaded
  useEffect(() => {
    if (!spotifyId) return;
    setIsFollowing(null);
    fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`)
      .then(res => res.ok ? res.json() : { isFollowing: false })
      .then(data => setIsFollowing(data.isFollowing))
      .catch(() => setIsFollowing(false));
  }, [spotifyId]);

  // Fetch Discogs artist profile when artistName changes
  useEffect(() => {
    if (!artistName) return;
    fetch(`http://localhost:8000/discogs/artist-profile?name=${encodeURIComponent(artistName)}`)
      .then(res => res.json())
      .then(data => {
        setDiscogsProfile(data.profile || null);
        setDiscogsRealName(data.realName || null);
      })
      .catch(err => {
        console.error("Error fetching Discogs profile:", err);
      });
  }, [artistName]);

  // Process Discogs profile and update state
  useEffect(() => {
    const processProfile = async () => {
      if (!discogsProfile) {
        setProcessedDiscogsProfile('');
        setProcessingDiscogsProfile(false);
        return;
      }
      
      setProcessingDiscogsProfile(true);
      try {
        const processed = await discogsProfileToLinks(discogsProfile);
        setProcessedDiscogsProfile(processed);
      } catch (error) {
        console.error('Error processing Discogs profile:', error);
        // Fallback to original profile if processing fails
        setProcessedDiscogsProfile(discogsProfile);
      } finally {
        setProcessingDiscogsProfile(false);
      }
    };
    processProfile();
  }, [discogsProfile]);





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

  // Fetch collaborators for the artist
  const fetchCollaborators = async (albumTypes = 'album') => {
    if (!spotifyId) return;
    
    setCollaboratorsLoading(true);
    setCollaboratorsError('');
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/artist-collaborators/${spotifyId}?minCollaborations=1&albumTypes=${albumTypes}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }
      
      const data = await response.json();
      setCollaborators(data.collaborators || []);
      setCollaboratorsStats({
        totalAlbums: data.totalAlbums,
        totalTracks: data.totalTracks,
        albumTypes: data.albumTypes,
        analysisParams: data.analysisParams
      });
    } catch (err) {
      setCollaboratorsError(err.message || 'Failed to fetch collaborators');
      setCollaborators([]);
      setCollaboratorsStats(null);
    } finally {
      setCollaboratorsLoading(false);
    }
  };

  // Search for artist on Ticketmaster
  const searchArtist = async (artistName) => {
    setSearching(true);
    setSearchError('');
    try {
      // Check cache first
      const cachedId = getCachedArtistId(artistName);
      if (cachedId) {
        // Found cached Ticketmaster ID
        // Navigate to the artist page with the cached ID
        router.push(`/artist?name=${encodeURIComponent(artistName)}&spotifyId=${spotifyId}&ticketmasterId=${cachedId}`);
        return;
      }

      const data = await fetchWithRetry(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`);
      const attractions = data._embedded?.attractions || data.attractions || [];
      const musicArtists = attractions.filter(artist => {
        const isMusic = artist.classifications && 
          artist.classifications.some(classification => 
            classification.segment && classification.segment.name === 'Music'
          );
        return isMusic;
      });
      
      if (musicArtists.length > 0) {
        // Cache the successful result with image, Spotify ID, and Ticketmaster name
        const firstArtist = musicArtists[0];
        const imageUrl = firstArtist.images?.[0]?.url || null;
        const ticketmasterArtistName = firstArtist.name;
        setArtistCache(artistName, firstArtist.id, imageUrl, spotifyId, ticketmasterArtistName);
        
        // Navigate to the artist page with the found ID
        router.push(`/artist?name=${encodeURIComponent(artistName)}&spotifyId=${spotifyId}&ticketmasterId=${firstArtist.id}`);
      } else {
        // Cache the failed search to avoid repeated API calls
        setFailedArtistCache(artistName, spotifyId);
        setSearchError('No Ticketmaster artist found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching artist:', err);
      setSearchError('Failed to search for artist. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Fetch concerts using batch API (same as concerts page)
  useEffect(() => {
    if (!ticketmasterId) {
      setTicketmasterIdNotFound(true);
      setConcerts([]);
      return;
    }
    
    setLoading(true);
    setError('');
    setConcerts([]);
    setTicketmasterIdNotFound(false);
    
    const fetchConcerts = async () => {
      try {
        // Making batch request...
        
        // Use the same batch endpoint as concerts page
        const response = await fetch('http://127.0.0.1:8000/concerts/events/optimized-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artistIds: [ticketmasterId] }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const allConcerts = data.concerts || [];
        
        // Concerts received
        
        // Sort by date
        const sortedConcerts = allConcerts.sort((a, b) => {
          const dateA = a.dates?.start?.localDate || '';
          const dateB = b.dates?.start?.localDate || '';
          return dateA.localeCompare(dateB);
        });
        
        setConcerts(sortedConcerts);
      } catch (err) {
        setError(err.message || 'Concert search failed');
        console.error('Error fetching concerts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConcerts();
  }, [ticketmasterId]);

  // Compute selected album object
  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);
  // Inject album name and year into each track
  const tracksWithAlbumInfo = (albumTracks || []).map(track => ({
    ...track,
    album: selectedAlbum?.name || '',
    release_year: selectedAlbum?.releaseYear || '',
    album_image: selectedAlbum?.image || '',
  }));

  // Get genres and styles for selected album from Discogs
  const discogsGenreStyle = findDiscogsGenreStyle(selectedAlbum?.name, albumGenreStyleMap);
  const genresForTable = [
    ...(discogsGenreStyle?.genre || []),
    ...(discogsGenreStyle?.style || [])
  ];

  return (
    <>
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div style={{ 
        padding: 0, 
        margin: 0, 
        background: '#101114', 
        minHeight: '100vh',
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <main style={{ padding: 0, margin: 0, background: '#101114', minHeight: '100vh' }}>
      {/* Artist Search Section (when no artist is selected) */}
      {!selectedArtist && (
        <div style={{ 
          padding: 32, 
          background: '#101114', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginBottom: 24 
          }}>
           <button
              onClick={() => router.push('/')}
              className={styles.profileBackButton}
            >
              <span style={{ fontSize: '1.3em', marginRight: 6 }}>←</span> Profile
            </button>
          </div>
          
          <h1 style={{ 
            marginBottom: 32, 
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900,
            color: '#fff',
            textAlign: 'center'
          }}>
            Search Artist on Ticketmaster
          </h1>
          
          <div style={{ 
            background: '#181818', 
            padding: 24, 
            borderRadius: 16, 
            marginBottom: 32,
            boxShadow: '0 4px 16px #0003',
            width: '100%',
            maxWidth: 500
          }}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && searchArtist(searchQuery.trim())}
                placeholder="Enter artist name (e.g., Kanye West, Ye, etc.)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '2px solid #333',
                  background: '#232323',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  marginBottom: 12,
                }}
                onFocus={(e) => e.target.style.borderColor = '#1db954'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
              
              <button
                onClick={() => searchQuery.trim() && searchArtist(searchQuery.trim())}
                disabled={!searchQuery.trim() || searching}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: searchQuery.trim() && !searching ? '#1db954' : '#333',
                  color: searchQuery.trim() && !searching ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: searchQuery.trim() && !searching ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {searching ? 'Searching...' : 'Search Artist'}
              </button>
            </div>
            
            {searchError && (
              <div style={{ 
                background: '#f87171', 
                color: '#000', 
                padding: 16, 
                borderRadius: 8, 
                marginTop: 16,
                fontSize: '0.9rem'
              }}>
                {searchError}
              </div>
            )}
            
            <div style={{ 
              color: '#b3b3b3', 
              fontSize: '0.9rem', 
              marginTop: 16,
              textAlign: 'center'
            }}>
              <p>💡 <strong>Tip:</strong> Try different variations of artist names.</p>
              <p>For example: "Kanye West" might return "Ye" on Ticketmaster.</p>
            </div>
          </div>
        </div>
      )}

      {/* Artist Info and Albums */}
      {selectedArtist && (
        <>
          <div
  className="artist-header-container"
  style={{
    position: 'relative',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'center' : 'center',
    justifyContent: isMobile ? 'center' : 'flex-start',
    gap: isMobile ? 'clamp(12px, 3vh, 20px)' : 'clamp(16px, 3vw, 32px)',
    minHeight: isMobile ? 'clamp(280px, 45vh, 400px)' : 'clamp(300px, 50vh, 600px)',
    width: '100vw',
    borderRadius: '0 0 32px 32px',
    boxShadow: '0 4px 32px #0002',
    padding: isMobile 
      ? 'clamp(20px, 5vh, 32px) clamp(16px, 4vw, 24px)' 
      : 'clamp(24px, 6vh, 48px) clamp(24px, 5vw, 64px)',
    overflow: 'hidden',
    zIndex: 10,
    marginTop: '-32px',
    background: 'none',
    boxSizing: 'border-box',
  }}
>
            {/* Blurred, stretched background image */}
            {artistImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url('${artistImage}')`,
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
            {artistImage && (
             <img src={artistImage} alt={selectedArtist.name} style={{ 
              width: isMobile ? 'clamp(100px, 25vw, 140px)' : 'clamp(80px, calc(60px + 4vw), 140px)', 
              aspectRatio: '1 / 1',
              borderRadius: '50%', 
              objectFit: 'cover', 
              boxShadow: '0 4px 24px #0004', 
              border: isMobile ? '3px solid #fff' : '4px solid #fff', 
              zIndex: 4,
              marginTop: isMobile ? 'clamp(16px, 4vh, 24px)' : '0'
            }} />
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: isMobile ? 'center' : 'flex-start', 
              gap: isMobile ? 'clamp(8px, 2vh, 16px)' : 'clamp(6px, 1.5vh, 12px)', 
              zIndex: 4,
              marginTop: isMobile ? 'clamp(4px, 1vh, 8px)' : 'clamp(8px, 2vh, 16px)',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ 
  fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.5rem)' : 'clamp(2rem, 5vw, 4rem)', 
  fontWeight: 900, 
  color: '#fff', 
  letterSpacing: 1,
  fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive'
}}>{selectedArtist.name}</span>
              </div>
              {artistFollowers !== null && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16, 
                  marginTop: 2 
                }}>
                  <span style={{ 
                    color: '#b3b3b3', 
                    fontSize: isMobile ? 'clamp(0.85rem, 2.5vw, 1.1rem)' : 'clamp(0.9rem, 2vw, 1.25rem)', 
                    fontWeight: 500
                  }}>
                    {artistFollowers.toLocaleString()} Followers
                  </span>
                </div>
              )}
              
              {/* Real Name, Genres, Styles and About displayed in header - always show if available */}
              {(discogsRealName || artistGenres.length > 0 || discogsGenres.length > 0 || discogsStyles.length > 0 || (discogsProfile && discogsProfile.trim().length > 0)) && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isMobile ? 8 : 12, 
                  marginTop: isMobile ? 12 : 16,
                  width: '100%'
                }}>
                  {/* Real Name Section */}
                  {discogsRealName && (
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                        fontWeight: 600,
                        marginBottom: 8,
                        opacity: 0.9
                      }}>
                        Real Name
                      </div>
                      <div style={{
                        color: '#38bdf8',
                        fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                        fontWeight: 500,
                        fontStyle: 'italic',
                        fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive',
                        letterSpacing: '0.5px',
                        display: 'inline-block'
                      }}>
                        {discogsRealName.split(' ').map((word, index) => (
                          <span key={index} style={{ display: 'inline-block', marginRight: '4px' }}>
                            <span style={{
                              fontSize: 'clamp(1.3rem, 2.6vw, 2rem)',
                              fontWeight: 700,
                              // color: '#60a5fa'
                            }}>
                              {word.charAt(0)}
                            </span>
                            <span style={{ fontSize: 'inherit' }}>
                              {word.slice(1)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Genres Section */}
                  {(artistGenres.length > 0 || discogsGenres.length > 0) && (
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: isMobile ? 'clamp(0.75rem, 2vw, 0.9rem)' : 'clamp(0.8rem, 1.5vw, 1rem)',
                        fontWeight: 600,
                        marginBottom: isMobile ? 6 : 8,
                        opacity: 0.9
                      }}>
                        Genres
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: isMobile ? '4px' : '6px',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {/* Spotify Genres */}
                        {artistGenres.map((genre, index) => (
                          <span
                            key={`spotify-${genre}`}
                            style={{
                              background: 'linear-gradient(135deg, #1f2937, #374151)',
                              color: '#ffffff',
                              padding: isMobile ? '3px 8px' : '4px 10px',
                              borderRadius: '16px',
                              fontSize: isMobile ? 'clamp(0.65rem, 2vw, 0.8rem)' : 'clamp(0.7rem, 1.2vw, 0.85rem)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              border: '1px solid #4b5563',
                              transition: 'all 0.2s ease',
                              cursor: 'default'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #374151, #4b5563)';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #1f2937, #374151)';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                            }}
                            title="Spotify Genre"
                          >
                            {genre}
                          </span>
                        ))}
                        
                        {/* Discogs Genres */}
                        {discogsGenres.map((genre, index) => (
                          <span
                            key={`discogs-${genre}`}
                            style={{
                              background: 'linear-gradient(135deg, #1f2937, #374151)',
                              color: '#ffffff',
                              padding: isMobile ? '3px 8px' : '4px 10px',
                              borderRadius: '16px',
                              fontSize: isMobile ? 'clamp(0.65rem, 2vw, 0.8rem)' : 'clamp(0.7rem, 1.2vw, 0.85rem)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              border: '1px solid #4b5563',
                              transition: 'all 0.2s ease',
                              cursor: 'default'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #374151, #4b5563)';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #1f2937, #374151)';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                            }}
                            title="Discogs Genre"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Styles Section */}
                  {discogsStyles.length > 0 && (
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                        fontWeight: 600,
                        marginBottom: 8,
                        opacity: 0.9
                      }}>
                        Styles
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {discogsStyles.map((style, index) => (
                          <span
                            key={style}
                            style={{
                              background: '#374151',
                              color: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              border: '1px solid #6b7280',
                              transition: 'all 0.2s ease',
                              cursor: 'default'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#4b5563';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#374151';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                            }}
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* About Section Preview */}
                  {discogsProfile && discogsProfile.trim().length > 0 && (
                    <div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                        fontWeight: 600,
                        marginBottom: 8,
                        opacity: 0.9
                      }}>
                        About
                      </div>
                      <div style={{
                        color: '#b3b3b3',
                        fontSize: 'clamp(0.75rem, 1.3vw, 0.9rem)',
                        lineHeight: 1.4,
                        maxWidth: '100%'
                      }}>
                        {processingDiscogsProfile ? (
                          <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
                            Processing artist information...
                          </span>
                        ) : (
                          <>
                            <span 
                              dangerouslySetInnerHTML={{ 
                                __html: isHeaderBioExpanded ? 
                                  processedDiscogsProfile : 
                                  processedDiscogsProfile.length > (isMobile ? 80 : 120) ? 
                                    processedDiscogsProfile.substring(0, isMobile ? 80 : 120).replace(/<[^>]*>/g, '') + '...' : 
                                    processedDiscogsProfile.replace(/<[^>]*>/g, '')
                              }} 
                            />
                            {processedDiscogsProfile.length > (isMobile ? 80 : 120) && (
                              <button
                                onClick={() => setIsHeaderBioExpanded(!isHeaderBioExpanded)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1db954',
                                  fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '0',
                                  margin: '0 0 0 4px',
                                  textDecoration: 'underline',
                                  fontFamily: 'inherit'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = '#1ed760';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = '#1db954';
                                }}
                              >
                                {isHeaderBioExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? 8 : 12, 
                marginTop: isMobile ? 8 : 12, 
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <button
                  style={{
                    background: isFollowing ? '#232323' : '#1db954',
                    color: isFollowing ? '#1db954' : '#181818',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 24,
                    padding: isMobile 
                      ? `clamp(6px, 1.5vh, 10px) clamp(16px, 2.5vw, 24px)` 
                      : `clamp(8px, 2vh, 12px) clamp(20px, 3vw, 32px)`,
                    fontSize: isMobile 
                      ? `clamp(0.8rem, 2vw, 1rem)` 
                      : `clamp(0.9rem, 1.5vw, 1.1rem)`,
                    cursor: followLoading || isFollowing === null ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 6 : 8,
                    opacity: followLoading || isFollowing === null ? 0.7 : 1,
                    pointerEvents: followLoading || isFollowing === null ? 'none' : 'auto',
                    transition: 'background 0.2s, color 0.2s, padding 0.2s, font-size 0.2s',
                  }}
                  disabled={followLoading || isFollowing === null}
                  onClick={async () => {
                    if (isFollowing === null) return;
                    setFollowLoading(true);
                    try {
                      if (isFollowing) {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'DELETE' });
                      } else {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'PUT' });
                      }
                      // Always re-fetch the follow status after the action
                      const res = await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`);
                      const data = await res.json();
                      setIsFollowing(data.isFollowing);
                    } catch (e) {}
                    setFollowLoading(false);
                  }}
                >
                  {isFollowing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
                      <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#1db954"/><path d="M6 10.5L9 13.5L14 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Followed
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
                <button
                  style={{
                    background: '#232323',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 24,
                    padding: isMobile 
                      ? `clamp(6px, 1.5vh, 10px) clamp(16px, 2.5vw, 24px)` 
                      : `clamp(8px, 2vh, 12px) clamp(20px, 3vw, 32px)`,
                    fontSize: isMobile 
                      ? `clamp(0.8rem, 2vw, 1rem)` 
                      : `clamp(0.9rem, 1.5vw, 1.1rem)`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    transition: 'padding 0.2s, font-size 0.2s',
                  }}
                  onClick={() => {
                    if (spotifyId) {
                      window.open(`https://open.spotify.com/artist/${spotifyId}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >Play</button>
              </div>
              
              {/* Top track card positioned below Follow/Play buttons */}
              <div style={{ marginTop: 24 }}>
                <ArtistsMosts 
                  spotifyId={spotifyId}
                  artistName={selectedArtist?.name}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>







          {/* Artist Collaborators Section */}
          {spotifyId && (
            <div style={{ marginTop: 48, marginBottom: 48 }}>
              <ArtistCollaborators 
                artistId={spotifyId}
                artistName={artistName}
                collaborators={collaborators}
                loading={collaboratorsLoading}
                error={collaboratorsError}
                stats={collaboratorsStats}
                onAnalyze={fetchCollaborators}
              />
            </div>
          )}
          
          {/* Album Selector */}
          <div style={{ marginBottom: 64, marginTop: 48 }}>
                      <div style={{
  display: 'flex',
  flexWrap: 'wrap', // Allow buttons to wrap on very small screens
  gap: 12,
  marginBottom: 18,
  // Responsive centering for mobile:
  justifyContent: isMobile ? 'center' : 'flex-start',
  marginLeft: isMobile ? 0 : 50,
  padding: isMobile ? '0 16px' : 0
}}>              {albumGroups.map(group => (
                <button
                  key={group.value}
                  onClick={() => setAlbumGroup(group.value)}
                  style={{
                    background: albumGroup === group.value ? '#1db954' : '#232323',
                    color: albumGroup === group.value ? '#181818' : '#fff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 16, // Slightly smaller radius
                    // Even smaller padding and font size for mobile
                    padding: isMobile ? '4px 12px' : '8px 18px',
                    fontSize: isMobile ? '0.8rem' : '1.02rem',
                    cursor: 'pointer',
                    boxShadow: albumGroup === group.value ? '0 2px 8px #1db95433' : 'none',
                    transition: 'background 0.18s, color 0.18s',
                    opacity: albumGroup === null ? 0.6 : 1, // Dim buttons when loading
                  }}
                  disabled={albumGroup === null} // Disable buttons while determining first available type
                >
                  {group.label}
                </button>
              ))}
            </div>
            
            {/* Album Sorting Options */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 18,
              justifyContent: isMobile ? 'center' : 'flex-start',
              marginLeft: isMobile ? 0 : 50,
              padding: isMobile ? '0 16px' : 0,
              alignItems: 'center'
            }}>
              <span style={{
                color: '#b3b3b3',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                marginRight: 8
              }}>
                Sort by:
              </span>
              {albumSortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAlbumSortBy(option.value);
                    // Update selected album to first album in new sort order
                    if (albums.length > 0) {
                      // Sort albums temporarily to find the first one
                      const tempSorted = [...albums].sort((a, b) => {
                        switch (option.value) {
                          case 'popularity':
                            return b.popularity - a.popularity;
                          case 'release_date':
                          default:
                            if (!a.releaseDate && !b.releaseDate) return 0;
                            if (!a.releaseDate) return 1;
                            if (!b.releaseDate) return -1;
                            return b.releaseDate.localeCompare(a.releaseDate);
                        }
                      });
                      setSelectedAlbumId(tempSorted[0].id);
                    }
                  }}
                  style={{
                    background: albumSortBy === option.value ? '#1db954' : '#232323',
                    color: albumSortBy === option.value ? '#181818' : '#fff',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 12,
                    padding: isMobile ? '3px 10px' : '6px 14px',
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    cursor: 'pointer',
                    boxShadow: albumSortBy === option.value ? '0 2px 6px #1db95433' : 'none',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {albumGroup === null ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#b3b3b3',
                fontSize: '1rem'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: '3px solid #1db954',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                Finding available content...
              </div>
            ) : (
              <>
                <AlbumSelector
                  albums={albumsWithGenreStyle}
                  selectedAlbumId={selectedAlbumId}
                  onAlbumSelect={album => setSelectedAlbumId(album.id)}
                  albumGenreStyleMap={albumGenreStyleMap}
                />
                {loadingAlbums && <div>Loading...</div>}
                {albumError && <div style={{ color: 'red' }}>{albumError}</div>}
              </>
            )}
          </div>

          {/* Track Table for selected album */}
          {selectedAlbumId && albumTracks.length > 0 && (
            <div style={{ marginBottom: 48,
              display: 'flex',
              justifyContent: 'center'
             }}>
              <NewTrackTable
                tracks={tracksWithAlbumInfo}
                title={selectedAlbum?.name || 'Album Tracks'}
                playlistKey={selectedAlbumId}
                loading={loadingTracks}
                error={tracksError}
                showCreatePlaylist={false}
                showViewPlaylist={false}
                genres={genresForTable}
                showContributorsButton={true}
                onGetContributors={handleGetAlbumContributors}
                wrappedLabel={'Create Album Analysis'}
                isArtistContext={true}
              />
            </div>
          )}

          {/* Concerts Section */}
          {loading && <div>Loading concerts...</div>}
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {!loading && !error && (
            <>
              {/* Pagination Controls Above Calendar */}
              {concerts.length > concertsPerPage && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: 16, 
                  marginBottom: 24,
                  padding: '16px 0'
                }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px',
                      background: currentPage === 1 ? '#333' : '#1db954',
                      color: currentPage === 1 ? '#666' : '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <div style={{ 
                    color: '#fff', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {currentPage} / {Math.ceil(concerts.length / concertsPerPage)}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(concerts.length / concertsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(concerts.length / concertsPerPage)}
                    style={{
                      padding: '8px 16px',
                      background: currentPage === Math.ceil(concerts.length / concertsPerPage) ? '#333' : '#1db954',
                      color: currentPage === Math.ceil(concerts.length / concertsPerPage) ? '#666' : '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: currentPage === Math.ceil(concerts.length / concertsPerPage) ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
              
              <ConcertsList 
                concerts={concerts.slice(
                  (currentPage - 1) * concertsPerPage, 
                  currentPage * concertsPerPage
                )} 
                selectedArtist={artistName}
                currentPage={currentPage}
                totalPages={Math.ceil(concerts.length / concertsPerPage)}
                onPageChange={setCurrentPage}
                showPagination={concerts.length > concertsPerPage}
                allConcerts={concerts}
                totalConcerts={concerts.length}
                concertsPerPage={concertsPerPage}
                ticketmasterIdNotFound={ticketmasterIdNotFound}
              />

            </>
          )}
        </>
      )}
      
      {/* Album Contributors Modal */}
      <AlbumContributorsModal 
        isOpen={showAlbumContributorsModal}
        onClose={() => setShowAlbumContributorsModal(false)}
        contributors={albumContributors}
        loading={albumContributorsLoading}
        error={albumContributorsError}
      />
      

        </main>
      </div>
    </>
  );
}