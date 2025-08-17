import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../../public/styles.css' ;


const tooltips = { danceability: "Classifies whether a track is suitable for dancing based on rhythmic patterns.", 
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
              
const interpretations = { danceability: { not_danceable: "The track's rhythm is more suited for listening than dancing, likely due to its complexity or lack of a strong, regular beat." }, genre_dortmund: { electronic: "The track is predominantly electronic, characterized by synthesized sounds and programmed beats." }, genre_electronic: { ambient: "This piece falls into the ambient sub-genre, suggesting a focus on atmosphere and texture over rhythm." }, genre_rosamerica: { hip: "The song aligns with the Hip-Hop genre, likely featuring rhythmic speech and strong basslines." }, genre_tzanetakis: { jaz: "Elements of Jazz are prominent, possibly including improvisation, swing rhythms, or characteristic instrumentation." }, ismir04_rhythm: { ChaChaCha: "The rhythm has characteristics of a Cha-Cha-Cha, with a syncopated 4/4 time signature." }, mood_acoustic: { not_acoustic: "The sound is primarily driven by electronic or amplified instruments, not acoustic ones." }, mood_aggressive: { not_aggressive: "The track lacks harsh, driving elements, creating a non-aggressive and likely smoother listening experience." }, mood_electronic: { electronic: "The sonic palette is dominated by synthesizers, drum machines, or other electronic sources." }, mood_happy: { not_happy: "The musical cues suggest a mood that is not overtly happy, possibly neutral, sad, or tense." }, mood_party: { not_party: "This track is not optimized for a high-energy party setting; it may be more introspective or relaxed." }, mood_relaxed: { relaxed: "The song's tempo, instrumentation, and dynamics create a soothing and relaxed atmosphere." }, mood_sad: { sad: "The track conveys a sense of sadness or melancholy, likely through a slow tempo, minor key, and somber instrumentation." }, timbre: { dark: "The sound is characterized by lower-frequency content, giving the track a warm, deep, or mellow feel." }, tonal_atonal: { atonal: "The track avoids a traditional key center, creating a sense of tension or abstraction." }, voice_instrumental: { instrumental: "The piece is primarily instrumental, with human voice being absent or non-focal." }, default: "This classification contributes to the overall sonic profile of the track." };

// --- Metric Definitions and Label Functions ---
const METRIC_DEFINITIONS = {
    // High-level classifiers (from tooltips)
  danceability_classifier: 'Classifies whether a track is suitable for dancing based on rhythmic patterns.',
  genre_dortmund: 'Classifies the track into one of nine broad genres based on the Dortmund model.',
  genre_electronic: 'Classifies the track into sub-genres of electronic music.',
  genre_rosamerica: 'Classifies the track based on the Rosamerica genre taxonomy.',
  genre_tzanetakis: 'Classifies the track based on the Tzanetakis genre collection.',
  ismir04_rhythm: 'Classifies the track\'s rhythm into ballroom dance styles.',
  mood_acoustic: 'Detects the presence of acoustic instruments.',
  mood_aggressive: 'Detects if the track has an aggressive or intense mood.',
  mood_electronic: 'Detects the presence of electronic instruments and sounds.',
  mood_happy: 'Detects if the track has a happy, cheerful mood.',
  mood_party: 'Detects if the track is suitable for a party atmosphere.',
  mood_relaxed: 'Detects if the track has a relaxed, calm mood.',
  mood_sad: 'Detects if the track has a sad or melancholic mood.',
  moods_mirex: 'Classifies the track\'s mood into one of five clusters from the MIREX challenge.',
  timbre: 'Describes the textural quality of the sound (bright vs. dark).',
  tonal_atonal: 'Distinguishes between music with a clear tonal center (tonal) and music without (atonal).',
  voice_instrumental: 'Classifies whether the track is primarily vocal or instrumental.',

  // Key Metrics
  bpm: `Measures the tempo or speed of a song. A low BPM suggests a slower, more relaxed track, while a high BPM indicates a faster, more energetic song.`,
  danceability: `Classifies whether a track is suitable for dancing based on rhythmic patterns, tempo, and beat strength. Higher values indicate a more danceable track.`,
  loudness: `Reflects the average loudness of the track after normalization.`,
  dyn_complexity: `Measures the variation between the quietest and loudest moments.`,
  beats_count: 'The total number of detected beats in the track. Higher values often indicate a longer or more rhythmically active song.',
  beats_loudness: 'The average loudness of detected beats, reflecting the perceived strength or punch of the rhythm section.',
  groove: 'The complexity and regularity of rhythmic onsets, indicating how "groovy" or complex the rhythm is. Higher values suggest a more rhythmically active or complex track.',
  melody_clarity: 'How clear and prominent the melody is in the track. Higher values indicate a more melodic and memorable composition.',
  harmonic_tension: 'The perceived tension in the harmony, often related to dissonance. Higher values indicate a more complex or dissonant harmonic structure.',
  silence: 'The proportion of the track that is silent or near-silent. Higher values indicate a more silent or introspective track.',
  brightness: 'The perceived brightness of the sound, related to spectral centroid. Higher values indicate a brighter or more energetic sound.',
  texture: 'The complexity of the sound texture, often related to spectral contrast. Higher values indicate a more complex or varied sound texture.',
  layering: 'The number of simultaneous sound sources or layers in the track. Higher values indicate a more layered or complex soundscape.',
  
  // Detailed analysis chart types
  tonality: 'Tonality Profile: Shows the strength of each of the 12 musical pitch classes, providing a detailed view of the track\'s harmonic content.',
  melbands: 'Mel Bands Mean Energy: Represents the energy in different frequency bands, modeled after human hearing.',
  chords: 'Chords Histogram: Shows the relative presence of each of the 12 major and 12 minor chords.'
};
// --- Metric Label Functions ---
function getBpmLabel(bpm) {
  if (bpm === undefined || bpm === null) return '';
  if (bpm < 70) return 'Very Slow';
  if (bpm < 90) return 'Relaxed Pace';
  if (bpm < 110) return 'Groovy';
  if (bpm < 130) return 'Upbeat';
  return 'Very Fast';
}
function getLoudnessLabel(loudnessPercent) {
  if (loudnessPercent === undefined || loudnessPercent === null) return '';
  if (loudnessPercent > 80) return 'Consistently Loud';
  if (loudnessPercent > 50) return 'Dynamic & Full';
  if (loudnessPercent > 30) return 'Moderate Volume';
  return 'Soft & Gentle';
}
function getDynamicComplexityLabel(dynamic) {
  if (dynamic === undefined || dynamic === null) return '';
  if (dynamic < 2) return 'Steady';
  if (dynamic < 4) return 'Moderate';
  return 'Very Dynamic';
}
function getBeatsCountLabel(count) {
  if (count === undefined || count === null) return '';
  if (count < 200) return 'Sparse Rhythm';
  if (count < 400) return 'Understated Beat';
  if (count < 600) return 'Consistent Beat';
  return 'Dense & Driving';
}
function getBeatsLoudnessLabel(loudness) {
  if (loudness === undefined || loudness === null) return '';
  if (loudness < 0.02) return 'Ghost Notes';
  if (loudness < 0.05) return 'Light Touch';
  if (loudness < 0.1) return 'Solid Hits';
  return 'Heavy Impact';
}
function getChordTonalityLabel(majorPercentage) {
  if (majorPercentage === undefined || majorPercentage === null) return '';
  if (majorPercentage > 75) return 'Overwhelmingly Major';
  if (majorPercentage > 60) return 'Major Dominant';
  if (majorPercentage > 40) return 'Balanced Major/Minor';
  if (majorPercentage > 25) return 'Minor Dominant';
  return 'Overwhelmingly Minor';
}
function getDanceabilityLabel(val) {
  if (val === undefined || val === null) return '';
  if (val < 0.5) return 'Not Danceable';
  if (val < 1.0) return 'Somewhat Danceable';
  return 'Highly Danceable';
}
function getMoodConfidenceLabel(confidence) {
  if (confidence === undefined || confidence === null) return '';
  if (confidence > 0.8) return 'Very Strong';
  if (confidence > 0.6) return 'Confident';
  if (confidence > 0.4) return 'Likely';
  return 'Subtle Hint';
}
function getTonalLabel(tonalityScore) {
  if (tonalityScore === undefined || tonalityScore === null) return '';
  if (tonalityScore > 0.8) return 'Strongly Tonal';
  if (tonalityScore > 0.6) return 'Clearly Tonal';
  if (tonalityScore > 0.4) return 'Ambiguous Tonality';
  if (tonalityScore > 0.2) return 'Leaning Atonal';
  return 'Strongly Atonal';
}
function getVoiceInstrumentalLabel(voiciness) {
  if (voiciness === undefined || voiciness === null) return '';
  if (voiciness > 0.9) return 'Acapella';
  if (voiciness > 0.7) return 'Vocal-led';
  if (voiciness > 0.4) return 'Balanced Voice & Inst.';
  if (voiciness > 0.1) return 'Instrumental with Vocals';
  return 'Purely Instrumental';
}
function getGrooveLabel(grooveScore) {
  if (grooveScore === undefined || grooveScore === null) return '';
  if (grooveScore > 0.8) return 'Deeply Funky';
  if (grooveScore > 0.6) return 'Swinging Feel';
  if (grooveScore > 0.4) return 'Steady Rhythm';
  return 'Straight & On-the-grid';
}
function getMelodyClarityLabel(clarity) {
  if (clarity === undefined || clarity === null) return '';
  if (clarity > 0.8) return 'Very Prominent';
  if (clarity > 0.6) return 'Clear & Defined';
  if (clarity > 0.4) return 'Slightly Obscured';
  return 'Muddled / Abstract';
}
function getHarmonicTensionLabel(tension) {
  if (tension === undefined || tension === null) return '';
  if (tension > 0.8) return 'Highly Dissonant';
  if (tension > 0.6) return 'Tense & Unresolved';
  if (tension > 0.3) return 'Moderate Tension';
  return 'Calm & Resolved';
}
function getSilenceLabel(silencePercent) {
  if (silencePercent === undefined || silencePercent === null) return '';
  if (silencePercent > 25) return 'Full of Pauses';
  if (silencePercent > 13) return 'Breathy & Spacious';
  if (silencePercent > 5) return 'Some Space';
  return 'Continuous Sound';
}
function getBrightnessLabel(brightness) {
  if (brightness === undefined || brightness === null) return '';
  if (brightness > 0.8) return 'Brilliant & Crisp';
  if (brightness > 0.6) return 'Bright & Clear';
  if (brightness > 0.4) return 'Neutral Tone';
  if (brightness > 0.2) return 'Warm & Mellow';
  return 'Dark & Subdued';
}
function getTextureLabel(density) {
  if (density === undefined || density === null) return '';
  if (density > 0.8) return 'Very Dense';
  if (density > 0.6) return 'Rich & Full';
  if (density > 0.3) return 'Moderate Texture';
  return 'Sparse & Minimalist';
}
function getLayeringLabel(layerCount) {
  if (layerCount === undefined || layerCount === null) return '';
  if (layerCount > 8) return 'Highly Complex';
  if (layerCount > 5) return 'Multi-layered';
  if (layerCount > 2) return 'Moderately Layered';
  return 'Simple Arrangement';
}

// Human-friendly mappings for genre codes (for use in chord/genre leaderboards)
const rosamericaMap = {
  pop: 'Pop', rhy: 'Rhythm & Blues', hip: 'Hip-Hop', roc: 'Rock', dan: 'Dance', spe: 'Speech', ele: 'Electronic', jaz: 'Jazz', ins: 'Instrumental', fol: 'Folk', bla: 'Blues', cou: 'Country', reg: 'Reggae', sou: 'Soul', fun: 'Funk', lat: 'Latin', met: 'Metal', pun: 'Punk', cla: 'Classical', exp: 'Experimental', amb: 'Ambient', wor: 'World', blu: 'Blues', rap: 'Rap', '': ''
};
const tzanetakisMap = {
  blu: 'Blues', cla: 'Classical', cou: 'Country', dis: 'Disco', hip: 'Hip-Hop', jaz: 'Jazz', met: 'Metal', pop: 'Pop', reg: 'Reggae', roc: 'Rock', '': ''
};

const AudioAnalysisInterface = ({ mbid, onClose }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(!!mbid);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(!!mbid);
    const [focusViewData, setFocusViewData] = useState({ isOpen: false });
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
    const [artistGenre, setArtistGenre] = useState(null);
    const [fallbackMode, setFallbackMode] = useState(false);
    const [fallbackData, setFallbackData] = useState(null);

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
    
    // Function to handle fallback when no MBID is found
    const handleNoMbidFallback = async (artistName, songName, albumName) => {
        try {
            // Try to get artist genre from Spotify
            const response = await fetch(`http://127.0.0.1:8000/artist-genre-by-name?artistName=${encodeURIComponent(artistName)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.primaryGenre) {
                    // We have a genre, show fallback table
                    setFallbackMode(true);
                    setFallbackData({
                        songName,
                        artistName,
                        albumName,
                        genre: data.primaryGenre
                    });
                    return;
                }
            }
            // No genre found, show error
            setError('No MBID found and no artist genre available on Spotify.');
        } catch (err) {
            console.log('Could not fetch artist genre for fallback:', err);
            setError('No MBID found and unable to fetch artist genre.');
        }
    };
    


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
            
            // Fetch artist genre after analysis data is loaded (following /artist page pattern)
            const artistName = highLevel?.metadata?.tags?.artist?.[0] || lowLevel?.metadata?.tags?.artist?.[0];
            
            if (artistName) {
                // Use the same pattern as /artist page - search for artist and get genre
                fetch(`http://127.0.0.1:8000/artist-genre-by-name?artistName=${encodeURIComponent(artistName)}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data && data.primaryGenre) {
                            setArtistGenre(data.primaryGenre);
                        }
                    })
                    .catch(err => console.log('Could not fetch artist genre:', err));
            }
        }).catch(err => {
            setError('Could not fetch analysis data.');
            setLoading(false);
        });
    }, [mbid]);

    // Handle the three scenarios: MBID exists, no MBID but has genre, no MBID and no genre
    if (!mbid) {
        // No MBID provided, check if we have song info to try fallback
        return null; // For now, return null - we'll handle this in the parent component
    }

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
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    style={{
                                        position: 'absolute',
                                        top: 18,
                                        right: 24,
                                        background: 'none',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: 28,
                                        cursor: 'pointer',
                                        zIndex: 1001
                                    }}
                                    aria-label="Close Modal"
                                >
                                    &times;
                                </button>
                            )}
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
                                {high && Object.entries(high)
                                    .filter(([key]) => key !== 'gender') // Filter out gender classifier
                                    .map(([key, feature]) => (
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
                            
                            {/* Responsive styling for high-level classifier nodes */}
                            <style jsx>{`
                                .section-container .high-level-card {
                                    padding: 0.75rem !important;
                                    min-height: 120px !important;
                                    max-height: 140px !important;
                                }
                                
                                .section-container .high-level-card .card-title {
                                    font-size: 0.8rem !important;
                                    margin-bottom: 0.4rem !important;
                                    line-height: 1.2 !important;
                                }
                                
                                .section-container .high-level-card .card-main-value {
                                    font-size: 1.2rem !important;
                                    margin-bottom: 0.2rem !important;
                                    line-height: 1.1 !important;
                                }
                                
                                .section-container .high-level-card .card-confidence {
                                    font-size: 0.7rem !important;
                                    margin-bottom: 0.4rem !important;
                                    line-height: 1.1 !important;
                                }
                                
                                .section-container .high-level-card .chart-container {
                                    height: 50px !important;
                                    margin: 0.2rem 0 !important;
                                }
                                
                                .section-container .high-level-card .card-footer {
                                    font-size: 0.65rem !important;
                                    padding: 0.4rem !important;
                                    line-height: 1.3 !important;
                                }
                                
                                .section-container .high-level-card .card-impact-text-strong {
                                    font-size: 0.65rem !important;
                                }
                                
                                .section-container .high-level-card .card-impact-text {
                                    font-size: 0.65rem !important;
                                }

                                @media (min-width: 1500px) {
                                    .section-container .high-level-card {
                                        padding: 0.85rem !important;
                                        min-height: 130px !important;
                                    }
                                    
                                    .section-container .high-level-card .card-title {
                                        font-size: 0.85rem !important;
                                    }
                                    
                                    .section-container .high-level-card .card-main-value {
                                        font-size: 1.3rem !important;
                                    }
                                    
                                    .section-container .high-level-card .chart-container {
                                        height: 55px !important;
                                    }
                                }
                            `}</style>
                            {/* Key Metrics */}
                            <h3 className="section-title" style={{ textAlign: 'left' }}>Key Metrics</h3>
                            <div className="grid grid-cols-4 section-container">
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'bpm' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>BPM</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.bpm?.toFixed(1)}</div>
                                        <div className="card-confidence">Beats Per Minute</div>
                                        {getBpmLabel(analysisData.rhythm?.bpm) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getBpmLabel(analysisData.rhythm?.bpm)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'beats_count' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Beats Count</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.beats_count ?? '--'}</div>
                                        <div className="card-confidence">Total Beats</div>
                                        {getBeatsCountLabel(analysisData.rhythm?.beats_count) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getBeatsCountLabel(analysisData.rhythm?.beats_count)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'beats_loudness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Beats Loudness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.beats_loudness?.dmean !== undefined ? analysisData.rhythm.beats_loudness.dmean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Avg. Beat Loudness</div>
                                        {getBeatsLoudnessLabel(analysisData.rhythm?.beats_loudness?.dmean) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getBeatsLoudnessLabel(analysisData.rhythm?.beats_loudness?.dmean)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'loudness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Loudness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{(analysisData.lowlevel?.average_loudness * 100).toFixed(1)}%</div>
                                        <div className="card-confidence">Average perceived volume</div>
                                        {getLoudnessLabel(analysisData.lowlevel?.average_loudness * 100) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getLoudnessLabel(analysisData.lowlevel?.average_loudness * 100)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'dyn_complexity' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Dyn. Complexity</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.dynamic_complexity?.toFixed(2)}</div>
                                        <div className="card-confidence">Loudness variation</div>
                                        {getDynamicComplexityLabel(analysisData.lowlevel?.dynamic_complexity) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getDynamicComplexityLabel(analysisData.lowlevel?.dynamic_complexity)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'groove' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Groove</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.rhythm?.onset_rate !== undefined ? analysisData.rhythm.onset_rate.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Onsets/sec</div>
                                        {getGrooveLabel(analysisData.rhythm?.onset_rate) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getGrooveLabel(analysisData.rhythm?.onset_rate)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'melody_clarity' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Melody Clarity</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.pitch_salience?.mean !== undefined ? analysisData.lowlevel.pitch_salience.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Salience</div>
                                        {getMelodyClarityLabel(analysisData.lowlevel?.pitch_salience?.mean) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getMelodyClarityLabel(analysisData.lowlevel?.pitch_salience?.mean)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'harmonic_tension' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Harmonic Tension</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.dissonance?.mean !== undefined ? analysisData.lowlevel.dissonance.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Dissonance</div>
                                        {getHarmonicTensionLabel(analysisData.lowlevel?.dissonance?.mean) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getHarmonicTensionLabel(analysisData.lowlevel?.dissonance?.mean)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'silence' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Silence</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.silence_rate_60dB?.mean !== undefined ? (analysisData.lowlevel.silence_rate_60dB.mean * 100).toFixed(1) + '%' : '--'}</div>
                                        <div className="card-confidence">% of Track</div>
                                        {getSilenceLabel(analysisData.lowlevel?.silence_rate_60dB?.mean * 100) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getSilenceLabel(analysisData.lowlevel?.silence_rate_60dB?.mean * 100)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'brightness' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Brightness</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.spectral_centroid?.mean !== undefined ? analysisData.lowlevel.spectral_centroid.mean.toFixed(0) : '--'}</div>
                                        <div className="card-confidence">Centroid (Hz)</div>
                                        {getBrightnessLabel(analysisData.lowlevel?.spectral_centroid?.mean) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getBrightnessLabel(analysisData.lowlevel?.spectral_centroid?.mean)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'texture' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Texture</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length).toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Contrast</div>
                                        {getTextureLabel(Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length) : 0) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getTextureLabel(Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length) : 0)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'metric', data: 'layering' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Layering</div>
                                    <div className="card-main-value-container">
                                        <div className="card-main-value" style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{analysisData.lowlevel?.spectral_complexity?.mean !== undefined ? analysisData.lowlevel.spectral_complexity.mean.toFixed(2) : '--'}</div>
                                        <div className="card-confidence">Complexity</div>
                                        {getLayeringLabel(analysisData.lowlevel?.spectral_complexity?.mean) && (
                                            <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, margin: '6px 0 0 0' }}>{getLayeringLabel(analysisData.lowlevel?.spectral_complexity?.mean)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Detailed Analysis */}
                            <h3 className="section-title" style={{ textAlign: 'left' }}>Detailed Analysis</h3>
                            <div className="grid grid-cols-3 section-container">
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'tonality' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Tonality Profile</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard chartType="tonality" analysisData={analysisData} />
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'melbands' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Mel Bands Mean Energy</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard chartType="melbands" analysisData={analysisData} />
                                    </div>
                                </div>
                                <div className="high-level-card card-hover" style={{ cursor: 'pointer' }} onClick={() => openFocusView({ type: 'chart', data: 'chords' })}>
                                    <div className="card-title" style={{ textAlign: 'left' }}>Chords Histogram</div>
                                    <div className="card-main-value-container">
                                        <DetailedChartCard chartType="chords" analysisData={analysisData} />
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

            // Map for bar chart labels if Rosamerica or Tzanetakis
            const labelMap = featureKey === 'genre_rosamerica' ? rosamericaMap : featureKey === 'genre_tzanetakis' ? tzanetakisMap : null;

            if (Object.keys(feature.all).length === 2) {
                chartInstance.current = new Chart(ctx, { type: 'doughnut', data: { labels: [valueName, 'Other'], datasets: [{ data: [feature.probability, 1 - feature.probability], backgroundColor: ['#22d3ee', '#374151'], borderColor: '#1f2937', borderWidth: 4, cutout: '70%' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
            } else {
                const sortedData = Object.entries(feature.all).sort(([, a], [, b]) => b - a).slice(0, 5);
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: sortedData.map(item => labelMap ? (labelMap[item[0]] || item[0]) : item[0]),
                        datasets: [{ label: 'Probability', data: sortedData.map(item => item[1]), backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1 }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { ticks: { color: '#9CA3AF', font: { size: 10 } } }, x: { display: false } }
                    }
                });
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
            <div className="focus-view-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                {/* Close button for focus mode */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 18,
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: 28,
                        cursor: 'pointer',
                        zIndex: 1001
                    }}
                    aria-label="Close Focus View"
                >
                    &times;
                </button>
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
            labelComment = getLoudnessLabel((analysisData.lowlevel.average_loudness * 100));
            break;
        case 'dyn_complexity':
            value = analysisData.lowlevel.dynamic_complexity.toFixed(2);
            title = 'Dynamic Complexity';
            interpretation = `This score of ${value} reflects the variation in loudness throughout the track. Higher values indicate significant changes between quiet and loud sections, contributing to a more expressive and less uniform sound.`;
            definition = METRIC_DEFINITIONS.dyn_complexity;
            labelComment = getDynamicComplexityLabel(analysisData.lowlevel.dynamic_complexity);
            break;
        case 'beats_count':
            value = analysisData.rhythm.beats_count ?? '--';
            title = 'Beats Count';
            interpretation = `This metric represents the total number of detected beats in the track. A higher count often indicates a more rhythmically active or longer song.`;
            definition = METRIC_DEFINITIONS.beats_count;
            labelComment = getBeatsCountLabel(analysisData.rhythm.beats_count);
            break;
        case 'beats_loudness':
            value = analysisData.rhythm.beats_loudness?.dmean !== undefined ? analysisData.rhythm.beats_loudness.dmean.toFixed(2) : '--';
            title = 'Beats Loudness';
            interpretation = `This metric reflects the average loudness of detected beats. A higher average loudness typically indicates a more energetic or punchy rhythm section.`;
            definition = METRIC_DEFINITIONS.beats_loudness;
            labelComment = getBeatsLoudnessLabel(analysisData.rhythm.beats_loudness?.dmean);
            break;
        case 'groove':
            value = analysisData.rhythm?.onset_rate !== undefined ? analysisData.rhythm.onset_rate.toFixed(2) : '--';
            title = 'Groove';
            interpretation = `This metric reflects the complexity and regularity of rhythmic onsets, indicating how "groovy" or complex the rhythm is. A higher value suggests a more rhythmically active or complex track.`;
            definition = METRIC_DEFINITIONS.groove;
            labelComment = getGrooveLabel(analysisData.rhythm?.onset_rate);
            break;
        case 'melody_clarity':
            value = analysisData.lowlevel?.pitch_salience?.mean !== undefined ? analysisData.lowlevel.pitch_salience.mean.toFixed(2) : '--';
            title = 'Melody Clarity';
            interpretation = `This metric reflects how clear and prominent the melody is in the track. A higher value indicates a more melodic and memorable composition.`;
            definition = METRIC_DEFINITIONS.melody_clarity;
            labelComment = getMelodyClarityLabel(analysisData.lowlevel?.pitch_salience?.mean);
            break;
        case 'harmonic_tension':
            value = analysisData.lowlevel?.dissonance?.mean !== undefined ? analysisData.lowlevel.dissonance.mean.toFixed(2) : '--';
            title = 'Harmonic Tension';
            interpretation = `This metric reflects the perceived tension in the harmony, often related to dissonance. A higher value indicates a more complex or dissonant harmonic structure.`;
            definition = METRIC_DEFINITIONS.harmonic_tension;
            labelComment = getHarmonicTensionLabel(analysisData.lowlevel?.dissonance?.mean);
            break;
        case 'silence':
            value = analysisData.lowlevel?.silence_rate_60dB?.mean !== undefined ? (analysisData.lowlevel.silence_rate_60dB.mean * 100).toFixed(1) + '%' : '--';
            title = 'Silence';
            interpretation = `This metric represents the proportion of the track that is silent or near-silent. A higher value indicates a more silent or introspective track.`;
            definition = METRIC_DEFINITIONS.silence;
            labelComment = getSilenceLabel((analysisData.lowlevel.silence_rate_60dB?.mean) * 100);
            break;
        case 'brightness':
            value = analysisData.lowlevel?.spectral_centroid?.mean !== undefined ? analysisData.lowlevel.spectral_centroid.mean.toFixed(0) : '--';
            title = 'Brightness';
            interpretation = `This metric reflects the perceived brightness of the sound, related to spectral centroid. A higher value indicates a brighter or more energetic sound.`;
            definition = METRIC_DEFINITIONS.brightness;
            labelComment = getBrightnessLabel(analysisData.lowlevel?.spectral_centroid?.mean);
            break;
        case 'texture':
            value = Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length).toFixed(2) : '--';
            title = 'Texture';
            interpretation = `This metric reflects the complexity of the sound texture, often related to spectral contrast. A higher value indicates a more complex or varied sound texture.`;
            definition = METRIC_DEFINITIONS.texture;
            labelComment = getTextureLabel(Array.isArray(analysisData.lowlevel?.spectral_contrast_coeffs?.mean) ? (analysisData.lowlevel.spectral_contrast_coeffs.mean.reduce((a, b) => a + b, 0) / analysisData.lowlevel.spectral_contrast_coeffs.mean.length) : 0);
            break;
        case 'layering':
            value = analysisData.lowlevel?.spectral_complexity?.mean !== undefined ? analysisData.lowlevel.spectral_complexity.mean.toFixed(2) : '--';
            title = 'Layering';
            interpretation = `This metric reflects the number of simultaneous sound sources or layers in the track. A higher value indicates a more layered or complex soundscape.`;
            definition = METRIC_DEFINITIONS.layering;
            labelComment = getLayeringLabel(analysisData.lowlevel?.spectral_complexity?.mean);
            break;
        default:
            return <p>Unknown Metric</p>;
    }
    return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d1d5db', marginBottom: '0.5rem' }}>{title}</h3>
            <p className="gradient-text" style={{ fontSize: '4.5rem', fontWeight: '800', margin: '1.5rem 0' }}>{value}</p>
            {labelComment && (
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    marginBottom: 18,
                    letterSpacing: 0.5,
                    textShadow: '0 2px 12px #0ea5e9cc',
                }}>{labelComment}</div>
            )}
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
    <div className="focus-classifier-view">
        {/* Title Section */}
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
            <h3 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'capitalize' }}>{featureName}</h3>
            <p style={{ fontSize: '1.125rem', color: '#d1d5db' }}>Dominant: <span style={{ fontWeight: '600', color: 'white' }}>{valueName}</span></p>
        </div>

        {/* Two-Column Container */}
        <div className="two-column-container">
            
            {/* Left Column (Chart) */}
            <div style={{ flex: 1.2, minHeight: '20rem' }}>
                <canvas ref={canvasRef}></canvas>
            </div>

            {/* Right Column (Info) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: '0.5rem', flexShrink: 0 }}>Detailed Breakdown</h4>
                <ul className="scrollable-chart" style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flex: 1, paddingRight: '0.5rem', minHeight: '4rem' }}>
                    {sortedData.map(([label, prob]) => (
                        <li key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.35rem 0.75rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: '#fff', fontWeight: 600, marginRight: 8 }}>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
                            <span style={{ fontFamily: 'monospace', color: '#d1d5db', fontWeight: 400 }}>{(prob * 100).toFixed(2)}%</span>
                        </li>
                    ))}
                </ul>
                <div style={{ marginTop: '1rem', flexShrink: 0 }}>
                    <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: '0.5rem' }}>Definition</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }} dangerouslySetInnerHTML={{ __html: tooltips[featureKey] }} />
                    <h4 style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '1rem', marginBottom: '0.5rem' }}>Interpretation</h4>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{interpretationText}</p>
                </div>
            </div>
        </div>

        {/* --- UPDATED RESPONSIVE STYLES (NOW SCOPED) --- */}
        <style jsx>{`
            .focus-classifier-view {
                padding: 1.5rem;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            .two-column-container {
                flex: 1;
                display: flex;
                gap: 1.5rem;
                min-height: 0;
            }

            @media (max-width: 1000px) {
                .two-column-container {
                    flex-direction: column;
                    gap: 1rem;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }

                .two-column-container > div:first-child {
                    min-height: 15rem !important;
                    flex-shrink: 0;
                }
                
                /* MODIFIED: All selectors are now prefixed with .focus-classifier-view */
                .focus-classifier-view h3 {
                    font-size: 1.25rem !important;
                }
                .focus-classifier-view p {
                    font-size: 1rem !important;
                }
                .focus-classifier-view h4 {
                    font-size: 1rem !important;
                }
                .focus-classifier-view div[dangerouslySetInnerHTML] {
                    font-size: 0.8rem !important;
                }
            }
        `}</style>
    </div>
);
};

