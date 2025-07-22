import React, { useState, useEffect } from 'react';
import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Legend } from 'chart.js';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {
  getTrackISRC,
  setTrackISRC,
  getTrackMBID,
  setTrackMBID
} from '../utils/trackAnalysisCache';
import { setAnalysis } from '../utils/trackAnalysis';

ChartJS.register(ArcElement, Legend);

// FuelGauge component (copied from page.js)
function FuelGauge({ label, value, color = '#8B5CF6', extraLabel }) {
  const clampedLeft = Math.max(4, Math.min(value - 6, 88));
  return (
    <div style={{ margin: '28px 0 18px 0', transition: 'box-shadow 0.2s', boxShadow: '0 1px 6px #8B5CF611' }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        {label}
        {extraLabel && <span style={{ color: '#aaa', fontWeight: 500, fontSize: 15 }}>{extraLabel}</span>}
      </div>
      <div style={{ position: 'relative', height: 22, background: '#e5e7eb', borderRadius: 11, overflow: 'hidden', width: '100%', minWidth: 400, maxWidth: 800 }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: 11,
          transition: 'width 0.4s',
        }} />
        <div style={{ position: 'absolute', left: `${value}%`, top: 0, height: '100%', width: 2, background: '#fff', opacity: 0.7 }} />
        <div style={{ position: 'absolute', left: `${clampedLeft}%`, top: 0, height: '100%', width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 800, fontSize: 16 }}>
          {value.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// Helper to render a metric safely
function renderMetric(label, value) {
  if (typeof value === 'object' && value !== null) {
    // Show mean, min, max, or a summary for objects
    const parts = [];
    if (value.mean !== undefined) parts.push(`mean: ${value.mean}`);
    if (value.median !== undefined) parts.push(`median: ${value.median}`);
    if (value.min !== undefined) parts.push(`min: ${value.min}`);
    if (value.max !== undefined) parts.push(`max: ${value.max}`);
    if (value.dmean !== undefined) parts.push(`dmean: ${value.dmean}`);
    if (parts.length === 0) parts.push(JSON.stringify(value));
    return (
      <div>{label}: <b>{parts.join(' | ')}</b></div>
    );
  }
  return <div>{label}: <b>{value}</b></div>;
}

// Helper for a simple progress bar
function ProgressBar({ value, max = 1, color = '#8B5CF6', label, style = {} }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ margin: '8px 0 12px 0', ...style }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#fff' }}>{label}</div>
      <div style={{ position: 'relative', height: 16, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', width: '100%', minWidth: 400, maxWidth: 800 }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${percent}%`,
          background: color,
          borderRadius: 8,
          transition: 'width 0.4s',
        }} />
        <div style={{ position: 'absolute', left: `${percent}%`, top: 0, height: '100%', width: 2, background: '#fff', opacity: 0.7 }} />
        <div style={{ position: 'absolute', left: `${Math.max(4, Math.min(percent - 6, 88))}%`, top: 0, height: '100%', width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 800, fontSize: 14 }}>
          {Math.round(percent)}%
        </div>
      </div>
    </div>
  );
}

// Tooltip component
function Tooltip({ text, children }) {
  const [visible, setVisible] = React.useState(false);
  const [direction, setDirection] = React.useState('bottom');
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const tooltipRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (visible && wrapperRef.current && tooltipRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      let top, left;
      // Default: show below
      top = wrapperRect.bottom + 8;
      left = wrapperRect.left + wrapperRect.width / 2;
      let newDirection = 'bottom';
      // If tooltip would overflow bottom, show above
      if (top + tooltipRect.height > viewportHeight - 16) {
        top = wrapperRect.top - tooltipRect.height - 8;
        newDirection = 'top';
      }
      // If tooltip would overflow top, show below
      if (top < 16) {
        top = wrapperRect.bottom + 8;
        newDirection = 'bottom';
      }
      setCoords({ top, left });
      setDirection(newDirection);
    }
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-50%)',
            background: '#232323',
            color: '#fff',
            padding: '18px 24px',
            borderRadius: 10,
            boxShadow: '0 4px 24px #000a',
            fontSize: 16,
            zIndex: 9999,
            minWidth: 340,
            maxWidth: 480,
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              [direction === 'top' ? 'top' : 'bottom']: -8,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: direction === 'top' ? '8px solid #232323' : 'none',
              borderBottom: direction === 'bottom' ? '8px solid #232323' : 'none',
            }}
          />
          <div style={{ width: '100%', color: '#fff', fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: text }} />
        </div>,
        document.body
      )}
    </span>
  );
}

