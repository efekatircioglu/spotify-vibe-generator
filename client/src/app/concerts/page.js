"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import NewTrackTable from '../../components/NewTrackTable';
import ConcertsList from '../../components/ConcertsList';

export default function ConcertsPage() {
  const router = useRouter();
  
  // State for artist selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // State for followed artists and top artists
  const [followedArtists, setFollowedArtists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false);
  
  // State for selected artists
  const [selectedArtists, setSelectedArtists] = useState([]);
  
  // State for concerts
  const [concerts, setConcerts] = useState([]);
  const [loadingConcerts, setLoadingConcerts] = useState(false);
  const [concertsError, setConcertsError] = useState('');
  
  // State for filtering
  const [locationFilter, setLocationFilter] = useState('');
  const [filteredConcerts, setFilteredConcerts] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  
  // State for view mode
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Debounced search
  const searchTimeoutRef = useRef(null);
  
  // Fetch followed artists
  useEffect(() => {
    setLoadingFollowed(true);
    fetch('http://127.0.0.1:8000/me/following/artists')
      .then(res => res.ok ? res.json() : { artists: [] })
      .then(data => {
        setFollowedArtists(data.artists || []);
      })
      .catch(err => {
        console.error('Error fetching followed artists:', err);
        setFollowedArtists([]);
      })
      .finally(() => setLoadingFollowed(false));
  }, []);
  
  // Fetch all artists from all time periods (deduplicated)
  useEffect(() => {
    setLoadingTop(true);
    fetch('http://127.0.0.1:8000/all-artists-deduplicated')
      .then(res => res.ok ? res.json() : { artists: [] })
      .then(data => {
        setTopArtists(data.artists || []);
        console.log('Deduplicated artists breakdown:', data.breakdown);
      })
      .catch(err => {
        console.error('Error fetching deduplicated artists:', err);
        setTopArtists([]);
      })
      .finally(() => setLoadingTop(false));
  }, []);
  
  // Debounced artist search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(true);
      fetch(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(searchQuery)}`)
        .then(res => res.ok ? res.json() : { attractions: [] })
        .then(data => {
          console.log('Raw Ticketmaster response:', data);
          // Filter for music artists only
          const attractions = data._embedded?.attractions || data.attractions || [];
          console.log('All attractions:', attractions);
          
          const musicArtists = attractions.filter(artist => {
            const isMusic = artist.classifications && 
              artist.classifications.some(classification => 
                classification.segment && classification.segment.name === 'Music'
              );
            console.log(`Artist ${artist.name}: isMusic = ${isMusic}`);
            return isMusic;
          });
          
          console.log('Filtered music artists:', musicArtists);
          setSearchResults(musicArtists);
        })
        .catch(err => {
          console.error('Error searching artists:', err);
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // Filter concerts when location filter changes
  useEffect(() => {
    if (!locationFilter.trim()) {
      setFilteredConcerts(concerts);
    } else {
      const filtered = concerts.filter(concert => {
        const venue = concert._embedded?.venues?.[0];
        if (!venue) return false;
        
        // Check city, country, state first (more relevant for location filtering)
        const city = venue.city?.name || '';
        const country = venue.country?.name || '';
        const state = venue.state?.name || '';
        const venueName = venue.name || '';
        
        const searchTerm = locationFilter.toLowerCase();
        
        // Only search by city, country, and state (no venue name)
        return city.toLowerCase().includes(searchTerm) ||
               country.toLowerCase().includes(searchTerm) ||
               state.toLowerCase().includes(searchTerm);
      });
      setFilteredConcerts(filtered);
    }
  }, [concerts, locationFilter]);
  
  // Add artist to selection
  const addArtist = (artist) => {
    if (!selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists(prev => [...prev, artist]);
      // Clear search bar after selection for better UX
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Auto-search and add artist from Spotify
  const autoSearchAndAddArtist = async (artistName) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`);
      if (response.ok) {
        const data = await response.json();
        const attractions = data._embedded?.attractions || data.attractions || [];
        const musicArtists = attractions.filter(artist => {
          const isMusic = artist.classifications && 
            artist.classifications.some(classification => 
              classification.segment && classification.segment.name === 'Music'
            );
          return isMusic;
        });
        
        if (musicArtists.length > 0) {
          // Auto-select the first match
          addArtist(musicArtists[0]);
        } else {
          // If no match found, just set the search query
          setSearchQuery(artistName);
        }
      } else {
        setSearchQuery(artistName);
      }
    } catch (err) {
      console.error('Error auto-searching artist:', err);
      setSearchQuery(artistName);
    }
  };
  
  // Remove artist from selection
  const removeArtist = (artistId) => {
    setSelectedArtists(prev => prev.filter(a => a.id !== artistId));
  };

  // Select all followed artists
  const selectAllFollowed = async () => {
    const artistsToAdd = followedArtists.filter(artist => 
      !selectedArtists.find(selected => selected.id === artist.id)
    );
    
    for (const artist of artistsToAdd) {
      await autoSearchAndAddArtist(artist.name);
    }
  };

  // Select all top artists
  const selectAllTop = async () => {
    const artistsToAdd = topArtists.filter(artist => 
      !selectedArtists.find(selected => selected.id === artist.id)
    );
    
    for (const artist of artistsToAdd) {
      await autoSearchAndAddArtist(artist.name);
    }
  };

  // Remove all selected artists
  const removeAllArtists = () => {
    setSelectedArtists([]);
  };
  
  // Search concerts for selected artists (globally)
  const searchConcerts = async () => {
    if (selectedArtists.length === 0) {
      setConcertsError('Please select at least one artist.');
      return;
    }
    
    setLoadingConcerts(true);
    setConcertsError('');
    setConcerts([]);
    setLocationFilter(''); // Reset filter
    
    try {
      // Fetch all concerts for all selected artists globally
      const allConcerts = [];
      
      for (const artist of selectedArtists) {
        const artistId = artist.id;
        if (artistId) {
          const response = await fetch(`http://127.0.0.1:8000/concerts/events?artistId=${artistId}`);
          if (response.ok) {
            const data = await response.json();
            const events = data._embedded?.events || [];
            // Add artist info to each event
            const eventsWithArtist = events.map(event => ({
              ...event,
              artist: artist
            }));
            allConcerts.push(...eventsWithArtist);
          }
        }
      }
      
      // Sort by date
      allConcerts.sort((a, b) => {
        const dateA = a.dates?.start?.localDate || '';
        const dateB = b.dates?.start?.localDate || '';
        return dateA.localeCompare(dateB);
      });
      
              setConcerts(allConcerts);
        setFilteredConcerts(allConcerts);
        
        // Extract cities and countries with concert counts from concerts
        const cityCounts = {};
        const countryCounts = {};
        
        allConcerts.forEach(concert => {
          const venue = concert._embedded?.venues?.[0];
          if (venue) {
            if (venue.city?.name) {
              cityCounts[venue.city.name] = (cityCounts[venue.city.name] || 0) + 1;
            }
            if (venue.country?.name) {
              countryCounts[venue.country.name] = (countryCounts[venue.country.name] || 0) + 1;
            }
          }
        });
        
        // Sort cities by concert count (most to least)
        const sortedCities = Object.entries(cityCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([city]) => city);
        
        // Sort countries by concert count (most to least)
        const sortedCountries = Object.entries(countryCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([country]) => country);
        
        setAvailableCities(sortedCities);
        setAvailableCountries(sortedCountries);
    } catch (err) {
      setConcertsError('Failed to fetch concerts. Please try again.');
      console.error('Error fetching concerts:', err);
    } finally {
      setLoadingConcerts(false);
    }
  };
  
  return (
    <main style={{ padding: 32, background: '#101114', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/')}
          className={styles.vibeButton}
        >
          Profile
        </button>
      </div>
      
      <h1 style={{ 
        marginBottom: 32, 
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: 900,
        color: '#fff',
        textAlign: 'center'
      }}>
        Find Concerts Worldwide
      </h1>
      
      {/* Artist Selection */}
      <div style={{ 
        background: '#181818', 
        padding: 24, 
        borderRadius: 16, 
        marginBottom: 32,
        boxShadow: '0 4px 16px #0003'
      }}>
        <h2 style={{ color: '#fff', marginBottom: 16, fontSize: '1.5rem' }}>Select Artists</h2>
        
        {/* Search Artists */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#b3b3b3', marginBottom: 12, fontSize: '1.1rem' }}>Search Artists</h3>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: 8 }}>
            Debug: Query length: {searchQuery.length}, Searching: {searching ? 'Yes' : 'No'}, Results: {searchResults.length}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for artists on Ticketmaster..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '2px solid #333',
              background: '#232323',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              marginBottom: 12,
            }}
            onFocus={(e) => e.target.style.borderColor = '#1db954'}
            onBlur={(e) => e.target.style.borderColor = '#333'}
          />
          {searching && <div style={{ color: '#1db954' }}>Searching...</div>}
          {searchResults.length > 0 && (
            <div style={{ 
              maxHeight: 200, 
              overflowY: 'auto',
              background: '#232323',
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              {searchResults.map(artist => (
                <div
                  key={artist.id}
                  onClick={() => addArtist(artist)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#404040'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {artist.images?.[0]?.url && (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <span>{artist.name}</span>
                </div>
              ))}
            </div>
          )}
          {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: 8 }}>
              No artists found. Try a different search term.
            </div>
          )}
        </div>
        
        {/* Followed Artists */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 12 
          }}>
            <h3 style={{ color: '#b3b3b3', fontSize: '1.1rem', margin: 0 }}>
              Your Followed Artists {loadingFollowed && '(Loading...)'}
            </h3>
            {followedArtists.length > 0 && (
              <button
                onClick={selectAllFollowed}
                style={{
                  padding: '6px 12px',
                  background: '#1db954',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1ed760'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1db954'}
              >
                Select All
              </button>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
            maxHeight: 150,
            overflowY: 'auto'
          }}>
            {followedArtists.map(artist => (
              <button
                key={artist.id}
                onClick={() => autoSearchAndAddArtist(artist.name)}
                style={{
                  padding: '8px 12px',
                  background: '#232323',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  minWidth: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1db954';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#232323';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                {artist.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Top Artists */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 12 
          }}>
            <h3 style={{ color: '#b3b3b3', fontSize: '1.1rem', margin: 0 }}>
              Your Top Artists {loadingTop && '(Loading...)'}
            </h3>
            {topArtists.length > 0 && (
              <button
                onClick={selectAllTop}
                style={{
                  padding: '6px 12px',
                  background: '#1db954',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1ed760'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1db954'}
              >
                Select All
              </button>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
            maxHeight: 150,
            overflowY: 'auto'
          }}>
            {topArtists.map(artist => (
              <button
                key={artist.id}
                onClick={() => autoSearchAndAddArtist(artist.name)}
                style={{
                  padding: '8px 12px',
                  background: '#232323',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  minWidth: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1db954';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#232323';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                {artist.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected Artists */}
        {selectedArtists.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 12 
            }}>
              <h3 style={{ color: '#1db954', fontSize: '1.1rem', margin: 0 }}>
                Selected Artists ({selectedArtists.length})
              </h3>
              <button
                onClick={removeAllArtists}
                style={{
                  padding: '6px 12px',
                  background: '#f87171',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f87171'}
              >
                Remove All
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 12
            }}>
              {selectedArtists.map(artist => (
                <div
                  key={artist.id}
                  style={{
                    padding: '12px 16px',
                    background: '#1db954',
                    color: '#000',
                    border: '1px solid #1db954',
                    borderRadius: 20,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 'fit-content',
                  }}
                >
                  {/* Artist Image */}
                  {artist.images?.[0]?.url && (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '1px solid #000',
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>{artist.name}</span>
                  <button
                    onClick={() => removeArtist(artist.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: 0,
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 4,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search Concerts Button */}
        <button
          onClick={searchConcerts}
          disabled={selectedArtists.length === 0 || loadingConcerts}
          style={{
            padding: '12px 24px',
            background: selectedArtists.length > 0 ? '#1db954' : '#333',
            color: selectedArtists.length > 0 ? '#000' : '#666',
            border: 'none',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 700,
            cursor: selectedArtists.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (selectedArtists.length > 0) {
              e.currentTarget.style.background = '#1ed760';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedArtists.length > 0) {
              e.currentTarget.style.background = '#1db954';
            }
          }}
        >
          {loadingConcerts ? 'Searching Worldwide...' : 'Find All Concerts'}
        </button>
      </div>
      
      {/* Concerts Results */}
      {concertsError && (
        <div style={{ 
          background: '#f87171', 
          color: '#000', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24 
        }}>
          {concertsError}
        </div>
      )}
      
      {!loadingConcerts && !concertsError && concerts.length === 0 && selectedArtists.length > 0 && (
        <div style={{ 
          background: '#181818', 
          padding: 24, 
          borderRadius: 16, 
          marginBottom: 24,
          boxShadow: '0 4px 16px #0003',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: '#b3b3b3', 
            fontSize: '1.2rem', 
            marginBottom: 8 
          }}>
            No upcoming concerts found
          </div>
          <div style={{ 
            color: '#888', 
            fontSize: '1rem' 
          }}>
            No concerts were found for the selected artists on Ticketmaster.
          </div>
        </div>
      )}
      
      {concerts.length > 0 && (
        <div style={{ 
          background: '#181818', 
          padding: 24, 
          borderRadius: 16,
          boxShadow: '0 4px 16px #0003'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24 
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>
              Concerts Found ({filteredConcerts.length} of {concerts.length})
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'list' ? '#1db954' : '#232323',
                  color: viewMode === 'list' ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'calendar' ? '#1db954' : '#232323',
                  color: viewMode === 'calendar' ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Calendar View
              </button>
            </div>
          </div>
          
          {/* Location Filter */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location (e.g., London, GB, New York)..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '2px solid #333',
                background: '#232323',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                marginBottom: 12,
              }}
              onFocus={(e) => e.target.style.borderColor = '#1db954'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
            
            {/* Available Location Buttons */}
            {(availableCities.length > 0 || availableCountries.length > 0) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: 24
                }}>
                  {/* Cities Section */}
                  {availableCities.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#1db954', 
                        fontSize: '0.9rem', 
                        marginBottom: 8,
                        fontWeight: 600
                      }}>
                        Cities ({availableCities.length}):
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: 6,
                        maxHeight: 100,
                        overflowY: 'auto'
                      }}>
                        {availableCities.map(city => (
                          <button
                            key={city}
                            onClick={() => setLocationFilter(city)}
                            style={{
                              padding: '4px 8px',
                              background: locationFilter === city ? '#1db954' : '#232323',
                              color: locationFilter === city ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: 0,
                            }}
                            onMouseEnter={(e) => {
                              if (locationFilter !== city) {
                                e.currentTarget.style.background = '#404040';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (locationFilter !== city) {
                                e.currentTarget.style.background = '#232323';
                              }
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Countries Section */}
                  {availableCountries.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#fbbf24', 
                        fontSize: '0.9rem', 
                        marginBottom: 8,
                        fontWeight: 600
                      }}>
                        Countries ({availableCountries.length}):
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: 6,
                        maxHeight: 100,
                        overflowY: 'auto'
                      }}>
                        {availableCountries.map(country => (
                          <button
                            key={country}
                            onClick={() => setLocationFilter(country)}
                            style={{
                              padding: '4px 8px',
                              background: locationFilter === country ? '#fbbf24' : '#232323',
                              color: locationFilter === country ? '#000' : '#fff',
                              border: '1px solid #333',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                              minWidth: 0,
                            }}
                            onMouseEnter={(e) => {
                              if (locationFilter !== country) {
                                e.currentTarget.style.background = '#404040';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (locationFilter !== country) {
                                e.currentTarget.style.background = '#232323';
                              }
                            }}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Clear Filter Button */}
                {locationFilter && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <button
                      onClick={() => setLocationFilter('')}
                      style={{
                        padding: '6px 16px',
                        background: '#f87171',
                        color: '#000',
                        border: '1px solid #f87171',
                        borderRadius: 16,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f87171'}
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {viewMode === 'list' ? (
            <ConcertsList 
              concerts={filteredConcerts} 
              selectedArtist={selectedArtists.length > 0 ? (() => {
                const artistNames = selectedArtists.map(artist => artist.name).join(', ');
                console.log('Selected artists for highlighting:', artistNames);
                return artistNames;
              })() : null}
            />
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>
              Calendar view coming soon!
            </div>
          )}
        </div>
      )}
    </main>
  );
} 