const FocusChartView = ({ chartType, analysisData }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);
    let title = '';
    let dominantChordText = '';
    let xLabels = [];
    let yData = [];
    let xAxisExplanation = '';
    let leaderboard = [];
    let majorLeaderboard = [];
    let minorLeaderboard = [];
    let majorChords = [];
    let minorChords = [];
    let labelLogic = '';
    let definition = '';
    let interpretation = '';
    let yAxisExplanation = '';
    switch (chartType) {
        case 'melbands':
            title = 'Mel Bands Energy';
            xLabels = analysisData.lowlevel.melbands.mean.map((_, i) => `Band ${i + 1}`);
            yData = analysisData.lowlevel.melbands.mean;
            xAxisExplanation = 'Each band represents a frequency range modeled after human hearing.';
            yAxisExplanation = 'The relative energy or strength in each frequency band.';
            definition = METRIC_DEFINITIONS.melbands;
            leaderboard = xLabels.map((label, i) => [label, yData[i]]).sort((a, b) => b[1] - a[1]);
            interpretation = 'Bands with higher energy indicate dominant frequency regions.';
            break;
        case 'chords':
            title = 'Chords Histogram';
            xLabels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            majorChords = analysisData.tonal.chords_histogram.slice(0, 12);
            minorChords = analysisData.tonal.chords_histogram.slice(12);
            yData = majorChords.map((v, i) => v + minorChords[i]);
            xAxisExplanation = 'Each label is a musical chord (Major or Minor).';
            yAxisExplanation = 'The percentage of each major and minor chord heard.';
            definition = METRIC_DEFINITIONS.chords;
            leaderboard = xLabels.map((label, i) => [label, yData[i]]).sort((a, b) => b[1] - a[1]);
            majorLeaderboard = xLabels.map((label, i) => [label, majorChords[i]]).sort((a, b) => b[1] - a[1]);
            minorLeaderboard = xLabels.map((label, i) => [label, minorChords[i]]).sort((a, b) => b[1] - a[1]);
            const maxIdx = yData.indexOf(Math.max(...yData));
            labelLogic = `Dominant: ${xLabels[maxIdx]}`;
            interpretation = 'The dominant chord(s) indicate the harmonic center of the track.';
            break;
        case 'tonality':
            title = 'Tonality Profile';
            xLabels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            yData = analysisData.tonal.thpcp.slice(0, 12);
            xAxisExplanation = 'Each label is a pitch class (note name).';
            yAxisExplanation = 'Y axis shows the relative strength of each pitch class.';
            definition = METRIC_DEFINITIONS.tonality;
            leaderboard = xLabels.map((label, i) => [label, yData[i]]).sort((a, b) => b[1] - a[1]);
            const maxPitchIdx = yData.indexOf(Math.max(...yData));
            labelLogic = `Dominant: ${xLabels[maxPitchIdx]}`;
            interpretation = 'The dominant pitch class indicates the tonal center of the track.';
            break;
        default:
            break;
    }
    useEffect(() => {
        if (canvasRef.current) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = canvasRef.current.getContext('2d');
            const chartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'Strength / Energy', color: '#FFFFFF' }, ticks: { color: '#FFFFFF' } }, x: { title: { display: true, text: 'Band / Class', color: '#FFFFFF' }, ticks: { color: '#FFFFFF', minRotation: 0, maxRotation: 0 } } }, plugins: { legend: { labels: { color: '#d1d5db' }, position: 'bottom' } } };
            let config = {};
            switch (chartType) {
                case 'melbands':
                    config = { type: 'line', data: { labels: xLabels, datasets: [{ label: 'Mean Energy', data: yData, borderColor: 'rgba(34, 211, 238, 1)', backgroundColor: 'rgba(34, 211, 238, 0.2)', fill: true, tension: 0.4 }] }, options: { ...chartOptions, plugins: { legend: { display: false } } } };
                    break;
                case 'chords':
                    config = { type: 'line', data: { labels: xLabels, datasets: [
                        { label: 'Major Chords', data: majorChords, borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 },
                        { label: 'Minor Chords', data: minorChords, borderColor: 'rgba(234, 179, 8, 1)', backgroundColor: 'rgba(234, 179, 8, 0.2)', fill: true, tension: 0.3 }
                    ] }, options: chartOptions };
                    break;
                case 'tonality':
                    config = { type: 'line', data: { labels: xLabels, datasets: [{ label: 'Pitch Strength', data: yData, borderColor: 'rgba(22, 163, 74, 1)', backgroundColor: 'rgba(22, 163, 74, 0.2)', fill: true, tension: 0.4 }] }, options: { ...chartOptions, plugins: { legend: { display: false } }, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, title: { display: true, text: 'Pitch Class', color: '#FFFFFF' } } } } };
                    break;
                default:
                    break;
            }
            chartInstance.current = new Chart(ctx, config);
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [chartType, analysisData]);
    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ width: '100%', height: '45vh' }}>
    {/* This container will now show a scrollbar when its content is too wide */}
    <div className="scrollable-chart" style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        {/* This inner div forces a minimum width for the chart, triggering the scrollbar on small screens */}
        <div style={{ position: 'relative', minWidth: '800px', height: '100%' }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    </div>
</div>
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0 }}>
  <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>{title}</h3>
  {labelLogic && <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600, marginBottom: 8 }}>{labelLogic}</div>}

  {/* --- NEW Two-Column Container --- */}
  <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', alignItems: 'flex-start' }}>

    {/* --- Left Column: Text Content --- */}
    <div style={{ flex: 2 }}>
      <div style={{ fontSize: '0.98rem', color: '#e5e7eb', marginBottom: 8 }}><b>Interpretation:</b> {interpretation}</div>
      <div style={{ fontSize: '0.98rem', color: '#e5e7eb', marginBottom: 8 }}><b>Definition:</b> {definition}</div>
      <div style={{ fontSize: '0.98rem', color: '#e5e7eb', marginBottom: 8 }}><b>X Axis:</b> {xAxisExplanation}</div>
      <div style={{ fontSize: '0.98rem', color: '#e5e7eb', marginBottom: 8 }}><b>Y Axis:</b> {yAxisExplanation}</div>
    </div>

    {/* --- Right Column: Leaderboard --- */}
    <div style={{ flex: 1 }}>
      {chartType === 'chords' ? (
        <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#e5e7eb', margin: '8px 0 4px 0' }}>Major Chords Leaderboard</div>
            <div style={{ borderRadius: 8, background: 'rgba(255,255,255,0.03)', padding: '12px 8px', width: 'fit-content' }}>
              {majorLeaderboard.map(([label, val], i) => (
                <div key={label + '-maj'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '3px 0', borderBottom: i !== majorLeaderboard.length - 1 ? '1px solid #222a' : 'none' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{rosamericaMap[label] || tzanetakisMap[label] || label}</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 500, paddingLeft: '1.5rem' }}>{val.toFixed(1)} %</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#e5e7eb', margin: '8px 0 4px 0' }}>Minor Chords Leaderboard</div>
            <div style={{ borderRadius: 8, background: 'rgba(255,255,255,0.03)', padding: '12px 8px', width: 'fit-content' }}>
              {minorLeaderboard.map(([label, val], i) => (
                <div key={label + '-min'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '3px 0', borderBottom: i !== minorLeaderboard.length - 1 ? '1px solid #222a' : 'none' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{rosamericaMap[label] || tzanetakisMap[label] || label}m</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 500, paddingLeft: '1.5rem' }}>{val.toFixed(1)} %</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 600, color: '#e5e7eb', margin: '8px 0 4px 0' }}>Leaderboard</div>
          <div style={{ borderRadius: 8, background: 'rgba(255,255,255,0.03)', padding: 8, width: 'fit-content' }}>
            {leaderboard.map(([label, val], i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '2px 0', borderBottom: i !== leaderboard.length - 1 ? '1px solid #222a' : 'none' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{label}</span>
                <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 500, paddingLeft: '1.5rem' }}>{val.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
</div>
        </div>
    );
};

export default AudioAnalysisInterface;