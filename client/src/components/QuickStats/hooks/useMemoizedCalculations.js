import { useMemo, useCallback, useState, useEffect } from 'react';
import { getCachedTopTracks, isCacheValid, hasCompleteCache } from '../../../utils/topDataCache';
import { getCachedTopArtists, calculateAveragePopularity } from '../../../utils/topArtistsCache';
import { analyzeListeningEvolution, analyzeTimeOfDay, analyzeListenerType } from '../utils/analysisUtils';
import { getApiBaseUrl } from '../../../config/api';

/**
 * useMemoizedCalculations Hook
 * 
 * Uses useMemo and sessionStorage to cache all QuickStats calculations
 * Prevents re-calculation on page refresh or navigation
 * Stores complete results including images and all data
 * 
 * BENEFITS:
 * ✅ No re-calculation on refresh/navigation
 * ✅ Complete data persistence including images
 * ✅ useMemo optimization for expensive calculations
 * ✅ sessionStorage for cross-page persistence
 * ✅ Automatic cache invalidation when data changes
 */

const COMPREHENSIVE_QUICKSTATS_CACHE_KEY = 'comprehensiveQuickStatsCache';

// Helper function to get cache from sessionStorage
const getComprehensiveCache = () => {
  try {
    const cached = sessionStorage.getItem(COMPREHENSIVE_QUICKSTATS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading comprehensive cache:', error);
    return null;
  }
};

// Helper function to set cache to sessionStorage
const setComprehensiveCache = (data) => {
  try {
    sessionStorage.setItem(COMPREHENSIVE_QUICKSTATS_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing comprehensive cache:', error);
  }
};

// Helper function to clear cache
const clearComprehensiveCache = () => {
  try {
    sessionStorage.removeItem(COMPREHENSIVE_QUICKSTATS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing comprehensive cache:', error);
  }
};

// Helper function to generate cache key based on user data
const generateCacheKey = (topArtists, topTracks) => {
  if (!topArtists || !topTracks) return null;
  
  // Create a hash based on user data
  const userHash = `${topArtists.length}_${topTracks.length}`;
  const dataHash = `${topArtists[0]?.name || ''}_${topTracks[0]?.name || ''}`;
  
  return `quickstats_${userHash}_${dataHash}`;
};



export const useMemoizedCalculations = () => {
  const [asyncData, setAsyncData] = useState(null);
  const [isLoadingAsync, setIsLoadingAsync] = useState(false);

  // Get cached data
  const getCachedData = useCallback(() => {
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    
    if (!topArtists || !topTracks || !isCacheValid() || !hasCompleteCache()) {
      return null;
    }
    
    const cacheKey = generateCacheKey(topArtists, topTracks);
    if (!cacheKey) return null;
    
    const comprehensiveCache = getComprehensiveCache();
    const cachedData = comprehensiveCache?.[cacheKey];
    
    if (cachedData) {
      return cachedData;
    }
    
    return null;
  }, []);

  // Set cached data
  const setCachedData = useCallback((data) => {
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    
    if (!topArtists || !topTracks) return;
    
    const cacheKey = generateCacheKey(topArtists, topTracks);
    if (!cacheKey) return;
    
    const comprehensiveCache = getComprehensiveCache() || {};
    comprehensiveCache[cacheKey] = data;
    
    setComprehensiveCache(comprehensiveCache);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    clearComprehensiveCache();
  }, []);

  // Load async data (genres, recent tracks, etc.)
  const loadAsyncData = useCallback(async () => {
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    
    if (!topArtists || !topTracks) return;

    setIsLoadingAsync(true);
    
    try {
      // Load recent tracks
      const recentTracksResponse = await fetch(`${getApiBaseUrl()}/recent-tracks`, {
        credentials: 'include'
      });
      let recentTracks = [];
      
      if (recentTracksResponse.ok) {
        const recentData = await recentTracksResponse.json();
        recentTracks = recentData.tracks || [];
      }

      // Run external analyses in parallel
      const [
        listeningEvolutionResult,
        timeOfDayResult,
        listenerTypeResult
      ] = await Promise.all([
        analyzeListeningEvolution(topTracks, recentTracks, topArtists),
        analyzeTimeOfDay(recentTracks),
        analyzeListenerType(recentTracks)
      ]);

      // Update year analysis with recent tracks
      const yearAnalysis = calculateYearAnalysis(topTracks);
      let updatedYearAnalysis = yearAnalysis;
      
      if (recentTracks.length > 0) {
        updatedYearAnalysis = updateYearAnalysisWithRecent(yearAnalysis, recentTracks);
      } else {
        if (!updatedYearAnalysis.recent_50) {
          updatedYearAnalysis.recent_50 = { average: new Date().getFullYear(), count: 0 };
        }
      }

      const asyncResults = {
        recentTracks,
        listeningEvolution: listeningEvolutionResult,
        timeOfDayAnalysis: timeOfDayResult,
        listenerTypeAnalysis: listenerTypeResult,
        yearAnalysis: updatedYearAnalysis
      };

      setAsyncData(asyncResults);
    } catch (error) {
      console.error('Error loading async data:', error);
    } finally {
      setIsLoadingAsync(false);
    }
  }, []);

  // Effect to load async data when needed
  useEffect(() => {
    const cachedData = getCachedData();
    if (!cachedData && !isLoadingAsync) {
      loadAsyncData();
    }
  }, [getCachedData, loadAsyncData, isLoadingAsync]);

  // Memoized calculations using useMemo
  const memoizedCalculations = useMemo(() => {
    // First check if we have cached data
    const cachedData = getCachedData();
    if (cachedData) {
      console.log('Using cached QuickStats data');
      return cachedData;
    }

    // If no cache, perform calculations
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    
    if (!topArtists || !topTracks || !isCacheValid() || !hasCompleteCache()) {
      return null;
    }

    console.log('Calculating QuickStats data...');

    // Calculate basic stats
    const basicStats = calculateBasicStats(topArtists, topTracks);
    
    // Calculate genres
    const genresData = calculateGenres(topArtists);
    
    // Calculate albums and decades
    const albumsDecades = calculateAlbumsAndDecades(topTracks);
    
    // Calculate popularity analysis
    const popularityStats = calculateAveragePopularity();
    
    // Calculate year analysis (basic version)
    const yearAnalysis = calculateYearAnalysis(topTracks);
    
    // Calculate track popularity
    const trackPopularityAnalysis = calculateTrackPopularity(topTracks);

    // Combine all calculations
    const completeData = {
      topArtist: basicStats?.bestArtist,
      topArtistTimeRange: basicStats?.bestTimeRange,
      topSong: basicStats?.bestTrack,
      topSongTimeRange: basicStats?.bestTrackTimeRange,
      topGenres: genresData?.genres || [],
      genreDetails: genresData?.genreDetails || {},
      topAlbums: albumsDecades?.albums || [],
      topDecades: albumsDecades?.decades || [],
      averagePopularity: popularityStats,
      yearAnalysis: yearAnalysis,
      trackPopularityAnalysis: trackPopularityAnalysis,
      // Async data will be merged when available
      listeningEvolution: null,
      timeOfDayAnalysis: null,
      listenerTypeAnalysis: null,
      recentTracks: []
    };

    // Cache the complete data
    setCachedData(completeData);
    
    return completeData;
  }, [getCachedData, setCachedData]);

  // Merge async data with memoized calculations
  const finalData = useMemo(() => {
    if (!memoizedCalculations) return null;
    
    if (asyncData) {
      return {
        ...memoizedCalculations,
        ...asyncData
      };
    }
    
    return memoizedCalculations;
  }, [memoizedCalculations, asyncData]);

  return {
    data: finalData,
    getCachedData,
    setCachedData,
    clearCache,
    isLoadingAsync
  };
};

// Helper functions for calculations (these would be imported from existing utils)
const calculateBasicStats = (topArtists, topTracks) => {
  if (!topArtists || !topTracks) return null;
  
  // Find best artist across all time ranges
  let bestArtist = null;
  let bestTimeRange = null;
  let bestScore = 0;
  
  ['4_weeks', '6_months', '12_months'].forEach(timeRange => {
    const artistInRange = topArtists.find(artist => 
      artist.rankings && artist.rankings[timeRange]
    );
    
    if (artistInRange && artistInRange.rankings[timeRange] > bestScore) {
      bestArtist = artistInRange;
      bestTimeRange = timeRange;
      bestScore = artistInRange.rankings[timeRange];
    }
  });
  
  // Find best track across all time ranges
  let bestTrack = null;
  let bestTrackTimeRange = null;
  let bestTrackScore = 0;
  
  ['4_weeks', '6_months', '12_months'].forEach(timeRange => {
    const trackInRange = topTracks.find(track => 
      track.rankings && track.rankings[timeRange]
    );
    
    if (trackInRange && trackInRange.rankings[timeRange] > bestTrackScore) {
      bestTrack = trackInRange;
      bestTrackTimeRange = timeRange;
      bestTrackScore = trackInRange.rankings[timeRange];
    }
  });
  
  return {
    bestArtist,
    bestTimeRange,
    bestTrack,
    bestTrackTimeRange
  };
};

const calculateGenres = (topArtists) => {
  if (!topArtists) return { genres: [], genreDetails: {} };
  
  const genreCounts = {};
  const genreDetails = {};
  
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        if (!genreCounts[genre]) {
          genreCounts[genre] = 0;
          genreDetails[genre] = {
            artists: [],
            totalPopularity: 0,
            averagePopularity: 0
          };
        }
        genreCounts[genre]++;
        genreDetails[genre].artists.push(artist);
        genreDetails[genre].totalPopularity += artist.popularity || 0;
      });
    }
  });
  
  // Calculate average popularity for each genre
  Object.keys(genreDetails).forEach(genre => {
    const artistCount = genreDetails[genre].artists.length;
    genreDetails[genre].averagePopularity = Math.round(genreDetails[genre].totalPopularity / artistCount);
  });
  
  const genres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return { genres, genreDetails };
};

