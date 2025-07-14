"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';
import AlbumSelector from '../../components/AlbumSelector';
import TrackTable from '../../components/TrackTable';
import ArtistSearch from '../../components/ArtistSearch';

export default function ArtistConcertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artistName = searchParams.get('name') || '';
  const artistId = searchParams.get('id') || '';
  
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

  // Handle artist selection from search
  const handleArtistSelect = (artist) => {
    setSelectedArtist(artist);
    // Update URL with artist info
    router.push(`/artist?name=${encodeURIComponent(artist.name)}&id=${artist.id}`);
  };

  // Fetch albums when artist is selected
  useEffect(() => {
    if (!selectedArtist?.id) return;
    setLoadingAlbums(true);
    setAlbumError('');
    setAlbums([]);
    setSelectedAlbumId(null);
    
    fetch(`http://127.0.0.1:8000/artist-albums/${selectedArtist.id}`)
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
  }, [selectedArtist]);

  // Fetch tracks for selected album
  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumTracks([]);
      return;
    }
    setLoadingTracks(true);
    setTracksError('');
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
    if (artistName && artistId) {
      setSelectedArtist({
        id: artistId,
        name: artistName,
      });
    }
  }, [artistName, artistId]);

  // Fetch concerts (existing logic, but after albums)
  useEffect(() => {
    if (!selectedArtist?.name) return;
    setLoading(true);
    setError('');
    setConcerts([]);
    fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(selectedArtist.name)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to search artist');
        return res.json();
      })
      .then(data1 => {
        const attractions = data1._embedded?.attractions || [];
        if (attractions.length === 0) throw new Error('No artist found');
        const ticketmasterArtistId = attractions[0].id;
        return fetch(`http://127.0.0.1:8000/concerts/events?artistId=${ticketmasterArtistId}`);
      })
      .then(res2 => {
        if (!res2.ok) throw new Error('Failed to get events');
        return res2.json();
      })
      .then(data2 => {
        let events = data2._embedded?.events || [];
        events = events.slice().sort((a, b) => {
          const dateA = a.dates?.start?.localDate || '';
          const dateB = b.dates?.start?.localDate || '';
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          const timeA = a.dates?.start?.localTime || '';
          const timeB = b.dates?.start?.localTime || '';
          if (!timeA && !timeB) return 0;
          if (!timeA) return 1;
          if (!timeB) return -1;
          return timeA.localeCompare(timeB);
        });
        setConcerts(events);
      })
      .catch(err => {
        setError(err.message || 'Concert search failed');
      })
      .finally(() => setLoading(false));
  }, [selectedArtist]);

  return (
    <main style={{ padding: 32 }}>
      <button
        onClick={() => router.push('/')}
        className={styles.vibeButton}
        style={{ marginBottom: 24 }}
      >
        Profile
      </button>
      
      {/* Artist Search */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 16 }}>Artist Search</h1>
        <ArtistSearch
          onArtistSelect={handleArtistSelect}
          placeholder="Search for an artist (e.g., Travis Scott)..."
        />
      </div>

      {/* Artist Info and Albums */}
      {selectedArtist && (
        <>
          <h1 style={{ marginBottom: 24 }}>
            Artist: <span style={{ color: '#1db954' }}>{selectedArtist.name}</span>
          </h1>
          
          {/* Album Selector */}
          <div style={{ marginBottom: 32 }}>
            <AlbumSelector
              albums={albums}
              selectedAlbumId={selectedAlbumId}
              onAlbumSelect={album => setSelectedAlbumId(album.id)}
            />
            {loadingAlbums && <div>Loading albums...</div>}
            {albumError && <div style={{ color: 'red' }}>{albumError}</div>}
          </div>

          {/* Track Table for selected album */}
          {selectedAlbumId && albumTracks.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <TrackTable
                tracks={albumTracks}
                title={albums.find(a => a.id === selectedAlbumId)?.name || 'Album Tracks'}
                playlistKey={selectedAlbumId}
                loading={loadingTracks}
                error={tracksError}
              />
            </div>
          )}

          {/* Concerts Table */}
          <h2 style={{ marginBottom: 24 }}>Upcoming Concerts</h2>
          {loading && <div>Loading concerts...</div>}
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {window.innerWidth <= 700 && (
            <button
              type="button"
              className={styles.zoomButton}
              onClick={() => setTableZoomedOut(z => !z)}
              style={{ marginBottom: 12 }}
            >
              {tableZoomedOut ? "Normal View" : "Zoom Out"}
            </button>
          )}
          <div
            ref={tableRef}
            className={`${styles.songsTableWrapper} ${tableZoomedOut ? styles.zoomedOutTable : ""}`}
            style={{ position: 'relative' }}
          >
            {concerts.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#222', color: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #0004' }}>
                <thead>
                  <tr style={{ background: '#1db954', color: '#fff' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Event</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Time</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Venue</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>City</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Country</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {concerts.map(event => (
                    <tr key={event.id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '8px' }}>{event.name}</td>
                      <td style={{ padding: '8px' }}>{formatDate(event.dates?.start?.localDate)}</td>
                      <td style={{ padding: '8px' }}>{event.dates?.start?.localTime || '-'}</td>
                      <td style={{ padding: '8px' }}>{event._embedded?.venues?.[0]?.name || '-'}</td>
                      <td style={{ padding: '8px' }}>{event._embedded?.venues?.[0]?.city?.name || '-'}</td>
                      <td style={{ padding: '8px' }}>{event._embedded?.venues?.[0]?.country?.name || '-'}</td>
                      <td style={{ padding: '8px' }}><a href={event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1db954', textDecoration: 'underline' }}>View</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && !error && concerts.length === 0 && (
            <div>No upcoming concerts found for this artist.</div>
          )}
        </>
      )}
    </main>
  );
} 