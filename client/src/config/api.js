// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'https://api.vibegenerator.me';
  }
  
  // Check if we're on localhost (development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  
  // Production cloud server
  return 'https://api.vibegenerator.me';
};

// Login URL - always use cloud server for login to avoid HTTPS issues
const LOGIN_URL = 'https://api.vibegenerator.me/login';

export { getApiBaseUrl, LOGIN_URL };
