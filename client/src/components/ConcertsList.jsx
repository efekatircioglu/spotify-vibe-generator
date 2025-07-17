import React from 'react';

export default function ConcertsList({ concerts = [] }) {
  // Helper to format date
  function getDateParts(dateStr) {
    if (!dateStr) return { month: '', day: '', weekday: '' };
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const weekday = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    return { month, day, weekday };
  }

  return (
    <div style={{ padding: '0 0 32px 0', width: '100%' }}>
      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '2.4rem', margin: '0 0 32px 50px', letterSpacing: 1 }}>Upcoming Concerts</h2>
      <div style={{ background: '#181818', borderRadius: 18, padding: '32px 0', margin: '0 16px', boxShadow: '0 2px 24px #0002' }}>
        {concerts.length === 0 && (
          <div style={{ color: '#b3b3b3', fontSize: 18, textAlign: 'center', padding: 32 }}>No upcoming concerts found for this artist.</div>
        )}
        {concerts.map((event, idx) => {
          // Try to get date parts from event.dates?.start?.localDate
          const { month, day, weekday } = getDateParts(event.dates?.start?.localDate);
          const eventName = event.name || '';
          const venue = event._embedded?.venues?.[0]?.name || '';
          const city = event._embedded?.venues?.[0]?.city?.name || '';
          const country = event._embedded?.venues?.[0]?.country?.name || '';
          const url = event.url;
          return (
            <div key={event.id || idx} style={{ display: 'flex', alignItems: 'center', padding: '28px 0', borderBottom: idx !== concerts.length - 1 ? '1px solid #232323' : 'none', margin: '0 48px' }}>
              {/* Date block */}
              <div style={{ minWidth: 70, textAlign: 'center', marginRight: 32 }}>
                <div style={{ color: '#1db954', fontWeight: 700, fontSize: 18, letterSpacing: 1, marginBottom: 2 }}>{month}</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 38, lineHeight: 1 }}>{day}</div>
                <div style={{ color: '#1db954', fontWeight: 700, fontSize: 15, letterSpacing: 1, marginTop: 2 }}>{weekday}</div>
              </div>
              {/* Event info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 2, letterSpacing: 0.2 }}>{eventName}</div>
                <div style={{ color: '#b3b3b3', fontWeight: 500, fontSize: 18, marginBottom: 0 }}>{venue}{venue && city ? ' - ' : ''}{city}{country ? `, ${country}` : ''}</div>
              </div>
              {/* Tickets button */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: 32,
                  padding: '12px 32px',
                  fontWeight: 800,
                  fontSize: 22,
                  textDecoration: 'none',
                  marginLeft: 32,
                  transition: 'background 0.18s, color 0.18s',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#181818';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                Tickets
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
} 