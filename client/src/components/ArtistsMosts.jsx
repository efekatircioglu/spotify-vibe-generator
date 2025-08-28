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
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'center',
      alignItems: isMobile ? 'center' : 'flex-start',
      gap: isMobile ? 16 : 24,
      width: '100%',
      marginTop: 12,
      padding: isMobile ? '0 16px' : '0 32px',
      flexWrap: 'wrap'
    }}>
      {loadingTopTrack && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '16px 24px',
          borderRadius: 20,
          color: '#b3b3b3',
          fontSize: '0.95rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: isMobile ? '100%' : '500px',
          height: isMobile ? '120px' : '140px',
          justifyContent: 'center'
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
          background: 'rgba(255, 255, 255, 0.1)',
          padding: isMobile ? 16 : 24,
          borderRadius: 20,
          width: isMobile ? '100%' : '500px',
          height: isMobile ? '120px' : '140px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {topTrackLastYear?.album?.images?.[0]?.url && (
            <img
              src={topTrackLastYear.album.images[0].url}
              alt={topTrackLastYear.name}
              style={{ 
                width: isMobile ? 56 : 64, 
                height: isMobile ? 56 : 64, 
                borderRadius: 8, 
                objectFit: 'cover', 
                flexShrink: 0,
                marginLeft: isMobile ? -8 : 0,
                marginTop: isMobile ? -8 : 0
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
        </div>
      )}
      
      {/* Artist Rankings Card */}
      {artistRankings && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
          background: 'rgba(255, 255, 255, 0.1)',
          padding: isMobile ? 16 : 24,
          borderRadius: 20,
          width: isMobile ? '100%' : '500px',
          height: isMobile ? '120px' : '140px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {artistRankings.artist.images && artistRankings.artist.images[0] && (
            <img
              src={artistRankings.artist.images[0].url}
              alt={artistName}
              style={{ 
                width: isMobile ? 56 : 64, 
                height: isMobile ? 56 : 64, 
                borderRadius: 8, 
                objectFit: 'cover', 
                flexShrink: 0,
                marginLeft: isMobile ? -8 : 0,
                marginTop: isMobile ? -8 : 0
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ color: '#b3b3b3', fontSize: isMobile ? 11 : 13 }}>
              Your ranking over time
            </span>
            <span style={{ 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: isMobile ? 15 : 18, 
              marginBottom: isMobile ? 6 : 8 
            }}>
              {artistName}
            </span>
            
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
      
      {/* Hidden: No top song found message
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
      */}
      
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
