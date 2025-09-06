// JWT Token Management Utility
class JWTManager {
  constructor() {
    this.tokenKey = 'vibegenerator_jwt_token';
  }

  // Get JWT token from URL parameters or localStorage
  getToken() {
    // First, try to get token from URL parameters (after login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      // Store token in localStorage and clean URL
      this.setToken(urlToken);
      this.cleanUrl();
      return urlToken;
    }
    
    // If no URL token, get from localStorage
    return localStorage.getItem(this.tokenKey);
  }

  // Store JWT token in localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      console.log('🔐 JWT token stored in localStorage');
    }
  }

  // Remove JWT token from localStorage
  removeToken() {
    localStorage.removeItem(this.tokenKey);
    console.log('🔐 JWT token removed from localStorage');
  }

  // Check if token exists and is not expired
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload (without verification - just for expiration check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('🔐 JWT token expired');
        this.removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('🔐 Error validating JWT token:', error);
      this.removeToken();
      return false;
    }
  }

  // Clean URL parameters after extracting token
  cleanUrl() {
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }

  // Get authorization header for API requests
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    const authHeader = this.getAuthHeader();
    
    if (!authHeader) {
      throw new Error('No authentication token available');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // Check for new JWT token in response headers (when Spotify token is refreshed)
      const newJwtToken = response.headers.get('X-New-JWT-Token');
      if (newJwtToken) {
        console.log('🔐 Received new JWT token, updating localStorage');
        this.setToken(newJwtToken);
      }
      
      // If unauthorized, remove token and redirect to login
      if (response.status === 401) {
        console.log('🔐 Unauthorized request, removing token');
        this.removeToken();
        window.location.href = '/login';
        return;
      }
      
      return response;
    } catch (error) {
      console.error('🔐 API request failed:', error);
      throw error;
    }
  }

  // Get user info from token (without verification)
  getUserInfo() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        spotifyId: payload.spotifyId,
        displayName: payload.displayName,
        email: payload.email
      };
    } catch (error) {
      console.error('🔐 Error parsing JWT payload:', error);
      return null;
    }
  }
}

// Create singleton instance
const jwtManager = new JWTManager();

export default jwtManager;
