const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '../.env') }); 
const cors = require('cors'); 
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const { Pool } = require('pg');
const pool = new Pool(); // Uses .env variables automatically
const axios = require('axios');
const { getDiscogsArtistProfile } = require('./services/discogsService');
const { getArtistBio, getAllAlbumsByArtistName, getAlbumGenreStyleMapByArtistName } = require('./services/discogsService');

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
    // Map to array of { name, artist, uri, album, release_year, album_image, duration_ms, id, genre }
    const tracks = body.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      uri: item.track.uri,
      album: item.track.album.name,
      release_year: item.track.album.release_date ? item.track.album.release_date.split('-')[0] : '',
      album_image: item.track.album.images && item.track.album.images.length > 0 ? item.track.album.images[0].url : '',
      duration_ms: item.track.duration_ms,
      id: item.track.id,
      genre: item.track.artists && item.track.artists[0] && artistGenres[item.track.artists[0].id] ? artistGenres[item.track.artists[0].id] : 'Unknown'
    }));
    res.json({ tracks });
  } catch (err) {
    console.error('Error fetching recent tracks:', err);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

app.get('/playlists', async (req, res) => {
  try {
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
          // Fetch all tracks in the playlist (handle >100 tracks if needed)
          let allTracks = [];
          let offset = 0;
          let total = item.tracks.total;
          while (allTracks.length < total) {
            const { body: tracksBody } = await spotifyApi.getPlaylistTracks(item.id, { offset, limit: 100 });
            allTracks = allTracks.concat(tracksBody.items);
            offset += 100;
          }
          // Sum durations
          const totalDurationMs = allTracks.reduce((sum, t) => sum + (t.track ? t.track.duration_ms : 0), 0);
          return {
            name: item.name,
            id: item.id,
            trackCount: total,
            totalDurationMs,
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

app.get('/playlist-genres/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    if (!playlistId) return res.status(400).json({ error: 'Missing playlist ID' });
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
    // Get the first artist ID for each track
    const artistIds = allTracks.map(item => item.track && item.track.artists && item.track.artists[0] && item.track.artists[0].id).filter(Boolean);
    // Fetch artist genres in batches of 50 (Spotify API limit)
    let genres = {};
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const { body } = await spotifyApi.getArtists(batch);
      body.artists.forEach(artist => {
        const genre = artist.genres && artist.genres.length > 0 ? artist.genres[0] : null;
        if (genre) {
          genres[genre] = (genres[genre] || 0) + 1;
        } else {
          genres['Unknown'] = (genres['Unknown'] || 0) + 1;
        }
      });
    }
    res.json({ genres });
  } catch (err) {
    console.error('Error analyzing playlist genres:', err);
    res.status(500).json({ error: 'Failed to analyze playlist genres' });
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
    // Count songs per artist (all artists per track)
    let artists = {};
    allTracks.forEach(item => {
      if (item.track && item.track.artists) {
        item.track.artists.forEach(artist => {
          if (artist && artist.name) {
            artists[artist.name] = (artists[artist.name] || 0) + 1;
          }
        });
      }
    });
    res.json({ artists });
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
  // Collect genres from top artists
  let genreCounts = {};
  (artists || []).forEach(artist => {
    (artist.genres || []).forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  return { tracks, artists, genres: genreCounts };
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

module.exports = pool;



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is also accessible on http://192.168.1.4:${PORT}`);
});
