import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../../public/styles.css' ;


const tooltips = { danceability: "Classifies whether a track is suitable for dancing based on rhythmic patterns.", 
    gender: "Identifies the gender of the primary vocalist.",
     genre_dortmund: "Classifies the track into one of nine broad genres based on the Dortmund model.",
      genre_electronic: "Classifies the track into sub-genres of electronic music.", 
      genre_rosamerica: "Classifies the track based on the Rosamerica genre taxonomy.", 
      genre_tzanetakis: "Classifies the track based on the Tzanetakis genre collection.", 
      ismir04_rhythm: "Classifies the track's rhythm into ballroom dance styles.", 
      mood_acoustic: "Detects the presence of acoustic instruments.",
       mood_aggressive: "Detects if the track has an aggressive or intense mood.",
        mood_electronic: "Detects the presence of electronic instruments and sounds.",
         mood_happy: "Detects if the track has a happy, cheerful mood.", 
         mood_party: "Detects if the track is suitable for a party atmosphere.",
          mood_relaxed: "Detects if the track has a relaxed, calm mood.",
           mood_sad: "Detects if the track has a sad or melancholic mood.",
            moods_mirex: "Classifies the track's mood into one of five clusters from the MIREX challenge.", 
            timbre: "Describes the textural quality of the sound (bright vs. dark).",
             tonal_atonal: "Distinguishes between music with a clear tonal center (tonal) and music without (atonal).", voice_instrumental: "Classifies whether the track is primarily vocal or instrumental.", 
             average_loudness: "A measure of the perceived loudness of the track, normalized to a 0-1 range.", dynamic_complexity: "Complexity of loudness changes over time. Higher values mean more variation.", rhythm_danceability: "How suitable a track is for dancing, based on tempo, regularity, and beat strength.", 
             bpm: "Beats Per Minute, the tempo of the music.", 
             beats_count: "Total number of detected beats in the track.",
              key_strength: "The confidence level of the detected musical key.", 
              spectral_centroid: "Indicates the 'center of mass' of the sound spectrum. Higher values mean 'brighter' sounds.", melbands: "Represents the energy in different frequency bands, modeled after human hearing.", 
              chords_histogram: "Shows the relative presence of each of the 12 major and 12 minor chords.", 
              key: "The estimated musical key of the track, consisting of a tonic (e.g., C, G#) and a scale (major or minor).", thpcp: "Tonal Harmonic Pitch Class Profile (THPCP) shows the strength of each of the 12 musical pitch classes, providing a detailed view of the track's harmonic content." };
              
const interpretations = { danceability: { not_danceable: "The track's rhythm is more suited for listening than dancing, likely due to its complexity or lack of a strong, regular beat." }, gender: { female: "A female vocalist is identified as the primary voice in this track.", male: "A male vocalist is identified as the primary voice in this track." }, genre_dortmund: { electronic: "The track is predominantly electronic, characterized by synthesized sounds and programmed beats." }, genre_electronic: { ambient: "This piece falls into the ambient sub-genre, suggesting a focus on atmosphere and texture over rhythm." }, genre_rosamerica: { hip: "The song aligns with the Hip-Hop genre, likely featuring rhythmic speech and strong basslines." }, genre_tzanetakis: { jaz: "Elements of Jazz are prominent, possibly including improvisation, swing rhythms, or characteristic instrumentation." }, ismir04_rhythm: { ChaChaCha: "The rhythm has characteristics of a Cha-Cha-Cha, with a syncopated 4/4 time signature." }, mood_acoustic: { not_acoustic: "The sound is primarily driven by electronic or amplified instruments, not acoustic ones." }, mood_aggressive: { not_aggressive: "The track lacks harsh, driving elements, creating a non-aggressive and likely smoother listening experience." }, mood_electronic: { electronic: "The sonic palette is dominated by synthesizers, drum machines, or other electronic sources." }, mood_happy: { not_happy: "The musical cues suggest a mood that is not overtly happy, possibly neutral, sad, or tense." }, mood_party: { not_party: "This track is not optimized for a high-energy party setting; it may be more introspective or relaxed." }, mood_relaxed: { relaxed: "The song's tempo, instrumentation, and dynamics create a soothing and relaxed atmosphere." }, mood_sad: { sad: "The track conveys a sense of sadness or melancholy, likely through a slow tempo, minor key, and somber instrumentation." }, timbre: { dark: "The sound is characterized by lower-frequency content, giving the track a warm, deep, or mellow feel." }, tonal_atonal: { atonal: "The track avoids a traditional key center, creating a sense of tension or abstraction." }, voice_instrumental: { instrumental: "The piece is primarily instrumental, with human voice being absent or non-focal." }, default: "This classification contributes to the overall sonic profile of the track." };

