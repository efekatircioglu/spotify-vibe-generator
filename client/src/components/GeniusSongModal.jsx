import React, { useState, useEffect } from 'react';
import { getCachedTopArtists, setCachedTopArtists } from '../utils/topArtistsCache';

export default function GeniusSongModal({ open, onClose, songInfo, loading, error }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('samples');
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [userTopArtists, setUserTopArtists] = useState([]);
  const [loadingTopArtists, setLoadingTopArtists] = useState(false);

  // Get user's top artists from cache when modal opens
  useEffect(() => {
    const loadUserTopArtists = () => {
      if (!open) return;
      
      setLoadingTopArtists(true);
      
      // Try to get from cache first
      const cachedArtists = getCachedTopArtists();
      if (cachedArtists) {
        setUserTopArtists(cachedArtists);
        console.log('Loaded user top artists from cache for sorting:', cachedArtists.length);
        setLoadingTopArtists(false);
        return;
      }
      
      // If no cache, fetch from API (fallback)
      const fetchUserTopArtists = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/all-artists-deduplicated');
          if (response.ok) {
            const data = await response.json();
            const artists = data.artists || [];
            setUserTopArtists(artists);
            
            // Cache the results for future use
            setCachedTopArtists(artists);
            
            console.log('Fetched user top artists from API for sorting:', artists.length);
          } else {
            console.error('Failed to fetch user top artists');
            setUserTopArtists([]);
          }
        } catch (error) {
          console.error('Error fetching user top artists:', error);
          setUserTopArtists([]);
        } finally {
          setLoadingTopArtists(false);
        }
      };
      
      fetchUserTopArtists();
    };
    
    loadUserTopArtists();
  }, [open]);

  // Helper function to check if an artist is in user's top artists
  const isArtistInUserTop = (artistName) => {
    if (!artistName || !userTopArtists.length) return false;
    const artistLower = artistName.toLowerCase().trim();
    
    return userTopArtists.some(userArtist => {
      const userArtistLower = userArtist.name.toLowerCase().trim();
      
      // Exact match (highest priority)
      if (artistLower === userArtistLower) return true;
      
      // Check if it's a known alias/variation (e.g., "Kanye West" vs "Ye")
      const knownAliases = {
        'kanye west': ['ye', 'kanye'],
        'the weeknd': ['weeknd', 'abel tesfaye'],
        'jay-z': ['jay z', 'jigga', 'hova'],
        'eminem': ['slim shady', 'marshall mathers'],
        'drake': ['drizzy', 'champagne papi'],
        'rihanna': ['rih', 'bad gal riri'],
        'taylor swift': ['taylor', 'tswift']
      };
      
      // Check if current artist matches any known alias
      if (knownAliases[userArtistLower]) {
        return knownAliases[userArtistLower].some(alias => 
          artistLower === alias || artistLower.includes(alias) || alias.includes(artistLower)
        );
      }
      
      // For other artists, use more strict matching
      // Only match if one is a clear subset of the other (not partial matches)
      const artistWords = artistLower.split(/\s+/);
      const userArtistWords = userArtistLower.split(/\s+/);
      
      // Check if all words in one artist name are contained in the other
      const isSubset = (words1, words2) => {
        return words1.every(word => 
          words2.some(userWord => userWord === word || userWord.includes(word))
        );
      };
      
      // Only return true if one is clearly a subset of the other
      return isSubset(artistWords, userArtistWords) || isSubset(userArtistWords, artistWords);
    });
  };

  // Helper function to determine the best default tab based on available data
  const getDefaultTab = (relationships) => {
    if (!relationships) return 'samples';
    
    // Check samples & sampling data
    const samplesCount = (relationships.samples?.length || 0) + (relationships.sampled_in?.length || 0);
    if (samplesCount > 0) return 'samples';
    
    // Check interpolations data
    const interpolationsCount = (relationships.interpolates?.length || 0) + (relationships.interpolated_by?.length || 0);
    if (interpolationsCount > 0) return 'interpolations';
    
    // Check remixes data
    const remixesCount = (relationships.remix_of?.length || 0) + (relationships.remixed_by?.length || 0);
    if (remixesCount > 0) return 'remixes';
    
    // Default fallback
    return 'samples';
  };

  // Helper function to check if there's any meaningful data to show
  const hasUsefulData = (songInfo) => {
    if (!songInfo?.songDetails) return false;
    
    // Check if there's a meaningful description
    const hasDescription = songInfo.songDetails.description && 
                          songInfo.songDetails.description.trim() !== '?' && 
                          songInfo.songDetails.description.trim().length > 0;
    
    // Check if there's any relationship data in the three main categories
    const relationships = songInfo.songDetails.relationships;
    if (relationships) {
      const samplesCount = (relationships.samples?.length || 0) + (relationships.sampled_in?.length || 0);
      const interpolationsCount = (relationships.interpolates?.length || 0) + (relationships.interpolated_by?.length || 0);
      const remixesCount = (relationships.remix_of?.length || 0) + (relationships.remixed_by?.length || 0);
      
      if (samplesCount > 0 || interpolationsCount > 0 || remixesCount > 0) {
        return true;
      }
    }
    
    return hasDescription;
  };

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by setting body to fixed position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);



  // Set the default tab based on available data when songInfo changes
  useEffect(() => {
    if (songInfo?.songDetails?.relationships) {
      const defaultTab = getDefaultTab(songInfo.songDetails.relationships);
      setActiveTab(defaultTab);
    }
  }, [songInfo]);

  if (!open && !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const renderSamples = (relationships) => {
    if (!relationships || typeof relationships !== 'object') {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No sample information available</div>;
    }

    // Extract samples from relationships
    const samples = relationships.samples || [];
    const sampledIn = relationships.sampled_in || [];

    if (samples.length === 0 && sampledIn.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No sample information available</div>;
    }

    const allSamples = [...samples, ...sampledIn];

    // Smart sorting: User's top artists first, then green (samples) before red (sampled_in)
    const sortedSamples = allSamples.sort((a, b) => {
      const aArtist = a.song.primary_artist?.toLowerCase() || '';
      const bArtist = b.song.primary_artist?.toLowerCase() || '';
      
      // Priority 1: Check if artist is in user's top artists (highest priority)
      const aIsInUserTop = isArtistInUserTop(a.song.primary_artist);
      const bIsInUserTop = isArtistInUserTop(b.song.primary_artist);
      
      if (aIsInUserTop && !bIsInUserTop) return -1;
      if (!aIsInUserTop && bIsInUserTop) return 1;
      
      // Priority 2: Green songs (samples) before red songs (sampled_in)
      const aIsGreen = a.type === 'samples';
      const bIsGreen = b.type === 'samples';
      
      if (aIsGreen && !bIsGreen) return -1;
      if (!aIsGreen && bIsGreen) return 1;
      
      // Priority 3: Alphabetical order for similar priority
      return a.song.title?.localeCompare(b.song.title) || 0;
    });

    return sortedSamples.map((sample, index) => (
      <div key={index} className="genius-relationship-card" style={{ 
        background: '#232323', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '8px',
        border: '1px solid #333'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span className="genius-relationship-tag" style={{ 
            background: sample.type === 'samples' ? '#1db954' : '#ff0033', 
            color: '#fff', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {sample.type === 'samples' ? 'Samples' : 'Sampled In'}
          </span>
        </div>
        <div className="genius-relationship-title" style={{ 
          fontWeight: '600', 
          color: '#fff',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {sample.song.title}
          {isArtistInUserTop(sample.song.primary_artist) && (
            <span style={{ 
              fontSize: '0.6rem', 
              background: '#1db954', 
              color: '#000', 
              padding: '2px 6px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ★ Your Top Artist
            </span>
          )}
        </div>
        <div className="genius-relationship-artist" style={{ 
          color: '#b3b3b3',
          fontSize: '0.9rem',
          fontWeight: '400'
        }}>
          by {sample.song.primary_artist}
        </div>
      </div>
    ));
  };

  // Helper function to get color based on relationship type
  const getRelationshipColor = (relationshipType) => {
    switch (relationshipType) {
      // Green: The song is the originator/takes from another
      case 'samples':
      case 'interpolates':
      case 'cover_of':
      case 'remix_of':
        return '#1db954'; // Green
      
      // Red: The song is derived from/taken by another
      case 'sampled_in':
      case 'interpolated_by':
      case 'covered_by':
      case 'remixed_by':
        return '#ff0033'; // Red
      
      // Default color for other relationship types
      default:
        return '#404040'; // Default gray
    }
  };

  // Helper function to get description for relationship types
  const getRelationshipDescription = (relationshipType) => {
    switch (relationshipType) {
      case 'samples':
        return 'This song contains a direct audio snippet copied from an older track. It uses the original recording of another song.';
      case 'sampled_in':
        return "This song's original audio was copied and used as an element in a new track by another artist.";
      case 'interpolates':
        return 'This song re-records a melody or lyric from an older track. It uses the original composition, not the original audio.';
      case 'interpolated_by':
        return "This song's melody or lyrics were re-recorded by another artist for their new song.";
      case 'remix_of':
        return 'This is a new, official version of another song, created by rearranging and altering its original parts (stems).';
      case 'remixed_by':
        return 'This is the original song that was re-imagined by another artist who rearranged its component parts to create a new version.';
      case 'cover_of':
        return 'This is a new performance of another song, typically with the same melody and lyrics but different arrangement.';
      case 'covered_by':
        return 'This original song has been performed by another artist with their own interpretation.';
      case 'translation_of':
        return 'This song is a translated version of another song, with lyrics in a different language.';
      case 'translations':
        return 'This original song has been translated into different languages by other artists.';
      default:
        return 'This song has a musical relationship with another track.';
    }
  };

  const renderTabContent = (relationships) => {
    if (!relationships || typeof relationships !== 'object') {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }

    switch (activeTab) {
      case 'samples':
        return renderSamples(relationships);
      case 'interpolations':
        return renderInterpolations(relationships);
      case 'remixes':
        return renderRemixes(relationships);
      default:
        return renderSamples(relationships);
    }
  };

  const renderInterpolations = (relationships) => {
    const interpolates = relationships.interpolates || [];
    const interpolatedBy = relationships.interpolated_by || [];

    if (interpolates.length === 0 && interpolatedBy.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No interpolation information available</div>;
    }

    const allInterpolations = [...interpolates, ...interpolatedBy];

    // Smart sorting: User's top artists first, then green (interpolates) before red (interpolated_by)
    const sortedInterpolations = allInterpolations.sort((a, b) => {
      const aArtist = a.song.primary_artist?.toLowerCase() || '';
      const bArtist = b.song.primary_artist?.toLowerCase() || '';
      
      // Priority 1: Check if artist is in user's top artists (highest priority)
      const aIsInUserTop = isArtistInUserTop(a.song.primary_artist);
      const bIsInUserTop = isArtistInUserTop(b.song.primary_artist);
      
      if (aIsInUserTop && !bIsInUserTop) return -1;
      if (!aIsInUserTop && bIsInUserTop) return 1;
      
      // Priority 2: Green songs (interpolates) before red songs (interpolated_by)
      const aIsGreen = a.type === 'interpolates';
      const bIsGreen = b.type === 'interpolates';
      
      if (aIsGreen && !bIsGreen) return -1;
      if (!aIsGreen && bIsGreen) return 1;
      
      // Priority 3: Alphabetical order for similar priority
      return a.song.title?.localeCompare(b.song.title) || 0;
    });

    return sortedInterpolations.map((item, index) => (
      <div key={index} className="genius-relationship-card" style={{ 
        background: '#232323', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '8px',
        border: '1px solid #333'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span className="genius-relationship-tag" style={{ 
            background: item.type === 'interpolates' ? '#1db954' : '#ff0033', 
            color: '#fff', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {item.type === 'interpolates' ? 'Interpolates' : 'Interpolated By'}
          </span>
        </div>
        <div className="genius-relationship-title" style={{ 
          fontWeight: '600', 
          color: '#fff',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {item.song.title}
          {isArtistInUserTop(item.song.primary_artist) && (
            <span style={{ 
              fontSize: '0.6rem', 
              background: '#1db954', 
              color: '#000', 
              padding: '2px 6px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ★ Your Top Artist
            </span>
          )}
        </div>
        <div className="genius-relationship-artist" style={{ 
          color: '#b3b3b3',
          fontSize: '0.9rem',
          fontWeight: '400'
        }}>
          by {item.song.primary_artist}
        </div>
      </div>
    ));
  };

  const renderRemixes = (relationships) => {
    const remixOf = relationships.remix_of || [];
    const remixedBy = relationships.remixed_by || [];

    if (remixOf.length === 0 && remixedBy.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No remix information available</div>;
    }

    const allRemixes = [...remixOf, ...remixedBy];

    // Smart sorting: User's top artists first, then green (remix_of) before red (remixed_by)
    const sortedRemixes = allRemixes.sort((a, b) => {
      const aArtist = a.song.primary_artist?.toLowerCase() || '';
      const bArtist = b.song.primary_artist?.toLowerCase() || '';
      
      // Priority 1: Check if artist is in user's top artists (highest priority)
      const aIsInUserTop = isArtistInUserTop(a.song.primary_artist);
      const bIsInUserTop = isArtistInUserTop(b.song.primary_artist);
      
      if (aIsInUserTop && !bIsInUserTop) return -1;
      if (!aIsInUserTop && bIsInUserTop) return 1;
      
      // Priority 2: Green songs (remix_of) before red songs (remixed_by)
      const aIsGreen = a.type === 'remix_of';
      const bIsGreen = b.type === 'remix_of';
      
      if (aIsGreen && !bIsGreen) return -1;
      if (!aIsGreen && bIsGreen) return 1;
      
      // Priority 3: Alphabetical order for similar priority
      return a.song.title?.localeCompare(b.song.title) || 0;
    });

    return sortedRemixes.map((item, index) => (
      <div key={index} className="genius-relationship-card" style={{ 
        background: '#232323', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '8px',
        border: '1px solid #333'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span className="genius-relationship-tag" style={{ 
            background: item.type === 'remix_of' ? '#1db954' : '#ff0033', 
            color: '#fff', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {item.type === 'remix_of' ? 'Remix Of' : 'Remixed By'}
          </span>
        </div>
        <div className="genius-relationship-title" style={{ 
          fontWeight: '600', 
          color: '#fff',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {item.song.title}
          {isArtistInUserTop(item.song.primary_artist) && (
            <span style={{ 
              fontSize: '0.6rem', 
              background: '#1db954', 
              color: '#000', 
              padding: '2px 6px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ★ Your Top Artist
            </span>
          )}
        </div>
        <div className="genius-relationship-artist" style={{ 
          color: '#b3b3b3',
          fontSize: '0.9rem',
          fontWeight: '400'
        }}>
          by {item.song.primary_artist}
        </div>
      </div>
    ));
  };

  const renderRelationships = (relationships) => {
    if (!relationships || typeof relationships !== 'object') {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }

    // Convert the relationships object to a flat array for rendering
    // Exclude 'sampled_in' since it's already shown in Samples & Sampling section
    const allRelationships = [];
    
    // Add all relationship types to the array except the ones handled by tabs and translations
    Object.keys(relationships).forEach(category => {
      if (category !== 'sampled_in' && 
          category !== 'samples' && 
          category !== 'translation_of' && 
          category !== 'translations' &&
          category !== 'interpolates' &&
          category !== 'interpolated_by' &&
          category !== 'remix_of' &&
          category !== 'remixed_by' &&
          Array.isArray(relationships[category]) && 
          relationships[category].length > 0) {
        allRelationships.push(...relationships[category]);
      }
    });

    if (allRelationships.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }

    return allRelationships.map((rel, index) => (
      <div key={index} className="genius-relationship-card" style={{ 
        background: '#232323', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '8px',
        border: '1px solid #333'
      }}>
        <div className="genius-relationship-tag" style={{ 
          background: '#404040', 
          color: '#fff', 
          padding: '4px 8px', 
          borderRadius: '12px', 
          fontSize: '0.75rem', 
          fontWeight: '600',
          textTransform: 'capitalize',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          {rel.type.replace(/_/g, ' ')}
        </div>
        <div className="genius-relationship-title" style={{ 
          fontWeight: '600', 
          color: '#fff',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {rel.song.title}
          {isArtistInUserTop(rel.song.primary_artist) && (
            <span style={{ 
              fontSize: '0.6rem', 
              background: '#1db954', 
              color: '#000', 
              padding: '2px 6px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ★ Your Top Artist
            </span>
          )}
        </div>
        <div className="genius-relationship-artist" style={{ 
          color: '#b3b3b3',
          fontSize: '0.9rem',
          fontWeight: '400'
        }}>
          by {rel.song.primary_artist}
        </div>
      </div>
    ));
  };

  return (
    <>
      
      
      <style jsx global>{`
        .genius-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          opacity: 0;
          transition: opacity 200ms ease-out;
          pointer-events: none;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .genius-modal-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .genius-modal-container {
          position: fixed;
          z-index: 50;
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
        }
        .genius-modal-container.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }
        .genius-modal-content {
          background-color: #181818;
          border: 1px solid #3f3f46;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: none;
          padding: 1.5rem;
          max-height: 85vh;
          overflow-y: auto;
        }
        .genius-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          position: relative;
        }
        .genius-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0;
          flex: 1;
          padding-right: 3rem;
        }
        .genius-close-button {
          background: rgba(24, 24, 24, 0.9);
          border: 1px solid #3f3f46;
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          min-width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 100;
        }
        .genius-close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          transform: scale(1.1);
        }
        .genius-section {
          margin-bottom: 1.5rem;
        }
        .genius-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f4f4f5;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333;
        }
        .genius-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .genius-info-item {
          background: #232323;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #333;
        }
        .genius-info-label {
          color: #a1a1aa;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .genius-info-value {
          color: #fff;
          font-weight: 500;
        }
        .genius-description {
          background: #232323;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #333;
          line-height: 1.6;
          color: #ffffff;
        }
        .genius-link {
          color: #1db954;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .genius-link:hover {
          color: #1ed760;
          text-decoration: underline;
        }
        .genius-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          width: 100%;
        }
        .genius-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #1db954;
          border-top-color: rgba(24, 24, 27, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .genius-error {
          text-align: center;
          color: #ef4444;
          padding: 2rem;
          font-size: 1.1rem;
        }
        
        /* Mobile responsive styles for screens below 480px */
        @media (max-width: 480px) {
          .genius-description {
            font-size: 0.6rem !important;
            padding: 12px !important;
          }
          
          .genius-tab-button {
            padding: 0.5rem 0.5rem !important;
            font-size: 0.85rem !important;
          }
          
          .genius-section-title {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
            padding-bottom: 0.25rem !important;
          }
          
          .genius-info-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
          }
          
          .genius-info-item {
            padding: 8px !important;
            border-radius: 6px !important;
          }
          
          .genius-info-label {
            font-size: 0.7rem !important;
            margin-bottom: 2px !important;
          }
          
          .genius-info-value {
            font-size: 0.8rem !important;
          }
          
          .genius-relationship-card {
            padding: 8px !important;
            margin-bottom: 6px !important;
            border-radius: 6px !important;
          }
          
          .genius-relationship-tag {
            padding: 3px 6px !important;
            font-size: 0.65rem !important;
            border-radius: 8px !important;
            margin-bottom: 6px !important;
          }
          
          .genius-relationship-title {
            font-size: 0.85rem !important;
            margin-bottom: 3px !important;
          }
          
          .genius-relationship-artist {
            font-size: 0.75rem !important;
          }
          
          .genius-section-title {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
            padding-bottom: 0.25rem !important;
          }
          
          .genius-info-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
          }
          
          .genius-info-item {
            padding: 8px !important;
            border-radius: 6px !important;
          }
          
          .genius-info-label {
            font-size: 0.7rem !important;
            margin-bottom: 2px !important;
          }
          
          .genius-info-value {
            font-size: 0.6rem !important;
          }

          .genius-relationship-info {
            padding: 8px 10px !important;
            font-size: 0.75rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0.75rem !important;
          }

          .genius-relationship-info strong {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 600px) {
          .genius-relationship-info {
            padding: 10px 12px !important;
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
            margin-bottom: 0.85rem !important;
          }

          .genius-relationship-info span {
            font-size: 0.7rem !important;
            padding: 3px 6px !important;
            margin-right: 6px !important;
          }

          .genius-definitions-toggle {
            padding: 4px 8px !important;
            font-size: 0.7rem !important;
            gap: 2px !important;
          }

          .genius-definitions-toggle.definitions-shown {
            border-color: #1db954 !important;
            color: #1db954 !important;
            background: rgba(29, 185, 84, 0.1) !important;
          }

          .genius-definitions-toggle.definitions-hidden {
            border-color: #666 !important;
            color: #999 !important;
            background: none !important;
          }
        }
      `}</style>

      <div 
        className={`genius-modal-overlay ${isVisible ? 'visible' : ''}`}
        onClick={handleClose}
      />
      
      <div className={`genius-modal-container ${isVisible ? 'visible' : ''}`}>
        <div className="genius-modal-content">
          <div className="genius-modal-header">
            <h2 className="genius-modal-title">
              {loading ? 'Loading...' : (songInfo?.songDetails?.title || 'Song Information')}
            </h2>
            <button className="genius-close-button" onClick={handleClose}>
              ×
            </button>
          </div>

          {loading && (
            <div className="genius-loading">
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#a1a1aa', fontSize: '1rem', marginBottom: '1.5rem' }}>
                  Fetching song information...
                </div>
                <div className="genius-spinner" />
              </div>
            </div>
          )}

          {error && (
            <div className="genius-error">
              <div>❌ {error}</div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
                Unable to fetch song information from Genius
              </div>
            </div>
          )}

          {!loading && !error && songInfo && hasUsefulData(songInfo) && (
            <>
              {/* Song Information */}
              <div className="genius-section">
                <h3 className="genius-section-title">Song Information</h3>
                <div className="genius-info-grid">
                  <div className="genius-info-item">
                    <div className="genius-info-label">Artist</div>
                    <div className="genius-info-value">
                      {songInfo.songDetails.primary_artist.name}
                    </div>
                  </div>
                  {songInfo.songDetails.album && (
                    <div className="genius-info-item">
                      <div className="genius-info-label">Album</div>
                      <div className="genius-info-value">
                        {songInfo.songDetails.album.name}
                      </div>
                    </div>
                  )}
                  {songInfo.songDetails.release_date && (
                    <div className="genius-info-item">
                      <div className="genius-info-label">Release Date</div>
                      <div className="genius-info-value">
                        {formatDate(songInfo.songDetails.release_date)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Artists */}
              {songInfo.songDetails.featured_artists && songInfo.songDetails.featured_artists.length > 0 && (
                <div className="genius-section">
                  <h3 className="genius-section-title">Featured Artists</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {songInfo.songDetails.featured_artists.map((artist, index) => (
                      <span key={index} style={{
                        background: '#1db954',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        {artist.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Song Description */}
              {songInfo.songDetails.description && songInfo.songDetails.description.trim() !== '?' && songInfo.songDetails.description.trim().length > 0 && (
                <div className="genius-section">
                  <h3 className="genius-section-title">About This Song</h3>
                  <div className="genius-description" style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '15px',
                    backgroundColor: '#232323',
                    borderRadius: '8px',
                    border: '1px solid #333'
                  }}>
                    {songInfo.songDetails.description}
                  </div>
                </div>
              )}

              {/* Tabbed Relationships Interface */}
              <div className="genius-section">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #333'
                }}>
                  <h3 className="genius-section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>Song Relationships</h3>
                  <button
                    className={`genius-definitions-toggle ${showDefinitions ? 'definitions-shown' : 'definitions-hidden'}`}
                    onClick={() => setShowDefinitions(!showDefinitions)}
                    style={{
                      background: 'none',
                      border: '1px solid #333',
                      color: '#a1a1aa',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      // Only apply hover effects on desktop (screens wider than 600px)
                      if (window.innerWidth > 600) {
                        e.currentTarget.style.borderColor = '#1db954';
                        e.currentTarget.style.color = '#1db954';
                      }
                    }}
                    onMouseLeave={(e) => {
                      // Only apply hover effects on desktop (screens wider than 600px)
                      if (window.innerWidth > 600) {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.color = '#a1a1aa';
                      }
                    }}
                  >
                    {showDefinitions ? '✕' : '?'} {showDefinitions ? 'Hide' : 'Show'} Definitions
                  </button>
                </div>
                
                {/* Quick Info About Current Tab */}
                {activeTab && showDefinitions && (
                  <div className="genius-relationship-info" style={{
                    background: '#232323',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    color: '#e0e0e0'
                  }}>
                    <div style={{ 
                      color: '#ffffff', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {activeTab === 'samples' ? 'About Samples & Sampling:' : 
                       activeTab === 'interpolations' ? 'About Interpolations:' : 
                       activeTab === 'remixes' ? 'About Remixes:' : 'About This Relationship:'}
                    </div>
                    {activeTab === 'samples' && (
                      <div>
                        <span style={{ 
                          background: '#1db954', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Samples:</span> {getRelationshipDescription('samples')}<br/><br/>
                        <span style={{ 
                          background: '#ff0033', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Sampled In:</span> {getRelationshipDescription('sampled_in')}
                      </div>
                    )}
                    {activeTab === 'interpolations' && (
                      <div>
                        <span style={{ 
                          background: '#1db954', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Interpolates:</span> {getRelationshipDescription('interpolates')}<br/><br/>
                        <span style={{ 
                          background: '#ff0033', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Interpolated By:</span> {getRelationshipDescription('interpolated_by')}
                      </div>
                    )}
                    {activeTab === 'remixes' && (
                      <div>
                        <span style={{ 
                          background: '#1db954', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Remix Of:</span> {getRelationshipDescription('remix_of')}<br/><br/>
                        <span style={{ 
                          background: '#ff0033', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>Remixed By:</span> {getRelationshipDescription('remixed_by')}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid #333',
                  marginBottom: '1rem'
                }}>
                  <button
                    onClick={() => setActiveTab('samples')}
                    className="genius-tab-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'samples' ? '#fff' : '#a1a1aa',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      fontWeight: activeTab === 'samples' ? '600' : '400',
                      cursor: 'pointer',
                      borderBottom: activeTab === 'samples' ? '2px solid #1db954' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Samples & Sampling ({((songInfo.songDetails.relationships?.samples?.length || 0) + (songInfo.songDetails.relationships?.sampled_in?.length || 0))})
                  </button>
                  <button
                    onClick={() => setActiveTab('interpolations')}
                    className="genius-tab-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'interpolations' ? '#fff' : '#a1a1aa',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      fontWeight: activeTab === 'interpolations' ? '600' : '400',
                      cursor: 'pointer',
                      borderBottom: activeTab === 'interpolations' ? '2px solid #1db954' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Interpolations ({((songInfo.songDetails.relationships?.interpolates?.length || 0) + (songInfo.songDetails.relationships?.interpolated_by?.length || 0))})
                  </button>
                  <button
                    onClick={() => setActiveTab('remixes')}
                    className="genius-tab-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'remixes' ? '#fff' : '#a1a1aa',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      fontWeight: activeTab === 'remixes' ? '600' : '400',
                      cursor: 'pointer',
                      borderBottom: activeTab === 'remixes' ? '2px solid #1db954' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Remixes ({((songInfo.songDetails.relationships?.remix_of?.length || 0) + (songInfo.songDetails.relationships?.remixed_by?.length || 0))})
                  </button>
                </div>
                
                {/* Tab Content */}
                {renderTabContent(songInfo.songDetails.relationships)}
              </div>

              {/* Other Relationships */}
              {(() => {
                const otherRelationships = renderRelationships(songInfo.songDetails.relationships);
                if (otherRelationships && otherRelationships.props && otherRelationships.props.children !== 'No relationship information available') {
                  return (
                    <div className="genius-section">
                      <h3 className="genius-section-title">Other Relationships</h3>
                      {otherRelationships}
                    </div>
                  );
                }
                return null;
              })()}


            </>
          )}

          {!loading && !error && songInfo && !hasUsefulData(songInfo) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              textAlign: 'center',
              minHeight: '200px'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.6
              }}>
                
              </div>
              <h3 style={{
                color: '#f4f4f5',
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                margin: 0
              }}>
                No Additional Information Available
              </h3>
              <p style={{
                color: '#a1a1aa',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                maxWidth: '400px',
                margin: '0.5rem 0 0 0'
              }}>
                This song doesn't have detailed information, samples, interpolations, or remix data available.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
