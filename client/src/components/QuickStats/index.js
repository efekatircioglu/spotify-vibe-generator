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
 * QuickStats Component - Simplified Architecture
 * 
 * LOGIC:
 * 1. First entry -> Calculate, Show, Cache
 * 2. Subsequent entries -> Check cache, if exists show, if not calculate, show, cache
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

  // Load data function - Simplified to always calculate and show
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
    console.log('🔄 QuickStats: Starting data calculation...');

    try {
      // Always fetch fresh data from API
      console.log('📡 QuickStats: Fetching data from API...');
      
      const [topArtistsResponse, topTracksResponse] = await Promise.all([
        fetch(`${getApiBaseUrl()}/last-4-weeks`, {
          credentials: 'include'
        }),
        fetch(`${getApiBaseUrl()}/last-6-months`, {
          credentials: 'include'
        }),
        fetch(`${getApiBaseUrl()}/last-12-months`, {
          credentials: 'include'
        })
      ]);

      if (!topArtistsResponse.ok || !topTracksResponse.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const [topArtistsData, topTracksData] = await Promise.all([
        topArtistsResponse.json(),
        topTracksResponse.json()
      ]);

      console.log('✅ QuickStats: API data received, processing...');

      // Process the data immediately
      const processedData = await processQuickStatsData(topArtistsData, topTracksData);
      
      // Show the data immediately
      setData(processedData);
      setLoading(false);
      setDataLoaded(true);
      
      console.log('✅ QuickStats: Data processed and displayed');

      // Cache the results after showing
      console.log('💾 QuickStats: Caching results...');
      await cacheQuickStatsResults(processedData, topArtistsData, topTracksData);
      console.log('✅ QuickStats: Results cached successfully');

    } catch (error) {
      console.error('❌ QuickStats: Error loading data:', error);
      setError('Failed to load QuickStats data');
      setLoading(false);
    } finally {
      loadQuickStats.isRunning = false;
    }
  }, []);

  // Process QuickStats data
  const processQuickStatsData = async (topArtistsData, topTracksData) => {
    console.log('🔄 QuickStats: Processing data...');
    
    // Basic stats
    const basicStats = calculateBasicStats(topArtistsData.artists, topTracksData.tracks);
    
    // Load genres
    const genresData = await loadGenres(topArtistsData.artists);
    
    // Load albums and decades
    const albumsDecades = await calculateAlbumsAndDecades(topTracksData.tracks);
    
    // Load popularity analysis
    const popularityAnalysis = calculatePopularityAnalysis(topArtistsData.artists, topTracksData.tracks);
    
    // Load year analysis
    const yearAnalysis = calculateYearAnalysis(topTracksData.tracks);
    
    // Load track popularity analysis
    const trackPopularityAnalysis = calculateTrackPopularityAnalysis(topTracksData.tracks);
    
    // Load listening evolution
    const listeningEvolution = analyzeListeningEvolution(topTracksData.tracks);
    
    // Load time of day analysis
    const timeOfDayAnalysis = analyzeTimeOfDay(topTracksData.tracks);
    
    // Load listener type analysis
    const listenerTypeAnalysis = analyzeListenerType(topTracksData.tracks);
    
    // Load recent tracks
    const recentTracks = await loadRecentTracks();

    return {
      topArtist: basicStats?.bestArtist || null,
      topArtistTimeRange: basicStats?.bestTimeRange || null,
      topSong: basicStats?.bestTrack || null,
      topSongTimeRange: basicStats?.bestTrackTimeRange || null,
      topGenres: genresData.genres || [],
      genreDetails: genresData.genreDetails || {},
      topAlbums: albumsDecades.albums || [],
      topDecades: albumsDecades.decades || [],
      averagePopularity: popularityAnalysis || null,
      yearAnalysis: yearAnalysis || null,
      trackPopularityAnalysis: trackPopularityAnalysis || null,
      listeningEvolution: listeningEvolution || null,
      timeOfDayAnalysis: timeOfDayAnalysis || null,
      listenerTypeAnalysis: listenerTypeAnalysis || null,
      recentTracks: recentTracks || []
    };
  };

  // Cache QuickStats results
  const cacheQuickStatsResults = async (processedData, topArtistsData, topTracksData) => {
    try {
      // Cache the processed results
      setCachedResults(topArtistsData.artists, topTracksData.tracks, {
        basicStats: {
          bestArtist: processedData.topArtist,
          bestTimeRange: processedData.topArtistTimeRange,
          bestTrack: processedData.topSong,
          bestTrackTimeRange: processedData.topSongTimeRange
        },
        genres: {
          genres: processedData.topGenres,
          genreDetails: processedData.genreDetails
        },
        albumsDecades: {
          albums: processedData.topAlbums,
          decades: processedData.topDecades
        },
        popularity: processedData.averagePopularity,
        yearAnalysis: processedData.yearAnalysis,
        trackPopularity: processedData.trackPopularityAnalysis,
        listeningEvolution: processedData.listeningEvolution,
        timeOfDayAnalysis: processedData.timeOfDayAnalysis,
        listenerTypeAnalysis: processedData.listenerTypeAnalysis,
        recentTracks: processedData.recentTracks
      });

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

    } catch (error) {
      console.error('❌ QuickStats: Error caching results:', error);
    }
  };

  // Load recent tracks
  const loadRecentTracks = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/recent-tracks`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const recentTracksData = await response.json();
        return recentTracksData.tracks || [];
      }
    } catch (error) {
      console.error('Error loading recent tracks:', error);
    }
    return [];
  };

  // Effect for initial load - simple approach
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    console.log('🔄 QuickStats: Component mounted, starting data load...');
    loadQuickStats();

    // Clean up expired cache entries on mount
    try {
      cleanupExpired();
    } catch (error) {
      console.warn('Could not cleanup expired cache:', error);
    }
  }, []); // Empty dependency array - only run once on mount





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

const calculateTrackPopularityAnalysis = (topTracks) => {
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

const calculatePopularityAnalysis = (topArtists, topTracks) => {
  if (!topArtists || topArtists.length === 0) {
    return null;
  }

  const popularities = topArtists
    .map(artist => artist.popularity)
    .filter(pop => pop !== null && pop !== undefined);

  if (popularities.length === 0) {
    return null;
  }

  const average = Math.round(popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length);
  const min = Math.min(...popularities);
  const max = Math.max(...popularities);

  return { average, count: popularities.length, min, max };
};
