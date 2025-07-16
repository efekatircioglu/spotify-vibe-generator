"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Helper function to call the Gemini API
async function callGemini(prompt) {
    // This function should be placed in a separate utility file in a real app
    const apiKey = ""; // Your Gemini API key would go here in a real-world scenario
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text.replace(/\n/g, '<br />');
        } else {
            throw new Error("Invalid response structure from Gemini API.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I couldn't generate a response at this time. Please try again later.";
    }
}


// --- UI Components ---
// In a real app, these would be in their own files (e.g., /components/Spinner.js)

const Spinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{message}</div>
);


export default function ArtistPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const artistNameParam = searchParams.get('name') || '';
    const artistIdParam = searchParams.get('id') || '';

    // --- STATE MANAGEMENT ---
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [artistDetails, setArtistDetails] = useState(null);
    const [popularTracks, setPopularTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [singles, setSingles] = useState([]);
    const [concerts, setConcerts] = useState([]);
    
    const [selectedAlbumForTracks, setSelectedAlbumForTracks] = useState(null);
    const [albumTracks, setAlbumTracks] = useState([]);
    
    // AI Content State
    const [artistBio, setArtistBio] = useState('');
    const [albumAnalysis, setAlbumAnalysis] = useState({});

    // Loading and Error State
    const [loading, setLoading] = useState({
        details: false, popular: false, albums: false, concerts: false, tracks: false, bio: false, analysis: false
    });
    const [error, setError] = useState({
        details: '', popular: '', albums: '', concerts: '', tracks: '', bio: '', analysis: ''
    });

    // --- DATA FETCHING ---

    // Initialize artist from URL
    useEffect(() => {
        if (artistIdParam && artistNameParam) {
            setSelectedArtist({ id: artistIdParam, name: artistNameParam });
        }
    }, [artistIdParam, artistNameParam]);

    // Fetch all artist data when artist is selected
    useEffect(() => {
        if (!selectedArtist?.id) return;

        const fetchAllArtistData = async () => {
            setLoading(prev => ({ ...prev, details: true, popular: true, albums: true, concerts: true }));
            setError({ details: '', popular: '', albums: '', concerts: '', tracks: '' });
            
            // ASSUMPTION: A new endpoint to get all artist details.
            const artistDetailsPromise = fetch(`http://127.0.0.1:8000/artist-details/${selectedArtist.id}`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch artist details'));

            // ASSUMPTION: A new endpoint for popular tracks.
            const popularTracksPromise = fetch(`http://127.0.0.1:8000/artist-popular-tracks/${selectedArtist.id}`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch popular tracks'));

            const albumsPromise = fetch(`http://127.0.0.1:8000/artist-albums/${selectedArtist.id}`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch albums'));
            
            const concertsPromise = fetch(`http://127.0.0.1:8000/concerts/artist-search?name=${encodeURIComponent(selectedArtist.name)}`)
                .then(res => res.ok ? res.json() : Promise.reject('Concert search failed'))
                .then(data => {
                    const ticketmasterId = data._embedded?.attractions?.[0]?.id;
                    if (!ticketmasterId) return Promise.resolve({ events: [] }); // No artist found, return empty
                    return fetch(`http://127.0.0.1:8000/concerts/events?artistId=${ticketmasterId}`);
                })
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch events'));

            try {
                const [details, popular, albumData, concertData] = await Promise.all([
                    artistDetailsPromise, popularTracksPromise, albumsPromise, concertsPromise
                ]);

                setArtistDetails(details);
                setPopularTracks(popular.tracks || []);
                // ASSUMPTION: Your album endpoint returns an 'album_type' to distinguish.
                setAlbums(albumData.albums?.filter(a => a.album_type === 'album') || []);
                setSingles(albumData.albums?.filter(a => a.album_type !== 'album') || []);
                setConcerts(concertData._embedded?.events || []);

            } catch (err) {
                console.error("Error fetching artist data:", err);
                setError(prev => ({...prev, details: err.toString()}));
            } finally {
                setLoading({ details: false, popular: false, albums: false, concerts: false, tracks: false });
            }
        };

        fetchAllArtistData();
    }, [selectedArtist]);

    // Fetch tracks for a selected album
    useEffect(() => {
        if (!selectedAlbumForTracks?.id) {
            setAlbumTracks([]);
            return;
        }
        setLoading(prev => ({ ...prev, tracks: true }));
        setError(prev => ({ ...prev, tracks: '' }));
        fetch(`http://127.0.0.1:8000/album-tracks/${selectedAlbumForTracks.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch album tracks');
                return res.json();
            })
            .then(data => {
                setAlbumTracks(data.tracks || []);
            })
            .catch(err => {
                setError(prev => ({ ...prev, tracks: err.message }));
            })
            .finally(() => setLoading(prev => ({ ...prev, tracks: false })));
    }, [selectedAlbumForTracks]);


    // --- EVENT HANDLERS ---
    
    const handleArtistSelect = (artist) => {
        router.push(`/artist?name=${encodeURIComponent(artist.name)}&id=${artist.id}`);
    };

    const handleAlbumClick = (album) => {
        if (selectedAlbumForTracks?.id === album.id) {
            setSelectedAlbumForTracks(null); // Toggle off if same album is clicked
        } else {
            setSelectedAlbumForTracks(album);
        }
    };
    
    const handleGenerateBio = async () => {
        if (!artistDetails?.name) return;
        setLoading(prev => ({ ...prev, bio: true }));
        setArtistBio('');
        const prompt = `Write a detailed and engaging biography for the musical artist ${artistDetails.name}. Cover their origins, their unique musical style, their impact on culture, and briefly touch on the significance of their key albums.`;
        const bio = await callGemini(prompt);
        setArtistBio(bio);
        setLoading(prev => ({ ...prev, bio: false }));
    };
    
    const handleAnalyzeAlbum = async (album) => {
        if (!album?.name) return;
        setLoading(prev => ({ ...prev, analysis: true }));
        const currentAnalysis = { ...albumAnalysis };
        currentAnalysis[album.id] = '';
        setAlbumAnalysis(currentAnalysis);

        const prompt = `Provide a concise analysis of the musical and lyrical concepts behind the album "${album.name}" by ${artistDetails.name}. What are the main themes, the overall mood, and the story it tells?`;
        const analysis = await callGemini(prompt);
        
        const newAnalysis = { ...albumAnalysis };
        newAnalysis[album.id] = analysis;
        setAlbumAnalysis(newAnalysis);
        setLoading(prev => ({ ...prev, analysis: false }));
    };

    // --- RENDER LOGIC ---

    if (!selectedArtist) {
        return (
            <main className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-4">Artist Search</h1>
                <p className="text-gray-600 mb-6">Search for an artist to see their music, upcoming shows, and more.</p>
                {/* You would have your ArtistSearch component here */}
                <div>Search Component Placeholder</div>
            </main>
        );
    }
    
    return (
        <div className="bg-gray-50 text-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* --- HERO SECTION --- */}
                <section className="relative h-[50vh] md:h-[60vh] text-white flex items-end p-4 md:p-8 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0) 100%), url('${artistDetails?.images?.hero || 'https://placehold.co/1200x800/222222/FFFFFF?text=Loading...'}')` }}>
                    {loading.details ? <Spinner /> : error.details ? <ErrorMessage message={error.details}/> : artistDetails && (
                        <div className="z-10 w-full">
                            <div className="flex items-center space-x-4">
                                <img src={artistDetails.images.profile} alt={artistDetails.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-50 shadow-lg" />
                                <div>
                                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold">{artistDetails.name}</h1>
                                    <p className="mt-2 text-gray-200 text-sm md:text-base">{new Intl.NumberFormat().format(artistDetails.followers)} Followers</p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center space-x-4">
                                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-transform transform hover:scale-105">Follow</button>
                                <button className="border-2 border-white/50 hover:border-white/100 hover:bg-white/10 text-white font-bold py-2 px-6 rounded-full transition-transform transform hover:scale-105">Play</button>
                            </div>
                        </div>
                    )}
                </section>

                <main className="p-4 md:p-8">
                    {/* --- POPULAR TRACKS --- */}
                    <section className="mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Popular</h2>
                        {loading.popular ? <Spinner /> : error.popular ? <ErrorMessage message={error.popular}/> : (
                            <div className="space-y-2">
                                {popularTracks.map((track, index) => (
                                    <div key={track.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                                        <div className="w-8 text-gray-500 text-center">{index + 1}</div>
                                        <img src={track.image} alt={track.title} className="w-10 h-10 rounded-md ml-4" />
                                        <div className="ml-4 font-semibold flex-grow">{track.title}</div>
                                        <div className="w-32 text-gray-500 text-sm hidden md:flex items-center space-x-2">
                                            <span>Popularity</span>
                                            <div className="w-16 h-2 rounded-full bg-gray-200"><div className="h-2 rounded-full bg-green-500" style={{ width: `${track.popularity}%` }}></div></div>
                                        </div>
                                        <div className="w-16 text-gray-500 text-sm ml-4">{track.duration}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* --- DISCOGRAPHY --- */}
                    <section className="mb-12">
                         <h2 className="text-2xl md:text-3xl font-bold mb-4">Discography</h2>
                         {loading.albums ? <Spinner /> : error.albums ? <ErrorMessage message={error.albums} /> : (
                             <>
                                <h3 className="text-xl font-semibold text-gray-700 mb-3">Albums</h3>
                                <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                                    {albums.map(album => (
                                        <div key={album.id} onClick={() => handleAlbumClick(album)} className="flex-shrink-0 w-36 md:w-48 text-center cursor-pointer group">
                                            <img src={album.image} alt={album.name} className={`w-full h-auto aspect-square rounded-lg shadow-md transition-transform transform group-hover:scale-105 ${selectedAlbumForTracks?.id === album.id ? 'border-4 border-purple-600' : ''}`} />
                                            <p className="mt-2 font-semibold text-sm truncate">{album.name}</p>
                                            <p className="text-gray-500 text-xs">{album.year}</p>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3">Singles & EPs</h3>
                                <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                                   {singles.map(single => (
                                        <div key={single.id} onClick={() => handleAlbumClick(single)} className="flex-shrink-0 w-36 md:w-48 text-center cursor-pointer group">
                                            <img src={single.image} alt={single.name} className={`w-full h-auto aspect-square rounded-lg shadow-md transition-transform transform group-hover:scale-105 ${selectedAlbumForTracks?.id === single.id ? 'border-4 border-purple-600' : ''}`} />
                                            <p className="mt-2 font-semibold text-sm truncate">{single.name}</p>
                                            <p className="text-gray-500 text-xs">{single.year}</p>
                                        </div>
                                    ))}
                                </div>
                             </>
                         )}
                    </section>

                    {/* --- TRACKLIST DISPLAY --- */}
                    {selectedAlbumForTracks && (
                        <section className="mb-12 p-6 bg-white rounded-xl shadow-md border border-gray-200">
                            <h3 className="text-2xl font-bold mb-4">{selectedAlbumForTracks.name}</h3>
                            {loading.tracks ? <Spinner /> : error.tracks ? <ErrorMessage message={error.tracks} /> : (
                                <div className="space-y-2">
                                    {albumTracks.map((track, index) => (
                                        <div key={track.id} className="flex items-center p-1">
                                            <div className="w-8 text-gray-500">{index + 1}.</div>
                                            <div className="ml-3 flex-grow font-medium text-gray-700">{track.name}</div>
                                            <div className="w-16 text-gray-500 text-sm ml-4">{track.duration}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-6">
                                <button onClick={() => handleAnalyzeAlbum(selectedAlbumForTracks)} disabled={loading.analysis} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm disabled:bg-gray-400">
                                    {loading.analysis ? 'Analyzing...' : '✨ Analyze Album Concept'}
                                </button>
                                {albumAnalysis[selectedAlbumForTracks.id] && (
                                    <div className="mt-4 text-gray-600 leading-relaxed text-sm bg-purple-50 p-3 rounded-lg" dangerouslySetInnerHTML={{ __html: albumAnalysis[selectedAlbumForTracks.id] }}></div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* --- ON TOUR --- */}
                    <section className="mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">On Tour</h2>
                        {loading.concerts ? <Spinner /> : error.concerts ? <ErrorMessage message={error.concerts} /> : concerts.length > 0 ? (
                            <div className="space-y-4">
                                {concerts.map(event => (
                                    <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                                        <div>
                                            <p className="font-bold text-lg">{event._embedded?.venues?.[0]?.name || event.name}</p>
                                            <p className="text-gray-600">{event._embedded?.venues?.[0]?.city?.name}, {event._embedded?.venues?.[0]?.country?.name}</p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 sm:text-right">
                                            <p className="text-gray-500 font-semibold">{new Date(event.dates.start.localDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-blue-600">Get Tickets</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500">No upcoming concerts found for this artist.</p>}
                    </section>

                    {/* --- ABOUT --- */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl md:text-3xl font-bold">About</h2>
                            <button onClick={handleGenerateBio} disabled={loading.bio} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm disabled:bg-gray-400">
                                {loading.bio ? 'Generating...' : '✨ Generate Deeper Bio'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            <div className="md:col-span-2 bg-white p-6 rounded-lg border">
                                {loading.bio ? <Spinner /> : artistBio ? (
                                    <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: artistBio }}></div>
                                ) : <p className="text-gray-500 italic">Click the button to generate a detailed biography for this artist using AI.</p>}
                            </div>
                            <div className="md:col-span-1">
                                <img src={artistDetails?.images?.about || 'https://placehold.co/600x600/CCCCCC/FFFFFF?text=Artist'} alt={`About ${artistDetails?.name}`} className="rounded-lg shadow-md w-full" />
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
