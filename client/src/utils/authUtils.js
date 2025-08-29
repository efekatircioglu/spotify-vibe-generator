// Utility functions for handling authentication and token expiration

// Check if token is expired
export const isTokenExpired = () => {
  // We no longer manage tokens client-side
  // Server handles all token management
  return false;
};

// Check authentication status with backend
export const checkAuthStatus = async () => {
  try {
    // Check auth status with backend using session
    const response = await fetch('http://127.0.0.1:8000/me', {
      credentials: 'include' // Include cookies for session
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.authenticated || false;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Attempt to refresh the token
export const refreshToken = async () => {
  try {
    // Server handles token refresh automatically
    // Just check if we're still authenticated
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
      console.log('Session still valid');
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tokenRefreshed'));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
};

// Logout user and redirect to login
export const logoutUser = () => {
  try {
    // Clear any stored data (but not tokens - we don't store them anymore)
    localStorage.removeItem('last50songs_playlist_url');
    localStorage.removeItem('last4weeks_playlist_url');
    localStorage.removeItem('last6months_playlist_url');
    localStorage.removeItem('last12months_playlist_url');

    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    // Redirect to login page
    window.location.href = 'http://127.0.0.1:8000/login';
  } catch (error) {
    console.error('Error during logout:', error);
    // Fallback: just redirect
    window.location.href = 'http://127.0.0.1:8000/login';
  }
};

// Setup periodic auth checks
export const setupAuthMonitoring = () => {
  // Check auth every 5 minutes
  const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;

  const checkAuth = async () => {
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      console.log('Token expired, logging out user');
      logoutUser();
    }
  };

  // Initial check
  checkAuth();

  // Set up periodic checks
  const intervalId = setInterval(checkAuth, AUTH_CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
