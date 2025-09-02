const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '../.env') }); 
const cors = require('cors'); 
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const { Pool } = require('pg');
const pool = new Pool(); // Uses .env variables automatically
const axios = require('axios');
const { getDiscogsArtistProfile } = require('./services/discogsService');
const { getArtistBio, getAllAlbumsByArtistName, getAlbumGenreStyleMapByArtistName, getArtistPrimaryGenre } = require('./services/discogsService');
const geniusService = require('./services/geniusService');

const app = express();
const PORT = 8000;

// Add session management
const session = require('express-session');

// after being logged in go to localhost:3000 (now it has welcome, your name)
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.4:3000', 'http://127.0.0.1:3000', 'http://46.101.78.90:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true, // Changed to true for better reliability
  saveUninitialized: true, // Changed to true for better reliability
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Added for better security
  }
}));

// Middleware to set access token from session
const setAccessTokenFromSession = (req, res, next) => {
  if (req.session && req.session.access_token) {
    spotifyApi.setAccessToken(req.session.access_token);
  }
  next();
};

// Parse JSON bodies for POST requests with increased limit for large playlists
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define the "scopes" or permissions we need from the user
const scopes = [
  'user-read-email',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-follow-read',
  'user-follow-modify',
];

// Create a new instance of the SpotifyWebApi client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://46.101.78.90:8000/callback', // Use HTTP since server doesn't have SSL
});

// Token refresh function
const refreshAccessTokenIfNeeded = async () => {
  try {
    const accessToken = spotifyApi.getAccessToken();
    if (!accessToken) {
      console.log('No access token available');
      return false;
    }
    
    // Try to make a simple API call to test if token is valid
    try {
      await spotifyApi.getMe();
      return true; // Token is still valid
    } catch (error) {
      if (error.statusCode === 401) {
        console.log('Access token expired, attempting to refresh...');
        const refreshToken = spotifyApi.getRefreshToken();
        if (!refreshToken) {
          console.log('No refresh token available');
          return false;
        }
        
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body.access_token;
        spotifyApi.setAccessToken(newAccessToken);
        console.log('Successfully refreshed access token');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return false;
  }
};

// Import our new service
const spotifyService = require('./services/spotifyService');
// Pass the spotifyApi object to the service
spotifyService.setSpotifyApi(spotifyApi);

const ticketmasterService = require('./services/ticketmasterService');

// The LOGIN route
// This is where we will redirect the user to Spotify to log in
app.get('/login', (req, res) => {
  // Get the destination from query parameters
  const destination = req.query.destination || 'dashboard';
  const showDialog = req.query.show_dialog === 'true';
  
  // Force consistent OAuth behavior across all devices
  // Add parameters to prevent popup/iframe issues on desktop
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, destination, {
    show_dialog: showDialog,  // Show account selection dialog if requested
    response_type: 'code',
    state: `desktop_oauth_fix_${destination}`,  // Add state parameter for security and destination
    // Force fresh login for different account
    ...(showDialog && {
      prompt: 'login',  // Force login prompt instead of authorization
      force_login: 'true',  // Additional parameter to force fresh login
      // Additional parameters to ensure fresh login
      scope: scopes.join(' '),
      consent: 'force'
    })
  });
  
  // For different account login, try to clear any existing session first
  if (showDialog) {
    // Clear any existing tokens to force fresh authentication
    spotifyApi.setAccessToken(null);
    spotifyApi.setRefreshToken(null);
  }
  
  console.log('Redirecting to Spotify OAuth:', authorizeURL);
  res.redirect(authorizeURL);
});

// The CALLBACK route
// This is the route Spotify will redirect to after the user has logged in
app.get('/callback', async (req, res) => {
  // ADD THIS LINE TO SEE EXACTLY WHAT SPOTIFY SENDS BACK
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Full query from Spotify:', req.query);
  console.log('Headers:', req.headers);
  console.log('User Agent:', req.headers['user-agent']);
  console.log('Referer:', req.headers['referer']);
  console.log('Origin:', req.headers['origin']);
  console.log('================================');

  const { error, code, state } = req.query;

  if (error) {
    console.error('Error from Spotify:', error);
    
    // Handle access_denied (user cancelled)
    if (error === 'access_denied') {
      console.log('User cancelled OAuth flow');
      
      // Extract destination from state parameter
      const destination = state ? state.replace('desktop_oauth_fix_', '') : 'dashboard';
      
      // Redirect back to the appropriate page
      const origin = req.headers.origin || req.headers.referer || 'http://46.101.78.90:3000';
      
      // Determine redirect URL based on origin
      let redirectUrl;
      if (origin.includes('localhost:3001')) {
        redirectUrl = 'http://localhost:3001';
      } else if (origin.includes('localhost:3000')) {
        redirectUrl = 'http://localhost:3000';
      } else if (origin.includes('46.101.78.90')) {
        redirectUrl = 'http://46.101.78.90:3000';
      } else {
        // Default to cloud server for production
        redirectUrl = 'http://46.101.78.90:3000';
      }
      
      let finalRedirectUrl;
      if (destination === 'analytics') {
        finalRedirectUrl = `${redirectUrl}/dashboard`;
      } else if (destination === 'concerts') {
        finalRedirectUrl = `${redirectUrl}/concerts`;
      } else {
        finalRedirectUrl = `${redirectUrl}/dashboard`;
      }
      
      console.log('Redirecting cancelled user to:', finalRedirectUrl);
      res.redirect(finalRedirectUrl);
      return;
    }
    
    // For other errors, show error message
    res.send(`Error during authentication: ${error}`);
    return;
  }

  // Extract destination from state parameter
  const destination = state ? state.replace('desktop_oauth_fix_', '') : 'dashboard';
  console.log('Destination from OAuth state:', destination);

  try {
    // Exchange the authorization code for an access token
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    // Set the tokens on our Spotify API object
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('Successfully retrieved access token!');
    console.log('Access Token:', access_token);
    
    // Store tokens in session for persistent authentication
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.user_id = null; // Will be set when we get user info
    
    // Save session
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      } else {
        console.log('Session saved successfully');
      }
    });
    
    // Send the user back to the 'face' of your application
    // Check if the request came from mobile or desktop
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    console.log('User Agent:', userAgent);
    console.log('Is Mobile:', isMobile);
    
    // Get the origin from the request headers to determine the correct redirect URL
    const origin = req.headers.origin || req.headers.referer || 'http://46.101.78.90:3000';
    
    // Determine redirect URL based on origin
    let redirectUrl;
    if (origin.includes('localhost:3001')) {
      redirectUrl = 'http://localhost:3001';
    } else if (origin.includes('localhost:3000')) {
      redirectUrl = 'http://localhost:3000';
    } else if (origin.includes('46.101.78.90')) {
      redirectUrl = 'http://46.101.78.90:3000';
    } else {
      // Default to cloud server for production
      redirectUrl = 'http://46.101.78.90:3000';
    }
    
    // Redirect to the destination page directly (session is already established)
    let finalRedirectUrl;
    if (destination === 'analytics') {
      finalRedirectUrl = `${redirectUrl}/dashboard`;
    } else if (destination === 'concerts') {
      finalRedirectUrl = `${redirectUrl}/concerts`;
    } else {
      finalRedirectUrl = `${redirectUrl}/dashboard`;
    }
    
    console.log('Redirecting to:', finalRedirectUrl);
    
    // Redirect to the destination page
    res.redirect(finalRedirectUrl);
 
  } catch (err) {
    console.error('--- ERROR GETTING TOKENS ---');
    console.error('Spotify API Error:', err.body); 
    res.send('An error occurred while getting the tokens. Check the server console for details.');
  }
});