// Definitions for tooltips
const METRIC_DEFINITIONS = {
  bpm: `<b>BPM (Beats Per Minute) 🥁</b><br/><br/>BPM measures the tempo or speed of a song in Beats Per Minute. It's the most fundamental way to understand a song's energy level. A low BPM suggests a slower, more relaxed track, while a high BPM indicates a faster, more energetic song.<br/><br/><b>Below 70 BPM (Very Slow):</b> Typical for ambient music, drones, and very slow ballads.<br/><br/><b>70 - 90 BPM (Relaxed Pace):</b> A common tempo for hip-hop, lo-fi, and chill-out tracks.<br/><br/><b>90 - 110 BPM (Groovy/Moderate):</b> The "walking pace" of music. Found in many pop, funk, and mid-tempo rock songs.<br/><br/><b>110 - 130 BPM (Upbeat):</b> The classic tempo for pop and mainstream dance music.<br/><br/><b>Above 130 BPM (Fast/Very Fast):</b> Found in high-energy genres like techno, pop-punk, drum & bass, and metal.`,
  beats: `<b>Beats (Total Beat Count)</b><br/><br/>The Total Beat Count is the number of primary rhythmic pulses detected in a song from start to finish. This metric is highly dependent on both the song's length and its BPM. A low count often suggests a sparse or short track, while a high count indicates a long or fast-paced song.<br/><br/><b>Below 300 Beats (Low Count):</b> Typical for very slow ballads, ambient tracks, or short songs.<br/><br/><b>300 - 500 Beats (Medium Count):</b> A very common range for standard 3-4 minute pop, rock, and hip-hop tracks.<br/><br/><b>500 - 700 Beats (High Count):</b> Often found in faster music like upbeat pop and dance tracks.<br/><br/><b>Above 700 Beats (Very High Count):</b> Common in very fast genres like drum & bass, or long electronic tracks.`,
  groove: `<b>Groove (Rhythmic Density)</b><br/><br/>Groove measures the rhythmic complexity by counting how many new sound events (like drum hits or notes) occur per second. It tells you how "busy" or "dense" the rhythm is.<br/><br/><b>0 - 2 onsets/sec (Simple Groove):</b> A sparse, minimalist rhythm. Found in ambient music or slow ballads.<br/><br/><b>2 - 5 onsets/sec (Steady Groove):</b> The standard level of activity for most pop, rock, and hip-hop.<br/><br/><b>5 - 8 onsets/sec (Complex Groove):</b> A busy and dense rhythm with many layers. Common in funk, jazz, and some electronic music.<br/><br/><b>Above 8 onsets/sec (Very Complex Groove):</b> Extremely dense and intricate, often found in genres like drum & bass or fast metal.`,
  key: `<b>Key (Musical Harmony) 🎼</b><br/><br/>The Key is the musical scale (a group of notes) that a song is built around, defining its harmonic "home base." The key strongly influences a song's mood. The confidence score shows how clearly the song follows the rules of that key.`,
  melodyClarity: `<b>Melody Clarity</b><br/><br/>Melody Clarity measures how clear and prominent the main melody is. A high score means the melody is distinct and easy to follow (like a lead vocal or a synth line), while a low score suggests a more ambient or textural sound where no single instrument dominates.<br/><br/><b>Below 30% (Ambient Texture):</b> The song is primarily textural, with no single, clear melody.<br/><br/><b>30% - 70% (Balanced):</b> The melody is present but may share focus with other instruments.<br/><br/><b>Above 70% (Clear & Prominent):</b> The song has a very strong, easily identifiable melody.`,
  harmonicTension: `<b>Harmonic Tension</b><br/><br/>Harmonic Tension measures the amount of "dissonance" or "harshness" in the song's harmonies. It's not about being "good" or "bad," but about emotional character.<br/><br/><b>Below 30% (Smooth & Resolved):</b> The harmonies are very pleasant and conventional.<br/><br/><b>30% - 60% (Balanced Tension):</b> A standard level of tension that keeps the song engaging.<br/><br/><b>Above 60% (Tense & Edgy):</b> The harmonies are more complex and can create a feeling of suspense or raw emotion. This is common in jazz, blues, and some rock genres.`,
  volume: `<b>Volume (Average Loudness) 🔊</b><br/><br/>Volume reflects the average loudness of the track after being normalized to a standard level. This indicates how consistently loud the track is.<br/><br/><b>Below 60% (Soft / Very Dynamic):</b> The track likely has very quiet sections or a soft overall production.<br/><br/><b>60% - 85% (Moderate):</b> A good balance of loudness and dynamics.<br/><br/><b>Above 85% (Consistently Loud):</b> Very little change in overall volume. Common in modern pop, rock, and electronic music due to studio compression.`,
  dynamicRange: `<b>Dynamic Range</b><br/><br/>Dynamic Range measures the variation between the quietest and loudest moments within the song. It tells you how much the volume "breathes."<br/><br/><b>Score &lt; 2 (Steady Volume):</b> Low dynamic range, often due to heavy studio compression. Common in modern pop and metal.<br/><br/><b>Score 2 - 4 (Moderate Range):</b> A natural and balanced dynamic feel.<br/><br/><b>Score &gt; 4 (Very Dynamic):</b> Significant changes in volume between sections, common in classical, jazz, and live performances.`,
  silence: `<b>Silence</b><br/><br/>Silence is the percentage of the song's duration that is considered very quiet or completely silent. This metric gives clues about the song's arrangement and structure.<br/><br/><b>&lt; 5% (Almost None):</b> A continuous soundscape with very few breaks. Ideal for maintaining focus.<br/><br/><b>5% - 20% (Some Breaks):</b> The song has noticeable pauses or rests, common in songs with clear verse/chorus structures.<br/><br/><b>&gt; 20% (Frequent Pauses):</b> The arrangement is very sparse, with significant gaps between musical phrases.`,
  brightness: `<b>Brightness (Spectral Centroid) 🔬</b><br/><br/>Brightness is like the "center of gravity" for the song's sound, measured in Hertz (Hz). It tells you whether the track is dominated by low-end bass frequencies or high-end treble frequencies.<br/><br/><b>&lt; 1000 Hz (Dark Sound):</b> A warm, bass-heavy sound with a focus on basslines and lower-register instruments.<br/><br/><b>1000 - 2500 Hz (Balanced Sound):</b> A good mix of bass, mids, and treble. Most well-mixed tracks fall in this range.<br/><br/><b>&gt; 2500 Hz (Bright Sound):</b> A crisp, trebly sound with more energy in hi-hats, cymbals, and higher-register synths.`,
  texture: `<b>Texture (Spectral Contrast)</b><br/><br/>Texture describes how "punchy" or "blended" the instruments sound together. It's determined by measuring the difference between the loudest and quietest frequencies in the mix.<br/><br/><b>Punchy & Clear:</b> There is a sharp distinction between instruments. This is common in funk, pop, and genres where rhythmic clarity is important.<br/><br/><b>Smooth & Blended:</b> The instruments and sounds merge into a more cohesive and immersive soundscape. This is common in ambient, orchestral, and shoegaze music.`,
  layering: `<b>Layering (Spectral Complexity)</b><br/><br/>Layering provides an estimate of how many different instruments or sound layers are playing at the same time.<br/><br/><b>Score &lt; 8 (Simple & Clean):</b> A minimalist arrangement, like a solo artist or a basic rock trio.<br/><br/><b>Score 8 - 16 (Balanced):</b> A standard, full-sounding production with multiple instruments and vocal layers.<br/><br/><b>Score &gt; 16 (Rich & Layered):</b> A very dense and complex arrangement, common in orchestral music, dense electronic tracks, or "wall of sound" productions.`,
};