const calculateAlbumsAndDecades = (topTracks) => {
  if (!topTracks) return { albums: [], decades: [] };
  
  const albumCounts = {};
  const decadeCounts = {};
  const seenAlbums = new Set();
  
  topTracks.forEach(track => {
    // Count albums
    if (track.album) {
      const albumKey = track.album.id;
      if (!albumCounts[albumKey]) {
        albumCounts[albumKey] = {
          album: track.album,
          count: 0,
          artists: new Set()
        };
      }
      albumCounts[albumKey].count++;
      albumCounts[albumKey].artists.add(track.artists[0]?.name);
    }
    
    // Count decades
    const releaseDate = track.release_date || track.album?.release_date;
    if (releaseDate) {
      const year = new Date(releaseDate).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const decadeKey = decade.toString();
      
      if (!decadeCounts[decadeKey]) {
        decadeCounts[decadeKey] = {
          decade: decade,
          label: `${decade}s`,
          count: 0,
          albumImages: []
        };
      }
      decadeCounts[decadeKey].count++;
      
      // Add album image if available
      if (track.album?.images?.[0]?.url && !seenAlbums.has(track.album.id)) {
        decadeCounts[decadeKey].albumImages.push({
          url: track.album.images[0].url,
          albumName: track.album.name,
          artistName: track.artists[0]?.name
        });
        seenAlbums.add(track.album.id);
      }
    }
  });
  
  const albums = Object.values(albumCounts)
    .map(albumData => ({
      ...albumData.album,
      count: albumData.count,
      artists: Array.from(albumData.artists)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const decades = Object.values(decadeCounts)
    .sort((a, b) => b.count - a.count);
  
  return { albums, decades };
};

const calculateYearAnalysis = (topTracks) => {
  if (!topTracks) return {};
  
  const yearAnalysis = {};
  
  ['4_weeks', '6_months', '12_months'].forEach(timeRange => {
    const tracksInRange = topTracks.filter(track => 
      track.rankings && track.rankings[timeRange]
    );
    
    if (tracksInRange.length === 0) {
      yearAnalysis[timeRange] = { average: 0, count: 0 };
      return;
    }
    
    const years = tracksInRange
      .map(track => {
        const releaseDate = track.release_date || track.album?.release_date;
        return releaseDate ? new Date(releaseDate).getFullYear() : null;
      })
      .filter(year => year !== null);
    
    if (years.length === 0) {
      yearAnalysis[timeRange] = { average: 0, count: 0 };
      return;
    }
    
    const average = Math.round(years.reduce((sum, year) => sum + year, 0) / years.length);
    yearAnalysis[timeRange] = { average, count: years.length };
  });
  
  return yearAnalysis;
};

const calculateTrackPopularity = (topTracks) => {
  if (!topTracks) return {};
  
  const popularityAnalysis = {};
  
  ['4_weeks', '6_months', '12_months'].forEach(timeRange => {
    const tracksInRange = topTracks.filter(track => 
      track.rankings && track.rankings[timeRange]
    );
    
    if (tracksInRange.length === 0) {
      popularityAnalysis[timeRange] = { average: 0, count: 0, min: 0, max: 0 };
      return;
    }
    
    const popularities = tracksInRange
      .map(track => track.popularity)
      .filter(pop => pop !== null && pop !== undefined);
    
    if (popularities.length === 0) {
      popularityAnalysis[timeRange] = { average: 0, count: 0, min: 0, max: 0 };
      return;
    }
    
    const average = Math.round(popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length);
    const min = Math.min(...popularities);
    const max = Math.max(...popularities);
    
    popularityAnalysis[timeRange] = { average, count: popularities.length, min, max };
  });
  
  // Overall analysis
  const allPopularities = topTracks
    .map(track => track.popularity)
    .filter(pop => pop !== null && pop !== undefined);
  
  if (allPopularities.length > 0) {
    const average = Math.round(allPopularities.reduce((sum, pop) => sum + pop, 0) / allPopularities.length);
    const min = Math.min(...allPopularities);
    const max = Math.max(...allPopularities);
    popularityAnalysis.all_tracks = { average, count: allPopularities.length, min, max };
  }
  
  return popularityAnalysis;
};

const updateYearAnalysisWithRecent = (yearAnalysis, recentTracks) => {
  if (!recentTracks || recentTracks.length === 0) {
    return yearAnalysis || {};
  }

  // Create a new object if yearAnalysis is null/undefined
  const updatedYearAnalysis = yearAnalysis || {};

  const recentYears = recentTracks
    .map(track => {
      const releaseDate = track.release_date || track.album?.release_date;
      return releaseDate ? new Date(releaseDate).getFullYear() : null;
    })
    .filter(year => year !== null);

  if (recentYears.length === 0) {
    return updatedYearAnalysis;
  }

  const average = Math.round(recentYears.reduce((sum, year) => sum + year, 0) / recentYears.length);
  updatedYearAnalysis.recent_50 = { average, count: recentYears.length };

  return updatedYearAnalysis;
};
