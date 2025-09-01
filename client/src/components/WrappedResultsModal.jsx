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
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [prevButtonHover, setPrevButtonHover] = useState(false);
  const [nextButtonHover, setNextButtonHover] = useState(false);
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

  // Navigation
  const totalPages = 2; // Only 2 pages now: Page 0 (songs list) and Page 1 (comprehensive dashboard)
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
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.85)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center',
      padding: isMobile ? (width < 420 ? '8px' : '12px') : 'max(20px, 5vh) max(20px, 3vw)',
      overflow: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={styles.modalContainer} ref={modalContainerRef} className="wrapped-modal-container">
        <button onClick={onClose} style={styles.closeButton} className="wrapped-close-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
        <style jsx>{`
          @media (min-width: 1200px) {
            .wrapped-modal-container {
              max-width: 1200px !important;
              width: 90vw !important;
            }
          }
          @media (min-width: 1600px) {
            .wrapped-modal-container {
              max-width: 1400px !important;
              width: 85vw !important;
            }
          }
          @media (max-width: 1199px) and (min-width: 800px) {
            .wrapped-modal-container {
              max-width: 95vw !important;
              width: 95vw !important;
            }
          }
          @media (max-width: 799px) {
            .wrapped-modal-container {
              max-width: calc(100vw - 32px) !important;
              width: calc(100vw - 32px) !important;
              margin: 0 auto !important;
            }
          }
          @media (max-width: 420px) {
            .wrapped-modal-container {
              max-width: calc(100vw - 24px) !important;
              width: calc(100vw - 24px) !important;
              margin: 0 auto !important;
            }
            .wrapped-modal-container * {
              font-size: 0.9em !important;
            }
            .wrapped-modal-container .binary-feature-label {
              font-size: 0.8em !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
          }
          .wrapped-modal-container .songs-list-item {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
          }
          .wrapped-modal-container {
            overflow-x: hidden !important;
            position: relative !important;
          }
          .wrapped-modal-container * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* Ensure modal content doesn't overlap with close button */
          .wrapped-modal-container > *:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Close button hover effects */
          .wrapped-close-button:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            transform: scale(1.1) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
          }
          
          /* Ensure close button is always visible */
          .wrapped-close-button {
            position: fixed !important;
            z-index: 10000 !important;
            top: 20px !important;
            right: 20px !important;
          }
          
          /* Mobile adjustments for close button */
          @media (max-width: 768px) {
            .wrapped-close-button {
              top: 15px !important;
              right: 15px !important;
              width: 32px !important;
              height: 32px !important;
              font-size: 18px !important;
            }
          }
          
          /* Ensure close button is always on top and visible */
          .wrapped-close-button {
            position: fixed !important;
            z-index: 10000 !important;
            top: 20px !important;
            right: 20px !important;
            background: rgba(24, 28, 36, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
          }
          
          /* Add a subtle glow effect to make it more visible */
          .wrapped-close-button::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, rgba(56, 189, 248, 0.3), rgba(255, 255, 255, 0.1));
            border-radius: 50%;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .wrapped-close-button:hover::before {
            opacity: 1;
          }
        `}</style>
        {page === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: isMobile ? '0 24px' : '0 32px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={styles.mainTitle}>Your Songs Wrapped</h2>
            {/* Calculate earliest/latest and total duration */}
            {(() => {
              if (analyzedTracks.length === 0) return null;
              // Find earliest and latest
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
              // Format duration as hh:mm:ss
              const totalHours = Math.floor(totalDurationMs / 3600000);
              const totalMins = Math.floor((totalDurationMs % 3600000) / 60000);
              const totalSecs = Math.floor((totalDurationMs % 60000) / 1000).toString().padStart(2, '0');
              const formattedTime = `${totalHours}:${totalMins.toString().padStart(2, '0')}:${totalSecs}`;
              
              if (isMobile) {
                // Mobile layout - display stats in a more compact, mobile-friendly way
                return (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginBottom: 6 }}>
                        First published
                      </div>
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                        {earliest.track?.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 500 }}>
                        {minYear || 'N/A'}
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginBottom: 6 }}>
                        Most recent
                      </div>
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                        {latest.track?.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 500 }}>
                        {maxYear || 'N/A'}
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginBottom: 6 }}>
                        Total listening time
                      </div>
                      <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                        {formattedTime}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Desktop layout - original design
                return (
                  <div style={{ marginBottom: 32 }}>
                    <div style={styles.statsText}>
                      First published: <span style={styles.statsValue}>{earliest.track?.name}</span> <span style={styles.statsYear}>({minYear || 'N/A'})</span>
                    </div>
                    <div style={styles.statsText}>
                      Most recent: <span style={styles.statsValue}>{latest.track?.name}</span> <span style={styles.statsYear}>({maxYear || 'N/A'})</span>
                    </div>
                    <div style={styles.statsText}>
                      Total listening time: <span style={styles.statsValue}>{formattedTime}</span>
                    </div>
                  </div>
                );
              }
            })()}
            
            {/* Songs list - unified responsive design */}
            <div
              ref={songsListRef}
              style={{
                ...styles.songsListContainer,
                padding: isMobile ? '20px 0 20px 20px' : styles.songsListContainer.padding,
                maxHeight: isMobile ? 300 : styles.songsListContainer.maxHeight,
                width: '100%',
                boxSizing: 'border-box'
              }}>
              <div style={styles.songsListTitle}>Included Songs:</div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', width: '100%' }}>
                {analyzedTracks.map((r, i) => {
                  // Extract main genre from metadata.tags.genre
                  const firstKey = Object.keys(r.highLevel || {})[0];
                  const mainGenre = r.highLevel?.[firstKey]?.metadata?.tags?.genre || 'Unknown';
                  
                  // Extract genre rosamerica and map to readable names
                  const genreRosamericaRaw = r.highLevel?.[firstKey]?.highlevel?.genre_rosamerica?.value || 'Unknown';
                  const rosamericaMap = {
                    'cla': 'Classical',
                    'dan': 'Dance',
                    'hip': 'Hip-Hop',
                    'jaz': 'Jazz',
                    'pop': 'Pop',
                    'rhy': 'Rhythm & Blues',
                    'roc': 'Rock',
                    'spe': 'Speech'
                  };
                  const genreRosamerica = rosamericaMap[genreRosamericaRaw] || genreRosamericaRaw;
                  
                  return (
                  <li key={r.track?.id || i} className="songs-list-item" style={{
                    ...styles.songListItem,
                    width: '100%',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    <span style={{ color: '#d1d5db' }}>{i + 1}.</span> <span style={{ color: '#fff' }}>{r.track?.name}</span> <span style={{ color: '#38bdf8', fontWeight: 600 }}>by {r.track?.artist || (r.track?.artists ? r.track.artists.map(a => a.name).join(', ') : '')}</span>
                      <div style={{ 
                        marginTop: 4, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ 
                          background: 'rgba(28, 185, 85, 0.2)', 
                          color: '#1cb955', 
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid rgba(28, 185, 85, 0.4)'
                        }}>
                          Main: {mainGenre}
                        </span>
                        <span style={{ 
                          background: 'rgba(56, 189, 248, 0.2)', 
                          color: '#38bdf8', 
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid rgba(56, 189, 248, 0.4)'
                        }}>
                          Rosamerica: {genreRosamerica}
                        </span>
                      </div>
                  </li>
                  );
                })}
              </ul>
            </div>
            
            <div style={styles.callToAction}>
              Ready to see your stats?
            </div>
          </div>
        )}
        {page === 1 && (
          <ComprehensiveDashboard 
            analyzedTracks={analyzedTracks} 
            totalBeats={totalBeats} 
            avgBeats={avgBeats} 
            isMobile={isMobile} 
          />
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: 36,
          marginBottom: isMobile ? 16 : 24,
          gap: isMobile ? 24 : 32
        }}>
          <button onClick={goPrev} disabled={page === 0} style={{ 
            opacity: page === 0 ? 0.4 : 1, 
            ...styles.navButton,
            ...(prevButtonHover && !page === 0 ? styles.navButtonHover : {}),
            cursor: page === 0 ? 'default' : 'pointer',
            width: isMobile ? '48px' : '56px',
            height: isMobile ? '48px' : '56px',
            minWidth: isMobile ? '48px' : '56px'
          }} onMouseEnter={() => setPrevButtonHover(true)} onMouseLeave={() => setPrevButtonHover(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"}>
              <path d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20V11Z"/>
            </svg>
          </button>
          {page === totalPages - 1 ? (
            <button onClick={onClose} style={{
              ...styles.navButton,
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              minWidth: isMobile ? '48px' : '56px',
              minHeight: isMobile ? '48px' : '56px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"}>
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          ) : (
            <button onClick={goNext} disabled={page === totalPages - 1} style={{ 
              opacity: page === totalPages - 1 ? 0.4 : 1, 
              ...styles.navButton,
              ...(nextButtonHover && !page === totalPages - 1 ? styles.navButtonHover : {}),
              cursor: page === totalPages - 1 ? 'default' : 'pointer',
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              minWidth: isMobile ? '48px' : '56px'
            }} onMouseEnter={() => setNextButtonHover(true)} onMouseLeave={() => setNextButtonHover(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} style={{ transform: 'rotate(180deg)' }}>
                <path d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20V11Z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Animated Beats Page ---
function AnimatedBeatsPage({ totalBeats, avgBeats, styles }) {
  const [displayedBeats, setDisplayedBeats] = useState(0);
  const [showLine1, setShowLine1] = useState(false);
  const [showBeats, setShowBeats] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showLine2, setShowLine2] = useState(false);
  useEffect(() => {
    setDisplayedBeats(0);
    setShowLine1(false);
    setShowBeats(false);
    setShowPulse(false);
    setShowLine2(false);
    // Staggered fade-in
    const t1 = setTimeout(() => setShowLine1(true), 200);
    const t2 = setTimeout(() => setShowBeats(true), 700);
    const t3 = setTimeout(() => setShowPulse(true), 1200);
    const t4 = setTimeout(() => setShowLine2(true), 1800);
    // Animated counter
    let start = 0;
    let duration = 1200;
    let startTime;
    function animateCount(ts) {
      if (!startTime) startTime = ts;
      let progress = Math.min((ts - startTime) / duration, 1);
      let val = Math.floor(progress * totalBeats);
      setDisplayedBeats(val.toLocaleString());
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayedBeats(totalBeats.toLocaleString());
      }
    }
    const tCounter = setTimeout(() => requestAnimationFrame(animateCount), 700);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(tCounter);
    };
  }, [totalBeats]);
  return (
    <div style={{ textAlign: 'center', padding: '0 12px' }}>
      <h2 style={{
        ...styles.beatsPageTitle,
        ...(!showLine1 ? fadeOut : fadeIn),
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.7s',
        transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
        transitionDelay: '0s'
      }}>Total Beat Count</h2>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          ...styles.beatsPageText,
          ...(!showLine1 ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.1s'
        }}>
          You have in total of
        </div>
        <div style={{
          ...styles.beatsPageNumber,
          ...(!showBeats ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.3s'
        }}>{displayedBeats}</div>
        <div style={{
          ...styles.beatsPageText,
          ...(!showPulse ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.5s'
        }}>beats</div>
        <div style={{
          ...styles.beatsPageSubtext,
          ...(!showLine2 ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.7s'
        }}>
          That's <span style={{ color: '#38bdf8', fontWeight: 900 }}>{avgBeats}</span> beats per song on average.
        </div>
      </div>
      <div style={{
        ...styles.beatsPageFooter,
        ...(!showLine2 ? fadeOut : fadeIn),
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.7s',
        transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
        transitionDelay: '0.9s'
      }}>
        More stats coming up next!
      </div>
    </div>
  );
}

// --- MetricBarCharts component ---
function MetricBarCharts({ analyzedTracks, styles }) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey(k => k + 1); }, [analyzedTracks]); // retrigger on page show
  
  // Helper to get average for a highlevel metric (probability of main value)
  function getAvgHighlevel(key) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      // The data is nested under the first key (usually "0")
      const firstKey = Object.keys(r.highLevel || {})[0];
      const val = r.highLevel?.[firstKey]?.highlevel?.[key]?.probability;
      if (typeof val === 'number') { sum += val; count++; }
    });
    return count ? sum / count : 0;
  }
  
  // Helper for binary metrics (e.g. mood_acoustic, mood_aggressive, etc.)
  function getAvgBinary(key, positiveValue) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      // The data is nested under the first key (usually "0")
      const firstKey = Object.keys(r.highLevel || {})[0];
      const all = r.highLevel?.[firstKey]?.highlevel?.[key]?.all;
      if (all && typeof all[positiveValue] === 'number') { sum += all[positiveValue]; count++; }
    });
    return count ? sum / count : 0;
  }
  // Chart data
  const metrics = [
    { label: 'Danceability', color: '#22d3ee', value: getAvgHighlevel('danceability') },
    { label: 'Acousticness', color: '#38bdf8', value: getAvgBinary('mood_acoustic', 'acoustic') },
    { label: 'Aggressiveness', color: '#f87171', value: getAvgBinary('mood_aggressive', 'aggressive') },
    { label: 'Electronicness', color: '#818cf8', value: getAvgBinary('mood_electronic', 'electronic') },
    { label: 'Happiness', color: '#fde047', value: getAvgBinary('mood_happy', 'happy') },
    { label: 'Partiness', color: '#fbbf24', value: getAvgBinary('mood_party', 'party') },
    { label: 'Relaxedness', color: '#34d399', value: getAvgBinary('mood_relaxed', 'relaxed') },
    { label: 'Melancholicness', color: '#60a5fa', value: getAvgBinary('mood_sad', 'sad') },
  ];
  return (
    <div>
      {metrics.map((m, i) => {
        const barWidth = `${Math.round(m.value * 100)}%`;
        const barKey = `${animKey}-${m.label}`;
        return (
          <div key={m.label} style={styles.metricBarChart}>
            <span style={styles.metricLabel}>{m.label}</span>
            <div style={styles.metricBar}>
              <div
                key={barKey}
                style={{
                  width: barWidth,
                  background: m.color,
                  height: '100%',
                  borderRadius: styles.metricBar.borderRadius,
                  animation: `fill-bar 1s cubic-bezier(.4,0,.2,1)`,
                  animationName: 'fill-bar',
                  animationDuration: '1s',
                  animationTimingFunction: 'cubic-bezier(.4,0,.2,1)',
                  animationFillMode: 'forwards',
                  animationDelay: '0s',
                  '--bar-width': barWidth,
                }}
              />
            </div>
            <span style={styles.metricValue}>{Math.round(m.value * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// --- BinaryBarCharts component ---
function BinaryBarCharts({ analyzedTracks, styles }) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Helper to get average for a binary highlevel metric
  function getAvgBinary(key, left, right) {
    let leftSum = 0, rightSum = 0, count = 0;
    analyzedTracks.forEach(r => {
      // The data is nested under the first key (usually "0")
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
  // Metrics config
  const colorLeft = '#B22222';
  const colorRight = '#60a5fa'; // light blue
  const metrics = [
    {
      label: 'Gender',
      left: 'Male',
      right: 'Female',
      colorLeft,
      colorRight,
      avg: getAvgBinary('gender', 'male', 'female')
    },
    {
      label: 'Timbre',
      left: 'Dark',
      right: 'Bright',
      colorLeft,
      colorRight,
      avg: getAvgBinary('timbre', 'dark', 'bright')
    },
    {
      label: 'Tonality',
      left: 'Atonal',
      right: 'Tonal',
      colorLeft,
      colorRight,
      avg: getAvgBinary('tonal_atonal', 'atonal', 'tonal')
    },
    {
      label: 'Voice',
      left: 'Vocal',
      right: 'Instrumental',
      colorLeft,
      colorRight,
      avg: getAvgBinary('voice_instrumental', 'voice', 'instrumental')
    },
  ];
  return (
    <div>
      {metrics.map((m, i) => {
        const leftPct = Math.round(m.avg.left * 100);
        const rightPct = Math.round(m.avg.right * 100);
        const leftBarKey = `${animKey}-left-${m.label}`;
        const rightBarKey = `${animKey}-right-${m.label}`;
        // Animate towards the dominant side
        const animateRight = rightPct > leftPct;
        const leftDominant = leftPct >= rightPct;
        const rightDominant = rightPct > leftPct;
        return (
          <div key={m.label} style={styles.binaryBarChart}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ 
                color: leftDominant ? '#fff' : '#b0b6be', 
                fontWeight: leftDominant ? 700 : 500, 
                ...styles.binaryBarLabel 
              }}>
                {m.left} <span style={{ fontWeight: leftDominant ? 700 : 500 }}>{leftPct}%</span>
              </span>
              <span style={{ 
                color: rightDominant ? '#fff' : '#b0b6be', 
                fontWeight: rightDominant ? 700 : 500, 
                ...styles.binaryBarLabel 
              }}>
                <span style={{ fontWeight: rightDominant ? 700 : 500 }}>{rightPct}%</span> {m.right}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={styles.binaryBarContainer}>
                {/* Left fill (dark red, left to right) */}
                <div
                  key={leftBarKey}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: 0,
                    background: colorLeft,
                    borderTopLeftRadius: styles.binaryBarContainer.borderRadius,
                    borderBottomLeftRadius: styles.binaryBarContainer.borderRadius,
                    borderTopRightRadius: leftPct === 100 ? styles.binaryBarContainer.borderRadius : 0,
                    borderBottomRightRadius: leftPct === 100 ? styles.binaryBarContainer.borderRadius : 0,
                    animation: `fill-bar-left 1s cubic-bezier(.4,0,.2,1) forwards`,
                    animationName: 'fill-bar-left',
                    animationDuration: '1s',
                    animationTimingFunction: 'cubic-bezier(.4,0,.2,1)',
                    animationFillMode: 'forwards',
                    animationDelay: '0s',
                    '--bar-width': `${leftPct}%`,
                    zIndex: 1,
                  }}
                />
                {/* Right fill (light blue, right to left) */}
                <div
                  key={rightBarKey}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: '100%',
                    width: 0,
                    background: colorRight,
                    borderTopRightRadius: styles.binaryBarContainer.borderRadius,
                    borderBottomRightRadius: styles.binaryBarContainer.borderRadius,
                    borderTopLeftRadius: rightPct === 100 ? styles.binaryBarContainer.borderRadius : 0,
                    borderBottomLeftRadius: rightPct === 100 ? styles.binaryBarContainer.borderRadius : 0,
                    animation: `fill-bar-right 1s cubic-bezier(.4,0,.2,1) forwards`,
                    animationName: 'fill-bar-right',
                    animationDuration: '1s',
                    animationTimingFunction: 'cubic-bezier(.4,0,.2,1)',
                    animationFillMode: 'forwards',
                    animationDelay: '0s',
                    '--bar-width': `${rightPct}%`,
                    zIndex: 2,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

// --- GenreLeaderboards component ---
function GenreLeaderboards({ analyzedTracks, styles, isMobile }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Helper to get leaderboard for a highlevel classifier
  function getLeaderboard(key) {
    const counts = {};
    analyzedTracks.forEach(r => {
      // The data is nested under the first key (usually "0")
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
      // The data is nested under the first key (usually "0")
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
      // Skip extremely long tags (likely data dumps)
      if (rawGenre.length > 50) return;
      
      // Skip useless generic tags
      if (['genre', 'other', 'misc', 'various', 'unknown'].includes(rawGenre.toLowerCase())) return;
      
      // Normalize the genre
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
    
    // Skip if too long or generic
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
      // Capitalize first letter and return the first meaningful word
      return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    
    return null;
  }
  
  // Human-friendly mappings for genre codes
  const rosamericaMap = {
    pop: 'Pop', rhy: 'Rhythm & Blues', hip: 'Hip-Hop', roc: 'Rock', dan: 'Dance', spe: 'Speech', ele: 'Electronic', jaz: 'Jazz', ins: 'Instrumental', fol: 'Folk', bla: 'Blues', cou: 'Country', reg: 'Reggae', sou: 'Soul', fun: 'Funk', lat: 'Latin', met: 'Metal', pun: 'Punk', cla: 'Classical', exp: 'Experimental', amb: 'Ambient', wor: 'World', blu: 'Blues', rap: 'Rap', '': ''
  };
  const tzanetakisMap = {
    blu: 'Blues', cla: 'Classical', cou: 'Country', dis: 'Disco', hip: 'Hip-Hop', jaz: 'Jazz', met: 'Metal', pop: 'Pop', reg: 'Reggae', roc: 'Rock', '': ''
  };
  const ismirMap = {
    ChaChaCha: 'Cha-Cha-Cha', Jive: 'Jive', Quickstep: 'Quickstep', RumbaAmerican: 'Rumba (American)', RumbaInternational: 'Rumba (International)', Rumba: 'Rumba', Samba: 'Samba', Tango: 'Tango', VienneseWaltz: 'Viennese Waltz', Waltz: 'Waltz', '': ''
  };
  const mirexMap = {
    cluster1: 'Quiet Moments', cluster2: 'Dance & Social Vibe', cluster3: 'Calm & Focused', cluster4: 'Power Up', cluster5: 'Beat-Driven & Lyrical',
    Cluster1: 'Quiet Moments', Cluster2: 'Dance & Social Vibe', Cluster3: 'Calm & Focused', Cluster4: 'Power Up', Cluster5: 'Beat-Driven & Lyrical',
    '': ''
  };
  const metrics = [
    { label: 'Main Genre Tags', key: 'metadata_genre', isMetadata: true },
    { label: 'Genre Rosamerica', key: 'genre_rosamerica', map: rosamericaMap },
    { label: 'Mood Classification', key: 'moods_mirex', isMood: true, map: mirexMap },
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
                  return (
                    <span
                      key={val}
                      style={{
                        ...styles.genreTag,
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

// --- ChordsHistogram component ---
function ChordsHistogram({ analyzedTracks, styles }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Aggregate major and minor chords
  const chordNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let majorCounts = Array(12).fill(0);
  let minorCounts = Array(12).fill(0);
  analyzedTracks.forEach(r => {
      // The data is nested under the first key (usually "0")
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

// --- ComprehensiveDashboard component ---
function ComprehensiveDashboard({ analyzedTracks, totalBeats, avgBeats, isMobile }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);

  // Chart.js charts effect
  useEffectReact(() => {
    // Check if Chart.js is available
    if (typeof window !== 'undefined' && window.Chart) {
      createChordsCharts();
    } else {
      // Load Chart.js dynamically if not available
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = createChordsCharts;
      document.head.appendChild(script);
    }
  }, [analyzedTracks]);

  function createChordsCharts() {
    // Wait for Chart.js to be available
    if (typeof window === 'undefined' || !window.Chart) {
      setTimeout(createChordsCharts, 100);
      return;
    }

    const Chart = window.Chart;
    
    // Chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
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
            font: {
              size: isMobile ? 8 : 12
            },
            maxTicksLimit: isMobile ? 4 : 6
          },
          grid: {
            color: '#535353'
          }
        },
        x: {
          ticks: {
            color: '#b3b3b3',
            font: {
              size: isMobile ? 8 : 12
            },
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Prepare chord data
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

    // Create Major Chords Chart
    const majorCtx = document.getElementById('majorChordsChart');
    if (majorCtx) {
      // Destroy existing chart if it exists
      if (majorCtx.chart) {
        majorCtx.chart.destroy();
      }
      
      majorCtx.chart = new Chart(majorCtx, {
        type: 'bar',
        data: {
          labels: chordNames,
          datasets: [{
            label: 'Major Chord Duration',
            data: majorData,
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
      // Destroy existing chart if it exists
      if (minorCtx.chart) {
        minorCtx.chart.destroy();
      }
      
      minorCtx.chart = new Chart(minorCtx, {
        type: 'bar',
        data: {
          labels: chordNames.map(name => name + 'm'),
          datasets: [{
            label: 'Minor Chord Duration',
            data: minorData,
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
      position: 'relative'
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
        <header style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40 }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            marginBottom: isMobile ? 6 : 8
          }}>
            Your Music DNA
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
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 16 : 32
        }}>

          {/* Genre & Rhythm Leaderboards - Full Width */}
          <div style={{
            gridColumn: isMobile ? '1' : '1 / -1',
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
              Genre & Rhythm Leaderboards
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
            background: 'rgba(33, 33, 33, 0.5)',
            padding: isMobile ? 16 : 24,
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #535353',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 600,
              color: '#b3b3b3',
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
              color: '#b3b3b3'
            }}>
              That's <span style={{ fontWeight: 700, color: '#fff' }}>{avgBeats}</span> beats per song on average.
            </p>
          </div>

          {/* Binary Audio Features */}
          <div style={{
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
                      <span className="binary-feature-label">{feature.left} ({leftPct}%)</span>
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

                  {/* Chords Histogram - Full Width */}
          <div style={{
            gridColumn: isMobile ? '1' : '1 / -1',
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
                width: isMobile ? '100%' : '50%'
              }}>
                <canvas id="minorChordsChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 