import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Genre Artists Modal Component
function GenreArtistsModal({ isOpen, onClose, genre, artistCount, artists, genreDetails, mainArtistsData }) {
  const router = useRouter();
  const [loadingArtist, setLoadingArtist] = useState(null);

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Get the stored scroll position
      const scrollY = document.body.style.top;
      
      // Unlock scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);

  // Helper to get ticketmasterId from localStorage
  function getTicketmasterIdFromLocalStorage(artistName) {
    try {
      const recents = JSON.parse(localStorage.getItem('recent_artist_searches')) || [];
      const found = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
      return found?.ticketmasterId || null;
    } catch {
      return null;
    }
  }

  // Helper to update ticketmasterId in localStorage
  function updateTicketmasterIdInLocalStorage(artistName, ticketmasterId, artistObj) {
    try {
      let recents = JSON.parse(localStorage.getItem('recent_artist_searches')) || [];
      let foundIdx = recents.findIndex(a => a.name.toLowerCase() === artistName.toLowerCase());
      // Always build the full structure
      const entry = {
        name: artistName,
        spotifyId: artistObj.spotifyId || artistObj.id || null,
        image: artistObj.image || (artistObj.images && artistObj.images[0] && artistObj.images[0].url) || null,
        ticketmasterId: ticketmasterId || null,
      };
      if (foundIdx !== -1) {
        recents[foundIdx] = entry;
      } else {
        recents.unshift(entry);
      }
      localStorage.setItem('recent_artist_searches', JSON.stringify(recents));
    } catch {}
  }

  // Handle artist click with the same logic as TopArtistsTable
  const handleArtistClick = async (artist, artistName) => {
    console.log('[GenreArtistsModal] Clicked artist:', artistName);
    const params = [`name=${encodeURIComponent(artistName)}`];
    
    // Get artist object from genreDetails
    const artistObj = genreDetails?.[genre]?.artists?.find(a => a.name === artistName);
    console.log('[GenreArtistsModal] Artist object from genreDetails:', artistObj);
    
    // Try to get spotifyId from multiple sources
    let spotifyId = artistObj?.spotifyId || artistObj?.id;
    
    // If no spotifyId found, try to find it in the main data
    if (!spotifyId && mainArtistsData) {
      console.log('[GenreArtistsModal] No spotifyId found in genreDetails, checking main data...');
      console.log('[GenreArtistsModal] Main artists data available:', mainArtistsData?.length || 0, 'artists');
      
      // Try exact match first
      let mainArtist = mainArtistsData.find(a => a.name.toLowerCase() === artistName.toLowerCase());
      
      // If no exact match, try partial match
      if (!mainArtist) {
        console.log('[GenreArtistsModal] No exact match, trying partial match...');
        mainArtist = mainArtistsData.find(a => 
          a.name.toLowerCase().includes(artistName.toLowerCase()) || 
          artistName.toLowerCase().includes(a.name.toLowerCase())
        );
      }
      
      // If still no match, try fuzzy matching (check if names are similar)
      if (!mainArtist) {
        console.log('[GenreArtistsModal] No partial match, trying fuzzy match...');
        mainArtist = mainArtistsData.find(a => {
          const nameA = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameB = artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameA === nameB || 
                 nameA.includes(nameB) || 
                 nameB.includes(nameA);
        });
      }
      
      if (mainArtist) {
        spotifyId = mainArtist.spotifyId || mainArtist.id;
        console.log('[GenreArtistsModal] Found spotifyId in main data:', spotifyId, 'for artist:', mainArtist.name);
      } else {
        console.log('[GenreArtistsModal] No match found in main data for:', artistName);
        console.log('[GenreArtistsModal] Available artists in main data:', mainArtistsData.map(a => a.name).slice(0, 10));
      }
    }
    
    // If still no spotifyId, try to search for the artist by name
    if (!spotifyId) {
      console.log('[GenreArtistsModal] No spotifyId found in any data, attempting to search for artist...');
      try {
        // Try to find artist in localStorage first
        const recents = JSON.parse(localStorage.getItem('recent_artist_searches')) || [];
        const cachedArtist = recents.find(a => a.name.toLowerCase() === artistName.toLowerCase());
        if (cachedArtist?.spotifyId) {
          spotifyId = cachedArtist.spotifyId;
          console.log('[GenreArtistsModal] Found spotifyId in localStorage cache:', spotifyId);
        }
      } catch (err) {
        console.log('[GenreArtistsModal] Error checking localStorage cache:', err);
      }
    }
    
    if (spotifyId) {
      params.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
      console.log('[GenreArtistsModal] Added spotifyId to params:', spotifyId);
    } else {
      console.log('[GenreArtistsModal] No spotifyId available for:', artistName);
      console.log('[GenreArtistsModal] Will proceed with name-only navigation');
    }
    
    // 1. Check localStorage for ticketmasterId
    console.log('[GenreArtistsModal] Checking localStorage for ticketmasterId for:', artistName);
    let ticketmasterId = getTicketmasterIdFromLocalStorage(artistName) || artistObj?.ticketmasterId;
    
    if (ticketmasterId) {
      console.log('[GenreArtistsModal] Found ticketmasterId in localStorage:', ticketmasterId);
      params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
      console.log('[GenreArtistsModal] Navigating to /artist with params:', params.join('&'));
      router.push(`/artist?${params.join('&')}`);
      return;
    }
    
    // 2. If not found, fetch it and show spinner
    console.log('[GenreArtistsModal] ticketmasterId not found in localStorage, fetching from server for:', artistName);
    setLoadingArtist(artistName);
    
    try {
      const backendBase = 'http://127.0.0.1:8000';
      const res = await fetch(`${backendBase}/concerts/artist-search?name=${encodeURIComponent(artistName)}`);
      if (res.ok) {
        const data = await res.json();
        const attractions = data?._embedded?.attractions || [];
        const exact = attractions.find(a => a.name.toLowerCase() === artistName.toLowerCase());
        if (exact && exact.id) {
          ticketmasterId = exact.id;
          params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
          console.log('[GenreArtistsModal] Found ticketmasterId from server:', ticketmasterId);
          // Update localStorage for future
          updateTicketmasterIdInLocalStorage(artistName, ticketmasterId, artistObj);
          console.log('[GenreArtistsModal] Updated ticketmasterId in localStorage for:', artistName);
        } else {
          console.log('[GenreArtistsModal] No ticketmasterId found from server for:', artistName);
        }
      } else {
        console.log('[GenreArtistsModal] Server returned error for ticketmasterId fetch:', res.status);
      }
    } catch (err) {
      console.log('[GenreArtistsModal] Error fetching ticketmasterId from server:', err);
    }
    
    setLoadingArtist(null);
    
    // Final fallback: if we still don't have spotifyId, try to search for it
    if (!spotifyId) {
      console.log('[GenreArtistsModal] Attempting final fallback: searching for artist spotifyId...');
      try {
        // Make API call to search for artist by name
        const backendBase = 'http://127.0.0.1:8000';
        const searchRes = await fetch(`${backendBase}/search-artist?name=${encodeURIComponent(artistName)}`);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.spotifyId) {
            spotifyId = searchData.spotifyId;
            params.push(`spotifyId=${encodeURIComponent(spotifyId)}`);
            console.log('[GenreArtistsModal] Found spotifyId from backend search:', spotifyId);
            
            // Cache this result for future use
            updateTicketmasterIdInLocalStorage(artistName, null, { 
              name: artistName, 
              spotifyId: spotifyId 
            });
          } else {
            console.log('[GenreArtistsModal] Backend search returned no spotifyId');
          }
        } else {
          console.log('[GenreArtistsModal] Backend search failed:', searchRes.status);
        }
      } catch (err) {
        console.log('[GenreArtistsModal] Final fallback error:', err);
      }
    }
    
    console.log('[GenreArtistsModal] Final navigation params:', params.join('&'));
    router.push(`/artist?${params.join('&')}`);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px #0006',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#a0a0a0',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Modal content */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            color: '#f3f3f3',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            textTransform: 'capitalize'
          }}>
            {genre}
          </h2>
          <p style={{
            color: '#a0a0a0',
            fontSize: '1rem',
            marginBottom: '20px'
          }}>
            {artistCount} artist{artistCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Artists list */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            color: '#e5e5e5',
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Artists in this genre:
          </h3>
          
          {artists && artists.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {artists.map((artistName, index) => {
                const artistObj = genreDetails?.[genre]?.artists?.find(a => a.name === artistName);
                const isLoading = loadingArtist === artistName;
                
                return (
                  <div
                    key={index}
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(34, 202, 123, 0.15)',
                      borderRadius: '12px',
                      border: '2px solid rgba(34, 202, 123, 0.3)',
                      color: '#e5e5e5',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 202, 123, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(34, 202, 123, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 202, 123, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 202, 123, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(34, 202, 123, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleArtistClick(artistObj, artistName)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Artist image or placeholder */}
                      {artistObj?.image || artistObj?.images?.[0]?.url ? (
                        <img
                          src={artistObj.image || artistObj.images[0].url}
                          alt={artistName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(34, 202, 123, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#22ca7b',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {artistName[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <span>{artistName}</span>
                    </div>
                    
                    {/* Loading spinner or arrow */}
                    {isLoading ? (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #22ca7b',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : (
                      <div style={{
                        color: '#22ca7b',
                        fontSize: '18px',
                        transition: 'transform 0.2s ease'
                      }}>
                        →
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#a0a0a0',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              Artist data not available yet. 
              <br />
              <small>Backend needs to be updated to include artist lists per genre.</small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#e5e5e5',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            Close
          </button>
        </div>
      </div>
      
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

export default function GenreLeaderboardChart({ genres, title, timeRange, genreDetails, mainArtistsData }) {
  const chartRef = useRef(null);
  const leftYAxisLabelsRef = useRef(null);
  const rightYAxisLabelsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);

  // Handle cases where genres might be undefined, null, or empty
  if (!genres || typeof genres !== 'object' || Object.keys(genres).length === 0) {
    return (
      <div style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: 'clamp(20px, 3vw, 32px)',
        margin: 'clamp(20px, 3vw, 32px) auto',
        maxWidth: 'clamp(95vw, 98vw, 98vw)',
        width: 'clamp(95vw, 98vw, 98vw)',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        textAlign: 'center',
        color: '#a0a0a0'
      }}>
        <div style={{
          fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
          fontWeight: 700,
          color: '#f3f3f3',
          letterSpacing: 1,
          textShadow: '0 2px 8px #0008',
          marginBottom: 24
        }}>
          {title}
        </div>
        <p>No genre data available for this time period.</p>
      </div>
    );
  }

  // Sort genres by count (descending)
  const sortedGenres = Object.entries(genres)
    .sort(([,a], [,b]) => b - a);

  // Calculate dynamic width based on number of genres
  const spacePerGenre = 120; // pixels per genre, increased for more spacing
  const totalGenres = sortedGenres.length;
  const chartWidth = totalGenres * spacePerGenre;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle genre click
  const handleGenreClick = (genre, count) => {
    setSelectedGenre({ name: genre, count });
    setShowGenreModal(true);
  };

  // Mobile bar chart data with click events
  const mobileChartData = {
    labels: sortedGenres.map(([genre]) => genre),
    datasets: [{
      label: 'Number of Artists',
      data: sortedGenres.map(([, count], index) => count + (index * 0.001)), // Add tiny offset for unique positioning
      backgroundColor: 'rgba(34, 202, 123, 0.8)', // Same green as desktop
      borderColor: '#22ca7b', // Same green border as desktop
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }]
  };

  // Mobile bar chart options with click events
  const mobileOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bars
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const genreIndex = element.index;
        const genre = sortedGenres[genreIndex][0];
        const count = sortedGenres[genreIndex][1];
        handleGenreClick(genre, count);
      }
    },
    onHover: (event, elements) => {
      // Change cursor to pointer when hovering over bars
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#22ca7b',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 10,
        callbacks: {
          label: function(context) {
            // Get the actual count without the offset by finding the original data
            const actualCount = sortedGenres[context.dataIndex]?.[1] || 0;
            return `Number of Artists: ${actualCount}`;
          },
          title: function(context) {
            const title = context.label;
            return title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#a0a0a0',
          font: { size: 12, weight: '500' },
          stepSize: 1
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#a0a0a0',
          font: { size: 11, weight: '500' },
          maxRotation: 0,
          minRotation: 0,
          //padding: 10,
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
      axis: 'y' // Ensure interaction works along Y-axis for horizontal bars
    },
    elements: {
      bar: {
        borderSkipped: false,
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20
      }
    },
    // Add spacing between bars
    datasets: {
      bar: {
        barPercentage: 0.8, // Increase bar width to 80% for better visibility
        categoryPercentage: 0.5 // Use 60% of category space for more spacing between bars
      }
    }
  };

  const chartData = {
    labels: sortedGenres.map(([genre]) => genre),
    datasets: [
      {
        label: 'Number of Artists',
        data: sortedGenres.map(([, count]) => count),
        borderColor: '#22ca7b',
        backgroundColor: 'rgba(34, 202, 123, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#22ca7b',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#1db954',
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const genreIndex = element.index;
        const genre = sortedGenres[genreIndex][0];
        const count = sortedGenres[genreIndex][1];
        handleGenreClick(genre, count);
      }
    },
    plugins: {
      legend: { 
        display: false 
      },
      title: { 
        display: false
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#22ca7b',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 10,
        callbacks: {
          label: function(context) {
            return `Number of Artists: ${context.parsed.y || 0}`;
          },
          title: function(context) {
            const title = context[0].label;
            return title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
          }
        }
      }
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 20,
        bottom: 20
      }
    },
    scales: {
      x: {
        title: { 
          display: false
        },
        ticks: { 
          color: '#a0a0a0',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          padding: 10,
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: { 
          display: false
        }
      },
      y: { 
        title: { 
          display: false
        },
        ticks: { 
          display: false, // Hide default labels since we'll render them externally
          beginAtZero: true,
          stepSize: 1
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        min: 0 // Ensure y-axis starts at 0
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
        radius: 5
      }
    }
  };

  // Custom plugin to render Y-axis labels externally (only for desktop line chart)
  const yAxisLabelsPlugin = {
    id: 'yAxisLabelsPlugin',
    afterDraw: (chart) => {
      if (isMobile) return; // Don't run on mobile
      
      const yAxis = chart.scales.y;
      const leftLabelsContainer = leftYAxisLabelsRef.current;
      const rightLabelsContainer = rightYAxisLabelsRef.current;
      
      if (!leftLabelsContainer || !rightLabelsContainer) return;

      // Clear previous labels on both sides
      leftLabelsContainer.innerHTML = '';
      rightLabelsContainer.innerHTML = '';
      
      // For each tick, create labels for both left and right sides
      yAxis.ticks.forEach((tick, index) => {
        const pixelY = yAxis.getPixelForTick(index);
        
        // Left side label
        const leftLabelDiv = document.createElement('div');
        leftLabelDiv.style.cssText = `
          position: absolute;
          right: 2px;
          top: ${pixelY}px;
          transform: translateY(-50%);
          color: #a0a0c0;
          font-size: 12px;
          font-weight: 'bold';
          z-index: 10;
          pointer-events: none;
        `;
        leftLabelDiv.innerText = tick.label;
        leftLabelsContainer.appendChild(leftLabelDiv);
        
        // Right side label
        const rightLabelDiv = document.createElement('div');
        rightLabelDiv.style.cssText = `
          position: absolute;
          left: 2px;
          top: ${pixelY}px;
          transform: translateY(-50%);
          color: #a0a0c0;
          font-size: 12px;
          font-weight: 'bold';
          z-index: 10;
          pointer-events: none;
        `;
        rightLabelDiv.innerText = tick.label;
        rightLabelsContainer.appendChild(rightLabelDiv);
      });
    }
  };

  // Add the plugin to options
  options.plugins = {
    ...options.plugins,
    yAxisLabelsPlugin
  };

  // Mobile view - horizontal bar chart
  if (isMobile) {
  return (
      <>
        <div className="genre-chart-container" style={{
          background: '#1e1e1e',
      borderRadius: 18,
      padding: 'clamp(20px, 3vw, 32px)',
      margin: 'clamp(20px, 3vw, 32px) auto',
          maxWidth: 'min(95vw, 1200px)',
          width: 'min(95vw, 1200px)',
      boxShadow: '0 4px 32px #0003',
      position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
    }}>
      <div className="genre-chart-title" style={{
        fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
            fontWeight: 700,
        color: '#f3f3f3',
        letterSpacing: 1,
        textShadow: '0 2px 8px #0008',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        {title}
      </div>
      
      {/* Click hint - moved above chart */}
      <div style={{
        color: '#a0a0a0',
        fontSize: '0.85rem',
        textAlign: 'center',
        marginBottom: 20,
        padding: '8px 16px',
        background: 'rgba(34, 202, 123, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(34, 202, 123, 0.2)'
      }}>
        💡 Tap on any genre bar to see the artists
      </div>
      
          {/* Mobile bar chart */}
      <div style={{
        width: '100%',
            height: 'clamp(800px, 90vh, 1200px)',
            position: 'relative',
            overflow: 'auto',
            touchAction: 'pan-y', // Enable vertical scrolling on touch devices
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Bar data={mobileChartData} options={mobileOptions} />
          </div>
          
          {/* Genre stats summary */}
          <div className="genre-stats-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: 20,
            padding: '16px 20px',
            background: 'rgba(34, 202, 123, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(34, 202, 123, 0.2)'
          }}>
            <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong style={{ color: '#e5e5e5' }}>Total Genres:</strong> {Object.keys(genres).length}
            </div>
            <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong style={{ color: '#e5e5e5' }}>Top Genre:</strong> {sortedGenres[0]?.[0] || 'N/A'} ({sortedGenres[0]?.[1] || 0} artists)
            </div>
          </div>
        </div>

        {/* Genre Artists Modal */}
              <GenreArtistsModal
        isOpen={showGenreModal}
        onClose={() => setShowGenreModal(false)}
        genre={selectedGenre?.name}
        artistCount={selectedGenre?.count}
        artists={genreDetails?.[selectedGenre?.name]?.artists?.map(a => a.name) || []}
        genreDetails={genreDetails}
        mainArtistsData={mainArtistsData}
      />
      </>
    );
  }

  // Desktop view - line chart with sticky Y-axis
  return (
    <>
      <div className="genre-chart-container" style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: 'clamp(20px, 3vw, 32px)',
        margin: 'clamp(20px, 3vw, 32px) auto',
        maxWidth: 'min(95vw, 1200px)',
        width: 'min(95vw, 1200px)',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div className="genre-chart-title" style={{
          fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
          fontWeight: 700,
          color: '#f3f3f3',
          letterSpacing: 1,
          textShadow: '0 2px 8px #0008',
          marginBottom: 24,
          textAlign: 'center'
        }}>
          {title}
        </div>
        
        {/* Click hint */}
        <div style={{
          color: '#a0a0a0',
          fontSize: '0.85rem',
          textAlign: 'center',
          marginBottom: '16px',
          padding: '8px 16px',
          background: 'rgba(34, 202, 123, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 202, 123, 0.2)'
        }}>
          💡 Click on any data point to see the artists
        </div>
        
        {/* New structure for sticky Y-axis */}
        <div style={{ 
          position: 'relative', 
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {/* Inner container that centers the Y-axis and chart */}
          <div style={{
            display: 'flex',
            position: 'relative',
            maxWidth: '100%'
          }}>
            {/* Y-Axis Container (Stays Fixed) */}
            <div style={{ 
              width: '60px', 
              flexShrink: 0, 
              position: 'relative',
              zIndex: 2
            }}>
              {/* Left side - Number of Artists text */}
              <div style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%) rotate(180deg)',
                writingMode: 'vertical-rl',
                transformOrigin: 'center',
                color: '#c0c0c0',
                fontSize: '12px',
                fontWeight: 'bold',
                lineHeight: '1.2'
              }}>
                Number of Artists
              </div>
              {/* Left side Y-axis numbers */}
              <div 
                ref={leftYAxisLabelsRef}
                style={{ 
                  height: 'clamp(400px, 60vh, 700px)', 
                  position: 'relative' 
                }}
              />
            </div>

            {/* Chart container with horizontal scrolling */}
            <div style={{
              height: 'clamp(400px, 60vh, 700px)',
              position: 'relative',
              overflowX: 'auto',
              overflowY: 'hidden',
              minWidth: 0
            }}>
              <div style={{
          width: `${chartWidth}px`,
          height: '100%',
          position: 'relative'
        }}>
                <Line 
                  ref={chartRef}
                  data={chartData} 
                  options={options}
                  plugins={[yAxisLabelsPlugin]}
                />
              </div>
            </div>

            {/* Right side Y-axis numbers container */}
            <div style={{ 
              width: '40px', 
              flexShrink: 0, 
              position: 'relative',
              zIndex: 2
            }}>
              {/* Right side - Number of Artists text */}
              <div style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                writingMode: 'vertical-rl',
                transformOrigin: 'center',
                color: '#c0c0c0',
                fontSize: '12px',
                fontWeight: 'bold',
                lineHeight: '1.2'
              }}>
                Number of Artists
              </div>
              <div 
                ref={rightYAxisLabelsRef}
                style={{ 
                  height: 'clamp(400px, 60vh, 700px)', 
                  position: 'relative' 
                }}
              />
            </div>
        </div>
      </div>
        
        {/* Hide scrollbar for cleaner look */}
        <style jsx>{`
          .genre-chart-container ::-webkit-scrollbar {
            display: none;
          }
          .genre-chart-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      
      {/* Genre stats summary */}
      <div className="genre-stats-container" style={{
        display: 'flex',
        flexDirection: 'column',
            gap: '8px',
        marginTop: 20,
        padding: '16px 20px',
            background: 'rgba(34, 202, 123, 0.1)',
        borderRadius: 12,
            border: '1px solid rgba(34, 202, 123, 0.2)'
          }}>
            <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong style={{ color: '#e5e5e5' }}>Total Genres:</strong> {Object.keys(genres).length}
          </div>
            <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong style={{ color: '#e5e5e5' }}>Top Genre:</strong> {sortedGenres[0]?.[0] || 'N/A'} ({sortedGenres[0]?.[1] || 0} artists)
          </div>
        </div>
      </div>

      {/* Genre Artists Modal */}
              <GenreArtistsModal
          isOpen={showGenreModal}
          onClose={() => setShowGenreModal(false)}
          genre={selectedGenre?.name}
          artistCount={selectedGenre?.count}
          artists={genreDetails?.[selectedGenre?.name]?.artists?.map(a => a.name) || []}
          genreDetails={genreDetails}
          mainArtistsData={mainArtistsData}
        />
    </>
  );
}
