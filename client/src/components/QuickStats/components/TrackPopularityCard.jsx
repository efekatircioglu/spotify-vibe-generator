import React, { useState, useEffect } from 'react';
import { getRecentSearches, getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../../../utils/recentSearchesCache';
import { getApiBaseUrl } from '../../../config/api';

// Get cached top artists from sessionStorage
const getCachedTopArtists = () => {
  try {
    const cached = sessionStorage.getItem('spotify_top_artists');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data.artists || data; // Handle both formats
  } catch (error) {
    console.error('Error reading top artists cache:', error);
    return null;
  }
};

// Popularity mapping function for tracks
const getPopularityDescription = (score) => {
  if (score >= 90) return { 
    label: 'Global Hit', 
    color: '#ffd700', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    )
  };
  if (score >= 80) return { 
    label: 'International Hit', 
    color: '#ff6b6b', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <ellipse cx="12" cy="12" rx="4" ry="10"></ellipse>
      </svg>
    )
  };
  if (score >= 70) return { 
    label: 'Mainstream Hit', 
    color: '#4ecdc4', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <circle cx="16" cy="14" r="2"></circle>
        <path d="M6 7v10"></path>
        <path d="M10 7v10"></path>
      </svg>
    )
  };
  if (score >= 60) return { 
    label: 'Rising Hit', 
    color: '#45b7d1', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  };
  if (score >= 50) return { 
    label: 'Growing Song', 
    color: '#96ceb4', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 15 14 21 8"></polyline>
        <polyline points="15 8 21 8 21 14"></polyline>
      </svg>
    )
  };
  if (score >= 40) return { 
    label: 'Emerging Song', 
    color: '#feca57', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8C8 10 5.5 16.5 12 22c6.5-5.5 4-12-5-14z"></path>
      </svg>
    )
  };
  if (score >= 30) return { 
    label: 'Underground Track', 
    color: '#ff9ff3', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.52 19c.64-2.2 1.84-4 3.22-5.5"></path>
        <path d="M18.48 19c-.64-2.2-1.84-4-3.22-5.5"></path>
        <path d="M13.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>
        <path d="M6.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>
        <path d="M12 2a10 10 0 0 0-9.68 7h19.36A10 10 0 0 0 12 2z"></path>
      </svg>
    )
  };
  if (score >= 20) return { 
    label: 'Indie Track', 
    color: '#60A5FA', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    )
  };
  if (score >= 10) return { 
    label: 'Hidden Gem', 
    color: '#5f27cd', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 22 22 7 12 2"></polygon>
        <line x1="2" y1="7" x2="12" y2="22"></line>
        <line x1="22" y1="7" x2="12" y2="22"></line>
        <line x1="12" y1="2" x2="12" y2="22"></line>
        <line x1="2" y1="7" x2="22" y2="7"></line>
      </svg>
    )
  };
  return { 
    label: 'Undiscovered Track', 
    color: '#00d2d3', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    )
  };
};

