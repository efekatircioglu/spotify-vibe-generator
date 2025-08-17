import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Cache for contributor data to prevent duplicate API calls
const contributorCache = new Map();

/**
 * Renders a section of contributors with a title and list of items
 */
const ContributorSection = ({ title, items }) => {
  // Don't render anything if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="contributor-section">
      <h3 className="section-title">{title} ({items.length})</h3>
      <div className="contributor-list">
        {items.map((item, index) => {
          const contributorName = typeof item === 'object' ? item.name : item;
          
          return (
            <div key={index} className="contributor-item">
              <div className="contributor-info" style={{ margin: '5px' }}>
                <span className="contributor-name">• {contributorName}                 </span>
                {typeof item === 'object' && item.role && (
                  <span className="contributor-role" style={{ color: '#a1a1aa' }}>{item.role}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main component that fetches and displays contributors for a given MBID
 */
const NewContributorFinder = ({ mbid, trackInfo, track, closeButton }) => {
  const [contributors, setContributors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noRelations, setNoRelations] = useState(false);

  // Extract track information from track object or use provided trackInfo
  const getTrackInfo = () => {
    if (trackInfo) return trackInfo;
    
    if (track && typeof track === 'object') {
      return {
        name: track.name || 'Unknown Track',
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(', ') : track.artists) : 'Unknown Artist'),
        album: track.album?.name || track.album || 'Unknown Album',
        year: track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : 'Unknown Year')
      };
    }
    
    return {
      name: 'Unknown Track',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      year: 'Unknown Year'
    };
  };

  const currentTrackInfo = getTrackInfo();

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
          <div className="no-data-icon">📭</div>
          <h2>No Contributor Information</h2>
          <p>This track doesn't have detailed contributor information available in MusicBrainz.</p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="contributor-finder new-contributor-finder">
      <div className="track-header">
        <div className="track-avatar">
          <span>{currentTrackInfo.artist && currentTrackInfo.artist.length > 0 ? 
            currentTrackInfo.artist.split(',')[0].split(' ').map(n => n[0]).join('').toUpperCase() : '?'}</span>
        </div>
        <div className="track-info">
          <h1 className="track-name">{currentTrackInfo.name}</h1>
          <p className="track-artist">{currentTrackInfo.artist}</p>
          <p className="track-album">{currentTrackInfo.album} · {currentTrackInfo.year}</p>
        </div>
        {closeButton && (
          <button className="close-button" onClick={closeButton}>
            ✕
          </button>
        )}
      </div>

      <div className="contributor-content">
        <h2 className="content-title">Track Contributors</h2>
        <p className="content-description">Detailed information about everyone involved in creating this track</p>
        
        <div className="contributor-sections">
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
      </div>

      <style jsx>{`
        .contributor-finder {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .track-header {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 48px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
          border-bottom: 1px solid #333;
          position: relative;
        }

        .track-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(139, 92, 246, 0.1) 100%);
          pointer-events: none;
        }

        .track-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
          position: relative;
          z-index: 1;
        }

        .track-info {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .track-name {
          font-size: 42px;
          font-weight: bold;
          color: white;
          margin: 0 0 16px 0;
        }

        .track-artist {
          font-size: 24px;
          color: #e5e5e5;
          margin: 0 0 8px 0;
        }

        .track-album {
          font-size: 18px;
          color: #a1a1aa;
          margin: 0;
        }

        .contributor-content {
          padding: 40px;
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #666 #1a1a1a;
        }

        .contributor-content::-webkit-scrollbar {
          width: 8px;
        }

        .contributor-content::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .contributor-content::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 4px;
        }

        .contributor-content::-webkit-scrollbar-thumb:hover {
          background: #888;
        }

        .content-title {
          font-size: 24px;
          font-weight: bold;
          color: #10b981;
          margin: 0 0 8px 0;
        }

        .content-description {
          font-size: 16px;
          color: #a1a1aa;
          margin: 0 0 32px 0;
        }

        .contributor-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .contributor-section {
          background: #1f1f1f;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #333;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
        }

        .contributor-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
        }

        .contributor-item {
          display: flex;
          align-items: center;
          padding: 20px;
          background: #1f1f1f;
          border-radius: 12px;
          transition: all 0.2s ease;
          min-height: 64px;
          margin-bottom: 16px;
          border: 1px solid #333;
        }

        .contributor-item:last-child {
          margin-bottom: 0;
        }

        .contributor-item:hover {
          background: #2a2a2a;
          transform: translateX(4px);
          border-color: #555;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .contributor-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          line-height: 1.3;
          justify-content: center;
          padding: 0 !important;
        }

        .contributor-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.3;
          margin: 0 !important;
          padding: 0 !important;
        }

        .contributor-role {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.3;
          margin: 0 !important;
          padding: 0 !important;
          font-weight: 400;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          background: #1a1a1a;
          border-radius: 16px;
        }

        .loading-container {
          text-align: center;
          color: #10b981;
        }

        .loading-spinner {
          width: 4rem;
          height: 4rem;
          border: 4px solid rgba(16, 185, 129, 0.2);
          border-top: 4px solid #10b981;
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
          background: #1a1a1a;
          border-radius: 16px;
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
          .track-header {
            padding: 20px 16px;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
          }
          
          .track-avatar {
            width: 60px;
            height: 60px;
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .track-info {
            width: 100%;
            text-align: center;
          }
          
          .track-name {
            font-size: 22px;
          }
          
          .track-artist {
            font-size: 16px;
          }
          
          .track-album {
            font-size: 12px;
          }
          
          .close-button {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            font-size: 16px;
            background: rgba(139, 92, 246, 0.3);
            border: 2px solid #8b5cf6;
          }
          
          .contributor-content {
            padding: 16px;
            max-height: 50vh;
          }
          
          .content-title {
            font-size: 14px;
          }
          
          .content-description {
            font-size: 11px;
          }
          
          .contributor-sections {
            gap: 16px;
          }
          
          .contributor-section {
            padding: 12px;
          }
          
          .section-title {
            font-size: 8px;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }
          
          .contributor-item {
            padding: 10px;
            min-height: 40px;
            margin-bottom: 6px;
          }
          
          .contributor-name {
            font-size: 11px;
          }
          
          .contributor-role {
            font-size: 9px;
          }
        }
        
        @media (min-width: 769px) {
          .track-header h1 {
            font-size: 2.5rem;
          }
          
          .track-header p {
            font-size: 1.2rem;
          }
          
          .card-title {
            font-size: 1.3rem;
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

export default NewContributorFinder;
