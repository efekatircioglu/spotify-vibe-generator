"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';
import AlbumSelector from '../../components/AlbumSelector';
import NewTrackTable from '../../components/NewTrackTable';
import ConcertsList from '../../components/ConcertsList';
import { getCachedArtistId, setArtistCache, getCachedArtistImage } from '../../utils/artistCache';

// Add this helper function at the top-level (outside the component)
function discogsProfileToLinks(profile) {
  if (!profile) return '';
  // [a=Name] or [l=Name] → just the name
  let result = profile
    .replace(/\[a=([^\]]+)\]/g, '$1')
    .replace(/\[l=([^\]]+)\]/g, '$1');
  // [a12345] → link to artist
  result = result.replace(/\[a(\d+)\]/g, (match, id) =>
    `<a href="https://www.discogs.com/artist/${id}" target="_blank" rel="noopener noreferrer" title="View artist on Discogs">Artist #${id}</a>`
  );
  // [l67890] → link to label
  result = result.replace(/\[l(\d+)\]/g, (match, id) =>
    `<a href="https://www.discogs.com/label/${id}" target="_blank" rel="noopener noreferrer" title="View label on Discogs">Label #${id}</a>`
  );
  // [r54321] → link to release
  result = result.replace(/\[r(\d+)\]/g, (match, id) =>
    `<a href="https://www.discogs.com/release/${id}" target="_blank" rel="noopener noreferrer" title="View release on Discogs">Release #${id}</a>`
  );
  // Remove any other [bracketed] codes
  result = result.replace(/\[[^\]]+\]/g, '');
  return result;
}

// Add this helper function for genre/style lookup (copied from AlbumSelector.jsx)
function findDiscogsGenreStyle(albumName, genreStyleMap) {
  if (!albumName || !genreStyleMap) return null;
  const normalized = albumName.trim().toLowerCase();
  for (const key of Object.keys(genreStyleMap)) {
    if (key.toLowerCase().endsWith(normalized)) {
      return { discogsKey: key, genre: genreStyleMap[key][0], style: genreStyleMap[key][1] };
    }
  }
  return null;
}

