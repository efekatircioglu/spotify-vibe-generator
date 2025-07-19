import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Cache for contributor data to prevent duplicate API calls
const contributorCache = new Map();

/**
 * A reusable component to render a list of items for a specific category.
 * @param {{ title: string, items: string[] }} props
 */
const ContributorSection = ({ title, items }) => {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                color: '#1db954', 
                marginBottom: 8, 
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
            }}>
                {title}
            </h3>
            <ul style={{ 
                listStyle: 'disc', 
                paddingLeft: 20, 
                margin: 0,
                color: '#fff'
            }}>
                {items.map((item, index) => (
                    <li key={index} style={{ 
                        marginBottom: 4,
                        fontSize: '1rem',
                        lineHeight: 1.4
                    }}>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};

/**
 * Fetches and displays contributors for a given MusicBrainz Recording ID (MBID).
 * @param {{ mbid: string }} props
 */
const ContributorFinder = ({ mbid }) => {
    const [contributors, setContributors] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Reset state when the MBID changes
        setContributors(null);
        setError(null);
        setLoading(true);

        if (!mbid) {
            setError("No MusicBrainz ID (MBID) was provided for this track.");
            setLoading(false);
            return;
        }

        // Check cache first
        if (contributorCache.has(mbid)) {
            console.log(`[ContributorFinder] Using cached data for MBID: ${mbid}`);
            setContributors(contributorCache.get(mbid));
            setLoading(false);
            return;
        }

        const fetchContributors = async () => {
            // IMPORTANT: Replace with your app's name, version, and contact info for the User-Agent.
            const MUSICBRAINZ_USER_AGENT = 'spotify-vibe-generator/1.0 (your@email.com)';
            const includes = 'artist-rels+work-rels';
            const url = `https://musicbrainz.org/ws/2/recording/${mbid}?inc=${includes}&fmt=json`;

            try {
                console.log(`[ContributorFinder] Fetching contributors for MBID: ${mbid}`);
                const response = await axios.get(url, {
                    headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT }
                });

                const relations = response.data.relations || [];
                const categorized = {
                    performers: [], writers: [], producers: [], mixers: [],
                    engineers: [], arrangers: [], remixers: []
                };

                relations.forEach(rel => {
                    const artistName = rel.artist?.name;
                    if (!artistName) return;

                    const addUnique = (category, value) => {
                        if (!categorized[category].includes(value)) {
                            categorized[category].push(value);
                        }
                    };

                    switch (rel.type) {
                        case 'performer': case 'instrument': case 'vocal':
                            const details = rel.attributes?.length > 0 ? `(${rel.attributes.join(', ')})` : '';
                            addUnique('performers', `${artistName} ${details}`.trim());
                            break;
                        case 'producer': addUnique('producers', artistName); break;
                        case 'writer': case 'composer': case 'lyricist': addUnique('writers', artistName); break;
                        case 'mix': addUnique('mixers', artistName); break;
                        case 'engineer': addUnique('engineers', artistName); break;
                        case 'arranger': addUnique('arrangers', artistName); break;
                        case 'remixer': addUnique('remixers', artistName); break;
                        default: break;
                    }
                });

                // Cache the result
                contributorCache.set(mbid, categorized);
                console.log(`[ContributorFinder] Cached contributors for MBID: ${mbid}`);
                
                setContributors(categorized);
            } catch (err) {
                console.error("Error fetching from MusicBrainz:", err);
                setError(`Failed to fetch data. The MBID may be incorrect or the service may be down.`);
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, [mbid]); // This effect re-runs whenever the mbid prop changes

    if (loading) {
        return (
            <div style={{ 
                textAlign: 'center', 
                color: '#1db954', 
                fontSize: '1.1rem',
                fontWeight: 600,
                padding: '20px 0'
            }}>
                Fetching contributors...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                textAlign: 'center', 
                color: '#f87171', 
                fontSize: '1rem',
                fontWeight: 500,
                padding: '20px 0'
            }}>
                {error}
            </div>
        );
    }

    if (!contributors || Object.values(contributors).every(arr => arr.length === 0)) {
        return (
            <div style={{ 
                textAlign: 'center', 
                color: '#b3b3b3', 
                fontSize: '1rem',
                fontWeight: 500,
                padding: '20px 0'
            }}>
                No contributor information found for this track.
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0,
            padding: '8px 0'
        }}>
            <ContributorSection title="Performers" items={contributors.performers} />
            <ContributorSection title="Writers" items={contributors.writers} />
            <ContributorSection title="Producers" items={contributors.producers} />
            <ContributorSection title="Mixing" items={contributors.mixers} />
            <ContributorSection title="Engineering" items={contributors.engineers} />
            <ContributorSection title="Arrangers" items={contributors.arrangers} />
            <ContributorSection title="Remixers" items={contributors.remixers} />
        </div>
    );
};

export default ContributorFinder;