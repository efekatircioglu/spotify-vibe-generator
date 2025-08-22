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

// after being logged in go to localhost:3000 (now it has welcome, your name)
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.4:3000']
}));

// Parse JSON bodies for POST requests
app.use(express.json());

// Define the "scopes" or permissions we need from the user
const scopes = [
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
  redirectUri: process.env.REDIRECT_URI,
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
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// The CALLBACK route
// This is the route Spotify will redirect to after the user has logged in
app.get('/callback', async (req, res) => {
  // ADD THIS LINE TO SEE EXACTLY WHAT SPOTIFY SENDS BACK
  console.log('Just reached the /callback route. Full query from Spotify:', req.query);

  const { error, code } = req.query;

  if (error) {
    console.error('Error from Spotify:', error);
    res.send(`Error during authentication: ${error}`);
    return;
  }

  try {
    // Exchange the authorization code for an access token
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    // Set the tokens on our Spotify API object
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('Successfully retrieved access token!');
    console.log('Access Token:', access_token);
    
    // Send the user back to the 'face' of your application
    // HERE REDIRECT TO SOME OTHER PAGE
    // Check if the request came from mobile or desktop
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      res.redirect('http://192.168.1.4:3000');
    } else {
      res.redirect('http://localhost:3000');
    }
 
  } catch (err) {
    console.error('--- ERROR GETTING TOKENS ---');
    console.error('Spotify API Error:', err.body); 
    res.send('An error occurred while getting the tokens. Check the server console for details.');
  }
});

// API endpoint for the frontend to check auth status and get user data.
app.get('/me', async (req, res) => {
  try {
    const { body } = await spotifyApi.getMe();
    res.json(body);
  } catch (err) {
    console.error('Could not get user data:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.get('/logout', (req, res) => {
  spotifyApi.setAccessToken(null);
  spotifyApi.setRefreshToken(null);
  res.sendStatus(200);
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

app.get('/recent-tracks', async (req, res) => {
  try {
    // Fetch up to 50 recently played tracks
    const { body } = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
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
    // Map to array of { name, artist, uri, album, release_year, album_image, duration_ms, id, genre, played_at }
    const tracks = body.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      uri: item.track.uri,
      album: item.track.album.name,
      release_year: item.track.album.release_date ? item.track.album.release_date.split('-')[0] : '',
      album_image: item.track.album.images && item.track.album.images.length > 0 ? item.track.album.images[0].url : '',
      duration_ms: item.track.duration_ms,
      id: item.track.id,
      genre: item.track.artists && item.track.artists[0] && artistGenres[item.track.artists[0].id] ? artistGenres[item.track.artists[0].id] : 'Unknown',
      played_at: item.played_at // Add the timestamp when the track was played
    }));
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
        
        // Log a sample track to see the structure
        if (allTracks.indexOf(item) === 0) {
          console.log('Sample playlist track structure:', {
            id: item.track.id,
            name: item.track.name,
            album: item.track.album,
            release_date: item.track.album?.release_date,
            duration_ms: item.track.duration_ms
          });
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
    
    console.log(`[Artist Genre API] Searching for artist: "${artistName}"`);
    
    // Search for the artist using Spotify API (same as /artist page)
    const searchRes = await spotifyApi.searchArtists(artistName, { limit: 10 });
    const artists = searchRes.body.artists.items;
    
    if (artists && artists.length > 0) {
      console.log(`[Artist Genre API] Found ${artists.length} potential matches`);
      
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
        
        console.log(`[Artist Genre API] Artist "${artist.name}" (popularity: ${artist.popularity}) - Score: ${score}`);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = artist;
        }
      });
      
      if (bestMatch) {
        console.log(`[Artist Genre API] Best match: "${bestMatch.name}" with score ${bestScore}`);
        
        // Get the primary genre (first one in the array)
        const primaryGenre = bestMatch.genres && bestMatch.genres.length > 0 ? bestMatch.genres[0] : null;
        
        if (primaryGenre) {
          console.log(`[Artist Genre API] Found genre: "${primaryGenre}" for "${bestMatch.name}"`);
        } else {
          console.log(`[Artist Genre API] No genres found for "${bestMatch.name}"`);
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
        console.log(`[Artist Genre API] No suitable match found for "${artistName}"`);
        res.status(404).json({ error: 'No suitable artist match found' });
      }
    } else {
      console.log(`[Artist Genre API] No artists found for "${artistName}"`);
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
  const tracks = tracksRes.body.items;
  const artists = artistsRes.body.items;
  
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
    tracks, 
    artists, 
    genres: genreCounts,
    genreDetails: genreData  // New field with detailed genre information
  };
}

app.get('/last-4-weeks', async (req, res) => {
  try {
    const data = await getTopData('short_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 4 weeks data' });
  }
});

app.get('/last-6-months', async (req, res) => {
  try {
    const data = await getTopData('medium_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 6 months data' });
  }
});

