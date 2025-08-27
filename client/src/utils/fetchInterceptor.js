// Global fetch interceptor to handle authentication errors

// Only run on client side
if (typeof window !== 'undefined') {
  // Store the original fetch function
  const originalFetch = window.fetch;

  // Intercept all fetch calls
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // Check if response is 401 (Unauthorized)
      if (response.status === 401) {
        console.log('Received 401 response, token expired');

        // Check if this is a manual logout (no token in localStorage)
        const hasToken = localStorage.getItem('spotify_token');
        const hasLoggedOut = sessionStorage.getItem('userLoggedOut');
        
        if (!hasToken || hasLoggedOut) {
          // Manual logout or user just logged out - redirect to login
          console.log('Manual logout detected or user logged out, redirecting to login');
          
          // Clear logout flag if it exists
          if (hasLoggedOut) {
            sessionStorage.removeItem('userLoggedOut');
          }
          
          window.location.href = 'http://127.0.0.1:8000/login';
          return response;
        }

        // Session expired - try to refresh token
        try {
          console.log('Attempting to refresh token...');
          const refreshResponse = await originalFetch('http://127.0.0.1:8000/me', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: true }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.token) {
              // Token refreshed successfully, update localStorage
              localStorage.setItem('spotify_token', refreshData.token);
              console.log('Token refreshed successfully, retrying original request');
              
              // Retry the original request with new token
              const retryResponse = await originalFetch(...args);
              return retryResponse;
            }
          }
          
          // If refresh failed, try alternative approach
          console.log('API refresh failed, trying alternative approach');
          const meResponse = await originalFetch('http://127.0.0.1:8000/me');
          if (meResponse.ok) {
            console.log('Token appears valid now, retrying original request');
            const retryResponse = await originalFetch(...args);
            return retryResponse;
          }
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        // If refresh failed, clear local storage and redirect
        console.log('Token refresh failed, redirecting to login');
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('last50songs_playlist_url');
        localStorage.removeItem('last4weeks_playlist_url');
        localStorage.removeItem('last6months_playlist_url');
        localStorage.removeItem('last12months_playlist_url');

        // Redirect to login
        window.location.href = 'http://127.0.0.1:8000/login';
        return response;
      }

      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  console.log('Fetch interceptor setup complete');
}

// Export for potential use in other files
export const setupFetchInterceptor = () => {
  // This function can be called manually if needed
  if (typeof window !== 'undefined') {
    console.log('Fetch interceptor already setup');
  }
};
