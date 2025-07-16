'use client';

import React, { useState } from 'react';
import styles from './ArtistPage.module.css';

// --- Helper Components ---

// Icon components to keep JSX clean
const VerifiedIcon = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={styles.verifiedIcon}><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm6.92,8.48-1.83.83,1-2.09a1,1,0,0,0-1.28-1.28l-2.09,1L13.9,7.08a1,1,0,0,0-1.8,0l-.83,1.83-2.09-1a1,1,0,0,0-1.28,1.28l1,2.09-1.83.83a1,1,0,0,0,0,1.8l1.83.83-1,2.09a1,1,0,0,0,1.28,1.28l2.09-1,.83,1.83a1,1,0,0,0,1.8,0l.83-1.83,2.09,1a1,1,0,0,0,1.28-1.28l-1-2.09,1.83-.83a1,1,0,0,0,0-1.8ZM13.08,14.25,12,15l-1.08-.75L10.2,15.5l.4,1.3-1.28.62.8,1.43,1.28-.62,1.28.62.8-1.43-1.28-.62.4-1.3Z"/></svg>
);

const PlayIcon = () => (
    <svg className={styles.playIcon} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
);

const TrackPlayIcon = () => (
     <svg className={styles.trackPlayIcon} fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 3.72a.75.75 0 011.12.63v11.3c0 .35-.41.59-.73.43L4.1 14.54a.75.75 0 010-1.3l1.4-.82a.75.75 0 000-1.3L4.1 10.3a.75.75 0 010-1.3l2.2-1.28zM13.7 3.72a.75.75 0 00-1.12.63v11.3c0 .35.41.59.73.43l2.6-1.52a.75.75 0 000-1.3l-1.4-.82a.75.75 0 010-1.3l1.4-.82a.75.75 0 000-1.3L12.58 4.35z"/></svg>
);

const Loader = () => <div className={styles.loader}></div>;


// --- Main Page Sections as Components ---

const HeroSection = ({ artist }) => (
    <section 
        className={styles.heroBanner} 
        style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0) 100%), url('${artist.images.hero}')` }}
    >
        <div className={styles.heroContent}>
            <div className={styles.heroInfo}>
                <img src={artist.images.profile} alt={artist.name} className={styles.profileImage} />
                <div>
                    <div className={styles.artistNameContainer}>
                        <h1 className={styles.artistName}>{artist.name}</h1>
                        <VerifiedIcon />
                    </div>
                    <p className={styles.followerCount}>
                        {new Intl.NumberFormat().format(artist.followers.replace(/,/g, ''))} Followers
                    </p>
                </div>
            </div>
            <div className={styles.heroActions}>
                <button className={`${styles.btn} ${styles.btnGreen}`}>Follow</button>
                <button className={`${styles.btn} ${styles.btnOutline}`}>Play</button>
                <button className={styles.btnMore}>…</button>
            </div>
        </div>
    </section>
);

const PopularTracksSection = ({ tracks }) => (
    <section>
        <h2 className={styles.sectionTitle}>Popular</h2>
        <div className={styles.trackList}>
            {tracks.map((track, index) => (
                <div key={track.title} className={styles.trackRow}>
                    <div className={styles.trackNumber}>{index + 1}</div>
                    <img 
                        src={`https://placehold.co/40x40/CCCCCC/333333?text=${track.title.charAt(0)}`} 
                        alt={track.title} 
                        className={styles.trackImage} 
                    />
                    <div className={styles.trackTitle}>{track.title}</div>
                    <div className={styles.trackPopularity}>
                        <span>Popularity</span>
                        <div className={styles.popularityBarBg}>
                            <div className={styles.popularityBarFg} style={{ width: `${track.popularity}%` }}></div>
                        </div>
                    </div>
                    <div className={styles.trackDuration}>{track.duration}</div>
                    <div className={styles.trackPlayButtonContainer}>
                        <button className={styles.trackPlayButton}><TrackPlayIcon /></button>
                    </div>
                </div>
            ))}
        </div>
        <button className={styles.showMoreButton}>Show more</button>
    </section>
);

