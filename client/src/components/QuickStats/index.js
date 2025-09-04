import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedTopTracks, isCacheValid, hasCompleteCache } from '../../utils/topDataCache';
import { getCachedTopArtists, calculateAveragePopularity } from '../../utils/topArtistsCache';
import { getApiBaseUrl } from '../../config/api';

// Import individual components
import TopArtistCard from './components/TopArtistCard';
import TopSongCard from './components/TopSongCard';
import TopGenresCard from './components/TopGenresCard';

import TopAlbumsCard from './components/TopAlbumsCard';
import TopDecadesCard from './components/TopDecadesCard';
import ArtistPopularityCard from './components/ArtistPopularityCard';
import MusicTimelineCard from './components/MusicTimelineCard';
import TrackPopularityCard from './components/TrackPopularityCard';
import ListeningEvolutionCard from './components/ListeningEvolutionCard';
import TimeOfDayCard from './components/TimeOfDayCard';
import ListenerTypeCard from './components/ListenerTypeCard';
import LoadingPhase from './components/LoadingPhase';

// Import utilities
import { useQuickStatsResultsCache } from './hooks/useQuickStatsResultsCache';
import { useProgressiveLoading } from './hooks/useProgressiveLoading';
import { analyzeListeningEvolution, analyzeTimeOfDay, analyzeListenerType } from './utils/analysisUtils';
import { getCachedRecentTracks, setCachedRecentTracks } from '../../utils/recentTracksCache';

/**
 * QuickStats Component - Modular Architecture
 * 
 * BENEFITS OF THIS APPROACH:
 * ✅ Code splitting - only load needed components
 * ✅ Lazy loading - components load as they become ready
 * ✅ Better performance - individual optimizations
 * ✅ Maintainability - each component has its own file
 * ✅ Reusability - components can be used elsewhere
 * ✅ Testing - easy to test individual components
 * ✅ Team development - multiple developers can work simultaneously
 * 
 * ARCHITECTURE:
 * - index.js: Main coordinator and data management
 * - components/: Individual card components
 * - hooks/: Custom hooks for caching and loading
 * - utils/: Analysis functions
 * - types/: TypeScript definitions (if needed)
 */
