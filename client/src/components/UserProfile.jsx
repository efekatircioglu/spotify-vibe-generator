import React, { useState, useRef, useEffect } from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';

export default function UserProfile({ user, onLogout, children, onFeedback }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 430);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  return (
    <div className={styles.profileContainer} style={{ 
      position: 'relative',
      minWidth: isMobile ? '200px' : undefined,
      maxWidth: isMobile ? '80%' : undefined,
      width: isMobile ? '100%' : undefined
    }}>
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