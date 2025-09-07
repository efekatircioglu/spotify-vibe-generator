// JWT Token Management Utility
import { LOGIN_URL } from '../config/api';

class JWTManager {
  constructor() {
    this.tokenKey = 'vibegenerator_jwt_token';
  }

  // Get JWT token from URL parameters or sessionStorage
  getToken() {
    // First, try to get token from URL parameters (after login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      // Store token in sessionStorage and clean URL
      this.setToken(urlToken);
      this.cleanUrl();
      return urlToken;
    }
    
    // If no URL token, get from sessionStorage
    return sessionStorage.getItem(this.tokenKey);
  }

  // Store JWT token in sessionStorage
  setToken(token) {
    if (token) {
      sessionStorage.setItem(this.tokenKey, token);
      console.log('🔐 JWT token stored in sessionStorage');
    }
  }

  // Remove JWT token from sessionStorage
  removeToken() {
    sessionStorage.removeItem(this.tokenKey);
    console.log('🔐 JWT token removed from sessionStorage');
  }

  // Check if token exists and is not expired
  isTokenValid() {
    const token = this.getToken();
    console.log('🔐 [JWT Validation] Checking token validity...');
    console.log('🔐 [JWT Validation] Token exists:', !!token);
    
    if (!token) {
      console.log('🔐 [JWT Validation] No token found');
      return false;
    }

    // Don't do client-side validation - let server handle it
    // Just check if token exists and has basic structure
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('🔐 [JWT Validation] Invalid token structure');
        return false;
      }
      
      console.log('🔐 [JWT Validation] Token structure is valid');
      return true;
    } catch (error) {
      console.error('🔐 [JWT Validation] Error checking token structure:', error);
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
    console.log('🔐 [JWT Request] Making authenticated request to:', url);
    
    const token = this.getToken();
    console.log('🔐 [JWT Request] Token exists:', !!token);
    
    // Don't validate token client-side - let server handle validation
    // Just send whatever token we have (or null if none)
    const authHeader = token ? `Bearer ${token}` : null;
    console.log('🔐 [JWT Request] Auth header exists:', !!authHeader);

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
        ...options.headers
      }
    };

    try {
      console.log('🔐 [JWT Request] Sending request with auth header');
      const response = await fetch(url, requestOptions);
      console.log('🔐 [JWT Request] Response status:', response.status);
      
      // Check for new JWT token in response headers (when Spotify token is refreshed)
      const newJwtToken = response.headers.get('X-New-JWT-Token');
      if (newJwtToken) {
        console.log('🔐 Received new JWT token, updating sessionStorage');
        this.setToken(newJwtToken);
      }
      
      // If unauthorized, handle specific error codes
      if (response.status === 401) {
        console.log('🔐 [JWT Request] Unauthorized response (401), removing token');
        
        try {
          const errorData = await response.json();
          console.log('🔐 [JWT Request] Error details:', errorData);
          
          // Handle specific error codes
          if (errorData.code === 'TOKEN_EXPIRED') {
            console.log('🔐 [JWT Request] Token expired, redirecting to login');
          } else if (errorData.code === 'INVALID_TOKEN') {
            console.log('🔐 [JWT Request] Invalid token, redirecting to login');
          } else if (errorData.code === 'SESSION_NOT_FOUND') {
            console.log('🔐 [JWT Request] Session not found, redirecting to login');
          } else if (errorData.code === 'NO_TOKEN') {
            console.log('🔐 [JWT Request] No token provided, redirecting to login');
          } else {
            console.log('🔐 [JWT Request] Authentication failed, redirecting to login');
          }
        } catch (parseError) {
          console.log('🔐 [JWT Request] Could not parse error response');
        }
        
        this.removeToken();
        window.location.href = LOGIN_URL;
        return;
      }
      
      return response;
    } catch (error) {
      console.error('🔐 [JWT Request] API request failed:', error);
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
