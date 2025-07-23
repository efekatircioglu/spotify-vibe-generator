import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useState as useStateReact, useEffect as useEffectReact } from 'react';

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

  // Aggregate data for all analyzed tracks
  const { analyzedTracks, skippedTracks, totalBeats, avgBeats } = useMemo(() => {
    const analyzed = results.filter(r => r.highLevel && r.lowLevel);
    const skipped = results.filter(r => !(r.highLevel && r.lowLevel));
    let totalBeats = 0;
    analyzed.forEach(r => {
      const beats = r.lowLevel?.rhythm?.beats_count || r.lowLevel?.beats_count || 0;
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
  const totalPages = 6;
  const goNext = () => setPage(p => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage(p => Math.max(p - 1, 0));

  // --- Auto-scroll logic for songs list ---
  const songsListRef = useRef(null);
  useEffect(() => {
    if (page !== 0) return;
    const container = songsListRef.current;
    if (!container) return;
    let direction = 1; // 1 = down, -1 = up
    let animationFrame;
    let startTime;
    let duration = 7000; // ms for full scroll down or up
    let maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;

    function animateScroll(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      let progress = Math.min(elapsed / duration, 1);
      if (direction === 1) {
        container.scrollTop = progress * maxScroll;
      } else {
        container.scrollTop = (1 - progress) * maxScroll;
      }
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateScroll);
      } else {
        direction *= -1;
        startTime = undefined;
        animationFrame = requestAnimationFrame(animateScroll);
      }
    }
    animationFrame = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [analyzedTracks, page]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#181c24', borderRadius: 24, padding: 72, minWidth: 600, minHeight: 700, boxShadow: '0 12px 64px #000b', color: '#fff', position: 'relative', maxWidth: 900, width: '100%' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 1, right: 1, background: 'none', border: 'none', color: 'rgb(255, 255, 255)', fontSize: 32, cursor: 'pointer', zIndex: 10 }}>&times;</button>
        {page === 0 && (
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 28, letterSpacing: 1 }}>Your Songs Wrapped</h2>
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
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: '1.4rem', color: '#38bdf8', fontWeight: 800, marginBottom: 10 }}>
                    First published: <span style={{ color: '#fff', fontWeight: 700 }}>{earliest.track?.name}</span> <span style={{ color: '#d1d5db', fontWeight: 500 }}>({minYear || 'N/A'})</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', color: '#38bdf8', fontWeight: 800, marginBottom: 10 }}>
                    Most recent: <span style={{ color: '#fff', fontWeight: 700 }}>{latest.track?.name}</span> <span style={{ color: '#d1d5db', fontWeight: 500 }}>({maxYear || 'N/A'})</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', color: '#38bdf8', fontWeight: 800, marginBottom: 10 }}>
                    Total listening time: <span style={{ color: '#fff', fontWeight: 700 }}>{formattedTime}</span>
                  </div>
                </div>
              );
            })()}
            <div
              ref={songsListRef}
              style={{ margin: '32px 0 0 0', textAlign: 'left', maxHeight: 340, overflowY: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px 0 28px 28px', boxShadow: '0 2px 16px #0003', transition: 'scrollTop 0.5s' }}>
              <div style={{ fontWeight: 900, color: '#fff', marginBottom: 18, fontSize: '1.5rem', letterSpacing: 0.5 }}>Included Songs:</div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {analyzedTracks.map((r, i) => (
                  <li key={r.track?.id || i} style={{ color: '#d1d5db', fontSize: 18, marginBottom: 8, lineHeight: 1.25 }}>
                    <span style={{ color: '#d1d5db' }}>{i + 1}.</span> <span style={{ color: '#fff' }}>{r.track?.name}</span> <span style={{ color: '#38bdf8', fontWeight: 600 }}>by {r.track?.artist || (r.track?.artists ? r.track.artists.map(a => a.name).join(', ') : '')}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 48, fontSize: 22, color: '#38bdf8', fontWeight: 900 }}>
              Ready to see your stats?
            </div>
          </div>
        )}
        {page === 1 && (
          <AnimatedBeatsPage totalBeats={totalBeats} avgBeats={avgBeats} />
        )}
        {page === 2 && (
          <div style={{ padding: 36, background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)', borderRadius: 24, minHeight: 500, maxWidth: 600, margin: '0 auto', boxShadow: '0 8px 48px #000b' }}>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, marginBottom: 32, textAlign: 'center', letterSpacing: 1 }}>The Average Audio Profile</h2>
            <MetricBarCharts analyzedTracks={analyzedTracks} />
          </div>
        )}
        {page === 3 && (
          <div style={{ padding: 36, background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)', borderRadius: 24, minHeight: 400, maxWidth: 600, margin: '0 auto', boxShadow: '0 8px 48px #000b' }}>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, marginBottom: 32, textAlign: 'center', letterSpacing: 1 }}>Binary Audio Features</h2>
            <BinaryBarCharts analyzedTracks={analyzedTracks} />
          </div>
        )}
        {page === 4 && (
          <div style={{ padding: 36, background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)', borderRadius: 24, minHeight: 400, maxWidth: 600, margin: '0 auto', boxShadow: '0 8px 48px #000b' }}>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, marginBottom: 32, textAlign: 'center', letterSpacing: 1 }}>Genre & Rhythm Leaderboards</h2>
            <GenreLeaderboards analyzedTracks={analyzedTracks} />
          </div>
        )}
        {page === 5 && (
          <div style={{ padding: 36, background: 'linear-gradient(120deg, #232b39 0%, #181c24 100%)', borderRadius: 24, minHeight: 400, maxWidth: 600, margin: '0 auto', boxShadow: '0 8px 48px #000b' }}>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>Chords Histogram</h2>
            <div style={{ color: '#b0b6be', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
              Average percentage of major and minor chords heard in the track.
            </div>
            <ChordsHistogram analyzedTracks={analyzedTracks} />
            <div style={{ color: '#b0b6be', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
              For each chord, this value shows the average proportion of time (per song) that the chord is present, based on all analyzed tracks.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
          <button onClick={goPrev} disabled={page === 0} style={{ opacity: page === 0 ? 0.4 : 1, background: 'none', border: '1.5px solid #38bdf8', color: '#38bdf8', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 18, cursor: page === 0 ? 'default' : 'pointer', transition: 'background 0.18s' }}>
            Prev
          </button>
          {page === totalPages - 1 ? (
            <button onClick={onClose} style={{ background: '#38bdf8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 4px 24px #000a', transition: 'background 0.18s' }}>
              Close
            </button>
          ) : (
            <button onClick={goNext} disabled={page === totalPages - 1} style={{ opacity: page === totalPages - 1 ? 0.4 : 1, background: '#38bdf8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 18, cursor: page === totalPages - 1 ? 'default' : 'pointer', boxShadow: '0 4px 24px #000a', transition: 'background 0.18s' }}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Animated Beats Page ---
function AnimatedBeatsPage({ totalBeats, avgBeats }) {
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
        fontSize: '2.5rem', fontWeight: 900, marginBottom: 18, letterSpacing: 1,
        ...(!showLine1 ? fadeOut : fadeIn),
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.7s',
        transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
        transitionDelay: '0s'
      }}>Total Beat Count</h2>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontSize: '2rem', color: '#e5e7eb', fontWeight: 700, marginBottom: 16, width: '100%',
          ...(!showLine1 ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.1s'
        }}>
          You have in total of
        </div>
        <div style={{
          fontSize: '4rem', fontWeight: 900, color: '#38bdf8', margin: '18px 0 0 0', textShadow: '0 2px 24px #38bdf8aa', width: '100%',
          ...(!showBeats ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.3s'
        }}>{displayedBeats}</div>
        <div style={{
          fontSize: '2rem', color: '#e5e7eb', fontWeight: 700, margin: '24px 0 18px 0', width: '100%',
          ...(!showPulse ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.5s'
        }}>beats</div>
        <div style={{
          fontSize: '1.6rem', color: '#b0b6be', fontWeight: 600, marginBottom: 16, width: '100%',
          ...(!showLine2 ? fadeOut : fadeIn),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.7s',
          transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
          transitionDelay: '0.7s'
        }}>
          That’s <span style={{ color: '#38bdf8', fontWeight: 900 }}>{avgBeats}</span> beats per song on average.
        </div>
      </div>
      <div style={{
        marginTop: 32, fontSize: 18, color: '#38bdf8', fontWeight: 700,
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
function MetricBarCharts({ analyzedTracks }) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey(k => k + 1); }, [analyzedTracks]); // retrigger on page show
  // Helper to get average for a highlevel metric (probability of main value)
  function getAvgHighlevel(key) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const val = r.highLevel?.highlevel?.[key]?.probability;
      if (typeof val === 'number') { sum += val; count++; }
    });
    return count ? sum / count : 0;
  }
  // Helper for binary metrics (e.g. mood_acoustic, mood_aggressive, etc.)
  function getAvgBinary(key, positiveValue) {
    let sum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const all = r.highLevel?.highlevel?.[key]?.all;
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
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, width: 170 }}>{m.label}</span>
            <div style={{ flex: 1, margin: '0 18px', background: '#2d3142', borderRadius: 16, height: 16, position: 'relative', overflow: 'hidden' }}>
              <div
                key={barKey}
                style={{
                  width: barWidth,
                  background: m.color,
                  height: '100%',
                  borderRadius: 16,
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
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, width: 48, textAlign: 'right' }}>{Math.round(m.value * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// --- BinaryBarCharts component ---
function BinaryBarCharts({ analyzedTracks }) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Helper to get average for a binary highlevel metric
  function getAvgBinary(key, left, right) {
    let leftSum = 0, rightSum = 0, count = 0;
    analyzedTracks.forEach(r => {
      const all = r.highLevel?.highlevel?.[key]?.all;
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
          <div key={m.label} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: leftDominant ? '#fff' : '#b0b6be', fontWeight: leftDominant ? 700 : 500, fontSize: 18 }}>
                {m.left} <span style={{ fontWeight: leftDominant ? 700 : 500 }}>{leftPct}%</span>
              </span>
              <span style={{ color: rightDominant ? '#fff' : '#b0b6be', fontWeight: rightDominant ? 700 : 500, fontSize: 18 }}>
                <span style={{ fontWeight: rightDominant ? 700 : 500 }}>{rightPct}%</span> {m.right}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, margin: '0 0px', background: '#1e293b', borderRadius: 16, height: 18, position: 'relative', overflow: 'hidden' }}>
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
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                    borderTopRightRadius: leftPct === 100 ? 16 : 0,
                    borderBottomRightRadius: leftPct === 100 ? 16 : 0,
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
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                    borderTopLeftRadius: rightPct === 100 ? 16 : 0,
                    borderBottomLeftRadius: rightPct === 100 ? 16 : 0,
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
function GenreLeaderboards({ analyzedTracks }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Helper to get leaderboard for a highlevel classifier
  function getLeaderboard(key) {
    const counts = {};
    analyzedTracks.forEach(r => {
      const val = r.highLevel?.highlevel?.[key]?.value;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
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
    cluster1: 'Cluster 1', cluster2: 'Cluster 2', cluster3: 'Cluster 3', cluster4: 'Cluster 4', cluster5: 'Cluster 5', '': ''
  };
  const metrics = [
    { label: 'Genre Dortmund', key: 'genre_dortmund' },
    { label: 'Genre Electronic', key: 'genre_electronic' },
    { label: 'Genre Rosamerica', key: 'genre_rosamerica', map: rosamericaMap },
    { label: 'Genre Tzanetakis', key: 'genre_tzanetakis', map: tzanetakisMap },
    { label: 'Rhythm (ISMIR04)', key: 'ismir04_rhythm', map: ismirMap },
    { label: 'Mood (MIREX)', key: 'moods_mirex', map: mirexMap },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {metrics.map((m, metricIdx) => {
        const leaderboard = getLeaderboard(m.key);
        const revealed = useStaggeredReveal(leaderboard.length, animKey + '-' + m.key);
        return (
          <div key={m.key}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{m.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {leaderboard.length === 0 ? (
                <span style={{ color: '#b0b6be', fontSize: 16 }}>No data</span>
              ) : (
                leaderboard.map(([val, count], i) => {
                  const displayVal = m.map ? (m.map[val] || val) : val;
                  return (
                    <span
                      key={val}
                      style={{
                        background: '#232b39',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: 16,
                        borderRadius: 8,
                        padding: '4px 14px',
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
function ChordsHistogram({ analyzedTracks }) {
  const [animKey, setAnimKey] = useStateReact(0);
  useEffectReact(() => { setAnimKey(k => k + 1); }, [analyzedTracks]);
  // Helper to find the most dominant chord in a song
  function getDominantChords(hist) {
    if (!Array.isArray(hist) || hist.length !== 24) return { major: null, minor: null };
    let maxMaj = 0, maxMajIdx = 0, maxMin = 0, maxMinIdx = 0;
    for (let i = 0; i < 12; i++) {
      if (hist[i] > maxMaj) { maxMaj = hist[i]; maxMajIdx = i; }
      if (hist[i + 12] > maxMin) { maxMin = hist[i + 12]; maxMinIdx = i; }
    }
    return {
      major: maxMaj > 0 ? maxMajIdx : null,
      minor: maxMin > 0 ? maxMinIdx : null
    };
  }
  // Aggregate major and minor chords
  const chordNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let majorCounts = Array(12).fill(0);
  let minorCounts = Array(12).fill(0);
  // For summary: count how many songs have each chord as the most dominant
  let majorMostCounts = Array(12).fill(0);
  let minorMostCounts = Array(12).fill(0);
  analyzedTracks.forEach(r => {
    const hist = r.analysisData?.tonal?.chords_histogram || r.lowLevel?.tonal?.chords_histogram || r.highLevel?.tonal?.chords_histogram;
    if (Array.isArray(hist) && hist.length === 24) {
      for (let i = 0; i < 12; i++) {
        majorCounts[i] += hist[i];
        minorCounts[i] += hist[i + 12];
      }
      const dom = getDominantChords(hist);
      if (dom.major !== null) majorMostCounts[dom.major]++;
      if (dom.minor !== null) minorMostCounts[dom.minor]++;
    }
  });
  // Convert to leaderboard
  const numTracks = analyzedTracks.length || 1;
  const majorLeaderboard = chordNames.map((name, i) => [name, majorCounts[i] / numTracks]).sort((a, b) => b[1] - a[1]);
  const minorLeaderboard = chordNames.map((name, i) => [name + 'm', minorCounts[i] / numTracks]).sort((a, b) => b[1] - a[1]);
  // Most dominant summary
  const majorMostSummary = chordNames.map((name, i) => [name, majorMostCounts[i]]).sort((a, b) => b[1] - a[1]).filter(([, count]) => count > 0).slice(0, 3);
  const minorMostSummary = chordNames.map((name, i) => [name + 'm', minorMostCounts[i]]).sort((a, b) => b[1] - a[1]).filter(([, count]) => count > 0).slice(0, 3);
  const majorRevealed = useStaggeredRevealChord(majorLeaderboard.length, animKey + '-maj');
  const minorRevealed = useStaggeredRevealChord(minorLeaderboard.length, animKey + '-min');
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Major Chords</div>
        {majorLeaderboard.map(([chord, count], i) => (
          <div key={chord} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232b39', color: '#38bdf8', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '4px 14px', marginBottom: 6, opacity: majorRevealed[i] ? 1 : 0, transform: majorRevealed[i] ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)', transitionDelay: `${i * 0.08 + 0.1}s` }}>
            <span>{chord}</span>
            <span>{count.toFixed(1)}%</span>
          </div>
        ))}
        <div style={{ marginTop: 18 }}>
          <div style={{ color: '#b0b6be', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Most Dominant Major Chords</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {majorMostSummary.map(([chord, count]) => (
              <div key={chord} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181c24', borderRadius: 6, padding: '2px 10px', fontSize: 15 }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{chord}</span>
                <span style={{ color: '#b0b6be', fontWeight: 600 }}>{count} song{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Minor Chords</div>
        {minorLeaderboard.map(([chord, count], i) => (
          <div key={chord} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232b39', color: '#f87171', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '4px 14px', marginBottom: 6, opacity: minorRevealed[i] ? 1 : 0, transform: minorRevealed[i] ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)', transitionDelay: `${i * 0.08 + 0.1}s` }}>
            <span>{chord}</span>
            <span>{count.toFixed(1)}%</span>
          </div>
        ))}
        <div style={{ marginTop: 18 }}>
          <div style={{ color: '#b0b6be', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Most Dominant Minor Chords</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {minorMostSummary.map(([chord, count]) => (
              <div key={chord} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181c24', borderRadius: 6, padding: '2px 10px', fontSize: 15 }}>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{chord}</span>
                <span style={{ color: '#b0b6be', fontWeight: 600 }}>{count} song{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 