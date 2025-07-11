import React from 'react';
import styles from '../app/page.module.css';
import { useRouter } from 'next/navigation';

export default function UserProfile({ user, onLogout, children, clickableTitle = false, showSubtitle = true }) {
  const router = useRouter();
  if (!user) return null;
  return (
    <div className={styles.profileContainer}>
      <button
        onClick={onLogout}
        className={styles.logoutButton}
      >
        Log out
      </button>
      <h2 className={styles.profileTitle}>
        {clickableTitle ? (
          <span
            className={styles.profileButtonTitle + ' ' + styles.hoverUnderline}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/username')}
          >
            Your Profile
          </span>
        ) : (
          <span className={styles.hoverUnderline}>Your Profile</span>
        )}
      </h2>
      {user.images?.[0]?.url && (
        <img
          src={user.images[0].url}
          alt="Spotify Profile"
          width={120}
          height={120}
          className={styles.profileLogo}
        />
      )}
      <div className={styles.prettyName}>
        <span className={styles.hoverUnderline} style={{ color: '#1db954' }}>{user.display_name}</span>
      </div>
      {showSubtitle && (
        <div className={styles.vibeSubtitle}>
          <span className={styles.hoverUnderline}>Let's create a vibe!</span>
        </div>
      )}
      {children}
    </div>
  );
} 