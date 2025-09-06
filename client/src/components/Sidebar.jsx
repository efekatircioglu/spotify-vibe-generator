'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { getRecentSearches, saveRecentSearch, getTicketmasterIdFromRecentSearch, updateTicketmasterIdInRecentSearch } from '../utils/recentSearchesCache';
import { getCachedArtistId, setArtistCache, getCachedArtistImage } from '../utils/artistCache';
import { getCachedTopArtists } from '../utils/topArtistsCache';
import jwtManager from '../utils/jwtManager';
import { ChevronLeftIcon, ChevronRightIcon } from './ui/icons';

export default function Sidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
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

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Use JWT authentication instead of session cookies
        const response = await jwtManager.makeAuthenticatedRequest(`${getApiBaseUrl()}/me`);
        
        if (response && response.ok) {
          const userData = await response.json();
          
          setUserProfile({
            name: userData.display_name || 'Spotify User',
            role: userData.email || 'No email available',
            image: userData.images?.[0]?.url,
            initials: (userData.display_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          });
        } else {
          // Set default profile if fetch fails
          setUserProfile({
            name: 'Spotify User',
            role: 'No email available',
            image: null,
            initials: 'U'
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Set default profile if fetch fails
        setUserProfile({
          name: 'Spotify User',
          role: 'No email available',
          image: null,
          initials: 'U'
        });
      }
    };

    fetchUserProfile();
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
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    { 
      label: 'Last 4 Weeks', 
      path: '/last-4-weeks', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    { 
      label: 'Last 6 Months', 
      path: '/last-6-months', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    { 
      label: 'Last 12 Months', 
      path: '/last-12-months', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="12" y2="20"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    { 
      label: 'Concerts', 
      path: '/concerts', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      )
    },
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
          const spRes = await fetch(`${getApiBaseUrl()}/spotify/artist-search?name=${encodeURIComponent(value)}`, {
          credentials: 'include'
        });
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
          const tmRes = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(value)}`, {
          credentials: 'include'
        });
          const tmData = tmRes.ok ? await tmRes.json() : {};
          
          // Handle enhanced response format
          if (tmData.mainArtist || tmData.allAttractions) {
            // Use enhanced response format
            if (tmData.mainArtist) {
              tmSuggestions = [{
                name: tmData.mainArtist.name,
                spotifyId: null,
                ticketmasterId: tmData.mainArtist.ticketmasterId || tmData.mainArtist.id,
                image: null,
                genres: [],
                source: 'ticketmaster'
              }];
            } else if (tmData.allAttractions && tmData.allAttractions.length > 0) {
              // Fallback to first attraction if no main artist
              const firstAttraction = tmData.allAttractions[0];
              tmSuggestions = [{
                name: firstAttraction.name,
                spotifyId: null,
                ticketmasterId: firstAttraction.ticketmasterId || firstAttraction.id,
                image: null,
                genres: [],
                source: 'ticketmaster'
              }];
            } else {
              tmSuggestions = [];
            }
          } else if (tmData._embedded?.attractions) {
            // Fallback to old format
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
          } else {
            tmSuggestions = [];
          }
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
          const tmRes = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(artist.name)}`, {
          credentials: 'include'
        });
          const tmData = tmRes.ok ? await tmRes.json() : {};
          
          // Handle enhanced response format
          if (tmData.mainArtist) {
            ticketmasterId = tmData.mainArtist.ticketmasterId || tmData.mainArtist.id;
            const imageUrl = image; // Keep existing image
            setArtistCache(artist.name, ticketmasterId, imageUrl, spotifyId);
            console.log(`Cached Ticketmaster ID for "${artist.name}": ${ticketmasterId}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
          } else if (tmData.allAttractions && tmData.allAttractions.length > 0) {
            // Fallback to first attraction if no main artist
            const firstAttraction = tmData.allAttractions[0];
            ticketmasterId = firstAttraction.ticketmasterId || firstAttraction.id;
            const imageUrl = image; // Keep existing image
            setArtistCache(artist.name, ticketmasterId, imageUrl, spotifyId);
            console.log(`Cached Ticketmaster ID for "${artist.name}": ${ticketmasterId}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
          } else if (tmData._embedded?.attractions) {
            // Fallback to old format
            const attractions = tmData._embedded?.attractions || [];
            const exact = attractions.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
            if (exact && exact.id) {
              ticketmasterId = exact.id;
              const imageUrl = exact.images?.[0]?.url || image;
              setArtistCache(artist.name, exact.id, imageUrl, spotifyId);
              console.log(`Cached Ticketmaster ID for "${artist.name}": ${exact.id}${imageUrl ? ' with image' : ''}${spotifyId ? ' with Spotify ID' : ''}`);
            }
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

  // Handle search submit with optimized caching
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      let spotifyId = null;
      let ticketmasterId = null;
      
      // Check spotify_top_artists cache first
      const topArtists = getCachedTopArtists();
      const cachedArtist = topArtists?.find(a => a.name.toLowerCase() === searchQuery.trim().toLowerCase());
      if (cachedArtist) {
        spotifyId = cachedArtist.id;
      }
      
      // Check recent searches cache for Ticketmaster ID
      ticketmasterId = getTicketmasterIdFromRecentSearch(searchQuery.trim());
      
      // If we have Spotify ID but no Ticketmaster ID, try to fetch it
      if (spotifyId && !ticketmasterId) {
        try {
          const ticketmasterResponse = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(searchQuery.trim())}`, {
          credentials: 'include'
        });
          if (ticketmasterResponse.ok) {
            const ticketmasterData = await ticketmasterResponse.json();
            const exactMatch = ticketmasterData.allAttractions?.find(
              attraction => attraction.name.toLowerCase() === searchQuery.trim().toLowerCase()
            );
            if (exactMatch) {
              ticketmasterId = exactMatch.ticketmasterId || exactMatch.id;
              const artistObj = { 
                name: searchQuery.trim(), 
                spotifyId: spotifyId, 
                ticketmasterId: ticketmasterId,
                image: null
              };
              updateTicketmasterIdInRecentSearch(searchQuery.trim(), ticketmasterId, artistObj);
            }
          }
        } catch (error) {
          console.error(`[Sidebar] Error fetching Ticketmaster ID for ${searchQuery.trim()}:`, error);
        }
      }
      
      // Save to recent searches without image
      saveRecentSearch({ 
        name: searchQuery.trim(), 
        spotifyId, 
        ticketmasterId, 
        image: null
      });
      setRecentSearches(getRecentSearches());
      
      // Construct URL with all available parameters
      const urlParamsArr = [`name=${encodeURIComponent(searchQuery.trim())}`];
      if (spotifyId) urlParamsArr.push(`spotifyId=${spotifyId}`);
      if (ticketmasterId) urlParamsArr.push(`ticketmasterId=${ticketmasterId}`);
      const urlParams = urlParamsArr.join('&');
      
      // Close sidebar on mobile after navigation
      if (isMobile) {
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
      
      // Navigate to artist page with all parameters
      router.push(`/artist?${urlParams}`);
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to just name if search fails
      if (isMobile) {
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
      router.push(`/artist?name=${encodeURIComponent(searchQuery.trim())}`);
    }
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
          onClick={(e) => {
            // Don't close if clicking on search suggestions or search input
            if (e.target.closest('[data-search-container]')) {
              return;
            }
            setIsOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${isMobile ? styles.mobile : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
            <span className={styles.logoText}>Vibe Generator</span>
          </div>
          <button 
            className={styles.toggleButton}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isOpen ? <ChevronLeftIcon size={20} color="#fff" /> : <ChevronRightIcon size={20} color="#fff" />}
          </button>
        </div>

        {/* User Profile Section */}
        {userProfile && (
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {userProfile.image ? (
                <img 
                  src={userProfile.image} 
                  alt={userProfile.name}
                  className={styles.userImage}
                />
              ) : (
                <span className={styles.userInitials}>{userProfile.initials}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userProfile.name}</div>
              <div className={styles.userRole}>{userProfile.role}</div>
            </div>
            <div className={styles.userStatus}></div>
          </div>
        )}

        {/* Search Bar */}
        <div className={styles.searchContainer} data-search-container>
          <form onSubmit={handleSearch} className={styles.searchForm} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchInputWrapper} style={{ position: 'relative' }}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
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
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Search Suggestions */}
              {showSuggestions && artistSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  data-search-container
                  onClick={(e) => e.stopPropagation()}
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
                <div 
                  data-search-container
                  onClick={(e) => e.stopPropagation()}
                  style={{
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
          <button 
            className={styles.footerButton}
            onClick={async () => {
              try {
                // Set logout flag to prevent immediate re-authentication
                sessionStorage.setItem('userLoggedOut', 'true');
                
                // Clear QuickStats cache from sessionStorage
                if (typeof window !== 'undefined' && window.clearQuickStatsCache) {
                  window.clearQuickStatsCache();
                }
                
                // Clear all sessionStorage data
                sessionStorage.clear();
                
                // Clear all playlist URLs from localStorage
                localStorage.removeItem('last4weeks_playlist_url');
                localStorage.removeItem('last6months_playlist_url');
                localStorage.removeItem('last12months_playlist_url');
                localStorage.removeItem('last50songs_playlist_url');
                
                // Dispatch logout event for AuthWrapper to catch
                window.dispatchEvent(new CustomEvent('userLogout'));
                
                // Call logout API
                await fetch(`${getApiBaseUrl()}/logout`, {
          credentials: 'include'
        });
                
                // AuthWrapper will handle the UI transition
                
              } catch (error) {
                console.error('Logout error:', error);
                // Even if API fails, clear local data
                sessionStorage.setItem('userLoggedOut', 'true');
                sessionStorage.clear();
                if (typeof window !== 'undefined' && window.clearQuickStatsCache) {
                  window.clearQuickStatsCache();
                }
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
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ color: '#e74c3c' }}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
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
