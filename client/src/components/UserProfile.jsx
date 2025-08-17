import React, { useState, useRef, useEffect } from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';

// Same useIsMobile hook as in NewTrackTable
function useIsMobile(breakpoint = 600) {
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
  const isMobile = useIsMobile(600); // Use the same breakpoint as NewTrackTable

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
        padding: '6vw 6vw 4vw 6vw',
        margin: '3vw auto',
        maxWidth: '100vw',
        width: '100%',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        minHeight: 0,
        fontSize: '0.7rem',
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
          marginBottom: 16,
          position: 'relative' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.images?.[0]?.url && (
              <img
                src={user.images[0].url}
                alt="Spotify Profile"
                // MODIFIED: Increased image size
                width={80}
                height={80}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{user.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative' }}>
              <button
                aria-label="More options"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
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
                    minWidth: 100,
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
                      fontSize: '0.65rem',
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
                      fontSize: '0.65rem',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: '0.7rem',
            lineHeight: 1.2,
          }}>
            {children}
          </div>
          <style jsx global>{`
  

  /* --- Paragraph Styles (p) --- */
  p {
    color: #d1d5db !important;
    line-height: 1.625 !important;
    margin-bottom: 2rem !important;
    text-align: left !important;
    font-size: 1rem !important; /* A readable base size for paragraphs */
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
        <div style={{
  padding: '1.5rem',
  borderRadius: '16px',
}}>
          {children}
        </div>
      </div>
    </div>
  );
}