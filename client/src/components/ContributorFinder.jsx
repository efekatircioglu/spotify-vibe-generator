import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Cache for contributor data to prevent duplicate API calls
const contributorCache = new Map();

/**
 * A reusable component to render a list of items for a specific category.
 * @param {{ title: string, items: string[] }} props
 */

const ContributorSection = ({ title, items }) => {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="contrib-popup-role-heading">{title}</h3>

            {/* Conditionally render the list OR a "Not Available" message */}
            {items && items.length > 0 ? (
                <ul className="contrib-popup-name-list">
                    {items.map((item, index) => (
                        <li key={index}>
                            {typeof item === 'object' ? (
                                <>
                                    {item.name}
                                    {item.role && <span className="contrib-popup-role-detail"> {item.role}</span>}
                                </>
                            ) : (
                                item
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{
                    color: '#a1a1aa',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    margin: '0.25rem 0 0 0.25rem', // Adds a little space
                }}>
                    Not Available
                </p>
            )}
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
    const [noRelations, setNoRelations] = useState(false);
    

    useEffect(() => {
        setContributors(null);
        setError(null);
        setLoading(true);
        setNoRelations(false);

        // MBID not found at all
        if (!mbid || mbid === 'Not Found') {
            setError('Song or Artist is not recognized by MusicBrainz');
            setLoading(false);
            return;
        }

        // Check cache first
        if (contributorCache.has(mbid)) {
            const cached = contributorCache.get(mbid);
            setContributors(cached);
            setNoRelations(cached._noRelations || false);
            setLoading(false);
            return;
        }

        const fetchContributors = async () => {
            const MUSICBRAINZ_USER_AGENT = 'spotify-vibe-generator/1.0 (your@email.com)';
            const includes = 'artist-rels+work-rels';
            const url = `https://musicbrainz.org/ws/2/recording/${mbid}?inc=${includes}&fmt=json`;

            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT }
                });
                const relations = response.data.relations || [];
                if (!Array.isArray(relations) || relations.length === 0) {
                    setNoRelations(true);
                    contributorCache.set(mbid, { _noRelations: true });
                    setContributors({});
                    setLoading(false);
                    return;
                }
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
                            const performerObject = { name: artistName, role: details };
                            // Add the object to the array, avoiding duplicates
                            if (!categorized.performers.some(p => p.name === performerObject.name && p.role === performerObject.role)) {
                                categorized.performers.push(performerObject);
                            }
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
                contributorCache.set(mbid, categorized);
                setContributors(categorized);
            } catch (err) {
                setError('Failed to fetch data. The MBID may be incorrect or the service may be down.');
            } finally {
                setLoading(false);
            }
        };
        fetchContributors();
    }, [mbid]);

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

    if (noRelations || !contributors || Object.values(contributors).every(arr => arr.length === 0)) {
        return (
            <div style={{ 
                textAlign: 'center', 
                color: '#b3b3b3', 
                fontSize: '1rem',
                fontWeight: 500,
                padding: '20px 0'
            }}>
                No Contributor Information Found
            </div>
        );
    }

    return (
    <>
    
    




      <div className="contrib-popup-body">
        <ContributorSection title="Performers" items={contributors.performers} />
        <ContributorSection title="Writers" items={contributors.writers} />
        <ContributorSection title="Producers" items={contributors.producers} />
        <ContributorSection title="Mixing" items={contributors.mixers} />
        <ContributorSection title="Engineering" items={contributors.engineers} />
        <ContributorSection title="Arrangers" items={contributors.arrangers} />
        <ContributorSection title="Remixers" items={contributors.remixers} />
      </div>

      <style jsx global>{`
        /* --- Background Overlay --- */
        #contrib-popup-overlay {
          position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5);
          z-index: 40; opacity: 0; transition: opacity 200ms ease-out;
          pointer-events: none; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        }
        #contrib-popup-overlay.visible { opacity: 1; pointer-events: auto; }

        /* --- Main Pop-up Container --- */
        #contrib-popup-container {
          position: fixed; z-index: 50; opacity: 0;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          width: 90%;
        }
        #contrib-popup-container.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }
        
        /* --- Content Box --- */
        .contrib-popup-content {
          background-color: rgba(24, 24, 27, 0.8); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px); border: 1px solid #3f3f46;
          border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 24rem;
          padding: 1.5rem;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .contrib-popup-content {
            max-width: 32rem;
          }
        }

        /* --- Title --- */
        .contrib-popup-title {
          font-size: 1.25rem; font-weight: 700;
          margin-bottom: 1.5rem; color: #f4f4f5;
        }

        .contrib-popup-body {
          max-height: 50vh; overflow-y: auto; padding-right: 0.5rem;
        }
        
        .contrib-popup-role-heading {
          font-size: 0.75rem; /* text-xs */
          font-weight: 600; /* font-semibold */
          letter-spacing: 0.05em; /* tracking-wide */
          text-transform: uppercase;
          color: #a1a1aa; /* text-zinc-400 */
          margin-bottom: 0.75rem;
        }

        /*
        * THIS IS THE STYLE FOR THE PERFORMER ROLE (e.g., "(guitar)")
        */
        .contrib-popup-role-detail {
          /* Makes the text 85% of the parent's font size */
          font-size: 0.85em; 
          
          /* A lighter, secondary gray color */
          color:#dedab4;
          
          /* Normal font weight to de-emphasize it */
          font-weight: 400;

          /* Adds a little space to the left */
          margin-left: 0.25rem;
        }
        
      `}</style>
    </>
  );
};

export default ContributorFinder;