// --- Metric Definitions and Label Functions ---
const METRIC_DEFINITIONS = {
  bpm: `BPM (Beats Per Minute): Measures the tempo or speed of a song. A low BPM suggests a slower, more relaxed track, while a high BPM indicates a faster, more energetic song. Below 70 BPM: Very Slow (ambient, ballads). 70-90 BPM: Relaxed Pace (hip-hop, lo-fi). 90-110 BPM: Groovy/Moderate (pop, funk, mid-tempo rock). 110-130 BPM: Upbeat (pop, dance). Above 130 BPM: Fast/Very Fast (techno, drum & bass, metal).`,
  danceability: `Danceability: Classifies whether a track is suitable for dancing based on rhythmic patterns, tempo, and beat strength. Higher values indicate a more danceable track.`,
  loudness: `Volume (Average Loudness): Reflects the average loudness of the track after normalization. Below 60%: Soft/Very Dynamic. 60%-85%: Moderate. Above 85%: Consistently Loud (common in modern pop, rock, electronic).`,
  dyn_complexity: `Dynamic Range: Measures the variation between the quietest and loudest moments. Score < 2: Steady Volume (compressed, modern pop/metal). 2-4: Moderate Range (balanced). > 4: Very Dynamic (classical, jazz, live performances).`,
  beats_count: 'Beats Count: The total number of detected beats in the track. Higher values often indicate a longer or more rhythmically active song.',
  beats_loudness: 'Beats Loudness: The average loudness of detected beats, reflecting the perceived strength or punch of the rhythm section.'
};
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
function getDanceabilityLabel(val) {
  if (val < 0.5) return 'Not Danceable';
  if (val < 1.0) return 'Somewhat Danceable';
  return 'Highly Danceable';
}

