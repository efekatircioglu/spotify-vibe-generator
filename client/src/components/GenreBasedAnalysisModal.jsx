import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getGenreData, formatEnergyLevel, formatTempo, formatFocus, formatDanceability } from '../utils/genreAnalysisData';

export default function GenreBasedAnalysisModal({ open, onClose, songInfo, artistGenre, genreSource = 'spotify' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [genreAnalysis, setGenreAnalysis] = useState(null);

  useEffect(() => {
    if (open && songInfo && artistGenre) {
      setIsVisible(true);
      // Get genre analysis data
      const analysis = getGenreData(artistGenre);
      setGenreAnalysis(analysis);
    } else {
      setIsVisible(false);
      setGenreAnalysis(null);
    }
  }, [open, songInfo, artistGenre]);

  // Effect to handle body scrolling - prevent background scrolling when modal is open
  useEffect(() => {
    if (isVisible) {
      // Lock body scroll when modal is open (prevents desktop background scrolling)
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'auto';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(20,20,20,0.88)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '16px'
      }} 
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxHeight: '90vh', 
          width: '100%',
          maxWidth: '95vw',
          overflowY: 'auto', 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#444 #232323', 
          background: '#18181b', 
          borderRadius: 20, 
          boxShadow: '0 8px 48px #000b', 
          position: 'relative',
          padding: 'clamp(20px, 4vw, 32px)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'clamp(16px, 3vw, 20px)',
            right: 'clamp(16px, 3vw, 20px)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: 'clamp(24px, 5vw, 28px)',
            cursor: 'pointer',
            zIndex: 1001,
            width: 'clamp(32px, 6vw, 40px)',
            height: 'clamp(32px, 6vw, 40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.color = '#ffffff';
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.color = '#9ca3af';
            e.target.style.background = 'none';
          }}
          aria-label="Close Modal"
        >
          ×
        </button>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          <h1 
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 700,
              marginBottom: 'clamp(6px, 2vw, 8px)',
              lineHeight: 1.2,
              background: 'linear-gradient(90deg, #60a5fa, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              wordBreak: 'break-word'
            }}
          >
            {songInfo.name}
          </h1>
          <div style={{ 
            color: '#d1d5db', 
            fontSize: 'clamp(14px, 3.5vw, 16px)', 
            fontWeight: 400,
            lineHeight: 1.3,
            wordBreak: 'break-word'
          }}>
            {songInfo.artists ? songInfo.artists.map(a => a.name).join(', ') : songInfo.artist} — {(() => {
              // Try multiple possible album name sources
              if (songInfo.album?.name) return songInfo.album.name;
              if (songInfo.album) return songInfo.album;
              if (songInfo.album_name) return songInfo.album_name;
              return 'Unknown Album';
            })()}
          </div>
          <div style={{ 
            color: '#ffffff', 
            fontSize: 'clamp(16px, 4vw, 18px)', 
            fontWeight: 600, 
            marginTop: 'clamp(8px, 2vw, 12px)' 
          }}>
            {artistGenre}
          </div>
        </div>

        {/* Info Box */}
        <div style={{ 
          background: '#232b39', 
          borderRadius: 'clamp(10px, 2.5vw, 12px)', 
          padding: 'clamp(16px, 3.5vw, 20px)', 
          marginBottom: 'clamp(20px, 4vw, 24px)',
          border: '1px solid #374151'
        }}>
          <div style={{ 
            color: '#60a5fa', 
            fontSize: 'clamp(14px, 3.5vw, 16px)', 
            fontWeight: 600, 
            marginBottom: 'clamp(6px, 2vw, 8px)' 
          }}>
            ℹ️ Genre-Based Analysis Available
          </div>
          <div style={{ 
            color: '#d1d5db', 
            fontSize: 'clamp(13px, 3vw, 14px)', 
            lineHeight: 1.5 
          }}>
            While we couldn't find a MusicBrainz ID for this track, we can provide analysis based on the artist's genre classification from {genreSource === 'discogs' ? 'Discogs' : 'Spotify'}. This gives you insights into the typical characteristics of music in this genre.
          </div>
        </div>

        {/* Genre Analysis Table */}
        <div style={{ marginBottom: 'clamp(20px, 4vw, 24px)' }}>
          <h3 style={{ 
            color: '#ffffff', 
            fontSize: 'clamp(16px, 4vw, 18px)', 
            fontWeight: 600, 
            marginBottom: 'clamp(12px, 3vw, 16px)',
            textAlign: 'center'
          }}>
            Genre Characteristics: {artistGenre}
          </h3>
          
          <div style={{ 
            background: '#232b39', 
            borderRadius: 'clamp(10px, 2.5vw, 12px)', 
            overflow: 'hidden',
            border: '1px solid #374151'
          }}>
            {/* Mobile-optimized table layout */}
            <div style={{ padding: 'clamp(12px, 3vw, 16px)' }}>
              {/* Energy Level */}
              <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: 600, 
                  marginBottom: 'clamp(4px, 1.5vw, 6px)' 
                }}>
                  Energy Level
                </div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: 'clamp(13px, 3vw, 14px)', 
                  fontWeight: 500,
                  marginBottom: 'clamp(6px, 2vw, 8px)'
                }}>
                  {genreAnalysis ? formatEnergyLevel(genreAnalysis.energy) : 'Medium'}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  lineHeight: 1.4 
                }}>
                  {genreAnalysis ? 
                    `This genre typically features ${genreAnalysis.energy} energy levels, creating a ${genreAnalysis.energy === 'low' ? 'calm and relaxed' : 
                     genreAnalysis.energy === 'low-to-mid' ? 'gentle and soothing' :
                     genreAnalysis.energy === 'medium' ? 'balanced and moderate' :
                     genreAnalysis.energy === 'mid-to-high' ? 'energetic and engaging' :
                     genreAnalysis.energy === 'high' ? 'intense and powerful' :
                     'varied and dynamic'} musical experience.` :
                    'Energy level varies based on the specific style and mood of the music.'
                  }
                </div>
              </div>

              {/* Tempo */}
              <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: 600, 
                  marginBottom: 'clamp(4px, 1.5vw, 6px)' 
                }}>
                  Tempo
                </div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: 'clamp(13px, 3vw, 14px)', 
                  fontWeight: 500,
                  marginBottom: 'clamp(6px, 2vw, 8px)'
                }}>
                  {genreAnalysis ? formatTempo(genreAnalysis.tempo) : 'Variable tempo range'}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  lineHeight: 1.4 
                }}>
                  {genreAnalysis ? 
                    `The tempo in this genre is typically ${genreAnalysis.tempo}, which ${genreAnalysis.tempo === 'low' ? 'creates a relaxed, contemplative atmosphere' :
                     genreAnalysis.tempo === 'low-to-mid' ? 'provides a gentle, flowing rhythm' :
                     genreAnalysis.tempo === 'medium' ? 'offers a balanced, accessible pace' :
                     genreAnalysis.tempo === 'mid-to-high' ? 'delivers an energetic, engaging feel' :
                     genreAnalysis.tempo === 'high' ? 'creates an intense, driving experience' :
                     'varies widely to match different emotional expressions'}.` :
                    'Tempo varies based on the specific style and mood of the music.'
                  }
                </div>
              </div>

              {/* Musical Focus */}
              <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: 600, 
                  marginBottom: 'clamp(4px, 1.5vw, 6px)' 
                }}>
                  Musical Focus
                </div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: 'clamp(13px, 3vw, 14px)', 
                  fontWeight: 500,
                  marginBottom: 'clamp(6px, 2vw, 8px)'
                }}>
                  {genreAnalysis ? formatFocus(genreAnalysis.focus) : 'Balanced'}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  lineHeight: 1.4 
                }}>
                  {genreAnalysis ? 
                    `This genre ${genreAnalysis.focus === 'balanced' ? 'maintains an equal balance between vocals and instruments' :
                     genreAnalysis.focus === 'towards instrumental' ? 'emphasizes instrumental performance and arrangement' :
                     genreAnalysis.focus === 'towards vocal' ? 'prioritizes vocal expression and lyrical content' :
                     'features variable focus depending on the specific style'}.` :
                    'Musical focus varies based on the specific style and arrangement.'
                  }
                </div>
              </div>

              {/* Mood */}
              <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: 600, 
                  marginBottom: 'clamp(4px, 1.5vw, 6px)' 
                }}>
                  Mood
                </div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: 'clamp(13px, 3vw, 14px)', 
                  fontWeight: 500,
                  marginBottom: 'clamp(6px, 2vw, 8px)',
                  wordBreak: 'break-word'
                }}>
                  {genreAnalysis && genreAnalysis.mood ? 
                    genreAnalysis.mood.join(', ') :
                    'Genre-typical mood'
                  }
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  lineHeight: 1.4 
                }}>
                  {genreAnalysis && genreAnalysis.mood ? 
                    `This genre typically conveys ${genreAnalysis.mood.join(', ')} emotions, creating a ${genreAnalysis.mood.includes('melancholic') ? 'thoughtful and reflective' :
                     genreAnalysis.mood.includes('energetic') ? 'vibrant and uplifting' :
                     genreAnalysis.mood.includes('dark') ? 'mysterious and intense' :
                     genreAnalysis.mood.includes('relaxed') ? 'calm and peaceful' :
                     'distinctive and characteristic'} musical atmosphere.` :
                    'Mood varies based on the specific style and emotional expression.'
                  }
                </div>
              </div>

              {/* Danceability */}
              <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: 600, 
                  marginBottom: 'clamp(4px, 1.5vw, 6px)' 
                }}>
                  Danceability
                </div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: 'clamp(13px, 3vw, 14px)', 
                  fontWeight: 500,
                  marginBottom: 'clamp(6px, 2vw, 8px)'
                }}>
                  {genreAnalysis ? formatDanceability(genreAnalysis.danceability) : 'Medium'}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  lineHeight: 1.4 
                }}>
                  {genreAnalysis ? 
                    `This genre has ${genreAnalysis.danceability} danceability, making it ${genreAnalysis.danceability === 'low' ? 'more suitable for listening and contemplation' :
                     genreAnalysis.danceability === 'low-to-mid' ? 'moderately danceable with some rhythmic elements' :
                     genreAnalysis.danceability === 'medium' ? 'reasonably danceable with clear rhythmic patterns' :
                     genreAnalysis.danceability === 'high' ? 'highly danceable with strong rhythmic drive' :
                     'variably danceable depending on the specific style'}.` :
                    'Danceability varies based on the specific style and rhythmic elements.'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

GenreBasedAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
  artistGenre: PropTypes.string,
  genreSource: PropTypes.oneOf(['spotify', 'discogs'])
};
