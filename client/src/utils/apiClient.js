import { getApiBaseUrl } from '../config/api';
import jwtManager from './jwtManager';

// API client utility for making requests to the backend
export const apiClient = {
  // Generic fetch method
  async fetch(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    // Get JWT token for authentication
    const authHeader = jwtManager.getAuthHeader();
    
    const defaultOptions = {
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }), // Add JWT token if available
        ...options.headers,
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.log('🔐 Unauthorized request, redirecting to login');
      jwtManager.removeToken();
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  },

  // GET request
  async get(endpoint, options = {}) {
    return this.fetch(endpoint, {
      method: 'GET',
      ...options,
    });
  },

  // POST request
  async post(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },

  // JSON response helper
  async getJson(endpoint, options = {}) {
    const response = await this.get(endpoint, options);
    return response.json();
  },

  async postJson(endpoint, data, options = {}) {
    const response = await this.post(endpoint, data, options);
    return response.json();
  },

  async putJson(endpoint, data, options = {}) {
    const response = await this.put(endpoint, data, options);
    return response.json();
  },

  async deleteJson(endpoint, options = {}) {
    const response = await this.delete(endpoint, options);
    return response.json();
  },
};

// Common API endpoints
export const API_ENDPOINTS = {
  ME: '/me',
  LOGIN: '/login',
  LOGOUT: '/logout',
  RECENT_TRACKS: '/recent-tracks',
  TOP_TRACKS: '/top-tracks',
  TOP_ARTISTS: '/top-artists',
  LAST_4_WEEKS: '/last-4-weeks',
  LAST_6_MONTHS: '/last-6-months',
  LAST_12_MONTHS: '/last-12-months',
  PLAYLISTS: '/playlists',
  PLAYLISTS_WITH_DURATION: '/playlists-with-duration',
  CREATE_PLAYLIST: '/create-playlist',
  ANALYZE_RECENTS: '/analyze-recents',
  ARTIST_SEARCH: '/spotify/artist-search',
  ARTIST_DETAILS: '/spotify/artist-details',
  ARTIST_ALBUMS: '/artist-albums',
  ALBUM_TRACKS: '/album-tracks',
  ARTIST_COLLABORATORS: '/artist-collaborators',
  FOLLOW_ARTIST: '/me/following/artist',
  FOLLOWED_ARTISTS: '/me/following/artists',
  TICKETMASTER_SEARCH: '/ticketmaster/search-artist',
  TICKETMASTER_EVENTS: '/concerts/events',
  TICKETMASTER_BATCH: '/concerts/events/optimized-batch',
  DISCOGS_ARTIST_PROFILE: '/discogs/artist-profile',
  DISCOGS_ARTIST_ALBUMS: '/discogs/artist',
  DISCOGS_GENRE_STYLE: '/discogs/artist/genre-style-map',
  DISCOGS_PRIMARY_GENRE: '/discogs/artist/primary-genre',
  DISCOGS_ARTIST_BY_ID: '/discogs/artist-id',
  DISCOGS_LABEL_BY_ID: '/discogs/label-id',
  DISCOGS_RELEASE_BY_ID: '/discogs/release-id',
  TRACK_ISRC: '/track-isrc',
  FIND_MBID: '/find-mbid',
  LOW_LEVEL: '/low-level',
  MBID_LOOKUP: '/mbid-lookup',
  WRAPPED_ANALYSIS: '/wrapped-analysis',
  STOP_ANALYSIS: '/stop-analysis',
  API_COUNTER: '/api-counter',
  RESET_API_COUNTER: '/reset-api-counter',
  CACHED_PLAYLIST_URL: '/cached-playlist-url',
  GENRE_DETAILS: '/genre-details',
  ALL_ARTISTS_DEDUPLICATED: '/all-artists-deduplicated',
  SEARCH_ARTIST: '/search-artist',
  ARTIST_GENRE: '/artist-genre',
  ARTIST_GENRE_BY_NAME: '/artist-genre-by-name',
  PLAYLIST_GENRES: '/playlist-genres',
  PLAYLIST_ARTISTS: '/playlist-artists',
  PLAYLIST_TRACKS_FOR_WRAPPED: '/playlist-tracks-for-wrapped',
  FORCE_LOGOUT: '/force-logout',
  CANCEL: '/cancel',
  EXCHANGE_TOKEN: '/exchange-token',
};