export default function QuickStats({ isMobile }) {
  // State management
  const [data, setData] = useState({
    topArtist: null,
    topSong: null,
    topGenres: [],
    genreDetails: {},

    topAlbums: [],
    topDecades: [],
    averagePopularity: null,
    yearAnalysis: null,
    trackPopularityAnalysis: null,
    listeningEvolution: null,
    timeOfDayAnalysis: null,
    listenerTypeAnalysis: null,
    topArtistTimeRange: null,
    topSongTimeRange: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const retryIntervalRef = useRef(null);

  // Custom hooks
  const { loadingStates, setLoadingState, shouldShowCard } = useProgressiveLoading();
  const {
    getCachedResults,
    setCachedResults,
    updateCachedSection: updateResultsSection,
    hasValidCache: hasValidResultsCache,
    clearCache: clearResultsCache,
    cleanupExpired
  } = useQuickStatsResultsCache();

  // Load data function
  const loadQuickStats = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Add a flag to prevent multiple executions
    if (loadQuickStats.isRunning) {
      console.log('🔄 QuickStats: Already running, skipping...');
      return;
    }
    
    loadQuickStats.isRunning = true;

    // Check if we have the required data to start calculations
    const topArtists = getCachedTopArtists();
    const topTracks = getCachedTopTracks();
    
    console.log('🔍 QuickStats: Checking cache data...');
    console.log('  Top Artists:', topArtists ? `${topArtists.length} artists` : 'null');
    console.log('  Top Tracks:', topTracks ? `${topTracks.length} tracks` : 'null');
    
    if (!topArtists || !topTracks) {
      console.log('❌ QuickStats: Missing required cache data, attempting to initialize...');
      
      // Try to manually initialize cache
      try {
        const { initializeAllCaches } = await import('../../utils/cacheManager');
        await initializeAllCaches();
        
        // Check again after initialization
        const retryTopArtists = getCachedTopArtists();
        const retryTopTracks = getCachedTopTracks();
        
        if (!retryTopArtists || !retryTopTracks) {
          console.log('❌ QuickStats: Still missing data after cache initialization');
          loadQuickStats.isRunning = false;
          return;
        }
      } catch (error) {
        console.error('❌ QuickStats: Failed to initialize cache:', error);
        loadQuickStats.isRunning = false;
        return;
      }
    }

    try {

      // Check if we have cached results first
      const cachedResults = getCachedResults(topArtists, topTracks);
      if (cachedResults && cachedResults.basicStats?.bestArtist && cachedResults.basicStats?.bestTrack) {
        // Load all data from cache
        const newData = {
          ...data,
          topArtist: cachedResults.basicStats?.bestArtist || null,
          topArtistTimeRange: cachedResults.basicStats?.bestTimeRange || null,
          topSong: cachedResults.basicStats?.bestTrack || null,
          topSongTimeRange: cachedResults.basicStats?.bestTrackTimeRange || null,
          topGenres: cachedResults.genres?.genres || [],
          genreDetails: cachedResults.genres?.genreDetails || {},
          topAlbums: cachedResults.albumsDecades?.albums || [],
          topDecades: cachedResults.albumsDecades?.decades || [],
          averagePopularity: cachedResults.popularity || null,
          yearAnalysis: cachedResults.yearAnalysis || null,
          trackPopularityAnalysis: cachedResults.trackPopularity || null,
          listeningEvolution: cachedResults.listeningEvolution || null,
          timeOfDayAnalysis: cachedResults.timeOfDayAnalysis || null,
          listenerTypeAnalysis: cachedResults.listenerTypeAnalysis || null,
          recentTracks: cachedResults.recentTracks || getCachedRecentTracks() || []
        };
        
        
        setData(newData);

        // Set all loading states to true since data is ready
        setLoadingState('basicStats', true);
        setLoadingState('genres', true);
        setLoadingState('albumsDecades', true);
        setLoadingState('popularity', true);
        setLoadingState('yearAnalysis', true);
        setLoadingState('trackPopularity', true);
        setLoadingState('listeningEvolution', true);
        setLoadingState('timeOfDay', true);
        setLoadingState('listenerType', true);
        
        setLoading(false);
        setDataLoaded(true);
        return;
      } 
      // Start with basic stats
      const basicStats = calculateBasicStats(topArtists, topTracks);
      if (basicStats) {
        setLoadingState('basicStats', true);
        // Store in results cache
        updateResultsSection(topArtists, topTracks, 'basicStats', basicStats);
      }



      // Load genres
      const genresData = await loadGenres(topArtists);
      setData(prev => ({
        ...prev,
        topGenres: genresData.genres,
        genreDetails: genresData.genreDetails
      }));
              setLoadingState('genres', true);
        // Store in results cache
        updateResultsSection(topArtists, topTracks, 'genres', genresData);

      // Load albums and decades
      const albumsDecades = await calculateAlbumsAndDecades(topTracks);
      setData(prev => ({
        ...prev,
        topAlbums: albumsDecades.albums,
        topDecades: albumsDecades.decades
      }));
      setLoadingState('albumsDecades', true);
      // Store in results cache
      updateResultsSection(topArtists, topTracks, 'albumsDecades', albumsDecades);

      // Load popularity analysis
      const popularityStats = calculateAveragePopularity();
      setData(prev => ({
        ...prev,
        averagePopularity: popularityStats
      }));
      setLoadingState('popularity', true);
      // Store in results cache
      updateResultsSection(topArtists, topTracks, 'popularity', popularityStats);

      // Load year analysis
      const yearAnalysis = calculateYearAnalysis(topTracks);
      setData(prev => ({
        ...prev,
        yearAnalysis
      }));
      setLoadingState('yearAnalysis', true);
      // Store in results cache
      updateResultsSection(topArtists, topTracks, 'yearAnalysis', yearAnalysis);

      // Load track popularity
      const trackPopularity = calculateTrackPopularity(topTracks);
      setData(prev => ({
        ...prev,
        trackPopularityAnalysis: trackPopularity
      }));
      setLoadingState('trackPopularity', true);
      // Store in results cache
      updateResultsSection(topArtists, topTracks, 'trackPopularity', trackPopularity);

      // Load recent tracks from cache or API
      let recentTracks = getCachedRecentTracks();
      
      if (!recentTracks) {
        const recentTracksResponse = await fetch(`${getApiBaseUrl()}/recent-tracks`, {
          credentials: 'include'
        });
        
        if (recentTracksResponse.ok) {
          const recentData = await recentTracksResponse.json();
          recentTracks = recentData.tracks || [];
          // Cache the recent tracks for future use
          setCachedRecentTracks(recentTracks);
        } else {
          recentTracks = [];
        }
      } else {
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

      setData(prev => ({
        ...prev,
        recentTracks: recentTracks,
        listeningEvolution: listeningEvolutionResult,
        timeOfDayAnalysis: timeOfDayResult,
        listenerTypeAnalysis: listenerTypeResult
      }));

      setLoadingState('listeningEvolution', true);
      setLoadingState('timeOfDay', true);
      setLoadingState('listenerType', true);

      // Store external analyses in results cache
      updateResultsSection(topArtists, topTracks, 'listeningEvolution', listeningEvolutionResult);
      updateResultsSection(topArtists, topTracks, 'timeOfDayAnalysis', timeOfDayResult);
      updateResultsSection(topArtists, topTracks, 'listenerTypeAnalysis', listenerTypeResult);
      updateResultsSection(topArtists, topTracks, 'recentTracks', recentTracks);

      // Update year analysis with recent tracks - always include recent_50 data
      setData(prev => {
        let updatedYearAnalysis;
        if (recentTracks.length > 0) {
          updatedYearAnalysis = updateYearAnalysisWithRecent(prev.yearAnalysis, recentTracks);
        } else {
          // If no recent tracks, ensure we have a basic yearAnalysis structure
          updatedYearAnalysis = prev.yearAnalysis || {};
          if (!updatedYearAnalysis.recent_50) {
            updatedYearAnalysis.recent_50 = { average: new Date().getFullYear(), count: 0 };
          }
        }
        
        // Update the results cache with the final year analysis
        updateResultsSection(topArtists, topTracks, 'yearAnalysis', updatedYearAnalysis);
        
        return {
          ...prev,
          yearAnalysis: updatedYearAnalysis
        };
      });

      setLoading(false);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading quick stats:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      // Reset the running flag
      loadQuickStats.isRunning = false;
    }
  }, [updateResultsSection, setLoadingState, getCachedResults]);

  // Effect for initial load - start calculations immediately when component mounts
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }


    const loadData = async () => {
      await loadQuickStats();
    };

    // Clean up expired cache entries on mount
    try {
      cleanupExpired();
    } catch (error) {
      console.warn('Could not cleanup expired cache:', error);
    }
    
    // Start calculations immediately
    loadData();
    
    // Set up a retry mechanism in case data isn't ready yet
    retryIntervalRef.current = setInterval(() => {
      const topArtists = getCachedTopArtists();
      const topTracks = getCachedTopTracks();
      
      if (topArtists && topTracks && loading) {
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }
        loadData();
      }
    }, 1000); // Check every second
    
    // Clean up interval after 30 seconds to prevent infinite checking
    setTimeout(() => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    }, 30000);
    
    // Clean up interval when component unmounts
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Effect to clean up retry interval when loading is complete
  useEffect(() => {
    if (!loading && retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
  }, [loading]);

  // Effect to refresh page when QuickStats data is loaded
  useEffect(() => {
    if (dataLoaded && data.topArtist && data.topSong) {
      console.log('🔄 QuickStats: Data loaded successfully, refreshing page...');
      // Add a small delay to ensure the data is fully rendered
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [dataLoaded, data.topArtist, data.topSong]);



  // Don't render if no data or on server side
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Only show loading phase when we're actually loading and don't have enough data
  if (loading && (!data.topArtist || !data.topSong || data.topGenres.length === 0)) {
    return <LoadingPhase isMobile={isMobile} />;
  }
  
  if (!data.topArtist || !data.topSong) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '24px',
        margin: '32px auto',
        maxWidth: '1200px',
        width: '95%',
        minHeight: '200px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <div style={{
          color: '#ff6b6b',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div style={{
      padding: '32px 16px',
      margin: '32px auto',
      maxWidth: '1200px',
      width: '95%'
    }}>
      <h2 style={{
        color: '#fff',
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '16px',
        letterSpacing: '0.5px'
      }}>
        Your Music Highlights
      </h2>
      
      <div style={{
        columns: isMobile ? 1 : 3,
        columnGap: '24px',
        maxWidth: '100%'
      }}>
        {/* Render individual components based on loading states */}
        {isMobile ? (
          // Mobile Order
          <>
            {/* 1. Top Artist */}
            {shouldShowCard('basicStats') && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopArtistCard artist={data.topArtist} timeRange={data.topArtistTimeRange} />
              </div>
            )}

            {/* 2. Top Song */}
            {shouldShowCard('basicStats') && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopSongCard song={data.topSong} timeRange={data.topSongTimeRange} />
              </div>
            )}

            {/* 3. Top Albums */}
            {shouldShowCard('albumsDecades') && data.topAlbums && data.topAlbums.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopAlbumsCard albums={data.topAlbums} />
              </div>
            )}

            {/* 4. Top Decades */}
            {shouldShowCard('albumsDecades') && data.topDecades && data.topDecades.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopDecadesCard decades={data.topDecades} />
              </div>
            )}

            {/* 5. Top Genres */}
            {shouldShowCard('genres') && data.topGenres.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopGenresCard genres={data.topGenres} genreDetails={data.genreDetails} />
              </div>
            )}

            {/* 6. Artist Popularity */}
            {shouldShowCard('popularity') && data.averagePopularity && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ArtistPopularityCard popularity={data.averagePopularity} />
              </div>
            )}

            {/* 7. Track Popularity */}
            {shouldShowCard('trackPopularity') && data.trackPopularityAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                
                <TrackPopularityCard popularity={data.trackPopularityAnalysis} recentTracks={data.recentTracks} />
              </div>
            )}

            {/* 8. Music Timeline */}
            {shouldShowCard('yearAnalysis') && data.yearAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <MusicTimelineCard yearAnalysis={data.yearAnalysis} />
              </div>
            )}

            {/* 9. Listening Evolution */}
            {shouldShowCard('listeningEvolution') && data.listeningEvolution && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ListeningEvolutionCard evolution={data.listeningEvolution} />
              </div>
            )}

            {/* 10. Listener Type Analysis */}
            {shouldShowCard('listenerType') && data.listenerTypeAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ListenerTypeCard listenerType={data.listenerTypeAnalysis} />
              </div>
            )}

            {/* 11. Time of Day */}
            {shouldShowCard('timeOfDay') && data.timeOfDayAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TimeOfDayCard timeAnalysis={data.timeOfDayAnalysis} />
              </div>
            )}
          </>
        ) : (
          // Desktop Order (updated)
          <>
            {/* 1. Top Artist */}
            {shouldShowCard('basicStats') && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopArtistCard artist={data.topArtist} timeRange={data.topArtistTimeRange} />
              </div>
            )}

            {/* 2. Top Albums */}
            {shouldShowCard('albumsDecades') && data.topAlbums && data.topAlbums.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopAlbumsCard albums={data.topAlbums} />
              </div>
            )}

            {/* 3. Music Timeline */}
            {shouldShowCard('yearAnalysis') && data.yearAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <MusicTimelineCard yearAnalysis={data.yearAnalysis} />
              </div>
            )}

            {/* 4. Time of Day */}
            {shouldShowCard('timeOfDay') && data.timeOfDayAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TimeOfDayCard timeAnalysis={data.timeOfDayAnalysis} />
              </div>
            )}

            {/* 5. Top Song */}
            {shouldShowCard('basicStats') && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopSongCard song={data.topSong} timeRange={data.topSongTimeRange} />
              </div>
            )}

            {/* 6. Top Genres */}
            {shouldShowCard('genres') && data.topGenres.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopGenresCard genres={data.topGenres} genreDetails={data.genreDetails} />
              </div>
            )}

            {/* 7. Track Popularity */}
            {shouldShowCard('trackPopularity') && data.trackPopularityAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                
                <TrackPopularityCard popularity={data.trackPopularityAnalysis} recentTracks={data.recentTracks} />
              </div>
            )}

            {/* 8. Listener Type */}
            {shouldShowCard('listenerType') && data.listenerTypeAnalysis && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ListenerTypeCard listenerType={data.listenerTypeAnalysis} />
              </div>
            )}

            {/* 9. Artist Popularity */}
            {shouldShowCard('popularity') && data.averagePopularity && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ArtistPopularityCard popularity={data.averagePopularity} />
              </div>
            )}

            {/* 10. Top Decades */}
            {shouldShowCard('albumsDecades') && data.topDecades && data.topDecades.length > 0 && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopDecadesCard decades={data.topDecades} />
              </div>
            )}

            {/* 11. Listening Evolution */}
            {shouldShowCard('listeningEvolution') && data.listeningEvolution && (
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <ListeningEvolutionCard evolution={data.listeningEvolution} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
const calculateBasicStats = (topArtists, topTracks) => {
  if (!topArtists || !topTracks || topArtists.length === 0 || topTracks.length === 0) {
    return {
      bestArtist: null,
      bestTimeRange: null,
      bestTrack: null,
      bestTrackTimeRange: null
    };
  }

  // Find best artist (highest rank across all time ranges)
  let bestArtist = topArtists[0];
  let bestRank = Infinity;
  let bestTimeRange = null;

  topArtists.forEach(artist => {
    Object.entries(artist.rankings).forEach(([timeRange, rank]) => {
      if (rank && rank < bestRank) {
        bestRank = rank;
        bestArtist = artist;
        bestTimeRange = timeRange;
      }
    });
  });

  // Find best track (prioritize 12 months, then 6 months, then 4 weeks)
  let bestTrack = topTracks[0];
  let bestTrackRank = Infinity;
  let bestTrackTimeRange = null;

  // First, try to find the #1 song from 12 months
  const track12Months = topTracks.find(track => 
    track.rankings && track.rankings['12_months'] === 1
  );
  
  if (track12Months) {
    bestTrack = track12Months;
    bestTrackRank = 1;
    bestTrackTimeRange = '12_months';
  } else {
    // If no #1 from 12 months, find best rank across all time ranges
    topTracks.forEach(track => {
      Object.entries(track.rankings).forEach(([timeRange, rank]) => {
        if (rank && rank < bestTrackRank) {
          bestTrackRank = rank;
          bestTrack = track;
          bestTrackTimeRange = timeRange;
        }
      });
    });
  }

  return {
    bestArtist,
    bestTimeRange,
    bestTrack,
    bestTrackTimeRange
  };
};

const loadGenres = async (topArtists) => {
  if (!topArtists || topArtists.length === 0) {
    return { genres: [], genreDetails: {} };
  }

  // Calculate genres
  const genreCounts = {};
  const genreDetails = {};
  
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        
        // Build genreDetails object
        if (!genreDetails[genre]) {
          genreDetails[genre] = {
            artists: []
          };
        }
        
        // Add artist to genre if not already present
        const existingArtist = genreDetails[genre].artists.find(a => a.name === artist.name);
        if (!existingArtist) {
          genreDetails[genre].artists.push({
            name: artist.name,
            spotifyId: artist.id,
            image: artist.images?.[0]?.url,
            images: artist.images
          });
        }
      });
    }
  });

  const genres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { genres, genreDetails };
};

