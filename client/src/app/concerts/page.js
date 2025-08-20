"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
// import NewTrackTable from '../../components/NewTrackTable';
import ConcertsList from '../../components/ConcertsList';
import { getArtistCache, setArtistCache, getCachedArtistId, getCachedArtistImage, getCachedSpotifyId } from '../../utils/artistCache';
import { optimizedConcertApiCall, optimizedArtistSearch } from '../../utils/concertApiOptimizer';

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
  
  // State for batch operations
  const [isBatchSelecting, setIsBatchSelecting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
  // State for final processing phase
  const [isProcessingResults, setIsProcessingResults] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  
  // State for final report
  const [finalReport, setFinalReport] = useState(null);
  
  // Function to check if an artist has a Ticketmaster ID
  const hasTicketmasterId = (artistName) => {
    return getCachedArtistId(artistName) !== null;
  };
  
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
      
      // Force re-render to show green checkmarks immediately
      // This is a simple way to trigger a re-render when the cache changes
      setTimeout(() => {
        setSelectedArtists(prev => [...prev]);
      }, 100);
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
        
        // Update report for successful cached artist
        updateReportForIndividualArtist(artistName, true, cachedArtist);
        return;
      }

      // Use optimized API call with caching
      const searchData = await optimizedConcertApiCall(
        'http://127.0.0.1:8000/ticketmaster/search-artist',
        {
          params: { artistName },
          cacheKey: `artist-search-${artistName.toLowerCase()}`
        }
      );
      
      const attractions = searchData._embedded?.attractions || searchData.attractions || [];
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
        
        console.log(`🎯 Found artist "${artistName}" on Ticketmaster with ID: ${firstArtist.id}`);
        
        // Cache the artist in the required format for artistNameToTicketmasterId
        try {
          setArtistCache(artistName, firstArtist.id, imageUrl, spotifyId);
          console.log(`✅ Successfully cached Ticketmaster ID for "${artistName}": ${firstArtist.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
        } catch (cacheError) {
          console.error(`❌ Failed to cache artist "${artistName}":`, cacheError);
        }
        
        // Add Spotify ID to the artist object
        const artistWithSpotifyId = {
          ...firstArtist,
          spotifyId: spotifyId
        };
        
        // Auto-select the first match
        addArtist(artistWithSpotifyId);
        
        // Update report for successful artist
        updateReportForIndividualArtist(artistName, true, artistWithSpotifyId);
      } else {
        // If no match found, add to failed artists in report
        console.log(`❌ No Ticketmaster ID found for "${artistName}"`);
        
        // Update report for failed artist
        updateReportForIndividualArtist(artistName, false, spotifyArtist);
      }
    } catch (err) {
      console.error('Error auto-searching artist:', err);
      setSearchQuery(artistName);
      
      // Update report for failed artist due to error
      updateReportForIndividualArtist(artistName, false, spotifyArtist);
    }
  };
  
  // Update report for individual artist clicks
  const updateReportForIndividualArtist = (artistName, isSuccess, artistData) => {
    if (isSuccess) {
      // Artist was found successfully
      const currentReport = finalReport || {
        total: 0,
        successful: 0,
        failed: 0,
        failedArtists: [],
        successfulNames: [],
        isVisible: true
      };
      
      // Check if artist is already in successful names
      if (!currentReport.successfulNames.includes(artistName)) {
        setFinalReport({
          ...currentReport,
          total: currentReport.total + 1,
          successful: currentReport.successful + 1,
          successfulNames: [...currentReport.successfulNames, artistName]
        });
      }
    } else {
      // Artist was not found
      const currentReport = finalReport || {
        total: 0,
        successful: 0,
        failed: 0,
        failedArtists: [],
        successfulNames: [],
        isVisible: true
      };
      
      // Check if artist is already in failed artists
      const alreadyFailed = currentReport.failedArtists.find(failed => failed.id === artistData?.id);
      if (!alreadyFailed) {
        setFinalReport({
          ...currentReport,
          total: currentReport.total + 1,
          failed: currentReport.failed + 1,
          failedArtists: [...currentReport.failedArtists, artistData || { name: artistName, id: `unknown-${Date.now()}` }]
        });
      }
    }
  };

  // Remove artist from selection
  const removeArtist = (artistId) => {
    setSelectedArtists(prev => prev.filter(a => a.id !== artistId));
  };

    // Select all followed artists
  const selectAllFollowed = async () => {
    // Smart deduplication: check against already selected and failed artists
    const artistsToAdd = followedArtists.filter(artist => {
      const alreadySelected = selectedArtists.find(selected => selected.id === artist.id);
      const alreadyFailed = finalReport?.failedArtists?.find(failed => failed.id === artist.id);
      return !alreadySelected && !alreadyFailed;
    });
    
    if (artistsToAdd.length === 0) {
      console.log('All followed artists already processed in previous searches');
      return;
    }
    
    setIsBatchSelecting(true);
    setBatchProgress({ current: 0, total: artistsToAdd.length });
    
    try {
      console.log(`Selecting ${artistsToAdd.length} new followed artists (${followedArtists.length - artistsToAdd.length} already processed)`);
      
      // Use optimized batch artist search with real-time progress updates
      const results = await optimizedArtistSearch(
        artistsToAdd.map(artist => artist.name),
        200, // 200ms delay between API calls
        (current, total) => {
          // Real-time progress callback
          setBatchProgress(prev => ({ ...prev, current, total }));
        }
      );
      
      // Start final processing phase
      setIsProcessingResults(true);
      setProcessingProgress({ current: 0, total: results.length });
      
      // Track results for final report
      const successfulArtists = [];
      const failedArtists = [];
      
      // Process results and add successful artists one by one
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
        
        if (result.success && result.data) {
          const originalArtist = artistsToAdd[i];
          const artistWithSpotifyId = {
            ...result.data,
            spotifyId: originalArtist.id
          };
          
          // Cache the result if it wasn't already cached
          if (!result.cached) {
            const imageUrl = result.data.images?.[0]?.url || null;
            setArtistCache(result.data.name, result.data.id, imageUrl, originalArtist.id);
            console.log(`✅ Batch cached Ticketmaster ID for "${result.data.name}": ${result.data.id}`);
          } else {
            console.log(`🟢 Using cached Ticketmaster ID for "${result.data.name}": ${result.data.id}`);
          }
          
          successfulArtists.push(result.data.name);
          
          // Add artist one by one with a small delay for visual effect
          addArtist(artistWithSpotifyId);
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between additions
        } else {
          console.warn(`Failed to find artist "${artistsToAdd[i].name}":`, result.error);
          failedArtists.push(artistsToAdd[i]); // Store full artist object instead of just name
        }
      }
      
      // Generate combined final report with deduplication
      const allFailedArtists = [
        ...(finalReport?.failedArtists || []),
        ...failedArtists
      ];
      const allSuccessfulNames = [
        ...(finalReport?.successfulNames || []),
        ...successfulArtists
      ];
      
      // Remove duplicates from successful names
      const uniqueSuccessfulNames = [...new Set(allSuccessfulNames)];
      
      // Remove duplicates from failed artists (based on Spotify ID)
      const uniqueFailedArtists = allFailedArtists.filter((artist, index, self) => 
        index === self.findIndex(a => a.id === artist.id)
      );
      
      setFinalReport({
        total: uniqueSuccessfulNames.length + uniqueFailedArtists.length,
        successful: uniqueSuccessfulNames.length,
        failed: uniqueFailedArtists.length,
        failedArtists: uniqueFailedArtists,
        successfulNames: uniqueSuccessfulNames,
        isVisible: true // Initially show the report
      });
    } catch (error) {
      console.error('Error in batch artist selection:', error);
    } finally {
      setIsBatchSelecting(false);
      setBatchProgress({ current: 0, total: 0 });
      setIsProcessingResults(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  // Select all top artists
  const selectAllTop = async () => {
    // Smart deduplication: check against already selected and failed artists
    const artistsToAdd = topArtists.filter(artist => {
      const alreadySelected = selectedArtists.find(selected => selected.id === artist.id);
      const alreadyFailed = finalReport?.failedArtists?.find(failed => failed.id === artist.id);
      return !alreadySelected && !alreadyFailed;
    });
    
    if (artistsToAdd.length === 0) {
      console.log('All top artists already processed in previous searches');
      return;
    }
    
    setIsBatchSelecting(true);
    setBatchProgress({ current: 0, total: artistsToAdd.length });
    
    try {
      console.log(`Selecting ${artistsToAdd.length} new top artists (${topArtists.length - artistsToAdd.length} already processed)`);
      
      // Use optimized batch artist search with real-time progress updates
      const results = await optimizedArtistSearch(
        artistsToAdd.map(artist => artist.name),
        200, // 200ms delay between API calls
        (current, total) => {
          // Real-time progress callback
          setBatchProgress(prev => ({ ...prev, current, total }));
        }
      );
      
      // Start final processing phase
      setIsProcessingResults(true);
      setProcessingProgress({ current: 0, total: results.length });
      
      // Track results for final report
      const successfulArtists = [];
      const failedArtists = [];
      
      // Process results and add successful artists one by one
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
        
        if (result.success && result.data) {
          const originalArtist = artistsToAdd[i];
          const artistWithSpotifyId = {
            ...result.data,
            spotifyId: originalArtist.id
          };
          
          // Cache the result if it wasn't already cached
          if (!result.cached) {
            const imageUrl = result.data.images?.[0]?.url || null;
            setArtistCache(result.data.name, result.data.id, imageUrl, originalArtist.id);
            console.log(`✅ Batch cached Ticketmaster ID for "${result.data.name}": ${result.data.id}`);
          } else {
            console.log(`🟢 Using cached Ticketmaster ID for "${result.data.name}": ${result.data.id}`);
          }
          
          successfulArtists.push(result.data.name);
          
          // Add artist one by one with a small delay for visual effect
          addArtist(artistWithSpotifyId);
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between additions
        } else {
          console.warn(`Failed to find artist "${artistsToAdd[i].name}":`, result.error);
          failedArtists.push(artistsToAdd[i]); // Store full artist object instead of just name
        }
      }
      
      // Generate combined final report with deduplication
      const allFailedArtists = [
        ...(finalReport?.failedArtists || []),
        ...failedArtists
      ];
      const allSuccessfulNames = [
        ...(finalReport?.successfulNames || []),
        ...successfulArtists
      ];
      
      // Remove duplicates from successful names
      const uniqueSuccessfulNames = [...new Set(allSuccessfulNames)];
      
      // Remove duplicates from failed artists (based on Spotify ID)
      const uniqueFailedArtists = allFailedArtists.filter((artist, index, self) => 
        index === self.findIndex(a => a.id === artist.id)
      );
      
      setFinalReport({
        total: uniqueSuccessfulNames.length + uniqueFailedArtists.length,
        successful: uniqueSuccessfulNames.length,
        failed: uniqueFailedArtists.length,
        failedArtists: uniqueFailedArtists,
        successfulNames: uniqueSuccessfulNames,
        isVisible: true // Initially show the report
      });
    } catch (error) {
      console.error('Error in batch artist selection:', error);
    } finally {
      setIsBatchSelecting(false);
      setBatchProgress({ current: 0, total: 0 });
      setIsProcessingResults(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  // Remove all selected artists
  const removeAllArtists = () => {
    setSelectedArtists([]);
    // Also clear the final report when removing all artists
    setFinalReport(null);
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
  
  // Scroll to top of concerts section
  const scrollToConcertsTop = () => {
    if (concertsSectionRef.current) {
      concertsSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
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
                  onClick={() => {
                    addArtist(artist);
                    // Also add to report as successful artist from search
                    updateReportForIndividualArtist(artist.name, true, artist);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.2s',
                    position: 'relative',
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
                  
                  {/* Green checkmark icon when Ticketmaster ID is found */}
                  {hasTicketmasterId(artist.name) && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '16px',
                      width: '20px',
                      height: '20px',
                      background: '#1db954',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #232323',
                      fontSize: '12px',
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                      ✓
                    </div>
                  )}
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
        
        {/* Unified Progress Bar */}
        {(isBatchSelecting || isProcessingResults) && (
          <div style={{ 
            background: '#1db954', 
            color: '#000', 
            padding: '16px 24px', 
            borderRadius: 12, 
            marginBottom: 24,
            textAlign: 'center',
            fontWeight: 600
          }}>
            <div style={{ marginBottom: 8 }}>
              {isProcessingResults 
                ? '🟢 Processing Results & Adding Artists...'
                : '🔍 Optimizing Artists Searches with intelligent caching...'
              }
            </div>
            <div style={{ marginBottom: 12 }}>
              {isProcessingResults 
                ? `Processing result ${processingProgress.current} of ${processingProgress.total}`
                : `Processing artist ${batchProgress.current} of ${batchProgress.total}`
              }
            </div>
            <div style={{ 
              width: '100%', 
              background: '#0003', 
              borderRadius: 8, 
              height: 8,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: isProcessingResults 
                  ? `${(processingProgress.current / processingProgress.total) * 100}%`
                  : `${(batchProgress.current / batchProgress.total) * 100}%`, 
                height: '100%', 
                background: '#000', 
                transition: 'width 0.3s ease',
                borderRadius: 8
              }} />
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: 8, opacity: 0.8 }}>
              {isProcessingResults 
                ? 'Adding artists to selection and updating cache...'
                : 'Please wait...'
              }
            </div>
            
            {!isProcessingResults && (
              <div style={{ fontSize: '0.9rem', marginTop: 8, opacity: 0.8, fontStyle: 'italic' }}>
                Found Ticketmaster IDs are automatically cached for instant future access
              </div>
            )}
            

          </div>
        )}
        
        {/* Show Report Button - Only visible when report exists but is not displayed */}
        {finalReport && !finalReport.isVisible && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 24 
          }}>
            <button
              onClick={() => setFinalReport(prev => ({ ...prev, isVisible: true }))}
              style={{
                padding: '12px 24px',
                background: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#414B5A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#374151';
              }}
            >
              Show Report
            </button>
          </div>
        )}
        
        {/* Final Report */}
        {finalReport && finalReport.isVisible && (
          <div style={{ 
            background: '#232323', 
            color: '#000', 
            padding: '20px 24px', 
            borderRadius: 12, 
            marginBottom: 24,
            textAlign: 'center',
            fontWeight: 600
          }}>
            <div style={{ marginBottom: 16, color: '#fff' }}>
              Artist Search Complete!
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: isMobile ? '8px' : '16px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                background: '#ffffff33', 
                padding: isMobile ? '8px' : '12px', 
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '1rem' : '1.2rem', 
                  fontWeight: 'bold', 
                  color: '#fff' 
                }}>
                  {finalReport.total}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '0.8rem' : '0.9rem', 
                  color: '#fff' 
                }}>
                  Total Artists
                </div>
              </div>
              
              <div style={{ 
                background: '#ffffff33', 
                padding: isMobile ? '8px' : '12px', 
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '1rem' : '1.2rem', 
                  fontWeight: 'bold', 
                  color: '#fff' 
                }}>
                  {finalReport.successful}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '0.8rem' : '0.9rem', 
                  color: '#fff' 
                }}>
                  Successful
                </div>
              </div>
              
              <div style={{ 
                background: '#ffffff33', 
                padding: isMobile ? '8px' : '12px', 
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '1rem' : '1.2rem', 
                  fontWeight: 'bold', 
                  color: '#fff' 
                }}>
                  {finalReport.failed}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '0.8rem' : '0.9rem', 
                  color: '#fff' 
                }}>
                  Failed
                </div>
              </div>
            </div>
            
            {finalReport.failed > 0 && (
              <div style={{ 
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  color: '#fff',
                  fontSize: '1rem'
                }}>
                  ❌ Failed Artists ({finalReport.failed}):
                </div>
                
                {/* Optional Fail Reason Toggle */}
                <div style={{ 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setFinalReport(prev => ({ ...prev, showFailReasons: !prev.showFailReasons }))}
                    style={{
                      background: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.borderColor = '#6b7280';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.borderColor = '#4b5563';
                    }}
                  >
                    {finalReport.showFailReasons ? 'Hide' : 'Show'} Fail Reasons
                  </button>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                  </span>
                </div>
                
                {/* Fail Reasons Display */}
                {finalReport.showFailReasons && (
                  <div style={{ 
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    fontSize: '0.8rem',
                    color: '#d1d5db',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      color: '#9ca3af'
                    }}>
                      Common Fail Reasons:
                    </div>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '16px',
                      fontSize: isMobile ? '0.65rem' : '0.75rem'
                    }}>
                      <li>International artists not in Ticketmaster database</li>
                      <li>Very new or emerging artists</li>
                      <li>Artists who don't perform live concerts</li>
                      <li>Spelling differences between Spotify and Ticketmaster</li>
                    </ul>
                  </div>
                )}
                
                <div style={{ 
                  maxHeight: '290px',
                  overflowY: 'auto',
                  background: '#232323',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  padding: '12px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {finalReport.failedArtists.map((artist, index) => (
                      <button
                        key={index}
                        onClick={() => router.push(`/artist?name=${encodeURIComponent(artist.name)}&spotifyId=${artist.id}`)}
                        style={{
                          background: '#8B0000',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          border: '1px solid #a52a2a',
                          boxShadow: '0 2px 4px rgba(139, 0, 0, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#a52a2a';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#8B0000';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {artist.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setFinalReport(prev => ({ ...prev, isVisible: false }))}
              style={{
                padding: '8px 16px',
                background: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#414B5A'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#374151'}
            >
              ✕ Close Report
            </button>
          </div>
        )}
        
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
                    position: 'relative',
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
                  {/* Green checkmark icon when Ticketmaster ID is found */}
                  {hasTicketmasterId(artist.name) && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '20px',
                      height: '20px',
                      background: '#1db954',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #181818',
                      fontSize: '12px',
                      color: '#000',
                      fontWeight: 'bold',
                      zIndex: 1,
                    }}>
                      ✓
                    </div>
                  )}
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
                    position: 'relative',
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
                  {/* Green checkmark icon when Ticketmaster ID is found */}
                  {hasTicketmasterId(artist.name) && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '20px',
                      height: '20px',
                      background: '#1db954',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #181818',
                      fontSize: '12px',
                      color: '#000',
                      fontWeight: 'bold',
                      zIndex: 1,
                    }}>
                      ✓
                    </div>
                  )}
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
            padding: isMobile ? '12px 20px' : '16px 32px',
            background: selectedArtists.length > 0 ? '#10b981' : '#374151',
            color: selectedArtists.length > 0 ? '#fff' : '#6b7280',
            border: 'none',
            borderRadius: 12,
            fontSize: isMobile ? '0.9rem' : '1.1rem',
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
          
          /* Ensure Cities and Countries sections maintain static height across ALL screen sizes */
          .cities-section,
          .countries-section {
            max-height: 230px !important;
            height: 230px !important;
            overflow-y: auto !important;
            padding-bottom: 16px !important;
            box-shadow: inset 0 -16px 16px -16px #101114 !important;
          }
          
          /* Prevent button slicing by ensuring proper grid layout */
          .cities-section,
          .countries-section {
            grid-auto-rows: 32px !important;
            align-content: start !important;
          }
          
          /* Maintain consistent vertical spacing for location buttons - NO CHANGES on any screen size */
          .cities-section button,
          .countries-section button {
            height: 32px !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 6px 10px !important;
            font-size: 0.8rem !important;
            border-radius: 16px !important;
            min-width: 80px !important;
            line-height: 1.2 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* Override any responsive vertical changes that might be applied */
          .cities-section[style*="height"],
          .countries-section[style*="height"] {
            height: 230px !important;
            max-height: 230px !important;
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
                                             <div 
                         className="cities-section"
                         style={{ 
                           display: 'grid', 
                           gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
                           rowGap: 12,
                           columnGap: isMobile ? 10 : 12,
                           maxHeight: 230,
                           overflowY: 'auto',
                           paddingBottom: 16,
                           boxShadow: 'inset 0 -16px 16px -16px #101114',
                         }}
                       >
                          {availableCities.map(city => (
                          <button
                            key={city}
                            onClick={() => toggleLocationFilter(city)}
                            style={{
                              padding: isMobile ? '6px 10px' : '8px 16px',
                             background: lowerCaseFilters.includes(city.toLowerCase()) ? '#1db954' : '#232323',
color: lowerCaseFilters.includes(city.toLowerCase()) ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: isMobile ? 16 : 20,
                              cursor: 'pointer',
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: isMobile ? 80 : 120,
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
                                             <div 
                         className="countries-section"
                         style={{ 
                           display: 'grid', 
                           gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
                           rowGap: 12,
                           columnGap: isMobile ? 10 : 12,
                           maxHeight: 230,
                           overflowY: 'auto',
                           paddingBottom: 16,
                           boxShadow: 'inset 0 -16px 16px -16px #101114',
                         }}
                       >
                          {availableCountries.map(country => (
                          <button
                            key={country}
                            onClick={() => toggleLocationFilter(country)}
                            style={{
                              padding: isMobile ? '6px 10px' : '8px 16px',
                              background: locationFilters.includes(country) ? '#fbbf24' : '#232323',
                              color: locationFilters.includes(country) ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: isMobile ? 16 : 20,
                              cursor: 'pointer',
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: isMobile ? 80 : 120,
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
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  scrollToConcertsTop();
                }}
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
                onClick={() => {
                  setCurrentPage(prev => Math.min(Math.ceil(filteredConcerts.length / concertsPerPage), prev + 1));
                  scrollToConcertsTop();
                }}
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