// API endpoint for the frontend to check auth status and get user data.
app.get('/me', async (req, res) => {
  try {
    // Set the access token from session if available
    if (req.session && req.session.access_token) {
      spotifyApi.setAccessToken(req.session.access_token);
    }
    
    const { body } = await spotifyApi.getMe();
    
    // Get user's public profile to access follower count and following count
    let followerCount = null;
    let followingCount = null;
    let product = null;
    try {
      const { body: profileBody } = await spotifyApi.getUser(body.id);
      followerCount = profileBody.followers?.total || null;
      
      // Get following count (artists and users the user follows)
      try {
        const { body: followingBody } = await spotifyApi.getFollowedArtists();
        followingCount = followingBody.artists?.total || 0;
      } catch (followingErr) {
        console.log('Could not fetch following count:', followingErr.message);
      }
    } catch (profileErr) {
      console.log('Could not fetch user profile for followers:', profileErr.message);
      // Continue without follower count if there's an error
    }
    
    // Get user's product (Premium/Free status) from the main user data
    product = body.product || null;
    
    // Return user data with follower count, following count, and product
    res.json({
      ...body,
      followerCount,
      followingCount,
      product,
      authenticated: true
    });
  } catch (err) {
    console.error('Could not get user data:', err);
    // Clear session if token is invalid
    req.session.destroy();
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST endpoint for token refresh
app.post('/me', async (req, res) => {
  try {
    const { refresh, refresh_token } = req.body;
    
    if (refresh && refresh_token) {
      console.log('Attempting to refresh token...');
      
      // Set the refresh token and try to refresh
      spotifyApi.setRefreshToken(refresh_token);
      
      try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];
        
        // Update the API object with new token
        spotifyApi.setAccessToken(newAccessToken);
        
        console.log('Token refreshed successfully');
        res.json({ token: newAccessToken });
        return;
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        res.status(401).json({ error: 'Failed to refresh token' });
        return;
      }
    }
    
    // If not a refresh request, return error
    res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    console.error('Error in POST /me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/logout', (req, res) => {
  // Clear all tokens from the server
  spotifyApi.setAccessToken(null);
  spotifyApi.setRefreshToken(null);
  
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      console.log('Session destroyed successfully');
    }
  });
  
  // Clear any global token storage
  if (global.tempTokens) {
    global.tempTokens = {};
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Add a force-logout endpoint for different account login
app.get('/force-logout', (req, res) => {
  // Clear all server-side tokens
  spotifyApi.setAccessToken(null);
  spotifyApi.setRefreshToken(null);
  if (global.tempTokens) { global.tempTokens = {}; }
  
  const destination = req.query.destination || 'dashboard';
  
  // Add timestamp to force Spotify to treat this as a completely new session
  const timestamp = Date.now();
  
  // Create authorization URL with aggressive parameters to force fresh login
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, destination, {
    show_dialog: true,
    response_type: 'code',
    state: `desktop_oauth_fix_${destination}_${timestamp}`,
    prompt: 'login',
    force_login: 'true',
    // Additional parameters to ensure fresh login
    scope: scopes.join(' '),
    // Force new consent screen
    consent: 'force'
  });
  
  // Set headers to clear any potential cookies and force fresh session
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.redirect(authorizeURL);
});

// Add a cancel endpoint to handle OAuth cancellation
app.get('/cancel', (req, res) => {
  const destination = req.query.destination || 'dashboard';
  const redirectUrl = req.headers.origin || req.headers.referer || 'http://localhost:3000';
  const finalRedirectUrl = redirectUrl.includes('3001') ? 'http://localhost:3001' : 'http://localhost:3000';
  
  // Redirect back to the appropriate page
  if (destination === 'analytics') {
    res.redirect(`${finalRedirectUrl}/dashboard`);
  } else if (destination === 'concerts') {
    res.redirect(`${finalRedirectUrl}/concerts`);
  } else {
    res.redirect(`${finalRedirectUrl}/dashboard`);
  }
});

// Endpoint to exchange temporary token ID for actual tokens
app.get('/exchange-token/:tempTokenId', (req, res) => {
  const { tempTokenId } = req.params;
  
  if (!global.tempTokens || !global.tempTokens[tempTokenId]) {
    return res.status(404).json({ error: 'Token not found or expired' });
  }
  
  const tokens = global.tempTokens[tempTokenId];
  
  // Remove the temporary token after use
  delete global.tempTokens[tempTokenId];
  
  // Return the tokens to the client
  res.json({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });
});

app.get('/analyze-recents', async (req, res) => {
  try {
    // Call the function from our service
    const analysis = await spotifyService.analyzeRecentTracks();
    // Send the result back to the frontend
    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing recent tracks:', err);
    res.status(500).json({ error: 'Failed to analyze recent tracks' });
  }
});

app.get('/recent-tracks', setAccessTokenFromSession, async (req, res) => {
  try {
    // Fetch up to 50 recently played tracks
    const { body } = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    
    // Extract track IDs to fetch detailed information
    const trackIds = body.items.map(item => item.track.id).filter(Boolean);
    
    // Fetch detailed track information including release dates
    const { body: detailedTracksBody } = await spotifyApi.getTracks(trackIds);
    const detailedTracks = detailedTracksBody.tracks;
    
    // Get all first artist IDs
    const artistIds = body.items.map(item => item.track && item.track.artists && item.track.artists[0] && item.track.artists[0].id).filter(Boolean);
    
    // Fetch artist genres in batches of 50
    let artistGenres = {};
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const { body: artistsBody } = await spotifyApi.getArtists(batch);
      artistsBody.artists.forEach(artist => {
        artistGenres[artist.id] = artist.genres && artist.genres.length > 0 ? artist.genres[0] : null;
      });
    }
    
    // Create a map of track ID to detailed track info
    const trackDetailsMap = {};
    detailedTracks.forEach(track => {
      trackDetailsMap[track.id] = track;
    });
    
    // Map to array with detailed information
    const tracks = body.items.map(item => {
      const detailedTrack = trackDetailsMap[item.track.id];
      return {
        name: item.track.name,
        artist: item.track.artists.map(a => a.name).join(', '),
        uri: item.track.uri,
        album: item.track.album.name,
        release_date: detailedTrack?.release_date || item.track.album.release_date,
        album_release_date: detailedTrack?.album?.release_date || item.track.album.release_date,
        release_year: detailedTrack?.release_date ? detailedTrack.release_date.split('-')[0] : 
                     detailedTrack?.album?.release_date ? detailedTrack.album.release_date.split('-')[0] :
                     item.track.album.release_date ? item.track.album.release_date.split('-')[0] : '',
        album_image: item.track.album.images && item.track.album.images.length > 0 ? item.track.album.images[0].url : '',
        duration_ms: item.track.duration_ms,
        id: item.track.id,
        genre: item.track.artists && item.track.artists[0] && artistGenres[item.track.artists[0].id] ? artistGenres[item.track.artists[0].id] : 'Unknown',
        played_at: item.played_at,
        // Add detailed track information
        artists: detailedTrack?.artists || item.track.artists,
        album: detailedTrack?.album || item.track.album,
        // Add popularity from detailed track information
        popularity: detailedTrack?.popularity || null
      };
    });
    
    res.json({ tracks });
  } catch (err) {
    console.error('Error fetching recent tracks:', err);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

app.get('/playlists', async (req, res) => {
  try {
    // Refresh access token if needed
    const tokenValid = await refreshAccessTokenIfNeeded();
    if (!tokenValid) {
      console.error('Could not obtain valid access token');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
    
    // Get the current user's Spotify ID
    const me = await spotifyApi.getMe();
    const userId = me.body.id;

    // Fetch all playlists (max 50 per request)
    const { body } = await spotifyApi.getUserPlaylists({ limit: 50 });

    // Filter to only playlists where the owner is the current user
    const playlists = await Promise.all(
      body.items
        .filter(item => item.owner.id === userId)
        .map(async item => {
          // Return basic playlist info without fetching tracks
          return {
            name: item.name,
            id: item.id,
            trackCount: item.tracks.total,
            images: item.images
          };
        })
    );

    res.json({ playlists });
  } catch (err) {
    console.error('Error fetching playlists:', err);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// New endpoint to get playlists with duration information
app.get('/playlists-with-duration', async (req, res) => {
  try {
    // Refresh access token if needed
    const tokenValid = await refreshAccessTokenIfNeeded();
    if (!tokenValid) {
      console.error('Could not obtain valid access token');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
    
    // Get the current user's Spotify ID
    const me = await spotifyApi.getMe();
    const userId = me.body.id;

    // Fetch all playlists (max 50 per request)
    const { body } = await spotifyApi.getUserPlaylists({ limit: 50 });

    // Filter to only playlists where the owner is the current user and fetch duration
    const playlists = await Promise.all(
      body.items
        .filter(item => item.owner.id === userId)
        .map(async item => {
          try {
            // Fetch playlist tracks to calculate total duration
            let allTracks = [];
            let offset = 0;
            let total = 1;
            let first = true;
            
            while (first || allTracks.length < total) {
              const { body: tracksBody } = await spotifyApi.getPlaylistTracks(item.id, { offset, limit: 100 });
              if (first) {
                total = tracksBody.total;
                first = false;
              }
              allTracks = allTracks.concat(tracksBody.items);
              offset += 100;
            }
            
            // Calculate total duration
            const totalDurationMs = allTracks.reduce((total, item) => {
              return total + (item.track?.duration_ms || 0);
            }, 0);
            
            return {
              name: item.name,
              id: item.id,
              trackCount: item.tracks.total,
              totalDurationMs: totalDurationMs,
              images: item.images
            };
          } catch (error) {
            console.error(`Error fetching tracks for playlist ${item.name}:`, error);
            // Return playlist without duration if there's an error
            return {
              name: item.name,
              id: item.id,
              trackCount: item.tracks.total,
              totalDurationMs: 0,
              images: item.images
            };
          }
        })
    );

    res.json({ playlists });
  } catch (err) {
    console.error('Error fetching playlists with duration:', err);
    res.status(500).json({ error: 'Failed to fetch playlists with duration' });
  }
});

app.get('/playlist-genres/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    if (!playlistId) return res.status(400).json({ error: 'Missing playlist ID' });
    
    // Refresh access token if needed
    const tokenValid = await refreshAccessTokenIfNeeded();
    if (!tokenValid) {
      console.error('Could not obtain valid access token');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
    
    // Fetch all tracks in the playlist (handle >100 tracks if needed)
    let allTracks = [];
    let offset = 0;
    let total = 1;
    let first = true;
    while (first || allTracks.length < total) {
      const { body: tracksBody } = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit: 100 });
      if (first) {
        total = tracksBody.total;
        first = false;
      }
      allTracks = allTracks.concat(tracksBody.items);
      offset += 100;
    }
    
    // Get all artist IDs from all tracks (including multiple artists per track)
    let artistTrackMap = new Map(); // artistId -> { tracks: [], genres: [] }
    
    allTracks.forEach((item, trackIndex) => {
      if (item.track && item.track.artists) {
        item.track.artists.forEach(artist => {
          if (artist && artist.id) {
            if (!artistTrackMap.has(artist.id)) {
              artistTrackMap.set(artist.id, {
                name: artist.name,
                tracks: [],
                genres: []
              });
            }
            artistTrackMap.get(artist.id).tracks.push({
              name: item.track.name,
              id: item.track.id,
              uri: item.track.uri,
              album: item.track.album?.name || 'Unknown Album',
              duration_ms: item.track.duration_ms || 0,
              release_date: item.track.album?.release_date || null
            });
          }
        });
      }
    });
    
    const artistIds = Array.from(artistTrackMap.keys());
    
    // Fetch artist details and genres in batches of 50 (Spotify API limit)
    let genres = {};
    let genreDetails = {};
    
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const { body } = await spotifyApi.getArtists(batch);
      
      body.artists.forEach(artist => {
        const artistData = artistTrackMap.get(artist.id);
        if (artistData) {
          // Update artist data with full details
          artistData.spotifyId = artist.id;
          artistData.popularity = artist.popularity;
          artistData.images = artist.images;
          artistData.genres = artist.genres;
          
          // Only process artists that have valid genres
          if (artist.genres && artist.genres.length > 0) {
            const primaryGenre = artist.genres[0];
            
            // Count for genres object
            genres[primaryGenre] = (genres[primaryGenre] || 0) + 1;
            
            // Build detailed breakdown for genreDetails
            if (!genreDetails[primaryGenre]) {
              genreDetails[primaryGenre] = {
                count: 0,
                artists: []
              };
            }
            
            genreDetails[primaryGenre].count += 1;
            genreDetails[primaryGenre].artists.push({
              name: artist.name,
              id: artist.id,
              spotifyId: artist.id,
              popularity: artist.popularity,
              images: artist.images,
              tracks: artistData.tracks
            });
          }
          // Skip artists without genres - they won't be counted or included
        }
      });
    }
    
    res.json({ 
      genres,
      genreDetails 
    });
  } catch (err) {
    console.error('Error analyzing playlist genres:', err);
    res.status(500).json({ error: 'Failed to analyze playlist genres' });
  }
});

app.get('/playlist-tracks-for-wrapped/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    if (!playlistId) return res.status(400).json({ error: 'Missing playlist ID' });
    
    // Refresh access token if needed
    const tokenValid = await refreshAccessTokenIfNeeded();
    if (!tokenValid) {
      console.error('Could not obtain valid access token');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
    
    // Fetch all tracks in the playlist (handle >100 tracks if needed)
    let allTracks = [];
    let offset = 0;
    let total = 1;
    let first = true;
    
    while (first || allTracks.length < total) {
      const { body: tracksBody } = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit: 100 });
      if (first) {
        total = tracksBody.total;
        first = false;
      }
      allTracks = allTracks.concat(tracksBody.items);
      offset += 100;
    }
    
    // Transform tracks to the format expected by WrappedAnalysisModal
    const tracks = allTracks
      .filter(item => item.track && item.track.id)
      .map(item => {
        // Extract release date from various possible locations
        let releaseDate = null;
        let releaseYear = null;
        
        if (item.track.album?.release_date) {
          releaseDate = item.track.album.release_date;
          releaseYear = item.track.album.release_date.split('-')[0];
        } else if (item.track.release_date) {
          releaseDate = item.track.release_date;
          releaseYear = item.track.release_date.split('-')[0];
        }
        

        
        return {
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists?.[0]?.name || 'Unknown Artist',
          artists: item.track.artists || [],
          album: item.track.album?.name || 'Unknown Album',
          duration_ms: item.track.duration_ms || 0,
          duration: item.track.duration_ms || 0, // Add duration field for compatibility
          release_date: releaseDate,
          release_year: releaseYear,
          uri: item.track.uri,
          album_image: item.track.album?.images?.[0]?.url || null,
          // Add additional fields that might be needed
          popularity: item.track.popularity || 0,
          explicit: item.track.explicit || false,
          track_number: item.track.track_number || null,
          disc_number: item.track.disc_number || null
        };
      });
    
    res.json({ tracks });
  } catch (err) {
    console.error('Error fetching playlist tracks for wrapped:', err);
    res.status(500).json({ error: 'Failed to fetch playlist tracks for wrapped' });
  }
});

app.get('/artist-genre/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
    const { body } = await spotifyApi.getArtist(artistId);
    res.json({ genres: body.genres });
  } catch (err) {
    console.error('Error fetching artist genre:', err);
    res.status(500).json({ error: 'Failed to fetch artist genre' });
  }
});

// New endpoint to get artist genre by name (following /artist page pattern)
app.get('/artist-genre-by-name', async (req, res) => {
  try {
    const { artistName } = req.query;
    if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
    
    // Searching for artist...
    
    // Search for the artist using Spotify API (same as /artist page)
    const searchRes = await spotifyApi.searchArtists(artistName, { limit: 10 });
    const artists = searchRes.body.artists.items;
    
    if (artists && artists.length > 0) {
      // Found potential matches
      
      // Find the best match with improved logic
      let bestMatch = null;
      let bestScore = 0;
      
      artists.forEach((artist, index) => {
        const artistNameLower = artistName.toLowerCase();
        const spotifyArtistNameLower = artist.name.toLowerCase();
        
        // Calculate match score
        let score = 0;
        
        // Exact match gets highest score
        if (spotifyArtistNameLower === artistNameLower) {
          score = 100;
        }
        // Starts with gets high score
        else if (spotifyArtistNameLower.startsWith(artistNameLower)) {
          score = 80;
        }
        // Contains gets medium score
        else if (spotifyArtistNameLower.includes(artistNameLower)) {
          score = 60;
        }
        // Partial match gets lower score
        else if (artistNameLower.includes(spotifyArtistNameLower)) {
          score = 40;
        }
        
        // Bonus for higher popularity (more likely to be the main artist)
        if (artist.popularity) {
          score += Math.min(artist.popularity / 10, 20); // Max 20 bonus points
        }
        
        // Bonus for having genres (more established artist)
        if (artist.genres && artist.genres.length > 0) {
          score += 10;
        }
        
        // Artist scored
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = artist;
        }
      });
      
      if (bestMatch) {
        // Best match found
        
        // Get the primary genre (first one in the array)
        const primaryGenre = bestMatch.genres && bestMatch.genres.length > 0 ? bestMatch.genres[0] : null;
        
        if (primaryGenre) {
          // Genre found
        } else {
          // No genres found
        }
        
        res.json({
          artistName: bestMatch.name,
          spotifyId: bestMatch.id,
          primaryGenre: primaryGenre,
          allGenres: bestMatch.genres || [],
          matchScore: bestScore,
          popularity: bestMatch.popularity
        });
      } else {
        // No suitable match found
        res.status(404).json({ error: 'No suitable artist match found' });
      }
    } else {
      // No artists found
      res.status(404).json({ error: 'Artist not found' });
    }
  } catch (err) {
    console.error('[Artist Genre API] Error fetching artist genre:', err);
    res.status(500).json({ error: 'Failed to fetch artist genre' });
  }
});

// Search for artist by name (Ticketmaster)
app.get('/concerts/artist-search', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const data = await ticketmasterService.searchArtist(name);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to search artist' });
  }
});

// Get events by artist ID (Ticketmaster)
app.get('/concerts/events', async (req, res) => {
  const { artistId, location } = req.query;
  if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
  try {
    const data = await ticketmasterService.getEventsByArtistId(artistId, location);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get events' });
  }
});

app.get('/playlist-artists/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    if (!playlistId) return res.status(400).json({ error: 'Missing playlist ID' });
    
    // Refresh access token if needed
    const tokenValid = await refreshAccessTokenIfNeeded();
    if (!tokenValid) {
      console.error('Could not obtain valid access token');
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
    
    // Fetch all tracks in the playlist (handle >100 tracks if needed)
    let allTracks = [];
    let offset = 0;
    let total = 1;
    let first = true;
    
    while (first || allTracks.length < total) {
      const { body: tracksBody } = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit: 100 });
      if (first) {
        total = tracksBody.total;
        first = false;
      }
      allTracks = allTracks.concat(tracksBody.items);
      offset += 100;
    }
    
    // Build detailed artist breakdown with track information
    let artists = {};
    let artistDetails = {};
    
    allTracks.forEach(item => {
      if (item.track && item.track.artists) {
        item.track.artists.forEach(artist => {
          if (artist && artist.name) {
            // Count for artists object
            artists[artist.name] = (artists[artist.name] || 0) + 1;
            
            // Build detailed breakdown for artistDetails
            if (!artistDetails[artist.name]) {
              artistDetails[artist.name] = {
                count: 0,
                tracks: [],
                spotifyId: artist.id
              };
            }
            
            artistDetails[artist.name].count += 1;
            artistDetails[artist.name].tracks.push({
              name: item.track.name,
              id: item.track.id,
              uri: item.track.uri,
              album: item.track.album?.name || 'Unknown Album',
              duration_ms: item.track.duration_ms || 0,
              release_date: item.track.album?.release_date || null
            });
          }
        });
      }
    });
    
    res.json({ 
      artists,
      artistDetails 
    });
  } catch (err) {
    console.error('Error analyzing playlist artists:', err);
    res.status(500).json({ error: 'Failed to analyze playlist artists' });
  }
});

