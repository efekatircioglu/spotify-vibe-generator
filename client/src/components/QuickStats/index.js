import React, { useState, useEffect, useCallback } from 'react';
import { getCachedTopTracks, isCacheValid, hasCompleteCache } from '../../utils/topDataCache';
import { getCachedTopArtists, calculateAveragePopularity } from '../../utils/topArtistsCache';

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

// Import utilities
import { useQuickStatsCache } from './hooks/useQuickStatsCache';
import { useProgressiveLoading } from './hooks/useProgressiveLoading';
import { analyzeListeningEvolution, analyzeTimeOfDay, analyzeListenerType } from './utils/analysisUtils';

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
  const [hasLoadedDiscogs, setHasLoadedDiscogs] = useState(false);

  // Custom hooks
  const { loadingStates, setLoadingState, shouldShowCard } = useProgressiveLoading();
  const { 
    getCachedSection, 
    setCachedSection, 
    clearCache 
  } = useQuickStatsCache();

  // Load data function
  const loadQuickStats = useCallback(async () => {
    if (!isCacheValid() || !hasCompleteCache()) {
      return;
    }

    try {
      const topArtists = getCachedTopArtists();
      const topTracks = getCachedTopTracks();
      
      if (!topArtists || !topTracks) {
        return;
      }

      // Helper function for cache checking
      const checkAndSetCachedSection = (sectionName, setter, loadingStateKey) => {
        try {
          const cached = getCachedSection(sectionName, topArtists, topTracks);
          if (cached) {
            setter(cached);
            setLoadingState(loadingStateKey, true);
            return true;
          }
          return false;
        } catch (error) {
          console.error(`Error checking cache for ${sectionName}:`, error);
          return false; // Cache miss on error
        }
      };

      // Load basic stats (top artist/song)
      const cachedBasicStats = checkAndSetCachedSection('basicStats', (data) => {
        if (data && data.bestArtist) {
          setData(prev => ({
            ...prev,
            topArtist: data.bestArtist,
            topArtistTimeRange: data.bestTimeRange,
            topSong: data.bestTrack,
            topSongTimeRange: data.bestTrackTimeRange
          }));
        }
      }, 'basicStats');

      if (!cachedBasicStats) {
        // Calculate basic stats
        const basicStats = calculateBasicStats(topArtists, topTracks);
        if (basicStats) {
          setData(prev => ({
            ...prev,
            topArtist: basicStats.bestArtist,
            topArtistTimeRange: basicStats.bestTimeRange,
            topSong: basicStats.bestTrack,
            topSongTimeRange: basicStats.bestTrackTimeRange
          }));
          setLoadingState('basicStats', true);
          setCachedSection('basicStats', basicStats, topArtists, topTracks);
        }
      }

      // Load genres
      const cachedGenres = checkAndSetCachedSection('genres', (data) => {
                setData(prev => ({
          ...prev,
          topGenres: data.genres,
          genreDetails: data.genreDetails
        }));
              }, 'genres');

      if (!cachedGenres) {
        const genresData = await loadGenres(topArtists, hasLoadedDiscogs);
        setData(prev => ({
          ...prev,
                      topGenres: genresData.genres

        }));
                  setLoadingState('genres', true);
                  setCachedSection('genres', genresData, topArtists, topTracks);
        setHasLoadedDiscogs(true);
      }

      // Load albums and decades
      const cachedAlbumsDecades = checkAndSetCachedSection('albumsDecades', (data) => {
        setData(prev => ({
          ...prev,
          topAlbums: data.albums,
          topDecades: data.decades
        }));
      }, 'albumsDecades');

      if (!cachedAlbumsDecades) {
        const albumsDecades = await calculateAlbumsAndDecades(topTracks);
        setData(prev => ({
          ...prev,
          topAlbums: albumsDecades.albums,
          topDecades: albumsDecades.decades
        }));
        setLoadingState('albumsDecades', true);
        setCachedSection('albumsDecades', albumsDecades, topArtists, topTracks);
      }

      // Load popularity analysis
      const cachedPopularity = checkAndSetCachedSection('popularity', (data) => {
        setData(prev => ({
          ...prev,
          averagePopularity: data
        }));
      }, 'popularity');

      if (!cachedPopularity) {
        const popularityStats = calculateAveragePopularity();
        setData(prev => ({
          ...prev,
          averagePopularity: popularityStats
        }));
        setLoadingState('popularity', true);
        setCachedSection('popularity', popularityStats, topArtists, topTracks);
      }

      // Load year analysis
      const cachedYearAnalysis = checkAndSetCachedSection('yearAnalysis', (data) => {
        setData(prev => ({
          ...prev,
          yearAnalysis: data
        }));
      }, 'yearAnalysis');

      if (!cachedYearAnalysis) {
        const yearAnalysis = calculateYearAnalysis(topTracks);
        setData(prev => ({
          ...prev,
          yearAnalysis
        }));
        setLoadingState('yearAnalysis', true);
        setCachedSection('yearAnalysis', yearAnalysis, topArtists, topTracks);
      }

      // Load track popularity
      const cachedTrackPopularity = checkAndSetCachedSection('trackPopularity', (data) => {
        setData(prev => ({
          ...prev,
          trackPopularityAnalysis: data
        }));
      }, 'trackPopularity');

      if (!cachedTrackPopularity) {
        const trackPopularity = calculateTrackPopularity(topTracks);
        setData(prev => ({
          ...prev,
          trackPopularityAnalysis: trackPopularity
        }));
        setLoadingState('trackPopularity', true);
        setCachedSection('trackPopularity', trackPopularity, topArtists, topTracks);
      }

      // Load external data and analyses
      const [recentTracksResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/recent-tracks')
      ]);

      let recentTracks = [];
      if (recentTracksResponse.ok) {
        const recentData = await recentTracksResponse.json();
        recentTracks = recentData.tracks || [];
      } else {
        console.log('⚠️ QuickStats - Failed to fetch recent tracks:', recentTracksResponse.status);
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
        
       
        
        return {
          ...prev,
          yearAnalysis: updatedYearAnalysis
        };
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading quick stats:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [hasLoadedDiscogs, getCachedSection, setCachedSection, setLoadingState]);

  // Effect for initial load and polling
  useEffect(() => {
    const loadData = async () => {
      await loadQuickStats();
    };

    loadData();

    const cacheCheckInterval = setInterval(() => {
      if (isCacheValid() && hasCompleteCache() && (!data.topArtist || !data.topSong)) {
        loadData();
      }
    }, 5000);

    return () => {
      clearInterval(cacheCheckInterval);
    };
  }, [loadQuickStats]);

  // Don't render if no data
  if (loading || !data.topArtist || !data.topSong) {
    return null;
  }

      // Show loading state for genres
      if (data.topGenres.length === 0) {
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
          {/* Show basic cards that are ready */}
          {shouldShowCard('basicStats') && (
            <>
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopArtistCard artist={data.topArtist} timeRange={data.topArtistTimeRange} />
              </div>
              <div style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <TopSongCard song={data.topSong} timeRange={data.topSongTimeRange} />
              </div>
            </>
          )}

          {/* Loading message */}
          <div style={{
            breakInside: 'avoid',
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: '#b3b3b3',
            fontStyle: 'italic'
          }}>
            Loading detailed music analysis...
          </div>
        </div>
      </div>
    );
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

const loadGenres = async (topArtists, hasLoadedDiscogs) => {
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
