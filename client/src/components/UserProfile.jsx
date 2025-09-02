import React from 'react';
import styles from '../app/page.module.css';

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

export default function UserProfile({ user, onLogout, children }) {
  const isMobile = useIsMobile(600); // Use the same breakpoint as NewTrackTable

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
            <div style={{ 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              color: '#fff',
              fontFamily: 'inherit'
            }}>{user.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              aria-label="Log out"
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 6,
                transition: 'all 0.18s',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                if (onLogout) onLogout();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M16 12H8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M13 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: '0.7rem',
            lineHeight: 1.2,
          }}>
            {children}
          </div>
          <style jsx>{`
            /* --- Paragraph Styles (p) - Scoped to UserProfile only --- */
            .profileContainer p {
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
            <div style={{ 
              fontWeight: 700, 
              fontSize: '1.35rem', 
              color: '#fff',
              fontFamily: 'inherit'
            }}>{user.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              aria-label="Log out"
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 10,
                transition: 'all 0.18s',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                if (onLogout) onLogout();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M16 12H8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M13 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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