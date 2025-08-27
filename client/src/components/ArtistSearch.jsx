import React, { useState, useEffect, useRef } from 'react';
import styles from '../app/page.module.css';
import { getCachedArtistId, setArtistCache, getCachedArtistImage } from '../utils/artistCache';
import { getRecentSearches, saveRecentSearch } from '../utils/recentSearchesCache';

export default function ArtistSearch({ onArtistSelect, placeholder = "Search for an artist..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search function
  const debouncedSearch = (term) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (term.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        // Check cache first
        const cachedId = getCachedArtistId(term.trim());
        let spotifySuggestions = [];
        let tmSuggestions = [];
        
        if (cachedId) {
          console.log(`Found cached Ticketmaster ID for "${term.trim()}": ${cachedId}`);
          // Use cached data if available
          const cachedImage = getCachedArtistImage(term.trim());
          // We'll still search Spotify to get fresh data, but use cached Ticketmaster ID
        }
        
        // Search Spotify
        const spRes = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(term)}`);
        if (spRes.ok) {
          const spData = await spRes.json();
          spotifySuggestions = spData.artists?.map(a => ({
            name: a.name,
            spotifyId: a.id,
            ticketmasterId: null,
            image: a.image || null,
            genres: a.genres || [],
            source: 'spotify'
          })) || [];
        }
        
        // Search Ticketmaster
        const tmRes = await fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(term)}`);
        if (tmRes.ok) {
          const tmData = await tmRes.json();
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
        spotifySuggestions.forEach(sp => {
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
        
        // Cache successful results
        merged.forEach(artist => {
          if (artist.ticketmasterId && artist.spotifyId) {
            setArtistCache(artist.name, artist.ticketmasterId, artist.image, artist.spotifyId);
          }
        });
        
        setSuggestions(merged);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search artists');
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (artist) => {
    setSearchTerm(artist.name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Save to recent searches
    saveRecentSearch({ 
      name: artist.name, 
      spotifyId: artist.spotifyId, 
      ticketmasterId: artist.ticketmasterId, 
      image: artist.image 
    });
    
    onArtistSelect(artist);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Update search term when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      setSearchTerm(suggestions[highlightedIndex].name);
    }
  }, [highlightedIndex, suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={suggestionsRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #444',
          background: '#222',
          color: '#fff',
          outline: 'none',
        }}
        autoComplete="off"
      />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#222',
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '4px',
          zIndex: 1000,
        }}>
          Searching...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#222',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '4px',
          color: '#ff4444',
          zIndex: 1000,
        }}>
          {error}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#222',
          border: '1px solid #444',
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
        }}>
          {suggestions.map((artist, index) => (
            <div
              key={artist.id}
              onClick={() => handleSuggestionClick(artist)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: index < suggestions.length - 1 ? '1px solid #333' : 'none',
                background: index === highlightedIndex ? '#1db954' : 'transparent',
                color: index === highlightedIndex ? '#fff' : '#fff',
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {artist.image && (
                <img
                  src={artist.image}
                  alt={artist.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div>
                <div style={{ fontWeight: '600' }}>{artist.name}</div>
                {artist.genres.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    {artist.genres.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 