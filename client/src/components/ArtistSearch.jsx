// components/ArtistSearch.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Import the necessary cache utility functions directly into this component
import { getRecentSearches, saveRecentSearch } from '../utils/recentSearchesCache';
import { getCachedArtistId, setArtistCache, getCachedArtistImage } from '../utils/artistCache';
import { getApiBaseUrl } from '../config/api';

export default function ArtistSearch({ onArtistSelect, placeholder = "Search for an artist..." }) {
  // MOVED: All state related to search is now inside this component
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MOVED: All refs are also managed internally
  const debounceTimerRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for the input itself
  const router = useRouter(); // Initialize router for navigation

  // MOVED: Fetch recent searches on component mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // MOVED: Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // MOVED: The main search logic from page.js
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length < 2) { // Changed to 2 for quicker suggestions
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

         debounceTimerRef.current = setTimeout(async () => {
       setLoading(true);
       setError('');
       try {
         const recent = getRecentSearches().find(a => a.name.toLowerCase() === value.trim().toLowerCase());
        let spSuggestions = [];
        let tmSuggestions = [];

        if (recent) {
          // Use cached data
          spSuggestions = recent.spotifyId ? [{ ...recent, source: 'spotify' }] : [];
          tmSuggestions = recent.ticketmasterId ? [{ ...recent, source: 'ticketmaster' }] : [];
        } else {
          // Fetch from Spotify and Ticketmaster APIs
          const [spRes, tmRes] = await Promise.all([
            fetch(`${getApiBaseUrl()}/spotify/artist-search?name=${encodeURIComponent(value)}`, {
              credentials: 'include'
            }),
            fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(value)}`, {
              credentials: 'include'
            })
          ]);

          const spData = spRes.ok ? await spRes.json() : {};
          spSuggestions = spData.artists?.map(a => ({
            name: a.name, spotifyId: a.id, ticketmasterId: null, image: a.image || null, genres: a.genres || [], source: 'spotify'
          })) || [];

          const tmData = tmRes.ok ? await tmRes.json() : {};
          console.log(`[ArtistSearch] 🔍 Raw Ticketmaster response for "${value}":`, tmData);
          console.log(`[ArtistSearch] 🔍 Response status:`, tmRes.status, tmRes.ok);
          console.log(`[ArtistSearch] 🔍 Response headers:`, Object.fromEntries(tmRes.headers.entries()));
          
          // Log all possible Ticketmaster ID fields
          console.log(`[ArtistSearch] 🔍 Ticketmaster ID Analysis for "${value}":`, {
            hasMainArtist: !!tmData.mainArtist,
            mainArtistName: tmData.mainArtist?.name,
            mainArtistId: tmData.mainArtist?.id,
            mainArtistTicketmasterId: tmData.mainArtist?.ticketmasterId,
            hasAllAttractions: !!tmData.allAttractions,
            allAttractionsCount: tmData.allAttractions?.length || 0,
            hasEmbeddedAttractions: !!tmData._embedded?.attractions,
            embeddedAttractionsCount: tmData._embedded?.attractions?.length || 0,
            firstEmbeddedAttraction: tmData._embedded?.attractions?.[0] ? {
              name: tmData._embedded?.attractions?.[0]?.name,
              id: tmData._embedded?.attractions?.[0]?.id,
              type: tmData._embedded?.attractions?.[0]?.type
            } : null
          });
          
          // Check for new enhanced response format first
          if (tmData.mainArtist || tmData.allAttractions) {
            console.log(`[ArtistSearch] 🔍 Enhanced response format detected:`, {
              mainArtist: tmData.mainArtist,
              allAttractions: tmData.allAttractions?.length || 0
            });
            
            // Use only the main artist from enhanced response
            const mainArtist = tmData.mainArtist;
            
            console.log(`[ArtistSearch] 🔍 Main artist from enhanced response:`, mainArtist);
            console.log(`[ArtistSearch] 🔍 Main artist ID details:`, {
              name: mainArtist?.name,
              id: mainArtist?.id,
              ticketmasterId: mainArtist?.ticketmasterId,
              finalTicketmasterId: mainArtist?.ticketmasterId || mainArtist?.id
            });
            
            // Create suggestion only from main artist
            if (mainArtist) {
              const finalTicketmasterId = mainArtist.ticketmasterId || mainArtist.id;
              console.log(`[ArtistSearch] 🔍 Using Ticketmaster ID: "${finalTicketmasterId}" for "${mainArtist.name}"`);
              
              tmSuggestions = [{
                name: mainArtist.name,
                spotifyId: null, // Will be matched with Spotify results
                ticketmasterId: finalTicketmasterId,
                image: null,
                genres: [],
                source: 'ticketmaster'
              }];
              
              console.log(`[ArtistSearch] 🔍 Created main artist suggestion for "${mainArtist.name}":`, {
                name: mainArtist.name,
                ticketmasterId: finalTicketmasterId,
                suggestionObject: tmSuggestions[0]
              });
            } else {
              // If no main artist, try to use the first attraction from allAttractions
              if (tmData.allAttractions && tmData.allAttractions.length > 0) {
                const firstAttraction = tmData.allAttractions[0];
                console.log(`[ArtistSearch] 🔍 Using first attraction as fallback:`, firstAttraction);
                
                tmSuggestions = [{
                  name: firstAttraction.name,
                  spotifyId: null,
                  ticketmasterId: firstAttraction.ticketmasterId || firstAttraction.id,
                  image: null,
                  genres: [],
                  source: 'ticketmaster'
                }];
                
                console.log(`[ArtistSearch] 🔍 Created fallback suggestion from allAttractions:`, tmSuggestions[0]);
              } else {
                tmSuggestions = [];
                console.log(`[ArtistSearch] ⚠️ No main artist or attractions found in enhanced response`);
              }
            }
          } else if (tmData._embedded?.attractions) {
            // Fallback to old format
            console.log(`[ArtistSearch] 🔍 Using fallback format (old response structure)`);
            const allAttractions = tmData._embedded?.attractions || [];
            console.log(`[ArtistSearch] 🔍 tmData._embedded:`, tmData._embedded);
            console.log(`[ArtistSearch] 🔍 tmData._embedded?.attractions:`, tmData._embedded?.attractions);
            
            // More lenient filtering - just check if it's an attraction and has an ID
            const musicAttractions = allAttractions.filter(a => {
              const hasId = a.id && a.id.trim() !== '';
              const isAttraction = a.type === 'attraction';
              
              console.log(`[ArtistSearch] 🔍 Filtering attraction "${a.name}":`, {
                type: a.type,
                id: a.id,
                hasId,
                isAttraction,
                passes: hasId && isAttraction
              });
              
              // Just check if it has an ID and is an attraction - be more lenient
              return hasId && isAttraction;
            });
            console.log(`[ArtistSearch] 🔍 Music attractions after filtering for "${value}":`, musicAttractions);
            
            tmSuggestions = musicAttractions.map(a => {
              const suggestion = {
                name: a.name,
                spotifyId: a.externalLinks?.spotify?.[0]?.url.match(/artist\/([a-zA-Z0-9]+)/)?.[1] || null,
                ticketmasterId: a.id || null, 
                image: a.images?.[0]?.url || null, 
                genres: a.genres || [], 
                source: 'ticketmaster'
              };
              
              console.log(`[ArtistSearch] 🔍 Created fallback suggestion for "${a.name}":`, {
                name: suggestion.name,
                ticketmasterId: suggestion.ticketmasterId,
                spotifyId: suggestion.spotifyId,
                suggestionObject: suggestion
              });
              
              return suggestion;
            });
          } else {
            // No attractions found at all
            console.log(`[ArtistSearch] ⚠️ No attractions found in any format`);
            tmSuggestions = [];
          }
          
          console.log(`[ArtistSearch] 🔍 Final Ticketmaster suggestions for "${value}":`, tmSuggestions);
          console.log(`[ArtistSearch] 🔍 Ticketmaster ID Summary for "${value}":`, {
            totalSuggestions: tmSuggestions.length,
            suggestionsWithIds: tmSuggestions.filter(s => s.ticketmasterId).length,
            allTicketmasterIds: tmSuggestions.map(s => ({ name: s.name, id: s.ticketmasterId }))
          });
        }

        // Merge logic
        const merged = [];
        const usedNames = new Set();
        console.log(`[ArtistSearch] 🔍 Starting merge process for "${value}":`, {
          spotifySuggestions: spSuggestions.length,
          ticketmasterSuggestions: tmSuggestions.length,
          ticketmasterIds: tmSuggestions.map(t => ({ name: t.name, id: t.ticketmasterId }))
        });
        
        spSuggestions.forEach(sp => {
          console.log(`[ArtistSearch] 🔍 Looking for Ticketmaster match for Spotify artist "${sp.name}"`);
          console.log(`[ArtistSearch] 🔍 Available Ticketmaster artists:`, tmSuggestions.map(t => ({ name: t.name, id: t.ticketmasterId })));
          
          const tm = tmSuggestions.find(t => {
            const exactMatch = t.name === sp.name;
            const lowerMatch = t.name.toLowerCase() === sp.name.toLowerCase();
            const containsMatch = t.name.toLowerCase().includes(sp.name.toLowerCase()) || sp.name.toLowerCase().includes(t.name.toLowerCase());
            
            console.log(`[ArtistSearch] 🔍 Comparing "${t.name}" with "${sp.name}":`, { 
              exactMatch, 
              lowerMatch, 
              containsMatch,
              tNameLower: t.name.toLowerCase(),
              spNameLower: sp.name.toLowerCase()
            });
            
            return exactMatch || lowerMatch || containsMatch;
          });
          
          const mergedArtist = { ...sp, ticketmasterId: tm?.ticketmasterId || sp.ticketmasterId };
          merged.push(mergedArtist);
          usedNames.add(sp.name);
          
          console.log(`[ArtistSearch] 🔍 Merged Spotify artist "${sp.name}":`, {
            name: mergedArtist.name,
            spotifyId: mergedArtist.spotifyId,
            ticketmasterId: mergedArtist.ticketmasterId,
            foundMatch: !!tm,
            matchedTicketmasterArtist: tm ? { name: tm.name, id: tm.ticketmasterId } : null,
            finalMergedObject: mergedArtist
          });
        });
                  tmSuggestions.forEach(tm => {
            if (!usedNames.has(tm.name)) {
              merged.push(tm);
              console.log(`[ArtistSearch] 🔍 Added Ticketmaster-only artist "${tm.name}":`, {
                name: tm.name,
                spotifyId: tm.spotifyId,
                ticketmasterId: tm.ticketmasterId
              });
            } else {
              console.log(`[ArtistSearch] 🔍 Skipping Ticketmaster artist "${tm.name}" (already merged with Spotify)`);
            }
          });

        console.log(`[ArtistSearch] 🔍 Final merged suggestions for "${value}":`, merged);
        console.log(`[ArtistSearch] 🔍 Final Ticketmaster ID Summary for "${value}":`, {
          totalMerged: merged.length,
          mergedWithTicketmasterIds: merged.filter(m => m.ticketmasterId).length,
          allMergedTicketmasterIds: merged.map(m => ({ 
            name: m.name, 
            spotifyId: m.spotifyId, 
            ticketmasterId: m.ticketmasterId,
            source: m.source 
          }))
        });
        
        // Log each suggestion individually for debugging
        merged.forEach((suggestion, index) => {
          console.log(`[ArtistSearch] 🔍 Suggestion ${index + 1}:`, {
            name: suggestion.name,
            spotifyId: suggestion.spotifyId,
            ticketmasterId: suggestion.ticketmasterId,
            source: suggestion.source
          });
        });
        
        setSuggestions(merged);
         setShowSuggestions(true);
       } catch (err) {
         console.error('Search error:', err);
         setError('Failed to search artists');
         setSuggestions([]);
         setShowSuggestions(false);
       } finally {
         setLoading(false);
       }
     }, 300);
  };

  // MOVED: The suggestion click handler now calls the prop
  const handleSuggestionClick = async (artist) => {
    // This function can still contain logic to finalize the artist object
    let finalArtist = { ...artist };
    
    console.log(`[ArtistSearch] 🔍 Processing artist selection for "${artist.name}":`, {
      originalTicketmasterId: artist.ticketmasterId,
      spotifyId: artist.spotifyId,
      source: artist.source,
      completeArtistObject: artist
    });
    
    // Example: If ticketmasterId is missing, try to fetch it
    if (!finalArtist.ticketmasterId) {
      const cachedId = getCachedArtistId(artist.name);
      if (cachedId) {
        finalArtist.ticketmasterId = cachedId;
        console.log(`[ArtistSearch] ✅ Found Ticketmaster ID in cache for "${artist.name}": ${cachedId}`);
      } else {
        try {
          console.log(`[ArtistSearch] 🔍 Ticketmaster ID not in cache, making API call for "${artist.name}"`);
          const tmRes = await fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(artist.name)}`, {
          credentials: 'include'
        });
          const tmData = tmRes.ok ? await tmRes.json() : {};
          const exactMatch = tmData._embedded?.attractions?.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
          if (exactMatch) {
            finalArtist.ticketmasterId = exactMatch.id;
            setArtistCache(artist.name, exactMatch.id, finalArtist.image, finalArtist.spotifyId);
            console.log(`[ArtistSearch] ✅ Found Ticketmaster ID via API call for "${artist.name}": ${exactMatch.id}`);
          } else {
            console.log(`[ArtistSearch] ⚠️ No Ticketmaster ID found via API call for "${artist.name}"`);
          }
        } catch (err) {
          console.error("Could not fetch Ticketmaster ID on click:", err);
        }
      }
    } else {
      console.log(`[ArtistSearch] ✅ Ticketmaster ID already available for "${artist.name}": ${finalArtist.ticketmasterId}`);
    }
    
    // Save to recent searches
    saveRecentSearch({ name: finalArtist.name, spotifyId: finalArtist.spotifyId, ticketmasterId: finalArtist.ticketmasterId, image: finalArtist.image });
    setRecentSearches(getRecentSearches());

    // Update UI
    setSearchTerm(finalArtist.name);
    setShowSuggestions(false);

    // CRITICAL CHANGE: Use the callback prop to notify the parent component
    console.log(`[ArtistSearch] 🎯 Final artist selected:`, {
      name: finalArtist.name,
      spotifyId: finalArtist.spotifyId,
      ticketmasterId: finalArtist.ticketmasterId,
      completeArtistObject: finalArtist
    });
    
    if (onArtistSelect) {
      console.log(`[ArtistSearch] 🎯 Calling onArtistSelect with:`, finalArtist);
      onArtistSelect(finalArtist);
    } else {
      console.log(`[ArtistSearch] ⚠️ onArtistSelect callback not provided`);
    }
  };

  // MOVED: Keyboard navigation logic
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

     // MOVED: On focus logic
   const handleFocus = () => {
     if (!searchTerm.trim()) {
       setSuggestions(recentSearches.slice(0, 5));
       setShowSuggestions(true);
     }
   };

   // Cleanup debounce timer on unmount
   useEffect(() => {
     return () => {
       if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
       }
     };
   }, []);

  // MOVED: All UI for the search input and suggestions dropdown
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
                 className="searchInput" // Use a class for easier styling
       />
       
       {loading && (
         <div className="loadingIndicator">
           Searching...
         </div>
       )}

       {error && (
         <div className="errorIndicator">
           {error}
         </div>
       )}

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestionsContainer">
          {suggestions.map((artist, index) => (
            <div
              key={`${artist.spotifyId || ''}_${artist.ticketmasterId || ''}_${artist.name || ''}_${index}`}
              onClick={() => handleSuggestionClick(artist)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={highlightedIndex === index ? 'suggestionItem highlighted' : 'suggestionItem'}
            >
              {artist.image && <img src={artist.image} alt={artist.name} className="suggestionImage" />}
              <span>{artist.name}</span>
            </div>
          ))}
        </div>
      )}
      {/* Basic styles, can be moved to a CSS module */}
      <style jsx>{`
        .searchInput {
          width: 100%;
          padding: 12px 18px;
          font-size: 1.1rem;
          border-radius: 50px;
          border: 1px solid #444;
          background: #282828;
          color: #fff;
          outline: none;
        }
        .suggestionsContainer {
          position: absolute;
          top: 110%;
          left: 0;
          right: 0;
          background: #282828;
          border: 1px solid #444;
          border-radius: 8px;
          max-height: 320px;
          overflow-y: auto;
          z-index: 1000;
        }
        .suggestionItem {
          padding: 12px 18px;
          color: #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.18s;
        }
        .suggestionItem.highlighted, .suggestionItem:hover {
          background: #3e3e3e;
        }
                 .suggestionImage {
           width: 40px;
           height: 40px;
           border-radius: 50%;
           object-fit: cover;
         }
         .loadingIndicator {
           position: absolute;
           top: 110%;
           left: 0;
           right: 0;
           background: #282828;
           border: 1px solid #444;
           border-radius: 8px;
           padding: 12px;
           margin-top: 4px;
           color: #e5e7eb;
           text-align: center;
           z-index: 1000;
         }
         .errorIndicator {
           position: absolute;
           top: 110%;
           left: 0;
           right: 0;
           background: #282828;
           border: 1px solid #ff4444;
           border-radius: 8px;
           padding: 12px;
           margin-top: 4px;
           color: #ff4444;
           text-align: center;
           z-index: 1000;
         }
       `}</style>
    </div>
  );
}