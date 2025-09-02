import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useState as useStateReact, useEffect as useEffectReact } from 'react';

// --- Responsive styling helper ---
const getResponsiveStyles = (isMobile) => {
  if (isMobile) {
    return {
      // Modal container
      modalContainer: {
        background: '#212121',
        borderRadius: 16,
        // padding: '60px 24px 24px 24px',
        minWidth: 'auto',
        minHeight: 'auto',
        boxShadow: '0 12px 64px #000b',
        color: '#fff',
        position: 'relative',
        maxWidth: '100vw',
        width: '100vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxSizing: 'border-box'
      },
      // Close button
      closeButton: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(24, 28, 36, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        color: '#fff',
        fontSize: 20,
        cursor: 'pointer',
        zIndex: 10000,
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
        transition: 'background-color 0.2s'
      },
      // Main title
      mainTitle: {
        fontSize: '2rem',
        fontWeight: 900,
        marginBottom: 20,
        letterSpacing: 1
      },
      // Stats text
      statsText: {
        fontSize: '1.1rem',
        color: '#38bdf8',
        fontWeight: 800,
        marginBottom: 8,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
      },
      // Stats value
      statsValue: {
        fontSize: '1rem',
        color: '#fff',
        fontWeight: 700,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
      },
      // Stats year
      statsYear: {
        fontSize: '0.9rem',
        color: '#d1d5db',
        fontWeight: 500
      },
      // Songs list container
      songsListContainer: {
        margin: '24px 0 0 0',
        textAlign: 'left',
        maxHeight: 280,
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '20px 0 20px 20px',
        boxShadow: '0 2px 16px #0003',
        transition: 'scrollTop 0.5s',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%',
        boxSizing: 'border-box'
      },
      // Songs list title
      songsListTitle: {
        fontWeight: 900,
        color: '#fff',
        marginBottom: 14,
        fontSize: '1.2rem',
        letterSpacing: 0.5
      },
      // Song list item
      songListItem: {
        color: '#d1d5db',
        fontSize: 14,
        marginBottom: 6,
        lineHeight: 1.25,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
      },
      // Call to action
      callToAction: {
        marginTop: 32,
        fontSize: 18,
        color: '#38bdf8',
        fontWeight: 900
      },
      // Page title
      pageTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        fontWeight: 900,
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 1
      },
      // Page container
      pageContainer: {
        padding: 24,
        background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)',
        borderRadius: 16,
        minHeight: 400,
        maxWidth: '100%',
        margin: '0 auto',
        boxShadow: '0 8px 48px #000b',
        boxSizing: 'border-box',
        overflow: 'hidden'
      },
      // Navigation buttons
      navButton: {
        background: 'none',
        border: '1px solid #444',
        color: '#fff',
        cursor: 'pointer',
        borderRadius: '50%',
        fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0
      },
      navButtonHover: {
        backgroundColor: '#2a2a2a'
      },
      navButtonPrimary: {
        background: '#38bdf8',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '8px 20px',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 4px 24px #000a',
        transition: 'background 0.18s'
      },
      // Metric bar chart
      metricBarChart: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20
      },
      metricLabel: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        width: 120
      },
      metricBar: {
        flex: 1,
        margin: '0 12px',
        background: '#2d3142',
        borderRadius: 12,
        height: 12,
        position: 'relative',
        overflow: 'hidden'
      },
      metricValue: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        width: 40,
        textAlign: 'right'
      },
      // Binary bar chart
      binaryBarChart: {
        marginBottom: 24
      },
      binaryBarLabel: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 16
      },
      binaryBarLabelSecondary: {
        color: '#b0b6be',
        fontWeight: 500,
        fontSize: 16
      },
      binaryBarContainer: {
        flex: 1,
        margin: '0 0px',
        background: '#1e293b',
        borderRadius: 12,
        height: 14,
        position: 'relative',
        overflow: 'hidden'
      },
      // Genre leaderboard
      genreLeaderboard: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      },
      genreSection: {
        marginBottom: 16
      },
      genreSectionTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 20,
        marginBottom: 6
      },
      genreTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12
      },
      genreTag: {
        background: '#232b39',
        color: '#38bdf8',
        fontWeight: 700,
        fontSize: 13,
        borderRadius: 6,
        padding: '3px 10px'
      },
      // Chords histogram
      chordsHistogram: {
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        justifyContent: 'center'
      },
      chordSection: {
        flex: 1
      },
      chordSectionTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center'
      },
      chordItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#232b39',
        color: '#38bdf8',
        fontWeight: 700,
        fontSize: 13,
        borderRadius: 6,
        padding: '3px 10px',
        marginBottom: 4
      },
      chordSummary: {
        marginTop: 14
      },
      chordSummaryTitle: {
        color: '#b0b6be',
        fontWeight: 600,
        fontSize: 13,
        marginBottom: 3
      },
      chordSummaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#181c24',
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 13
      },
      // Animated beats page
      beatsPageTitle: {
        fontSize: '2rem',
        fontWeight: 900,
        marginBottom: 14,
        letterSpacing: 1
      },
      beatsPageText: {
        fontSize: '1.5rem',
        color: '#e5e7eb',
        fontWeight: 700,
        marginBottom: 12,
        width: '100%'
      },
      beatsPageNumber: {
        fontSize: '3rem',
        fontWeight: 900,
        color: '#38bdf8',
        margin: '14px 0 0 0',
        textShadow: '0 2px 24px #38bdf8aa',
        width: '100%'
      },
      beatsPageSubtext: {
        fontSize: '1.3rem',
        color: '#b0b6be',
        fontWeight: 600,
        marginBottom: 12,
        width: '100%'
      },
      beatsPageFooter: {
        marginTop: 24,
        fontSize: 16,
        color: '#38bdf8',
        fontWeight: 700
      }
    };
  } else {
    // Desktop styles (original)
    return {
      modalContainer: {
        background: '#212121',
        borderRadius: 24,
        // padding: '80px 72px 72px 72px',
        minWidth: 800,
        minHeight: 700,
        boxShadow: '0 12px 64px #000b',
        color: '#fff',
        position: 'relative',
        // maxWidth: '95vw',
        // width: '95vw',
        // maxHeight: '90vh',
        // overflowY: 'auto'
      },
      closeButton: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'none',
        border: '1px solid #444',
        borderRadius: '50%',
        color: '#fff',
        cursor: 'pointer',
        zIndex: 10000,
        width: 'clamp(36px, 6vw, 48px)',
        height: 'clamp(36px, 6vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
        transition: 'background-color 0.2s'
      },
      mainTitle: {
        fontSize: '2.8rem',
        fontWeight: 900,
        marginBottom: 28,
        letterSpacing: 1
      },
      statsText: {
        fontSize: '1.4rem',
        color: '#38bdf8',
        fontWeight: 800,
        marginBottom: 10
      },
      statsValue: {
        fontSize: '1.4rem',
        color: '#fff',
        fontWeight: 700
      },
      statsYear: {
        fontSize: '1.4rem',
        color: '#d1d5db',
        fontWeight: 500
      },
      songsListContainer: {
        margin: '32px 0 0 0',
        textAlign: 'left',
        maxHeight: 340,
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '28px 0 28px 32px',
        boxShadow: '0 2px 16px #0003',
        transition: 'scrollTop 0.5s',
        width: '100%',
        boxSizing: 'border-box'
      },
      songsListTitle: {
        fontWeight: 900,
        color: '#fff',
        marginBottom: 18,
        fontSize: '1.5rem',
        letterSpacing: 0.5
      },
      songListItem: {
        color: '#d1d5db',
        fontSize: 18,
        marginBottom: 8,
        lineHeight: 1.25,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
      },
      callToAction: {
        marginTop: 48,
        fontSize: 22,
        color: '#38bdf8',
        fontWeight: 900
      },
      pageTitle: {
        color: '#fff',
        fontSize: '2.2rem',
        fontWeight: 900,
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: 1
      },
      pageContainer: {
        padding: 36,
        background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)',
        borderRadius: 24,
        minHeight: 500,
        maxWidth: '100%',
        margin: '0 auto',
        boxShadow: '0 8px 48px #000b',
        width: '100%',
        boxSizing: 'border-box'
      },
      navButton: {
        background: 'none',
        border: '1px solid #444',
        color: '#fff',
        cursor: 'pointer',
        borderRadius: '50%',
        fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0
      },
      navButtonHover: {
        backgroundColor: '#2a2a2a'
      },
      navButtonPrimary: {
        background: '#38bdf8',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '8px 20px',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 4px 24px #000a',
        transition: 'background 0.18s'
      },
      metricBarChart: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 28
      },
      metricLabel: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 20,
        width: 170
      },
      metricBar: {
        flex: 1,
        margin: '0 18px',
        background: '#2d3142',
        borderRadius: 16,
        height: 16,
        position: 'relative',
        overflow: 'hidden'
      },
      metricValue: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 20,
        width: 48,
        textAlign: 'right'
      },
      binaryBarChart: {
        marginBottom: 32
      },
      binaryBarLabel: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 18
      },
      binaryBarLabelSecondary: {
        color: '#b0b6be',
        fontWeight: 500,
        fontSize: 18
      },
      binaryBarContainer: {
        flex: 1,
        margin: '0 0px',
        background: '#1e293b',
        borderRadius: 16,
        height: 18,
        position: 'relative',
        overflow: 'hidden'
      },
      genreLeaderboard: {
        display: 'flex',
        flexDirection: 'column',
        gap: 28
      },
      genreSection: {
        marginBottom: 20
      },
      genreSectionTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 20,
        marginBottom: 6
      },
      genreTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12
      },
      genreTag: {
        background: '#232b39',
        color: '#38bdf8',
        fontWeight: 700,
        fontSize: 16,
        borderRadius: 8,
        padding: '4px 14px'
      },
      chordsHistogram: {
        display: 'flex',
        flexDirection: 'row',
        gap: 32,
        justifyContent: 'center'
      },
      chordSection: {
        flex: 1
      },
      chordSectionTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center'
      },
      chordItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#232b39',
        color: '#38bdf8',
        fontWeight: 700,
        fontSize: 16,
        borderRadius: 8,
        padding: '4px 14px',
        marginBottom: 6
      },
      chordSummary: {
        marginTop: 18
      },
      chordSummaryTitle: {
        color: '#b0b6be',
        fontWeight: 600,
        fontSize: 15,
        marginBottom: 4
      },
      chordSummaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#181c24',
        borderRadius: 6,
        padding: '2px 10px',
        fontSize: 15
      },
      beatsPageTitle: {
        fontSize: '2.5rem',
        fontWeight: 900,
        marginBottom: 18,
        letterSpacing: 1
      },
      beatsPageText: {
        fontSize: '2rem',
        color: '#e5e7eb',
        fontWeight: 700,
        marginBottom: 16,
        width: '100%'
      },
      beatsPageNumber: {
        fontSize: '4rem',
        fontWeight: 900,
        color: '#38bdf8',
        margin: '18px 0 0 0',
        textShadow: '0 2px 24px #38bdf8aa',
        width: '100%'
      },
      beatsPageSubtext: {
        fontSize: '1.6rem',
        color: '#b0b6be',
        fontWeight: 600,
        marginBottom: 16,
        width: '100%'
      },
      beatsPageFooter: {
        marginTop: 32,
        fontSize: 18,
        color: '#38bdf8',
        fontWeight: 700
      }
    };
  }
};

