import React, { useState, useEffect } from 'react';

export default function GeniusSongModal({ open, onClose, songInfo, loading, error }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  const renderSamples = (samples) => {
    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No sample information available</div>;
    }

    // Check if all samples have empty song data
    const allEmpty = samples.every(sample => 
      !sample || !sample.song || !sample.song.title || !sample.song.primary_artist || !sample.song.primary_artist.name
    );
    
    if (allEmpty) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No sample information available</div>;
    }

    return samples.map((sample, index) => {
      // Safety check for sample object structure
      if (!sample || !sample.type || !sample.song || !sample.song.title || !sample.song.primary_artist || !sample.song.primary_artist.name) {
        return null;
      }
      
      return (
        <div key={index} style={{ 
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
            <span style={{ 
              background: sample.type === 'samples' ? '#1db954' : '#ff6b6b', 
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
          <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
            {sample.song.title}
          </div>
          <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
            by {sample.song.primary_artist.name}
          </div>
        </div>
      );
    }).filter(Boolean); // Remove any null entries
  };

  // Helper function to check if description has meaningful content
  const hasMeaningfulDescription = (description) => {
    if (!description) return false;
    // Check if description is just "?" or empty string
    const trimmedDesc = description.toString().trim();
    const result = trimmedDesc !== '' && trimmedDesc !== '?';
    console.log('[GeniusSongModal] Description check:', { description, trimmedDesc, result });
    return result;
  };

  // Helper function to check if relationships have actual song data
  const hasMeaningfulRelationships = (relationships) => {
    if (!relationships) {
      console.log('[GeniusSongModal] No relationships data');
      return false;
    }
    
    console.log('[GeniusSongModal] Raw relationships data:', relationships);
    
    // Check if any relationship type has songs
    const hasSongs = Object.keys(relationships).some(key => {
      const songs = relationships[key];
      return Array.isArray(songs) && songs.length > 0;
    });
    
    console.log('[GeniusSongModal] Has songs in relationships:', hasSongs);
    return hasSongs;
  };

  // Helper function to check if there's any meaningful information
  const hasAnyMeaningfulInfo = (songInfo) => {
    if (!songInfo || !songInfo.songDetails) return false;
    
    // Debug logging to understand the data structure
    console.log('[GeniusSongModal] Checking for meaningful info:', {
      description: songInfo.songDetails.description,
      relationships: songInfo.songDetails.relationships,
      samples: songInfo.songDetails.samples,
      featured_artists: songInfo.songDetails.featured_artists
    });
    
    const hasDesc = hasMeaningfulDescription(songInfo.songDetails.description);
    const hasRelationships = hasMeaningfulRelationships(songInfo.songDetails.relationships);
    const hasSamples = songInfo.songDetails.relationships && (
      (songInfo.songDetails.relationships.samples && Array.isArray(songInfo.songDetails.relationships.samples) && 
       songInfo.songDetails.relationships.samples.length > 0) ||
      (songInfo.songDetails.relationships.sampled_in && Array.isArray(songInfo.songDetails.relationships.sampled_in) && 
       songInfo.songDetails.relationships.sampled_in.length > 0)
    );
    const hasFeaturedArtists = songInfo.songDetails.featured_artists && 
                               Array.isArray(songInfo.songDetails.featured_artists) && 
                               songInfo.songDetails.featured_artists.length > 0;
    
    // Only check the 3 specific criteria: description, relationships, and samples
    const result = hasDesc || hasRelationships || hasSamples;
    console.log('[GeniusSongModal] Has meaningful info:', result, { hasDesc, hasRelationships, hasSamples, hasFeaturedArtists });
    
    return result;
  };

  const renderRelationships = (relationships) => {
    if (!relationships) {
      console.log('[GeniusSongModal] No relationships data');
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }

    console.log('[GeniusSongModal] Starting to render relationships');
    console.log('[GeniusSongModal] Full relationships object:', relationships);
    console.log('[GeniusSongModal] Relationships keys:', Object.keys(relationships));
    
    // Create sections for each relationship type that has songs
    const sections = [];
    
    Object.keys(relationships).forEach(relationshipType => {
      const relationshipItems = relationships[relationshipType];
      console.log(`[GeniusSongModal] Processing ${relationshipType}:`, relationshipItems);
      
      if (Array.isArray(relationshipItems) && relationshipItems.length > 0) {
        console.log(`[GeniusSongModal] ${relationshipType} has ${relationshipItems.length} relationship items`);
        
        // Log the first item to see its structure
        if (relationshipItems.length > 0) {
          console.log(`[GeniusSongModal] First item in ${relationshipType}:`, relationshipItems[0]);
          console.log(`[GeniusSongModal] First item structure:`, {
            hasType: !!relationshipItems[0].type,
            hasSong: !!relationshipItems[0].song,
            songType: typeof relationshipItems[0].song,
            songKeys: relationshipItems[0].song ? Object.keys(relationshipItems[0].song) : 'No song object'
          });
        }
        
        // Filter out invalid relationship items and extract valid songs
        const validSongs = relationshipItems.filter(item => {
          // Check if item exists and has the expected structure
          if (!item) return false;
          
          // The server sends: { type: '...', song: { title: '...', primary_artist: { name: '...' } } }
          const hasSong = item.song && typeof item.song === 'object';
          
          // Log the full song object structure to debug
          if (hasSong) {
            console.log(`[GeniusSongModal] Full song object for ${relationshipType}:`, item.song);
            console.log(`[GeniusSongModal] Song object keys:`, Object.keys(item.song));
          }
          
          // Try multiple possible artist field structures
          const hasTitle = hasSong && (item.song.title || item.song.name);
          const hasArtist = hasSong && (
            (item.song.primary_artist && item.song.primary_artist.name) ||
            (item.song.artist && item.song.artist.name) ||
            (item.song.artist_names) ||
            (item.song.artist_name)
          );
          
          // Log what we're checking
          console.log(`[GeniusSongModal] Checking relationship item:`, {
            hasItem: !!item,
            hasSong: hasSong,
            hasTitle: hasTitle,
            hasArtist: hasArtist,
            songTitle: hasSong ? (item.song.title || item.song.name) : 'No song',
            artistName: hasSong ? (
              item.song.primary_artist?.name || 
              item.song.artist?.name || 
              item.song.artist_names || 
              item.song.artist_name || 
              'No artist'
            ) : 'No song',
            availableArtistFields: hasSong ? {
              primary_artist: item.song.primary_artist,
              artist: item.song.artist,
              artist_names: item.song.artist_names,
              artist_name: item.song.artist_name
            } : 'No song object'
          });
          
          return hasSong && hasTitle && hasArtist;
        }).map(item => {
          // Extract and normalize the song data
          const song = item.song;
          return {
            title: song.title || song.name,
            primary_artist: {
              name: song.primary_artist?.name || 
                    song.artist?.name || 
                    song.artist_names || 
                    song.artist_name || 
                    'Unknown Artist'
            }
          };
        });
        
        console.log(`[GeniusSongModal] ${relationshipType} has ${validSongs.length} valid songs after filtering`);
        
        if (validSongs.length > 0) {
          console.log(`[GeniusSongModal] Creating section for ${relationshipType} with ${validSongs.length} songs`);
          
          // Create section for this relationship type
          const section = (
            <div key={relationshipType} style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '12px',
                textTransform: 'capitalize'
              }}>
                {relationshipType.replace(/_/g, ' ')}
              </h4>
              
              {validSongs.map((song, songIndex) => {
                // The song data is now normalized, so we can access it directly
                const songTitle = song.title;
                const artistName = song.primary_artist.name;
                
                return (
                  <div key={`${relationshipType}-${songIndex}`} style={{ 
                    background: '#232323', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    border: '1px solid #333'
                  }}>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                      {songTitle}
                    </div>
                    <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                      by {artistName}
                    </div>
                  </div>
                );
              })}
            </div>
          );
          
          sections.push(section);
          console.log(`[GeniusSongModal] Section added for ${relationshipType}`);
        } else {
          console.log(`[GeniusSongModal] No valid songs found for ${relationshipType} after filtering`);
        }
      } else {
        console.log(`[GeniusSongModal] ${relationshipType} has no relationship items or invalid data`);
      }
    });
    
    console.log('[GeniusSongModal] Total sections created:', sections.length);
    console.log('[GeniusSongModal] Sections array:', sections);
    
    if (sections.length === 0) {
      console.log('[GeniusSongModal] No sections to render');
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }
    
    console.log('[GeniusSongModal] Rendering', sections.length, 'sections');
    return sections;
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

          {!loading && !error && songInfo && (
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

          {/* Check if there's any meaningful information */}
          {!hasAnyMeaningfulInfo(songInfo) && (
            <div className="genius-section" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ 
                fontSize: '1.2rem', 
                color: '#a1a1aa', 
                marginBottom: '1rem',
                fontWeight: 600
              }}>
                ⚠️ No Information Found
              </div>
              <div style={{ 
                color: '#71717a', 
                fontSize: '0.95rem',
                lineHeight: 1.5
              }}>
                No information found for this song.
                <br />
                The description, relationships, and samples are all empty or unavailable.
              </div>
            </div>
          )}

          {/* Featured Artists */}
              {songInfo.songDetails.featured_artists && Array.isArray(songInfo.songDetails.featured_artists) && songInfo.songDetails.featured_artists.length > 0 && (
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
              {hasMeaningfulDescription(songInfo.songDetails.description) && (
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

              {/* Samples */}
              {songInfo.songDetails.relationships && (
                (songInfo.songDetails.relationships.samples && songInfo.songDetails.relationships.samples.length > 0) ||
                (songInfo.songDetails.relationships.sampled_in && songInfo.songDetails.relationships.sampled_in.length > 0)
              ) && (
                <div className="genius-section">
                  <h3 className="genius-section-title">Samples & Sampling</h3>
                  {renderSamples([
                    ...(songInfo.songDetails.relationships.samples || []),
                    ...(songInfo.songDetails.relationships.sampled_in || [])
                  ])}
                </div>
              )}

              {/* Relationships */}
              {songInfo.songDetails.relationships && (
                <div className="genius-section">
                  <h3 className="genius-section-title">Related Songs</h3>
                  {renderRelationships(songInfo.songDetails.relationships)}
                </div>
              )}


            </>
          )}
        </div>
      </div>
    </>
  );
}
