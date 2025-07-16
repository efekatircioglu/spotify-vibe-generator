import React from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';

export default function UserProfile({ user, onLogout, children }) {
  const router = useRouter();
  if (!user) return null;
  return (
    <div className={styles.profileContainer}>
      <div style={{ background: '#181818', width: '100%', borderRadius: 14, padding: 0, minHeight: 440 }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
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
          <button
            onClick={onLogout}
            className={styles.logoutButton}
          >
            Log out
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
} 