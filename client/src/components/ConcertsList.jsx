import React, { useRef, useState, useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import CustomCalendar from '../components/CustomCalendar';
import styles from '../app/page.module.css';

export default function ConcertsList({ 
  concerts = [], 
  selectedArtist = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange = null,
  showPagination = false,
  allConcerts = [], // New prop for all concerts (for calendar)
  totalConcerts = 0, // New prop for total concert count
  concertsPerPage = 20, // New prop for concerts per page
  ticketmasterIdNotFound = false // New prop for when Ticketmaster ID is not found
}) {
  const eventRefs = useRef({});
  const [animationKey, setAnimationKey] = useState(0);
  const concertsListRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Set initial value
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // When concerts change, increment animation key to trigger animation
  useEffect(() => {
    setAnimationKey(k => k + 1);
  }, [concerts, currentPage]);
  
  // Scroll to top of concerts list when page changes
  const scrollToConcertsTop = () => {
    if (concertsListRef.current) {
      concertsListRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };
  
  // Handle page change with scroll
  const handlePageChange = (newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
      // Scroll to top after page change
      setTimeout(() => {
        scrollToConcertsTop();
      }, 100);
    }
  };

  // Helper to format date
  function getDateParts(dateStr) {
    if (!dateStr) return { month: '', day: '', weekday: '' };
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const weekday = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    return { month, day, weekday };
  }

  const concertDates = allConcerts.length > 0 ? allConcerts
    .map(event => event.dates?.start?.localDate)
    .filter(Boolean) : concerts
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
    // Find all events on this date from allConcerts
    const eventsOnDate = allConcerts.length > 0 ? 
      allConcerts.filter(event => event.dates?.start?.localDate === dateStr) :
      concerts.filter(event => event.dates?.start?.localDate === dateStr);
    
    if (eventsOnDate.length === 0) return;
    
    // Get the first event on this date
    const targetEvent = eventsOnDate[0];
    
    // Find which page this event is on
    const eventIndex = allConcerts.length > 0 ? 
      allConcerts.findIndex(event => event.id === targetEvent.id) :
      concerts.findIndex(event => event.id === targetEvent.id);
    
    if (eventIndex === -1) return;
    
    // Calculate which page this event is on (assuming 20 concerts per page)
    const concertsPerPage = 20;
    const targetPage = Math.floor(eventIndex / concertsPerPage) + 1;
    
    // If the event is on a different page, change to that page
    if (onPageChange && targetPage !== currentPage) {
      onPageChange(targetPage);
      
      // Wait for the page to change and then scroll to the event
      setTimeout(() => {
        const ref = eventRefs.current[dateStr];
        if (ref && ref.scrollIntoView) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          ref.classList.add('highlight-event');
          setTimeout(() => ref.classList.remove('highlight-event'), 1500);
        }
      }, 100); // Small delay to ensure page change completes
    } else {
      // Event is on current page, scroll directly
      const ref = eventRefs.current[dateStr];
      if (ref && ref.scrollIntoView) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.classList.add('highlight-event');
        setTimeout(() => ref.classList.remove('highlight-event'), 1500);
      }
    }
  };

  return (
    <div style={{ padding: '0 0 32px 0', width: '100%' }}>
      <h2 style={{ 
        color: '#fff', 
        fontWeight: 800, 
        fontSize: isMobile ? '1.8rem' : '2.4rem', 
        margin: isMobile ? '0 0 24px 20px' : '0 0 32px 50px', 
        letterSpacing: 1,
        textAlign: 'center',
        
      }}>
        Upcoming Concerts
      </h2>
      
      <div 
        ref={concertsListRef}
        style={{ 
          background: '#181818', 
          borderRadius: isMobile ? 0 : 18, 
          padding: isMobile ? '16px 0' : 'clamp(16px, 3vw, 32px) 0', 
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: '0 2px 24px #0002',
          maxWidth: '1200px',
          width: isMobile ? '100%' : 'calc(100% - 32px)'
        }}
      >
        {/* Concert Count Header - Inside the table container */}
        {totalConcerts > 0 && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? 16 : 24,
            padding: isMobile ? '0 16px' : '0 32px'
          }}>
            <div style={{ 
              color: '#fff', 
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: 600,
              marginBottom: isMobile ? 6 : 8
            }}>
              {totalConcerts} Upcoming Concert{totalConcerts !== 1 ? 's' : ''}
            </div>
            <div style={{ 
              color: '#b3b3b3', 
              fontSize: isMobile ? '0.85rem' : '1rem'
            }}>
              {totalConcerts > concertsPerPage ? 
                `Showing ${((currentPage - 1) * concertsPerPage) + 1}-${Math.min(currentPage * concertsPerPage, totalConcerts)} of ${totalConcerts} concerts` :
                `All ${totalConcerts} concerts shown`
              }
            </div>
          </div>
        )}
        {concerts.length === 0 && (
          <div style={{ 
            color: '#b3b3b3', 
            fontSize: isMobile ? 16 : 18, 
            textAlign: 'center', 
            padding: isMobile ? 24 : 32 
          }}>
            {ticketmasterIdNotFound ? 
              'Ticketmaster ID is not found for this artist.' : 
              (selectedArtist ? 'No upcoming concerts found for this artist.' : 'No upcoming concerts found.')
            }
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
                key={`${event.id || idx}-${animationKey}`}
                ref={el => { if (dateStr) eventRefs.current[dateStr] = el; }}
                className={`concert-event-row ${styles.animatedRow}`}
                style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'center' : 'flex-start', 
                  padding: isMobile ? '20px 16px' : 'clamp(16px, 4vw, 28px) 0', 
                  borderBottom: idx !== concerts.length - 1 ? '1px solid #232323' : 'none', 
                  margin: isMobile ? '0 0 16px 0' : '0 clamp(16px, 4vw, 48px)',
                  flexWrap: 'wrap',
                  gap: isMobile ? '16px' : 'clamp(8px, 2vw, 16px)',
                  animationDelay: `${idx * 60}ms`,
                  animationName: 'fadeInUp',
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                  opacity: 0,
                  animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  background: isMobile ? '#1a1a1a' : 'transparent',
                  borderRadius: isMobile ? '0' : '0',
                  boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                
                {/* Visual separator for mobile */}
                {isMobile && (
                  <div style={{
                    width: '80%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #333, transparent)',
                    margin: '8px 0',
                    order: 1.5
                  }} />
                )}
                
                {/* Date and Tickets Column (Left) */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minWidth: isMobile ? '100%' : 'clamp(80px, 10vw, 120px)', 
                  marginRight: isMobile ? '0' : 'clamp(16px, 3vw, 32px)',
                  flexShrink: 0,
                  gap: isMobile ? '12px' : 'clamp(8px, 2vw, 16px)',
                  alignSelf: 'center',
                  order: isMobile ? 2 : 'unset',
                  padding: isMobile ? '12px 0' : '0',
                  background: isMobile ? 'transparent' : 'transparent',
                  borderRadius: isMobile ? '0' : '0',
                  border: isMobile ? 'none' : 'none'
                }}>
                  {/* Date block */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: isMobile ? '4px' : 'clamp(4px, 1vw, 8px)'
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? '20px' : 'clamp(24px, 5vw, 38px)', 
                      color: '#fff', 
                      fontWeight: 900, 
                      lineHeight: 1, 
                      textAlign: 'center' 
                    }}>{day}</div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      gap: '2px'
                    }}>
                                             <div style={{ 
                         color: '#1db954', 
                         fontWeight: 900, 
                         fontSize: isMobile ? '14px' : 'clamp(14px, 2.5vw, 18px)', 
                         letterSpacing: 1, 
                         lineHeight: 1
                       }}>{month}</div>
                       <div style={{ 
                         color: '#1db954', 
                         fontWeight: 700, 
                         fontSize: isMobile ? '12px' : 'clamp(12px, 2.2vw, 16px)', 
                         letterSpacing: 1, 
                         lineHeight: 1
                       }}>{formattedWeekday}</div>
                    </div>
                  </div>
                  
                  {/* Tickets button - positioned under date on small screens */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: isMobile ? '#1db954' : 'transparent',
                      color: isMobile ? '#000' : '#fff',
                      border: isMobile ? 'none' : '2px solid #fff',
                      borderRadius: isMobile ? '8px' : 'clamp(16px, 3vw, 24px)',
                      padding: isMobile ? '12px 20px' : 'clamp(6px, 1.5vw, 10px) clamp(12px, 2.5vw, 20px)',
                      fontWeight: 800,
                      fontSize: isMobile ? '14px' : 'clamp(11px, 2vw, 16px)',
                      textDecoration: 'none',
                      transition: 'background 0.18s, color 0.18s',
                      cursor: 'pointer',
                      boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      outline: 'none',
                      display: 'inline-block',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      width: isMobile ? '100%' : 'fit-content',
                      minWidth: isMobile ? '100%' : 'auto'
                    }}
                    onMouseOver={e => {
                      if (isMobile) {
                        e.currentTarget.style.background = '#1ed760';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      } else {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#181818';
                      }
                    }}
                    onMouseOut={e => {
                      if (isMobile) {
                        e.currentTarget.style.background = '#1db954';
                        e.currentTarget.style.transform = 'translateY(0)';
                      } else {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                  >
                    Tickets
                  </a>
                </div>
                {/* Event info */}
                <div style={{ 
                  flex: 1, 
                  minWidth: 0,
                  textAlign: isMobile ? 'center' : 'left',
                  order: isMobile ? 1 : 'unset',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <div style={{ 
                    color: '#fff', 
                    fontWeight: 600, 
                    fontSize: isMobile ? '16px' : 'clamp(16px, 3vw, 22px)', 
                    marginBottom: isMobile ? 12 : 8, 
                    letterSpacing: 0.2,
                    lineHeight: 1.3,
                    padding: isMobile ? '0 8px' : '0'
                  }}>{eventName}</div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    gap: isMobile ? '6px' : 'clamp(4px, 1vw, 8px)', 
                    color: '#b3b3b3', 
                    fontWeight: 500, 
                    fontSize: isMobile ? '14px' : 'clamp(14px, 2.5vw, 18px)', 
                    marginBottom: isMobile ? 8 : 8,
                    flexWrap: 'wrap',
                    padding: isMobile ? '0 8px' : '0'
                  }}>
                    {/* Location SVG icon */}
                    <svg viewBox="0 0 20 20" fill="currentColor" width={isMobile ? "16px" : "clamp(16px, 3vw, 22px)"} height={isMobile ? "16px" : "clamp(16px, 3vw, 22px)"} style={{ color: '#b3b3b3', flexShrink: 0 }}>
                      <path d="M10 20S3 10.87 3 7a7 7 0 1114 0c0 3.87-7 13-7 13zm0-11a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    <span style={{ color: '#b3b3b3', fontWeight: 500 }}>
                      {venue}{venue && city ? ', ' : ''}
                      <span style={{ color: '#b3b3b3', fontWeight: 500 }}>{city}</span>
                      {country ? <span style={{ color: '#b3b3b3', fontWeight: 500 }}>, {country}</span> : ''}
                    </span>
                  </div>
                  {/* Artist name(s) below location */}
                  {event._embedded?.attractions && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: isMobile ? 'center' : 'flex-start',
                      color: '#b3b3b3', 
                      fontWeight: 400, 
                      fontSize: isMobile ? '13px' : 'clamp(13px, 2.2vw, 17px)', 
                      marginTop: 0, 
                      gap: isMobile ? '6px' : 'clamp(4px, 1vw, 8px)',
                      flexWrap: 'wrap',
                      padding: isMobile ? '0 8px' : '0'
                    }}>
                      {/* Artist SVG icon */}
                      <svg viewBox="0 0 20 20" fill="currentColor" width={isMobile ? "14px" : "clamp(14px, 2.5vw, 20px)"} height={isMobile ? "14px" : "clamp(14px, 2.5vw, 20px)"} style={{ color: '#b3b3b3', flexShrink: 0 }}>
                        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"/>
                        <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8.5A.5.5 0 015.5 8.5zM9 4a1 1 0 102 0V3a1 1 0 10-2 0v1z"/>
                        <path d="M13.5 8.5a.5.5 0 00-.5-.5v-1a5 5 0 00-5 5 .5.5 0 001 0 4 4 0 014-4v1a.5.5 0 00.5.5z"/>
                      </svg>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                        {event._embedded.attractions.map((attraction, index) => {
                          const isSelectedArtist = selectedArtist && 
                            selectedArtist.split(', ').some(artistName => {
                              const matches = attraction.name.toLowerCase().includes(artistName.toLowerCase()) ||
                                artistName.toLowerCase().includes(attraction.name.toLowerCase());
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
              </div>
            );
          })}
      </div>
      
      {/* Pagination Controls at the bottom */}
      {showPagination && onPageChange && (
        <>
          {/* Page indicator - shown above buttons on mobile */}
          {isMobile && (
            <div style={{ 
              color: '#fff', 
              fontSize: '0.9rem',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 8,
              padding: '8px 0'
            }}>
              Page {currentPage} of {totalPages}
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: isMobile ? 8 : 16, 
            marginTop: isMobile ? 16 : 32,
            padding: isMobile ? '16px 0' : '20px 0'
          }}>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                background: currentPage === 1 ? '#333' : '#1db954',
                color: currentPage === 1 ? '#666' : '#000',
                border: 'none',
                borderRadius: isMobile ? 6 : 8,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {/* Left Arrow SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20V11Z"/>
              </svg>
              Previous
            </button>
            
            {/* Page indicator - shown between buttons on desktop */}
            {!isMobile && (
              <div style={{ 
                color: '#fff', 
                fontSize: '0.9rem',
                fontWeight: 600,
                minWidth: '120px',
                textAlign: 'center'
              }}>
                Page {currentPage} of {totalPages}
              </div>
            )}
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                background: currentPage === totalPages ? '#333' : '#1db954',
                color: currentPage === totalPages ? '#666' : '#000',
                border: 'none',
                borderRadius: isMobile ? 6 : 8,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Next
              {/* Right Arrow SVG (180 degree rotation) */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ transform: 'rotate(180deg)' }}>
                <path d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20V11Z"/>
              </svg>
            </button>
          </div>
        </>
      )}
      
      {/* Tour Calendar below the concerts list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: isMobile ? '32px 0 0 0' : '48px 0 0 0' }}>
        <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
          <h2 style={{ 
            color: '#fff', 
            fontWeight: 800, 
            fontSize: isMobile ? '1.5rem' : 'clamp(1.5rem, 3vw, 2.4rem)', 
            margin: isMobile ? '0 0 24px 0' : '0 0 32px 0', 
            letterSpacing: 1, 
            textAlign: 'center' 
          }}>Tour Calendar</h2>
        </div>
        <div style={{ 
          width: '100%', 
          maxWidth: '1600px', 
          background: '#181818', 
          borderRadius: isMobile ? 12 : 18, 
          boxShadow: '0 2px 24px #0002', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          margin: '0 auto', 
          padding: 0 
        }}>
          <CustomCalendar
            eventDates={allConcerts.length > 0 ? allConcerts.map(event => event.dates?.start?.localDate).filter(Boolean) : concerts.map(event => event.dates?.start?.localDate).filter(Boolean)}
            onEventDayClick={handleEventDayClick}
          />
        </div>
      </div>
      <style jsx global>{`
        .concert-date {
          /* Remove green background dot, keep only green underline */
          background: transparent !important;
          color: #fff !important;
          border-radius: 0 !important;
        }
        .react-calendar {
          background: transparent !important;
          border: none !important;
          color: #fff !important;
          width: 100% !important;
          max-width: 1000px;
          margin: 0 auto;
          font-size: clamp(1.2rem, 3vw, 1.6rem) !important;
        }
        .react-calendar__tile {
          font-size: clamp(1rem, 2.5vw, 1.45rem) !important;
          color: #fff;
          border-radius: 50%;
          transition: background 0.18s, color 0.18s;
          min-width: clamp(40px, 8vw, 64px);
          min-height: clamp(40px, 8vw, 64px);
          position: relative;
        }
        .react-calendar__tile--active {
          background: #1db954 !important;
          color: #fff !important;
        }
        .react-calendar__navigation button {
          color: #fff !important;
          background: none !important;
          font-size: clamp(1.5rem, 4vw, 2rem) !important;
        }
        .react-calendar__navigation__label {
          color: #fff !important;
          font-weight: 800;
          font-size: clamp(1.5rem, 4vw, 2rem) !important;
        }
        .react-calendar__month-view__weekdays {
          color: #b3b3b3 !important;
          font-weight: 700;
          font-size: clamp(1rem, 2.5vw, 1.25rem) !important;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: clamp(0.8em, 2vw, 1.1em) 0 !important;
        }
        .highlight-event {
          box-shadow: 0 0 0 4px #1db954, 0 2px 24px #1db95455;
          transition: box-shadow 0.3s;
        }
        
        /* Green text for concert dates */
        .concert-date {
          color: #1db954 !important;
          font-weight: 700 !important;
        }
        
        /* Animation styles for concert rows */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .${styles.animatedRow} {
          opacity: 0;
        }
        .${styles.animatedRow}[style*='animation-name'] {
          opacity: 1;
        }
      `}</style>
    </div>
  );
} 