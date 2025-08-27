'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleTempToken = async () => {
      const tempToken = searchParams.get('tempToken');
      
      console.log('Landing page loaded, checking for tempToken:', tempToken);
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      
      if (tempToken) {
        try {
          console.log('Found temporary token, exchanging for access token...');
          
          // Exchange temporary token for actual tokens
          const response = await fetch(`http://127.0.0.1:8000/exchange-token/${tempToken}`);
          if (response.ok) {
            const data = await response.json();
            
            // Store the tokens
            localStorage.setItem('spotify_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
            
            console.log('Successfully exchanged temporary token for access token');
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to dashboard
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
          } else {
            console.error('Failed to exchange temporary token');
          }
        } catch (error) {
          console.error('Error exchanging temporary token:', error);
        }
      } else {
        console.log('No tempToken found in URL');
      }
    };

    handleTempToken();
  }, [searchParams, router]);

    return (
    <div className={styles.landingContainer}>
      <div className={styles.landingCard}>
        <h1 className={styles.landingTitle}>
          Can't wait for Spotify Wrapped?
        </h1>
        <p className={styles.landingSubtitle}>
            Analyze your recent songs and your playlist and get your
          <span className={styles.landingHighlight}> custom wrapped for free!</span>
          </p>
          <button
          onClick={() => {
            // Force OAuth to open in the same window for consistent behavior across devices
            const loginUrl = 'http://127.0.0.1:8000/login';
            
            // On desktop, we need to ensure the OAuth flow opens in the same window
            // This prevents popup blocking and ensures consistent behavior
            if (typeof window !== 'undefined') {
              // Store current page state to return to if needed
              sessionStorage.setItem('oauth_redirect_origin', window.location.origin);
              
              // Navigate to login in the same window
              window.location.href = loginUrl;
            }
          }}
          className={styles.spotifyLoginButton}
        >
          <img
            src="/spotify-logo.svg"
            alt="Spotify Logo"
            className={styles.spotifyLogo}
          />
          Login with Spotify
        </button>
        </div>
      </div>
  );
}