export default function SongAnalysisModal({
  open,
  onClose,
  songInfo,
}) {
  const [songISRC, setSongISRC] = useState('');
  const [isISRCLoading, setIsISRCLoading] = useState(false);
  const [songMBID, setSongMBID] = useState('');
  const [isMBIDLoading, setIsMBIDLoading] = useState(false);
  const [acousticMetrics, setAcousticMetrics] = useState(null);
  const [isAcousticLoading, setIsAcousticLoading] = useState(false);
  const [genreError, setGenreError] = useState(false);
  const [lowLevelMetrics, setLowLevelMetrics] = useState(null);
  const [isLowLevelLoading, setIsLowLevelLoading] = useState(false);
  const [lowLevelError, setLowLevelError] = useState(false);

  const genreColors = {
    Trance: '#4B0082',
    Ambient: '#00CED1',
    House: '#FFD700',
    Techno: '#FF6347',
    Dnb: '#9ACD32',
  };
  const defaultColors = [
    '#1db954', '#6ee7b7', '#a5b4fc', '#fbbf24', '#f87171', '#f472b6', '#60a5fa', '#facc15', '#34d399', '#818cf8'
  ];

  // Helper to fetch both high and low-level metrics
  async function fetchAcousticData(mbid) {
    if (!mbid || mbid === 'Not Found') return;
    setIsAcousticLoading(true);
    setIsLowLevelLoading(true);

    try {
      const [highLevel, lowLevel] = await Promise.all([
        fetch(`https://acousticbrainz.org/${mbid}/high-level`).then(res => res.ok ? res.json() : Promise.reject()),
        fetch(`http://127.0.0.1:8000/${mbid}/low-level`).then(res => res.ok ? res.json() : Promise.reject())
      ]);
      setAcousticMetrics(highLevel);
      setLowLevelMetrics(lowLevel);
      // Store in analysis_cache if both are not empty
      if (highLevel && lowLevel && Object.keys(highLevel).length > 0 && Object.keys(lowLevel).length > 0) {
        setAnalysis(mbid, { highLevel, lowLevel });
      }
    } catch (e) {
      setAcousticMetrics('Not Found');
      setGenreError(true);
      setLowLevelError(true);
      setLowLevelMetrics(null);
    } finally {
      setIsAcousticLoading(false);
      setIsLowLevelLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !songInfo) return;
    let cancelled = false;
    setSongISRC('');
    setIsISRCLoading(true);
    setSongMBID('');
    setIsMBIDLoading(false);
    setAcousticMetrics(null);
    setIsAcousticLoading(false);
    setGenreError(false);
    setLowLevelMetrics(null);
    setIsLowLevelLoading(false);
    setLowLevelError(false);

    const spotifyId = songInfo.id;
    const cachedISRC = getTrackISRC(spotifyId);
    const cachedMBID = getTrackMBID(spotifyId);

    async function analyze() {
      let isrc = cachedISRC;
      let mbid = cachedMBID;
      if (isrc) {
        setSongISRC(isrc);
      }
      if (mbid) {
        setSongMBID(mbid);
        if (!cancelled && mbid && mbid !== 'Not Found') {
          fetchAcousticData(mbid);
        }
        setIsISRCLoading(false);
        setIsMBIDLoading(false);
        return;
      }
      // Fetch ISRC if not cached
      try {
        const isrcRes = await fetch(`http://127.0.0.1:8000/track-isrc/${spotifyId}`);
        if (!isrcRes.ok) throw new Error();
        const isrcData = await isrcRes.json();
        isrc = isrcData.isrc || 'Not found';
        setSongISRC(isrc);
        setTrackISRC(spotifyId, isrc);
      } catch {
        setSongISRC('Not found');
        setIsISRCLoading(false);
        return;
      }
      if (!isrc || isrc === 'Not found') {
        setSongMBID('');
        setAcousticMetrics(null);
        setGenreError(true);
        setLowLevelMetrics(null);
        setIsAcousticLoading(false);
        setIsLowLevelLoading(false);
        return;
      }
      // Fetch MBID if not cached
      try {
        setIsMBIDLoading(true);
        const mbidRes = await fetch(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`, {
          headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
        });
        if (!mbidRes.ok) throw new Error();
        const mbidData = await mbidRes.json();
        mbid = mbidData.recordings && mbidData.recordings.length > 0 ? mbidData.recordings[0].id : null;
        setSongMBID(mbid || 'Not Found');
        setTrackMBID(spotifyId, mbid || 'Not Found');
        if (!cancelled && mbid) {
          fetchAcousticData(mbid);
        } else {
          setAcousticMetrics(null);
          setLowLevelMetrics(null);
          setIsAcousticLoading(false);
          setIsLowLevelLoading(false);
        }
      } catch {
        setSongMBID('Not Found');
        setTrackMBID(spotifyId, 'Not Found');
        setAcousticMetrics(null);
        setLowLevelMetrics(null);
        setIsAcousticLoading(false);
        setIsLowLevelLoading(false);
      } finally {
        setIsMBIDLoading(false);
      }
    }
    analyze();
    return () => { cancelled = true; };
  }, [open, songInfo]);

  if (!open || !songInfo) return null;

  // Shine animation keyframes
  const shineKeyframes = `@keyframes shine { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }`;

  // Helper for Beats label
  function getBeatsLabel(beats) {
    if (typeof beats !== 'number') return '';
    if (beats < 300) return 'Low';
    if (beats < 500) return 'Medium';
    if (beats < 700) return 'High';
    return 'Very High';
  }
  // Helper for Groove label UX
  function getGrooveLabelUX(onsetRate) {
    if (typeof onsetRate !== 'number') return '';
    if (onsetRate < 2) return 'Simple';
    if (onsetRate < 5) return 'Steady';
    if (onsetRate < 8) return 'Complex';
    return 'Very Complex';
  }

  // Helper for Melody Clarity label
  function getMelodyClarityLabel(val) {
    if (typeof val !== 'number') return '';
    if (val < 0.3) return 'Ambient Texture';
    if (val < 0.7) return 'Balanced';
    return 'Clear & Prominent';
  }
  // Helper for Harmonic Tension label
  function getHarmonicTensionLabel(val) {
    if (typeof val !== 'number') return '';
    if (val < 0.3) return 'Smooth & Resolved';
    if (val < 0.6) return 'Balanced Tension';
    return 'Tense & Edgy';
  }

  // Helper for Texture label
  function getTextureLabel(val) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    if (val < 2) return 'Smooth';
    if (val < 4) return 'Balanced';
    return 'Textured';
  }

  // Helper for Brightness label
  function getBrightnessLabel(val) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    if (val < 1500) return 'Warm';
    if (val < 3000) return 'Balanced';
    return 'Bright';
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(20,20,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxHeight: 650, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#444 #232323', padding: '56px 48px 40px 48px', background: '#18181b', borderRadius: 24, minWidth: 420, minHeight: 320, boxShadow: '0 8px 48px #000b', position: 'relative' }}>
        <style>{`
          ${shineKeyframes}
          /* Chrome, Edge, Safari */
          div[style*='overflow-y: auto']::-webkit-scrollbar {
            width: 8px;
            background: #232323;
            border-radius: 6px;
          }
          div[style*='overflow-y: auto']::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 6px;
          }
          div[style*='overflow-y: auto']::-webkit-scrollbar-track {
            background: #232323;
            border-radius: 6px;
          }
        `}</style>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2 }}>×</button>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 34, margin: 0, letterSpacing: 1, fontFamily: 'Playfair Display, Georgia, serif' }}>Genre Breakdown</h2>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginTop: 6, fontFamily: 'Playfair Display, Georgia, serif' }}>
            {songInfo.name} - {songInfo.artist}
          </div>
        </div>
        <table style={{ width: '100%', marginBottom: 16 }}>
          <tbody>
            {isAcousticLoading ? (
              <tr><td colSpan={2}>Loading...</td></tr>
            ) : (!songMBID || songMBID === 'Not Found' || genreError || acousticMetrics === null) ? (
              <tr><td colSpan={2} style={{ textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 24, padding: 40, letterSpacing: 1 }}>
                No genre data available for this song.
              </td></tr>
            ) : acousticMetrics && acousticMetrics.highlevel && acousticMetrics.highlevel.genre_dortmund && acousticMetrics.highlevel.genre_dortmund.all ? (
              (() => {
                const dortmund = acousticMetrics.highlevel.genre_dortmund.all;
                const mainGenreEntry = Object.entries(dortmund).reduce((a, b) => a[1] > b[1] ? a : b);
                const mainGenre = mainGenreEntry[0];
                const mainGenreProb = mainGenreEntry[1];
                const subGenreModel = acousticMetrics.highlevel[`genre_${mainGenre}`];
                const subGenres = subGenreModel && subGenreModel.all ? subGenreModel.all : null;
                const subGenreEntries = subGenres ? Object.entries(subGenres).sort((a, b) => b[1] - a[1]) : [];
                const chartData = {
                  labels: subGenreEntries.map(([sub]) => sub.charAt(0).toUpperCase() + sub.slice(1)),
                  datasets: [
                    {
                      data: subGenreEntries.map(([, prob]) => (prob * 100).toFixed(1)),
                      backgroundColor: subGenreEntries.map(([sub], idx) => {
                        const name = sub.charAt(0).toUpperCase() + sub.slice(1);
                        return genreColors[name] || defaultColors[idx % defaultColors.length];
                      }),
                      borderWidth: 2,
                    },
                  ],
                };
                return (
                  <>
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '24px 0 12px 0' }}>
                        <style>{shineKeyframes}</style>
                        <div style={{
                          display: 'inline-block',
                          position: 'relative',
                          background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 50%, #8B5CF6 100%)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          borderRadius: 999,
                          padding: '12px 36px',
                          boxShadow: '0 2px 12px #8B5CF633',
                          letterSpacing: 1,
                          marginBottom: 6,
                          textShadow: '0 2px 8px #0002',
                          overflow: 'hidden',
                          minWidth: 120,
                          minHeight: 40,
                          transition: 'transform 0.15s',
                          cursor: 'pointer',
                          backgroundSize: '200% 100%',
                          animation: 'shine 2.5s linear infinite',
                        }}>
                          {mainGenre.charAt(0).toUpperCase() + mainGenre.slice(1)}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#6D28D9', fontWeight: 700, marginTop: 6 }}>
                          {(mainGenreProb * 100).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                    {subGenreEntries.length > 0 && (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', padding: 16 }}>
                          <div style={{ width: 220, height: 220, margin: '0 auto' }}>
                            <Doughnut data={chartData} options={{ plugins: { legend: { display: false } } }} />
                          </div>
                          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                            {subGenreEntries.map(([sub, prob], idx) => {
                              const name = sub.charAt(0).toUpperCase() + sub.slice(1);
                              const color = genreColors[name] || chartData.datasets[0].backgroundColor[idx % chartData.datasets[0].backgroundColor.length];
                              return (
                                <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                                  <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: color, marginRight: 6 }}></span>
                                  <span>{name}: {(prob * 100).toFixed(1)}%</span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Summary section below the donut chart */}
                          <div
                            style={{
                              marginTop: 32,
                              textAlign: 'left',
                              maxWidth: 600,
                              margin: '32px auto 0 auto',
                              background: '#232323',
                              borderRadius: 22,
                              boxShadow: '0 4px 24px #8B5CF611',
                              padding: '32px 48px 28px 48px',
                              fontSize: 16,
                              color: '#fff',
                              lineHeight: 1.8,
                              fontFamily: 'Inter, sans-serif',
                              position: 'relative',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, letterSpacing: 1, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ display: 'inline-block', width: 6, height: 28, borderRadius: 4, background: 'linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%)', marginRight: 8 }}></span>
                              Song Analysis
                            </div>
                            {/* Happiness: happiness */}
                            {acousticMetrics.highlevel.mood_happy && (
                              <FuelGauge left="" right="" label="Happiness" value={acousticMetrics.highlevel.mood_happy.value === 'happy' ? acousticMetrics.highlevel.mood_happy.probability * 100 : 100 - acousticMetrics.highlevel.mood_happy.probability * 100} color="#fbbf24" />
                            )}
                            {/* Acousticness: acousticness */}
                            {acousticMetrics.highlevel.mood_acoustic && (
                              <FuelGauge left="" right="" label="Acousticness" value={acousticMetrics.highlevel.mood_acoustic.value === 'acoustic' ? acousticMetrics.highlevel.mood_acoustic.probability * 100 : 100 - acousticMetrics.highlevel.mood_acoustic.probability * 100} color="#f87171" />
                            )}
                            {/* Electronicness: electronicness */}
                            {acousticMetrics.highlevel.mood_electronic && (
                              <FuelGauge left="" right="" label="Electronicness" value={acousticMetrics.highlevel.mood_electronic.value === 'electronic' ? acousticMetrics.highlevel.mood_electronic.probability * 100 : 100 - acousticMetrics.highlevel.mood_electronic.probability * 100} color="#60a5fa" />
                            )}
                            {/* Brightness: swap so high value means bright */}
                            {acousticMetrics.highlevel.timbre && (
                              <FuelGauge left="" right="" label="Brightness" value={acousticMetrics.highlevel.timbre.value === 'bright' ? acousticMetrics.highlevel.timbre.probability * 100 : 100 - acousticMetrics.highlevel.timbre.probability * 100} color="#818cf8" />
                            )}
                            {/* Tonality: tonality */}
                            {acousticMetrics.highlevel.tonal_atonal && (
                              <FuelGauge left="" right="" label="Tonality" value={acousticMetrics.highlevel.tonal_atonal.value === 'tonal' ? acousticMetrics.highlevel.tonal_atonal.probability * 100 : 100 - acousticMetrics.highlevel.tonal_atonal.probability * 100} color="#8B5CF6" />
                            )}
                            {/* Danceability: danceability */}
                            {acousticMetrics.highlevel.danceability && (
                              <FuelGauge left="" right="" label="Danceability" value={acousticMetrics.highlevel.danceability.value === 'danceable' ? acousticMetrics.highlevel.danceability.probability * 100 : 100 - acousticMetrics.highlevel.danceability.probability * 100} color="#facc15" />
                            )}
                            {/* Instrumental-Voice: last element as pie chart, clean version */}
                            {acousticMetrics.highlevel.voice_instrumental && (
                              (() => {
                                const voiceProb = acousticMetrics.highlevel.voice_instrumental.value === 'voice'
                                  ? acousticMetrics.highlevel.voice_instrumental.probability
                                  : 1 - acousticMetrics.highlevel.voice_instrumental.probability;
                                const instrumentalProb = 1 - voiceProb;
                                return (
                                  <div style={{ margin: '32px 0 18px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#fff' }}>Instrumental / Voice</div>
                                    <div style={{ width: 120, height: 120, margin: '0 auto' }}>
                                      <Pie
                                        data={{
                                          labels: ['Instrumental', 'Voice'],
                                          datasets: [
                                            {
                                              data: [instrumentalProb * 100, voiceProb * 100],
                                              backgroundColor: ['#a90432', '#fdb912'],
                                              borderWidth: 0,
                                            },
                                          ],
                                        }}
                                        options={{
                                          plugins: {
                                            legend: { display: false },
                                          },
                                          cutout: 0,
                                          responsive: false,
                                          maintainAspectRatio: false,
                                        }}
                                        width={120}
                                        height={120}
                                      />
                                    </div>
                                    <div style={{ marginTop: 10, color: '#fff', fontWeight: 600, fontSize: 15 }}>
                                      Instrumental: {(instrumentalProb * 100).toFixed(1)}% / Voice: {(voiceProb * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                            {/* Genre summary */}
                            <div style={{ marginTop: 18, fontWeight: 600, color: '#fff', fontSize: 16, textAlign: 'center' }}>
                              <span style={{ fontWeight: 800 }}>Genre:</span> Primarily {mainGenre.charAt(0).toUpperCase() + mainGenre.slice(1)}{subGenreEntries.length > 0 ? ` and ${subGenreEntries[0][0].charAt(0).toUpperCase() + subGenreEntries[0][0].slice(1)}` : ''}.
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })()
            ) : (
              <tr><td colSpan={2}>No genre data available for this song.</td></tr>
            )}
          </tbody>
        </table>
        {lowLevelMetrics && !isLowLevelLoading && !lowLevelError && (() => {
          // Rhythm and tonal are top-level; lowlevel contains only low-level metrics
          const bpm = lowLevelMetrics.rhythm?.bpm > 0 ? Math.round(lowLevelMetrics.rhythm.bpm) : "Unknown";
          const beats = lowLevelMetrics.rhythm?.beats_count ?? "Unknown";
          const onsetRate = lowLevelMetrics.rhythm?.onset_rate ?? 0;
          let groove = "Unknown";
          if (onsetRate > 0) {
            if (onsetRate < 3) groove = `Simple Groove (${onsetRate.toFixed(1)} onsets/sec)`;
            else if (onsetRate < 6) groove = `Steady Groove (${onsetRate.toFixed(1)} onsets/sec)`;
            else groove = `Complex Groove (${onsetRate.toFixed(1)} onsets/sec)`;
          }
          // Low-level metrics are inside lowlevel, fallback to top-level if missing
          const ll = lowLevelMetrics.lowlevel || lowLevelMetrics;
          const pitchSalience = ll.pitch_salience && ll.pitch_salience.mean !== undefined ? ll.pitch_salience.mean : ll.pitch_salience;
          const dissonance = ll.dissonance && ll.dissonance.mean !== undefined ? ll.dissonance.mean : ll.dissonance;
          const tuning = ll.tuning_frequency ? Math.round(ll.tuning_frequency) : null;
          const centroid = ll.spectral_centroid && ll.spectral_centroid.mean !== undefined ? ll.spectral_centroid.mean : ll.spectral_centroid;
          // --- FIX FOR TEXTURE (Spectral Contrast) ---
          const contrastArray = ll.spectral_contrast_coeffs?.mean;
          let textureScore = 'N/A';
          if (Array.isArray(contrastArray) && contrastArray.length > 0) {
            const sum = contrastArray.reduce((acc, value) => acc + value, 0);
            const average = sum / contrastArray.length;
            textureScore = average.toFixed(1);
          }
          const textureLabel = getTextureLabel(parseFloat(textureScore));
          const complexity = ll.spectral_complexity && ll.spectral_complexity.mean !== undefined ? ll.spectral_complexity.mean : ll.spectral_complexity;
          const dynamic = ll.dynamic_complexity && ll.dynamic_complexity.mean !== undefined ? ll.dynamic_complexity.mean : ll.dynamic_complexity;
          const silence = ll.silence_rate_60dB && ll.silence_rate_60dB.mean !== undefined ? ll.silence_rate_60dB.mean : ll.silence_rate_60dB;
          const avgLoudness = ll.average_loudness && ll.average_loudness.mean !== undefined ? ll.average_loudness.mean : ll.average_loudness;

          // Qualitative/UX helpers
          function getBpmLabel(bpm) {
            if (!bpm) return '';
            if (bpm < 70) return 'Very Slow';
            if (bpm < 90) return 'Relaxed Pace';
            if (bpm < 110) return 'Groovy';
            if (bpm < 130) return 'Upbeat';
            return 'Very Fast';
          }
          function getVolumeLabel(loudness) {
            if (loudness === undefined) return '';
            if (loudness > 0.8) return 'Consistently Loud';
            if (loudness > 0.5) return 'Moderate';
            return 'Soft';
          }
          function getDynamicLabelUX(dynamic) {
            if (dynamic < 2) return 'Steady';
            if (dynamic < 4) return 'Moderate';
            return 'Very Dynamic';
          }
          function getSilenceLabelUX(silence) {
            if (silence < 0.05) return 'Almost none';
            if (silence < 0.2) return 'Some breaks';
            return 'Frequent';
          }
          function getLayeringLabelUX(complexity) {
            if (complexity < 8) return 'Simple & Clean';
            if (complexity < 16) return 'Balanced';
            return 'Rich & Layered';
          }

          // Pitch & Harmony
          const keyName = lowLevelMetrics.tonal?.key_key;
          const keyScale = lowLevelMetrics.tonal?.key_scale;
          const keyStrength = lowLevelMetrics.tonal?.key_strength;
          const key = (keyName && keyScale)
            ? `${keyName} ${keyScale}`
            : "Unknown";

          

          return (
            <div style={{
              marginTop: 40,
              textAlign: 'left',
              maxWidth: 600,
              margin: '40px auto 0 auto',
              background: '#18181b',
              borderRadius: 22,
              boxShadow: '0 4px 24px #8B5CF611',
              padding: '32px 48px 28px 48px',
              fontSize: 16,
              color: '#fff',
              lineHeight: 1.8,
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              border: '1px solid #333',
            }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, letterSpacing: 1, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 6, height: 28, borderRadius: 4, background: 'linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%)', marginRight: 8 }}></span>
                Low-Level Audio Analysis
              </div>
              {/* Rhythm & Tempo */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Rhythm & Tempo 🥁</div>
                <div style={{ marginBottom: 4 }}><Tooltip text={METRIC_DEFINITIONS.bpm}>BPM:</Tooltip> <b>{bpm}</b>{bpm && bpm !== "Unknown" && <span style={{ color: '#aaa', fontSize: 14 }}> ({getBpmLabel(bpm)})</span>}</div>
                <div style={{ marginBottom: 4 }}>
                  <Tooltip text={METRIC_DEFINITIONS.beats}>Beats:</Tooltip> <b>{beats}</b>
                  {typeof beats === 'number' &&
                    <span style={{ color: '#aaa', fontSize: 13, marginLeft: 6 }}>({getBeatsLabel(beats)})</span>
                  }
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Tooltip text={METRIC_DEFINITIONS.groove}>Groove:</Tooltip> <b>{onsetRate > 0 ? `${onsetRate.toFixed(1)} onsets/sec` : 'Unknown'}</b>
                  {onsetRate > 0 && <span style={{ color: '#aaa', fontSize: 13, marginLeft: 6 }}>({getGrooveLabelUX(onsetRate)})</span>}
                </div>
              </div>
              {/* Pitch & Harmony */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Pitch & Harmony 🎼</div>
                <div style={{ marginBottom: 4 }}><Tooltip text={METRIC_DEFINITIONS.key}>Key:</Tooltip> <b>{key}</b>
                  {keyStrength !== null && keyStrength !== undefined && (
                    <span style={{ color: '#aaa', fontSize: 13, marginLeft: 6 }}>({Math.round(keyStrength * 100)}%)</span>
                  )}
                </div>
                {/* Low-level key metrics if present */}
                {ll.key_key && ll.key_scale && (
                  <div style={{ marginBottom: 4 }}>
                    <Tooltip text={METRIC_DEFINITIONS.key}>Low-Level Key:</Tooltip> <b>{ll.key_key} {ll.key_scale}</b>
                    {ll.key_strength !== undefined && (
                      <span style={{ color: '#aaa', fontSize: 14 }}> ({Math.round(ll.key_strength * 100)}% confidence)</span>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: 4 }}>
                  <Tooltip text={METRIC_DEFINITIONS.melodyClarity}>
                    <span style={{ fontWeight: 700 }}>Melody Clarity:</span>
                    <span style={{ color: '#aaa', fontSize: 13, marginLeft: 6 }}>({getMelodyClarityLabel(pitchSalience)})</span>
                    <FuelGauge label={null} value={(pitchSalience || 0) * 100} color="#fbbf24" />
                  </Tooltip>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Tooltip text={METRIC_DEFINITIONS.harmonicTension}>
                    <span style={{ fontWeight: 700 }}>Harmonic Tension:</span>
                    <span style={{ color: '#aaa', fontSize: 13, marginLeft: 6 }}>({getHarmonicTensionLabel(dissonance)})</span>
                    <FuelGauge label={null} value={(dissonance || 0) * 100} color="#f87171" />
                  </Tooltip>
                </div>
                {tuning && <div>Tuning: <b>{tuning} Hz</b></div>}
              </div>
              {/* Dynamics & Loudness */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Dynamics & Loudness 🔊</div>
                <div style={{ marginBottom: 16 }}>
                  <Tooltip text={METRIC_DEFINITIONS.volume}>
                    <FuelGauge label="Volume" value={(avgLoudness || 0) * 100} color="#8B5CF6" extraLabel={avgLoudness !== undefined ? `(${getVolumeLabel(avgLoudness)})` : undefined} />
                  </Tooltip>
                </div>
                <div style={{ marginBottom: 4 }}><Tooltip text={METRIC_DEFINITIONS.dynamicRange}>Dynamic Range:</Tooltip> <b>{getDynamicLabelUX(dynamic || 0)}</b> <span style={{ color: '#aaa', fontSize: 14 }}>(Score: {dynamic ? dynamic.toFixed(1) : 'N/A'})</span></div>
                <div style={{ marginBottom: 8 }}><Tooltip text={METRIC_DEFINITIONS.silence}>Silence:</Tooltip> <b>{getSilenceLabelUX(silence || 0)}</b> <span style={{ color: '#aaa', fontSize: 14 }}>({silence ? (silence * 100).toFixed(1) + '%' : 'N/A'})</span></div>
              </div>
              {/* Spectral Profile */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Spectral Profile 🔬</div>
                <div style={{ marginBottom: 4 }}><Tooltip text={METRIC_DEFINITIONS.brightness}>Brightness:</Tooltip> <b>{centroid ? Math.round(centroid) + ' Hz' : 'N/A'}</b> <span style={{ color: '#aaa', fontSize: 14 }}>({getBrightnessLabel(centroid || 0)})</span></div>
                <div style={{ marginBottom: 4 }}><Tooltip text={METRIC_DEFINITIONS.texture}>Texture:</Tooltip>
                  <b> {textureLabel} </b>
                  <span style={{ color: '#aaa', fontSize: 14 }}>(Score: {textureScore})</span>
                </div>
                <div style={{ marginBottom: 8 }}><Tooltip text={METRIC_DEFINITIONS.layering}>Layering:</Tooltip> <b>{getLayeringLabelUX(complexity || 0)}</b> <span style={{ color: '#aaa', fontSize: 14 }}>(Score: {complexity ? complexity.toFixed(1) : 'N/A'})</span></div>
              </div>
            </div>
          );
        })()}
        {isLowLevelLoading && (
          <div style={{ marginTop: 32, textAlign: 'center', color: '#8B5CF6', fontWeight: 700 }}>Loading low-level analysis...</div>
        )}
        {/* Only show low-level error if MBID exists and low-level fetch fails, and genreError is not also true */}
        {songMBID && songMBID !== 'Not Found' && lowLevelError && !genreError && (
          <div style={{ marginTop: 32, textAlign: 'center', color: '#f87171', fontWeight: 700 }}>Low-level analysis not available for this song.</div>
        )}
      </div>
    </div>
  );
}

SongAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
}; 