app.get('/top-tracks', async (req, res) => {
  const { time_range = 'short_term', limit } = req.query;
  try {
    const { body } = await spotifyApi.getMyTopTracks({ time_range, limit: limit ? Number(limit) : 50 });
    res.json(body.items);
  } catch (err) {
    console.error('Error fetching top tracks:', err);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

app.get('/top-artists', async (req, res) => {
  const { time_range = 'short_term', limit } = req.query;
  try {
    const { body } = await spotifyApi.getMyTopArtists({ time_range, limit: limit ? Number(limit) : 50 });
    res.json(body.items);
  } catch (err) {
    console.error('Error fetching top artists:', err);
    res.status(500).json({ error: 'Failed to fetch top artists' });
  }
});

// Helper to get top data for a given time range
async function getTopData(time_range) {
  const [tracksRes, artistsRes] = await Promise.all([
    spotifyApi.getMyTopTracks({ time_range, limit: 50 }),
    spotifyApi.getMyTopArtists({ time_range, limit: 50 })
  ]);
  const basicTracks = tracksRes.body.items;
  const artists = artistsRes.body.items;
  
  // Increment counter for 2 API calls (tracks + artists)
  globalApiCallCounter.spotify += 2;
  globalApiCallCounter.total += 2;
  
  // Fetch detailed track information including release dates
  const trackIds = basicTracks.map(track => track.id);
  const detailedTracksRes = await spotifyApi.getTracks(trackIds);
  const detailedTracks = detailedTracksRes.body.tracks;
  
  // Debug: Check if detailed tracks have release date information
  
  
  // Increment counter for detailed tracks API call
  globalApiCallCounter.spotify += 1;
  globalApiCallCounter.total += 1;
  
  // Collect genres from top artists with artist details
  let genreData = {};
  (artists || []).forEach(artist => {
    (artist.genres || []).forEach(genre => {
      if (!genreData[genre]) {
        genreData[genre] = {
          count: 0,
          artists: []
        };
      }
      genreData[genre].count += 1;
      genreData[genre].artists.push({
        name: artist.name,
        id: artist.id,
        spotifyId: artist.id, // Add explicit spotifyId field
        popularity: artist.popularity,
        images: artist.images
      });
    });
  });
  
  // Convert to the format expected by frontend
  let genreCounts = {};
  Object.keys(genreData).forEach(genre => {
    genreCounts[genre] = genreData[genre].count;
  });
  
  return { 
    tracks: detailedTracks, 
    artists, 
    genres: genreCounts,
    genreDetails: genreData  // New field with detailed genre information
  };
}

app.get('/last-4-weeks', setAccessTokenFromSession, async (req, res) => {
  try {
    const data = await getTopData('short_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 4 weeks data' });
  }
});

app.get('/last-6-months', setAccessTokenFromSession, async (req, res) => {
  try {
    const data = await getTopData('medium_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 6 months data' });
  }
});

app.get('/last-12-months', setAccessTokenFromSession, async (req, res) => {
  try {
    const data = await getTopData('long_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 12 months data' });
  }
});

// New endpoint to get detailed genre information with artists
app.get('/genre-details/:timeRange', setAccessTokenFromSession, async (req, res) => {
  try {
    const { timeRange } = req.params;
    let time_range;
    
    switch (timeRange) {
      case '4-weeks':
        time_range = 'short_term';
        break;
      case '6-months':
        time_range = 'medium_term';
        break;
      case '12-months':
        time_range = 'long_term';
        break;
      default:
        return res.status(400).json({ error: 'Invalid time range. Use: 4-weeks, 6-months, or 12-months' });
    }
    
    const data = await getTopData(time_range);
    res.json({
      genres: data.genreDetails,
      timeRange: timeRange
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch genre details' });
  }
});

// New endpoint to search for artist by name and get spotifyId
app.get('/search-artist', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }
    
    console.log(`[search-artist] Searching for artist: ${name}`);
    
    // Search for the artist using Spotify API
    const searchRes = await spotifyApi.searchArtists(name, { limit: 5 });
    const artists = searchRes.body.artists.items;
    
    if (artists && artists.length > 0) {
      // Find the best match (exact or closest)
      let bestMatch = artists[0];
      
      // Try to find exact match first
      const exactMatch = artists.find(artist => 
        artist.name.toLowerCase() === name.toLowerCase()
      );
      
      if (exactMatch) {
        bestMatch = exactMatch;
      }
      
      
      res.json({
        spotifyId: bestMatch.id,
        name: bestMatch.name,
        popularity: bestMatch.popularity,
        images: bestMatch.images
      });
    } else {
      console.log(`[search-artist] No artists found for: ${name}`);
      res.status(404).json({ error: 'Artist not found' });
    }
  } catch (err) {
    console.error('[search-artist] Error:', err);
    res.status(500).json({ error: 'Failed to search for artist' });
  }
});

// New endpoint to get all artists from all time periods, deduplicated
app.get('/all-artists-deduplicated', setAccessTokenFromSession, async (req, res) => {
  try {
    // Reset API counter at the start of a new session
    globalApiCallCounter = {
      spotify: 0,
      ticketmasterArtistSearch: 0,
      ticketmasterConcertSearch: 0,
      total: 0
    };
    // Fetch artists from all three time periods
    const [data12Months, data6Months, data4Weeks] = await Promise.all([
      getTopData('long_term'),
      getTopData('medium_term'),
      getTopData('short_term')
    ]);

    // Create a map to track seen artists and their time periods
    const artistMap = new Map();
    
    // Process 12 months artists first (highest priority)
    data12Months.artists.forEach((artist, index) => {
      if (index < 50) { // Only take first 50
        artistMap.set(artist.id, {
          ...artist,
          timePeriod: '12_months',
          originalRank: index + 1
        });
      }
    });

    // Process 6 months artists (medium priority)
    data6Months.artists.forEach((artist, index) => {
      if (index < 50 && !artistMap.has(artist.id)) { // Only if not already in 12 months
        artistMap.set(artist.id, {
          ...artist,
          timePeriod: '6_months',
          originalRank: index + 1
        });
      }
    });

    // Process 4 weeks artists (lowest priority)
    data4Weeks.artists.forEach((artist, index) => {
      if (index < 50 && !artistMap.has(artist.id)) { // Only if not already in 12 or 6 months
        artistMap.set(artist.id, {
          ...artist,
          timePeriod: '4_weeks',
          originalRank: index + 1
        });
      }
    });

    // Convert map to array and sort by time period priority
    const allArtists = Array.from(artistMap.values()).sort((a, b) => {
      const priorityOrder = { '12_months': 1, '6_months': 2, '4_weeks': 3 };
      return priorityOrder[a.timePeriod] - priorityOrder[b.timePeriod];
    });

    const breakdown = {
      '12_months': allArtists.filter(a => a.timePeriod === '12_months').length,
      '6_months': allArtists.filter(a => a.timePeriod === '6_months').length,
      '4_weeks': allArtists.filter(a => a.timePeriod === '4_weeks').length
    };

    res.json({
      artists: allArtists,
      totalCount: allArtists.length,
      breakdown: breakdown
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deduplicated artists data' });
  }
});

// --- In-memory cache for playlist URLs per access token and table type ---
const playlistCache = {};
// Structure: { [accessToken]: { expiry: timestamp, playlists: { [tableType]: playlistUrl } } }

function cachePlaylistUrl(accessToken, tableType, playlistUrl, expiresIn = 3600) {
  if (!accessToken) return;
  const expiry = Date.now() + expiresIn * 1000;
  if (!playlistCache[accessToken]) {
    playlistCache[accessToken] = { expiry, playlists: {} };
    // Set up expiry cleanup
    setTimeout(() => { delete playlistCache[accessToken]; }, expiresIn * 1000);
  }
  playlistCache[accessToken].playlists[tableType] = playlistUrl;
  playlistCache[accessToken].expiry = expiry;
}

function getCachedPlaylistUrl(accessToken, tableType) {
  const entry = playlistCache[accessToken];
  if (!entry || Date.now() > entry.expiry) return null;
  return entry.playlists[tableType] || null;
}

// --- Endpoint to get cached playlist URL for current token and table type ---
app.get('/cached-playlist-url', (req, res) => {
  const accessToken = spotifyApi.getAccessToken();
  const tableType = req.query.tableType;
  if (!accessToken || !tableType) return res.json({ playlistUrl: null });
  const url = getCachedPlaylistUrl(accessToken, tableType);
  res.json({ playlistUrl: url });
});

// Create playlist endpoint
app.post('/create-playlist', express.json(), async (req, res) => {
  try {
    const { name, trackUris, timeRange } = req.body;
    
    if (!name || !trackUris || !Array.isArray(trackUris)) {
      return res.status(400).json({ error: 'Missing required fields: name and trackUris array' });
    }

    // Get current user
    const { body: user } = await spotifyApi.getMe();
    
    // Create the playlist
    const { body: playlist } = await spotifyApi.createPlaylist(user.id, {
      name: name,
      description: `Created from Spotify Vibe Generator - ${timeRange || 'Custom'}`
    });

    // Add tracks to the playlist (Spotify API limit is 100 tracks per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      await spotifyApi.addTracksToPlaylist(playlist.id, batch);
    }

    // Cache the playlist URL for this access token and table type
    const accessToken = spotifyApi.getAccessToken();
    if (accessToken && timeRange) {
      cachePlaylistUrl(accessToken, timeRange, playlist.external_urls.spotify, 3600); // 1 hour expiry
    }

    res.json({ 
      success: true, 
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      trackCount: trackUris.length
    });
  } catch (err) {
    console.error('Error creating playlist:', err);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});


app.get('/track-isrc/:id', async (req, res) => {
  const trackId = req.params.id;
  if (!trackId) return res.status(400).json({ error: 'Missing track ID' });
  try {
    const { body } = await spotifyApi.getTrack(trackId);
    const isrc = body && body.external_ids && body.external_ids.isrc ? body.external_ids.isrc : null;
    res.json({ isrc });
  } catch (err) {
    console.error('Error fetching ISRC for track:', err);
    res.status(500).json({ error: 'Failed to fetch ISRC' });
  }
});

// This new endpoint can be called like:
// /find-mbid?isrc=...&songName=...&artistName=...
app.get('/find-mbid', async (req, res) => {
  // We now get ISRC, songName, and artistName from query parameters
  const { isrc, songName, artistName } = req.query;


  if (!isrc && (!songName || !artistName)) {
    return res.status(400).json({ error: 'Missing required parameters. Provide either an ISRC or both a song and artist name.' });
  }

  try {
    let mbid = null;

    // --- Step 1: Try to find MBID using ISRC (if provided) ---
    if (isrc) {
      const isrcUrl = `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`;
      const isrcResponse = await axios.get(isrcUrl, { 
        headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' } 
      });
      const isrcRecordings = isrcResponse.data.recordings;
      if (isrcRecordings && isrcRecordings.length > 0) {
        mbid = isrcRecordings[0].id;
      } else {
      }
    }

    // --- Step 2: If not found, fall back to searching by name and artist ---
    if (!mbid && songName && artistName) {
      const nameQuery = `recording:"${encodeURIComponent(songName)}" AND artist:"${encodeURIComponent(artistName)}"`;
      const nameUrl = `https://musicbrainz.org/ws/2/recording?query=${nameQuery}&fmt=json`;
      const nameResponse = await axios.get(nameUrl, { 
        headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' } 
      });
      const nameRecordings = nameResponse.data.recordings;
      if (nameRecordings && nameRecordings.length > 0) {
        mbid = nameRecordings[0].id;
      } else {
      }
    }

    // --- Step 3: Send the final result ---
    // mbid will be the found ID, or null if both searches failed.
    res.json({ mbid });

  } catch (err) {
    console.error('[find-mbid] Error during MBID fetch:', err.message);
    res.status(500).json({ error: 'An error occurred while fetching MBID from MusicBrainz' });
  }
});

// Low-level AcousticBrainz endpoint (Corrected)
app.get('/:mbid/low-level', async (req, res) => {
  const mbid = req.params.mbid;
  if (!mbid) {
    return res.status(400).json({ error: 'Missing MBID' });
  }

  try {
    const url = `https://acousticbrainz.org/${mbid}/low-level`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
    });

    // --- THIS IS THE FIX ---
    // Always send the full data object. This ensures the frontend receives
    // the 'rhythm' and 'tonal' objects at the top level.
    res.json(response.data);

  } catch (err) {
    console.error('Error fetching low-level data for MBID:', mbid, err.message);
    // Forward the status code from the error if available
    const statusCode = err.response ? err.response.status : 500;
    res.status(statusCode).json({ error: 'Failed to fetch low-level data' });
  }
});

