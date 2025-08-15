"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
// import NewTrackTable from '../../components/NewTrackTable';
import ConcertsList from '../../components/ConcertsList';
import { getArtistCache, setArtistCache, getCachedArtistId, getCachedArtistImage, getCachedSpotifyId } from '../../utils/artistCache';

export default function ConcertsPage() {
  const router = useRouter();
  
  // State for artist selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // State for followed artists and top artists
  const [followedArtists, setFollowedArtists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  
  // State for selected artists
  const [selectedArtists, setSelectedArtists] = useState([]);
  
  // State for concerts
  const [concerts, setConcerts] = useState([]);
  const [loadingConcerts, setLoadingConcerts] = useState(false);
  const [concertsError, setConcertsError] = useState('');
  
  // State for filtering
  const [locationFilters, setLocationFilters] = useState([]); // Array of selected filters
  const [locationInput, setLocationInput] = useState(''); // For manual input
  const [filteredConcerts, setFilteredConcerts] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  
  // State for artist list type (followed or top)
  const [artistListType, setArtistListType] = useState('top'); // 'followed' or 'top'
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const concertsPerPage = 20;
  
  // Debounced search
  const searchTimeoutRef = useRef(null);
  
  // State for tracking if concerts have been searched
  const [hasSearchedConcerts, setHasSearchedConcerts] = useState(false);
  
  // Ref for scrolling to concerts section
  const concertsSectionRef = useRef(null);
  
  // State for screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  const lowerCaseFilters = useMemo(() => 
  locationFilters.map(f => f.toLowerCase()), 
[locationFilters]);
  
  // Fetch followed artists
  useEffect(() => {
    setLoadingFollowed(true);
    fetch('http://127.0.0.1:8000/me/following/artists')
      .then(res => res.ok ? res.json() : { artists: [] })
      .then(data => {
        setFollowedArtists(data.artists || []);
      })
      .catch(err => {
        console.error('Error fetching followed artists:', err);
        setFollowedArtists([]);
      })
      .finally(() => setLoadingFollowed(false));
  }, []);
  
  // Handle screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 680);
    };
    
    // Set initial value
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Fetch all artists from all time periods (deduplicated)
  useEffect(() => {
    setLoadingTop(true);
    fetch('http://127.0.0.1:8000/all-artists-deduplicated')
      .then(res => res.ok ? res.json() : { artists: [] })
      .then(data => {
        setTopArtists(data.artists || []);
        console.log('Deduplicated artists breakdown:', data.breakdown);
      })
      .catch(err => {
        console.error('Error fetching deduplicated artists:', err);
        setTopArtists([]);
      })
      .finally(() => setLoadingTop(false));
  }, []);
  
  // Retry function for API calls
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


  
  // Debounced artist search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchWithRetry(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(searchQuery)}`);
        console.log('Raw Ticketmaster response:', data);
        // Filter for music artists only
        const attractions = data._embedded?.attractions || data.attractions || [];
        console.log('All attractions:', attractions);
        
        const musicArtists = attractions.filter(artist => {
          const isMusic = artist.classifications && 
            artist.classifications.some(classification => 
              classification.segment && classification.segment.name === 'Music'
            );
          console.log(`Artist ${artist.name}: isMusic = ${isMusic}`);
          return isMusic;
        });
        
        // Cache successful results with images (no Spotify ID for manual search)
        musicArtists.forEach(artist => {
          const imageUrl = artist.images?.[0]?.url || null;
          setArtistCache(artist.name, artist.id, imageUrl, null);
        });
        
        console.log('Filtered music artists:', musicArtists);
        setSearchResults(musicArtists);
      } catch (err) {
        console.error('Error searching artists:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // Filter concerts when location filters change
  useEffect(() => {
    if (locationFilters.length === 0) {
      setFilteredConcerts(concerts);
    } else {
      const filtered = concerts.filter(concert => {
        const venue = concert._embedded?.venues?.[0];
        
        // Check if any of the selected filters match
        const hasMatchingFilter = locationFilters.some(filter => {
          const searchTerm = filter.toLowerCase();
          
          // Search by artist names (check all attractions)
          const artistNames = concert._embedded?.attractions?.map(attraction => 
            attraction.name?.toLowerCase() || ''
          ) || [];
          
          const hasMatchingArtist = artistNames.some(artistName => 
            artistName.includes(searchTerm)
          );
          
          // Search by location (city, country, state)
          let hasMatchingLocation = false;
          if (venue) {
            const city = venue.city?.name || '';
            const country = venue.country?.name || '';
            const state = venue.state?.name || '';
            
            hasMatchingLocation = city.toLowerCase().includes(searchTerm) ||
                                 country.toLowerCase().includes(searchTerm) ||
                                 state.toLowerCase().includes(searchTerm);
          }
          
          // Return true if either artist name or location matches this filter
          return hasMatchingArtist || hasMatchingLocation;
        });
        
        // Return true if any filter matches
        return hasMatchingFilter;
      });
      setFilteredConcerts(filtered);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [concerts, locationFilters]);
  
  // Add artist to selection
  const addArtist = (artist) => {
    if (!selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists(prev => [...prev, artist]);
      // Clear search bar after selection for better UX
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Auto-search and add artist from Spotify
  const autoSearchAndAddArtist = async (artistName, spotifyArtist = null) => {
    try {
      // Check cache first
      const cachedId = getCachedArtistId(artistName);
      if (cachedId) {
        console.log(`Found cached Ticketmaster ID for "${artistName}": ${cachedId}`);
        // Get cached image and Spotify ID if available
        const cachedImage = getCachedArtistImage(artistName);
        const cachedSpotifyId = getCachedSpotifyId(artistName);
        // Create a mock artist object with the cached data
        const cachedArtist = {
          id: cachedId,
          name: artistName,
          images: cachedImage ? [{ url: cachedImage }] : [],
          spotifyId: cachedSpotifyId || spotifyArtist?.id,
          // Add minimal required fields
          classifications: [{ segment: { name: 'Music' } }]
        };
        addArtist(cachedArtist);
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
        // Cache the successful result with image and Spotify ID
        const firstArtist = musicArtists[0];
        const imageUrl = firstArtist.images?.[0]?.url || null;
        const spotifyId = spotifyArtist?.id || null;
        setArtistCache(artistName, firstArtist.id, imageUrl, spotifyId);
        console.log(`Cached Ticketmaster ID for "${artistName}": ${firstArtist.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
        
        // Add Spotify ID to the artist object
        const artistWithSpotifyId = {
          ...firstArtist,
          spotifyId: spotifyId
        };
        
        // Auto-select the first match
        addArtist(artistWithSpotifyId);
      } else {
        // If no match found, just set the search query
        setSearchQuery(artistName);
      }
    } catch (err) {
      console.error('Error auto-searching artist:', err);
      setSearchQuery(artistName);
    }
  };
  
  // Remove artist from selection
  const removeArtist = (artistId) => {
    setSelectedArtists(prev => prev.filter(a => a.id !== artistId));
  };

  // Select all followed artists
  const selectAllFollowed = async () => {
    const artistsToAdd = followedArtists.filter(artist => 
      !selectedArtists.find(selected => selected.id === artist.id)
    );
    
    for (const artist of artistsToAdd) {
      await autoSearchAndAddArtist(artist.name, artist);
    }
  };

  // Select all top artists
  const selectAllTop = async () => {
    const artistsToAdd = topArtists.filter(artist => 
      !selectedArtists.find(selected => selected.id === artist.id)
    );
    
    for (const artist of artistsToAdd) {
      await autoSearchAndAddArtist(artist.name, artist);
    }
  };

  // Remove all selected artists
  const removeAllArtists = () => {
    setSelectedArtists([]);
  };

  // Toggle location filter (add if not present, remove if present)
  const toggleLocationFilter = (filter) => {
    if (locationFilters.includes(filter)) {
      setLocationFilters(prev => prev.filter(f => f !== filter));
    } else {
      setLocationFilters(prev => [...prev, filter]);
    }
  };

  // Remove location filter
  const removeLocationFilter = (filter) => {
    setLocationFilters(prev => prev.filter(f => f !== filter));
  };

  // Clear all location filters
  const clearAllLocationFilters = () => {
    setLocationFilters([]);
  };

  // Handle manual filter input
  const handleLocationInputKeyPress = (e) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      toggleLocationFilter(locationInput.trim());
      setLocationInput('');
    }
  };

  // Navigate to artist page
  const navigateToArtist = (artist) => {
    if (artist.spotifyId && artist.id) {
      router.push(`/artist?name=${encodeURIComponent(artist.name)}&spotifyId=${artist.spotifyId}&ticketmasterId=${artist.id}`);
    } else {
      console.log('Missing Spotify ID or Ticketmaster ID for navigation');
    }
  };
  
  // Search concerts for selected artists (globally)
  const searchConcerts = async () => {
    if (selectedArtists.length === 0) {
      setConcertsError('Please select at least one artist.');
      return;
    }
    
    setHasSearchedConcerts(true); // Set to true when searching
    setLoadingConcerts(true);
    setConcertsError('');
    setConcerts([]);
    setLocationFilters([]); // Reset filters
    setCurrentPage(1); // Reset to first page
    
    try {
      // Extract artist IDs from selected artists
      const artistIds = selectedArtists.map(artist => artist.id).filter(Boolean);
      
      if (artistIds.length === 0) {
        setConcertsError('No valid artist IDs found.');
        return;
      }
      
      console.log(`Making optimized batch request for ${artistIds.length} artists`);
      
      // Use the new optimized batch endpoint
      const response = await fetch('http://127.0.0.1:8000/concerts/events/optimized-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artistIds }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const allConcerts = data.concerts || [];
      
      console.log(`Received ${allConcerts.length} concerts from optimized batch endpoint`);
      
      // Add artist info to each event (match by artistId)
      const concertsWithArtistInfo = allConcerts.map(event => {
        const artist = selectedArtists.find(a => a.id === event.artistId);
        return {
          ...event,
          artist: artist || null
        };
      });
      
      // Sort by date
      concertsWithArtistInfo.sort((a, b) => {
        const dateA = a.dates?.start?.localDate || '';
        const dateB = b.dates?.start?.localDate || '';
        return dateA.localeCompare(dateB);
      });
      
      setConcerts(concertsWithArtistInfo);
      setFilteredConcerts(concertsWithArtistInfo);
      
      // Scroll to concerts section after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (concertsSectionRef.current) {
          concertsSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
      
      // Extract cities and countries with concert counts from concerts
      const cityCounts = {};
      const countryCounts = {};
      
      concertsWithArtistInfo.forEach(concert => {
        const venue = concert._embedded?.venues?.[0];
        if (venue) {
          if (venue.city?.name) {
            cityCounts[venue.city.name] = (cityCounts[venue.city.name] || 0) + 1;
          }
          if (venue.country?.name) {
            countryCounts[venue.country.name] = (countryCounts[venue.country.name] || 0) + 1;
          }
        }
      });
      
      // Sort cities by concert count (most to least)
      const sortedCities = Object.entries(cityCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([city]) => city);
      
      // Sort countries by concert count (most to least)
      const sortedCountries = Object.entries(countryCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([country]) => country);
      
      setAvailableCities(sortedCities);
      setAvailableCountries(sortedCountries);
    } catch (err) {
      setConcertsError('Failed to fetch concerts. Please try again.');
      console.error('Error fetching concerts:', err);
    } finally {
      setLoadingConcerts(false);
    }
  };
  
  return (
    <main style={{ padding: 32, background: '#101114', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/')}
          className={styles.vibeButton}
        >
          Profile
        </button>
      </div>
      
      <h1 style={{ 
        marginBottom: 32, 
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: 900,
        color: '#fff',
        textAlign: 'center'
      }}>
        Find Concerts Worldwide
      </h1>
      
      {/* Artist Selection */}
      <div style={{ 
        background: '#181818', 
        padding: 24, 
        borderRadius: 16, 
        marginBottom: 32,
        boxShadow: '0 4px 16px #0003'
      }}>
        <h2 style={{ color: '#fff', marginBottom: 16, fontSize: '1.5rem' }}>Select Artists</h2>
        
        {/* Search Artists */}
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for artists on Ticketmaster..."
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
          {searching && <div style={{ color: '#1db954' }}>Searching...</div>}
          {searchResults.length > 0 && (
            <div style={{ 
              maxHeight: 200, 
              overflowY: 'auto',
              background: '#232323',
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              {searchResults.map(artist => (
                <div
                  key={artist.id}
                  onClick={() => addArtist(artist)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#404040'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {artist.images?.[0]?.url && (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <span>{artist.name}</span>
                </div>
              ))}
            </div>
          )}
          {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: 8 }}>
              No artists found. Try a different search term.
            </div>
          )}
        </div>
        
        {/* Toggle Buttons for Artist List Type */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setArtistListType('top')}
            style={{
              padding: '10px 24px',
              background: artistListType === 'top' ? '#1db954' : '#232323',
              color: artistListType === 'top' ? '#000' : '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Your Top Artists
          </button>
          <button
            onClick={() => setArtistListType('followed')}
            style={{
              padding: '10px 24px',
              background: artistListType === 'followed' ? '#1db954' : '#232323',
              color: artistListType === 'followed' ? '#000' : '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Your Followed Artists
          </button>
        </div>
        
        {/* Unified Artist List (Followed or Top) */}
        {artistListType === 'followed' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 12 
            }}>
              <h3 style={{ color: '#b3b3b3', fontSize: '1.1rem', margin: 0 }}>
                Your Followed Artists {loadingFollowed && '(Loading...)'}
              </h3>
              {followedArtists.length > 0 && (
                <button
                  onClick={selectAllFollowed}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Select All
                </button>
              )}
            </div>
            <div 
              className="followed-artists-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                maxHeight: 290,
                overflowY: 'auto'
              }}
            >
              {followedArtists.map(artist => (
                <button
                  key={artist.id}
                  onClick={() => autoSearchAndAddArtist(artist.name, artist)}
                  style={{
                    padding: isMobile ? '12px 16px' : '16px 24px',
                    background: '#232323',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                    minWidth: isMobile ? 120 : 100,
                    height: isMobile ? '44px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1db954';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#232323';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  {artist.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {artistListType === 'top' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 12 
            }}>
              <h3 style={{ color: '#b3b3b3', fontSize: '1.1rem', margin: 0 }}>
                Your Top Artists {loadingTop && '(Loading...)'}
              </h3>
              {topArtists.length > 0 && (
                <button
                  onClick={selectAllTop}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Select All
                </button>
              )}
            </div>
            <div 
              className="top-artists-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                maxHeight: 290,
                overflowY: 'auto'
              }}
            >
              {topArtists.map(artist => (
                <button
                  key={artist.id}
                  onClick={() => autoSearchAndAddArtist(artist.name, artist)}
                  style={{
                    padding: isMobile ? '12px 16px' : '16px 24px',
                    background: '#232323',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                    minWidth: isMobile ? 120 : 100,
                    height: isMobile ? '44px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1db954';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#232323';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  {artist.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Selected Artists */}
        {selectedArtists.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 12 
            }}>
              <h3 style={{ color: '#1db954', fontSize: '1.1rem', margin: 0 }}>
                Selected Artists ({selectedArtists.length})
              </h3>
              <button
                onClick={removeAllArtists}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Remove All
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 12,
              maxHeight: 240,
              overflowY: 'auto'
            }}>
              {selectedArtists.map(selectedArtist => (
                <div
                  key={selectedArtist.id}
                  className="selected-artist-chip"
                  style={{
                    padding: isSmallMobile ? '6px 10px' : '12px 16px',
                    background: '#1db954',
                    color: '#000',
                    border: '1px solid #1db954',
                    borderRadius: 20,
                    fontSize: isSmallMobile ? '0.7rem' : '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 'fit-content',
                    cursor: selectedArtist.spotifyId ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => selectedArtist.spotifyId && navigateToArtist(selectedArtist)}
                  onMouseEnter={(e) => {
                    if (selectedArtist.spotifyId) {
                      e.currentTarget.style.background = '#1ed760';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedArtist.spotifyId) {
                      e.currentTarget.style.background = '#1db954';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Artist Image */}
                  {selectedArtist.images?.[0]?.url && (
                    <img 
                      src={selectedArtist.images[0].url} 
                      alt={selectedArtist.name}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '1px solid #000',
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>{selectedArtist.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent click
                      removeArtist(selectedArtist.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: 0,
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 4,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search Concerts Button */}
        <button
          onClick={searchConcerts}
          disabled={selectedArtists.length === 0 || loadingConcerts}
          style={{
            padding: '16px 32px',
            background: selectedArtists.length > 0 ? '#10b981' : '#374151',
            color: selectedArtists.length > 0 ? '#fff' : '#6b7280',
            border: 'none',
            borderRadius: 12,
            fontSize: '1.1rem',
            fontWeight: 800,
            cursor: selectedArtists.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedArtists.length > 0 ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
            transform: selectedArtists.length > 0 ? 'translateY(0)' : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            if (selectedArtists.length > 0) {
              e.currentTarget.style.background = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedArtists.length > 0) {
              e.currentTarget.style.background = '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
            }
          }}
        >
          {loadingConcerts ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                border: '2px solid transparent', 
                borderTop: '2px solid #fff', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
              Searching Worldwide...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              Find All Concerts
            </span>
          )}
                </button>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Basic styling for artist buttons - less restrictive */
          .top-artists-grid button,
          .followed-artists-grid button {
            background: #232323;
            color: #fff;
            border: 1px solid #333;
            border-radius: 20px;
            transition: all 0.2s;
          }
          
          .top-artists-grid button:hover,
          .followed-artists-grid button:hover {
            background: #1db954;
            color: #000;
          }
          
          /* Ensure consistent spacing and prevent overrides */
          .top-artists-grid,
          .followed-artists-grid {
            gap: 12px !important;
            display: grid !important;
          }
          
          /* Force minimum button sizes to prevent cramping */
          .top-artists-grid button,
          .followed-artists-grid button {
            min-width: 120px !important;
            box-sizing: border-box !important;
          }
          

          
          /* Selected Artists styling */
          .selected-artist-chip {
            background: #1db954 !important;
            color: #000 !important;
            border: 1px solid #1db954 !important;
            border-radius: 20px !important;
            transition: all 0.2s !important;
          }
          
          .selected-artist-chip:hover {
            background: #1ed760 !important;
            transform: translateY(-1px) !important;
          }
          
          /* Responsive styling for small screens */
          @media (max-width: 680px) {
            .selected-artist-chip {
              padding: 4px 8px !important;
              font-size: 0.65rem !important;
              gap: 6px !important;
            }
            
            .selected-artist-chip img {
              width: 18px !important;
              height: 18px !important;
            }
            
            .selected-artist-chip button {
              width: 16px !important;
              height: 16px !important;
              font-size: 1rem !important;
            }
          }
        `}</style>
        
        </div>
      
      {/* Concerts Results */}
      {concertsError && (
        <div style={{ 
          background: '#f87171', 
          color: '#000', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24 
        }}>
          {concertsError}
        </div>
      )}
      
      {/* Only show this message after a search attempt */}
      {!loadingConcerts && !concertsError && concerts.length === 0 && selectedArtists.length > 0 && hasSearchedConcerts && (
        <div style={{ 
          background: '#181818', 
          padding: 24, 
          borderRadius: 16, 
          marginBottom: 24,
          boxShadow: '0 4px 16px #0003',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: '#b3b3b3', 
            fontSize: '1.2rem', 
            marginBottom: 8,

          }}>
            No upcoming concerts found
          </div>
          <div style={{ 
            color: '#888', 
            fontSize: '1rem' 
          }}>
            No concerts were found for the selected artists on Ticketmaster.
          </div>
        </div>
      )}
      
      {concerts.length > 0 && (
        <div 
          ref={concertsSectionRef}
          style={{ 
            background: '#181818', 
            padding: 24, 
            borderRadius: 16,
            boxShadow: '0 4px 16px #0003'
          }}
        >
          <div style={{ 
            marginBottom: 24 
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>
              Concerts Found ({filteredConcerts.length} of {concerts.length})
            </h2>
          </div>
          
          {/* Location Filter */}
          <div style={{ marginBottom: 24 }}>
            {/* Selected Filters Display */}
            {locationFilters.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  color: '#1db954', 
                  fontSize: '0.9rem', 
                  marginBottom: 8,
                  fontWeight: 600
                }}>
                  Active Filters ({locationFilters.length}):
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 8,
                  marginBottom: 12
                }}>
                  {locationFilters.map(filter => (
                    <div
                      key={filter}
                      style={{
                        padding: '6px 12px',
                        background: '#1db954',
                        color: '#000',
                        border: '1px solid #1db954',
                        borderRadius: 16,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600,
                      }}
                    >
                      <span>{filter}</span>
                      <button
                        onClick={() => removeLocationFilter(filter)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#000',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          width: 16,
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={clearAllLocationFilters}
                    style={{
                      padding: '6px 12px',
                      background: '#f87171',
                      color: '#000',
                      border: '1px solid #f87171',
                      borderRadius: 16,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f87171'}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
            
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={handleLocationInputKeyPress}
              placeholder="Type location or artist name and press Enter to add filter"
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
            
            {/* Available Location Buttons */}
            {(availableCities.length > 0 || availableCountries.length > 0) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: 24
                }}>
                  {/* Cities Section */}
                  {availableCities.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#1db954', 
                        fontSize: '0.9rem', 
                        marginBottom: 8,
                        fontWeight: 600
                      }}>
                        Cities ({availableCities.length}):
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: 6,
                        maxHeight: 220,
                        overflowY: 'auto',
                        paddingBottom: 16,
                        boxShadow: 'inset 0 -16px 16px -16px #101114',
                      }}>
                        {availableCities.map(city => (
                          <button
                            key={city}
                            onClick={() => toggleLocationFilter(city)}
                            style={{
                              padding: '4px 8px',
                             background: lowerCaseFilters.includes(city.toLowerCase()) ? '#1db954' : '#232323',
color: lowerCaseFilters.includes(city.toLowerCase()) ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: 0,
                            }}
                            onMouseEnter={(e) => {
                              if (!locationFilters.includes(city)) {
                                e.currentTarget.style.background = '#404040';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!locationFilters.includes(city)) {
                                e.currentTarget.style.background = '#232323';
                              }
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Countries Section */}
                  {availableCountries.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#fbbf24', 
                        fontSize: '0.9rem', 
                        marginBottom: 8,
                        fontWeight: 600
                      }}>
                        Countries ({availableCountries.length}):
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: 6,
                        maxHeight: 220,
                        overflowY: 'auto',
                        paddingBottom: 16,
                        boxShadow: 'inset 0 -16px 16px -16px #101114',
                      }}>
                        {availableCountries.map(country => (
                          <button
                            key={country}
                            onClick={() => toggleLocationFilter(country)}
                            style={{
                              padding: '4px 8px',
                              background: locationFilters.includes(country) ? '#fbbf24' : '#232323',
                              color: locationFilters.includes(country) ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: 0,
                            }}
                            onMouseEnter={(e) => {
                              if (!locationFilters.includes(country)) {
                                e.currentTarget.style.background = '#404040';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!locationFilters.includes(country)) {
                                e.currentTarget.style.background = '#232323';
                              }
                            }}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                

              </div>
            )}
          </div>
          
          {/* Pagination Info */}
          {filteredConcerts.length > 0 && (
            <div style={{ 
              marginBottom: 24, 
              color: '#fff', 
              fontSize: '1.1rem',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Concerts Found ({filteredConcerts.length} of {concerts.length})
            </div>
          )}
          
          {/* Pagination Controls Above Calendar */}
          {filteredConcerts.length > concertsPerPage && (
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
                {currentPage} / {Math.ceil(filteredConcerts.length / concertsPerPage)}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredConcerts.length / concertsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredConcerts.length / concertsPerPage)}
                style={{
                  padding: '8px 16px',
                  background: currentPage === Math.ceil(filteredConcerts.length / concertsPerPage) ? '#333' : '#1db954',
                  color: currentPage === Math.ceil(filteredConcerts.length / concertsPerPage) ? '#666' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  cursor: currentPage === Math.ceil(filteredConcerts.length / concertsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                Next →
              </button>
            </div>
          )}
          
          {/* Paginated Concerts */}
          <ConcertsList 
            concerts={filteredConcerts.slice(
              (currentPage - 1) * concertsPerPage, 
              currentPage * concertsPerPage
            )} 
            selectedArtist={selectedArtists.length > 0 ? (() => {
              const artistNames = selectedArtists.map(artist => artist.name).join(', ');
              console.log('Selected artists for highlighting:', artistNames);
              return artistNames;
            })() : null}
            currentPage={currentPage}
            totalPages={Math.ceil(filteredConcerts.length / concertsPerPage)}
            onPageChange={setCurrentPage}
            showPagination={filteredConcerts.length > concertsPerPage}
            allConcerts={filteredConcerts} // Pass all concerts for calendar
          />
        </div>
      )}
    </main>
  );
} 