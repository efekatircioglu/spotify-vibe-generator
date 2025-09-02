// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'http://46.101.78.90:8000';
  }
  
  // Check if we're on localhost (development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  
  // Production cloud server
  return 'http://46.101.78.90:8000';
};

// Login URL - always use cloud server for login to avoid HTTPS issues
const LOGIN_URL = 'http://46.101.78.90:8000/login';

export { getApiBaseUrl, LOGIN_URL };
