import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../../public/styles.css' ;

// --- DATA (Could be passed as props or fetched from an API) ---
const analysisData = { "highlevel": { "danceability": { "all": { "danceable": 3.00000096379e-14, "not_danceable": 1 }, "probability": 1, "value": "not_danceable" }, "gender": { "all": { "female": 0.622126698494, "male": 0.377873301506 }, "probability": 0.622126698494, "value": "female" }, "genre_dortmund": { "all": { "alternative": 0.00173079362139, "blues": 0.000234076520428, "electronic": 0.997009396553, "folkcountry": 0.00024758829386, "funksoulrnb": 0.0000162131018442, "jazz": 0.000586069189012, "pop": 0.0000228353383136, "raphiphop": 0.0000030562973734, "rock": 0.000149954546941 }, "probability": 0.997009396553, "value": "electronic" }, "genre_electronic": { "all": { "ambient": 0.824788510799, "dnb": 0.00784057378769, "house": 0.0541309453547, "techno": 0.0252032130957, "trance": 0.0880367308855 }, "probability": 0.824788510799, "value": "ambient" }, "genre_rosamerica": { "all": { "cla": 0.0140439113602, "dan": 0.10852714628, "hip": 0.525074064732, "jaz": 0.0282021481544, "pop": 0.0521702617407, "rhy": 0.187966510653, "roc": 0.0553710013628, "spe": 0.028644932434 }, "probability": 0.525074064732, "value": "hip" }, "genre_tzanetakis": { "all": { "blu": 0.0617713928223, "cla": 0.0343018434942, "cou": 0.102904699743, "dis": 0.0514719486237, "hip": 0.154438391328, "jaz": 0.309046447277, "met": 0.0441263727844, "pop": 0.0772129744291, "reg": 0.0617708563805, "roc": 0.102955065668 }, "probability": 0.309046447277, "value": "jaz" }, "ismir04_rhythm": { "all": { "ChaChaCha": 0.219179928303, "Jive": 0.0708882287145, "Quickstep": 0.020754950121, "Rumba-American": 0.105449870229, "Rumba-International": 0.11717300117, "Rumba-Misc": 0.0277258716524, "Samba": 0.165485441685, "Tango": 0.152673691511, "VienneseWaltz": 0.103436812758, "Waltz": 0.0172321908176 }, "probability": 0.219179928303, "value": "ChaChaCha" }, "mood_acoustic": { "all": { "acoustic": 0.0955903604627, "not_acoustic": 0.904409646988 }, "probability": 0.904409646988, "value": "not_acoustic" }, "mood_aggressive": { "all": { "aggressive": 3.00000096379e-14, "not_aggressive": 1 }, "probability": 1, "value": "not_aggressive" }, "mood_electronic": { "all": { "electronic": 0.979391694069, "not_electronic": 0.0206082761288 }, "probability": 0.979391694069, "value": "electronic" }, "mood_happy": { "all": { "happy": 0.0889225304127, "not_happy": 0.911077439785 }, "probability": 0.911077439785, "value": "not_happy" }, "mood_party": { "all": { "not_party": 0.999984204769, "party": 0.0000157784197654 }, "probability": 0.999984204769, "value": "not_party" }, "mood_relaxed": { "all": { "not_relaxed": 0.191182896495, "relaxed": 0.808817088604 }, "probability": 0.808817088604, "value": "relaxed" }, "mood_sad": { "all": { "not_sad": 0.421196848154, "sad": 0.578803122044 }, "probability": 0.578803122044, "value": "sad" }, "moods_mirex": { "all": { "Cluster1": 0.072305701673, "Cluster2": 0.0464175790548, "Cluster3": 0.226238042116, "Cluster4": 0.0314756669104, "Cluster5": 0.623562991619 }, "probability": 0.623562991619, "value": "Cluster5" }, "timbre": { "all": { "bright": 0.0343042463064, "dark": 0.965695738792 }, "probability": 0.965695738792, "value": "dark" }, "tonal_atonal": { "all": { "atonal": 0.870785534382, "tonal": 0.129214465618 }, "probability": 0.870785534382, "value": "atonal" }, "voice_instrumental": { "all": { "instrumental": 0.99999833107, "voice": 0.00000169780503256 }, "probability": 0.99999833107, "value": "instrumental" } }

, "lowlevel": { "average_loudness": 0.902937471867, "dynamic_complexity": 2.59750294685, "spectral_centroid": { "mean": 684.32611084 }, "spectral_energy": { "mean": 0.0482348315418 }, "melbands": { "mean": [0.00408389652148, 0.00282122660428, 0.00155736785382, 0.00219496455975, 0.00140095013194, 0.000607283378486, 0.000391209381633, 0.000252508703852, 0.000125975027913, 0.00012134690769, 0.000116609480756, 6.1062113673e-05, 5.00756577821e-05, 4.35167348769e-05, 2.42657224589e-05, 1.39293770189e-05, 9.27385281102e-06, 8.33066042105e-06, 8.75117802934e-06, 6.98387475495e-06, 6.57667214909e-06, 5.32606554771e-06, 5.01424256072e-06, 5.03292994836e-06, 4.4893181439e-06, 3.98336078433e-06, 2.91368019134e-06, 2.21005939238e-06, 1.92141988009e-06, 1.18954244499e-06, 8.38432754335e-07, 7.96279721271e-07, 3.94662976078e-07, 2.21890374519e-07, 1.33085279685e-07, 8.38024618588e-08, 8.33020550317e-08, 8.95782363841e-08, 9.61663957355e-08, 6.83915786226e-08] } }, 

"metadata": { "tags": { "album": ["The College Dropout"], "artist": ["Kanye West"], "title": ["Spaceship (feat. GLC and Consequence)"] } }, "rhythm": { "beats_count": 495, "bpm": 89.1494750977, "danceability": 1.1902936697 }, "tonal": { "thpcp":[1,0.933691859245,0.853007555008,0.861245214939,0.696768939495,0.442062079906,0.328215628862,0.342406630516,0.364264190197,0.334256649017,0.315428078175,0.320913523436,0.35806581378,0.464995145798,0.67702382803,0.835417926311,0.691507339478,0.476561158895,0.66906017065,0.938908219337,0.719447851181,0.417508333921,0.339020460844,0.317737460136,0.357445418835,0.440023392439,0.498956441879,0.532432258129,0.542129814625,0.512428581715,0.510303676128,0.495319604874,0.425611287355,0.396347403526,0.467070758343,0.751069545746], "chords_histogram": [11.1, 6.47, 6.30, 0, 3.88, 1.76, 27.88, 4.24, 5.12, 7.06, 0, 3.30, 0.07, 4.82, 1.44, 5.80, 6.28, 0.37, 0.21, 0, 0, 0.25, 0, 3.56], "chords_key": "F", "chords_scale": "minor", "key_key": "G#", "key_scale": "minor", "key_strength": 0.560105204582 } };

