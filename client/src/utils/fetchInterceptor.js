// Global fetch interceptor to handle authentication errors
import { LOGIN_URL } from '../config/api';

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
        console.log('Received 401 response, session expired');

        // Check if this is a manual logout
        const hasLoggedOut = sessionStorage.getItem('userLoggedOut');
        
        if (hasLoggedOut) {
          // Manual logout or user just logged out - redirect to login
          console.log('Manual logout detected, redirecting to login');
          
          // Clear logout flag if it exists
          sessionStorage.removeItem('userLoggedOut');
          
          window.location.href = LOGIN_URL;
          return response;
        }

        // Session expired - redirect to login
        console.log('Session expired, redirecting to login');
        window.location.href = LOGIN_URL;
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