// Get albums by artist ID (Spotify)
app.get('/artist-albums/:artistId', async (req, res) => {
  const artistId = req.params.artistId;
  if (!artistId) {
    return res.status(400).json({ error: 'Missing artist ID' });
  }

  try {
    // Use the group query parameter to fetch the correct type
    const group = req.query.group || 'album';
    // Validate group
    const validGroups = ['album', 'single', 'compilation', 'appears_on'];
    const groupParam = validGroups.includes(group) ? group : 'album';
    
    // Get sorting parameter
    const sortBy = req.query.sortBy || 'release_date'; // Default to release date
    const validSortOptions = ['release_date', 'popularity'];
    const sortParam = validSortOptions.includes(sortBy) ? sortBy : 'release_date';
    
    const { body } = await spotifyApi.getArtistAlbums(artistId, {
      limit: 50,
      include_groups: groupParam,
      album_type: groupParam
    });

    // Get basic album data first
    let albums = (body.items || []).map(album => ({
      id: album.id,
      name: album.name,
      image: album.images?.[0]?.url || '',
      releaseYear: album.release_date?.split('-')[0] || '',
      releaseDate: album.release_date || '',
      popularity: 0, // Will be fetched separately
      totalTracks: album.total_tracks || 0,
      albumType: album.album_type || groupParam
    }));

    // If sorting by popularity, fetch popularity data for albums in batches
    if (sortParam === 'popularity') {
      // Spotify allows up to 20 albums per batch call
      const BATCH_SIZE = 20;
      const albumIds = albums.map(album => album.id);
      
      // Process albums in batches
      for (let i = 0; i < albumIds.length; i += BATCH_SIZE) {
        const batch = albumIds.slice(i, i + BATCH_SIZE);
        
        try {
          // Batch API call: GET /albums?ids=id1,id2,id3...
          const { body: batchResponse } = await spotifyApi.getAlbums(batch);
          
          // Update popularity for albums in this batch
          batchResponse.albums.forEach((albumDetails, batchIndex) => {
            const globalIndex = i + batchIndex;
            if (globalIndex < albums.length) {
              albums[globalIndex].popularity = albumDetails.popularity || 0;
            }
          });
          
          // Small delay between batches to be safe with rate limits
          if (i + BATCH_SIZE < albumIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (error) {
          console.error(`Error fetching batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error);
          // Set popularity to 0 for albums in failed batch
          for (let j = i; j < Math.min(i + BATCH_SIZE, albums.length); j++) {
            albums[j].popularity = 0;
          }
        }
      }
    }

    // Check if we have any popularity data
    const albumsWithPopularity = albums.filter(a => a.popularity > 0);
    
    if (albumsWithPopularity.length === 0 && sortParam === 'popularity') {
      // Fall back to release date sort if no popularity data available
    }

    // Sort albums based on the sort parameter
    switch (sortParam) {
      case 'popularity':
        albums.sort((a, b) => b.popularity - a.popularity); // Highest popularity first
        break;
      case 'release_date':
      default:
        // Sort by release date (newest first)
        albums.sort((a, b) => {
          if (!a.releaseDate && !b.releaseDate) return 0;
          if (!a.releaseDate) return 1;
          if (!b.releaseDate) return -1;
          return b.releaseDate.localeCompare(a.releaseDate);
        });
        break;
    }

    res.json({ 
      albums,
      sortBy: sortParam,
      totalCount: albums.length
    });
  } catch (err) {
    console.error('Error fetching artist albums:', err);
    res.status(500).json({ error: 'Failed to fetch artist albums' });
  }
});

// Search for artist by name (Spotify)
app.get('/spotify/artist-search', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const { body } = await spotifyApi.searchArtists(name, { limit: 10 });
    // Simplify artist data for frontend
    const artists = (body.artists?.items || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.images && artist.images.length > 0 ? artist.images[0].url : '',
      genres: artist.genres || [],
      popularity: artist.popularity || 0,
    }));
    res.json({ artists });
  } catch (err) {
    console.error('Error searching artists:', err);
    res.status(500).json({ error: 'Failed to search artists' });
  }
});



// Get artist details by Spotify artist ID
app.get('/spotify/artist-details/:id', async (req, res) => {
  const artistId = req.params.id;
  if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
  try {
    const { body } = await spotifyApi.getArtist(artistId);
    res.json(body);
  } catch (err) {
    console.error('Error fetching artist details:', err);
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
});

// Get tracks by album ID (Spotify)
app.get('/album-tracks/:albumId', async (req, res) => {
  const albumId = req.params.albumId;
  if (!albumId) return res.status(400).json({ error: 'Missing album ID' });
  try {
    const { body } = await spotifyApi.getAlbumTracks(albumId, { limit: 50 });
    // Simplify track data for frontend
    const tracks = (body.items || []).map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      artists: track.artists.map(a => ({ // Preserve full artist data for collaboration analysis
        id: a.id,
        name: a.name,
        uri: a.uri
      })),
      album: track.album?.name || '',
      release_year: track.album?.release_date ? track.album.release_date.split('-')[0] : '',
      album_image: track.album?.images?.[0]?.url || '',
      duration_ms: track.duration_ms,
      genre: 'Unknown', // Would need to fetch artist genres separately
    }));
    res.json({ tracks });
  } catch (err) {
    console.error('Error fetching album tracks:', err);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
});

// Get artist collaborators/friends based on their albums
app.get('/artist-collaborators/:artistId', async (req, res) => {
  const artistId = req.params.artistId;
  const minCollaborations = parseInt(req.query.minCollaborations) || 1; // Minimum collabs to be considered a "friend"
  const albumTypes = req.query.albumTypes || 'album'; // Default to albums only for speed
  
  if (!artistId) {
    return res.status(400).json({ error: 'Missing artist ID' });
  }

  try {
    // Track API call count for final summary
    let totalApiCalls = 0;
    
    // Step 1: Get specific album types (much faster than fetching all)
    let allAlbums = [];
    

    
    // Add initial delay to prevent hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Strategy: If user wants "All Types", make 4 separate calls for complete coverage
      if (albumTypes.includes(',')) {
        // Multiple types requested - make separate calls for each
        const types = albumTypes.split(',');
        const albumPromises = types.map(async (type) => {
          const { body } = await spotifyApi.getArtistAlbums(artistId, {
            limit: 50, // Full limit since we're being specific
            include_groups: type.trim()
          });
          totalApiCalls++; // Track API call
          return body.items || [];
        });
        
        const allAlbumArrays = await Promise.all(albumPromises);
        
        // Filter each array to match the requested type (fix Spotify API inconsistency)
        const filteredArrays = allAlbumArrays.map((albums, index) => {
          const requestedType = types[index].trim();
          const filtered = albums.filter(album => {
            // Handle Spotify API quirks where album_type doesn't match include_groups
            if (requestedType === 'appears_on') {
              return album.album_type === 'appears_on' || album.album_type === 'compilation';
            }
            return album.album_type === requestedType;
          });
          
          // Normalize album_type to match what was requested
          return filtered.map(album => ({
            ...album,
            album_type: requestedType // Force the type to match what user selected
          }));
        });
        
        allAlbums = filteredArrays.flat(); // Combine all arrays
      } else {
        // Single type requested - simple call
        const { body: albumsBody } = await spotifyApi.getArtistAlbums(artistId, {
          limit: 50, // Full limit for single type
          include_groups: albumTypes
        });
        
        // Filter to match exactly what was requested (fix Spotify API inconsistency)
        let filteredAlbums = (albumsBody.items || []).filter(album => {
          if (albumTypes === 'appears_on') {
            return album.album_type === 'appears_on' || album.album_type === 'compilation';
          }
          return album.album_type === albumTypes;
        });
        
        // Normalize album_type to match what was requested
        allAlbums = filteredAlbums.map(album => ({
          ...album,
          album_type: albumTypes // Force the type to match what user selected
        }));
        
        console.log(`[Collaborators] Fetched ${allAlbums.length} ${albumTypes} albums`);
      }
      
      // Albums fetched successfully
      
    } catch (error) {
      if (error.statusCode === 429) {
        const retryAfter = Math.min(error.headers['retry-after'] || 3, 10); // Cap at 10 seconds max
        // Rate limited, retrying...
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        // Simple retry with the requested album types
        try {
          const { body: albumsBody } = await spotifyApi.getArtistAlbums(artistId, {
            limit: 50,
            include_groups: albumTypes
          });
          allAlbums = albumsBody.items || [];
          console.log(`[Collaborators] Retry successful: Fetched ${allAlbums.length} albums`);
        } catch (retryError) {
          console.error(`[Collaborators] Retry failed:`, retryError);
          allAlbums = [];
        }
      } else {
        console.error(`[Collaborators] Error fetching albums:`, error);
        allAlbums = [];
      }
    }

    if (!allAlbums || allAlbums.length === 0) {
      return res.json({ collaborators: [], totalAlbums: 0, totalTracks: 0, albumTypes: {} });
    }
    
    // Step 1 completed - albums fetched

    // Step 2: Get tracks for ALL album types (albums, singles, compilations, appears_on)
    // NOTE: Even "singles" often have multiple tracks (radio version, instrumental, etc.)
    // and "appears_on" albums need track-level analysis to find actual collaborations
    const albumTypeStats = {
      album: 0,
      single: 0,
      compilation: 0,
      appears_on: 0
    };

    // Helper function to add delay between API calls
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Process albums using bulk endpoint with parallel batch processing
    const albumsWithTracks = [];
    const bulkBatchSize = 20; // Spotify allows up to 20 album IDs per call
    const parallelBatches = 5; // Number of simultaneous getAlbums() calls (matches 5 calls/second limit)
    const delayBetweenGroups = 1000; // 1 second delay to respect rate limit perfectly
    
    // Step 2: Processing albums for track data...
    
    // Process albums in groups of parallel batches
    for (let i = 0; i < allAlbums.length; i += (bulkBatchSize * parallelBatches)) {
      const parallelPromises = [];
      
      // Create up to 5 simultaneous batch calls
      for (let j = 0; j < parallelBatches; j++) {
        const startIndex = i + (j * bulkBatchSize);
        const endIndex = Math.min(startIndex + bulkBatchSize, allAlbums.length);
        
        if (startIndex < allAlbums.length) {
          const batch = allAlbums.slice(startIndex, endIndex);
          const albumIds = batch.map(album => album.id);
          
          // Create promise for this batch
          const batchPromise = (async () => {
            try {
              // Single call to get up to 20 albums with their tracks
              const { body: albumsData } = await spotifyApi.getAlbums(albumIds);
              totalApiCalls++; // Track bulk API call
              
              const batchResults = [];
              // Process each album from the bulk response
              albumsData.albums.forEach((albumData, index) => {
                if (albumData) {
                  const originalAlbum = batch[index];
                  
                  // Count album types for statistics
                  albumTypeStats[originalAlbum.album_type] = (albumTypeStats[originalAlbum.album_type] || 0) + 1;
                  
                  batchResults.push({
                    albumId: albumData.id,
                    albumName: albumData.name,
                    albumType: originalAlbum.album_type, // Use original album type from search
                    albumYear: albumData.release_date?.split('-')[0] || '',
                    albumImage: albumData.images?.[0]?.url || '',
                    tracks: albumData.tracks?.items || []
                  });
                }
              });
              
              return batchResults;
              
            } catch (err) {
              if (err.statusCode === 429) {
                const retryAfter = Math.min(err.headers['retry-after'] || 1, 5); // Cap retry at 5 seconds
                // Rate limited on batch, retrying...
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                
                // Retry the same batch
                try {
                  const { body: albumsData } = await spotifyApi.getAlbums(albumIds);
                  totalApiCalls++; // Track retry API call
                  const retryResults = [];
                  albumsData.albums.forEach((albumData, index) => {
                    if (albumData) {
                      const originalAlbum = batch[index];
                      albumTypeStats[originalAlbum.album_type] = (albumTypeStats[originalAlbum.album_type] || 0) + 1;
                      
                      retryResults.push({
                        albumId: albumData.id,
                        albumName: albumData.name,
                        albumType: originalAlbum.album_type,
                        albumYear: albumData.release_date?.split('-')[0] || '',
                        albumImage: albumData.images?.[0]?.url || '',
                        tracks: albumData.tracks?.items || []
                      });
                    }
                  });
                  return retryResults;
                } catch (retryErr) {
                  // Skipping failed batch...
                  return []; // Return empty array for failed batch
                }
              } else {
                // Error in batch, skipping...
                return []; // Return empty array for failed batch
              }
            }
          })();
          
          parallelPromises.push(batchPromise);
        }
      }
      
      // Wait for all parallel batches in this group to complete
      const groupResults = await Promise.all(parallelPromises);
      
      // Flatten and add all results
      groupResults.forEach(batchResults => {
        albumsWithTracks.push(...batchResults);
      });
      
      // Small delay between groups (except for the last group)
      if (i + (bulkBatchSize * parallelBatches) < allAlbums.length) {
        await delay(delayBetweenGroups);
      }
    }

    // Step 3: Analyze collaborations across all tracks
    const collaboratorMap = new Map(); // collaboratorId -> { name, count, tracks, albums }
    let totalTracks = 0;

    // Helper function to normalize track names for deduplication
    const normalizeTrackName = (name) => {
      return name
        .toLowerCase()
        .replace(/\s*\(feat\.?\s+[^)]+\)/gi, '') // Remove (feat. Artist)
        .replace(/\s*\(with\s+[^)]+\)/gi, '')   // Remove (with Artist)
        .replace(/\s*feat\.?\s+[^-]+/gi, '')    // Remove feat. Artist
        .replace(/\s*with\s+[^-]+/gi, '')      // Remove with Artist
        .replace(/[^\w\s]/g, '')               // Remove special characters
        .replace(/\s+/g, ' ')                  // Normalize whitespace
        .trim();
    };

    albumsWithTracks.forEach(albumData => {
      albumData.tracks.forEach(track => {
        // IMPORTANT FIX: Only analyze tracks where the target artist actually appears
        const targetArtistOnTrack = track.artists.some(artist => artist.id === artistId);
        
        // Skip tracks where the target artist doesn't appear (fixes "appears_on" issue)
        if (!targetArtistOnTrack) {
          if (albumData.albumType === 'appears_on') {
            // Skipping track - target artist not present
          }
          return;
        }
        
        // Processing track for collaborations
        
        totalTracks++;
        
        // Find all OTHER artists on this track (actual collaborators)
        track.artists.forEach(artist => {
          if (artist.id && artist.id !== artistId) {
            if (!collaboratorMap.has(artist.id)) {
              collaboratorMap.set(artist.id, {
                id: artist.id,
                name: artist.name,
                count: 0,
                tracks: [],
                uniqueTracks: new Map(), // For deduplication
                uniqueAlbumNames: new Set(), // Simple unique album name tracking
                spotifyUri: artist.uri,
                images: artist.images || [] // Add artist images from track data
              });
            }
            
            const collaborator = collaboratorMap.get(artist.id);
            const normalizedName = normalizeTrackName(track.name);
            
            // Check if we already have this track (by normalized name)
            if (!collaborator.uniqueTracks.has(normalizedName)) {
              // This is a new unique track
              collaborator.count++;
              const trackInfo = {
                // Core track info (NewTrackTable compatible)
                name: track.name,
                id: track.id,
                artist: track.artists.map(a => a.name).join(', '), // Comma-separated string
                artists: track.artists.map(a => ({ // Full artist objects
                  id: a.id,
                  name: a.name,
                  uri: a.uri
                })),
                album: albumData.albumName,
                album_image: albumData.albumImage,
                albumId: albumData.albumId,
                albumType: albumData.albumType,
                release_year: albumData.albumYear,
                year: albumData.albumYear, // Keeping both for compatibility
                duration_ms: track.duration_ms,
                uri: track.uri,
                // Internal deduplication data
                normalizedName: normalizedName
              };
              
              collaborator.tracks.push(trackInfo);
              collaborator.uniqueTracks.set(normalizedName, trackInfo);
              
              // Add album name to unique album set (Set automatically handles duplicates)
              collaborator.uniqueAlbumNames.add(albumData.albumName);
            } else {
              // This is a duplicate track - still add the album name
              collaborator.uniqueAlbumNames.add(albumData.albumName);
              
              // Optionally, prefer the track from the main album (not deluxe/collector's edition)
              const existingTrack = collaborator.uniqueTracks.get(normalizedName);
              const currentAlbum = albumData.albumName.toLowerCase();
              const existingAlbum = existingTrack.album.toLowerCase();
              
              // Prefer non-deluxe/collector's editions
              const isCurrentMainEdition = !currentAlbum.includes('deluxe') && 
                                         !currentAlbum.includes('collector') && 
                                         !currentAlbum.includes('special') &&
                                         !currentAlbum.includes('extended');
              const isExistingMainEdition = !existingAlbum.includes('deluxe') && 
                                          !existingAlbum.includes('collector') && 
                                          !existingAlbum.includes('special') &&
                                          !existingAlbum.includes('extended');
              
              if (isCurrentMainEdition && !isExistingMainEdition) {
                // Replace with the main edition version
                const trackIndex = collaborator.tracks.findIndex(t => t.normalizedName === normalizedName);
                if (trackIndex !== -1) {
                  collaborator.tracks[trackIndex] = {
                    // Core track info (NewTrackTable compatible)
                    name: track.name,
                    id: track.id,
                    artist: track.artists.map(a => a.name).join(', '),
                    artists: track.artists.map(a => ({
                      id: a.id,
                      name: a.name,
                      uri: a.uri
                    })),
                    album: albumData.albumName,
                    album_image: albumData.albumImage,
                    albumId: albumData.albumId,
                    albumType: albumData.albumType,
                    release_year: albumData.albumYear,
                    year: albumData.albumYear,
                    duration_ms: track.duration_ms,
                    uri: track.uri,
                    // Internal deduplication data
                    normalizedName: normalizedName
                  };
                  collaborator.uniqueTracks.set(normalizedName, collaborator.tracks[trackIndex]);
                }
              }
            }
          }
        });
      });
    });

    // Step 4: Fetch artist images for collaborators
    let collaboratorsData = Array.from(collaboratorMap.values())
      .filter(collab => collab.count >= minCollaborations);
    
    // Fetch artist details (including images) for all collaborators in batches
    if (collaboratorsData.length > 0) {
      // Step 4: Fetching collaborator images...
      
      const artistIds = collaboratorsData.map(collab => collab.id).filter(id => id);
      
      // Fetch artist details in batches of 50 (Spotify API limit)
      for (let i = 0; i < artistIds.length; i += 50) {
        const batch = artistIds.slice(i, i + 50);
        try {
          const { body } = await spotifyApi.getArtists(batch);
          totalApiCalls++; // Track artist details API call
          
          body.artists.forEach(artist => {
            const collaborator = collaboratorsData.find(c => c.id === artist.id);
            if (collaborator && artist.images) {
              collaborator.images = artist.images;
            }
          });
          
          // Small delay between batches to avoid rate limiting
          if (i + 50 < artistIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (err) {
          console.warn(`[Collaborators] Failed to fetch images for batch ${i}-${i+50}:`, err.message);
          // Continue with other batches even if one fails
        }
      }
    }
    
    // Step 5: Build final response
    const collaborators = collaboratorsData
      .map(collab => ({
        id: collab.id,
        name: collab.name,
        count: collab.count,
        tracks: collab.tracks.map(track => ({
          // NewTrackTable compatible format
          name: track.name,
          id: track.id,
          artist: track.artist,
          artists: track.artists,
          album: track.album,
          album_image: track.album_image,
          albumId: track.albumId,
          albumType: track.albumType,
          release_year: track.release_year,
          year: track.year,
          duration_ms: track.duration_ms,
          uri: track.uri
        })), // Remove internal deduplication data
        albums: Array.from(collab.uniqueAlbumNames), // List of unique album names
        albumCount: collab.uniqueAlbumNames.size, // Count of unique albums
        spotifyUri: collab.spotifyUri,
        images: collab.images || [] // Include artist images
      }))
      .sort((a, b) => b.count - a.count); // Sort by collaboration count
    
    // Analysis completed successfully
    console.log(`✅ Collaborators analysis completed: Found ${collaborators.length} collaborators across ${allAlbums.length} albums (${totalApiCalls} API calls)`);

    res.json({
      collaborators,
      totalAlbums: allAlbums.length,
      totalTracks,
      albumTypes: albumTypeStats, // Include breakdown by album type
      analysisParams: {
        includeAllTypes: true,
        minCollaborations
      }
    });

  } catch (err) {
    console.error('Error analyzing artist collaborators:', err);
    res.status(500).json({ error: 'Failed to analyze artist collaborators' });
  }
});

// --- Spotify Follow/Unfollow/Check Endpoints ---
app.get('/me/following/artist/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
    const isFollowing = await spotifyService.isFollowingArtist(artistId);
    res.json({ isFollowing });
  } catch (err) {
    console.error('Error checking follow status:', err);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

app.put('/me/following/artist/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
    await spotifyService.followArtist(artistId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error following artist:', err);
    res.status(500).json({ error: 'Failed to follow artist' });
  }
});

app.delete('/me/following/artist/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
    await spotifyService.unfollowArtist(artistId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error unfollowing artist:', err);
    res.status(500).json({ error: 'Failed to unfollow artist' });
  }
});

// Get all followed artists
app.get('/me/following/artists', async (req, res) => {
  try {
    const { body } = await spotifyApi.getFollowedArtists({ limit: 50 });
    globalApiCallCounter.spotify++;
    globalApiCallCounter.total++;
    res.json({ artists: body.artists.items });
  } catch (err) {
    console.error('Error fetching followed artists:', err);
    res.status(500).json({ error: 'Failed to fetch followed artists' });
  }
});

// Search artists
app.get('/spotify/search-artists', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query' });
  try {
    const { body } = await spotifyApi.searchArtists(q, { limit: 10 });
    res.json({ artists: body.artists.items });
  } catch (err) {
    console.error('Error searching artists:', err);
    res.status(500).json({ error: 'Failed to search artists' });
  }
});

// Enhanced artist search endpoint for navigation (called from frontend)
app.get('/api/artist-search-navigate', async (req, res) => {
  const { artistName } = req.query;
  if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
  
  try {
    console.log(`[Artist Search Navigate] Searching for artist: ${artistName}`);
    
    // 1. Search Spotify for the artist
    const { body } = await spotifyApi.searchArtists(artistName, { limit: 5 });
    const spotifyArtists = body.artists.items;
    
    if (spotifyArtists.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No artists found',
        params: [`name=${encodeURIComponent(artistName)}`]
      });
    }
    
    // Get the most relevant artist (first result)
    const bestMatch = spotifyArtists[0];
    console.log(`[Artist Search Navigate] Best match: ${bestMatch.name} (ID: ${bestMatch.id})`);
    
    // 2. Try to get Ticketmaster ID for concerts
    let ticketmasterId = null;
    let ticketmasterSource = 'not_found';
    try {
      console.log(`[Artist Search Navigate] 🔍 Making Ticketmaster API call for "${artistName}"`);
      const ticketmasterData = await ticketmasterService.searchArtist(artistName);
      if (ticketmasterData._embedded?.attractions) {
        const exactMatch = ticketmasterData._embedded.attractions.find(
          a => a.name.toLowerCase() === artistName.toLowerCase()
        );
        if (exactMatch) {
          ticketmasterId = exactMatch.id;
          ticketmasterSource = 'api_call';
          console.log(`[Artist Search Navigate] ✅ Found Ticketmaster ID via API call: ${ticketmasterId}`);
        } else {
          console.log(`[Artist Search Navigate] ⚠️ No exact match found in Ticketmaster API results for "${artistName}"`);
        }
      }
    } catch (ticketmasterErr) {
      console.log(`[Artist Search Navigate] ❌ Ticketmaster API call failed:`, ticketmasterErr.message);
    }
    
    // 3. Build navigation parameters
    const params = [`name=${encodeURIComponent(artistName)}`];
    
    if (bestMatch.id) {
      params.push(`spotifyId=${encodeURIComponent(bestMatch.id)}`);
    }
    
    if (ticketmasterId) {
      params.push(`ticketmasterId=${encodeURIComponent(ticketmasterId)}`);
    }
    
    console.log(`[Artist Search Navigate] Navigation params: ${params.join('&')}`);
    
    res.json({ 
      success: true,
      artist: bestMatch,
      ticketmasterId,
      ticketmasterSource, // Include the source of the Ticketmaster ID
      params: params,
      navigationUrl: `/artist?${params.join('&')}`
    });
    
  } catch (err) {
    console.error(`[Artist Search Navigate] Error searching for artist ${artistName}:`, err);
    res.status(500).json({ 
      error: 'Failed to search artist',
      fallbackParams: [`name=${encodeURIComponent(artistName)}`]
    });
  }
});



// Search artists on Ticketmaster
app.get('/ticketmaster/search-artist', async (req, res) => {
  const { artistName } = req.query;
  if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
  try {
    console.log(`[Ticketmaster Search] 🔍 Making API call to search for artist: "${artistName}"`);
    const data = await ticketmasterService.searchArtist(artistName);
    const attractions = data._embedded?.attractions || [];
    
    // Find the best match (exact name match first, then similar names)
    const exactMatch = attractions.find(a => 
      a.type === 'attraction' && 
      a.id && 
      a.name.toLowerCase() === artistName.toLowerCase()
    );
    
    const similarMatches = attractions.filter(a => 
      a.type === 'attraction' && 
      a.id && 
      a.name.toLowerCase().includes(artistName.toLowerCase()) &&
      a.name.toLowerCase() !== artistName.toLowerCase()
    );
    
    // Create enhanced response with main artist and related attractions
    const enhancedData = {
      ...data,
      mainArtist: exactMatch ? {
        name: exactMatch.name,
        id: exactMatch.id,
        ticketmasterId: exactMatch.id,
        type: exactMatch.type,
        classifications: exactMatch.classifications
      } : null,
      relatedAttractions: similarMatches.map(a => ({
        name: a.name,
        id: a.id,
        ticketmasterId: a.id,
        type: a.type,
        classifications: a.classifications
      })),
      allAttractions: attractions.filter(a => a.type === 'attraction' && a.id).map(a => ({
        name: a.name,
        id: a.id,
        ticketmasterId: a.id,
        type: a.type
      }))
    };
    
    console.log(`[Ticketmaster Search] 🎵 Enhanced response created:`, {
      mainArtist: enhancedData.mainArtist,
      relatedAttractions: enhancedData.relatedAttractions.length,
      totalAttractions: enhancedData.allAttractions.length
    });
    
    // Increment counter for artist search
    globalApiCallCounter.ticketmasterArtistSearch++;
    globalApiCallCounter.total++;
    
    console.log(`[Ticketmaster Search] ✅ API call completed for "${artistName}": ${enhancedData.allAttractions.length} attractions with IDs found`);
    res.json(enhancedData);
  } catch (err) {
    console.error('Error searching artist:', err);
    res.status(500).json({ error: 'Failed to search artist' });
  }
});

app.get('/discogs/artist-profile', async (req, res) => {
  const { name } = req.query;

  if (!name) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const result = await getArtistBio(name);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result);
  } catch (e) {
    console.error('Error fetching profile:', e);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- Discogs: Get all albums for an artist (paginated) ---
app.get('/discogs/artist/:name', async (req, res) => {
  const artistName = req.params.name;
  if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const albums = await getAllAlbumsByArtistName(artistName);
    res.json({ albums });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch albums', details: err.message });
  }
});

// --- Discogs: Get album-> [genre, style] map for an artist ---
app.get('/discogs/artist/:name/genre-style-map', async (req, res) => {
  const artistName = req.params.name;
  if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
  
  try {
    console.log(`[Discogs] Fetching genre/style map for artist: "${artistName}"`);
    const map = await getAlbumGenreStyleMapByArtistName(artistName);
    
    if (!map || Object.keys(map).length === 0) {
      console.log(`[Discogs] No genre/style data found for artist: "${artistName}"`);
      return res.json({ map: {}, message: 'No genre/style information available for this artist' });
    }
    
    console.log(`[Discogs] Successfully fetched genre/style map for "${artistName}" with ${Object.keys(map).length} albums`);
    res.json({ map });
    
  } catch (err) {
    console.error(`[Discogs] Error fetching genre/style map for "${artistName}":`, err);
    
    // Provide more specific error messages based on error type
    if (err.message.includes('429')) {
      res.status(429).json({ 
        error: 'Discogs API rate limit exceeded', 
        details: 'Too many requests to Discogs API. Please try again later.',
        retryAfter: 60 // Suggest waiting 1 minute
      });
    } else if (err.message.includes('404')) {
      res.status(404).json({ 
        error: 'Artist not found on Discogs', 
        details: 'This artist may not have any releases cataloged on Discogs.'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch genre/style map', 
        details: err.message,
        suggestion: 'This might be a temporary issue. Please try again later.'
      });
    }
  }
});

// --- Discogs: Get artist's primary genre ---
app.get('/discogs/artist/:name/primary-genre', async (req, res) => {
  const artistName = req.params.name;
  if (!artistName) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const result = await getArtistPrimaryGenre(artistName);
    if (result.error) {
      res.status(404).json({ error: result.error });
    } else {
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch primary genre', details: err.message });
  }
});

// --- Discogs: Get artist name by ID ---
app.get('/discogs/artist-id/:id', async (req, res) => {
  const artistId = req.params.id;
  if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
  try {
    const authHeaders = {
      'User-Agent': process.env.DISCOGS_USER_AGENT,
      'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
    };
    
    const artistUrl = `https://api.discogs.com/artists/${artistId}`;
    const artistResponse = await axios.get(artistUrl, { headers: authHeaders });
    
    if (artistResponse.status !== 200) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    const artistData = artistResponse.data;
    res.json({ 
      id: artistId,
      name: artistData.name,
      realName: artistData.realname || null
    });
  } catch (err) {
    console.error('Discogs API Error:', err);
    res.status(500).json({ error: 'Failed to fetch artist by ID', details: err.message });
  }
});

// --- Discogs: Get label name by ID ---
app.get('/discogs/label-id/:id', async (req, res) => {
  const labelId = req.params.id;
  if (!labelId) return res.status(400).json({ error: 'Missing label ID' });
  try {
    const authHeaders = {
      'User-Agent': process.env.DISCOGS_USER_AGENT,
      'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
    };
    
    const labelUrl = `https://api.discogs.com/labels/${labelId}`;
    const labelResponse = await axios.get(labelUrl, { headers: authHeaders });
    
    if (labelResponse.status !== 200) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    const labelData = labelResponse.data;
    res.json({ 
      id: labelId,
      name: labelData.name
    });
  } catch (err) {
    console.error('Discogs API Error:', err);
    res.status(500).json({ error: 'Failed to fetch label by ID', details: err.message });
  }
});

// --- Discogs: Get release name by ID ---
app.get('/discogs/release-id/:id', async (req, res) => {
  const releaseId = req.params.id;
  if (!releaseId) return res.status(400).json({ error: 'Missing release ID' });
  try {
    const authHeaders = {
      'User-Agent': process.env.DISCOGS_USER_AGENT,
      'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
    };
    
    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
    const releaseResponse = await axios.get(releaseUrl, { headers: authHeaders });
    
    if (releaseResponse.status !== 200) {
      return res.status(404).json({ error: 'Release not found' });
    }
    
    const releaseData = releaseResponse.data;
    res.json({ 
      id: releaseId,
      title: releaseData.title,
      artists: releaseData.artists || []
    });
  } catch (err) {
    console.error('Discogs API Error:', err);
    res.status(500).json({ error: 'Failed to fetch release by ID', details: err.message });
  }
});

// Global API call counter
let globalApiCallCounter = {
  spotify: 0,
  ticketmasterArtistSearch: 0,
  ticketmasterConcertSearch: 0,
  total: 0
};

// Reset API call counter
app.post('/reset-api-counter', (req, res) => {
  globalApiCallCounter = {
    spotify: 0,
    ticketmasterArtistSearch: 0,
    ticketmasterConcertSearch: 0,
    total: 0
  };
  res.json({ message: 'API counter reset', counter: globalApiCallCounter });
});

// Get API call counter
app.get('/api-counter', (req, res) => {
  res.json(globalApiCallCounter);
});

// Optimized batch endpoint using single Ticketmaster API call
app.post('/concerts/events/optimized-batch', async (req, res) => {
  const artistIds = req.body.artistIds;
  if (!Array.isArray(artistIds) || artistIds.length === 0) {
    return res.status(400).json({ error: 'artistIds required' });
  }
  
  try {
    // Make a single API call to Ticketmaster with all artist IDs
    const data = await ticketmasterService.getEventsByMultipleArtistIds(artistIds);
    const events = data._embedded?.events || [];
    const concertApiCalls = data.apiCallCount || 0;
    
    // Increment counter for concert search API calls
    globalApiCallCounter.ticketmasterConcertSearch += concertApiCalls;
    globalApiCallCounter.total += concertApiCalls;
    
    // Add artist info to each event (match by attraction ID)
    const eventsWithArtistInfo = events.map(event => {
      // Find which artist this event belongs to by checking attractions
      const eventArtistId = event._embedded?.attractions?.[0]?.id;
      return {
        ...event,
        artistId: eventArtistId || null
      };
    });
    
    res.json({ 
      concerts: eventsWithArtistInfo,
      totalEvents: eventsWithArtistInfo.length,
      totalArtists: artistIds.length,
      apiCallSummary: globalApiCallCounter
    });
  } catch (err) {
    console.error('Optimized batch error:', err);
    res.status(500).json({ error: 'Failed to fetch optimized batch concerts', details: err.message });
  }
});

// Test endpoint for batch functionality (easy browser testing)
app.get('/test-batch', async (req, res) => {
  try {
    // Get real artist IDs from followed artists (dynamic, no hardcoded IDs)
    let artistIds = [];
    
    try {
      // Fetch followed artists from Spotify to get real Ticketmaster IDs
      const { body } = await spotifyApi.getFollowedArtists({ limit: 10 });
      const followedArtists = body.artists.items;
      
      // Found followed artists
      
      // For each followed artist, search on Ticketmaster to get their ID
      for (const artist of followedArtists) { // Increased from 5 to 10 for testing
        try {
          const ticketmasterData = await ticketmasterService.searchArtist(artist.name);
          const attractions = ticketmasterData._embedded?.attractions || [];
          const musicArtists = attractions.filter(attraction => {
            const isMusic = attraction.classifications &&
              attraction.classifications.some(classification =>
                classification.segment && classification.segment.name === 'Music'
              );
            return isMusic;
          });
          
          if (musicArtists.length > 0) {
            artistIds.push(musicArtists[0].id);
            console.log(`Found Ticketmaster ID for ${artist.name}: ${musicArtists[0].id}`);
          }
        } catch (err) {
          console.log(`Could not find Ticketmaster ID for ${artist.name}:`, err.message);
        }
      }
    } catch (err) {
      console.log('Error fetching followed artists:', err.message);
    }
    
    if (artistIds.length === 0) {
      return res.json({ 
        message: 'No artist IDs found. Make sure you are logged in to Spotify and have followed artists.',
        error: 'Could not fetch real artist IDs'
      });
    }
    
    // Testing batch endpoint
    
    // Fetch concerts for each artist using the optimized batch method
    const data = await ticketmasterService.getEventsByMultipleArtistIds(artistIds);
    const events = data._embedded?.events || [];
    
    // Events found
    
    // Add artist info to each event
    const eventsWithArtistInfo = events.map(event => {
      const eventArtistId = event._embedded?.attractions?.[0]?.id;
      return {
        ...event,
        artistId: eventArtistId || null
      };
    });
    
    res.json({ 
      message: 'Optimized batch test successful!',
      totalArtists: artistIds.length,
      totalConcerts: eventsWithArtistInfo.length,
      artistIds: artistIds,
      concerts: eventsWithArtistInfo,
      debug: {
        ticketmasterRequest: `attractionId=${artistIds.join(',')}`,
        eventsPerArtist: eventsWithArtistInfo.reduce((acc, event) => {
          const artistId = event.artistId;
          acc[artistId] = (acc[artistId] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('Batch test error:', err);
    res.status(500).json({ error: 'Batch test failed', details: err.message });
  }
});

// MBID lookup endpoint with wait times between API calls
app.post('/mbid-lookup', async (req, res) => {
  try {
    const { tracks } = req.body;
    
    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Missing tracks array' });
    }


    
    // Helper function to add wait time between API calls
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const results = [];
    
    // Process tracks sequentially with wait times between API calls
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      
      // Check if we have Spotify ID for this track
      if (!track.id) {
        
        results.push({
          track,
          mbid: null,
          success: false,
          reason: 'No Spotify ID'
        });
        continue;
      }
      
      let mbid = null;
      let mbidWasCached = false;
      
      try {
        // Step 1: Get ISRC from Spotify (if we don't have it)
        let isrc = null;
        
        
        try {
          const { body } = await spotifyApi.getTrack(track.id);
          isrc = body && body.external_ids && body.external_ids.isrc ? body.external_ids.isrc : null;
          
        } catch (spotifyError) {
        }
        
        // Wait 500ms after ISRC fetch
        await wait(500);
        
        // Step 2: Use ISRC to find MBID from MusicBrainz
        if (isrc) {
          console.log(`[MBID Lookup] Searching MusicBrainz for ISRC: ${isrc}`);
          
          try {
            const mbidRes = await axios.get(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`, {
              headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
            });
            
            if (mbidRes.ok) {
              const mbidData = mbidRes.data;
              mbid = mbidData.recordings && mbidData.recordings.length > 0 ? mbidData.recordings[0].id : null;
              
              if (mbid) {
    
                mbidWasCached = false;
              } else {
                console.log(`[MBID Lookup] No MBID found for ISRC: ${isrc}`);
              }
            }
          } catch (mbidError) {
            console.log(`[MBID Lookup] MusicBrainz lookup failed for ${track.name}:`, mbidError.message);
          }
        } else {
          
        }
        
        // Wait 500ms after MBID lookup
        await wait(500);
        
        if (mbid) {
          results.push({
            track,
            mbid,
            success: true,
            fromCache: mbidWasCached
          });
        } else {
          results.push({
            track,
            mbid: null,
            success: false,
            reason: 'No MBID found'
          });
        }
        
      } catch (error) {
        console.log(`[MBID Lookup] MBID lookup failed for track ${track.name}:`, error.message);
        results.push({
          track,
          mbid: null,
          success: false,
          reason: error.message
        });
      }
      
      // Wait between tracks (except for the last one)
      if (i < tracks.length - 1) {
        const trackWaitTime = 500; // 500ms between tracks

        await wait(trackWaitTime);
      }
    }
    
    
    res.json({
      success: true,
      results,
      summary: {
        total: tracks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    console.error('[MBID Lookup] Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform MBID lookup',
      details: error.message 
    });
  }
});

// Global flag to track if analysis should be stopped
let shouldStopAnalysis = false;

// Endpoint to stop ongoing analysis
app.post('/stop-analysis', (req, res) => {
  shouldStopAnalysis = true;
  console.log('[Server] Stop signal received - will stop analysis at next batch');
  res.json({ success: true, message: 'Stop signal received' });
});

// Wrapped analysis endpoint with batch API calls for AcousticBrainz
app.post('/wrapped-analysis', async (req, res) => {
  try {
    const { tracks } = req.body;
    
    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Missing tracks array' });
    }

    // Reset stop flag for new analysis
    shouldStopAnalysis = false;

    // Track all API calls made in the entire process
    let totalApiCalls = 0;
    let spotifyApiCalls = 0;
    let musicbrainzApiCalls = 0;
    let acousticbrainzApiCalls = 0;

    // Helper function to add wait time between API calls
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Helper function to fetch batch analysis from AcousticBrainz
    const fetchBatchAnalysis = async (mbids, analysisType) => {
      try {
        const mbidString = mbids.join(';');
        const url = `https://acousticbrainz.org/api/v1/${analysisType}?recording_ids=${mbidString}`;
        
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
        });
        
        return {
          data: response.data,
          success: true
        };
      } catch (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }
    };

    // Extract MBIDs from tracks (frontend already filtered for MBIDs)
    const mbids = tracks.map(track => track.mbid);
    
    // Split MBIDs into batches of 25
    const batchSize = 25; // AcousticBrainz batch size (optimized: 25 MBIDs per batch - tested and stable)
    const batches = [];
    
    // Split MBIDs into batches
    for (let i = 0; i < mbids.length; i += batchSize) {
      const batch = mbids.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    // Process each batch completely (high-level + low-level) before moving to next
    const allResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      // Check if analysis should be stopped
      if (shouldStopAnalysis) {
        console.log(`[Wrapped Analysis] Analysis stopped by user at batch ${i + 1}/${batches.length}`);
        return res.json({
          success: false,
          error: 'Analysis stopped by user',
          results: [],
          summary: 'Analysis was cancelled'
        });
      }
      
      const batch = batches[i];
      
      // Fetch high-level analysis for this batch
      const highLevelResult = await fetchBatchAnalysis(batch, 'high-level');
      
      // Check again after high-level
      if (shouldStopAnalysis) {
        console.log(`[Wrapped Analysis] Analysis stopped by user after high-level batch ${i + 1}`);
        return res.json({
          success: false,
          error: 'Analysis stopped by user',
          results: [],
          summary: 'Analysis was cancelled'
        });
      }
      
      // Wait 1 second between high-level and low-level for same batch
      await wait(1000);
      
      // Fetch low-level analysis for this batch
      const lowLevelResult = await fetchBatchAnalysis(batch, 'low-level');
      
      // Check again after low-level
      if (shouldStopAnalysis) {
        console.log(`[Wrapped Analysis] Analysis stopped by user after low-level batch ${i + 1}`);
        return res.json({
          success: false,
          error: 'Analysis stopped by user',
          results: [],
          summary: 'Analysis was cancelled'
        });
      }
      
      // Store both results for this batch
      allResults.push({
        batchIndex: i,
        highLevel: highLevelResult,
        lowLevel: lowLevelResult
      });
      
      // Wait between batches (except for the last one)
      if (i < batches.length - 1) {
        await wait(1000); // 1 second between batches
      }
    }
    
    // Map batch results back to individual tracks
    const results = [];
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      // Find the batch index for this track
      const mbidIndex = mbids.indexOf(track.mbid);
      const batchIndex = Math.floor(mbidIndex / batchSize);
      
      // Get high-level and low-level data for this track
      const batchResult = allResults[batchIndex];
      
      let highLevel = null;
      let lowLevel = null;
      let success = false;
      
      if (batchResult && batchResult.highLevel.success && batchResult.lowLevel.success) {
        // AcousticBrainz returns data with actual MBID keys, not numeric indices
        if (batchResult.highLevel.data && batchResult.highLevel.data[track.mbid]) {
          highLevel = batchResult.highLevel.data[track.mbid];
        }
        
        if (batchResult.lowLevel.data && batchResult.lowLevel.data[track.mbid]) {
          lowLevel = batchResult.lowLevel.data[track.mbid];
        }
        
        success = highLevel && lowLevel;
      }
      
      results.push({
        track,
        highLevel,
        lowLevel,
        success,
        reason: success ? null : 'Failed to fetch analysis data'
      });
    }
    
    const successfulCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    // Calculate total API calls (this endpoint only handles AcousticBrainz)
    acousticbrainzApiCalls = batches.length * 2; // high-level + low-level for each batch
    totalApiCalls = acousticbrainzApiCalls;
    
    // FINAL SUMMARY
    console.log(`[Wrapped Analysis] ===== ANALYSIS COMPLETE =====`);
    console.log(`[Wrapped Analysis] API Calls Breakdown:`);
    console.log(`[Wrapped Analysis]   • Spotify API: ${spotifyApiCalls} (ISRC fetching)`);
    console.log(`[Wrapped Analysis]   • MusicBrainz API: ${musicbrainzApiCalls} (MBID lookup)`);
    console.log(`[Wrapped Analysis]   • AcousticBrainz API: ${acousticbrainzApiCalls} (${batches.length} high-level + ${batches.length} low-level)`);
    console.log(`[Wrapped Analysis] Total API calls: ${spotifyApiCalls + musicbrainzApiCalls + acousticbrainzApiCalls}`);
    console.log(`[Wrapped Analysis] ==========================================`);
    
    res.json({
      success: true,
      results,
      summary: {
        total: tracks.length,
        successful: successfulCount,
        failed: failedCount,
        batchesProcessed: batches.length,
        totalApiCalls: batches.length * 2
      }
    });
    
  } catch (error) {
    console.error('[Wrapped Analysis] Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform wrapped analysis',
      details: error.message 
    });
  }
});

// Get album contributors from Discogs
app.get('/album-contributors', async (req, res) => {
  const { albumTitle, artistName } = req.query;
  
  console.log(`\n🔍 Getting contributors for "${albumTitle}" by "${artistName}"`);
  
  if (!albumTitle || !artistName) {
    return res.status(400).json({ error: 'Missing album title or artist name' });
  }

  try {
    // Search Discogs for the album with fallback strategies
    let searchData = null;
    let searchUrl = null;
    let searchStrategy = 'exact';
    let searchAttempts = 0;
    
    const authHeaders = {
      'User-Agent': process.env.DISCOGS_USER_AGENT,
      'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
    };

    // Strategy 1: Exact search with original title
    searchAttempts++;
    searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(albumTitle)}&artist=${encodeURIComponent(artistName)}`;
    let searchResponse = await fetch(searchUrl, { headers: authHeaders });
    
    if (!searchResponse.ok) {
      throw new Error(`Discogs search failed with status: ${searchResponse.status}`);
    }

    searchData = await searchResponse.json();
    
    // Strategy 2: If no results, try without special characters and parentheses
    if (!searchData.results || searchData.results.length === 0) {
      const cleanTitle = albumTitle
        .replace(/[\(\)\[\]\{\}]/g, '') // Remove parentheses and brackets
        .replace(/remastered|deluxe|expanded|anniversary/gi, '') // Remove common version words
        .trim();
      
      if (cleanTitle !== albumTitle) {
        searchAttempts++;
        searchStrategy = 'cleaned';
        searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(artistName)}`;
        searchResponse = await fetch(searchUrl, { headers: authHeaders });
        
        if (searchResponse.ok) {
          searchData = await searchResponse.json();
        }
      }
    }
    
    // Strategy 3: If still no results, try broader search with just artist and album name
    if (!searchData.results || searchData.results.length === 0) {
      searchAttempts++;
      searchStrategy = 'broad';
      searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName + ' ' + albumTitle)}&type=release`;
      searchResponse = await fetch(searchUrl, { headers: authHeaders });
      
      if (searchResponse.ok) {
        searchData = await searchResponse.json();
      }
    }
    
                    // Strategy 4: If still no results, try searching by artist only and filter by title
                if (!searchData?.results || searchData.results.length === 0) {
      searchAttempts++;
                  searchStrategy = 'artist_only';
                  searchUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artistName)}&type=release`;
                  searchResponse = await fetch(searchUrl, { headers: authHeaders });

                  if (searchResponse.ok) {
                    searchData = await searchResponse.json();
                    
                    if (searchData.results && searchData.results.length > 0) {
                      // Filter results to find albums with matching titles
                      const filteredResults = searchData.results.filter(result => {
                        const resultTitle = result.title.toLowerCase();
                        const searchTitle = albumTitle.toLowerCase();
                        return resultTitle.includes(searchTitle) || searchTitle.includes(resultTitle);
                      });
                      
                      if (filteredResults.length > 0) {
                        searchData.results = filteredResults;
                      }
                    }
                  }
                }
                
                // Strategy 5: Try searching with artist name in title pattern
                if (!searchData?.results || searchData.results.length === 0) {
      searchAttempts++;
                  searchStrategy = 'artist_in_title';
                  const artistInTitleQuery = `${artistName} - ${albumTitle}`;
                  searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistInTitleQuery)}&type=release`;
                  searchResponse = await fetch(searchUrl, { headers: authHeaders });

                  if (searchResponse.ok) {
                    searchData = await searchResponse.json();
                  }
                }
    
    if (!searchData?.results || searchData.results.length === 0) {
      return res.json({ contributors: [], message: 'No album found' });
    }
    
    // Filter results to find exact or close matches with better validation
    const relevantResults = searchData.results.filter(result => {
      const resultTitle = result.title.toLowerCase();
      const resultArtist = result.artist?.toLowerCase() || '';
      const searchTitle = albumTitle.toLowerCase();
      const searchArtist = artistName.toLowerCase();
      
      // Special case: If artist is undefined/missing, check if artist is embedded in title
      if (!result.artist || result.artist === 'undefined') {
        const titleContainsAlbum = resultTitle.includes(searchTitle);
        
        // Check if title follows the pattern "Artist - Album" or "Artist: Album"
        const artistInTitlePatterns = [
          `${searchArtist.toLowerCase()} - `,
          `${searchArtist.toLowerCase()}: `,
          `${searchArtist.toLowerCase()} = `,
          `${searchArtist.toLowerCase()} – `, // en dash
          `${searchArtist.toLowerCase()} — `  // em dash
        ];
        
        const titleStartsWithArtist = artistInTitlePatterns.some(pattern => 
          resultTitle.toLowerCase().startsWith(pattern)
        );
        
        // More strict check: artist name must appear in title in a meaningful way
        const artistWords = searchArtist.toLowerCase().split(' ').filter(word => word.length > 2);
        const titleWords = resultTitle.split(' ');
        const artistWordsInTitle = artistWords.filter(word => 
          titleWords.some(titleWord => titleWord.toLowerCase().includes(word))
        );
        const artistNameCoverage = artistWordsInTitle.length / artistWords.length;
        
        // More strict validation: require either exact pattern match OR high artist name coverage with album match
        return titleContainsAlbum && (titleStartsWithArtist || artistNameCoverage >= 0.7);
      }
      
      // Normal case: Both artist and title must match
      const artistMatch = resultArtist.includes(searchArtist) || searchArtist.includes(resultArtist);
      const titleMatch = resultTitle.includes(searchTitle) || searchTitle.includes(resultTitle);
      
      // Additional validation: reject obviously wrong results
      const isObviouslyWrong = 
        // Reject compilation/various artists albums unless explicitly searched
        (resultArtist.includes('various') && !searchArtist.includes('various')) ||
        (resultArtist.includes('compilation') && !searchArtist.includes('compilation')) ||
        // Reject if artist names are completely different lengths (likely wrong)
        (resultArtist && searchArtist && Math.abs(resultArtist.length - searchArtist.length) > 10) ||
        // Reject if title is completely different length (likely wrong)
        (Math.abs(resultTitle.length - searchTitle.length) > 20) ||
        // Reject if result has no artist and title doesn't contain album name
        (!resultArtist && !resultTitle.includes(searchTitle));
      
      return artistMatch && titleMatch && !isObviouslyWrong;
    });
    
    if (relevantResults.length === 0) {
      // If no exact matches, find the best partial match with stricter validation
      const bestMatch = searchData.results.find(result => {
        const resultTitle = result.title.toLowerCase();
        const resultArtist = result.artist?.toLowerCase() || '';
        const searchTitle = albumTitle.toLowerCase();
        const searchArtist = artistName.toLowerCase();
        
        // Special case: If artist is missing but title contains album name
        if (!result.artist || result.artist === 'undefined') {
          // Apply the same strict validation as above
          const titleContainsAlbum = resultTitle.includes(searchTitle);
          const artistWords = searchArtist.split(' ').filter(word => word.length > 2);
          const titleWords = resultTitle.split(' ');
          const artistWordsInTitle = artistWords.filter(word => 
            titleWords.some(titleWord => titleWord.toLowerCase().includes(word))
          );
          const artistNameCoverage = artistWordsInTitle.length / artistWords.length;
          
          return titleContainsAlbum && artistNameCoverage >= 0.7;
        }
        
        // Normal scoring for results with artists - require strong matches
        if (resultArtist) {
          const titleWords = searchTitle.split(' ').filter(word => word.length > 2);
          const artistWords = searchArtist.split(' ').filter(word => word.length > 2);
          
          const titleScore = titleWords.filter(word => resultTitle.includes(word)).length;
          const artistScore = artistWords.filter(word => resultArtist.includes(word)).length;
          
          // Require strong matches - at least 50% of words must match
          const titleMatch = titleWords.length > 0 && (titleScore / titleWords.length) >= 0.5;
          const artistMatch = artistWords.length > 0 && (artistScore / artistWords.length) >= 0.5;
          
          return titleMatch && artistMatch;
        }
        
        return false;
      });
      
      if (bestMatch) {
        relevantResults.push(bestMatch);
      }
    }
    
    if (relevantResults.length === 0) {
      return res.json({ contributors: [], message: 'No suitable album found' });
    }
    
    // Try multiple results until we find the correct album
    let album = null;
    let albumData = null;
    let attemptCount = 0;
    let fetchAttempts = 0;
    const maxAttempts = Math.min(5, relevantResults.length);
    
    for (let i = 0; i < maxAttempts; i++) {
      attemptCount++;
      album = relevantResults[i];
      
      const albumUrl = `https://api.discogs.com/releases/${album.id}`;
    let albumResponse = await fetch(albumUrl, { headers: authHeaders });
      fetchAttempts++;
    
                    if (!albumResponse.ok) {
        continue; // Try next result
      }

      try {
        albumData = await albumResponse.json();
        
        // Validate that this is the correct album
                const fetchedArtist = albumData.artists?.map(a => a.name).join(', ') || '';
                const fetchedTitle = albumData.title.toLowerCase();
                const searchArtistLower = artistName.toLowerCase();
                const searchTitleLower = albumTitle.toLowerCase();
                
                const artistMatches = fetchedArtist.toLowerCase().includes(searchArtistLower) || 
                                    searchArtistLower.includes(fetchedArtist.toLowerCase());
                const titleMatches = fetchedTitle.includes(searchTitleLower) || 
                                   searchTitleLower.includes(fetchedTitle);
                
        if (artistMatches && titleMatches) {
          console.log(`✅ Found album "${albumData.title}" by "${fetchedArtist}" (${albumData.year || 'Unknown year'})`);
          break; // Exit the loop, we found the right album
        } else {
          albumData = null; // Reset for next attempt
          continue;
        }
        
                    } catch (error) {
        continue; // Try next result
      }
    }
    
    // Check if we found a valid album
    if (!albumData) {
      return res.json({ 
        contributors: [], 
        message: `No matching album found. Tried ${attemptCount} results but none matched "${albumTitle}" by "${artistName}"`,
        error: 'No valid album match found'
      });
    }

    
                    // Extract contributors information
                const contributors = {
                  albumInfo: {
                    title: albumData.title,
                    artist: albumData.artists?.map(a => a.name).join(', ') || artistName,
                    year: albumData.year,
                    country: albumData.country,
                    released: albumData.released
                  },
                  searchInfo: {
                    originalSearch: {
                      albumTitle: albumTitle,
                      artistName: artistName
                    },
                    searchStrategy: searchStrategy,
                    artistWasMissing: !album.artist || album.artist === 'undefined',
                    extractedArtistFromTitle: (!album.artist || album.artist === 'undefined') ? 
                      (() => {
                        // Try to extract artist from title patterns like "Artist - Album"
                        const title = album.title.toLowerCase();
                        const searchArtist = artistName.toLowerCase();
                        
                        const patterns = [
                          `${searchArtist} - `,
                          `${searchArtist}: `,
                          `${searchArtist} = `,
                          `${searchArtist} – `, // en dash
                          `${searchArtist} — `  // em dash
                        ];
                        
                        for (const pattern of patterns) {
                          if (title.startsWith(pattern)) {
                            return searchArtist; // Return the original search artist name
                          }
                        }
                        
                        // If no pattern match, check if artist name appears in title
                        if (title.includes(searchArtist)) {
                          return searchArtist;
                        }
                        
                        return null;
                      })() : null
                  },
      trackContributors: [],
      overallContributors: [],
      labels: [],
      companies: []
    };

    // Process track listing with contributors
    if (albumData.tracklist && albumData.tracklist.length > 0) {
      contributors.trackContributors = albumData.tracklist.map(track => ({
        title: track.title,
        duration: track.duration,
        position: track.position,
        contributors: track.extraartists?.map(artist => ({
          name: artist.name,
          role: artist.role
        })) || []
      }));
    }

    // Process overall release contributors
    if (albumData.extraartists && albumData.extraartists.length > 0) {
      contributors.overallContributors = albumData.extraartists.map(artist => ({
        name: artist.name,
        role: artist.role
      }));
    }

    // Process labels
    if (albumData.labels && albumData.labels.length > 0) {
      contributors.labels = albumData.labels.map(label => ({
        name: label.name,
        catalogNumber: label.catno
      }));
    }

    // Process companies
    if (albumData.companies && albumData.companies.length > 0) {
      contributors.companies = albumData.companies.map(company => ({
        name: company.name,
        role: company.role
      }));
    }

    // Final summary log
    const totalApiCalls = searchAttempts + fetchAttempts;

    res.json({ contributors });
    
  } catch (error) {
    console.error(`\n❌ [ALBUM CONTRIBUTORS] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch album contributors' });
  }
});

// Genius API endpoint to get song information
app.get('/genius/song-info', async (req, res) => {
  try {
    const { songName, artistName } = req.query;
    
    if (!songName || !artistName) {
      return res.status(400).json({ error: 'Missing song name or artist name' });
    }
    
    console.log(`[Genius API] Request received for: "${songName}" by "${artistName}"`);
    
    const songInfo = await geniusService.getSongInfoFromSpotify(songName, artistName);
    
    if (songInfo.error) {
      console.log(`[Genius API] Error: ${songInfo.error}`);
      return res.status(404).json({ error: songInfo.error });
    }
    
    console.log(`[Genius API] Successfully retrieved info for: "${songInfo.songDetails.title}"`);
    res.json(songInfo);
    
  } catch (error) {
    console.error('[Genius API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch song information from Genius' });
  }
});

// Debug endpoint to test Genius API directly
app.get('/genius/debug', async (req, res) => {
  try {
    console.log('[Genius Debug] Testing Genius API connection...');
    
    // Test basic connectivity
    const testResult = await geniusService.getSongInfoFromSpotify('Blinding Lights', 'The Weeknd');
    
    res.json({
      success: !testResult.error,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Genius Debug] Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// New endpoint to test Genius API with custom song/artist
app.get('/genius/test-song', async (req, res) => {
  try {
    const { songName, artistName } = req.query;
    
    if (!songName || !artistName) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        usage: 'Use: /genius/test-song?songName=Chandelier&artistName=Sia'
      });
    }
    
    console.log(`[Genius Test] Testing with: "${songName}" by "${artistName}"`);
    
    // Get the song info
    const songInfo = await geniusService.getSongInfoFromSpotify(songName, artistName);
    
    // Return the complete response with detailed logging
    res.json({
      success: !songInfo.error,
      query: { songName, artistName },
      result: songInfo,
      timestamp: new Date().toISOString(),
      message: songInfo.error ? 'API call failed' : 'API call successful'
    });
    
  } catch (error) {
    console.error('[Genius Test] Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to show raw Genius API response structure
app.get('/genius/raw-response/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    
    if (!songId) {
      return res.status(400).json({ error: 'Missing song ID' });
    }
    
    console.log(`[Genius Raw] Getting raw response for song ID: ${songId}`);
    
    // Get the raw response from Genius API
    const accessToken = await geniusService.getAccessToken();
    const axios = require('axios');
    
    const response = await axios.get(`https://api.genius.com/songs/${songId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'spotify-vibe-generator/1.0'
      }
    });
    
    // Return the complete raw response
    res.json({
      success: true,
      songId: songId,
      rawResponse: response.data,
      timestamp: new Date().toISOString(),
      message: 'Raw Genius API response'
    });
    
  } catch (error) {
    console.error('[Genius Raw] Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple health check for Genius service
app.get('/genius/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Genius API',
    timestamp: new Date().toISOString(),
    environment: {
      GENIUS_CLIENT_ID: !!process.env.GENIUS_CLIENT_ID,
      GENIUS_CLIENT_SECRET: !!process.env.GENIUS_CLIENT_SECRET,
      GENIUS_CLIENT_ACCESS_TOKEN: !!process.env.GENIUS_CLIENT_ACCESS_TOKEN
    }
  });
});

// Test basic Genius API connectivity
app.get('/genius/test-connectivity', async (req, res) => {
  try {
    console.log('[Genius] Testing basic connectivity...');
    
    // Try a simple request to Genius API
    const axios = require('axios');
    const response = await axios.get('https://api.genius.com/search?q=test', {
      headers: {
        'User-Agent': 'spotify-vibe-generator/1.0'
      },
      timeout: 10000
    });
    
    res.json({
      success: true,
      status: response.status,
      message: 'Genius API is accessible',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Genius] Connectivity test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Genius API is not accessible',
      timestamp: new Date().toISOString()
    });
  }
});