// --- Window size hook ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return windowSize;
};

// --- Animation styles ---
const fadeIn = {
  opacity: 1,
  transform: 'translateY(0)'
};
const fadeOut = {
  opacity: 0,
  transform: 'translateY(30px)'
};

const pulseKeyframes = `@keyframes pulseBeat { 0% { transform: scale(1); } 30% { transform: scale(1.08); } 50% { transform: scale(1); } 100% { transform: scale(1); } }`;
if (typeof window !== 'undefined' && !document.getElementById('pulse-beat-keyframes')) {
  const style = document.createElement('style');
  style.id = 'pulse-beat-keyframes';
  style.innerHTML = pulseKeyframes;
  document.head.appendChild(style);
}

// --- Animated bar keyframes ---
const fillBarKeyframes = `@keyframes fill-bar { from { width: 0; } to { width: var(--bar-width, 0); } }`;
if (typeof window !== 'undefined' && !document.getElementById('fill-bar-keyframes')) {
  const style = document.createElement('style');
  style.id = 'fill-bar-keyframes';
  style.innerHTML = fillBarKeyframes;
  document.head.appendChild(style);
}

// --- Animated binary bar keyframes ---
const fillBarLeftKeyframes = `@keyframes fill-bar-left { from { width: 0; } to { width: var(--bar-width, 0); } }`;
const fillBarRightKeyframes = `@keyframes fill-bar-right { from { width: 0; right: 0; left: auto; } to { width: var(--bar-width, 0); right: 0; left: auto; } }`;
if (typeof window !== 'undefined') {
  if (!document.getElementById('fill-bar-left-keyframes')) {
    const style = document.createElement('style');
    style.id = 'fill-bar-left-keyframes';
    style.innerHTML = fillBarLeftKeyframes;
    document.head.appendChild(style);
  }
  if (!document.getElementById('fill-bar-right-keyframes')) {
    const style = document.createElement('style');
    style.id = 'fill-bar-right-keyframes';
    style.innerHTML = fillBarRightKeyframes;
    document.head.appendChild(style);
  }
}

