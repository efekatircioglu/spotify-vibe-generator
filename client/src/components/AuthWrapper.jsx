'use client';

import React, { useEffect, useState } from 'react';
import { setupAuthMonitoring, checkAuthStatus, refreshToken } from '../utils/authUtils';

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Function to re-initialize authentication
  const reinitializeAuth = async () => {
    try {
      setIsLoading(true);
      setIsSessionExpired(false);
      
      // Check if we have a token
      const hasToken = localStorage.getItem('spotify_token');
      if (!hasToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Check auth status with backend
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        // Setup periodic auth monitoring
        setupAuthMonitoring();
      } else {
        // Still not authenticated
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
        // Check if we have a temporary token from Spotify callback (on any page)
        const urlParams = new URLSearchParams(window.location.search);
        const tempToken = urlParams.get('tempToken');
        
        if (tempToken) {
          console.log('Found temporary token, exchanging for access token...');
          try {
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
              
              // Clean up the URL by removing the tempToken parameter
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.delete('tempToken');
              window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
              
              // Check auth status with new token
              const authStatus = await checkAuthStatus();
              setIsAuthenticated(authStatus);
              
              if (authStatus) {
                // Setup periodic auth monitoring
                cleanupAuthMonitoring = setupAuthMonitoring();
              }
              
              setIsLoading(false);
              return;
            } else {
              console.error('Failed to exchange temporary token');
            }
          } catch (error) {
            console.error('Error exchanging temporary token:', error);
          }
        }

        // Check if user is logging out
        if (localStorage.getItem('spotify_token') === null) {
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
          
          // No token and no logout flag - session expired
          setIsAuthenticated(false);
          setIsSessionExpired(true);
          setIsLoading(false);
          return;
        }

        // Check initial auth status
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          // Setup periodic auth monitoring
          cleanupAuthMonitoring = setupAuthMonitoring();
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

    initializeAuth();

    // Cleanup function
    return () => {
      if (cleanupAuthMonitoring) {
        cleanupAuthMonitoring();
      }
    };
  }, []);

  // Listen for logout events
  useEffect(() => {
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
      if (localStorage.getItem('spotify_token') === null && isAuthenticated) {
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
  }, [isAuthenticated]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#101114',
        color: '#f3f3f3',
        fontSize: '1.2rem'
      }}>
        Checking authentication...
      </div>
    );
  }

  // Show initial visit page (black background, "get your wrapped")
  if (isSessionExpired) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#101114',
        color: '#f3f3f3',
        fontSize: '1.2rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          padding: '60px',
          background: '#181818',
          borderRadius: '20px',
          border: '1px solid #333',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
        }}>
          {/* Exclamation Triangle Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '20px',
            color: '#fff',
            fontWeight: '600'
          }}>
            Session Expired
          </h1>
                    <p style={{
            fontSize: '1.1rem',
            marginBottom: '40px',
            color: '#b3b3b3',
            lineHeight: '1.5'
          }}>
            Your session has expired. Please log in again to continue.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => window.location.href = 'http://127.0.0.1:8000/login'}
              style={{
                padding: '20px 40px',
                background: '#1db954',
                color: '#000',
                border: 'none',
                borderRadius: '30px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 6px 20px rgba(29, 185, 84, 0.3)',
                minWidth: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1ed760';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(29, 185, 84, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1db954';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.3)';
              }}
            >
              {/* Sync Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21V15h6"></path>
                <path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v6h-6"></path>
              </svg>
              Log in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#101114',
        color: '#f3f3f3',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ marginBottom: '20px' }}>Session Expired</h1>
        <p style={{ marginBottom: '30px', color: '#b3b3b3' }}>
          Your session has expired. Please log in again to continue.
        </p>
        <button
          onClick={() => window.location.href = 'http://127.0.0.1:8000/login'}
          style={{
            background: '#1db954',
            color: '#000',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 32px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1ed760';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1db954';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Login Again
        </button>
      </div>
    );
  }

  // If authenticated, render the children
  if (isAuthenticated) {
    return children;
  }
}