// New endpoint for batch ISRC fetching and MBID lookup
app.post('/batch-isrc-mbid', async (req, res) => {
  try {
    const { trackIds } = req.body;
    
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'Missing trackIds array' });
    }

    
    // Helper function to add wait time between API calls
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Fetch ISRCs from Spotify using /tracks endpoint (max 50 per call)
    const batchSize = 50; // Spotify's limit for /tracks endpoint
    const isrcBatches = [];
    
    // Split track IDs into batches of 50
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      isrcBatches.push(batch);
    }
    
    const allTracksWithIsrcs = [];
    let totalIsrcsFound = 0;
    
    // Process each batch to get ISRCs
    for (let i = 0; i < isrcBatches.length; i++) {
      const batch = isrcBatches[i];
      
      try {
        // Make batch call to Spotify /tracks endpoint
        const response = await spotifyApi.getTracks(batch);
        
        if (response.body && response.body.tracks) {
          const tracksWithIsrcs = response.body.tracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            isrc: track.external_ids?.isrc || null
          }));
          
          allTracksWithIsrcs.push(...tracksWithIsrcs);
          
          const isrcCount = tracksWithIsrcs.filter(t => t.isrc).length;
          totalIsrcsFound += isrcCount;
        }
        
        // Rate limit: wait between batches
        if (i < isrcBatches.length - 1) {
          await wait(10); // 10ms between Spotify API calls
        }
        
      } catch (error) {
        console.error(`[Batch ISRC/MBID] ❌ Error processing batch ${i + 1}:`, error.message);
        // Continue with other batches
      }
    }
    
    // Group all ISRCs and make batch MusicBrainz call
    const tracksWithIsrcs = allTracksWithIsrcs.filter(track => track.isrc);
    const tracksWithoutIsrcs = allTracksWithIsrcs.filter(track => !track.isrc);
    
    if (tracksWithIsrcs.length === 0) {
      return res.json({
        success: true,
        tracksWithMbids: [],
        tracksWithoutMbids: allTracksWithIsrcs,
        summary: {
          totalTracks: trackIds.length,
          tracksWithIsrcs: 0,
          tracksWithoutIsrcs: allTracksWithIsrcs.length,
          tracksWithMbids: 0
        }
      });
    }
    
    // Group ISRCs for MusicBrainz batch call
    const isrcs = tracksWithIsrcs.map(track => track.isrc);
    
    try {
      // Make batch call to MusicBrainz with proper URL encoding
      const query = `isrc:(${isrcs.join(' OR ')})`;
      
      // Build the URL with proper encoding (axios will handle the rest)
      const mbidUrl = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json`;
      
      const mbidResponse = await axios.get(mbidUrl, {
        headers: {
          'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)',
          'Accept': 'application/json'
        }
      });
      
      if (mbidResponse.data && mbidResponse.data.recordings) {
        const recordings = mbidResponse.data.recordings;
        
        // Create ISRC to MBID mapping
        const isrcToMbid = {};
        recordings.forEach(recording => {
          if (recording.isrcs && recording.isrcs.length > 0) {
            recording.isrcs.forEach(isrc => {
              isrcToMbid[isrc] = recording.id;
            });
          }
        });
        
        // Map tracks with MBIDs
        const tracksWithMbids = tracksWithIsrcs.map(track => ({
          ...track,
          mbid: isrcToMbid[track.isrc] || null
        }));
        
        const tracksWithMbidsFound = tracksWithMbids.filter(track => track.mbid);
        const tracksWithoutMbids = tracksWithMbids.filter(track => !track.mbid);
        
        // Calculate API calls for this endpoint
        const spotifyApiCalls = isrcBatches.length; // One call per batch of 50 tracks
        const musicbrainzApiCalls = 1; // Single batch call to MusicBrainz
        
        // FINAL SUMMARY
        console.log(`[Batch ISRC/MBID] ===== COMPLETE =====`);
        console.log(`[Batch ISRC/MBID] Total tracks: ${trackIds.length} | Tracks with ISRCs: ${tracksWithIsrcs.length} | Tracks with MBIDs: ${tracksWithMbidsFound.length} | Success rate: ${((tracksWithMbidsFound.length / trackIds.length) * 100).toFixed(1)}%`);
        console.log(`[Batch ISRC/MBID] ==========================================`);
        
        res.json({
          success: true,
          tracksWithMbids: tracksWithMbidsFound,
          tracksWithoutMbids: tracksWithoutMbids,
          summary: {
            totalTracks: trackIds.length,
            tracksWithIsrcs: tracksWithIsrcs.length,
            tracksWithoutIsrcs: allTracksWithIsrcs.length - tracksWithIsrcs.length,
            tracksWithMbids: tracksWithMbidsFound.length,
            apiCalls: {
              spotify: spotifyApiCalls,
              musicbrainz: musicbrainzApiCalls,
              total: spotifyApiCalls + musicbrainzApiCalls
            }
          }
        });
        
      } else {
        throw new Error('Invalid response from MusicBrainz');
      }
      
    } catch (error) {
      console.error(`[Batch ISRC/MBID] MusicBrainz batch call failed:`, error.message);
      
      // Return tracks with ISRCs even if MBID lookup failed
      res.json({
        success: false,
        error: 'MusicBrainz lookup failed',
        tracksWithMbids: [],
        tracksWithoutMbids: tracksWithIsrcs,
        summary: {
          totalTracks: trackIds.length,
          tracksWithIsrcs: tracksWithIsrcs.length,
          tracksWithoutIsrcs: allTracksWithIsrcs.length - tracksWithIsrcs.length,
          tracksWithMbids: 0
        }
      });
    }
    
  } catch (error) {
    console.error('[Batch ISRC/MBID] Error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch ISRC/MBID lookup',
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is accessible from internet at http://46.101.78.90:${PORT}`);
});

module.exports = pool;