app.get('/last-12-months', async (req, res) => {
  try {
    const data = await getTopData('long_term');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last 12 months data' });
  }
});

// New endpoint to get detailed genre information with artists
app.get('/genre-details/:timeRange', async (req, res) => {
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
      
      console.log(`[search-artist] Found artist: ${bestMatch.name} (ID: ${bestMatch.id})`);
      
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
app.get('/all-artists-deduplicated', async (req, res) => {
  try {
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

    res.json({
      artists: allArtists,
      totalCount: allArtists.length,
      breakdown: {
        '12_months': allArtists.filter(a => a.timePeriod === '12_months').length,
        '6_months': allArtists.filter(a => a.timePeriod === '6_months').length,
        '4_weeks': allArtists.filter(a => a.timePeriod === '4_weeks').length
      }
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

app.post('/api/feedback', express.json(), async (req, res) => {
  const { username, emoji, text } = req.body;
  if (!username || !emoji) {
    return res.status(400).json({ error: 'username and emoji are required' });
  }
  try {
    await pool.query(
      'INSERT INTO feedback (username, emoji, text) VALUES ($1, $2, $3)',
      [username, emoji, text || null]
    );
    res.json({ message: 'Feedback received' });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.get('/api/admin/feedbacks', express.json(), async (req, res) => {
  // Expect the frontend to send the Spotify user id in a header
  const userId = req.headers['x-spotify-user-id'];
  if (userId !== process.env.ADMIN_SPOTIFY_USER_ID) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
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

  console.log('[find-mbid] Called with:', { isrc, songName, artistName });

  if (!isrc && (!songName || !artistName)) {
    return res.status(400).json({ error: 'Missing required parameters. Provide either an ISRC or both a song and artist name.' });
  }

  try {
    let mbid = null;

    // --- Step 1: Try to find MBID using ISRC (if provided) ---
    if (isrc) {
      console.log('[find-mbid] Step 1: Attempting ISRC search:', isrc);
      const isrcUrl = `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`;
      const isrcResponse = await axios.get(isrcUrl, { 
        headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' } 
      });
      const isrcRecordings = isrcResponse.data.recordings;
      if (isrcRecordings && isrcRecordings.length > 0) {
        mbid = isrcRecordings[0].id;
        console.log('[find-mbid] Step 1: Found MBID via ISRC:', mbid);
      } else {
        console.log('[find-mbid] Step 1: No MBID found via ISRC.');
      }
    }

    // --- Step 2: If not found, fall back to searching by name and artist ---
    if (!mbid && songName && artistName) {
      console.log('[find-mbid] Step 2: Attempting name/artist search:', { songName, artistName });
      const nameQuery = `recording:"${encodeURIComponent(songName)}" AND artist:"${encodeURIComponent(artistName)}"`;
      const nameUrl = `https://musicbrainz.org/ws/2/recording?query=${nameQuery}&fmt=json`;
      const nameResponse = await axios.get(nameUrl, { 
        headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' } 
      });
      const nameRecordings = nameResponse.data.recordings;
      if (nameRecordings && nameRecordings.length > 0) {
        mbid = nameRecordings[0].id;
        console.log('[find-mbid] Step 2: Found MBID via name/artist:', mbid);
      } else {
        console.log('[find-mbid] Step 2: No MBID found via name/artist.');
      }
    }

    // --- Step 3: Send the final result ---
    // mbid will be the found ID, or null if both searches failed.
    console.log(`[find-mbid] Search complete. Final MBID: ${mbid}`);
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
    const { body } = await spotifyApi.getArtistAlbums(artistId, {
      limit: 50,
      include_groups: groupParam,
      album_type: groupParam
    });

    // Simplify album data for the frontend
    const albums = (body.items || []).map(album => ({
      id: album.id,
      name: album.name,
      image: album.images?.[0]?.url || '',
      releaseYear: album.release_date?.split('-')[0] || '',
    }));

    res.json({ albums });
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
      console.log(`[Artist Search Navigate] No Spotify artists found for: ${artistName}`);
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
    try {
      const ticketmasterData = await ticketmasterService.searchArtist(artistName);
      if (ticketmasterData._embedded?.attractions) {
        const exactMatch = ticketmasterData._embedded.attractions.find(
          a => a.name.toLowerCase() === artistName.toLowerCase()
        );
        if (exactMatch) {
          ticketmasterId = exactMatch.id;
          console.log(`[Artist Search Navigate] Found Ticketmaster ID: ${ticketmasterId}`);
        }
      }
    } catch (ticketmasterErr) {
      console.log(`[Artist Search Navigate] Ticketmaster search failed:`, ticketmasterErr.message);
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
    const data = await ticketmasterService.searchArtist(artistName);
    res.json(data);
  } catch (err) {
    console.error('Error searching artist on Ticketmaster:', err);
    res.status(500).json({ error: 'Failed to search artist' });
  }
});

app.get('/discogs/artist-profile', async (req, res) => {
  const { name } = req.query;
  console.log(`[Discogs API] /discogs/artist-profile called with name:`, name);
  if (!name) return res.status(400).json({ error: 'Missing artist name' });
  try {
    const result = await getArtistBio(name);
    if (result.error) {
      console.log(`[Discogs API] No profile found for:`, name, '| Error:', result.error);
      return res.status(404).json({ error: result.error });
    }
    console.log(`[Discogs API] Profile found for:`, name, '| First 120 chars:', result.profile ? result.profile.substring(0, 120) + '...' : 'No profile');
    res.json(result);
  } catch (e) {
    console.error(`[Discogs API] Error fetching profile for:`, name, e);
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
    const map = await getAlbumGenreStyleMapByArtistName(artistName);
    res.json({ map });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch genre/style map', details: err.message });
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

// Optimized batch endpoint using single Ticketmaster API call
app.post('/concerts/events/optimized-batch', async (req, res) => {
  const artistIds = req.body.artistIds;
  if (!Array.isArray(artistIds) || artistIds.length === 0) {
    return res.status(400).json({ error: 'artistIds required' });
  }
  
  try {
    console.log(`Optimized batch request for ${artistIds.length} artists`);
    
    // Make a single API call to Ticketmaster with all artist IDs
    const data = await ticketmasterService.getEventsByMultipleArtistIds(artistIds);
    const events = data._embedded?.events || [];
    
    console.log(`Found ${events.length} total events for ${artistIds.length} artists`);
    
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
      totalArtists: artistIds.length
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
      
      console.log(`Found ${followedArtists.length} followed artists`);
      
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
    
    console.log('Testing batch endpoint with real artist IDs:', artistIds);
    
    // Fetch concerts for each artist using the optimized batch method
    const data = await ticketmasterService.getEventsByMultipleArtistIds(artistIds);
    const events = data._embedded?.events || [];
    
    console.log(`Found ${events.length} total events for ${artistIds.length} artists`);
    
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

    console.log(`[MBID Lookup] Starting MBID lookup for ${tracks.length} tracks`);
    
    // Helper function to add wait time between API calls
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const results = [];
    
    // Process tracks sequentially with wait times between API calls
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      console.log(`[MBID Lookup] Processing track ${i + 1}/${tracks.length}: ${track.name} by ${track.artist || 'Unknown Artist'}`);
      
      // Check if we have Spotify ID for this track
      if (!track.id) {
        console.log(`[MBID Lookup] Skipping track ${track.name} - no Spotify ID`);
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
        console.log(`[MBID Lookup] Fetching ISRC for track ${track.name}`);
        
        try {
          const { body } = await spotifyApi.getTrack(track.id);
          isrc = body && body.external_ids && body.external_ids.isrc ? body.external_ids.isrc : null;
          console.log(`[MBID Lookup] ISRC for ${track.name}: ${isrc}`);
        } catch (spotifyError) {
          console.log(`[MBID Lookup] Failed to get ISRC for ${track.name}:`, spotifyError.message);
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
                console.log(`[MBID Lookup] Found MBID for ${track.name}: ${mbid}`);
                mbidWasCached = false;
              } else {
                console.log(`[MBID Lookup] No MBID found for ISRC: ${isrc}`);
              }
            }
          } catch (mbidError) {
            console.log(`[MBID Lookup] MusicBrainz lookup failed for ${track.name}:`, mbidError.message);
          }
        } else {
          console.log(`[MBID Lookup] No ISRC available for ${track.name}`);
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
        console.log(`[MBID Lookup] Waiting ${trackWaitTime}ms before next track`);
        await wait(trackWaitTime);
      }
    }
    
    console.log(`[MBID Lookup] MBID lookup complete. Successfully found: ${results.filter(r => r.success).length}/${tracks.length}`);
    
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

// Wrapped analysis endpoint with optimized wait times
app.post('/wrapped-analysis', async (req, res) => {
  try {
    const { tracks } = req.body;
    
    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Missing tracks array' });
    }

    console.log(`[Wrapped Analysis] Starting analysis for ${tracks.length} tracks`);
    
    // Helper function to add wait time between API calls
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Helper function to fetch analysis with simple retry
    const fetchAnalysisWithRetry = async (mbid) => {
      const baseWaitTime = 500; // 500ms between API calls
      
      try {
        // Fetch high-level analysis from AcousticBrainz
        console.log(`[Wrapped Analysis] Fetching high-level analysis for MBID: ${mbid}`);
        const highRes = await axios.get(`https://acousticbrainz.org/${mbid}/high-level`, {
          headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
        });
        
        // Wait between API calls
        await wait(baseWaitTime);
        
        // Fetch low-level analysis from AcousticBrainz
        console.log(`[Wrapped Analysis] Fetching low-level analysis for MBID: ${mbid}`);
        const lowRes = await axios.get(`https://acousticbrainz.org/${mbid}/low-level`, {
          headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
        });
        
        return {
          highLevel: highRes.data,
          lowLevel: lowRes.data,
          success: true
        };
      } catch (error) {
        console.log(`[Wrapped Analysis] Analysis fetch failed for MBID ${mbid}:`, error.message);
        
        // Simple retry once with same wait time
        console.log(`[Wrapped Analysis] Retrying analysis for MBID ${mbid}...`);
        await wait(baseWaitTime);
        
        try {
          const highRes = await axios.get(`https://acousticbrainz.org/${mbid}/high-level`, {
            headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
          });
          
          await wait(baseWaitTime);
          
          const lowRes = await axios.get(`https://acousticbrainz.org/${mbid}/low-level`, {
            headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
          });
          
          return {
            highLevel: highRes.data,
            lowLevel: lowRes.data,
            success: true
          };
        } catch (retryError) {
          console.log(`[Wrapped Analysis] Retry failed for MBID ${mbid}:`, retryError.message);
          return {
            highLevel: null,
            lowLevel: null,
            success: false,
            error: retryError.message
          };
        }
      }
    };

    const results = [];
    
    // Process tracks sequentially with minimal wait times
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      console.log(`[Wrapped Analysis] Processing track ${i + 1}/${tracks.length}: ${track.name} by ${track.artist || 'Unknown Artist'}`);
      
      // Check if we have MBID for this track
      if (!track.mbid) {
        console.log(`[Wrapped Analysis] Skipping track ${track.name} - no MBID available`);
        results.push({
          track,
          highLevel: null,
          lowLevel: null,
          success: false,
          reason: 'No MBID available'
        });
        continue;
      }
      
      // Fetch analysis for this track
      const analysis = await fetchAnalysisWithRetry(track.mbid);
      
      results.push({
        track,
        ...analysis
      });
      
      // Wait between tracks (except for the last one and when next track has no MBID)
      if (i < tracks.length - 1) {
        const nextTrack = tracks[i + 1];
        // Only add wait time if next track has MBID (will be processed)
        if (nextTrack && nextTrack.mbid) {
          const trackWaitTime = 200; // 200ms between tracks
          console.log(`[Wrapped Analysis] Waiting ${trackWaitTime}ms before next track`);
          await wait(trackWaitTime);
        } else {
          console.log(`[Wrapped Analysis] Next track has no MBID, skipping wait time`);
        }
      }
    }
    
    console.log(`[Wrapped Analysis] Analysis complete. Successfully analyzed: ${results.filter(r => r.success).length}/${tracks.length}`);
    
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
  
  console.log(`\n🔍 [ALBUM CONTRIBUTORS] Request received:`);
  console.log(`   Album: "${albumTitle}"`);
  console.log(`   Artist: "${artistName}"`);
  
  if (!albumTitle || !artistName) {
    console.log(`❌ [ALBUM CONTRIBUTORS] Missing parameters`);
    return res.status(400).json({ error: 'Missing album title or artist name' });
  }

  try {
    // Search Discogs for the album with fallback strategies
    let searchData = null;
    let searchUrl = null;
    let searchStrategy = 'exact';
    
    // Strategy 1: Exact search with original title
    searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(albumTitle)}&artist=${encodeURIComponent(artistName)}`;
    
    console.log(`\n🌐 [ALBUM CONTRIBUTORS] Strategy 1: Exact search`);
    console.log(`   URL: ${searchUrl}`);
    
    const authHeaders = {
      'User-Agent': process.env.DISCOGS_USER_AGENT,
      'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
    };

    console.log(`   User-Agent: ${process.env.DISCOGS_USER_AGENT}`);
    console.log(`   Key: ${process.env.DISCOGS_CONSUMER_KEY ? '✓ Set' : '✗ Missing'}`);
    console.log(`   Secret: ${process.env.DISCOGS_CONSUMER_SECRET ? '✓ Set' : '✗ Missing'}`);

    let searchResponse = await fetch(searchUrl, { headers: authHeaders });
    
    console.log(`   Search Response Status: ${searchResponse.status}`);
    
    if (!searchResponse.ok) {
      console.log(`❌ [ALBUM CONTRIBUTORS] Discogs search failed with status: ${searchResponse.status}`);
      throw new Error(`Discogs search failed with status: ${searchResponse.status}`);
    }

    searchData = await searchResponse.json();
    console.log(`   Search Results: ${searchData.results?.length || 0} found`);
    
    // Strategy 2: If no results, try without special characters and parentheses
    if (!searchData.results || searchData.results.length === 0) {
      const cleanTitle = albumTitle
        .replace(/[\(\)\[\]\{\}]/g, '') // Remove parentheses and brackets
        .replace(/remastered|deluxe|expanded|anniversary/gi, '') // Remove common version words
        .trim();
      
      if (cleanTitle !== albumTitle) {
        searchStrategy = 'cleaned';
        searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(artistName)}`;
        
        console.log(`\n🌐 [ALBUM CONTRIBUTORS] Strategy 2: Cleaned title search`);
        console.log(`   Original: "${albumTitle}"`);
        console.log(`   Cleaned: "${cleanTitle}"`);
        console.log(`   URL: ${searchUrl}`);
        
        searchResponse = await fetch(searchUrl, { headers: authHeaders });
        
        if (searchResponse.ok) {
          searchData = await searchResponse.json();
          console.log(`   Search Results: ${searchData.results?.length || 0} found`);
        }
      }
    }
    
    // Strategy 3: If still no results, try broader search with just artist and album name
    if (!searchData.results || searchData.results.length === 0) {
      searchStrategy = 'broad';
      searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName + ' ' + albumTitle)}&type=release`;
      
      console.log(`\n🌐 [ALBUM CONTRIBUTORS] Strategy 3: Broad search`);
      console.log(`   Query: "${artistName} ${albumTitle}"`);
      console.log(`   URL: ${searchUrl}`);
      
      searchResponse = await fetch(searchUrl, { headers: authHeaders });
      
      if (searchResponse.ok) {
        searchData = await searchResponse.json();
        console.log(`   Search Results: ${searchData.results?.length || 0} found`);
      }
    }
    
                    // Strategy 4: If still no results, try searching by artist only and filter by title
                if (!searchData?.results || searchData.results.length === 0) {
                  searchStrategy = 'artist_only';
                  searchUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artistName)}&type=release`;

                  console.log(`\n🌐 [ALBUM CONTRIBUTORS] Strategy 4: Artist-only search`);
                  console.log(`   Artist: "${artistName}"`);
                  console.log(`   URL: ${searchUrl}`);

                  searchResponse = await fetch(searchUrl, { headers: authHeaders });

                  if (searchResponse.ok) {
                    searchData = await searchResponse.json();
                    console.log(`   Search Results: ${searchData.results?.length || 0} found`);
                    
                    if (searchData.results && searchData.results.length > 0) {
                      // Filter results to find albums with matching titles
                      const filteredResults = searchData.results.filter(result => {
                        const resultTitle = result.title.toLowerCase();
                        const searchTitle = albumTitle.toLowerCase();
                        return resultTitle.includes(searchTitle) || searchTitle.includes(resultTitle);
                      });
                      
                      if (filteredResults.length > 0) {
                        searchData.results = filteredResults;
                        console.log(`   Filtered to ${filteredResults.length} relevant albums`);
                      }
                    }
                  }
                }
                
                // Strategy 5: Try searching with artist name in title pattern
                if (!searchData?.results || searchData.results.length === 0) {
                  searchStrategy = 'artist_in_title';
                  const artistInTitleQuery = `${artistName} - ${albumTitle}`;
                  searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistInTitleQuery)}&type=release`;

                  console.log(`\n🌐 [ALBUM CONTRIBUTORS] Strategy 5: Artist-in-title search`);
                  console.log(`   Query: "${artistInTitleQuery}"`);
                  console.log(`   URL: ${searchUrl}`);

                  searchResponse = await fetch(searchUrl, { headers: authHeaders });

                  if (searchResponse.ok) {
                    searchData = await searchResponse.json();
                    console.log(`   Search Results: ${searchData.results?.length || 0} found`);
                  }
                }
    
    if (!searchData?.results || searchData.results.length === 0) {
      console.log(`⚠️ [ALBUM CONTRIBUTORS] No album found after all strategies`);
      return res.json({ contributors: [], message: 'No album found' });
    }

    // Find the most relevant album by filtering and scoring results
    console.log(`\n🔍 [ALBUM CONTRIBUTORS] Filtering ${searchData.results.length} results for best match...`);
    
    // Filter results to find exact or close matches with better validation
    const relevantResults = searchData.results.filter(result => {
      const resultTitle = result.title.toLowerCase();
      const resultArtist = result.artist?.toLowerCase() || '';
      const searchTitle = albumTitle.toLowerCase();
      const searchArtist = artistName.toLowerCase();
      
      // Log the current result being evaluated
      console.log(`\n   Evaluating: "${result.title}" by "${result.artist || 'undefined'}"`);
      
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
        
        // Also check if artist name appears anywhere in the title
        const titleContainsArtist = resultTitle.includes(searchArtist.toLowerCase());
        
        console.log(`     Artist missing/undefined - checking patterns:`);
        console.log(`       Title contains album: ${titleContainsAlbum}`);
        console.log(`       Title starts with artist pattern: ${titleStartsWithArtist}`);
        console.log(`       Title contains artist: ${titleContainsArtist}`);
        
        // Accept if album is in title AND (title starts with artist pattern OR contains artist name)
        if (titleContainsAlbum && (titleStartsWithArtist || titleContainsArtist)) {
          console.log(`     ✅ Accepting result with missing artist (artist embedded in title)`);
          return true;
        } else {
          console.log(`     ❌ Rejecting result with missing artist (insufficient validation)`);
          return false;
        }
      }
      
      // Normal case: Both artist and title must match
      const artistMatch = resultArtist.includes(searchArtist) || searchArtist.includes(searchArtist);
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
      
      console.log(`     Artist match: ${artistMatch} (${resultArtist || 'undefined'} vs ${searchArtist})`);
      console.log(`     Title match: ${titleMatch} (${resultTitle} vs ${searchTitle})`);
      console.log(`     Obviously wrong: ${isObviouslyWrong}`);
      
      return artistMatch && titleMatch && !isObviouslyWrong;
    });
    
    console.log(`   Relevant results after filtering: ${relevantResults.length}`);
    
    if (relevantResults.length === 0) {
      console.log(`⚠️ [ALBUM CONTRIBUTORS] No relevant results found after filtering`);
      console.log(`   Trying to find best partial match...`);
      
      // If no exact matches, find the best partial match
      const bestMatch = searchData.results.find(result => {
        const resultTitle = result.title.toLowerCase();
        const resultArtist = result.artist?.toLowerCase() || '';
        const searchTitle = albumTitle.toLowerCase();
        const searchArtist = artistName.toLowerCase();
        
        // Special case: If artist is missing but title contains album name
        if (!result.artist || result.artist === 'undefined') {
          if (resultTitle.includes(searchTitle)) {
            console.log(`     ✅ Found partial match with missing artist: "${result.title}"`);
            return true;
          }
        }
        
        // Normal scoring for results with artists
        if (resultArtist) {
          const titleWords = searchTitle.split(' ').filter(word => word.length > 2);
          const artistWords = searchArtist.split(' ').filter(word => word.length > 2);
          
          const titleScore = titleWords.filter(word => resultTitle.includes(word)).length;
          const artistScore = artistWords.filter(word => resultArtist.includes(word)).length;
          
          // Require at least some title match and some artist match
          return titleScore > 0 && artistScore > 0;
        }
        
        return false;
      });
      
      if (bestMatch) {
        console.log(`   Best partial match found: "${bestMatch.title}" by "${bestMatch.artist}"`);
        relevantResults.push(bestMatch);
      }
    }
    
    if (relevantResults.length === 0) {
      console.log(`❌ [ALBUM CONTRIBUTORS] No suitable album found after all filtering`);
      return res.json({ contributors: [], message: 'No suitable album found' });
    }
    
    // Select the best match (first relevant result)
    let album = relevantResults[0];
    console.log(`\n✅ [ALBUM CONTRIBUTORS] Search successful using strategy: ${searchStrategy}`);
    console.log(`   Selected Album: "${album.title}" by "${album.artist}" (ID: ${album.id})`);
    console.log(`   Total relevant results: ${relevantResults.length}`);
    
    // Fetch detailed album information
    const albumUrl = `https://api.discogs.com/releases/${album.id}`;
    console.log(`\n📋 [ALBUM CONTRIBUTORS] Fetching detailed album info:`);
    console.log(`   URL: ${albumUrl}`);
    
    let albumResponse = await fetch(albumUrl, { headers: authHeaders });
    
    console.log(`   Album Response Status: ${albumResponse.status}`);
    
                    if (!albumResponse.ok) {
                  console.log(`❌ [ALBUM CONTRIBUTORS] Discogs album fetch failed with status: ${albumResponse.status}`);
                  
                  // If this ID fails, try to find another valid result
                  if (albumResponse.status === 404 && relevantResults.length > 1) {
                    console.log(`🔄 [ALBUM CONTRIBUTORS] Trying next result due to 404 error...`);
                    
                    // Find next result that's not the failed one
                    const nextResult = relevantResults.find(result => result.id !== album.id);
                    if (nextResult) {
                      console.log(`   Trying next result: "${nextResult.title}" (ID: ${nextResult.id})`);
                      
                      // Update album to next result
                      album = nextResult;
                      
                      // Try fetching again
                      const retryUrl = `https://api.discogs.com/releases/${album.id}`;
                      console.log(`   Retry URL: ${retryUrl}`);
                      
                      const retryResponse = await fetch(retryUrl, { headers: authHeaders });
                      
                      if (retryResponse.ok) {
                        console.log(`   ✅ Retry successful! Got album: "${album.title}"`);
                        albumResponse = retryResponse;
                      } else {
                        console.log(`   ❌ Retry also failed with status: ${retryResponse.status}`);
                        throw new Error(`All album IDs failed to fetch. Last error: ${retryResponse.status}`);
                      }
                    } else {
                      throw new Error(`Discogs album fetch failed with status: ${albumResponse.status}`);
                    }
                  } else {
                    throw new Error(`Discogs album fetch failed with status: ${albumResponse.status}`);
                  }
                }

                    let albumData = await albumResponse.json();
    
                    console.log(`   Album Title: "${albumData.title}"`);
                console.log(`   Album Artist: "${albumData.artists?.map(a => a.name).join(', ') || artistName}"`);
                console.log(`   Album Year: ${albumData.year}`);
                console.log(`   Album Country: ${albumData.country}`);
                
                // Validate that we actually got the right album
                const fetchedArtist = albumData.artists?.map(a => a.name).join(', ') || '';
                const fetchedTitle = albumData.title.toLowerCase();
                const searchArtistLower = artistName.toLowerCase();
                const searchTitleLower = albumTitle.toLowerCase();
                
                const artistMatches = fetchedArtist.toLowerCase().includes(searchArtistLower) || 
                                    searchArtistLower.includes(fetchedArtist.toLowerCase());
                const titleMatches = fetchedTitle.includes(searchTitleLower) || 
                                   searchTitleLower.includes(fetchedTitle);
                
                console.log(`\n🔍 [ALBUM CONTRIBUTORS] Validation check:`);
                console.log(`   Expected: "${albumTitle}" by "${artistName}"`);
                console.log(`   Fetched: "${albumData.title}" by "${fetchedArtist}"`);
                console.log(`   Artist match: ${artistMatches}`);
                console.log(`   Title match: ${titleMatches}`);
                
                // If we got the wrong album, try to find a better match
                if (!artistMatches || !titleMatches) {
                  console.log(`⚠️ [ALBUM CONTRIBUTORS] Album mismatch detected!`);
                  console.log(`   The fetched album doesn't match our search criteria`);
                  
                  // Try to find a better match from our filtered results
                  const betterMatch = relevantResults.find(result => {
                    if (result.id === album.id) return false; // Skip the one we already tried
                    
                    const resultTitle = result.title.toLowerCase();
                    const resultArtist = result.artist?.toLowerCase() || '';
                    return resultTitle.includes(searchTitleLower) && 
                           (resultArtist.includes(searchArtistLower) || searchArtistLower.includes(resultArtist));
                  });
                  
                  if (betterMatch) {
                    console.log(`   Trying better match: "${betterMatch.title}" by "${betterMatch.artist}" (ID: ${betterMatch.id})`);
                    
                    // Fetch the better match
                    const betterAlbumUrl = `https://api.discogs.com/releases/${betterMatch.id}`;
                    const betterAlbumResponse = await fetch(betterAlbumUrl, { headers: authHeaders });
                    
                    if (betterAlbumResponse.ok) {
                      const betterAlbumData = await betterAlbumResponse.json();
                      console.log(`   Better match fetched: "${betterAlbumData.title}" by "${betterAlbumData.artists?.map(a => a.name).join(', ')}"`);
                      
                      // Use the better match data
                      albumData = betterAlbumData;
                      album = betterMatch;
                    }
                  }
                }
                
                // Additional fallback: if we still have issues, try other results systematically
                if (!albumData || !albumData.title) {
                  console.log(`🔄 [ALBUM CONTRIBUTORS] Additional fallback: trying other results...`);
                  
                  for (let i = 0; i < Math.min(5, relevantResults.length); i++) {
                    const fallbackResult = relevantResults[i];
                    if (fallbackResult.id === album.id) continue; // Skip current one
                    
                    console.log(`   Trying fallback result ${i + 1}: "${fallbackResult.title}" (ID: ${fallbackResult.id})`);
                    
                    try {
                      const fallbackUrl = `https://api.discogs.com/releases/${fallbackResult.id}`;
                      const fallbackResponse = await fetch(fallbackUrl, { headers: authHeaders });
                      
                      if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        console.log(`   ✅ Fallback successful! Got: "${fallbackData.title}"`);
                        
                        albumData = fallbackData;
                        album = fallbackResult;
                        break;
                      }
                    } catch (error) {
                      console.log(`   ❌ Fallback ${i + 1} failed: ${error.message}`);
                      continue;
                    }
                  }
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
      console.log(`   Tracks: ${albumData.tracklist.length} found`);
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
      console.log(`   Overall Contributors: ${albumData.extraartists.length} found`);
      contributors.overallContributors = albumData.extraartists.map(artist => ({
        name: artist.name,
        role: artist.role
      }));
    }

    // Process labels
    if (albumData.labels && albumData.labels.length > 0) {
      console.log(`   Labels: ${albumData.labels.length} found`);
      contributors.labels = albumData.labels.map(label => ({
        name: label.name,
        catalogNumber: label.catno
      }));
    }

    // Process companies
    if (albumData.companies && albumData.companies.length > 0) {
      console.log(`   Companies: ${albumData.companies.length} found`);
      contributors.companies = albumData.companies.map(company => ({
        name: company.name,
        role: company.role
      }));
    }

                    console.log(`\n✅ [ALBUM CONTRIBUTORS] Successfully processed:`);
                console.log(`   - ${contributors.trackContributors.length} tracks with contributors`);
                console.log(`   - ${contributors.overallContributors.length} overall contributors`);
                console.log(`   - ${contributors.labels.length} labels`);
                console.log(`   - ${contributors.companies.length} companies`);
                console.log(`   Response size: ${JSON.stringify(contributors).length} characters`);
                
                if (contributors.searchInfo?.artistWasMissing) {
                  console.log(`⚠️ [ALBUM CONTRIBUTORS] WARNING: Artist was missing in search results`);
                  console.log(`   Original search: "${albumTitle}" by "${artistName}"`);
                  console.log(`   Found album: "${albumData.title}" (artist info missing)`);
                  console.log(`   This result was accepted because album title matches search`);
                  
                  if (contributors.searchInfo.extractedArtistFromTitle) {
                    console.log(`   ✅ Successfully extracted artist "${contributors.searchInfo.extractedArtistFromTitle}" from title`);
                  }
                }
                
                // Final validation: ensure we're returning the right album
                const finalArtist = albumData.artists?.map(a => a.name).join(', ') || '';
                const finalTitle = albumData.title.toLowerCase();
                const finalArtistMatch = finalArtist.toLowerCase().includes(artistName.toLowerCase()) || 
                                        artistName.toLowerCase().includes(finalArtist.toLowerCase());
                const finalTitleMatch = finalTitle.includes(albumTitle.toLowerCase()) || 
                                       albumTitle.toLowerCase().includes(finalTitle);
                
                if (!finalArtistMatch || !finalTitleMatch) {
                  console.log(`❌ [ALBUM CONTRIBUTORS] FINAL VALIDATION FAILED!`);
                  console.log(`   We're about to return the wrong album!`);
                  console.log(`   Expected: "${albumTitle}" by "${artistName}"`);
                  console.log(`   Returning: "${albumData.title}" by "${finalArtist}"`);
                  console.log(`   This should not happen with our improved filtering!`);
                } else {
                  console.log(`✅ [ALBUM CONTRIBUTORS] Final validation passed`);
                  console.log(`   Album matches search criteria: "${albumData.title}" by "${finalArtist}"`);
                }

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

module.exports = pool;



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is also accessible on http://192.168.1.4:${PORT}`);
});
