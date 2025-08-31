import React from 'react';

/**
 * ListenerTypeCard Component
 * 
 * Displays listener type analysis showing Superfan vs Artist Explorer classification
 * Shows metrics and analysis of user's listening style
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles listener type display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 */
export default function ListenerTypeCard({ listenerType }) {
  if (!listenerType) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No listener type data available
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: listenerType.type === 'Superfan' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                     listenerType.type === 'Artist Explorer' ? 'linear-gradient(135deg, #10b981, #059669)' :
                     'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          {listenerType.type === 'Superfan' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          ) : listenerType.type === 'Artist Explorer' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          )}
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Listener Type Analysis
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Your music discovery style
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Listener Type Badge */}
        <div style={{
          padding: '20px',
          background: listenerType.type === 'Superfan' ? 'rgba(239, 68, 68, 0.1)' :
                     listenerType.type === 'Artist Explorer' ? 'rgba(16, 185, 129, 0.1)' :
                     'rgba(139, 92, 246, 0.1)',
          borderRadius: '12px',
          border: listenerType.type === 'Superfan' ? '1px solid rgba(239, 68, 68, 0.2)' :
                  listenerType.type === 'Artist Explorer' ? '1px solid rgba(16, 185, 129, 0.2)' :
                  '1px solid rgba(139, 92, 246, 0.2)',
          textAlign: 'center'
        }}>
          <h4 style={{
            color: listenerType.type === 'Superfan' ? '#ef4444' :
                   listenerType.type === 'Artist Explorer' ? '#10b981' : '#8b5cf6',
            fontSize: '1.3rem',
            fontWeight: '700',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {listenerType.type === 'Superfan' ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                Superfan
              </>
            ) : listenerType.type === 'Artist Explorer' ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Artist Explorer
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Balanced Listener
              </>
            )}
          </h4>

          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Based on your recent listening patterns
          </p>
        </div>

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h5 style={{
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0'
              }}>
                {listenerType.newArtistCount || 0}
              </h5>
            </div>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0'
            }}>
              New Artists
            </p>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              <h5 style={{
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0'
              }}>
                {listenerType.knownArtistCount || 0}
              </h5>
            </div>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0'
            }}>
              Known Artists
            </p>
          </div>


        </div>



        {/* Summary */}
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: '8px'
        }}>
          <h5 style={{
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            Listening Style Analysis
          </h5>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0',
            lineHeight: '1.4'
          }}>
            {(() => {
              const type = listenerType.type;
              const newArtists = listenerType.newArtistCount || 0;
              const knownArtists = listenerType.knownArtistCount || 0;
              const totalArtists = listenerType.totalArtists || 0;
              
              if (type === 'Superfan') {
                return `You're a dedicated superfan! You're mostly re-listening to artists you already know and love. Out of ${totalArtists} artists in your recent tracks, only ${newArtists} are new discoveries. You prefer to explore the full catalog of artists you love rather than constantly discovering new ones.`;
              } else if (type === 'Artist Explorer') {
                return `You're an artist explorer! You love discovering new voices and constantly finding fresh artists. Out of ${totalArtists} artists in your recent tracks, ${newArtists} are new discoveries! You're always on the hunt for fresh musical discoveries.`;
              } else {
                return `You're a balanced listener! You mix re-listening to favorite artists with discovering new voices. Out of ${totalArtists} artists in your recent tracks, ${newArtists} are new discoveries, showing a healthy mix of both approaches.`;
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