export default function ArtistConcertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artistName = searchParams.get('name') || '';
  const spotifyId = searchParams.get('spotifyId') || '';
  const ticketmasterId = searchParams.get('ticketmasterId') || '';
  
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableZoomedOut, setTableZoomedOut] = useState(false);
  const tableRef = useRef(null);

  // New state for albums and tracks
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [albumError, setAlbumError] = useState('');
  const [tracksError, setTracksError] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [artistFollowers, setArtistFollowers] = useState(null);
  const [isFollowing, setIsFollowing] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [discogsProfile, setDiscogsProfile] = useState(null);
  const [discogsRealName, setDiscogsRealName] = useState(null);
  // New state for genre/style map
  const [albumGenreStyleMap, setAlbumGenreStyleMap] = useState({});
  
  // Pagination state for concerts
  const [currentPage, setCurrentPage] = useState(1);
  const concertsPerPage = 20;
  
  // State for Ticketmaster ID not found
  const [ticketmasterIdNotFound, setTicketmasterIdNotFound] = useState(false);
  
  // State for artist search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Album group filter state
  const [albumGroup, setAlbumGroup] = useState('album');
  const albumGroups = [
    { label: 'Albums', value: 'album' },
    { label: 'Singles', value: 'single' },
    { label: 'Compilations', value: 'compilation' },
    { label: 'Appears On', value: 'appears_on' },
  ];

  // Helper to format date as '20 April 2025'
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${monthNames[monthIndex]} ${year}`;
  }

  // Fetch albums when artist or group changes
  useEffect(() => {
    if (!selectedArtist?.id || !selectedArtist?.name) return;
    console.log('Selected artist for genre/style fetch:', selectedArtist.name);
    setLoadingAlbums(true);
    setAlbumError('');
    setAlbums([]);
    setSelectedAlbumId(null);
    // Fetch albums from Spotify
    fetch(`http://127.0.0.1:8000/artist-albums/${selectedArtist.id}?group=${albumGroup}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch albums');
        return res.json();
      })
      .then(data => {
        setAlbums(data.albums || []);
        if (data.albums && data.albums.length > 0) {
          setSelectedAlbumId(data.albums[0].id);
        }
      })
      .catch(err => {
        setAlbumError(err.message || 'Failed to fetch albums');
      })
      .finally(() => setLoadingAlbums(false));
    // Explicitly fetch genre/style map from Discogs
    fetch(`http://localhost:8000/discogs/artist/${encodeURIComponent(selectedArtist.name)}/genre-style-map`)
      .then(res => res.ok ? res.json() : { map: {} })
      .then(data => {
        console.log('Fetched genre/style map:', data.map);
        setAlbumGenreStyleMap(data.map || {});
      })
      .catch((err) => {
        console.error('Error fetching genre/style map:', err);
        setAlbumGenreStyleMap({});
      });
  }, [selectedArtist, albumGroup]);

  // Merge genre/style info into albums
  const albumsWithGenreStyle = albums.map(album => {
    const genreStyle = albumGenreStyleMap[album.name] || [[], []];
    return { ...album, genre: genreStyle[0], style: genreStyle[1] };
  });

  // Fetch tracks for selected album
  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumTracks([]);
      return;
    }
    setLoadingTracks(true);
    setTracksError('');
    // Do NOT clear albumTracks here; keep old data visible while loading
    fetch(`http://127.0.0.1:8000/album-tracks/${selectedAlbumId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch album tracks');
        return res.json();
      })
      .then(data => {
        setAlbumTracks(data.tracks || []);
      })
      .catch(err => {
        setTracksError(err.message || 'Failed to fetch album tracks');
      })
      .finally(() => setLoadingTracks(false));
  }, [selectedAlbumId]);

  // Initialize artist from URL params
  useEffect(() => {
    if (artistName) {
      setSelectedArtist({
        id: spotifyId || null,
        name: artistName,
      });
    }
  }, [artistName, spotifyId]);

  // Fetch artist image and followers from Spotify
  useEffect(() => {
    if (!spotifyId) return;
    fetch(`http://127.0.0.1:8000/spotify/artist-details/${spotifyId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          setArtistImage(data.images[0].url);
        }
        if (data && data.followers && data.followers.total) {
          setArtistFollowers(data.followers.total);
        }
      });
  }, [spotifyId]);

  // Fetch follow status when artist is loaded
  useEffect(() => {
    if (!spotifyId) return;
    setIsFollowing(null);
    fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`)
      .then(res => res.ok ? res.json() : { isFollowing: false })
      .then(data => setIsFollowing(data.isFollowing))
      .catch(() => setIsFollowing(false));
  }, [spotifyId]);

  // Fetch Discogs artist profile when artistName changes
  useEffect(() => {
    if (!artistName) return;
    console.log("Fetching Discogs profile for:", artistName);
    fetch(`http://localhost:8000/discogs/artist-profile?name=${encodeURIComponent(artistName)}`)
      .then(res => res.json())
      .then(data => {
        setDiscogsProfile(data.profile || null);
        setDiscogsRealName(data.realName || null);
        console.log("Discogs profile response:", data);
      })
      .catch(err => {
        console.error("Error fetching Discogs profile:", err);
      });
  }, [artistName]);

  // Retry function for API calls (same as concerts page)
  const fetchWithRetry = async (url, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        } else if (response.status === 500 && attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed with 500 error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  };

  // Search for artist on Ticketmaster
  const searchArtist = async (artistName) => {
    setSearching(true);
    setSearchError('');
    try {
      // Check cache first
      const cachedId = getCachedArtistId(artistName);
      if (cachedId) {
        console.log(`Found cached Ticketmaster ID for "${artistName}": ${cachedId}`);
        // Navigate to the artist page with the cached ID
        router.push(`/artist?name=${encodeURIComponent(artistName)}&spotifyId=${spotifyId}&ticketmasterId=${cachedId}`);
        return;
      }

      const data = await fetchWithRetry(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`);
      const attractions = data._embedded?.attractions || data.attractions || [];
      const musicArtists = attractions.filter(artist => {
        const isMusic = artist.classifications && 
          artist.classifications.some(classification => 
            classification.segment && classification.segment.name === 'Music'
          );
        return isMusic;
      });
      
      if (musicArtists.length > 0) {
        // Cache the successful result with image
        const firstArtist = musicArtists[0];
        const imageUrl = firstArtist.images?.[0]?.url || null;
        setArtistCache(artistName, firstArtist.id, imageUrl);
        console.log(`Cached Ticketmaster ID for "${artistName}": ${firstArtist.id}${imageUrl ? ' with image' : ''}`);
        
        // Navigate to the artist page with the found ID
        router.push(`/artist?name=${encodeURIComponent(artistName)}&spotifyId=${spotifyId}&ticketmasterId=${firstArtist.id}`);
      } else {
        setSearchError('No Ticketmaster artist found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching artist:', err);
      setSearchError('Failed to search for artist. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Fetch concerts using batch API (same as concerts page)
  useEffect(() => {
    if (!ticketmasterId) {
      setTicketmasterIdNotFound(true);
      setConcerts([]);
      return;
    }
    
    setLoading(true);
    setError('');
    setConcerts([]);
    setTicketmasterIdNotFound(false);
    
    const fetchConcerts = async () => {
      try {
        console.log(`Making batch request for artist ID: ${ticketmasterId}`);
        
        // Use the same batch endpoint as concerts page
        const response = await fetch('http://127.0.0.1:8000/concerts/events/optimized-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artistIds: [ticketmasterId] }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const allConcerts = data.concerts || [];
        
        console.log(`Received ${allConcerts.length} concerts from batch endpoint`);
        
        // Sort by date
        const sortedConcerts = allConcerts.sort((a, b) => {
          const dateA = a.dates?.start?.localDate || '';
          const dateB = b.dates?.start?.localDate || '';
          return dateA.localeCompare(dateB);
        });
        
        setConcerts(sortedConcerts);
      } catch (err) {
        setError(err.message || 'Concert search failed');
        console.error('Error fetching concerts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConcerts();
  }, [ticketmasterId]);

  // Compute selected album object
  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);
  // Inject album name and year into each track
  const tracksWithAlbumInfo = (albumTracks || []).map(track => ({
    ...track,
    album: selectedAlbum?.name || '',
    release_year: selectedAlbum?.releaseYear || '',
    album_image: selectedAlbum?.image || '',
  }));

  // Get genres and styles for selected album from Discogs
  const discogsGenreStyle = findDiscogsGenreStyle(selectedAlbum?.name, albumGenreStyleMap);
  const genresForTable = [
    ...(discogsGenreStyle?.genre || []),
    ...(discogsGenreStyle?.style || [])
  ];

  return (
    <main style={{ padding: 0, margin: 0, background: '#101114', minHeight: '100vh' }}>
      {/* Artist Search Section (when no artist is selected) */}
      {!selectedArtist && (
        <div style={{ 
          padding: 32, 
          background: '#101114', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginBottom: 24 
          }}>
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
            Search Artist on Ticketmaster
          </h1>
          
          <div style={{ 
            background: '#181818', 
            padding: 24, 
            borderRadius: 16, 
            marginBottom: 32,
            boxShadow: '0 4px 16px #0003',
            width: '100%',
            maxWidth: 500
          }}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && searchArtist(searchQuery.trim())}
                placeholder="Enter artist name (e.g., Kanye West, Ye, etc.)"
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
              
              <button
                onClick={() => searchQuery.trim() && searchArtist(searchQuery.trim())}
                disabled={!searchQuery.trim() || searching}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: searchQuery.trim() && !searching ? '#1db954' : '#333',
                  color: searchQuery.trim() && !searching ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: searchQuery.trim() && !searching ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {searching ? 'Searching...' : 'Search Artist'}
              </button>
            </div>
            
            {searchError && (
              <div style={{ 
                background: '#f87171', 
                color: '#000', 
                padding: 16, 
                borderRadius: 8, 
                marginTop: 16,
                fontSize: '0.9rem'
              }}>
                {searchError}
              </div>
            )}
            
            <div style={{ 
              color: '#b3b3b3', 
              fontSize: '0.9rem', 
              marginTop: 16,
              textAlign: 'center'
            }}>
              <p>💡 <strong>Tip:</strong> Try different variations of artist names.</p>
              <p>For example: "Kanye West" might return "Ye" on Ticketmaster.</p>
            </div>
          </div>
        </div>
      )}

      {/* Artist Info and Albums */}
      {selectedArtist && (
        <>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              minHeight: '60vh',
              width: '100vw',
              borderRadius: '0 0 32px 32px',
              boxShadow: '0 4px 32px #0002',
              padding: '64px 64px 56px 64px',
              overflow: 'hidden',
              zIndex: 10,
              marginTop: '-32px',
              background: 'none', // Remove previous background
            }}
          >
            {/* Blurred, stretched background image */}
            {artistImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url('${artistImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(28px) brightness(0.7)',
                  zIndex: 1,
                }}
              />
            )}
            {/* Dark overlay for contrast */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(16,17,20,0.7)',
                zIndex: 2,
              }}
            />
            {/* Main content */}
            <button
              onClick={() => router.push('/')}
              className={styles.vibeButton}
              style={{
                position: 'absolute',
                top: 24,
                left: 32,
                zIndex: 4,
                marginBottom: 0,
                background: 'transparent',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 24,
                padding: '10px 28px',
                fontSize: '1.08rem',
                border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
            >
              <span style={{ fontSize: '1.3em', marginRight: 6 }}>←</span> Profile
            </button>
            {artistImage && (
              <img src={artistImage} alt={selectedArtist.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 24px #0004', border: '4px solid #fff', zIndex: 4 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, zIndex: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{selectedArtist.name}</span>
              </div>
              {artistFollowers !== null && (
                <span style={{ color: '#b3b3b3', fontSize: '1.15rem', fontWeight: 500, marginTop: 2 }}>
                  {artistFollowers.toLocaleString()} Followers
                </span>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  style={{
                    background: isFollowing ? '#232323' : '#1db954',
                    color: isFollowing ? '#1db954' : '#181818',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 24,
                    padding: '10px 28px',
                    fontSize: '1.08rem',
                    cursor: followLoading || isFollowing === null ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: followLoading || isFollowing === null ? 0.7 : 1,
                    pointerEvents: followLoading || isFollowing === null ? 'none' : 'auto',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  disabled={followLoading || isFollowing === null}
                  onClick={async () => {
                    if (isFollowing === null) return;
                    setFollowLoading(true);
                    try {
                      if (isFollowing) {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'DELETE' });
                      } else {
                        await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`, { method: 'PUT' });
                      }
                      // Always re-fetch the follow status after the action
                      const res = await fetch(`http://127.0.0.1:8000/me/following/artist/${spotifyId}`);
                      const data = await res.json();
                      setIsFollowing(data.isFollowing);
                    } catch (e) {}
                    setFollowLoading(false);
                  }}
                >
                  {isFollowing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#1db954"/><path d="M6 10.5L9 13.5L14 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Followed
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
                <button
                  style={{ background: '#232323', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 24, padding: '10px 28px', fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px #0001' }}
                  onClick={() => {
                    if (spotifyId) {
                      window.open(`https://open.spotify.com/artist/${spotifyId}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >Play</button>
              </div>
            </div>
          </div>

          {/* About (Discogs profile) block - show above albums if exists */}
          {discogsProfile && (
            <div style={{
              marginTop: 18,
              background: '#181c24',
              color: '#b3b3b3',
              padding: 18,
              borderRadius: 12,
              maxWidth: '80vw',
              width: '80vw',
              minWidth: 320,
              marginLeft: 'auto',
              marginRight: 'auto',
              boxShadow: '0 2px 16px #0004',
              fontSize: 18,
              fontWeight: 400,
              whiteSpace: 'pre-line',
              textAlign: 'left',
              position: 'relative',
            }}>
              <style>{`.discogs-profile-links a { text-decoration: underline !important; }`}</style>
              {discogsRealName && (
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
                  Real Name: <span style={{ color: '#38bdf8' }}>{discogsRealName}</span>
                </div>
              )}
              <strong style={{ color: '#fff', fontSize: 22 }}>About:</strong>
              <div style={{ marginTop: 8 }}
                className="discogs-profile-links"
                dangerouslySetInnerHTML={{ __html: discogsProfileToLinks(discogsProfile) }}
              />
            </div>
          )}
          
          {/* Album Selector */}
          <div style={{ marginBottom: 64, marginTop: 48 }}>
            <div style={{ display: 'flex', gap: 12, marginLeft: 50, marginBottom: 18 }}>
              {albumGroups.map(group => (
                <button
                  key={group.value}
                  onClick={() => setAlbumGroup(group.value)}
                  style={{
                    background: albumGroup === group.value ? '#1db954' : '#232323',
                    color: albumGroup === group.value ? '#181818' : '#fff',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 18,
                    padding: '8px 18px',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                    boxShadow: albumGroup === group.value ? '0 2px 8px #1db95433' : 'none',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <AlbumSelector
              albums={albumsWithGenreStyle}
              selectedAlbumId={selectedAlbumId}
              onAlbumSelect={album => setSelectedAlbumId(album.id)}
              albumGenreStyleMap={albumGenreStyleMap}
            />
            {loadingAlbums && <div>Loading...</div>}
            {albumError && <div style={{ color: 'red' }}>{albumError}</div>}
          </div>

          {/* Track Table for selected album */}
          {selectedAlbumId && albumTracks.length > 0 && (
            <div style={{ marginBottom: 48,
              display: 'flex',
              justifyContent: 'center'
             }}>
              <NewTrackTable
                tracks={tracksWithAlbumInfo}
                title={selectedAlbum?.name || 'Album Tracks'}
                playlistKey={selectedAlbumId}
                loading={loadingTracks}
                error={tracksError}
                showCreatePlaylist={false}
                showViewPlaylist={false}
                genres={genresForTable}
              />
            </div>
          )}

          {/* Concerts Section */}
          {loading && <div>Loading concerts...</div>}
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {!loading && !error && (
            <>
              {/* Pagination Controls Above Calendar */}
              {concerts.length > concertsPerPage && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: 16, 
                  marginBottom: 24,
                  padding: '16px 0'
                }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px',
                      background: currentPage === 1 ? '#333' : '#1db954',
                      color: currentPage === 1 ? '#666' : '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <div style={{ 
                    color: '#fff', 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {currentPage} / {Math.ceil(concerts.length / concertsPerPage)}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(concerts.length / concertsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(concerts.length / concertsPerPage)}
                    style={{
                      padding: '8px 16px',
                      background: currentPage === Math.ceil(concerts.length / concertsPerPage) ? '#333' : '#1db954',
                      color: currentPage === Math.ceil(concerts.length / concertsPerPage) ? '#666' : '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: currentPage === Math.ceil(concerts.length / concertsPerPage) ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
              
              <ConcertsList 
                concerts={concerts.slice(
                  (currentPage - 1) * concertsPerPage, 
                  currentPage * concertsPerPage
                )} 
                selectedArtist={artistName}
                currentPage={currentPage}
                totalPages={Math.ceil(concerts.length / concertsPerPage)}
                onPageChange={setCurrentPage}
                showPagination={concerts.length > concertsPerPage}
                allConcerts={concerts}
                totalConcerts={concerts.length}
                concertsPerPage={concertsPerPage}
                ticketmasterIdNotFound={ticketmasterIdNotFound}
              />
            </>
          )}
        </>
      )}
    </main>
  );
} 