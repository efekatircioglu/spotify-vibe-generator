import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCachedArtistImage } from '../utils/artistCache';

// Cache for contributor data to prevent duplicate API calls
const contributorCache = new Map();

/**
 * Renders a section of contributors with a title and list of items
 */
const ContributorSection = ({ title, items }) => {
  const [artistImages, setArtistImages] = useState({});

  // Function to get artist image (from cache or search)
  const getArtistImage = async (artistName) => {
    // First check cache
    const cachedImage = getCachedArtistImage(artistName);
    if (cachedImage) {
      return cachedImage;
    }

    // If not in cache, search Spotify
    try {
      const response = await fetch(`http://127.0.0.1:8000/spotify/artist-search?name=${encodeURIComponent(artistName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.artists && data.artists.length > 0) {
          const bestMatch = data.artists[0];
          if (bestMatch.image) {
            return bestMatch.image;
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch artist image for:', artistName);
    }
    
    return null;
  };

  // Load images for all contributors in this section
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = items.map(async (item) => {
        const artistName = typeof item === 'object' ? item.name : item;
        const image = await getArtistImage(artistName);
        return { artistName, image };
      });
      
      const results = await Promise.all(imagePromises);
      const newImages = {};
      results.forEach(({ artistName, image }) => {
        newImages[artistName] = image;
      });
      setArtistImages(newImages);
    };

    if (items && items.length > 0) {
      loadImages();
    }
  }, [items]);

  // Function to get initials from artist name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="contributor-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-content">
        <div className="contributor-grid">
          {items.map((item, index) => {
            const contributorName = typeof item === 'object' ? item.name : item;
            const artistImage = artistImages[contributorName];
            
            return (
              <div key={index} className="contributor-chip">
                <div className="contributor-avatar">
                  {artistImage ? (
                    <img 
                      src={artistImage} 
                      alt={contributorName}
                      className="contributor-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`contributor-initials ${artistImage ? 'fallback' : ''}`}
                    style={{ display: artistImage ? 'none' : 'flex' }}
                  >
                    {getInitials(contributorName)}
                  </div>
                </div>
                <div className="contributor-text">
                  {typeof item === 'object' ? (
                    <>
                      <span className="contributor-name">{item.name}</span>
                      {item.role && (
                        <span className="contributor-role"> {item.role}</span>
                      )}
                    </>
                  ) : (
                    <span className="contributor-name">{item}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Main component that fetches and displays contributors for a given MBID
 */
const ContributorFinder = ({ mbid }) => {
  const [contributors, setContributors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noRelations, setNoRelations] = useState(false);

  useEffect(() => {
    // Reset state
    setContributors(null);
    setError(null);
    setLoading(true);
    setNoRelations(false);

    // Handle missing MBID
    if (!mbid || mbid === 'Not Found') {
      setError('Song or Artist is not recognized by MusicBrainz');
      setLoading(false);
      return;
    }

    // Check cache first
    if (contributorCache.has(mbid)) {
      const cached = contributorCache.get(mbid);
      console.log('Using cached contributors:', cached);
      setContributors(cached);
      setNoRelations(cached._noRelations || false);
      setLoading(false);
      return;
    }

    fetchContributors();
  }, [mbid]);

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

      const categorized = categorizeRelations(relations);
      console.log('Raw relations from MusicBrainz:', relations);
      console.log('Categorized contributors:', categorized);
      contributorCache.set(mbid, categorized);
      setContributors(categorized);
    } catch (err) {
      setError('Failed to fetch data. The MBID may be incorrect or the service may be down.');
    } finally {
      setLoading(false);
    }
  };

  const categorizeRelations = (relations) => {
    console.log('Processing relations:', relations);
    const categorized = {
      performers: [],
      writers: [],
      producers: [],
      mixers: [],
      engineers: [],
      arrangers: [],
      remixers: []
    };

    relations.forEach(rel => {
      const artistName = rel.artist?.name;
      if (!artistName) return;

      switch (rel.type) {
        case 'performer':
        case 'instrument':
        case 'vocal':
          const details = rel.attributes?.length > 0 ? `(${rel.attributes.join(', ')})` : '';
          const performerObject = { name: artistName, role: details };
          
          // Avoid duplicates
          if (!categorized.performers.some(p => 
            p.name === performerObject.name && p.role === performerObject.role
          )) {
            categorized.performers.push(performerObject);
          }
          break;
          
        case 'producer':
          if (!categorized.producers.includes(artistName)) {
            categorized.producers.push(artistName);
          }
          break;
          
        case 'writer':
        case 'composer':
        case 'lyricist':
          if (!categorized.writers.includes(artistName)) {
            categorized.writers.push(artistName);
          }
          break;
          
        case 'mix':
          if (!categorized.mixers.includes(artistName)) {
            categorized.mixers.push(artistName);
          }
          break;
          
        case 'engineer':
          if (!categorized.engineers.includes(artistName)) {
            categorized.engineers.push(artistName);
          }
          break;
          
        case 'arranger':
          if (!categorized.arrangers.includes(artistName)) {
            categorized.arrangers.push(artistName);
          }
          break;
          
        case 'remixer':
          if (!categorized.remixers.includes(artistName)) {
            categorized.remixers.push(artistName);
          }
          break;
          
        default:
          break;
      }
    });

    console.log('Final categorized result:', categorized);
    return categorized;
  };

  // Loading state
  if (loading) {
    return (
      <div className="contributor-finder loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Contributors</h2>
          <p>Fetching detailed information from MusicBrainz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="contributor-finder error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (noRelations || !contributors || Object.values(contributors).every(arr => arr.length === 0)) {
    return (
      <div className="contributor-finder no-data">
        <div className="no-data-container">
          <h2>No Contributor Information</h2>
          <p>This track doesn't have detailed contributor information available in MusicBrainz.</p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="contributor-finder">
      <div className="contributor-header">
        <h1>Track Contributors</h1>
        <p>Detailed information about everyone involved in creating this track</p>
      </div>
      
      <div className="contributor-grid">
        <ContributorSection 
          title="Performers" 
          items={contributors.performers} 
        />
        <ContributorSection 
          title="Writers" 
          items={contributors.writers} 
        />
        <ContributorSection 
          title="Producers" 
          items={contributors.producers} 
        />
        <ContributorSection 
          title="Mixing" 
          items={contributors.mixers} 
        />
        <ContributorSection 
          title="Engineering" 
          items={contributors.engineers} 
        />
        <ContributorSection 
          title="Arrangers" 
          items={contributors.arrangers} 
        />
        <ContributorSection 
          title="Remixers" 
          items={contributors.remixers} 
        />
      </div>

      <style jsx>{`
        .contributor-finder {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .contributor-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .contributor-header h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #1db954, #1ed760);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .contributor-header p {
          font-size: 1rem;
          color: #a1a1aa;
          margin: 0;
        }

        .contributor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .contributor-card {
          background: linear-gradient(145deg, rgba(24, 24, 27, 0.9), rgba(39, 39, 42, 0.9));
          border: 1px solid rgba(63, 63, 70, 0.3);
          border-radius: 1.5rem;
          padding: 1rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .contributor-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1db954, #1ed760);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .contributor-card:hover {
          transform: translateY(-5px);
          border-color: rgba(29, 185, 84, 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .contributor-card:hover::before {
          opacity: 1;
        }

        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .card-content {
          min-height: 2rem;
        }

        .contributor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .contributor-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(63, 63, 70, 0.4);
          border: 1px solid rgba(63, 63, 70, 0.6);
          border-radius: 2rem;
          padding: 0.4rem 0.8rem;
          margin: 0.2rem;
          transition: all 0.2s ease;
          width: 100%;
        }

        .contributor-chip:hover {
          background: rgba(29, 185, 84, 0.1);
          border-color: rgba(29, 185, 84, 0.4);
          transform: scale(1.05);
        }

        .contributor-avatar {
          position: relative;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .contributor-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .contributor-initials {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background-color: #1db954;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .contributor-text {
          flex-grow: 1;
        }

        .contributor-name {
          color: #ffffff;
          font-weight: 500;
          font-size: 1rem;
        }

        .contributor-role {
          color: #dedab4;
          font-size: 0.85rem;
          font-weight: 400;
          opacity: 0.8;
        }



        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .loading-container {
          text-align: center;
          color: #1db954;
        }

        .loading-spinner {
          width: 4rem;
          height: 4rem;
          border: 4px solid rgba(29, 185, 84, 0.2);
          border-top: 4px solid #1db954;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        .loading-container h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .loading-container p {
          color: #a1a1aa;
          margin: 0;
        }

        .error, .no-data {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .error-container, .no-data-container {
          text-align: center;
          color: #f87171;
        }

        .no-data-container {
          color: #a1a1aa;
        }

        .error-icon, .no-data-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-container h2, .no-data-container h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .error-container p, .no-data-container p {
          margin: 0;
          max-width: 400px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .contributor-finder {
            padding: 1rem;
          }
          
          .contributor-header h1 {
            font-size: 2rem;
          }
          
          .contributor-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .contributor-card {
            padding: 1rem;
          }
          
          .contributor-avatar {
            width: 1rem;
            height: 1rem;
          }
          
          .contributor-initials {
            font-size: 0.625rem;
          }
          
          .contributor-chip {
            padding: 0.5rem;
          }
        }
        
        /* Desktop text sizing */
        @media (min-width: 769px) {
          .contributor-header h1 {
            font-size: 2.5rem;
          }
          
          .contributor-header p {
            font-size: 1.2rem;
          }
          
          .card-title {
            font-size: 1.3rem;
          }
          
          .contributor-avatar {
            width: 1.5rem;
            height: 1.5rem;
          }
          
          .contributor-initials {
            font-size: 0.875rem;
          }
          
          .contributor-name {
            font-size: 1.2rem;
          }
          
          .contributor-role {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ContributorFinder;