const DiscographySection = ({ albums, singles, onAlbumClick }) => {
    const [activeTab, setActiveTab] = useState('albums');

    const AlbumCard = ({ album, type }) => (
        <div className={styles.albumCard} onClick={() => onAlbumClick(album.id, type)}>
            <div className={styles.albumArt}>
                <img src={album.img} alt={album.name} className={styles.albumImage} />
                <div className={styles.playIconOverlay}><PlayIcon /></div>
            </div>
            <p className={styles.albumName}>{album.name}</p>
            <p className={styles.albumYear}>{album.year}</p>
        </div>
    );

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Discography</h2>
                <div className={styles.tabsContainer}>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'albums' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('albums')}
                    >
                        Albums
                    </button>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'singles' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('singles')}
                    >
                        Singles & EPs
                    </button>
                </div>
            </div>
            
            <div className={`${styles.tabContent} ${activeTab === 'albums' ? styles.show : ''}`}>
                 <p className={styles.sectionSubtitle}>Explore the official studio albums...</p>
                 <div className={styles.albumGrid}>
                    {albums.map(album => <AlbumCard key={album.id} album={album} type="albums" />)}
                 </div>
            </div>

            <div className={`${styles.tabContent} ${activeTab === 'singles' ? styles.show : ''}`}>
                 <p className={styles.sectionSubtitle}>Discover the latest singles and EPs...</p>
                 <div className={styles.albumGrid}>
                    {singles.map(single => <AlbumCard key={single.id} album={single} type="singles" />)}
                 </div>
            </div>
        </section>
    );
};

