import React from 'react';

export default function AlbumContributorsModal({ isOpen, onClose, contributors, loading, error }) {
  // Log when modal opens/closes and data changes
  React.useEffect(() => {
    if (isOpen) {
      console.log(`\n📱 [MODAL] Album Contributors Modal opened`);
      if (contributors) {
        console.log(`   Album: "${contributors.albumInfo?.title}"`);
        console.log(`   Artist: "${contributors.albumInfo?.artist}"`);
        console.log(`   Year: ${contributors.albumInfo?.year}`);
        console.log(`   Data structure:`, Object.keys(contributors));
      }
      if (loading) console.log(`   Status: Loading...`);
      if (error) console.log(`   Status: Error - ${error}`);
    }
  }, [isOpen, contributors, loading, error]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        .album-contributors-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .album-contributors-modal {
          background: #181818;
          border: 1px solid #3f3f46;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
        }
        
        .album-contributors-header {
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #3f3f46;
          position: sticky;
          top: 0;
          background: #181818;
          z-index: 10;
        }
        
        .album-contributors-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0 0 8px 0;
        }
        
        .album-contributors-subtitle {
          font-size: 1rem;
          color: #a1a1aa;
          margin: 0;
        }
        

        
        .album-contributors-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #a1a1aa;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .album-contributors-close:hover {
          background: #3f3f46;
          color: #f4f4f5;
        }
        
        .album-contributors-content {
          padding: 24px;
        }
        
        .contributors-section {
          margin-bottom: 32px;
        }
        
        .contributors-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #3f3f46;
        }
        
        .contributors-list {
          display: grid;
          gap: 12px;
        }
        
        .contributor-item {
          background: #232323;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }
        
        .contributor-item:hover {
          background: #2a2a2a;
          border-color: #52525b;
        }
        
        .contributor-name {
          font-weight: 700;
          color: #f4f4f5;
          margin-bottom: 4px;
        }
        
        .contributor-role {
          color: #a1a1aa;
          font-size: 0.9rem;
        }
        
        .track-contributors {
          background: #1a1a1a;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .track-title {
          font-weight: 700;
          color: #f4f4f5;
          margin-bottom: 8px;
          font-size: 1.1rem;
        }
        
        .track-details {
          color: #a1a1aa;
          font-size: 0.9rem;
          margin-bottom: 12px;
        }
        
        .track-contributors-list {
          display: grid;
          gap: 8px;
        }
        
        .track-contributor {
          background: #232323;
          border: 1px solid #3f3f46;
          border-radius: 6px;
          padding: 12px;
        }
        
        .labels-companies {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .label-company-item {
          background: #232323;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 16px;
        }
        
        .label-company-name {
          font-weight: 700;
          color: #f4f4f5;
          margin-bottom: 4px;
        }
        
        .label-company-detail {
          color: #a1a1aa;
          font-size: 0.9rem;
        }
        
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #a1a1aa;
        }
        
        .error-message {
          text-align: center;
          padding: 60px;
          color: #ef4444;
        }
        
        .no-contributors {
          text-align: center;
          padding: 60px;
          color: #a1a1aa;
        }
        
                @media (max-width: 768px) {
          .album-contributors-modal {
            margin: 20px;
            max-height: calc(100vh - 40px);
          }
          
          .labels-companies {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 500px) {
          .album-contributors-overlay {
            padding: 10px;
          }

          .album-contributors-modal {
            margin: 10px;
            max-height: calc(100vh - 20px);
            border-radius: 12px;
          }
          
          .album-contributors-header {
            padding: 16px 16px 12px 16px;
          }
          
          .album-contributors-title {
            font-size: 1.1rem;
            margin-bottom: 6px;
          }
          
          .album-contributors-subtitle {
            font-size: 0.85rem;
          }
          
          .album-contributors-close {
            top: 12px;
            right: 12px;
            font-size: 1.2rem;
            padding: 2px;
          }
          
          .album-contributors-content {
            padding: 16px;
          }
          
          .contributors-section {
            margin-bottom: 20px;
          }
          
          .contributors-section-title {
            font-size: 1rem;
            margin-bottom: 10px;
            padding-bottom: 6px;
          }
          
          .contributors-list {
            gap: 8px;
          }
          
          .contributor-item {
            padding: 12px;
            border-radius: 6px;
          }
          
          .contributor-name {
            font-size: 0.9rem;
            margin-bottom: 2px;
          }
          
          .contributor-role {
            font-size: 0.75rem;
          }
          
          .track-contributors {
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 6px;
          }
          
          .track-title {
            font-size: 0.95rem;
            margin-bottom: 6px;
          }
          
          .track-details {
            font-size: 0.75rem;
            margin-bottom: 8px;
          }
          
          .track-contributors-list {
            gap: 6px;
          }
          
          .track-contributor {
            padding: 8px;
            border-radius: 4px;
          }
          
          .label-company-item {
            padding: 12px;
            border-radius: 6px;
          }
          
          .label-company-name {
            font-size: 0.9rem;
            margin-bottom: 2px;
          }
          
          .label-company-detail {
            font-size: 0.75rem;
          }
          
          .loading-spinner, .error-message, .no-contributors {
            padding: 40px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 430px) {
          .album-contributors-overlay {
            padding: 6px;
          }

          .album-contributors-modal {
            margin: 6px;
            max-height: calc(100vh - 12px);
            border-radius: 10px;
          }
          
          .album-contributors-header {
            padding: 12px 12px 8px 12px;
          }
          
          .album-contributors-title {
            font-size: 1rem;
            margin-bottom: 4px;
          }
          
          .album-contributors-subtitle {
            font-size: 0.75rem;
          }
          
          .album-contributors-close {
            top: 8px;
            right: 8px;
            font-size: 1rem;
            padding: 1px;
          }
          
          .album-contributors-content {
            padding: 12px;
          }
          
          .contributors-section {
            margin-bottom: 16px;
          }
          
          .contributors-section-title {
            font-size: 0.9rem;
            margin-bottom: 8px;
            padding-bottom: 4px;
          }
          
          .contributors-list {
            gap: 6px;
          }
          
          .contributor-item {
            padding: 10px;
            border-radius: 4px;
          }
          
          .contributor-name {
            font-size: 0.8rem;
            margin-bottom: 1px;
          }
          
          .contributor-role {
            font-size: 0.7rem;
          }
          
          .track-contributors {
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
          }
          
          .track-title {
            font-size: 0.85rem;
            margin-bottom: 4px;
          }
          
          .track-details {
            font-size: 0.7rem;
            margin-bottom: 6px;
          }
          
          .track-contributors-list {
            gap: 4px;
          }
          
          .track-contributor {
            padding: 6px;
            border-radius: 3px;
          }
          
          .label-company-item {
            padding: 10px;
            border-radius: 4px;
          }
          
          .label-company-name {
            font-size: 0.8rem;
            margin-bottom: 1px;
          }
          
          .label-company-detail {
            font-size: 0.7rem;
          }
          
          .loading-spinner, .error-message, .no-contributors {
            padding: 30px;
            font-size: 0.75rem;
          }
        }
      `}</style>

      <div className="album-contributors-overlay" onClick={onClose}>
        <div className="album-contributors-modal" onClick={(e) => e.stopPropagation()}>
          <div className="album-contributors-header">
            <button className="album-contributors-close" onClick={onClose}>
              ×
            </button>
            <h2 className="album-contributors-title">Album Contributors</h2>
                                    {contributors?.albumInfo && (
                          <p className="album-contributors-subtitle">
                            {contributors.albumInfo.title} by {contributors.albumInfo.artist}
                            {contributors.albumInfo.year && ` (${contributors.albumInfo.year})`}
                          </p>
                        )}

          </div>

          <div className="album-contributors-content">
            {loading && (
              <div className="loading-spinner">
                <div>Loading contributors...</div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <div>Error: {error}</div>
              </div>
            )}

            {!loading && !error && contributors && (
              <>
                {/* Overall Release Contributors */}
                {contributors.overallContributors && contributors.overallContributors.length > 0 && (
                  <div className="contributors-section">
                    <h3 className="contributors-section-title">Overall Release Contributors</h3>
                    <div className="contributors-list">
                      {contributors.overallContributors.map((contributor, index) => (
                        <div key={index} className="contributor-item">
                          <div className="contributor-name">{contributor.name}</div>
                          <div className="contributor-role">{contributor.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Track Contributors */}
                {contributors.trackContributors && 
                 contributors.trackContributors.filter(track => track.contributors && track.contributors.length > 0).length > 0 && (
                  <div className="contributors-section">
                    <h3 className="contributors-section-title">Track Contributors</h3>
                    {contributors.trackContributors
                      .filter(track => track.contributors && track.contributors.length > 0)
                      .map((track, index) => (
                        <div key={index} className="track-contributors">
                          <div className="track-title">
                            {track.position}. {track.title}
                          </div>
                          <div className="track-details">
                            {track.duration && `Duration: ${track.duration}`}
                          </div>
                          <div className="track-contributors-list">
                            {track.contributors.map((contributor, cIndex) => (
                              <div key={cIndex} className="track-contributor">
                                <div className="contributor-name">{contributor.name}</div>
                                <div className="contributor-role">{contributor.role}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Labels and Companies */}
                {(contributors.labels?.length > 0 || contributors.companies?.length > 0) && (
                  <div className="contributors-section">
                    <h3 className="contributors-section-title">Labels & Companies</h3>
                    <div className="labels-companies">
                      {contributors.labels && contributors.labels.length > 0 && (
                        <div>
                          <h4 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Labels</h4>
                          {contributors.labels.map((label, index) => (
                            <div key={index} className="label-company-item">
                              <div className="label-company-name">{label.name}</div>
                              {label.catalogNumber && label.catalogNumber !== 'none' && (
                                <div className="label-company-detail">Catalog: {label.catalogNumber}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {contributors.companies && contributors.companies.length > 0 && (
                        <div>
                          <h4 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Companies</h4>
                          {contributors.companies.map((company, index) => (
                            <div key={index} className="label-company-item">
                              <div className="label-company-name">{company.name}</div>
                              {company.role && (
                                <div className="label-company-detail">Role: {company.role}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No contributors message */}
                {(!contributors.overallContributors || contributors.overallContributors.length === 0) &&
                 (!contributors.trackContributors || contributors.trackContributors.length === 0) && (
                  <div className="no-contributors">
                    No contributor information available for this album.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