const AudioAnalysisInterface = ({ mbid }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(!!mbid);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(!!mbid);
    const [focusViewData, setFocusViewData] = useState({ isOpen: false });
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    const activeCharts = useRef([]);
    const activeFocusChart = useRef(null);

    useEffect(() => {
        if (mbid) setIsModalOpen(true);
    }, [mbid]);

    // Effect to handle body scrolling
    useEffect(() => {
        if (isModalOpen || focusViewData.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isModalOpen, focusViewData.isOpen]);
    
    // --- TOOLTIP HANDLERS ---
    const handleMouseMove = (e, content) => {
        if (content) {
            setTooltip({ visible: true, content: content, x: e.pageX + 15, y: e.pageY + 15 });
        }
    };
    const handleMouseLeave = () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 });
    };

    // --- MODAL & FOCUS VIEW LOGIC ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        closeFocusView();
    };

    const openFocusView = (data) => setFocusViewData({ isOpen: true, ...data });
    
    const closeFocusView = () => {
        setFocusViewData({ isOpen: false, content: null, type: null });
    };
    
    // --- DATA ---
    const meta = analysisData?.metadata.tags;
    const high = analysisData?.highlevel;

    useEffect(() => {
        if (!mbid) return;
        setLoading(true);
        setError(null);
        Promise.all([
            fetch(`https://acousticbrainz.org/${mbid}/high-level`).then(res => res.ok ? res.json() : Promise.reject('Failed to fetch high-level')),
            fetch(`http://127.0.0.1:8000/${mbid}/low-level`).then(res => res.ok ? res.json() : Promise.reject('Failed to fetch low-level'))
        ]).then(([highLevel, lowLevel]) => {
            setAnalysisData({
                ...highLevel,
                ...lowLevel,
                highlevel: highLevel.highlevel,
                lowlevel: {
                    ...lowLevel.lowlevel,
                    beats_loudness: lowLevel.beats_loudness // ensure beats_loudness is present
                },
                rhythm: lowLevel.rhythm,
                tonal: lowLevel.tonal,
                metadata: highLevel.metadata || lowLevel.metadata
            });
            setLoading(false);
        }).catch(err => {
            setError('Could not fetch analysis data.');
            setLoading(false);
        });
    }, [mbid]);

    // Remove all code and JSX for the launch full analysis landing page. Only render the modal/dashboard if mbid is present, otherwise render null.
    if (!mbid) return null;

    if (loading) {
        return <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>Loading analysis...</div>;
    }
    if (error) {
        return <div style={{ color: '#f87171', textAlign: 'center', padding: 40 }}>{error}</div>;
    }
    if (!analysisData) {
        return <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>No analysis data available.</div>;
    }

    return (
        <div className="app-container">
            {/* Main Interface */}
            <div>
                <h1 className="main-title gradient-text">Audio Intelligence</h1>
                <p className="main-subtitle">Uncover the DNA of your audio. Click below to launch the full analysis dashboard.</p>
                <div>
                    <button onClick={openModal} className="launch-button">
                        Launch Full Analysis
                    </button>
                </div>
            </div>

            {/* Tooltip Element */}
            {tooltip.visible && (
                <div id="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                    {tooltip.content}
                </div>
            )}
            
            {/* Main Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div id="modal-container" className={`modal-container${focusViewData.isOpen ? ' blurred' : ''}`}> 
                        <div className="modal-header" style={{ position: 'relative' }}>
                            <h2 className="modal-title">Comprehensive Audio Analysis</h2>
                            <button
                                onClick={closeModal}
                                style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 1001 }}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-content-area">
                            {/* Track Info */}
                            {meta && (() => {
  const albumName = Array.isArray(meta.album) ? meta.album[0] : meta.album;
  return (
    <div className="track-info-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#232b39', marginBottom: 24 }}>
      <div
        className="gradient-text"
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 4,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {meta.title?.[0]}
      </div>
      <div style={{ color: '#d1d5db', fontSize: 16, fontWeight: 400, textAlign: 'center' }}>
        {meta.artist?.[0]}{albumName ? ` — ${albumName}` : ''}
      </div>
                            </div>
  );
})()}
                            {/* High-Level Classifiers */}
                            <h3 className="section-title" style={{ textAlign: 'left' }}>High-Level Classifiers</h3>
                            <div className="grid grid-cols-4 section-container">
                                {high && Object.entries(high).map(([key, feature]) => (
                                    <HighLevelCard
                                        key={key}
                                        featureKey={key}
                                        feature={feature}
                                        onCardClick={() => openFocusView({ type: 'classifier', data: key })}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                ))}
                            </div>
                            {/* Key Metrics */}
                            <h3 className="section-title" style={{ textAlign: 'left' }}>Key Metrics</h3>
                            <div className="grid grid-cols-4 section-container">
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'bpm' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>BPM</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.bpm?.toFixed(1)}</div>
                                        <div className="card-confidence">Beats Per Minute</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'beats_count' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Beats Count</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.beats_count ?? '--'}</div>
                                        <div className="card-confidence">Total Beats</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'beats_loudness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Beats Loudness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.beats_loudness?.dmean !== undefined ? analysisData.rhythm.beats_loudness.dmean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Avg. Beat Loudness</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'loudness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Loudness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{(analysisData.lowlevel?.average_loudness * 100).toFixed(1)}%</div>
                                        <div className="card-confidence">Average perceived volume</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'dyn_complexity' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Dyn. Complexity</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.dynamic_complexity?.toFixed(2)}</div>
                                        <div className="card-confidence">Loudness variation</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'groove' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Groove</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.onset_rate !== undefined ? analysisData.rhythm.onset_rate.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Onsets/sec</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'melody_clarity' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Melody Clarity</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.pitch_salience?.mean !== undefined ? analysisData.lowlevel.pitch_salience.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Salience</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'harmonic_tension' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Harmonic Tension</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.dissonance?.mean !== undefined ? analysisData.lowlevel.dissonance.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Dissonance</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'silence' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Silence</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.silence_rate_60dB?.mean !== undefined ? (analysisData.lowlevel.silence_rate_60dB.mean * 100).toFixed(1) + '%' : '--'}</div>
                                        <div className="card-confidence">% of Track</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'brightness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Brightness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.spectral_centroid?.mean !== undefined ? analysisData.lowlevel.spectral_centroid.mean.toFixed(0) : '--'}</div>
                                        <div className="card-confidence">Centroid (Hz)</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'texture' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Texture</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length).toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Contrast</div>
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'layering' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Layering</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.spectral_complexity?.mean !== undefined ? analysisData.lowlevel.spectral_complexity.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Complexity</div>
                                    </div>
                                </div>
                            </div>
                            {/* Detailed Analysis */}
                            <h3 className="section-title" style={{ textAlign: 'left' }}>Detailed Analysis</h3>
                            <div className="grid grid-cols-3 section-container">
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'tonality' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Tonality Profile</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard title="Tonality Profile" chartType="tonality" analysisData={analysisData} />
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'melbands' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Mel Bands Mean Energy</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard title="Mel Bands Mean Energy" chartType="melbands" analysisData={analysisData} />
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'chords' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Chords Histogram</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard title="Chords Histogram" chartType="chords" analysisData={analysisData} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Focus View */}
                    <FocusView data={focusViewData} onClose={closeFocusView} analysisData={analysisData} tooltips={METRIC_DEFINITIONS} interpretations={interpretations} />
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const HighLevelCard = ({ featureKey, feature, onCardClick, onMouseMove, onMouseLeave }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            // Destroy previous chart if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = canvasRef.current.getContext('2d');
            const valueName = feature.value.replace(/_/g, ' ');

            if (Object.keys(feature.all).length === 2) {
                chartInstance.current = new Chart(ctx, { type: 'doughnut', data: { labels: [valueName, 'Other'], datasets: [{ data: [feature.probability, 1 - feature.probability], backgroundColor: ['#22d3ee', '#374151'], borderColor: '#1f2937', borderWidth: 4, cutout: '70%' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
            } else {
                const sortedData = Object.entries(feature.all).sort(([, a], [, b]) => b - a).slice(0, 5);
                chartInstance.current = new Chart(ctx, { type: 'bar', data: { labels: sortedData.map(item => item[0]), datasets: [{ label: 'Probability', data: sortedData.map(item => item[1]), backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9CA3AF', font: { size: 10 } } }, x: { display: false } } } });
            }
        }
        // Cleanup function to destroy chart on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [feature, featureKey]);

    const featureName = featureKey.replace(/_/g, ' ');
    const valueName = feature.value.replace(/_/g, ' ');
    const probabilityPercent = (feature.probability * 100).toFixed(1);
    const interpretationText = (interpretations[featureKey] && interpretations[featureKey][feature.value]) || interpretations.default;

    return (
        <div
            className="high-level-card card-hover"
            onClick={onCardClick}
            onMouseMove={(e) => onMouseMove(e, tooltips[featureKey] || '')}
            onMouseLeave={onMouseLeave}
            style={{ cursor: 'pointer' }}
        >
            <div className="card-title" style={{ textAlign: 'left' }}>{featureName}</div>
            <div className="card-main-value-container">
                <div className="card-main-value gradient-text">{valueName}</div>
                <div className="card-confidence">Confidence: {probabilityPercent}%</div>
                <div className="chart-container">
                    <canvas ref={canvasRef}></canvas>
            </div>
            </div>
            <div className="card-footer">
                <span className="card-impact-text-strong">Impact:</span>
                <span className="card-impact-text"> {interpretationText}</span>
            </div>
        </div>
    );
};

// MetricCard with safe defaults for onMouseMove/onMouseLeave
const MetricCard = ({ title, value, description, tooltipText, onClick, onMouseMove = () => {}, onMouseLeave = () => {} }) => {
    return (
        <div className="bg-gray-900/50 p-4 rounded-xl text-center border border-gray-700 card-hover"
             onClick={onClick}
             onMouseMove={(e) => onMouseMove(e, tooltipText)}
             onMouseLeave={onMouseLeave}>
            <h4 className="text-sm font-medium text-gray-400">{title}</h4>
            <p className="text-4xl font-bold text-gray-100 my-2">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
};

// DetailedChartCard with safe defaults for onMouseMove/onMouseLeave
const DetailedChartCard = ({ title, chartType, analysisData, tooltipText, onCardClick, onMouseMove = () => {}, onMouseLeave = () => {} }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (canvasRef.current && analysisData) {
            if (chartInstance.current) chartInstance.current.destroy();
            
            const ctx = canvasRef.current.getContext('2d');
            const tonal = analysisData.tonal;
            let config = {};

            switch (chartType) {
                case 'tonality':
                    config = { type: 'line', data: { labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], datasets: [{ label: 'Pitch Strength', data: tonal.thpcp.slice(0, 12), borderColor: 'rgba(22, 163, 74, 1)', backgroundColor: 'rgba(22, 163, 74, 0.2)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { ticks: { color: '#9CA3AF' } } } } };
                    break;
                case 'melbands':
                    config = { type: 'line', data: { labels: analysisData.lowlevel.melbands.mean.map((_, i) => `B${i + 1}`), datasets: [{ label: 'Mean Energy', data: analysisData.lowlevel.melbands.mean, borderColor: 'rgba(34, 211, 238, 1)', backgroundColor: 'rgba(34, 211, 238, 0.2)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { ticks: { color: '#9CA3AF', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } } } };
                    break;
                case 'chords':
                    config = { type: 'line', data: { labels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], datasets: [{ label: 'Major Chords', data: tonal.chords_histogram.slice(0, 12), borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 }, { label: 'Minor Chords', data: tonal.chords_histogram.slice(12), borderColor: 'rgba(234, 179, 8, 1)', backgroundColor: 'rgba(234, 179, 8, 0.2)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { ticks: { color: '#9CA3AF' } } }, plugins: { legend: { labels: { color: '#d1d5db' }, position: 'bottom' } } } };
                    break;
                default:
                    break;
            }
            chartInstance.current = new Chart(ctx, config);
        }
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [chartType, analysisData]);

    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 card-hover"
            onClick={onCardClick}
            onMouseMove={(e) => onMouseMove(e, tooltipText)}
            onMouseLeave={onMouseLeave}>
            <h4 className="text-lg font-semibold mb-2 text-gray-200" style={{ textAlign: 'left' }}>{title}</h4>
            <div className="chart-container">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
};

// Modular FocusView and subcomponents
const FocusView = ({ data, onClose, analysisData, tooltips }) => {
    if (!data.isOpen) return null;
    let content = null;
    switch (data.type) {
        case 'metric':
            content = <FocusMetricView metricKey={data.data} analysisData={analysisData} tooltips={tooltips} />;
            break;
        case 'classifier':
            content = <FocusClassifierView featureKey={data.data} analysisData={analysisData} tooltips={tooltips} interpretations={interpretations} />;
            break;
        case 'chart':
            content = <FocusChartView chartType={data.data} analysisData={analysisData} />;
            break;
        default:
            content = <p>Invalid Focus View Type</p>;
    }
    return (
        <div className="focus-view-overlay" onClick={onClose}>
            <div className="focus-view-content" onClick={(e) => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
};

const FocusMetricView = ({ metricKey, analysisData, tooltips }) => {
    let value, title, interpretation, definition, labelComment;
    switch (metricKey) {
        case 'bpm':
            value = analysisData.rhythm.bpm.toFixed(1);
            title = 'BPM (Beats Per Minute)';
            interpretation = `A tempo of ${value} BPM is moderately paced, common in genres like hip-hop and pop. It provides a steady foundation without being overly energetic or slow.`;
            definition = METRIC_DEFINITIONS.bpm;
            labelComment = getBpmLabel(analysisData.rhythm.bpm);
            break;
        case 'danceability':
            value = analysisData.rhythm.danceability.toFixed(2);
            title = 'Danceability';
            interpretation = `With a score of ${value}, this track's rhythmic consistency, tempo stability, and beat strength are analyzed. Higher scores (closer to 2.0) suggest the track is highly suitable for dancing.`;
            definition = METRIC_DEFINITIONS.danceability;
            labelComment = getDanceabilityLabel(analysisData.rhythm.danceability);
            break;
        case 'loudness':
            value = `${(analysisData.lowlevel.average_loudness * 100).toFixed(1)}%`;
            title = 'Average Loudness';
            interpretation = `This value represents the overall perceived volume. A score of ${value} suggests a relatively high and consistent volume level, common in commercially produced music.`;
            definition = METRIC_DEFINITIONS.loudness;
            labelComment = getVolumeLabel(analysisData.lowlevel.average_loudness);
            break;
        case 'dyn_complexity':
            value = analysisData.lowlevel.dynamic_complexity.toFixed(2);
            title = 'Dynamic Complexity';
            interpretation = `This score of ${value} reflects the variation in loudness throughout the track. Higher values indicate significant changes between quiet and loud sections, contributing to a more expressive and less uniform sound.`;
            definition = METRIC_DEFINITIONS.dyn_complexity;
            labelComment = getDynamicLabelUX(analysisData.lowlevel.dynamic_complexity);
            break;
        case 'beats_count':
            value = analysisData.rhythm.beats_count ?? '--';
            title = 'Beats Count';
            interpretation = `This metric represents the total number of detected beats in the track. A higher count often indicates a more rhythmically active or longer song.`;
            definition = METRIC_DEFINITIONS.beats_count;
            labelComment = `Total Beats: ${analysisData.rhythm.beats_count ?? '--'}`;
            break;
        case 'beats_loudness':
            value = analysisData.rhythm.beats_loudness?.dmean !== undefined ? analysisData.rhythm.beats_loudness.dmean.toFixed(2) : '--';
            title = 'Beats Loudness';
            interpretation = `This metric reflects the average loudness of detected beats. A higher average loudness typically indicates a more energetic or punchy rhythm section.`;
            definition = METRIC_DEFINITIONS.beats_loudness;
            labelComment = `Avg. Beat Loudness: ${value}`;
            break;
        case 'groove':
            value = analysisData.rhythm?.onset_rate !== undefined ? analysisData.rhythm.onset_rate.toFixed(2) : '--';
            title = 'Groove';
            interpretation = `This metric reflects the complexity and regularity of rhythmic onsets, indicating how "groovy" or complex the rhythm is. A higher value suggests a more rhythmically active or complex track.`;
            definition = METRIC_DEFINITIONS.groove;
            labelComment = `Onsets/sec: ${value}`;
            break;
        case 'melody_clarity':
            value = analysisData.lowlevel?.pitch_salience?.mean !== undefined ? analysisData.lowlevel.pitch_salience.mean.toFixed(2) : '--';
            title = 'Melody Clarity';
            interpretation = `This metric reflects how clear and prominent the melody is in the track. A higher value indicates a more melodic and memorable composition.`;
            definition = METRIC_DEFINITIONS.melody_clarity;
            labelComment = `Salience: ${value}`;
            break;
        case 'harmonic_tension':
            value = analysisData.lowlevel?.dissonance?.mean !== undefined ? analysisData.lowlevel.dissonance.mean.toFixed(2) : '--';
            title = 'Harmonic Tension';
            interpretation = `This metric reflects the perceived tension in the harmony, often related to dissonance. A higher value indicates a more complex or dissonant harmonic structure.`;
            definition = METRIC_DEFINITIONS.harmonic_tension;
            labelComment = `Dissonance: ${value}`;
            break;
        case 'silence':
            value = analysisData.lowlevel?.silence_rate_60dB?.mean !== undefined ? (analysisData.lowlevel.silence_rate_60dB.mean * 100).toFixed(1) + '%' : '--';
            title = 'Silence';
            interpretation = `This metric represents the proportion of the track that is silent or near-silent. A higher value indicates a more silent or introspective track.`;
            definition = METRIC_DEFINITIONS.silence;
            labelComment = `% of Track: ${value}`;
            break;
        case 'brightness':
            value = analysisData.lowlevel?.spectral_centroid?.mean !== undefined ? analysisData.lowlevel.spectral_centroid.mean.toFixed(0) : '--';
            title = 'Brightness';
            interpretation = `This metric reflects the perceived brightness of the sound, related to spectral centroid. A higher value indicates a brighter or more energetic sound.`;
            definition = METRIC_DEFINITIONS.brightness;
            labelComment = `Centroid (Hz): ${value}`;
            break;
        case 'texture':
            value = Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length).toFixed(2) : '--';
            title = 'Texture';
            interpretation = `This metric reflects the complexity of the sound texture, often related to spectral contrast. A higher value indicates a more complex or varied sound texture.`;
            definition = METRIC_DEFINITIONS.texture;
            labelComment = `Contrast: ${value}`;
            break;
        case 'layering':
            value = analysisData.lowlevel?.spectral_complexity?.mean !== undefined ? analysisData.lowlevel.spectral_complexity.mean.toFixed(2) : '--';
            title = 'Layering';
            interpretation = `This metric reflects the number of simultaneous sound sources or layers in the track. A higher value indicates a more layered or complex soundscape.`;
            definition = METRIC_DEFINITIONS.layering;
            labelComment = `Complexity: ${value}`;
            break;
        default:
            return <p>Unknown Metric</p>;
    }
    return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d1d5db', marginBottom: '0.5rem' }}>{title}</h3>
            <p className="gradient-text" style={{ fontSize: '4.5rem', fontWeight: '800', margin: '1.5rem 0' }}>{value}</p>
            {labelComment && <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, marginBottom: 12 }}>{labelComment}</div>}
            <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
                <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '1rem', marginBottom: '0.5rem' }}>Interpretation</h4>
                <p style={{ color: '#9ca3af' }}>{interpretation}</p>
                <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '1rem', marginBottom: '0.5rem' }}>Definition</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{METRIC_DEFINITIONS[metricKey]}</p>
            </div>
        </div>
    );
};

const FocusClassifierView = ({ featureKey, analysisData, tooltips, interpretations }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);
    const feature = analysisData.highlevel[featureKey];
    const featureName = featureKey.replace(/_/g, ' ');
    const valueName = feature.value.replace(/_/g, ' ');
    const interpretationText = (interpretations[featureKey] && interpretations[featureKey][feature.value]) || interpretations.default;
    const sortedData = Object.entries(feature.all).sort(([, a], [, b]) => b - a);
    useEffect(() => {
        if (canvasRef.current) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = canvasRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedData.map(item => item[0]),
                    datasets: [{
                        label: 'Probability',
                        data: sortedData.map(item => item[1]),
                        backgroundColor: sortedData.map(item => item[0] === feature.value ? '#38bdf8' : 'rgba(99, 102, 241, 0.6)'),
                        borderColor: sortedData.map(item => item[0] === feature.value ? '#0ea5e9' : 'rgba(99, 102, 241, 1)'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { ticks: { color: '#FFFFFF' } },
                        x: { title: { display: true, text: 'Probability', color: '#FFFFFF' }, ticks: { color: '#FFFFFF' } }
                    }
                }
            });
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [feature, featureKey, sortedData]);
    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'capitalize' }}>{featureName}</h3>
                <p style={{ fontSize: '1.125rem', color: '#d1d5db' }}>Dominant: <span style={{ fontWeight: '600', color: 'white' }}>{valueName}</span></p>
            </div>
            <div className="grid md-grid-cols-2 grid-cols-1" style={{ flexGrow: 1, gap: '1.5rem' }}>
                <div style={{ minHeight: '20rem' }}>
                    <canvas ref={canvasRef}></canvas>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: '0.5rem' }}>Detailed Breakdown</h4>
                    <ul className="scrollable-chart" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem', listStyle: 'none', paddingLeft: 0, margin: 0, marginBottom: '0.5rem' }}>
                        {sortedData.map(([label, prob]) => (
                            <li key={label} style={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.25rem 0.75rem', minWidth: 90 }}>
                                <span style={{ color: '#fff', fontWeight: 600, marginRight: 8 }}>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
                                <span style={{ fontFamily: 'monospace', color: '#d1d5db', fontWeight: 400 }}>{(prob * 100).toFixed(2)}%</span>
                            </li>
                        ))}
                    </ul>
                    <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '1rem', marginBottom: '0.5rem' }}>Definition</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }} dangerouslySetInnerHTML={{ __html: tooltips[featureKey] }} />
                    <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '1rem', marginBottom: '0.5rem' }}>Interpretation</h4>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{interpretationText}</p>
                </div>
            </div>
            </div>
        );
};

const FocusChartView = ({ chartType, analysisData }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);
    let title = '';
    let dominantChordText = '';
    useEffect(() => {
        if (canvasRef.current) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = canvasRef.current.getContext('2d');
            const chartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'Strength / Energy', color: '#FFFFFF' }, ticks: { color: '#FFFFFF' } }, x: { title: { display: true, text: 'Band / Class', color: '#FFFFFF' }, ticks: { color: '#FFFFFF', minRotation: 0, maxRotation: 0 } } } };
            let config = {};
            switch (chartType) {
                case 'melbands':
                    title = 'Mel Bands Energy';
                    config = { type: 'line', data: { labels: analysisData.lowlevel.melbands.mean.map((_, i) => `Band ${i + 1}`), datasets: [{ label: 'Mean Energy', data: analysisData.lowlevel.melbands.mean, borderColor: 'rgba(34, 211, 238, 1)', backgroundColor: 'rgba(34, 211, 238, 0.2)', fill: true, tension: 0.4 }] }, options: { ...chartOptions, plugins: { legend: { display: false } } } };
                    break;
                case 'chords':
                    title = 'Chords Histogram';
                    const chordLabels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const majorChords = analysisData.tonal.chords_histogram.slice(0, 12);
                    const minorChords = analysisData.tonal.chords_histogram.slice(12);
                    const dominantMajorIndex = majorChords.indexOf(Math.max(...majorChords));
                    const dominantMinorIndex = minorChords.indexOf(Math.max(...minorChords));
                    dominantChordText = `Dominant Chords: ${chordLabels[dominantMajorIndex]} (Major), ${chordLabels[dominantMinorIndex]}m (Minor)`;
                    config = { type: 'line', data: { labels: chordLabels, datasets: [{ label: 'Major Chords', data: majorChords, borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3, pointRadius: (ctx) => ctx.dataIndex === dominantMajorIndex ? 6 : 3, pointBackgroundColor: (ctx) => ctx.dataIndex === dominantMajorIndex ? '#38bdf8' : 'rgba(59, 130, 246, 1)' }, { label: 'Minor Chords', data: minorChords, borderColor: 'rgba(234, 179, 8, 1)', backgroundColor: 'rgba(234, 179, 8, 0.2)', fill: true, tension: 0.3, pointRadius: (ctx) => ctx.dataIndex === dominantMinorIndex ? 6 : 3, pointBackgroundColor: (ctx) => ctx.dataIndex === dominantMinorIndex ? '#facc15' : 'rgba(234, 179, 8, 1)' }] }, options: { ...chartOptions, plugins: { legend: { labels: { color: '#d1d5db' } } } } };
                    break;
                case 'tonality':
                    title = 'Tonality Profile';
                    const thpcpLabels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    config = { type: 'line', data: { labels: thpcpLabels, datasets: [{ label: 'Pitch Strength', data: analysisData.tonal.thpcp.slice(0, 12), borderColor: 'rgba(22, 163, 74, 1)', backgroundColor: 'rgba(22, 163, 74, 0.2)', fill: true, tension: 0.4 }] }, options: { ...chartOptions, plugins: { legend: { display: false } }, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, title: { display: true, text: 'Pitch Class', color: '#FFFFFF' } } } } };
                    break;
                default:
                    break;
            }
            chartInstance.current = new Chart(ctx, config);
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [chartType, analysisData]);
    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'capitalize' }}>{title}</h3>
                {dominantChordText && <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{dominantChordText}</p>}
            </div>
            <div className="scrollable-chart" style={{ flexGrow: 1, overflowX: 'auto' }}>
                <div style={{ width: '1200px', height: '100%' }}>
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
    );
};

export default AudioAnalysisInterface;