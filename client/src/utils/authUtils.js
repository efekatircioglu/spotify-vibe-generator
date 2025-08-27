// Utility functions for handling authentication and token expiration

// Check if token is expired
export const isTokenExpired = () => {
  try {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('spotify_token');
    if (!token) return true;

    // Check if token has expired (you can add more sophisticated checks here)
    // For now, we'll rely on the backend to tell us if the token is expired

    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Check authentication status with backend
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/me');
    if (!response.ok) {
      // Token is expired or invalid
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Attempt to refresh the token
export const refreshToken = async () => {
  try {
    // Get the refresh token from localStorage
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }
    
    // First, try to refresh the token by calling the auth endpoint
    const response = await fetch('http://127.0.0.1:8000/me', {
      method: 'POST', // Use POST to indicate refresh attempt
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        refresh: true,
        refresh_token: refreshToken 
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      // If we get a new token, store it
      if (data.token) {
        localStorage.setItem('spotify_token', data.token);
        console.log('Token refreshed successfully via API');
        
        // Dispatch event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tokenRefreshed'));
        }
        
        return true;
      }
    }
    
    // If the refresh endpoint doesn't work, try a different approach
    // Some backends might refresh tokens automatically on the /me endpoint
    console.log('API refresh failed, trying alternative approach');
    
    // Try to get a fresh token by calling the /me endpoint
    const meResponse = await fetch('http://127.0.0.1:8000/me');
    if (meResponse.ok) {
      console.log('Token appears to be valid now, refresh successful');
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tokenRefreshed'));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Logout user and redirect to login
export const logoutUser = () => {
  try {
    // Clear any stored tokens/data
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('last50songs_playlist_url');
    localStorage.removeItem('last4weeks_playlist_url');
    localStorage.removeItem('last6months_playlist_url');
    localStorage.removeItem('last12months_playlist_url');

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
