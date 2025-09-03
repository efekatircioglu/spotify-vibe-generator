import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCachedArtistImage, setSpotifyArtistCache, clearSpecificArtistCache } from '../utils/artistCache';
import { getApiBaseUrl } from '../config/api';

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
      <h3 className="section-title" style={{ fontSize: '16px' }}>{title} ({items.length})</h3>
      <div className="contributor-list">
        {items.map((item, index) => {
          const contributorName = typeof item === 'object' ? item.name : item;
          
          return (
            <div key={index} className="contributor-item">
              <div className="contributor-info" style={{ margin: '5px' }}>
                <span className="contributor-name" style={{ fontSize: '16px' }}>• {contributorName}                 </span>
                {typeof item === 'object' && item.role && (
                  <span className="contributor-role" style={{ fontSize: '14px', color: '#a1a1aa' }}>{item.role}</span>
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
  const [artistImage, setArtistImage] = useState(null);
  const [artistImageLoading, setArtistImageLoading] = useState(false);

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

  // Function to fetch artist image from Spotify
  const fetchArtistImage = async (artistName) => {
    if (!artistName) {
      console.log(`[NewContributorFinder] No artist name provided, skipping image fetch`);
      return;
    }
    
    console.log(`[NewContributorFinder] Starting image fetch process for: "${artistName}"`);
    
    // Check cache first
    const cachedImage = getCachedArtistImage(artistName);
    if (cachedImage) {
      console.log(`[NewContributorFinder] 🎯 CACHE HIT! Found cached image for "${artistName}":`, cachedImage);
      setArtistImage(cachedImage);
      return;
    }
    
    console.log(`[NewContributorFinder] ❌ CACHE MISS! No cached image found for "${artistName}", making API call...`);
    
    setArtistImageLoading(true);
    try {
      console.log(`[NewContributorFinder] 🌐 Making API call to Spotify for: "${artistName}"`);
      
      const response = await axios.get(`${getApiBaseUrl()}/spotify/artist-search?name=${encodeURIComponent(artistName)}`, {
        withCredentials: true
      });
      console.log(`[NewContributorFinder] 📡 Spotify API response received:`, response.data);
      
      if (response.data.artists && response.data.artists.length > 0) {
        console.log(`[NewContributorFinder] ✅ Found ${response.data.artists.length} artists from Spotify`);
        
        // Find the best match by comparing artist names more accurately
        const bestMatch = response.data.artists.find(artist => {
          const spotifyName = artist.name.toLowerCase();
          const searchName = artistName.toLowerCase();
          
          // Exact match
          if (spotifyName === searchName) {
            console.log(`[NewContributorFinder] 🎯 Exact name match found: "${spotifyName}"`);
            return true;
          }
          
          // Check if search name is contained in Spotify name or vice versa
          if (spotifyName.includes(searchName) || searchName.includes(spotifyName)) {
            console.log(`[NewContributorFinder] 🔍 Partial name match found: "${spotifyName}" contains "${searchName}"`);
            return true;
          }
          
          // Check for common variations (e.g., "The Beatles" vs "Beatles")
          const cleanSpotifyName = spotifyName.replace(/^the\s+/i, '').trim();
          const cleanSearchName = searchName.replace(/^the\s+/i, '').trim();
          if (cleanSpotifyName === cleanSearchName) {
            console.log(`[NewContributorFinder] 🎭 Variation match found: "${cleanSpotifyName}" (removed "The")`);
            return true;
          }
          
          return false;
        }) || response.data.artists[0]; // Fallback to first result
        
        if (!bestMatch) {
          console.log(`[NewContributorFinder] ⚠️ No best match found, using first result`);
        }
        
        console.log(`[NewContributorFinder] 🏆 Selected artist: "${bestMatch.name}" (ID: ${bestMatch.id})`);
        
        if (bestMatch.image) {
          console.log(`[NewContributorFinder] 🖼️ Artist has image:`, bestMatch.image);
          setArtistImage(bestMatch.image);
          
          // Cache the image for future use with the exact artist name from Spotify
          console.log(`[NewContributorFinder] 💾 Caching image for "${bestMatch.name}" in artist cache`);
          setSpotifyArtistCache(bestMatch.name, bestMatch.image, bestMatch.id);
          console.log(`[NewContributorFinder] ✅ Successfully cached image for "${bestMatch.name}"`);
        } else {
          console.log(`[NewContributorFinder] ❌ No image found for artist: "${bestMatch.name}"`);
        }
      } else {
        console.log(`[NewContributorFinder] ❌ No artists found in Spotify response for: "${artistName}"`);
      }
    } catch (err) {
      console.error('[NewContributorFinder] 💥 Error fetching artist image:', err);
      console.error('[NewContributorFinder] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      console.log(`[NewContributorFinder] 🏁 Image fetch process completed for: "${artistName}"`);
      setArtistImageLoading(false);
    }
  };

  useEffect(() => {
    // Reset state
    setContributors(null);
    setError(null);
    setLoading(true);
    setNoRelations(false);
    setArtistImage(null);

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

  // Fetch artist image when track info changes
  useEffect(() => {
    if (currentTrackInfo.artist) {
      const mainArtist = currentTrackInfo.artist.split(',')[0].trim();
      console.log(`[NewContributorFinder] 🎵 Track info changed, extracting main artist: "${mainArtist}"`);
      
      // Check if we have a cached image and log it for debugging
      const cachedImage = getCachedArtistImage(mainArtist);
      if (cachedImage) {
        console.log(`[NewContributorFinder] 📋 Found cached image for "${mainArtist}":`, cachedImage);
      }
      
      console.log(`[NewContributorFinder] 🚀 Triggering image fetch for artist: "${mainArtist}"`);
      fetchArtistImage(mainArtist);
    } else {
      console.log(`[NewContributorFinder] ⚠️ No artist info available in track info`);
    }
  }, [currentTrackInfo.artist]);

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
          <h2 style={{ fontSize: '24px' }}>Loading Contributors</h2>
          <p style={{ fontSize: '16px' }}>Fetching detailed information from MusicBrainz...</p>
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
          <h2 style={{ fontSize: '24px' }}>Error Loading Data</h2>
          <p style={{ fontSize: '16px' }}>{error}</p>
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
          <h2 style={{ fontSize: '24px' }}>No Contributor Information</h2>
          <p style={{ fontSize: '16px' }}>This track doesn't have detailed contributor information available in MusicBrainz.</p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="contributor-finder new-contributor-finder">
      <div className={`track-header ${artistImage ? 'has-artist-image' : ''}`}>
        {/* Blurred, stretched background image */}
        {artistImage && (
          <div
            className="blurred-background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url('${artistImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(28px) brightness(0.9)',
              zIndex: 1,
            }}
          />
        )}
                    {/* Dark overlay for contrast */}
            <div
              className="dark-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(16,17,20,0.3)',
                zIndex: 2,
              }}
            />
        
        <div className="track-avatar">
          {artistImage ? (
            <div className="artist-image-container">
              <img 
                src={artistImage} 
                alt={currentTrackInfo.artist} 
                className="artist-image"
              />
              <button 
                className="refresh-image-btn"
                onClick={() => {
                  // Clear the specific artist from cache and refresh
                  const artistName = currentTrackInfo.artist.split(',')[0].trim();
                  clearSpecificArtistCache(artistName);
                  setArtistImage(null);
                  fetchArtistImage(artistName);
                }}
                title="Refresh artist image"
              >
                🔄
              </button>
            </div>
          ) : artistImageLoading ? (
            <div className="image-loading-spinner"></div>
          ) : (
            <span className="artist-initials">
              {currentTrackInfo.artist && currentTrackInfo.artist.length > 0 ? 
                currentTrackInfo.artist.split(',')[0].split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
            </span>
          )}
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
          <h2 className="content-title" style={{ fontSize: '24px' }}>Track Contributors</h2>
          <p className="content-description" style={{ fontSize: '16px' }}>Detailed information about everyone involved in creating this track</p>
          
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
          // max-width: 100vx  ;
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          max-height: 100vh;
        }

        .track-header {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 48px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
          border-bottom: 1px solid #333;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .track-header.has-artist-image {
          background: #1a1a1a;
        }

        .track-header:not(.has-artist-image)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(139, 92, 246, 0.1) 100%);
          pointer-events: none;
          z-index: 1;
        }

        .blurred-background {
          transition: opacity 0.3s ease, filter 0.3s ease;
          opacity: 0;
          animation: fadeInBlur 0.5s ease forwards;
        }

        .dark-overlay {
          transition: opacity 0.3s ease;
          opacity: 0;
          animation: fadeInOverlay 0.5s ease forwards;
        }

        @keyframes fadeInBlur {
          from {
            opacity: 0;
            filter: blur(40px) brightness(0.5);
          }
          to {
            opacity: 1;
            filter: blur(8px) brightness(0.7);
          }
        }

        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .track-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 3;
          overflow: hidden;
        }

        .artist-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .artist-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .refresh-image-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          color: white;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .artist-image-container:hover .refresh-image-btn {
          opacity: 1;
        }

        .refresh-image-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .artist-initials {
          font-weight: 600;
          color: white;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6);
        }

        .image-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #1db954;
          border-top-color: rgba(24, 24, 27, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .track-info {
          flex: 1;
          position: relative;
          z-index: 3;
        }

        .track-name {
          font-weight: 600;
          color: white;
          margin: 0 0 16px 0;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6);
          letter-spacing: -0.5px;
        }

        .track-artist {
          font-weight: 500;
          color: #ffffff;
          margin: 0 0 8px 0;
          text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 0, 0, 0.5);
        }

        .track-album {
          font-weight: 400;
          color: #f0f0f0;
          margin: 0;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          font-size: 18px;
          background: rgba(139, 92, 246, 0.3);
          border: 2px solid #8b5cf6;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(139, 92, 246, 0.5);
          transform: scale(1.1);
        }

        /* Ensure close button always uses mobile styling regardless of screen size */
        .close-button {
          background: #8b5cf6 !important;
          border: 2px solid #8b5cf6 !important;
        }

        .contributor-content {
          padding: 40px;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #666 #1a1a1a;
          flex: 1;
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
          font-weight: 600;
          color: #10b981;
          margin: 0 0 8px 0;
          text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
        }

        .content-description {
          font-weight: 400;
          color: #e0e0e0;
          margin: 0 0 32px 0;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
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
          font-weight: 600;
          margin: 0 0 24px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #cccccc;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
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
          font-weight: 500;
          color: #ffffff;
          line-height: 1.3;
          margin: 0 !important;
          padding: 0 !important;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
        }

        .contributor-role {
          font-weight: 400;
          color: #d1d5db;
          line-height: 1.3;
          margin: 0 !important;
          padding: 0 !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
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
          width: 40px;
          height: 40px;
          border: 4px solid #1db954;
          border-top-color: rgba(24, 24, 27, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        .loading-container h2 {
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
            min-height: 200px;
            max-height: 250px;
          }
          
          .blurred-background {
            filter: blur(20px) brightness(0.6);
          }
          
          .track-avatar {
            width: 60px;
            height: 60px;
            margin-bottom: 8px;
          }
          
          .artist-initials {
            font-size: 24px;
          }
          
          .image-loading-spinner {
            width: 24px;
            height: 24px;
            border-width: 3px;
            border: 3px solid #1db954;
            border-top-color: rgba(24, 24, 27, 0.8);
          }
          
          .refresh-image-btn {
            width: 20px;
            height: 20px;
            font-size: 10px;
            top: 3px;
            right: 3px;
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
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            font-size: 18px;
            background: rgba(139, 92, 246, 0.8);
            border: 2px solid #8b5cf6;
            z-index: 1000;
            border-radius: 50%;
          }
          
          .contributor-content {
            padding: 16px;
            max-height: calc(100vh - 250px);
            min-height: 200px;
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
        


        @media (max-width: 1000px) {
          .track-name {
            font-size: 38px;
          }
          
          .track-artist {
            font-size: 22px;
          }
          
          .track-album {
            font-size: 16px;
          }
          
          .content-title {
            font-size: 22px;
          }
          
          .content-description {
            font-size: 14px;
          }
          
          .section-title {
            font-size: 14px;
          }
          
          .contributor-name {
            font-size: 14px;
          }
          
          .contributor-role {
            font-size: 12px;
          }
          
          .artist-initials {
            font-size: 36px;
          }
          
          .loading-container h2 {
            font-size: 1.3rem;
          }
          
          .error-container h2, .no-data-container h2 {
            font-size: 1.3rem;
          }
        }

        @media (max-width: 500px) {
          .contributor-finder {
            border-radius: 8px;
            margin: 8px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }

          .track-header {
            padding: 16px;
            gap: 16px;
            min-height: 120px;
            flex-direction: column;
            text-align: center;
          }

          .track-avatar {
            width: 60px;
            height: 60px;
          }

          .artist-initials {
            font-size: 24px;
          }

          .track-name {
            font-size: 16px;
            line-height: 1.2;
          }
          
          .track-artist {
            font-size: 12px;
            line-height: 1.2;
          }
          
          .track-album {
            font-size: 10px;
            line-height: 1.2;
          }

          .contributor-content {
            padding: 16px;
            max-height: calc(100vh - 140px);
          }

          .content-title {
            font-size: 16px;
            margin-bottom: 4px;
          }

          .content-description {
            font-size: 11px;
            margin-bottom: 16px;
          }

          .contributor-sections {
            gap: 16px;
          }

          .contributor-section {
            padding: 12px;
            border-radius: 8px;
          }

          .section-title {
            font-size: 11px;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }

          .contributor-item {
            padding: 12px;
            margin-bottom: 8px;
            min-height: 40px;
            border-radius: 6px;
          }

          .contributor-item:hover {
            transform: translateX(2px);
          }

          .contributor-name {
            font-size: 12px;
            line-height: 1.2;
          }

          .contributor-role {
            font-size: 10px;
            line-height: 1.2;
          }

          .close-button {
            top: 8px;
            right: 8px;
            width: 30px;
            height: 30px;
            font-size: 14px;
          }

          .loading-container h2 {
            font-size: 1rem;
          }

          .error-container h2, .no-data-container h2 {
            font-size: 1rem;
          }

          .error-icon, .no-data-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
          }

          .loading-spinner {
            width: 30px;
            height: 30px;
            border-width: 3px;
            margin-bottom: 1rem;
          }
        }

        @media (max-width: 430px) {
          .contributor-finder {
            border-radius: 6px;
            margin: 4px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          }

          .track-header {
            padding: 12px;
            gap: 12px;
            min-height: 100px;
          }

          .track-avatar {
            width: 50px;
            height: 50px;
          }

          .artist-initials {
            font-size: 20px;
          }

          .track-name {
            font-size: 14px;
            line-height: 1.1;
          }
          
          .track-artist {
            font-size: 10px;
            line-height: 1.1;
          }
          
          .track-album {
            font-size: 9px;
            line-height: 1.1;
          }

          .contributor-content {
            padding: 12px;
            max-height: calc(100vh - 120px);
          }

          .content-title {
            font-size: 14px;
            margin-bottom: 3px;
          }

          .content-description {
            font-size: 10px;
            margin-bottom: 12px;
          }

          .contributor-sections {
            gap: 12px;
          }

          .contributor-section {
            padding: 10px;
            border-radius: 6px;
          }

          .section-title {
            font-size: 10px;
            margin-bottom: 8px;
            letter-spacing: 0.3px;
          }

          .contributor-item {
            padding: 10px;
            margin-bottom: 6px;
            min-height: 35px;
            border-radius: 4px;
          }

          .contributor-name {
            font-size: 11px;
            line-height: 1.1;
          }

          .contributor-role {
            font-size: 9px;
            line-height: 1.1;
          }

          .close-button {
            top: 6px;
            right: 6px;
            width: 26px;
            height: 26px;
            font-size: 12px;
          }

          .loading-container h2 {
            font-size: 0.9rem;
          }

          .loading-container p {
            font-size: 0.75rem;
          }

          .error-container h2, .no-data-container h2 {
            font-size: 0.9rem;
          }

          .error-container p, .no-data-container p {
            font-size: 0.75rem;
          }

          .error-icon, .no-data-icon {
            font-size: 2rem;
            margin-bottom: 0.3rem;
          }

          .loading-spinner {
            width: 25px;
            height: 25px;
            border-width: 2px;
            margin-bottom: 0.5rem;
          }
        }

        @media (max-height: 600px) {
          .track-header {
            min-height: 150px;
            max-height: 180px;
            padding: 16px;
          }
          
          .track-name {
            font-size: 18px;
          }
          
          .track-artist {
            font-size: 14px;
          }
          
          .track-album {
            font-size: 10px;
          }
          
          .artist-initials {
            font-size: 28px;
          }
          
          .track-avatar {
            width: 40px;
            height: 40px;
          }
          
          .contributor-content {
            max-height: calc(100vh - 180px);
            min-height: 150px;
          }
          
          .close-button {
            top: 15px;
            right: 15px;
            width: 35px;
            height: 35px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default NewContributorFinder;