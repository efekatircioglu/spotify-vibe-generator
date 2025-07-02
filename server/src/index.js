const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '../.env') }); 
const cors = require('cors'); 
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});