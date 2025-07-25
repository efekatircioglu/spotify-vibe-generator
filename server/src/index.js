const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '../.env') }); 
const cors = require('cors'); 
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const { Pool } = require('pg');
const pool = new Pool(); // Uses .env variables automatically
const axios = require('axios');
const { getDiscogsArtistProfile } = require('./services/discogsService');
const { getArtistBio } = require('./services/discogsService');

const app = express();
const PORT = 8000;

// after being logged in go to localhost:3000 (now it has welcome, your name)
app.use(cors({
  origin: 'http://localhost:3000'
}));

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
    res.redirect('http://localhost:3000');
 
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
  const { artistId } = req.query;
  if (!artistId) return res.status(400).json({ error: 'Missing artist ID' });
  try {
    const data = await ticketmasterService.getEventsByArtistId(artistId);
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

module.exports = pool;



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
