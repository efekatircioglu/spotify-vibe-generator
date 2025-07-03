"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function ArtistConcertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artistName = searchParams.get('name') || '';
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    setError('');
    setConcerts([]);
    // 1. Search for artist
    fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(artistName)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to search artist');
        return res.json();
      })
      .then(data1 => {
        const attractions = data1._embedded?.attractions || [];
        if (attractions.length === 0) throw new Error('No artist found');
        const artistId = attractions[0].id;
        // 2. Get events
        return fetch(`http://127.0.0.1:8000/concerts/events?artistId=${artistId}`);
      })
      .then(res2 => {
        if (!res2.ok) throw new Error('Failed to get events');
        return res2.json();
      })
      .then(data2 => {
        let events = data2._embedded?.events || [];
        // Sort by date, then by time if dates are the same
        events = events.slice().sort((a, b) => {
          const dateA = a.dates?.start?.localDate || '';
          const dateB = b.dates?.start?.localDate || '';
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          // If dates are the same, compare time
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
  }, [artistName]);

  return (
    <main style={{ padding: 32 }}>
      <button
        onClick={() => router.push('/')}
        className={styles.vibeButton}
        style={{ marginBottom: 24 }}
      >
        Profile
      </button>
      <h1 style={{ marginBottom: 24 }}>Concerts for <span style={{ color: '#1db954' }}>{artistName}</span></h1>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
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
      {!loading && !error && concerts.length === 0 && (
        <div>No upcoming concerts found for this artist.</div>
      )}
    </main>
  );
} 