const tooltips = { danceability: "Classifies whether a track is suitable for dancing based on rhythmic patterns.", gender: "Identifies the gender of the primary vocalist.", genre_dortmund: "Classifies the track into one of nine broad genres based on the Dortmund model.", genre_electronic: "Classifies the track into sub-genres of electronic music.", genre_rosamerica: "Classifies the track based on the Rosamerica genre taxonomy.", genre_tzanetakis: "Classifies the track based on the Tzanetakis genre collection.", ismir04_rhythm: "Classifies the track's rhythm into ballroom dance styles.", mood_acoustic: "Detects the presence of acoustic instruments.", mood_aggressive: "Detects if the track has an aggressive or intense mood.", mood_electronic: "Detects the presence of electronic instruments and sounds.", mood_happy: "Detects if the track has a happy, cheerful mood.", mood_party: "Detects if the track is suitable for a party atmosphere.", mood_relaxed: "Detects if the track has a relaxed, calm mood.", mood_sad: "Detects if the track has a sad or melancholic mood.", moods_mirex: "Classifies the track's mood into one of five clusters from the MIREX challenge.", timbre: "Describes the textural quality of the sound (bright vs. dark).", tonal_atonal: "Distinguishes between music with a clear tonal center (tonal) and music without (atonal).", voice_instrumental: "Classifies whether the track is primarily vocal or instrumental.", average_loudness: "A measure of the perceived loudness of the track, normalized to a 0-1 range.", dynamic_complexity: "Complexity of loudness changes over time. Higher values mean more variation.", rhythm_danceability: "How suitable a track is for dancing, based on tempo, regularity, and beat strength.", bpm: "Beats Per Minute, the tempo of the music.", beats_count: "Total number of detected beats in the track.", key_strength: "The confidence level of the detected musical key.", spectral_centroid: "Indicates the 'center of mass' of the sound spectrum. Higher values mean 'brighter' sounds.", melbands: "Represents the energy in different frequency bands, modeled after human hearing.", chords_histogram: "Shows the relative presence of each of the 12 major and 12 minor chords.", key: "The estimated musical key of the track, consisting of a tonic (e.g., C, G#) and a scale (major or minor).", thpcp: "Tonal Harmonic Pitch Class Profile (THPCP) shows the strength of each of the 12 musical pitch classes, providing a detailed view of the track's harmonic content." };
const interpretations = { danceability: { not_danceable: "The track's rhythm is more suited for listening than dancing, likely due to its complexity or lack of a strong, regular beat." }, gender: { female: "A female vocalist is identified as the primary voice in this track.", male: "A male vocalist is identified as the primary voice in this track." }, genre_dortmund: { electronic: "The track is predominantly electronic, characterized by synthesized sounds and programmed beats." }, genre_electronic: { ambient: "This piece falls into the ambient sub-genre, suggesting a focus on atmosphere and texture over rhythm." }, genre_rosamerica: { hip: "The song aligns with the Hip-Hop genre, likely featuring rhythmic speech and strong basslines." }, genre_tzanetakis: { jaz: "Elements of Jazz are prominent, possibly including improvisation, swing rhythms, or characteristic instrumentation." }, ismir04_rhythm: { ChaChaCha: "The rhythm has characteristics of a Cha-Cha-Cha, with a syncopated 4/4 time signature." }, mood_acoustic: { not_acoustic: "The sound is primarily driven by electronic or amplified instruments, not acoustic ones." }, mood_aggressive: { not_aggressive: "The track lacks harsh, driving elements, creating a non-aggressive and likely smoother listening experience." }, mood_electronic: { electronic: "The sonic palette is dominated by synthesizers, drum machines, or other electronic sources." }, mood_happy: { not_happy: "The musical cues suggest a mood that is not overtly happy, possibly neutral, sad, or tense." }, mood_party: { not_party: "This track is not optimized for a high-energy party setting; it may be more introspective or relaxed." }, mood_relaxed: { relaxed: "The song's tempo, instrumentation, and dynamics create a soothing and relaxed atmosphere." }, mood_sad: { sad: "The track conveys a sense of sadness or melancholy, likely through a slow tempo, minor key, and somber instrumentation." }, timbre: { dark: "The sound is characterized by lower-frequency content, giving the track a warm, deep, or mellow feel." }, tonal_atonal: { atonal: "The track avoids a traditional key center, creating a sense of tension or abstraction." }, voice_instrumental: { instrumental: "The piece is primarily instrumental, with human voice being absent or non-focal." }, default: "This classification contributes to the overall sonic profile of the track." };


