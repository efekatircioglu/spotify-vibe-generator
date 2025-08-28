import { useEffect, useState } from 'react';
import { findMostListenedSongByArtist, findArtistRankings, isCacheValid, hasCompleteCache } from '../utils/topDataCache';

export default function ArtistsMosts({ spotifyId, artistName, isMobile }) {
  // State for top track data
  const [topTrackLastYear, setTopTrackLastYear] = useState(null);
  const [topTrackTimeRange, setTopTrackTimeRange] = useState(null); // 'long_term' | 'medium_term' | 'short_term'
  const [loadingTopTrack, setLoadingTopTrack] = useState(false);
  const [topTrackError, setTopTrackError] = useState('');
  
  // State for artist rankings
  const [artistRankings, setArtistRankings] = useState(null);

  // Find most listened song by artist from cache or API
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!spotifyId && !artistName) return;
      setLoadingTopTrack(true);
      setTopTrackError('');
      setTopTrackTimeRange(null);

      try {
        // First, try to find artist rankings from cache
        const artistRankingsResult = findArtistRankings(spotifyId, artistName);
        if (artistRankingsResult && !cancelled) {
          setArtistRankings(artistRankingsResult);
        }
        
        // First, try to find from cache
        if (isCacheValid() && hasCompleteCache()) {
          console.log('🔍 Searching for most listened song in cache...');
          const cachedResult = findMostListenedSongByArtist(spotifyId, artistName);
          
          if (cachedResult && !cancelled) {
            console.log('✅ Found most listened song in cache!');
            
            // Create a track object compatible with the existing UI
            const cachedTrack = {
              id: cachedResult.track.id,
              name: cachedResult.track.name,
              album: {
                images: cachedResult.track.album?.images || []
              },
              // Add rankings from cache
              rankings: cachedResult.allRankings || {
                '4_weeks': null,
                '6_months': null,
                '12_months': null
              },
              // Add any other properties the UI might need
              ...cachedResult.track
            };
            
            setTopTrackLastYear(cachedTrack);
            setTopTrackTimeRange(cachedResult.timeRange);
            setTopTrackError('');
            setLoadingTopTrack(false);
            return;
          }
        }

        // If not in cache or cache is invalid, fall back to API calls
        console.log('🔄 Cache miss, falling back to API calls...');
        const endpoints = [
          { url: 'http://127.0.0.1:8000/last-6-months', range: 'medium_term' },
          { url: 'http://127.0.0.1:8000/last-12-months', range: 'long_term' },
          { url: 'http://127.0.0.1:8000/last-4-weeks', range: 'short_term' },
        ];
        
        let found = null;
        let foundRange = null;
        
        for (const { url, range } of endpoints) {
          if (cancelled) break;
          
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            const tracks = data?.tracks || [];
            const match = tracks.find(t => (t?.artists || []).some(a => a?.id === spotifyId || (artistName && a?.name?.toLowerCase() === artistName.toLowerCase())));
            if (match) {
              found = match;
              foundRange = range;
              break;
            }
          } catch (_) {
            // Ignore and try next range
          }
        }
        
        if (cancelled) return;
        
        if (found) {
          // Add rankings structure for API fallback (will be null for time periods not in this range)
          const trackWithRankings = {
            ...found,
            rankings: {
              '4_weeks': foundRange === 'short_term' ? 1 : null,
              '6_months': foundRange === 'medium_term' ? 1 : null,
              '12_months': foundRange === 'long_term' ? 1 : null
            }
          };
          
          setTopTrackLastYear(trackWithRankings);
          setTopTrackTimeRange(foundRange);
          setTopTrackError('');
        } else {
          setTopTrackLastYear(null);
          setTopTrackTimeRange(null);
          setTopTrackError('No top song found for this artist in your top tracks.');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error finding most listened song:', error);
          setTopTrackError('Failed to find most listened song. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingTopTrack(false);
        }
      }
    };
    
    run();
    return () => { cancelled = true; };
  }, [spotifyId, artistName]);

  // Don't render anything if no artist data
  if (!spotifyId && !artistName) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      marginTop: 12
    }}>
      {loadingTopTrack && (
        <div style={{
          background: '#181c24',
          padding: '16px 24px',
          borderRadius: 12,
          color: '#b3b3b3',
          fontSize: '0.95rem',
          boxShadow: '0 2px 16px #0004',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid #1db954',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Searching for your top {artistName} song...
        </div>
      )}
      {!loadingTopTrack && topTrackLastYear && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
          background: '#181c24',
          padding: isMobile ? 14 : 18,
          borderRadius: 12,
          width: isMobile ? '95%' : '600px',
          maxWidth: isMobile ? '95%' : '600px',
          boxShadow: '0 2px 16px #0004'
        }}>
          {topTrackLastYear?.album?.images?.[0]?.url && (
            <img
              src={topTrackLastYear.album.images[0].url}
              alt={topTrackLastYear.name}
              style={{ 
                width: isMobile ? 40 : 64, 
                height: isMobile ? 40 : 64, 
                borderRadius: 8, 
                objectFit: 'cover', 
                flexShrink: 0 
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ color: '#b3b3b3', fontSize: isMobile ? 11 : 13 }}>
              Your most listened {artistName} song
            </span>
            <span style={{ 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: isMobile ? 15 : 18, 
              marginBottom: isMobile ? 6 : 8 
            }}>
              {topTrackLastYear.name}
            </span>
            
            {/* Show complete rankings */}
            {topTrackLastYear.rankings && (
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? 6 : 8, 
                flexWrap: 'wrap'
              }}>
                {/* 4 Weeks Ranking */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 3 : 4,
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  borderRadius: '12px',
                  background: topTrackLastYear.rankings['4_weeks'] ? '#1db954' : '#333',
                  color: topTrackLastYear.rankings['4_weeks'] ? '#000' : '#666',
                  fontSize: isMobile ? '9px' : '11px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  <span>Last Month:</span>
                  <span style={{ fontWeight: 700 }}>
                    {topTrackLastYear.rankings['4_weeks'] ? `#${topTrackLastYear.rankings['4_weeks']}` : 'N/A'}
                  </span>
                </div>
                
                {/* 6 Months Ranking */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 3 : 4,
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  borderRadius: '12px',
                  background: topTrackLastYear.rankings['6_months'] ? '#1db954' : '#333',
                  color: topTrackLastYear.rankings['6_months'] ? '#000' : '#666',
                  fontSize: isMobile ? '9px' : '11px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  <span>Last 6 Months:</span>
                  <span style={{ fontWeight: 700 }}>
                    {topTrackLastYear.rankings['6_months'] ? `#${topTrackLastYear.rankings['6_months']}` : 'N/A'}
                  </span>
                </div>
                
                {/* 12 Months Ranking */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 3 : 4,
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  borderRadius: '12px',
                  background: topTrackLastYear.rankings['12_months'] ? '#1db954' : '#333',
                  fontSize: isMobile ? '9px' : '11px',
                  fontWeight: 600,
                  color: topTrackLastYear.rankings['12_months'] ? '#000' : '#666',
                  whiteSpace: 'nowrap'
                }}>
                  <span>Last Year:</span>
                  <span style={{ fontWeight: 700 }}>
                    {topTrackLastYear.rankings['12_months'] ? `#${topTrackLastYear.rankings['12_months']}` : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <a 
            href={`https://open.spotify.com/track/${topTrackLastYear.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1db954',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              fontWeight: 700,
              width: isMobile ? 32 : 44,
              height: isMobile ? 32 : 44,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #1db95433',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1ed760';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px #1db95440';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1db954';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px #1db95433';
            }}
            title="Play on Spotify"
          >
            <svg role="img" height={isMobile ? 12 : 18} width={isMobile ? 12 : 18} aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
            </svg>
          </a>
        </div>
      )}
      
      {/* Artist Rankings Card */}
      {artistRankings && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
          background: '#181c24',
          padding: isMobile ? 14 : 18,
          borderRadius: 12,
          width: isMobile ? '95%' : '600px',
          maxWidth: isMobile ? '95%' : '600px',
          marginTop: 16,
          boxShadow: '0 2px 16px #0004'
        }}>
          {artistRankings.artist.images && artistRankings.artist.images[0] && (
            <img
              src={artistRankings.artist.images[0].url}
              alt={artistName}
              style={{ 
                width: isMobile ? 40 : 64, 
                height: isMobile ? 40 : 64, 
                borderRadius: 8, 
                objectFit: 'cover', 
                flexShrink: 0 
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ color: '#b3b3b3', fontSize: isMobile ? 11 : 13 }}>
              Your ranking for {artistName}
            </span>
            <span style={{ 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: isMobile ? 15 : 18, 
              marginBottom: isMobile ? 6 : 8 
            }}>
              Artist Rankings
            </span>
            
            {/* Artist Stats */}
            {artistRankings.artistInfo && (
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? 8 : 12, 
                marginBottom: isMobile ? 6 : 8,
                flexWrap: 'wrap'
              }}>
                {artistRankings.artistInfo.genres && artistRankings.artistInfo.genres.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 3 : 4,
                    color: '#b3b3b3',
                    fontSize: isMobile ? '10px' : '12px'
                  }}>
                    <span>🎵</span>
                    <span>{artistRankings.artistInfo.genres[0]}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Show artist rankings */}
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? 6 : 8, 
              flexWrap: 'wrap'
            }}>
              {/* 4 Weeks Ranking */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 3 : 4,
                padding: isMobile ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
                background: artistRankings.rankings['4_weeks'] ? '#1db954' : '#333',
                color: artistRankings.rankings['4_weeks'] ? '#000' : '#666',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                <span>Last Month:</span>
                <span style={{ fontWeight: 700 }}>
                  {artistRankings.rankings['4_weeks'] ? `#${artistRankings.rankings['4_weeks']}` : 'N/A'}
                </span>
              </div>
              
              {/* 6 Months Ranking */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 3 : 4,
                padding: isMobile ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
                background: artistRankings.rankings['6_months'] ? '#1db954' : '#333',
                color: artistRankings.rankings['6_months'] ? '#000' : '#666',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                <span>Last 6 Months:</span>
                <span style={{ fontWeight: 700 }}>
                  {artistRankings.rankings['6_months'] ? `#${artistRankings.rankings['6_months']}` : 'N/A'}
                </span>
              </div>
              
              {/* 12 Months Ranking */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 3 : 4,
                padding: isMobile ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
                background: artistRankings.rankings['12_months'] ? '#1db954' : '#333',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 600,
                color: artistRankings.rankings['12_months'] ? '#000' : '#666',
                whiteSpace: 'nowrap'
              }}>
                <span>Last Year:</span>
                <span style={{ fontWeight: 700 }}>
                  {artistRankings.rankings['12_months'] ? `#${artistRankings.rankings['12_months']}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!loadingTopTrack && !topTrackLastYear && topTrackError && (
        <div style={{
          background: '#181c24',
          padding: '16px 24px',
          borderRadius: 12,
          color: '#b3b3b3',
          fontSize: '0.95rem',
          boxShadow: '0 2px 16px #0004',
          maxWidth: isMobile ? '95%' : '600px',
          textAlign: 'center'
        }}>
          No top song found for this artist in your listening history
        </div>
      )}
      
      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
