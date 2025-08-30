'use client';

import React, { useEffect, useState } from 'react';
import { setupAuthMonitoring, checkAuthStatus, refreshToken } from '../utils/authUtils';
import { setupCacheMonitoring, initializeAllCaches } from '../utils/cacheManager';

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false to avoid loading screen
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  // Set browser flag on mount
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Function to re-initialize authentication
  const reinitializeAuth = async () => {
    try {
      setIsLoading(true);
      setIsSessionExpired(false);
      
      // Check auth status with backend (session-based)
      if (!isBrowser) return;
      
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        // Setup periodic auth monitoring
        setupAuthMonitoring();
      } else {
        // Not authenticated
        setIsSessionExpired(true);
      }
    } catch (error) {
      console.error('Error reinitializing auth:', error);
      setIsAuthenticated(false);
      setIsSessionExpired(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cleanupAuthMonitoring;

    const initializeAuth = async () => {
      try {
        // Only run authentication logic in browser
        if (!isBrowser) return;
        
        // Check if user is logging out (only in browser)
        if (isBrowser) {
          // Check if this is a fresh page load or logout
          const hasLoggedOut = sessionStorage.getItem('userLoggedOut');
          
          if (hasLoggedOut) {
            // User just logged out - redirect to root page
            sessionStorage.removeItem('userLoggedOut'); // Clear the logout flag
            if (typeof window !== 'undefined') {
              window.location.href = '/';
              return;
            }
          }
        }

        // Check initial auth status using session
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          // Setup periodic auth monitoring
          cleanupAuthMonitoring = setupAuthMonitoring();
          
          // Setup cache monitoring
          const cleanupCacheMonitoring = setupCacheMonitoring();
          
          // Check if caches exist, if not initialize them
          const { doCachesExist } = await import('../utils/cacheManager');
          
          if (!doCachesExist()) {
            console.log('[AuthWrapper] Caches don\'t exist, initializing...');
            const { initializeAllCaches } = await import('../utils/cacheManager');
            await initializeAllCaches();
          } else {
            console.log('[AuthWrapper] Caches already exist, skipping initialization');
          }
          
          // Store cleanup function for later
          if (cleanupAuthMonitoring) {
            const originalCleanup = cleanupAuthMonitoring;
            cleanupAuthMonitoring = () => {
              originalCleanup();
              cleanupCacheMonitoring();
            };
          }
        } else {
          // Session expired, not manually logged out
          setIsSessionExpired(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setIsSessionExpired(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize auth when we're in the browser
    if (isBrowser) {
      initializeAuth();
    }

    // Cleanup function
    return () => {
      if (cleanupAuthMonitoring) {
        cleanupAuthMonitoring();
      }
    };
  }, [isBrowser]);

  // Listen for logout events
  useEffect(() => {
    // Only set up event listeners in browser
    if (!isBrowser) return;
    
    const handleStorageChange = (e) => {
      if (e.key === 'spotify_token' && e.newValue === null) {
        // Token was removed, user is logging out
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    const handleCustomLogout = () => {
      // Custom logout event from sidebar - manual logout
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    };

    const handleTokenRefreshed = () => {
      // Token was refreshed elsewhere, re-initialize auth
      console.log('Token refreshed event received, reinitializing auth');
      reinitializeAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleCustomLogout);
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    
    // Also check for direct localStorage changes
    const checkTokenRemoval = () => {
      if (isBrowser && localStorage.getItem('spotify_token') === null && isAuthenticated) {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    const interval = setInterval(checkTokenRemoval, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleCustomLogout);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      clearInterval(interval);
    };
  }, [isAuthenticated, isBrowser]);

  // Always render children while authentication happens in background
  // Only show authentication screens if absolutely necessary (like when redirecting to login)
  
  // Debug logging
  
  // Only show auth overlay if:
  // 1. Session is expired, OR
  // 2. We're definitely not authenticated AND have no token
  // Don't show if we have a token but auth check is still pending (isAuthenticated === null)
  if (isBrowser && (isSessionExpired || (isAuthenticated === false && !localStorage.getItem('spotify_token')))) {
    return (
      <>
        {/* Show the page content in background */}
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          {children}
        </div>
        
        {/* Minimal authentication overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(16, 17, 20, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#181818',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid #333',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: '#f3f3f3', 
              marginBottom: '16px',
              fontSize: '1.5rem'
            }}>
              {isSessionExpired ? 'Session Expired' : 'Authentication Required'}
            </h2>
            <p style={{ 
              color: '#b3b3b3', 
              marginBottom: '24px',
              fontSize: '0.9rem'
            }}>
              {isSessionExpired 
                ? 'Your session has expired. Please log in again to continue.'
                : 'Please log in to access this feature.'
              }
            </p>
            <button
              onClick={() => window.location.href = 'http://127.0.0.1:8000/login'}
              style={{
                background: '#1db954',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#1ed760';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1db954';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Login to Spotify
            </button>
          </div>
        </div>
      </>
    );
  }

  // Normal case: render children with background authentication
  return (
    <>
      {children}
      
      {/* Subtle loading indicator in top-right corner when checking auth */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(24, 24, 27, 0.9)',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: '#b3b3b3',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid #1db954',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Checking auth...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}