const calculateAlbumsAndDecades = async (topTracks) => {
  if (!topTracks || topTracks.length === 0) {
    return { albums: [], decades: [] };
  }

  // Calculate top albums
  const albumCounts = {};
  topTracks.forEach(track => {
    if (track.album && track.album.name) {
      const albumKey = `${track.album.name}-${track.artists[0]?.name || 'Unknown'}`;
      if (!albumCounts[albumKey]) {
        albumCounts[albumKey] = {
          id: track.album.id,
          name: track.album.name,
          artist: track.artists[0]?.name || 'Unknown',
          images: track.album.images,
          artistImage: null, // Will be populated later
          count: 0
        };
      }
      albumCounts[albumKey].count++;
    }
  });

  // Get albums sorted by count
  const albums = Object.values(albumCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate top decades
  const decadeCounts = {};
  const decadeTracks = {};
  
  topTracks.forEach(track => {
    const releaseDate = track.release_date || track.album?.release_date;
    if (releaseDate) {
      const year = new Date(releaseDate).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      if (!decadeCounts[decade]) {
        decadeCounts[decade] = {
          decade,
          label: decade === 2020 ? '2020s' : 
                 decade === 2010 ? '2010s' : 
                 decade === 2000 ? '2000s' : 
                 decade === 1990 ? '1990s' : 
                 decade === 1980 ? '1980s' : 
                 decade === 1970 ? '1970s' : 
                 decade === 1960 ? '1960s' : 
                 decade === 1950 ? '1950s' : `${decade}s`,
          count: 0
        };
        decadeTracks[decade] = [];
      }
      decadeCounts[decade].count++;
      decadeTracks[decade].push(track);
    }
  });

  // Add multiple album images from top listened songs for each decade
  Object.keys(decadeCounts).forEach(decade => {
    const tracks = decadeTracks[decade];
    if (tracks && tracks.length > 0) {
      // Sort tracks by their ranking (lower number = higher rank) and get top 5 most listened ones
      // Use priority: 12_months > 6_months > 4_weeks
      const topTracks = tracks.sort((a, b) => {
        let aRank = Infinity;
        let bRank = Infinity;
        
        // Check 12_months first (highest priority)
        if (a.rankings?.['12_months']) aRank = a.rankings['12_months'];
        if (b.rankings?.['12_months']) bRank = b.rankings['12_months'];
        
        // If both have 12_months, compare them
        if (aRank !== Infinity && bRank !== Infinity) {
          return aRank - bRank;
        }
        
        // If only one has 12_months, it wins
        if (aRank !== Infinity) return -1;
        if (bRank !== Infinity) return 1;
        
        // Check 6_months (medium priority)
        if (a.rankings?.['6_months']) aRank = a.rankings['6_months'];
        if (b.rankings?.['6_months']) bRank = b.rankings['6_months'];
        
        if (aRank !== Infinity && bRank !== Infinity) {
          return aRank - bRank;
        }
        
        if (aRank !== Infinity) return -1;
        if (bRank !== Infinity) return 1;
        
        // Check 4_weeks (lowest priority)
        if (a.rankings?.['4_weeks']) aRank = a.rankings['4_weeks'];
        if (b.rankings?.['4_weeks']) bRank = b.rankings['4_weeks'];
        
        return aRank - bRank;
      }).slice(0, 5); // Get top 5 tracks
      
      // Collect unique album images from top tracks
      const albumImages = [];
      const seenAlbums = new Set();
      
      topTracks.forEach(track => {
        if (track.album && track.album.images && track.album.images[0]?.url) {
          const albumKey = track.album.id;
          if (!seenAlbums.has(albumKey)) {
            albumImages.push({
              url: track.album.images[0].url,
              albumName: track.album.name,
              artistName: track.artists[0]?.name
            });
            seenAlbums.add(albumKey);
          }
        }
      });
      
      if (albumImages.length > 0) {
        decadeCounts[decade].albumImages = albumImages;
        decadeCounts[decade].albumImage = albumImages[0].url; // Keep for backward compatibility
        decadeCounts[decade].albumName = albumImages[0].albumName;
        decadeCounts[decade].artistName = albumImages[0].artistName;
      }
    }
  });

  const decades = Object.values(decadeCounts)
    .sort((a, b) => b.count - a.count);

  return { albums, decades };
};

const calculateYearAnalysis = (topTracks) => {
  if (!topTracks || topTracks.length === 0) {
    return {};
  }

  const yearAnalysis = {};

  // Analyze each time range
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
  if (!topTracks || topTracks.length === 0) {
    return {};
  }

  const popularityAnalysis = {};

  // Analyze each time range
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
