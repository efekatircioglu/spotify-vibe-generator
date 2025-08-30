import React, { useState, useEffect } from 'react';

/**
 * TopDecadesCard Component
 * 
 * Displays the top decades with most songs from user's tracks
 * Shows decade label, year range, and song count
 * Features a slideshow of album images for each decade
 * 
 * BENEFITS:
 * ✅ Focused responsibility - only handles decades display
 * ✅ Reusable - can be used in other parts of the app
 * ✅ Testable - easy to test in isolation
 * ✅ Optimizable - can optimize its own rendering
 * ✅ Slideshow - cycles through album images every 4 seconds
 */
export default function TopDecadesCard({ decades }) {
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});

  // Initialize image indexes for each decade
  useEffect(() => {
    const initialIndexes = {};
    decades?.forEach(decade => {
      if (decade.albumImages && decade.albumImages.length > 0) {
        initialIndexes[decade.decade] = 0;
      }
    });
    setCurrentImageIndexes(initialIndexes);
  }, [decades?.map(d => d.decade).join(',')]); // Only re-initialize if decades change

  // Slideshow effect - cycle through images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndexes(prevIndexes => {
        const newIndexes = { ...prevIndexes };
        decades?.forEach(decade => {
          if (decade.albumImages && decade.albumImages.length > 1) {
            const currentIndex = newIndexes[decade.decade] || 0;
            const totalImages = decade.albumImages.length;
            const nextIndex = (currentIndex + 1) % totalImages;
            newIndexes[decade.decade] = nextIndex;
          }
        });
        return newIndexes;
      });
    }, 4000); // 4 seconds per image

    return () => clearInterval(interval);
  }, [decades?.map(d => d.decade).join(',')]); // Only restart if decades change

  if (!decades || decades.length === 0) {
    return (
      <div style={{
        color: '#b3b3b3',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic'
      }}>
        No decade data available
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
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: '700',
          fontSize: '1.2rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            Top Decades
          </h3>
          <p style={{
            color: '#b3b3b3',
            fontSize: '0.9rem',
            margin: '0'
          }}>
            Your favorite music eras
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {decades.map((decade, index) => {
          const currentImageIndex = currentImageIndexes[decade.decade] || 0;
          const currentImage = decade.albumImages && decade.albumImages[currentImageIndex];
          const hasMultipleImages = decade.albumImages && decade.albumImages.length > 1;
          

          
          return (
            <div key={decade.decade} style={{
              padding: '12px',
              borderRadius: '12px',
              border: currentImage?.url ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              {/* Background image layer */}
              {currentImage?.url && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${currentImage.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 0,
                  transition: 'background-image 0.3s ease-in-out'
                }} />
              )}
              
              {/* Content layer */}
              <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{
                background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#d97706',
                color: '#000',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                #{index + 1}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
                                            <div style={{
                width: '48px',
                height: '48px',
                background: currentImage?.url 
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'linear-gradient(135deg, #10b981, #34d399)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: '700',
                fontSize: '1rem',
                backdropFilter: currentImage?.url ? 'blur(10px)' : 'none',
                boxShadow: currentImage?.url ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'
              }}>
                {decade.decade}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: '0 0 6px 0',
                  textShadow: currentImage?.url ? '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)' : 'none'
                }}>
                  {decade.label}
                </h4>
                <p style={{
                  color: '#e5e7eb',
                  fontSize: '0.95rem',
                  margin: '0 0 6px 0',
                  fontWeight: '500',
                  textShadow: currentImage?.url ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)' : 'none'
                }}>
                  {decade.decade}-{decade.decade + 9}
                </p>
              </div>
            </div>
            
            {/* Slideshow indicator dots */}
            {hasMultipleImages && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                zIndex: 2
              }}>
                {decade.albumImages.map((_, imgIndex) => (
                  <div
                    key={imgIndex}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: imgIndex === currentImageIndex ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'background 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
              </div>
            </div>
        );
        })}
      </div>
    </div>
  );
}
