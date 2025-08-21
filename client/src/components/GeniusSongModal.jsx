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
    if (!samples || samples.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No sample information available</div>;
    }

    return samples.map((sample, index) => (
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
    ));
  };

  const renderRelationships = (relationships) => {
    if (!relationships || relationships.length === 0) {
      return <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No relationship information available</div>;
    }

    return relationships.map((rel, index) => (
      <div key={index} style={{ 
        background: '#232323', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '8px',
        border: '1px solid #333'
      }}>
        <div style={{ 
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
        <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
          {rel.song.title}
        </div>
        <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
          by {rel.song.primary_artist.name}
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
          padding: '12px';
          border-radius: '8px';
          border: '1px solid #333';
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
          color: #e4e4e7;
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
          min-height: 200px;
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
              {songInfo?.songDetails?.title || 'Song Information'}
            </h2>
            <button className="genius-close-button" onClick={handleClose}>
              ×
            </button>
          </div>

          {loading && (
            <div className="genius-loading">
              <div className="genius-spinner" />
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
              {/* Basic Information */}
              <div className="genius-section">
                <h3 className="genius-section-title">Basic Information</h3>
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
                  <div className="genius-info-item">
                    <div className="genius-info-label">Genius URL</div>
                    <div className="genius-info-value">
                      <a 
                        href={songInfo.songDetails.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="genius-link"
                      >
                        View on Genius →
                      </a>
                    </div>
                  </div>
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
                      {songInfo.songDetails.description && (
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
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              {songInfo.songDetails.description}
            </div>
          </div>
        )}

              {/* Samples */}
              <div className="genius-section">
                <h3 className="genius-section-title">Samples & Sampling</h3>
                {renderSamples(songInfo.songDetails.samples)}
              </div>

              {/* Relationships */}
              <div className="genius-section">
                <h3 className="genius-section-title">Related Songs</h3>
                {renderRelationships(songInfo.songDetails.relationships)}
              </div>

              {/* Search Info */}
              {songInfo.searchResult && (
                <div className="genius-section">
                  <h3 className="genius-section-title">Search Information</h3>
                  <div className="genius-info-grid">
                    <div className="genius-info-item">
                      <div className="genius-info-label">Match Score</div>
                      <div className="genius-info-value">
                        {songInfo.searchResult.score}/100
                      </div>
                    </div>
                    <div className="genius-info-item">
                      <div className="genius-info-label">Found Title</div>
                      <div className="genius-info-value">
                        {songInfo.searchResult.title}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