const TracklistDisplaySection = ({ album, artistName }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');

    // Reset analysis when a new album is selected
    React.useEffect(() => {
        setAnalysis('');
        setError('');
        setIsLoading(false);
    }, [album]);

    if (!album) return null;

    const callGemini = async () => {
        setIsLoading(true);
        setAnalysis('');
        setError('');
        
        const prompt = `Provide a concise analysis of the musical and lyrical concepts behind the album "${album.name}" by ${artistName}. What are the main themes, the overall mood, and the story it tells?`;
        const apiKey = ""; // API key will be injected by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                setAnalysis(text);
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Sorry, I couldn't generate a response. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className={`${styles.tracklistContainer} ${album ? styles.show : ''}`}>
            <div className={styles.tracklistContent}>
                <img src={album.img} alt={album.name} className={styles.tracklistAlbumArt} />
                <div className={styles.tracklistDetails}>
                    <h3 className={styles.tracklistTitle}>{album.name}</h3>
                    <p className={styles.tracklistSubtitle}>Album • {album.year}</p>
                    <div className={styles.tracklist}>
                        {album.tracks.map(track => (
                            <div key={track.num} className={styles.tracklistRow}>
                                <div className={styles.tracklistNumber}>{track.num}</div>
                                <div className={styles.tracklistTrackTitle}>{track.title}</div>
                                <div className={styles.tracklistDuration}>{track.duration}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.aiSection}>
                        <button onClick={callGemini} disabled={isLoading} className={`${styles.btn} ${styles.btnGemini}`}>
                            {isLoading ? 'Analyzing...' : '✨ Analyze Album Concept'}
                        </button>
                        <div className={styles.aiContent}>
                            {isLoading && <div className={styles.aiLoader}><Loader /><p>Analyzing...</p></div>}
                            {error && <p className={styles.aiError}>{error}</p>}
                            {analysis && (
                                <div>
                                    <p className={styles.aiResultText} dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                                    <p className={styles.aiCredit}>✨ Analysis generated by Gemini</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


const OnTourSection = ({ tourDates }) => (
    <section className={styles.section}>
        <h2 className={styles.sectionTitle}>On Tour</h2>
        <p className={styles.sectionSubtitle}>Catch the artist live...</p>
        <div className={styles.tourList}>
            {tourDates.map(tour => (
                <div key={tour.venue} className={styles.tourRow}>
                    <div>
                        <p className={styles.tourCity}>{tour.city}</p>
                        <p className={styles.tourVenue}>{tour.venue}</p>
                    </div>
                    <div className={styles.tourDateInfo}>
                        <p className={styles.tourDate}>{tour.date}</p>
                        <a href="#" className={`${styles.btn} ${styles.btnBlue}`}>Get Tickets</a>
                    </div>
                </div>
            ))}
        </div>
    </section>
);


// --- Main App Component ---

export default function ArtistPage() {
    // In a real app, this data would come from an API
    const artistData = {
        name: 'Travis Scott',
        followers: '65123456',
        images: {
            hero: 'https://placehold.co/1200x800/222222/FFFFFF?text=Artist+Photo',
            profile: 'https://placehold.co/150x150/4A5568/FFFFFF?text=TS',
        },
        popularTracks: [
            { title: 'SICKO MODE', popularity: 92, duration: '5:12' },
            { title: 'GOOSEBUMPS', popularity: 90, duration: '4:03' },
            { title: 'HIGHEST IN THE ROOM', popularity: 88, duration: '2:55' },
            { title: 'STARGAZING', popularity: 85, duration: '4:31' },
            { title: 'BUTTERFLY EFFECT', popularity: 84, duration: '3:11' },
        ],
        albums: [
            { id: 'utopia', name: 'UTOPIA', year: '2023', img: 'https://placehold.co/300x300/1E1E1E/FFFFFF?text=UTOPIA', tracks: [{num: 1, title: 'HYAENA', duration: '3:42'}, {num: 2, title: 'THANK GOD', duration: '3:04'}, {num: 3, title: 'MODERN JAM', duration: '4:15'}] },
            { id: 'astro', name: 'ASTROWORLD', year: '2018', img: 'https://placehold.co/300x300/4A3C6A/FFFFFF?text=ASTROWORLD', tracks: [{num: 1, title: 'STARGAZING', duration: '4:31'}, {num: 2, title: 'SICKO MODE', duration: '5:12'}] },
        ],
        singles: [
            { id: 'franchise', name: 'FRANCHISE', year: '2020', img: 'https://placehold.co/300x300/A0A0A0/FFFFFF?text=FRANCHISE', tracks: [{num: 1, title: 'FRANCHISE (feat. Young Thug & M.I.A.)', duration: '3:22'}] },
        ],
        tourDates: [
            { date: 'SEP 25, 2025', venue: 'The O2', city: 'London, UK' },
            { date: 'SEP 28, 2025', venue: 'Madison Square Garden', city: 'New York, NY' },
        ]
    };

    const [selectedAlbum, setSelectedAlbum] = useState(null);

    const handleAlbumClick = (albumId, albumType) => {
        const albumData = artistData[albumType].find(a => a.id === albumId);
        setSelectedAlbum(albumData);
        // Scroll to the tracklist section smoothly
        setTimeout(() => {
            const tracklistElement = document.getElementById('tracklist-display');
            if (tracklistElement) {
                tracklistElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100); // A short delay to ensure the element is rendered
    };

    return (
        <div className={styles.container}>
            <HeroSection artist={artistData} />
            <main className={styles.mainContent}>
                <PopularTracksSection tracks={artistData.popularTracks} />
                <DiscographySection 
                    albums={artistData.albums} 
                    singles={artistData.singles} 
                    onAlbumClick={handleAlbumClick} 
                />
                <div id="tracklist-display">
                    <TracklistDisplaySection album={selectedAlbum} artistName={artistData.name} />
                </div>
                <OnTourSection tourDates={artistData.tourDates} />
            </main>
        </div>
    );
}