/**
 * TrackPopularityCard Component
 * 
 * Displays track popularity analysis showing average popularity scores
 * Shows popularity statistics for different time periods
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles track popularity display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function TrackPopularityCard({ popularity, recentTracks }) {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedPopularity, setSelectedPopularity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Get recent searches from cache
  const getRecentSearches = () => {
    try {
      const cached = localStorage.getItem('recentSearchesCache');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error reading recent searches cache:', error);
      return [];
    }
  };

  // Enhanced navigation function with Ticketmaster ID lookup
  const navigateToArtistPage = async (artistName, artistId = null) => {
    try {
      // Build navigation parameters
      const params = [`name=${encodeURIComponent(artistName)}`];
      
      // Add Spotify ID if provided
      if (artistId) {
        params.push(`spotifyId=${encodeURIComponent(artistId)}`);
      }
      
      // Check recent searches for ticketmasterId first (fastest)
      let ticketmasterId = getTicketmasterIdFromRecentSearch(artistName);
      if (ticketmasterId) {
        params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
      }
      
      // If we have both IDs, navigate immediately
      if (artistId && ticketmasterId) {
        const url = `/artist?${params.join('&')}`;
        window.location.href = url;
        return;
      }
      
      // If no artistId provided, check cached top artists
      if (!artistId) {
        const topArtists = getCachedTopArtists();
        const cachedArtist = topArtists?.find(a => a.name.toLowerCase() === artistName.toLowerCase());
        
        if (cachedArtist) {
          params.push(`spotifyId=${encodeURIComponent(cachedArtist.id)}`);
          artistId = cachedArtist.id; // Update artistId for later use
        }
      }
      
      // If we have Spotify ID but no Ticketmaster ID, try to fetch it
      if (artistId && !ticketmasterId) {
        try {
          const ticketmasterResponse = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`, {
        credentials: 'include'
      });
          
          if (ticketmasterResponse.ok) {
            const ticketmasterData = await ticketmasterResponse.json();
            
            // Look for exact match
            const exactMatch = ticketmasterData.allAttractions?.find(
              attraction => attraction.name.toLowerCase() === artistName.toLowerCase()
            );
            
            if (exactMatch) {
              ticketmasterId = exactMatch.ticketmasterId || exactMatch.id;
              
              // Update cache with Ticketmaster ID
              const artistObj = {
                name: artistName,
                spotifyId: artistId,
                ticketmasterId: ticketmasterId
              };
              updateTicketmasterIdInRecentSearch(artistName, ticketmasterId, artistObj);
              
              params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
            }
          }
        } catch (error) {
          console.error(`[TrackPopularityCard] Error fetching Ticketmaster ID for ${artistName}:`, error);
        }
      }
      
      // Navigate with whatever data we have (even if just name)
      const url = `/artist?${params.join('&')}`;
      window.location.href = url;
      
    } catch (error) {
      console.error(`[TrackPopularityCard] Error during navigation for ${artistName}:`, error);
    }
  };

  // Helper function to get popularity range for a label
  const getPopularityRange = (label) => {
    switch (label) {
      case 'Global Hit': return { min: 90, max: 100 };
      case 'International Hit': return { min: 80, max: 89 };
      case 'Mainstream Hit': return { min: 70, max: 79 };
      case 'Rising Hit': return { min: 60, max: 69 };
      case 'Growing Song': return { min: 50, max: 59 };
      case 'Emerging Song': return { min: 40, max: 49 };
      case 'Underground Track': return { min: 30, max: 39 };
      case 'Indie Track': return { min: 20, max: 29 };
      case 'Hidden Gem': return { min: 10, max: 19 };
      case 'Undiscovered Track': return { min: 0, max: 9 };
      default: return { min: 0, max: 100 };
    }
  };

  // Get cached top tracks from sessionStorage
  const getCachedTopTracks = () => {
    try {
      const cached = sessionStorage.getItem('unified_top_tracks');
      const tracks = cached ? JSON.parse(cached) : [];
      return tracks;
    } catch (error) {
      console.error('Error reading top tracks cache:', error);
      return [];
    }
  };

  // Calculate recent tracks popularity from prop data
  const calculateRecentTracksPopularity = () => {
    if (!recentTracks || recentTracks.length === 0) {
      return null;
    }
    
    // Recent tracks now come with popularity data directly from the API
    // Remove duplicates based on track ID to get accurate statistics
    const uniqueTracks = recentTracks.reduce((acc, track) => {
      if (!acc.find(t => t.id === track.id)) {
        acc.push(track);
      }
      return acc;
    }, []);
    

    
    const popularities = uniqueTracks
      .map(track => track.popularity)
      .filter(pop => pop !== null && pop !== undefined);
    
    if (popularities.length === 0) {
      return null;
    }

    const average = Math.round(popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length);
    const min = Math.min(...popularities);
    const max = Math.max(...popularities);
    
    const recentPopularity = {
      average,
      count: popularities.length,
      min,
      max
    };
    
    return recentPopularity;
  };

  // Calculate recent tracks popularity when prop changes
  const recentTracksPopularity = calculateRecentTracksPopularity();

  // Modal visibility effect
  useEffect(() => {
    if (showModal) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showModal]);

  // Filter songs when modal opens
  useEffect(() => {
    const filterSongs = async () => {
      if (showModal && selectedPeriod && selectedPopularity) {
        setLoadingSongs(true);
        
        const popularityRange = getPopularityRange(selectedPopularity);
        

        
        // Handle "Last 50 Songs" period
        if (selectedPeriod === 'Last 50 Songs') {
          if (!recentTracks || recentTracks.length === 0) {
            setFilteredSongs([]);
            setLoadingSongs(false);
            return;
          }
          
          // Recent tracks now come with popularity data directly from the API
          // Remove duplicates based on track ID for modal display
          const uniqueTracks = recentTracks.reduce((acc, track) => {
            if (!acc.find(t => t.id === track.id)) {
              acc.push(track);
            }
            return acc;
          }, []);
          

          
          const filtered = uniqueTracks.filter(track => {
            const songPopularity = track.popularity || 0;
            const inRange = songPopularity >= popularityRange.min && songPopularity <= popularityRange.max;
            

            
            return inRange;
          });
          
          // If no tracks found in specific range, show all unique recent tracks
          if (filtered.length === 0) {
            setFilteredSongs(uniqueTracks);
          } else {
            setFilteredSongs(filtered);
          }
          
          setLoadingSongs(false);
          return;
        }
      
              // Handle other time periods (4 weeks, 6 months, 12 months)
        const topTracks = getCachedTopTracks();
        
        // Map the selected period to the correct key format
        let periodKey;
        switch (selectedPeriod) {
          case '4 weeks':
            periodKey = '4_weeks';
            break;
          case '6 months':
            periodKey = '6_months';
            break;
          case '12 months':
            periodKey = '12_months';
            break;
          default:
            periodKey = selectedPeriod.replace(' ', '_');
        }
        
        
        // Debug: Show sample track structure
        if (topTracks.length > 0) {
          const sampleTrack = topTracks[0];
          
        }
        
        // Filter tracks that are in the selected time period and popularity range
        const filtered = topTracks.filter(track => {
          // Check if track is in the selected time period
          const hasRanking = track.rankings && track.rankings[periodKey];
          if (!hasRanking) {
            return false;
          }
          
          // Check if track is in the popularity range
          const songPopularity = track.popularity || 0;
          const inRange = songPopularity >= popularityRange.min && songPopularity <= popularityRange.max;
          
          
          return inRange;
        }).sort((a, b) => {
          // Sort by ranking (lower number = higher rank)
          const aRank = a.rankings?.[periodKey] || Infinity;
          const bRank = b.rankings?.[periodKey] || Infinity;
          return aRank - bRank;
        });
        
        // If no tracks found in specific range, show all tracks from that period with any popularity
        if (filtered.length === 0) {
          const allTracksInPeriod = topTracks.filter(track => {
            const hasRanking = track.rankings && track.rankings[periodKey];
            return hasRanking;
          }).sort((a, b) => {
            const aRank = a.rankings?.[periodKey] || Infinity;
            const bRank = b.rankings?.[periodKey] || Infinity;
            return aRank - bRank;
          });
          
          setFilteredSongs(allTracksInPeriod);
          setLoadingSongs(false);
          return;
        }
        
        
        setFilteredSongs(filtered);
        setLoadingSongs(false);
      }
    };
    
    filterSongs();
  }, [showModal, selectedPeriod, selectedPopularity]);
  if (!popularity) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No track popularity data available
      </div>
    );
  }

  return (
    <>
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Track Popularity
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Average popularity of your songs
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>

        {/* Overview of Unified Top Tracks Popularity */}
        {(() => {
          // Get unified top tracks data from sessionStorage
          const unifiedTopTracksData = sessionStorage.getItem('unified_top_tracks');
          const unifiedTopTracks = unifiedTopTracksData ? JSON.parse(unifiedTopTracksData) : [];
          
          if (unifiedTopTracks.length === 0) return null;
          
          // Calculate overall popularity metrics
          const popularities = unifiedTopTracks
            .map(track => track.popularity)
            .filter(pop => pop !== null && pop !== undefined);
          
          if (popularities.length === 0) return null;
          
          const averagePopularity = Math.round(popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length);
          const minPopularity = Math.min(...popularities);
          const maxPopularity = Math.max(...popularities);
          const popularityRange = maxPopularity - minPopularity;
          
          // Get popularity distribution
          const popularityRanges = {
            'Global Hit (90-100)': popularities.filter(p => p >= 90).length,
            'International Hit (80-89)': popularities.filter(p => p >= 80 && p < 90).length,
            'Mainstream Hit (70-79)': popularities.filter(p => p >= 70 && p < 80).length,
            'Rising Hit (60-69)': popularities.filter(p => p >= 60 && p < 70).length,
            'Growing Song (50-59)': popularities.filter(p => p >= 50 && p < 60).length,
            'Emerging Song (40-49)': popularities.filter(p => p >= 40 && p < 50).length,
            'Underground Track (30-39)': popularities.filter(p => p >= 30 && p < 40).length,
            'Indie Track (20-29)': popularities.filter(p => p >= 20 && p < 30).length,
            'Hidden Gem (10-19)': popularities.filter(p => p >= 10 && p < 20).length,
            'Undiscovered Track (0-9)': popularities.filter(p => p < 10).length
          };
          
          const mostCommonRange = Object.entries(popularityRanges)
            .sort(([,a], [,b]) => b - a)[0];
          
          const averagePopularityInfo = getPopularityDescription(averagePopularity);
          
          return (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <h5 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  Overall Track Popularity Analysis
                </h5>
                <span style={{
                  background: averagePopularityInfo.color,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  {averagePopularityInfo.label}
                </span>
              </div>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: '0',
                lineHeight: '1.4'
              }}>
                {(() => {
                  const totalTracks = unifiedTopTracks.length;
                  const tracksWithPopularity = popularities.length;
                  
                  const minPopularityInfo = getPopularityDescription(minPopularity);
                  const maxPopularityInfo = getPopularityDescription(maxPopularity);
                  
                  if (averagePopularity >= 80) {
                    return `Your music collection features highly popular tracks with an average popularity of ${averagePopularityInfo.label.toLowerCase()}. You prefer ${averagePopularityInfo.label.toLowerCase()} music, showing a taste for mainstream and internationally recognized artists. Your collection spans from ${minPopularityInfo.label.toLowerCase()} to ${maxPopularityInfo.label.toLowerCase()}, indicating a ${popularityRange <= 30 ? 'focused' : popularityRange <= 60 ? 'diverse' : 'eclectic'} range of track popularity.`;
                  } else if (averagePopularity >= 60) {
                    return `Your music collection has a solid mainstream presence with an average popularity of ${averagePopularityInfo.label.toLowerCase()}. You enjoy ${averagePopularityInfo.label.toLowerCase()} music, balancing popular hits with emerging artists. Your collection ranges from ${minPopularityInfo.label.toLowerCase()} to ${maxPopularityInfo.label.toLowerCase()}, showing a ${popularityRange <= 30 ? 'consistent' : popularityRange <= 60 ? 'varied' : 'wide'} mix of track popularity levels.`;
                  } else if (averagePopularity >= 40) {
                    return `Your music collection leans toward emerging and growing artists with an average popularity of ${averagePopularityInfo.label.toLowerCase()}. You appreciate ${averagePopularityInfo.label.toLowerCase()} music, often discovering artists before they become mainstream. Your collection spans from ${minPopularityInfo.label.toLowerCase()} to ${maxPopularityInfo.label.toLowerCase()}, reflecting a ${popularityRange <= 30 ? 'focused' : popularityRange <= 60 ? 'diverse' : 'eclectic'} approach to music discovery.`;
                  } else {
                    return `Your music collection features underground and indie artists with an average popularity of ${averagePopularityInfo.label.toLowerCase()}. You're drawn to ${averagePopularityInfo.label.toLowerCase()} music, showing a preference for undiscovered talent and niche artists. Your collection ranges from ${minPopularityInfo.label.toLowerCase()} to ${maxPopularityInfo.label.toLowerCase()}, indicating a ${popularityRange <= 30 ? 'specialized' : popularityRange <= 60 ? 'diverse' : 'eclectic'} taste in less mainstream music.`;
                  }
                })()}
              </p>
            </div>
          );
        })()}

        {/* Recent Tracks (Last 50 Songs) */}
        {recentTracksPopularity && (
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => {
            setSelectedPeriod('Last 50 Songs');
            setSelectedPopularity(getPopularityDescription(recentTracksPopularity.average).label);
            setShowModal(true);
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div>
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0',
                  textTransform: 'capitalize'
                }}>
                  Last 50 Songs
                </h4>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ color: getPopularityDescription(recentTracksPopularity.average).color }}>
                  {getPopularityDescription(recentTracksPopularity.average).icon}
                </div>
                <h5 style={{
                  color: getPopularityDescription(recentTracksPopularity.average).color,
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  margin: '0'
                }}>
                  {getPopularityDescription(recentTracksPopularity.average).label}
                </h5>
              </div>
            </div>
          </div>
        )}

        {/* Time Period Comparisons */}
        {Object.entries(popularity).map(([period, data]) => {
          if (!data || data.count === 0 || period === 'all_tracks') return null;
          
          const averageDescription = getPopularityDescription(data.average);
          const minDescription = getPopularityDescription(data.min);
          const maxDescription = getPopularityDescription(data.max);
          
          return (
            <div key={period} style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              setSelectedPeriod(period.replace('_', ' '));
              setSelectedPopularity(averageDescription.label);
              setShowModal(true);
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: '0',
                    textTransform: 'capitalize'
                  }}>
                    {period.replace('_', ' ')}
                  </h4>
                </div>

              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ color: averageDescription.color }}>
                    {averageDescription.icon}
                  </div>
                  <h5 style={{
                    color: averageDescription.color,
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    margin: '0'
                  }}>
                    {averageDescription.label}
                  </h5>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}

      </div>
    </div>

    {/* Songs Modal */}
    {showModal && (
      <>
        <div 
          className={`genius-modal-overlay ${isVisible ? 'visible' : ''}`}
          onClick={() => setShowModal(false)}
        />
        
        <div className={`genius-modal-container ${isVisible ? 'visible' : ''}`}>
          <div className="genius-modal-content">
            <div className="genius-modal-header">
              <h2 className="genius-modal-title">
                {selectedPeriod} - {selectedPopularity}
              </h2>
              <button className="genius-close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="genius-section">
              <div style={{
                fontSize: '1rem',
                color: '#a0a0a0',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                {loadingSongs ? 'Loading songs...' : `${filteredSongs.length} tracks found`}
              </div>

              <div style={{
                maxHeight: '600px',
                overflowY: 'auto',
                padding: '16px'
              }}>
                {loadingSongs ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#a0a0a0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid #22ca7b',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    Loading songs...
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#a0a0a0'
                  }}>
                    No songs found for this popularity range.
                  </div>
                ) : (
          <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {filteredSongs.map((track, index) => {
                      const songPopularityDescription = getPopularityDescription(track.popularity || 0);
                      
                      return (
                        <div
                          key={track.id || index}
                          style={{
                            padding: '12px',
            borderRadius: '12px',
                            border: track.album && track.album.images && track.album.images[0] ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            height: '120px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Background album image layer */}
                          {track.album && track.album.images && track.album.images[0] && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${track.album.images[0].url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              zIndex: 0
                            }} />
                          )}
                          {/* Song Info Overlay */}
                          <div style={{
                            position: 'relative',
                            zIndex: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>

                            
                            <div style={{ flex: 1 }}>
                              <h4 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
                                margin: '0 0 4px 0',
                                textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {track.name}
                              </h4>
                              {track.album?.name && (
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: '0',
                                  textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {track.album.name}
                                </p>
                              )}
                            </div>
                            
                            {/* Artists Section */}
                            {track.artists && track.artists.length > 0 && (
                              <div style={{ marginTop: '4px' }}>
                                <p 
                                  style={{
                                    color: '#b3b3b3',
                                    fontSize: '0.8rem',
                                    margin: '0',
                                    textShadow: track.album && track.album.images && track.album.images[0] ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  onClick={() => navigateToArtistPage(track.artists[0].name, track.artists[0].id)}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = '#22ca7b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#b3b3b3';
                                  }}
                                >
                                  {track.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
        )}
                          </div>
                          

                          
                          {/* Artists Section */}
                          {track.artists && track.artists.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {track.artists.map((artist, artistIndex) => (
                                  <div
                                    key={artist.id || artistIndex}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 10px',
                                      borderRadius: '20px',
                                      background: 'rgba(29, 185, 84, 0.1)',
                                      border: '1px solid rgba(29, 185, 84, 0.3)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)';
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onClick={() => navigateToArtistPage(artist.name, artist.id)}
                                  >
                                    <span style={{
                                      color: '#1db954',
                                      fontSize: '0.8rem',
                                      fontWeight: '500'
                                    }}>
                                      {artist.name}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1db954' }}>
                                      <path d="M5 12h14"></path>
                                      <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
      </div>
    </div>

        {/* Modal Styles */}
        <style jsx global>{`
          .genius-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 40;
            opacity: 0;
            transition: opacity 200ms ease-out;
            pointer-events: none;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          .genius-modal-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }
          .genius-modal-container {
            position: fixed;
            z-index: 50;
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 90%;
            max-width: 800px;
            max-height: 85vh;
          }
          .genius-modal-container.visible {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            pointer-events: auto;
          }
          .genius-modal-content {
            background-color: #181818;
            border: 1px solid #3f3f46;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: none;
            padding: 1.5rem;
            max-height: 85vh;
            overflow-y: auto;
          }
          .genius-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            position: relative;
          }
          .genius-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f4f4f5;
            margin: 0;
            flex: 1;
            padding-right: 3rem;
          }
          .genius-close-button {
            background: rgba(24, 24, 24, 0.9);
            border: 1px solid #3f3f46;
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 700;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.2s ease;
            min-width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 0;
            right: 0;
            z-index: 100;
          }
          .genius-close-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transform: scale(1.1);
          }
          .genius-section {
            margin-bottom: 1.5rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )}
  </>
  );
}
