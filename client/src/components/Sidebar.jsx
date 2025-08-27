'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { getRecentSearches, saveRecentSearch } from '../utils/recentSearchesCache';
import { getCachedArtistId, setArtistCache, getCachedArtistImage } from '../utils/artistCache';

export default function Sidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto-close sidebar on mobile by default
      if (window.innerWidth <= 768) {
        setIsOpen(false);
        if (onToggle) onToggle(false); // Notify parent that sidebar is closed
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent component about initial closed state
  useEffect(() => {
    if (onToggle) {
      onToggle(false); // Notify parent that sidebar starts closed
    }
  }, [onToggle]);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation items
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Last 4 Weeks', path: '/last-4-weeks', icon: '🎵' },
    { label: 'Last 6 Months', path: '/last-6-months', icon: '🎵' },
    { label: 'Last 12 Months', path: '/last-12-months', icon: '🎵' },
    { label: 'Concerts', path: '/concerts', icon: '🎭' },
  ];

  // Check if current path is active
  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  // Handle search input focus
  const handleSearchInputFocus = () => {
    if (!(searchQuery || '').trim()) {
      // Only show the last 5 recent searches in the dropdown
      setArtistSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  // Handle artist input with debouncing
  const handleArtistInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setHighlightedSuggestion(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length < 3) {
      setArtistSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        // Check recent_artist_searches for ticketmasterId before making API calls
        const recent = getRecentSearches().find(a => a.name.toLowerCase() === value.trim().toLowerCase());
        let spSuggestions = [];
        let tmSuggestions = [];
        
        if (recent) {
          // Use the cached ticketmasterId and spotifyId if available
          spSuggestions = recent.spotifyId ? [{
            name: recent.name,
            spotifyId: recent.spotifyId,
            ticketmasterId: recent.ticketmasterId || null,
            image: recent.image || null,
            genres: recent.genres || [],
            source: 'spotify'
          }] : [];
          tmSuggestions = recent.ticketmasterId ? [{
            name: recent.name,
            spotifyId: recent.spotifyId || null,
            ticketmasterId: recent.ticketmasterId,
            image: recent.image || null,
            genres: recent.genres || [],
            source: 'ticketmaster'
          }] : [];
        } else {
          // Spotify
          const spRes = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(value)}`);
          const spData = spRes.ok ? await spRes.json() : {};
          spSuggestions = spData.artists?.map(a => ({
            name: a.name,
            spotifyId: a.id,
            ticketmasterId: null,
            image: a.image || null,
            genres: a.genres || [],
            source: 'spotify'
          })) || [];
          
          // Ticketmaster
          const tmRes = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(value)}`);
          const tmData = tmRes.ok ? await tmRes.json() : {};
          tmSuggestions = tmData._embedded?.attractions
            ?.filter(a => a.type === 'attraction' && a.classifications?.[0]?.segment?.name === 'Music' && a.classifications?.[0]?.primary)
            .map(a => {
              let spotifyId = (() => {
                const spotifyLink = a.externalLinks?.spotify?.[0]?.url;
                if (spotifyLink) {
                  const match = spotifyLink.match(/artist\/([a-zA-Z0-9]+)/);
                  if (match) return match[1];
                }
                return null;
              })();
              return {
                name: a.name,
                spotifyId,
                ticketmasterId: a.id || null,
                image: a.images?.[0]?.url || null,
                genres: a.genres || [],
                source: 'ticketmaster'
              };
            }) || [];
        }
        
        // Merge by name: if both exist, merge ticketmasterId into spotify suggestion
        const merged = [];
        const usedNames = new Set();
        spSuggestions.forEach(sp => {
          const tm = tmSuggestions.find(t => t.name === sp.name);
          if (tm) {
            merged.push({ ...sp, ticketmasterId: tm.ticketmasterId });
            usedNames.add(sp.name);
          } else {
            merged.push(sp);
            usedNames.add(sp.name);
          }
        });
        tmSuggestions.forEach(tm => {
          if (!usedNames.has(tm.name)) {
            merged.push(tm);
          }
        });
        
        setArtistSuggestions(merged);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setArtistSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle keyboard navigation
  const handleArtistKeyDown = (e) => {
    if (!showSuggestions || artistSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestion(prev => {
        const next = prev + 1;
        if (next >= artistSuggestions.length) return 0;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestion(prev => {
        const next = prev - 1;
        if (next < 0) return artistSuggestions.length - 1;
        return next;
      });
    } else if (e.key === 'Enter') {
      if (highlightedSuggestion >= 0 && highlightedSuggestion < artistSuggestions.length) {
        handleSuggestionClick(artistSuggestions[highlightedSuggestion]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedSuggestion(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (artist) => {
    // Use the exact name from Spotify to search Ticketmaster
    let spotifyId = artist.spotifyId || null;
    let image = artist.image || null;
    let genres = artist.genres || [];
    let ticketmasterId = null;
    
    // Check cache first
    const cachedId = getCachedArtistId(artist.name);
    if (cachedId) {
      console.log(`Found cached Ticketmaster ID for "${artist.name}": ${cachedId}`);
      ticketmasterId = cachedId;
      // Get cached image if available
      const cachedImage = getCachedArtistImage(artist.name);
      if (cachedImage && !image) {
        image = cachedImage;
      }
    } else {
      // Always use the Spotify name for Ticketmaster search
      try {
        const tmData = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(artist.name)}`);
        const attractions = tmData._embedded?.attractions || [];
        // Find an exact name match (case-insensitive)
        const exact = attractions.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
        if (exact && exact.id) {
          ticketmasterId = exact.id;
          // Cache the successful result with image and Spotify ID
          const imageUrl = exact.images?.[0]?.url || image;
          setArtistCache(artist.name, exact.id, imageUrl, spotifyId);
          console.log(`Cached Ticketmaster ID for "${artist.name}": ${exact.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
        }
      } catch (err) {
        console.error('Error searching Ticketmaster:', err);
      }
    }
    
    // Save full object to recents
    saveRecentSearch({ name: artist.name, spotifyId, ticketmasterId, image });
    setRecentSearches(getRecentSearches());
    setSearchQuery(artist.name);
    setShowSuggestions(false);
    
    // Navigate to artist page
    const urlParamsArr = [`name=${encodeURIComponent(artist.name)}`];
    if (spotifyId) urlParamsArr.push(`spotifyId=${spotifyId}`);
    if (ticketmasterId) urlParamsArr.push(`ticketmasterId=${ticketmasterId}`);
    const urlParams = urlParamsArr.join('&');
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsOpen(false);
      if (onToggle) onToggle(false);
    }
    
    router.push(`/artist?${urlParams}`);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Navigate to artist page with search query
    if (isMobile) {
      setIsOpen(false);
      if (onToggle) onToggle(false);
    }
    
    router.push(`/artist?name=${encodeURIComponent(searchQuery)}`);
  };

  // Handle navigation
  const handleNavigation = (path) => {
    router.push(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsOpen(false);
      if (onToggle) onToggle(false); // Notify parent that sidebar is closed
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    // Notify parent component about sidebar state
    if (onToggle) {
      onToggle(newState); // true when open, false when closed
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${isMobile ? styles.mobile : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎵</span>
            <span className={styles.logoText}>Vibe Gen</span>
          </div>
          <button 
            className={styles.toggleButton}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper} style={{ position: 'relative' }}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={handleArtistInput}
                onFocus={handleSearchInputFocus}
                onKeyDown={handleArtistKeyDown}
                className={styles.searchInput}
                autoComplete="off"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && artistSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#232323',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    marginTop: '8px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    width: '100%',
                  }}
                >
                  {artistSuggestions.map((artist, index) => (
                    <div
                      key={`${artist.spotifyId || ''}_${artist.ticketmasterId || ''}_${artist.name || ''}_${index}`}
                      onClick={() => handleSuggestionClick(artist)}
                      style={{
                        padding: '12px 18px',
                        background: highlightedSuggestion === index ? '#181818' : 'transparent',
                        color: highlightedSuggestion === index ? '#fff' : '#e5e7eb',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1.08rem',
                        borderBottom: '1px solid #232323',
                        transition: 'background 0.18s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      onMouseEnter={() => setHighlightedSuggestion(index)}
                    >
                      {artist.image && (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                      <span>{artist.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Loading indicator */}
              {isSearching && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#232323',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  marginTop: '8px',
                  padding: '12px',
                  zIndex: 1000,
                  width: '100%',
                  textAlign: 'center',
                  color: '#e5e7eb'
                }}>
                  Searching...
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`${styles.navItem} ${isActivePath(item.path) ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.footerButton}>
            <span className={styles.footerIcon}>⚙️</span>
            <span className={styles.footerLabel}>Settings</span>
          </button>
          <button className={styles.footerButton}>
            <span className={styles.footerIcon}>❓</span>
            <span className={styles.footerLabel}>Help</span>
          </button>
          <button 
            className={styles.footerButton}
            onClick={async () => {
              try {
                // Set logout flag to prevent immediate re-authentication
                sessionStorage.setItem('userLoggedOut', 'true');
                
                // Clear the spotify token first to prevent auth redirect loops
                localStorage.removeItem('spotify_token');
                localStorage.removeItem('spotify_refresh_token');
                
                // Clear all playlist URLs from localStorage
                localStorage.removeItem('last4weeks_playlist_url');
                localStorage.removeItem('last6months_playlist_url');
                localStorage.removeItem('last12months_playlist_url');
                localStorage.removeItem('last50songs_playlist_url');
                
                // Dispatch logout event for AuthWrapper to catch
                window.dispatchEvent(new CustomEvent('userLogout'));
                
                // Call logout API
                await fetch('http://127.0.0.1:8000/logout');
                
                // AuthWrapper will handle the UI transition
                
              } catch (error) {
                console.error('Logout error:', error);
                // Even if API fails, clear local data
                sessionStorage.setItem('userLoggedOut', 'true');
                localStorage.removeItem('spotify_token');
                localStorage.removeItem('spotify_refresh_token');
                window.dispatchEvent(new CustomEvent('userLogout'));
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e74c3c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              width: '100%',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span className={styles.footerIcon}>🚪</span>
            <span className={styles.footerLabel}>Logout</span>
          </button>
        </div>
      </div>

      {/* Toggle button (when sidebar is closed) - shown on both mobile and desktop */}
      {!isOpen && (
        <button 
          className={styles.mobileToggle}
          onClick={() => setIsOpen(true)}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
    </>
  );
}