export default function WrappedResultsModal({ open, onClose, results, tracks }) {
  const [page, setPage] = useState(1); // Start directly on page 1 (Comprehensive Dashboard)
  const [isMobile, setIsMobile] = useState(false);
  const [prevButtonHover, setPrevButtonHover] = useState(false);
  const [nextButtonHover, setNextButtonHover] = useState(false);
  const [showArtistTracksModal, setShowArtistTracksModal] = useState(false);
  const { width } = useWindowSize();
  
  // Update mobile state when width changes
  useEffect(() => {
    setIsMobile(width < 1000);
  }, [width]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by setting body to fixed position and overflow hidden
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Also prevent scroll on html element for extra security
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);
  
  const styles = getResponsiveStyles(isMobile);

  // Aggregate data for all analyzed tracks
  const { analyzedTracks, skippedTracks, totalBeats, avgBeats } = useMemo(() => {
    const analyzed = results.filter(r => r.highLevel && r.lowLevel);
    const skipped = results.filter(r => !(r.highLevel && r.lowLevel));
    
    let totalBeats = 0;
    analyzed.forEach(r => {
      // The data is nested under the first key (usually "0")
      const firstKey = Object.keys(r.lowLevel || {})[0];
      const beats = r.lowLevel?.[firstKey]?.rhythm?.beats_count || r.lowLevel?.[firstKey]?.beats_count || 0;
      totalBeats += beats;
    });
    const avgBeats = analyzed.length ? Math.round(totalBeats / analyzed.length) : 0;
    
    return {
      analyzedTracks: analyzed,
      skippedTracks: skipped,
      totalBeats,
      avgBeats
    };
  }, [results]);

  if (!open) return null;

  // Navigation - only 1 page now
  const totalPages = 1; // Only 1 page: Comprehensive Dashboard
  const goNext = () => setPage(p => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage(p => Math.max(p - 1, 0));

  // --- Auto-scroll logic for songs list ---
  const songsListRef = useRef(null);
  const modalContainerRef = useRef(null);
  
  // Scroll to top when page changes (especially important for mobile)
  useEffect(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTop = 0;
    }
  }, [page]);
  
  useEffect(() => {
    if (page !== 0) return;
    const container = songsListRef.current;
    if (!container) return;
    let animationFrame;
    let startTime;
    
    // Slower scroll speed for smoother movement
    const scrollSpeed = 30; // pixels per second
    let maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;

    function animateScroll(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      
      // Create a continuous loop using modulo
      const totalDistance = maxScroll * 2; // Down and back up
      const currentPosition = (elapsed / 1000) * scrollSpeed;
      const loopPosition = currentPosition % totalDistance;
      
      if (loopPosition <= maxScroll) {
        // Going down
        container.scrollTop = loopPosition;
      } else {
        // Going up (reverse direction)
        container.scrollTop = maxScroll - (loopPosition - maxScroll);
      }
      
      animationFrame = requestAnimationFrame(animateScroll);
    }
    
    animationFrame = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [analyzedTracks, page]);

  return (
    <div style={{
      position: 'fixed',
      inset: '0px',
      background: '#1a1b1e',
      // display: 'flex',
      // flexDirection: 'column',
      // zIndex: 1000,
      // padding: isMobile ? '60px 16px 24px' : '80px 72px 72px',
      // boxSizing: 'border-box',
      overflow: 'hidden'
    }} ref={modalContainerRef}>
      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute',
        top: isMobile ? 16 : 24,
        right: isMobile ? 16 : 24,
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        minWidth: isMobile ? '48px' : '56px',
        minHeight: isMobile ? '48px' : '56px',
        border: '1px solid #444',
        borderRadius: '50%',
        background: 'none',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: isMobile ? '20px' : '24px',
        transition: 'all 0.2s ease',
        zIndex: 10,
        opacity: showArtistTracksModal ? 0 : 1,
        pointerEvents: showArtistTracksModal ? 'none' : 'auto'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"}>
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fill-bar {
          from { width: 0; }
          to { width: var(--bar-width); }
        }
        @keyframes fill-bar-left {
          from { width: 0; }
          to { width: var(--bar-width); }
        }
        @keyframes fill-bar-right {
          from { width: 0; }
          to { width: var(--bar-width); }
        }
        .wrapped-modal-container {
          max-width: 95vw;
          width: 95vw;
          margin: 0 auto;
        }
        @media (max-width: 799px) {
          .wrapped-modal-container {
            max-width: calc(100vw - 32px);
            width: calc(100vw - 32px);
            margin: 0 auto;
          }
        }
        @media (max-width: 420px) {
          .wrapped-modal-container {
            max-width: calc(100vw - 24px);
            width: calc(100vw - 24px);
            margin: 0 auto;
          }
          .wrapped-modal-container h1 {
            font-size: 1.5rem !important;
          }
          .wrapped-modal-container h2 {
            font-size: 1.25rem !important;
          }
          .wrapped-modal-container p {
            font-size: 0.875rem !important;
          }
        }
        .binary-feature-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #b3b3b3;
        }
      `}</style>
      
      <ComprehensiveDashboard 
        analyzedTracks={analyzedTracks} 
        totalBeats={totalBeats} 
        avgBeats={avgBeats} 
        isMobile={isMobile}
        onClose={onClose}
        tracks={tracks}
        showArtistTracksModal={showArtistTracksModal}
        setShowArtistTracksModal={setShowArtistTracksModal}
      />
    </div>
  );
} 

// --- Helper functions for staggered reveals ---
function useStaggeredReveal(count, trigger) {
  const [revealed, setRevealed] = useStateReact(Array(count).fill(false));
  useEffectReact(() => {
    setRevealed(Array(count).fill(false));
    let timeouts = [];
    for (let i = 0; i < count; i++) {
      timeouts.push(setTimeout(() => {
        setRevealed(r => {
          const arr = [...r];
          arr[i] = true;
          return arr;
        });
      }, 200 + i * 120));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [trigger, count]);
  return revealed;
}

function useStaggeredRevealChord(count, trigger) {
  const [revealed, setRevealed] = useStateReact(Array(count).fill(false));
  useEffectReact(() => {
    setRevealed(Array(count).fill(false));
    let timeouts = [];
    for (let i = 0; i < count; i++) {
      timeouts.push(setTimeout(() => {
        setRevealed(r => {
          const arr = [...r];
          arr[i] = true;
          return arr;
        });
      }, 200 + i * 80));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [trigger, count]);
  return revealed;
}

// --- GenreLeaderboards component ---
function GenreLeaderboards({ analyzedTracks, styles, isMobile }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  
  // Helper to get leaderboard for a highlevel classifier
  function getLeaderboard(key) {
    const counts = {};
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const val = r.highLevel?.[firstKey]?.highlevel?.[key]?.value;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }
  
  // Helper to get leaderboard for mood classification with proper mapping
  function getMoodLeaderboard() {
    const counts = {};
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const val = r.highLevel?.[firstKey]?.highlevel?.moods_mirex?.value;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }
  
  // Helper to get leaderboard for metadata.tags.genre with smart cleaning
  function getMetadataGenreLeaderboard() {
    const rawCounts = {};
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const genre = r.highLevel?.[firstKey]?.metadata?.tags?.genre;
      if (genre) rawCounts[genre] = (rawCounts[genre] || 0) + 1;
    });
    
    // Clean and normalize genres
    const cleanedCounts = {};
    Object.entries(rawCounts).forEach(([rawGenre, count]) => {
      if (rawGenre.length > 50) return;
      if (['genre', 'other', 'misc', 'various', 'unknown'].includes(rawGenre.toLowerCase())) return;
      
      const normalized = normalizeGenre(rawGenre);
      if (normalized) {
        cleanedCounts[normalized] = (cleanedCounts[normalized] || 0) + count;
      }
    });
    
    return Object.entries(cleanedCounts).sort((a, b) => b[1] - a[1]);
  }
  
  // Smart genre normalization function
  function normalizeGenre(rawGenre) {
    if (!rawGenre) return null;
    
    const genre = rawGenre.toLowerCase().trim();
    if (genre.length > 50) return null;
    
    // Hip Hop variations
    if (genre.includes('hip hop') || genre.includes('hip-hop') || genre.includes('hiphop') || 
        genre.includes('rap') || genre.includes('trap')) {
      return 'Hip Hop & Rap';
    }
    
    // Electronic variations
    if (genre.includes('electronic') || genre.includes('edm') || genre.includes('dance') ||
        genre.includes('techno') || genre.includes('house') || genre.includes('trance') ||
        genre.includes('dubstep') || genre.includes('drum & bass') || genre.includes('dnb') ||
        genre.includes('ambient') || genre.includes('synthwave') || genre.includes('electro')) {
      return 'Electronic & Dance';
    }
    
    // Rock variations
    if (genre.includes('rock') || genre.includes('metal') || genre.includes('punk') ||
        genre.includes('grunge') || genre.includes('indie rock') || genre.includes('alternative rock') ||
        genre.includes('hard rock') || genre.includes('progressive rock') || genre.includes('classic rock')) {
      return 'Rock & Metal';
    }
    
    // Pop variations
    if (genre.includes('pop') || genre.includes('indie pop') || genre.includes('synth pop') ||
        genre.includes('dream pop') || genre.includes('electropop') || genre.includes('art pop')) {
      return 'Pop';
    }
    
    // R&B and Soul variations
    if (genre.includes('r&b') || genre.includes('rnb') || genre.includes('rhythm and blues') || genre.includes('soul') ||
        genre.includes('neo soul') || genre.includes('alternative r&b') || genre.includes('contemporary r&b') ||
        genre.includes('rhythm & blues')) {
      return 'R&B & Soul';
    }
    
    // Jazz variations
    if (genre.includes('jazz') || genre.includes('smooth jazz') || genre.includes('acid jazz') ||
        genre.includes('jazz fusion') || genre.includes('bebop') || genre.includes('cool jazz')) {
      return 'Jazz';
    }
    
    // Folk variations
    if (genre.includes('folk') || genre.includes('indie folk') || genre.includes('folk rock') ||
        genre.includes('traditional folk') || genre.includes('contemporary folk')) {
      return 'Folk';
    }
    
    // Country variations
    if (genre.includes('country') || genre.includes('country rock') || genre.includes('alt country') ||
        genre.includes('outlaw country') || genre.includes('bluegrass')) {
      return 'Country';
    }
    
    // Classical variations
    if (genre.includes('classical') || genre.includes('orchestral') || genre.includes('chamber music') ||
        genre.includes('symphony') || genre.includes('opera')) {
      return 'Classical';
    }
    
    // Reggae variations
    if (genre.includes('reggae') || genre.includes('dub') || genre.includes('ska') ||
        genre.includes('dancehall')) {
      return 'Reggae';
    }
    
    // Latin variations
    if (genre.includes('latin') || genre.includes('salsa') || genre.includes('merengue') ||
        genre.includes('bossa nova') || genre.includes('flamenco') || genre.includes('tango')) {
      return 'Latin';
    }
    
    // World variations
    if (genre.includes('world') || genre.includes('african') || genre.includes('middle eastern') ||
        genre.includes('indian') || genre.includes('celtic') || genre.includes('gospel')) {
      return 'World & Traditional';
    }
    
    // Blues variations
    if (genre.includes('blues') || genre.includes('delta blues') || genre.includes('electric blues') ||
        genre.includes('chicago blues')) {
      return 'Blues';
    }
    
    // Funk variations
    if (genre.includes('funk') || genre.includes('disco') || genre.includes('motown')) {
      return 'Funk & Disco';
    }
    
    // If no major category matches, try to extract the most meaningful part
    const words = genre.split(/[\s&\/,]+/).filter(word => word.length > 2);
    if (words.length > 0) {
      return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    
    return null;
  }
  
  // Human-friendly mappings for genre codes
  const rosamericaMap = {
    pop: 'Pop', rhy: 'Rhythm & Blues', hip: 'Hip-Hop', roc: 'Rock', dan: 'Dance', spe: 'Speech', ele: 'Electronic', jaz: 'Jazz', ins: 'Instrumental', fol: 'Folk', bla: 'Blues', cou: 'Country', reg: 'Reggae', sou: 'Soul', fun: 'Funk', lat: 'Latin', met: 'Metal', pun: 'Punk', cla: 'Classical', exp: 'Experimental', amb: 'Ambient', wor: 'World', blu: 'Blues', rap: 'Rap', '': ''
  };
  const mirexMap = {
    cluster1: 'Quiet Moments', cluster2: 'Dance & Social Vibe', cluster3: 'Calm & Focused', cluster4: 'Power Up', cluster5: 'Beat-Driven & Lyrical',
    Cluster1: 'Quiet Moments', Cluster2: 'Dance & Social Vibe', Cluster3: 'Calm & Focused', Cluster4: 'Power Up', Cluster5: 'Beat-Driven & Lyrical',
    '': ''
  };

  // Color mapping for mood classifications
  const moodColorMap = {
    'Quiet Moments': { bg: 'rgba(147, 51, 234, 0.2)', text: '#9333ea' },      // Purple
    'Dance & Social Vibe': { bg: 'rgba(236, 72, 153, 0.2)', text: '#ec4899' }, // Pink
    'Calm & Focused': { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },     // Blue
    'Power Up': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },            // Red
    'Beat-Driven & Lyrical': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' } // Orange
  };
  
  const metrics = [
    { label: 'Genres', key: 'metadata_genre', isMetadata: true },
    { label: 'Styles', key: 'genre_rosamerica', map: rosamericaMap },
    { label: 'Mood Classifications', key: 'moods_mirex', isMood: true, map: mirexMap },
  ];
  
  return (
    <div style={styles.genreLeaderboard}>
      {metrics.map((m, metricIdx) => {
        let leaderboard;
        if (m.isMetadata) {
          leaderboard = getMetadataGenreLeaderboard();
        } else if (m.isMood) {
          leaderboard = getMoodLeaderboard();
        } else {
          leaderboard = getLeaderboard(m.key);
        }
        const revealed = useStaggeredReveal(leaderboard.length, animKey + '-' + m.key);
        return (
          <div key={m.key} style={styles.genreSection}>
            <div style={styles.genreSectionTitle}>{m.label}</div>
            <div style={styles.genreTags}>
              {leaderboard.length === 0 ? (
                <span style={{ color: '#b0b6be', fontSize: isMobile ? 14 : 16 }}>No data</span>
              ) : (
                leaderboard.map(([val, count], i) => {
                  const displayVal = m.map ? (m.map[val] || val) : val;
                  const isMoodClassification = m.isMood;
                  const moodColors = isMoodClassification ? moodColorMap[displayVal] : null;
                  
                  return (
                    <span
                      key={val}
                      style={{
                        ...styles.genreTag,
                        ...(isMoodClassification && moodColors ? {
                          background: moodColors.bg,
                          color: moodColors.text
                        } : {}),
                        opacity: revealed[i] ? 1 : 0,
                        transform: revealed[i] ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)',
                        transitionDelay: `${i * 0.12 + 0.1}s`,
                      }}
                    >
                      {count} {displayVal}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- ChordsHistogram component ---
function ChordsHistogram({ analyzedTracks, styles }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  
  // Aggregate major and minor chords
  const chordNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let majorCounts = Array(12).fill(0);
  let minorCounts = Array(12).fill(0);
  analyzedTracks.forEach(r => {
    const firstKey = Object.keys(r.lowLevel || {})[0];
    const hist = r.analysisData?.tonal?.chords_histogram || r.lowLevel?.[firstKey]?.tonal?.chords_histogram || r.highLevel?.[firstKey]?.tonal?.chords_histogram;
    if (Array.isArray(hist) && hist.length === 24) {
      for (let i = 0; i < 12; i++) {
        majorCounts[i] += hist[i];
        minorCounts[i] += hist[i + 12];
      }
    }
  });
  
  // Convert to leaderboard
  const numTracks = analyzedTracks.length || 1;
  const majorLeaderboard = chordNames.map((name, i) => [name, majorCounts[i] / numTracks]).sort((a, b) => b[1] - a[1]);
  const minorLeaderboard = chordNames.map((name, i) => [name + 'm', minorCounts[i] / numTracks]).sort((a, b) => b[1] - a[1]);
  const majorRevealed = useStaggeredRevealChord(majorLeaderboard.length, animKey + '-maj');
  const minorRevealed = useStaggeredRevealChord(minorLeaderboard.length, animKey + '-min');
  
  return (
    <div style={styles.chordsHistogram}>
      <div style={styles.chordSection}>
        <div style={styles.chordSectionTitle}>Major Chords</div>
        {majorLeaderboard.map(([chord, count], i) => (
          <div key={chord} style={{
            ...styles.chordItem,
            opacity: majorRevealed[i] ? 1 : 0,
            transform: majorRevealed[i] ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)',
            transitionDelay: `${i * 0.08 + 0.1}s`
          }}>
            <span>{chord}</span>
            <span>{count.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div style={styles.chordSection}>
        <div style={styles.chordSectionTitle}>Minor Chords</div>
        {minorLeaderboard.map(([chord, count], i) => (
          <div key={chord} style={{
            ...styles.chordItem,
            color: '#f87171',
            opacity: minorRevealed[i] ? 1 : 0,
            transform: minorRevealed[i] ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)',
            transitionDelay: `${i * 0.08 + 0.1}s`
          }}>
            <span>{chord}</span>
            <span>{count.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ArtistTracksModal component ---
function ArtistTracksModal({ open, onClose, artistName, tracks, isMobile }) {
  if (!open) return null;

  // Prevent body scrolling when modal is open
  useEffectReact(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  return (
    <div style={{
      position: 'fixed',
      inset: '0px',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: isMobile ? '16px' : '40px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute',
        top: isMobile ? 16 : 24,
        right: isMobile ? 16 : 24,
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        minWidth: isMobile ? '48px' : '56px',
        minHeight: isMobile ? '48px' : '56px',
        border: '1px solid #444',
        borderRadius: '50%',
        background: 'rgba(24, 28, 36, 0.9)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: isMobile ? '20px' : '24px',
        transition: 'all 0.2s ease',
        zIndex: 10
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"}>
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>
      </button>

      {/* Modal Content */}
      <div style={{
        background: '#212121',
        borderRadius: isMobile ? 16 : 24,
        padding: isMobile ? 16 : 40,
        maxWidth: isMobile ? '100vw' : '600px',
        width: isMobile ? '100vw' : '600px',
        maxHeight: isMobile ? '90vh' : '85vh',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #535353'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? 20 : 32,
          paddingBottom: isMobile ? 16 : 24,
          borderBottom: '1px solid #535353'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 900,
            color: '#fff',
            marginBottom: isMobile ? 8 : 12,
            letterSpacing: 1
          }}>
            {artistName}
          </h2>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            color: '#b3b3b3',
            margin: 0
          }}>
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Tracks List - Mobile Style */}
        <div style={{
          maxHeight: isMobile ? 'calc(90vh - 180px)' : 'calc(85vh - 200px)',
          overflowY: 'auto',
          paddingRight: isMobile ? 0 : 8
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
                         {tracks.map((track, idx) => (
               <div key={track.id ? `${track.id}-${idx}` : idx} style={{
                 background: idx % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                 borderRadius: 14,
                 padding: 14,
                 display: 'flex',
                 alignItems: 'center',
                 gap: 12,
                 boxShadow: '0 2px 8px #0002',
                 position: 'relative',
                 overflow: 'hidden',
                 border: track.album_image || track.album?.images?.[0]?.url ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)'
               }}>
                 {/* Background album image layer */}
                 {track.album_image || track.album?.images?.[0]?.url ? (
                   <div style={{
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     right: 0,
                     bottom: 0,
                     backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${track.album_image || track.album?.images?.[0]?.url})`,
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     backgroundRepeat: 'no-repeat',
                     filter: 'blur(3px)',
                     zIndex: 0
                   }} />
                 ) : null}
                 
                 {/* Content layer */}
                 <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                   {/* Index Number */}
                   <div style={{
                     fontSize: '0.75rem',
                     fontWeight: 700,
                     color: '#ffffff',
                     background: '#1db954',
                     borderRadius: '50%',
                     width: 20,
                     height: 20,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     boxShadow: '0 1px 4px #0002',
                     flexShrink: 0
                   }}>
                     {idx + 1}
                   </div>
                   
                   {/* Track Info */}
                   <div style={{ minWidth: 0, flex: 1 }}>
                     <div style={{ 
                       fontWeight: 600, 
                       color: '#fff', 
                       fontSize: 16, 
                       overflow: 'hidden', 
                       textOverflow: 'ellipsis', 
                       whiteSpace: 'nowrap',
                       margin: '0 0 4px 0',
                       textShadow: track.album_image || track.album?.images?.[0]?.url ? '0 1px 3px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(0, 0, 0, 0.6)'
                     }}>
                       {track.name}
                     </div>
                     <div style={{ 
                       color: '#e5e7eb', 
                       fontSize: 14, 
                       fontWeight: 500,
                       overflow: 'hidden', 
                       textOverflow: 'ellipsis', 
                       whiteSpace: 'nowrap',
                       margin: '0 0 4px 0',
                       textShadow: track.album_image || track.album?.images?.[0]?.url ? '0 1px 2px rgba(0, 0, 0, 0.7), 0 1px 1px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(0, 0, 0, 0.5)'
                     }}>
                       {track.album?.name || track.album}
                     </div>
                     <div style={{ 
                       color: '#d1d5db', 
                       fontSize: 12,
                       fontWeight: 400,
                       textShadow: track.album_image || track.album?.images?.[0]?.url ? '0 1px 2px rgba(0, 0, 0, 0.6), 0 1px 1px rgba(0, 0, 0, 0.7)' : '0 1px 1px rgba(0, 0, 0, 0.4)'
                     }}>
                       {track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '')} • {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}
                     </div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Custom scrollbar styling */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: #232323;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb {
            background: #1db954;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #16a34a;
          }
        `}</style>
      </div>
    </div>
  );
}

// --- ComprehensiveDashboard component ---
function ComprehensiveDashboard({ analyzedTracks, totalBeats, avgBeats, isMobile, tracks, onClose, showArtistTracksModal, setShowArtistTracksModal }) {
  const [animKey, setAnimKey] = useStateReact(0);
  const [selectedArtistTracks, setSelectedArtistTracks] = useStateReact([]);
  const [selectedArtistName, setSelectedArtistName] = useStateReact('');
  
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);

  // Chart.js charts effect
  useEffectReact(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      createChordsCharts();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = createChordsCharts;
      document.head.appendChild(script);
    }
  }, [analyzedTracks]);

  // Handle artist click to show tracks
  const handleArtistClick = (artistName) => {
    // Filter tracks for this artist
    const artistTracks = tracks.filter(track => {
      const trackArtists = track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : '');
      return trackArtists.toLowerCase().includes(artistName.toLowerCase());
    });
    
    // Sort tracks by release date (oldest first)
    const sortedTracks = artistTracks.sort((a, b) => {
      const dateA = a.album?.release_date || a.release_year || '9999';
      const dateB = b.album?.release_date || b.release_year || '9999';
      
      // Convert to comparable format
      const yearA = typeof dateA === 'string' ? parseInt(dateA.split('-')[0]) : parseInt(dateA);
      const yearB = typeof dateB === 'string' ? parseInt(dateB.split('-')[0]) : parseInt(dateB);
      
      return yearA - yearB; // Oldest first
    });
    
    setSelectedArtistTracks(sortedTracks);
    setSelectedArtistName(artistName);
    setShowArtistTracksModal(true);
  };

  // Handle album click to show tracks
  const handleAlbumClick = (albumName) => {
    // Filter tracks for this album
    const albumTracks = tracks.filter(track => {
      const trackAlbum = track.album?.name || track.album || 'Unknown Album';
      return trackAlbum.toLowerCase() === albumName.toLowerCase();
    });
    
    // Sort tracks by release date (oldest first)
    const sortedTracks = albumTracks.sort((a, b) => {
      const dateA = a.album?.release_date || a.release_year || '9999';
      const dateB = b.album?.release_date || b.release_year || '9999';
      
      // Convert to comparable format
      const yearA = typeof dateA === 'string' ? parseInt(dateA.split('-')[0]) : parseInt(dateA);
      const yearB = typeof dateB === 'string' ? parseInt(dateB.split('-')[0]) : parseInt(dateB);
      
      return yearA - yearB; // Oldest first
    });
    
    // Get the artist name from the first track
    const artistName = albumTracks[0]?.artist || (albumTracks[0]?.artists ? (Array.isArray(albumTracks[0]?.artists) ? albumTracks[0]?.artists.map(a => a.name).join(", ") : albumTracks[0]?.artists) : 'Unknown Artist');
    
    setSelectedArtistTracks(sortedTracks);
    setSelectedArtistName(`${albumName} - ${artistName}`);
    setShowArtistTracksModal(true);
  };

  function createChordsCharts() {
    if (typeof window === 'undefined' || !window.Chart) {
      setTimeout(createChordsCharts, 100);
      return;
    }

    const Chart = window.Chart;
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 25,
          ticks: {
            color: '#b3b3b3',
            callback: function(value) {
              return value + '%';
            },
            font: { size: isMobile ? 8 : 12 },
            maxTicksLimit: isMobile ? 4 : 6
          },
          grid: { color: '#535353' }
        },
                 x: {
           ticks: {
             color: '#b3b3b3',
             fontSize: 8,
             maxRotation: 45,
             minRotation: 0
           },
           grid: { display: false }
         }
      }
    };

    const chordNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let majorCounts = Array(12).fill(0);
    let minorCounts = Array(12).fill(0);
    
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.lowLevel || {})[0];
      const hist = r.analysisData?.tonal?.chords_histogram || r.lowLevel?.[firstKey]?.tonal?.chords_histogram || r.highLevel?.[firstKey]?.tonal?.chords_histogram;
      if (Array.isArray(hist) && hist.length === 24) {
        for (let i = 0; i < 12; i++) {
          majorCounts[i] += hist[i];
          minorCounts[i] += hist[i + 12];
        }
      }
    });

    const numTracks = analyzedTracks.length || 1;
    const majorData = chordNames.map((name, i) => majorCounts[i] / numTracks);
    const minorData = chordNames.map((name, i) => minorCounts[i] / numTracks);

    // Filter out zero values for major chords
    const majorNonZeroIndices = majorData.map((value, index) => ({ value, index })).filter(item => item.value > 0);
    const majorFilteredLabels = majorNonZeroIndices.map(item => chordNames[item.index]);
    const majorFilteredData = majorNonZeroIndices.map(item => item.value);

    // Filter out zero values for minor chords
    const minorNonZeroIndices = minorData.map((value, index) => ({ value, index })).filter(item => item.value > 0);
    const minorFilteredLabels = minorNonZeroIndices.map(item => chordNames[item.index] + 'm');
    const minorFilteredData = minorNonZeroIndices.map(item => item.value);

    // Create Major Chords Chart
    const majorCtx = document.getElementById('majorChordsChart');
    if (majorCtx) {
      if (majorCtx.chart) {
        majorCtx.chart.destroy();
      }
      
      majorCtx.chart = new Chart(majorCtx, {
        type: 'bar',
        data: {
          labels: majorFilteredLabels,
          datasets: [{
            label: 'Major Chord Duration',
            data: majorFilteredData,
            backgroundColor: 'rgba(29, 185, 84, 0.5)',
            borderColor: 'rgba(29, 185, 84, 1)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: { 
          ...chartOptions, 
          plugins: { 
            ...chartOptions.plugins, 
            title: { 
              display: true, 
              text: 'Major Chords', 
              color: '#FFF', 
              font: { size: isMobile ? 14 : 16 } 
            } 
          } 
        }
      });
    }

    // Create Minor Chords Chart
    const minorCtx = document.getElementById('minorChordsChart');
    if (minorCtx) {
      if (minorCtx.chart) {
        minorCtx.chart.destroy();
      }
      
      minorCtx.chart = new Chart(minorCtx, {
        type: 'bar',
        data: {
          labels: minorFilteredLabels,
          datasets: [{
            label: 'Minor Chord Duration',
            data: minorFilteredData,
            backgroundColor: 'rgba(29, 185, 84, 0.5)',
            borderColor: 'rgba(29, 185, 84, 1)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: { 
          ...chartOptions, 
          plugins: { 
            ...chartOptions.plugins, 
            title: { 
              display: true, 
              text: 'Minor Chords', 
              color: '#FFF', 
              font: { size: isMobile ? 14 : 16 } 
            } 
          } 
        }
      });
    }
  }

  // Helper functions for data extraction
  function getAvgHighlevel(key) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const val = r.highLevel?.[firstKey]?.highlevel?.[key]?.probability;
      if (typeof val === 'number') { sum += val; count++; }
    });
    return count ? sum / count : 0;
  }

  function getAvgBinary(key, positiveValue) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const all = r.highLevel?.[firstKey]?.highlevel?.[key]?.all;
      if (all && typeof all[positiveValue] === 'number') { sum += all[positiveValue]; count++; }
    });
    return count ? sum / count : 0;
  }

  function getAvgBinaryPair(key, left, right) {
    let leftSum = 0, rightSum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const firstKey = Object.keys(r.highLevel || {})[0];
      const all = r.highLevel?.[firstKey]?.highlevel?.[key]?.all;
      if (all && typeof all[left] === 'number' && typeof all[right] === 'number') {
        leftSum += all[left];
        rightSum += all[right];
        count++;
      }
    });
    return count ? { left: leftSum / count, right: rightSum / count } : { left: 0, right: 0 };
  }

  // Audio profile data
  const audioProfiles = [
    { name: 'Danceability', value: getAvgHighlevel('danceability') },
    { name: 'Acousticness', value: getAvgBinary('mood_acoustic', 'acoustic') },
    { name: 'Aggressiveness', value: getAvgBinary('mood_aggressive', 'aggressive') },
    { name: 'Electronicness', value: getAvgBinary('mood_electronic', 'electronic') },
    { name: 'Happiness', value: getAvgBinary('mood_happy', 'happy') },
    { name: 'Partiness', value: getAvgBinary('mood_party', 'party') },
    { name: 'Relaxedness', value: getAvgBinary('mood_relaxed', 'relaxed') },
    { name: 'Melancholicness', value: getAvgBinary('mood_sad', 'sad') },
  ];

  // Binary features data
  const binaryFeatures = [
    {
      label: 'Gender',
      left: 'Male',
      right: 'Female',
      avg: getAvgBinaryPair('gender', 'male', 'female')
    },
    {
      label: 'Timbre',
      left: 'Dark',
      right: 'Bright',
      avg: getAvgBinaryPair('timbre', 'dark', 'bright')
    },
    {
      label: 'Tonality',
      left: 'Atonal',
      right: 'Tonal',
      avg: getAvgBinaryPair('tonal_atonal', 'atonal', 'tonal')
    },
    {
      label: 'Voice',
      left: 'Vocal',
      right: 'Instrumental',
      avg: getAvgBinaryPair('voice_instrumental', 'voice', 'instrumental')
    },
  ];

  return (
    <div style={{
      background: '#212121',
      borderRadius: 0,
      padding: isMobile ? 16 : 40,
      border: '1px solid #535353',
      boxShadow: '0 25px 50px -12px rgba(29, 185, 84, 0.1)',
      maxWidth: '100%',
      margin: '0 auto',
      overflow: 'hidden',
      position: 'relative',
      height: '100vh',
      overflowY: 'auto'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2a2a 1px, transparent 0)',
        backgroundSize: '20px 20px',
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginTop: 50, marginBottom: 40 }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            marginBottom: isMobile ? 6 : 8
          }}>
            Your Songs Wrapped
          </h1>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.125rem',
            color: '#b3b3b3'
          }}>
            A complete breakdown of your listening profile.
          </p>
        </header>

        {/* Grid Layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32
        }}>
          {/* Top sections - 50/50 split */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 32
          }}>

          {/* Top Artists - Full Width */}
          <div style={{
            gridColumn: isMobile ? '1 / -1' : '1',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353',
            marginBottom: isMobile ? 24 : 0
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: 16
            }}>
              Top Artists
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '280px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1db954 #1e1e1e'
            }}>
              {(() => {
                // Get unique artists and their counts from original tracks data
                const artistCounts = {};
                tracks.forEach(track => {
                  const artistName = track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : 'Unknown Artist');
                  artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
                });
                
                // Sort by count and get all artists
                const topArtists = Object.entries(artistCounts)
                  .sort(([,a], [,b]) => b - a);
                
                                                 return topArtists.map(([artistName, count], index) => (
                  <div
                    key={artistName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(29, 185, 84, 0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(29, 185, 84, 0.2)',
                      height: 48,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleArtistClick(artistName)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1db954',
                        minWidth: '24px'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#fff'
                      }}>
                        {artistName}
                      </span>
                    </div>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: 8
                     }}>
                       <span style={{
                         fontSize: '0.875rem',
                         color: '#b3b3b3'
                       }}>
                         {count} track{count !== 1 ? 's' : ''}
                       </span>
                     </div>
                   </div>
                 ));
              })()}
            </div>
            
            {/* Custom scrollbar styling */}
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #1e1e1e;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #1db954;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #16a34a;
              }
            `}</style>
          </div>

          {/* Top Albums - Full Width */}
          <div style={{
            gridColumn: isMobile ? '1' : '2',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353',
            marginBottom: isMobile ? 16 : 0
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? 12 : 16
            }}>
              Top Albums
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '280px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1db954 #1e1e1e'
            }}>
              {(() => {
                // Get unique albums and their counts from original tracks data
                const albumCounts = {};
                const albumImages = {};
                tracks.forEach(track => {
                  const albumName = track.album?.name || track.album || 'Unknown Album';
                  albumCounts[albumName] = (albumCounts[albumName] || 0) + 1;
                  
                  // Store album image if available
                  if (!albumImages[albumName]) {
                    const albumImage = track.album_image || track.album?.images?.[0]?.url || track.images?.[0]?.url || track.cover;
                    if (albumImage) {
                      albumImages[albumName] = albumImage;
                    }
                  }
                });
                
                // Sort by count and get all albums
                const topAlbums = Object.entries(albumCounts)
                  .sort(([,a], [,b]) => b - a);
                
                                return topAlbums.map(([albumName, count], index) => (
                  <div
                    key={albumName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(29, 185, 84, 0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(29, 185, 84, 0.2)',
                      height: 48,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleAlbumClick(albumName)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1db954',
                        minWidth: '24px'
                      }}>
                        #{index + 1}
                      </span>
                      
                      {/* Album Image */}
                      {albumImages[albumName] ? (
                        <img 
                          src={albumImages[albumName]} 
                          alt={albumName}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            objectFit: 'cover',
                            background: '#232323'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: 'rgba(29, 185, 84, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1db954',
                          fontSize: 14,
                          fontWeight: 'bold'
                        }}>
                          {albumName[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#fff'
                      }}>
                        {albumName}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: '#b3b3b3'
                      }}>
                        {count} track{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* Custom scrollbar styling */}
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #1e1e1e;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #1db954;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #16a34a;
              }
            `}</style>
          </div>
          </div>

          {/* Bottom sections - 3-column layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 32
          }}>
          <div style={{
            gridColumn: isMobile ? '1 / -1' : '1 / -1',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? 12 : 16
            }}>
              Genre & Style Breakdown
            </h2>
            <GenreLeaderboards analyzedTracks={analyzedTracks} isMobile={isMobile} styles={{
              genreLeaderboard: {
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 16 : 20
              },
              genreSection: {
                marginBottom: isMobile ? 12 : 16
              },
              genreSectionTitle: {
                color: '#b3b3b3',
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                marginBottom: 4
              },
              genreTags: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8
              },
              genreTag: {
                background: 'rgba(29, 185, 84, 0.2)',
                color: '#1db954',
                fontWeight: 600,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                borderRadius: 9999,
                padding: '2px 8px'
              }
            }} />
          </div>

          {/* Total Beat Count */}
          <div style={{
            gridColumn: isMobile ? '1' : '1',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? 12 : 16
            }}>
              Total Beat Count
            </h2>
            <p style={{
              fontSize: isMobile ? '2.5rem' : '4rem',
              fontWeight: 900,
              color: '#1db954',
              margin: isMobile ? '6px 0' : '8px 0'
            }}>
              {totalBeats.toLocaleString()}
            </p>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: '#b3b3b3',
              marginBottom: isMobile ? 16 : 20
            }}>
              That's <span style={{ fontWeight: 700, color: '#fff' }}>{avgBeats}</span> beats per song on average.
            </p>
            
            {/* Summary Information */}
            {(() => {
              if (analyzedTracks.length === 0) return null;
              let earliest = analyzedTracks[0], latest = analyzedTracks[0];
              let minYear = null, maxYear = null;
              let totalDurationMs = 0;
              analyzedTracks.forEach(r => {
                const year = r.track?.release_year || (r.track?.album?.release_date ? parseInt(r.track.album.release_date.split('-')[0]) : null);
                if (year) {
                  if (minYear === null || year < minYear) {
                    minYear = year;
                    earliest = r;
                  }
                  if (maxYear === null || year > maxYear) {
                    maxYear = year;
                    latest = r;
                  }
                }
                totalDurationMs += r.track?.duration_ms || r.track?.duration || 0;
              });
              const totalHours = Math.floor(totalDurationMs / 3600000);
              const totalMins = Math.floor((totalDurationMs % 3600000) / 60000);
              const totalSecs = Math.floor((totalDurationMs % 60000) / 1000).toString().padStart(2, '0');
              const formattedTime = `${totalHours}:${totalMins.toString().padStart(2, '0')}:${totalSecs}`;
              
              return (
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: isMobile ? 12 : 16,
                  marginTop: isMobile ? 12 : 16
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 12 : 16,
                    textAlign: 'left'
                  }}>
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#1db954',
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        First published
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        color: '#fff',
                        fontWeight: 700,
                        marginBottom: 4
                      }}>
                        {earliest.track?.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: '#b3b3b3',
                        fontWeight: 500
                      }}>
                        {minYear || 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#1db954',
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        Most recent
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        color: '#fff',
                        fontWeight: 700,
                        marginBottom: 4
                      }}>
                        {latest.track?.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: '#b3b3b3',
                        fontWeight: 500
                      }}>
                        {maxYear || 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#1db954',
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        Total listening time
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        color: '#fff',
                        fontWeight: 700
                      }}>
                        {formattedTime}
                      </div>
                            </div>
      </div>
      
      {/* Artist Tracks Modal */}
      {showArtistTracksModal && (
        <ArtistTracksModal
          open={showArtistTracksModal}
          onClose={() => setShowArtistTracksModal(false)}
          artistName={selectedArtistName}
          tracks={selectedArtistTracks}
          isMobile={isMobile}
        />
      )}
    </div>
  );
})()}
          </div>

          {/* Binary Audio Features */}
          <div style={{
            gridColumn: isMobile ? '1' : '2',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? 16 : 24
            }}>
              Binary Audio Features
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
              {binaryFeatures.map((feature, i) => {
                const leftPct = Math.round(feature.avg.left * 100);
                const rightPct = Math.round(feature.avg.right * 100);
                return (
                  <div key={feature.label}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: 6,
                      color: '#b3b3b3'
                    }}>
                      <span className="binary-feature-label" style={{ color: '#1db954' }}>{feature.left} ({leftPct}%)</span>
                      <span className="binary-feature-label">{feature.right} ({rightPct}%)</span>
                    </div>
                    <div style={{
                      width: '100%',
                      background: '#535353',
                      borderRadius: 9999,
                      height: 12
                    }}>
                      <div style={{
                        background: '#1db954',
                        height: 12,
                        borderRadius: 9999,
                        width: `${leftPct}%`
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average Audio Profile */}
          <div style={{
            gridColumn: isMobile ? '1' : '3',
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? 12 : 16
            }}>
              Average Audio Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
              {audioProfiles.map((profile, i) => (
                <div key={profile.name}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}>
                    <span style={{ color: '#b3b3b3' }}>{profile.name}</span>
                    <span style={{ color: '#1db954', fontWeight: 700 }}>
                      {Math.round(profile.value * 100)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    background: '#535353',
                    borderRadius: 9999,
                    height: 10
                  }}>
                    <div style={{
                      background: '#1db954',
                      height: 10,
                      borderRadius: 9999,
                      width: `${Math.round(profile.value * 100)}%`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Chords Histogram - Full Width */}
        <div style={{
          gridColumn: isMobile ? '1' : '1 / -1',
          background: 'rgba(33, 33, 33, 0.5)',
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          border: '1px solid #535353',
          marginTop: isMobile ? 24 : 32
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            marginBottom: isMobile ? 6 : 8
          }}>
            Chords Histogram
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#b3b3b3',
            marginBottom: isMobile ? 16 : 24,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            The average duration of each major and minor chord.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 32
          }}>
            <div style={{ 
              position: 'relative', 
              height: isMobile ? 200 : 400, 
              width: isMobile ? '100%' : '50%'
            }}>
              <canvas id="majorChordsChart"></canvas>
            </div>
            <div style={{ 
              position: 'relative', 
              height: isMobile ? 200 : 400, 
              width: isMobile ? '100%' : '50%',
              paddingRight: isMobile ? 0 : '24px'
            }}>
              <canvas id="minorChordsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 