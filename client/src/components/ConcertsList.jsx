import React, { useRef } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import CustomCalendar from '../components/CustomCalendar';

export default function ConcertsList({ 
  concerts = [], 
  selectedArtist = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange = null,
  showPagination = false
}) {
  const eventRefs = useRef({});

  // Helper to format date
  function getDateParts(dateStr) {
    if (!dateStr) return { month: '', day: '', weekday: '' };
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const weekday = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    return { month, day, weekday };
  }

  const concertDates = concerts
    .map(event => event.dates?.start?.localDate)
    .filter(Boolean);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      if (concertDates.includes(dateStr)) {
        return 'concert-date';
      }
    }
    return null;
  };

  const handleEventDayClick = (dateStr) => {
    const ref = eventRefs.current[dateStr];
    if (ref && ref.scrollIntoView) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optionally, add a highlight effect
      ref.classList.add('highlight-event');
      setTimeout(() => ref.classList.remove('highlight-event'), 1500);
    }
  };

  return (
    <div style={{ padding: '0 0 32px 0', width: '100%' }}>
      <h2 style={{ 
        color: '#fff', 
        fontWeight: 800, 
        fontSize: '2.4rem', 
        margin: '0 0 32px 50px', 
        letterSpacing: 1 
      }}>
        Upcoming Concerts
      </h2>
      <div style={{ background: '#181818', borderRadius: 18, padding: '32px 0', margin: '0 16px', boxShadow: '0 2px 24px #0002' }}>
        {concerts.length === 0 && (
          <div style={{ color: '#b3b3b3', fontSize: 18, textAlign: 'center', padding: 32 }}>
            {selectedArtist ? 'No upcoming concerts found for this artist.' : 'No upcoming concerts found.'}
          </div>
        )}
        {concerts.map((event, idx) => {
            // Try to get date parts from event.dates?.start?.localDate
            const { month, day, weekday } = getDateParts(event.dates?.start?.localDate);
            // Format weekday: capitalize first letter, rest lowercase
            const formattedWeekday = weekday.charAt(0) + weekday.slice(1).toLowerCase();
            const eventName = event.name || '';
            const venue = event._embedded?.venues?.[0]?.name || '';
            const city = event._embedded?.venues?.[0]?.city?.name || '';
            const country = event._embedded?.venues?.[0]?.country?.name || '';
            const url = event.url;
            const dateStr = event.dates?.start?.localDate;
            return (
              <div
                key={event.id || idx}
                ref={el => { if (dateStr) eventRefs.current[dateStr] = el; }}
                style={{ display: 'flex', alignItems: 'center', padding: '28px 0', borderBottom: idx !== concerts.length - 1 ? '1px solid #232323' : 'none', margin: '0 48px' }}
                className="concert-event-row"
              >
                {/* Date block */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', minWidth: 90, marginRight: 32 }}>
                  <div style={{ fontSize: 38, color: '#fff', fontWeight: 900, lineHeight: 1, minWidth: 44, textAlign: 'center' }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 8 }}>
                    <div style={{ color: '#1db954', fontWeight: 900, fontSize: 16, letterSpacing: 1, marginBottom: 2 }}>{month}</div>
                    <div style={{ color: '#1db954', fontWeight: 700, fontSize: 15, letterSpacing: 1, marginTop: 2 }}>{formattedWeekday}</div>
                  </div>
                </div>
                {/* Event info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 500, fontSize: 22, marginBottom: 2, letterSpacing: 0.2 }}>{eventName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b3b3b3', fontWeight: 500, fontSize: 18, marginBottom: 0 }}>
                    {/* Location SVG icon */}
                    <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22" style={{ color: '#b3b3b3', marginRight: 4, flexShrink: 0 }}>
                      <path d="M10 20S3 10.87 3 7a7 7 0 1114 0c0 3.87-7 13-7 13zm0-11a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    {venue}{venue && city ? ', ' : ''}
                    <span style={{ color: '#b3b3b3', fontWeight: 500 }}>{city}</span>
                    {country ? <span style={{ color: '#b3b3b3', fontWeight: 500 }}>, {country}</span> : ''}
                  </div>
                  {/* Artist name(s) below location */}
                  {event._embedded?.attractions && (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#b3b3b3', fontWeight: 400, fontSize: 17, marginTop: 2, gap: 8 }}>
                      {/* Artist SVG icon */}
                      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style={{ color: '#b3b3b3', marginRight: 4, flexShrink: 0 }}>
                        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"/>
                        <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8.5A.5.5 0 015.5 8.5zM9 4a1 1 0 102 0V3a1 1 0 10-2 0v1z"/>
                        <path d="M13.5 8.5a.5.5 0 00-.5-.5v-1a5 5 0 00-5 5 .5.5 0 001 0 4 4 0 014-4v1a.5.5 0 00.5.5z"/>
                      </svg>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {event._embedded.attractions.map((attraction, index) => {
                          const isSelectedArtist = selectedArtist && 
                            selectedArtist.split(', ').some(artistName => {
                              const matches = attraction.name.toLowerCase().includes(artistName.toLowerCase()) ||
                                artistName.toLowerCase().includes(attraction.name.toLowerCase());
                              if (matches) {
                                console.log(`Highlighting: "${attraction.name}" matches "${artistName}"`);
                              }
                              return matches;
                            });
                          
                          return (
                            <span
                              key={attraction.id || index}
                              style={{
                                color: isSelectedArtist ? '#fbbf24' : '#b3b3b3',
                                fontWeight: isSelectedArtist ? 700 : 400,
                              }}
                            >
                              {attraction.name}
                              {index < event._embedded.attractions.length - 1 && (
                                <span style={{ color: '#b3b3b3', fontWeight: 400 }}>, </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
      
      {/* Pagination Controls at the bottom */}
      {showPagination && onPageChange && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 16, 
          marginTop: 32,
          padding: '20px 0'
        }}>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '10px 20px',
              background: currentPage === 1 ? '#333' : '#1db954',
              color: currentPage === 1 ? '#666' : '#000',
              border: 'none',
              borderRadius: 8,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Previous
          </button>
          
          <div style={{ 
            color: '#fff', 
            fontSize: '0.9rem',
            fontWeight: 600,
            minWidth: '120px',
            textAlign: 'center'
          }}>
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 20px',
              background: currentPage === totalPages ? '#333' : '#1db954',
              color: currentPage === totalPages ? '#666' : '#000',
              border: 'none',
              borderRadius: 8,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Tour Calendar below the concerts list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '48px 0 0 0' }}>
        <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', margin: '0 0 32px 0', letterSpacing: 1, textAlign: 'left' }}>Tour Calendar</h2>
        </div>
        <div style={{ width: '100%', maxWidth: '1600px', background: '#181818', borderRadius: 18, boxShadow: '0 2px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', padding: 0 }}>
          <CustomCalendar
            eventDates={concerts.map(event => event.dates?.start?.localDate).filter(Boolean)}
            onEventDayClick={handleEventDayClick}
          />
        </div>
      </div>
      <style jsx global>{`
        .concert-date {
          background: #1db954 !important;
          color: #fff !important;
          border-radius: 50%;
        }
        .react-calendar {
          background: transparent !important;
          border: none !important;
          color: #fff !important;
          width: 100% !important;
          max-width: 1000px;
          margin: 0 auto;
          font-size: 1.6rem !important;
        }
        .react-calendar__tile {
          font-size: 1.45rem !important;
          color: #fff;
          border-radius: 50%;
          transition: background 0.18s, color 0.18s;
          min-width: 64px;
          min-height: 64px;
        }
        .react-calendar__tile--active {
          background: #1db954 !important;
          color: #fff !important;
        }
        .react-calendar__navigation button {
          color: #fff !important;
          background: none !important;
          font-size: 2rem !important;
        }
        .react-calendar__navigation__label {
          color: #fff !important;
          font-weight: 800;
          font-size: 2rem !important;
        }
        .react-calendar__month-view__weekdays {
          color: #b3b3b3 !important;
          font-weight: 700;
          font-size: 1.25rem !important;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: 1.1em 0 !important;
        }
        .highlight-event {
          box-shadow: 0 0 0 4px #1db954, 0 2px 24px #1db95455;
          transition: box-shadow 0.3s;
        }
      `}</style>
    </div>
  );
} 