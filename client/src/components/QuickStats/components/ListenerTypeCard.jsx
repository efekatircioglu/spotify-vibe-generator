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
          {listenerType.type === 'Superfan' ? '🎵' :
           listenerType.type === 'Artist Explorer' ? '🔍' : '⚖️'}
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
            margin: '0 0 8px 0'
          }}>
            {listenerType.type === 'Superfan' ? '🎵 Superfan' :
             listenerType.type === 'Artist Explorer' ? '🔍 Artist Explorer' : '⚖️ Balanced Listener'}
          </h4>
          <p style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            {listenerType.confidence}% Confidence
          </p>
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
            <h5 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 4px 0'
            }}>
              {Math.round(listenerType.artistDiversity * 100)}%
            </h5>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0'
            }}>
              Artist Diversity
            </p>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <h5 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 4px 0'
            }}>
              {listenerType.allArtists.length}
            </h5>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0'
            }}>
              Unique Artists
            </p>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <h5 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 4px 0'
            }}>
              {listenerType.topArtist ? Math.round((listenerType.topArtist.count / (listenerType.superfanMetrics?.totalSongs || listenerType.explorerMetrics?.totalSongs || 1)) * 100) : 0}%
            </h5>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0'
            }}>
              Top Artist %
            </p>
          </div>
        </div>

        {/* Top Artists List */}
        {listenerType.allArtists.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h5 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Recent Artist Activity
            </h5>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {listenerType.allArtists.slice(0, 10).map((artist, index) => (
                <div key={artist.id} style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <p style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        margin: '0 0 2px 0'
                      }}>
                        {artist.name}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        margin: '0'
                      }}>
                        {artist.count} song{artist.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span style={{
                      background: index === 0 ? '#f59e0b' : '#3b82f6',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              const diversity = Math.round(listenerType.artistDiversity * 100);
              const uniqueArtists = listenerType.allArtists.length;
              
              if (type === 'Superfan') {
                return `You're a dedicated superfan! You focus deeply on specific artists, with ${diversity}% artist diversity. You prefer to explore the full catalog of artists you love rather than constantly discovering new ones.`;
              } else if (type === 'Artist Explorer') {
                return `You're an artist explorer! You love discovering new voices, with ${diversity}% artist diversity and ${uniqueArtists} unique artists in your recent tracks. You're always on the hunt for fresh musical discoveries.`;
              } else {
                return `You're a balanced listener! You mix deep dives into favorite artists with discovering new voices. You have ${diversity}% artist diversity, showing a healthy mix of both approaches.`;
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