const AudioAnalysisInterface = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [focusViewData, setFocusViewData] = useState({ isOpen: false, content: null, type: null });
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    const activeCharts = useRef([]);
    const activeFocusChart = useRef(null);

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

    const openFocusView = (type, data) => {
        setFocusViewData({ isOpen: true, type: type, data: data });
    };
    
    const closeFocusView = () => {
        setFocusViewData({ isOpen: false, content: null, type: null });
    };
    
    // --- DATA ---
    const meta = analysisData.metadata.tags;
    const high = analysisData.highlevel;

    return (
        <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen">

            {/* Main Interface */}
            <div className="text-center p-8">
                <h1 className="text-5xl font-extrabold mb-4 gradient-text">Audio Intelligence</h1>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">Uncover the DNA of your audio. Click below to launch the full analysis dashboard.</p>
                <div>
                    <button onClick={openModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-full transition duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105">
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
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
                    <div id="modal-container" className={`bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-7xl relative ${focusViewData.isOpen ? 'blurred' : ''}`}>
                        <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Comprehensive Audio Analysis</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto modal-content">
                            {/* --- MODAL CONTENT AREA --- */}
                            <div className="bg-gray-900/50 p-6 rounded-xl mb-8 text-center border border-gray-700">
                                <h3 className="text-3xl font-bold gradient-text">{meta.title[0]}</h3>
                                <p className="text-xl text-gray-300">{meta.artist[0]} &mdash; {meta.album[0]}</p>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-4 text-gray-100">High-Level Classifiers</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {Object.entries(high).map(([key, feature]) => (
                                    <HighLevelCard key={key} featureKey={key} feature={feature} onCardClick={() => openFocusView('classifier', key)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                                ))}
                            </div>

                            <h3 className="text-2xl font-bold mb-4 text-gray-100">Key Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <MetricCard title="BPM" value={analysisData.rhythm.bpm.toFixed(1)} description="Beats Per Minute" tooltipText={tooltips.bpm} onClick={() => openFocusView('metric', 'bpm')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                                <MetricCard title="Danceability" value={analysisData.rhythm.danceability.toFixed(2)} description="Rhythm-based score" tooltipText={tooltips.rhythm_danceability} onClick={() => openFocusView('metric', 'danceability')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                                <MetricCard title="Loudness" value={`${(analysisData.lowlevel.average_loudness * 100).toFixed(1)}%`} description="Average perceived volume" tooltipText={tooltips.average_loudness} onClick={() => openFocusView('metric', 'loudness')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                                <MetricCard title="Dyn. Complexity" value={analysisData.lowlevel.dynamic_complexity.toFixed(2)} description="Loudness variation" tooltipText={tooltips.dynamic_complexity} onClick={() => openFocusView('metric', 'dyn_complexity')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                            </div>

                            <h3 className="text-2xl font-bold mb-4 text-gray-100">Detailed Analysis</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                               <DetailedChartCard title="Tonality Profile" chartType="tonality" tooltipText={tooltips.thpcp} onCardClick={() => openFocusView('chart', 'tonality')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                               <DetailedChartCard title="Mel Bands Mean Energy" chartType="melbands" tooltipText={tooltips.melbands} onCardClick={() => openFocusView('chart', 'melbands')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                               <DetailedChartCard title="Chords Histogram" chartType="chords" tooltipText={tooltips.chords_histogram} onCardClick={() => openFocusView('chart', 'chords')} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Focus View */}
            {focusViewData.isOpen && <FocusView data={focusViewData} onClose={closeFocusView} />}

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
            className="bg-gray-900/50 p-4 rounded-xl flex flex-col border border-gray-700 card-hover"
            onClick={onCardClick}
            onMouseMove={(e) => onMouseMove(e, tooltips[featureKey] || '')}
            onMouseLeave={onMouseLeave}
        >
            <h4 className="text-md font-semibold capitalize text-gray-300 mb-2">{featureName}</h4>
            <div className="text-center my-2">
                <p className="text-2xl font-bold gradient-text">{valueName}</p>
                <p className="text-sm text-gray-400">Confidence: {probabilityPercent}%</p>
            </div>
            <div className="chart-container h-24 mt-auto mb-3">
                <canvas ref={canvasRef}></canvas>
            </div>
            <div className="mt-2 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-200">Impact:</span> {interpretationText.substring(0, 70) + (interpretationText.length > 70 ? '...' : '')}
                </p>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, description, tooltipText, onClick, onMouseMove, onMouseLeave }) => {
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
}

const DetailedChartCard = ({ title, chartType, tooltipText, onCardClick, onMouseMove, onMouseLeave }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
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
    }, [chartType]);

    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 card-hover"
            onClick={onCardClick}
            onMouseMove={(e) => onMouseMove(e, tooltipText)}
            onMouseLeave={onMouseLeave}>
            <h4 className="text-lg font-semibold mb-2 text-gray-200">{title}</h4>
            <div className="chart-container">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
};

const FocusView = ({ data, onClose }) => {
    // Render different focus views based on data.type ('classifier', 'metric', 'chart')
    // This is a simplified example; a full implementation would be more complex.
    if (!data.isOpen) return null;

    let content = null;
    if(data.type === 'metric') {
        let value, title, interpretation, definition;
        switch(data.data) {
            case 'bpm': value = analysisData.rhythm.bpm.toFixed(1); title = 'BPM (Beats Per Minute)'; interpretation = `A tempo of ${value} BPM is moderately paced.`; definition = tooltips.bpm; break;
            case 'danceability': value = analysisData.rhythm.danceability.toFixed(2); title = 'Danceability'; interpretation = `A score of ${value} suggests the track is highly suitable for dancing.`; definition = tooltips.rhythm_danceability; break;
            case 'loudness': value = `${(analysisData.lowlevel.average_loudness * 100).toFixed(1)}%`; title = 'Average Loudness'; interpretation = `A score of ${value} suggests a relatively high and consistent volume.`; definition = tooltips.average_loudness; break;
            case 'dyn_complexity': value = analysisData.lowlevel.dynamic_complexity.toFixed(2); title = 'Dynamic Complexity'; interpretation = `A score of ${value} reflects the variation in loudness throughout the track.`; definition = tooltips.dynamic_complexity; break;
            default: break;
        }
        content = (
             <div className="p-8 text-center h-full flex flex-col justify-center">
                <div className="absolute top-6 right-6"><button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button></div>
                <h3 className="text-2xl font-bold text-gray-300 mb-2">{title}</h3>
                <p className="text-7xl font-extrabold gradient-text my-6">{value}</p>
                <h4 className="font-semibold text-gray-200 mt-4 mb-2">Interpretation</h4><p className="text-gray-400 max-w-md mx-auto">{interpretation}</p>
                <h4 className="font-semibold text-gray-200 mt-4 mb-2">Definition</h4><p className="text-sm text-gray-500 max-w-md mx-auto">{definition}</p>
            </div>
        );
    }
    // Add more conditions for 'classifier' and 'chart' types here...

    return (
         <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-11/12 h-5/6">
                 {content || <div className="p-6"><button onClick={onClose} className="text-gray-400 hover:text-white text-3xl float-right">&times;</button><h3 className="text-2xl font-bold gradient-text">Focus View</h3><p>Content for {data.type}: {data.data} would be rendered here.</p></div>}
            </div>
        </div>
    );
};

export default AudioAnalysisInterface;