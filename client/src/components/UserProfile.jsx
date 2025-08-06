import React, { useState, useRef, useEffect } from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';

// Same useIsMobile hook as in NewTrackTable
function useIsMobile(breakpoint = 680) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

export default function UserProfile({ user, onLogout, children, onFeedback }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isMobile = useIsMobile(680); // Use the same breakpoint as NewTrackTable

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!user) return null;

  // Mobile layout - full width container
  if (isMobile) {
    return (
      <div style={{
        background: '#181818',
        borderRadius: 18,
        padding: '6vw 6vw 2vw 2vw',
        margin: '3vw auto',
        maxWidth: '100vw',
        width: '100%',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        minHeight: 0,
        fontSize: '0.7rem', // 30% smaller base font size for mobile
        border: '2px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16, // Reduced margin
          position: 'relative' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.images?.[0]?.url && (
              <img
                src={user.images[0].url}
                alt="Spotify Profile"
                width={54} // 30% smaller profile image
                height={54}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#fff' }}>{user.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative' }}>
              <button
                aria-label="More options"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12, // 30% smaller dropdown button
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 6,
                  transition: 'background 0.18s',
                  outline: 'none',
                }}
                onClick={() => setDropdownOpen(o => !o)}
              >
                &#8230;
              </button>
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 22,
                    right: 0,
                    background: '#232323',
                    borderRadius: 8,
                    boxShadow: '0 4px 24px #0006',
                    minWidth: 100, // Smaller dropdown width
                    zIndex: 100,
                    padding: '3px 0',
                    border: '1.5px solid #1db954',
                  }}
                >
                  <button
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.65rem', // 30% smaller dropdown text
                      padding: '3px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onFeedback) onFeedback();
                    }}
                  >
                    Feedback
                  </button>
                  <div style={{ height: 1, background: '#333', margin: '1px 0' }} />
                  <button
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#ff3b3b',
                      fontWeight: 700,
                      fontSize: '0.65rem', // 30% smaller dropdown text
                      padding: '3px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}> {/* Reduced gap */}
          <div style={{
            fontSize: '0.7rem', // Force smaller font size for all children
            lineHeight: 1.2,
          }}>
            {children}
          </div>
          {/* Mobile-specific CSS to override existing styles */}
          <style jsx>{`
            @media (max-width: 680px) {
              h2 {
                font-size: 1.2rem !important;
                font-weight: 800 !important;
                margin-bottom: 8px !important;
              }
              div {
                font-size: 0.7rem !important;
                line-height: 1.2 !important;
              }
              button {
                font-size: 0.8rem !important;
                padding: 8px 16px !important;
              }
              .reportTitle {
                font-size: 1.2rem !important;
                font-weight: 800 !important;
                margin-bottom: 8px !important;
              }
              .reportSubtitle {
                font-size: 0.7rem !important;
                margin-bottom: 12px !important;
              }
              .analyzeButton {
                font-size: 0.8rem !important;
                padding: 8px 16px !important;
                min-height: 40px !important;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Desktop layout - original styling
  return (
    <div className={styles.profileContainer}>
      <div style={{ background: '#181818', width: '100%', borderRadius: 14, padding: 0, minHeight: 440, position: 'relative' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user.images?.[0]?.url && (
              <img
                src={user.images[0].url}
                alt="Spotify Profile"
                width={88}
                height={88}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.35rem', color: '#fff' }}>{user.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button
                aria-label="More options"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: '0 6px',
                  borderRadius: 8,
                  transition: 'background 0.18s',
                  outline: 'none',
                }}
                onClick={() => setDropdownOpen(o => !o)}
              >
                &#8230;
              </button>
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 38,
                    right: 0,
                    background: '#232323',
                    borderRadius: 10,
                    boxShadow: '0 4px 24px #0006',
                    minWidth: 180,
                    zIndex: 100,
                    padding: '8px 0',
                    border: '1.5px solid #1db954',
                  }}
                >
                  <button
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '8px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onFeedback) onFeedback();
                    }}
                  >
                    Feedback
                  </button>
                  <div style={{ height: 1, background: '#333', margin: '4px 0' }} />
                  <button
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#ff3b3b',
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '8px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
} 