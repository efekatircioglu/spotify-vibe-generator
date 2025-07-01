// This spotifyApi object will be passed in from our main index.js file
let spotifyApi;

function setSpotifyApi(api) {
  spotifyApi = api;
}

// --- INTERNAL HELPER FUNCTIONS  ---

/**
 * Fetches the audio features for a given list of track IDs.
 * @param {string[]} trackIds - An array of Spotify track IDs.
 * @returns {Promise<object[]>} - A promise that resolves to an array of audio feature objects.
 */
async function _getAudioFeaturesForTracks(trackIds) {
  console.log('Fetching audio features for tracks...');
  const { body } = await spotifyApi.getAudioFeaturesForTracks(trackIds);
  return body.audio_features;
}

/**
 * Calculates the average audio features from an array of feature objects.
 * @param {object[]} audioFeatures - An array of audio feature objects.
 * @returns {object} - An object containing the calculated average values.
 */
function _calculateAverageVibe(audioFeatures) {
  console.log('Calculating average vibe...');
  const average = {
    danceability: 0,
    energy: 0,
    valence: 0,
    acousticness: 0,
    instrumentalness: 0,
    speechiness: 0,
  };
  const featureCount = audioFeatures.length;

  for (const features of audioFeatures) {
    for (const key in average) {
      average[key] += features[key];
    }
  }

  for (const key in average) {
    average[key] = average[key] / featureCount;
  }

  return average;
}

// --- PUBLIC ANALYZER FUNCTIONS (Our "Subclass" Implementations) ---

/**
 * Analyzes the user's 50 most recently played tracks.
 * @returns {Promise<object>} - A promise that resolves to the analysis result.
 */
async function analyzeRecentTracks() {
  console.log('Starting analysis of recent tracks...');
  if (spotifyApi.getAccessToken) {
    console.log('Current Access Token:', spotifyApi.getAccessToken());
  }
  if (spotifyApi.getCredentials && spotifyApi.getCredentials().scopes) {
    console.log('Current Scopes:', spotifyApi.getCredentials().scopes);
  }
  // Only fetch the last 5 tracks
  const { body } = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 5 });
  const trackIds = body.items.map(item => item.track && item.track.id).filter(Boolean);
  console.log('Fetched track IDs:', trackIds);

  // Remove duplicates
  const uniqueTrackIds = [...new Set(trackIds)];
  console.log('Unique track IDs:', uniqueTrackIds);

  if (!uniqueTrackIds.length) {
    throw new Error('No recent tracks found for this user.');
  }

  // Fetch audio features for each track one by one
  let audioFeatures = [];
  for (const trackId of uniqueTrackIds) {
    try {
      const { body } = await spotifyApi.getAudioFeaturesForTrack(trackId);
      if (body) {
        audioFeatures.push(body);
        console.log(`Track ID: ${trackId}`);
        console.log(`  Danceability: ${body.danceability}`);
        console.log(`  Energy: ${body.energy}`);
        console.log(`  Valence: ${body.valence}`);
        console.log(`  Acousticness: ${body.acousticness}`);
        console.log(`  Instrumentalness: ${body.instrumentalness}`);
        console.log(`  Speechiness: ${body.speechiness}`);
      } else {
        console.log(`No audio features found for track ID: ${trackId}`);
      }
    } catch (err) {
      console.error(`Error fetching audio features for track ID ${trackId}:`, err.body || err);
    }
  }

  if (!audioFeatures.length) {
    throw new Error('No audio features found for recent tracks.');
  }

  const analysisResult = _calculateAverageVibe(audioFeatures);
  return analysisResult;
} 

/**
 * Analyzes a specific playlist given by its ID.
 * @param {string} playlistId - The ID of the Spotify playlist to analyze.
 * @returns {Promise<object>} - A promise that resolves to the analysis result.
 */
async function analyzePlaylist(playlistId) {
  console.log(`Starting analysis of playlist: ${playlistId}`);
  // 1. Get the track IDs from the API (the unique part)
  const { body } = await spotifyApi.getPlaylistTracks(playlistId);
  const trackIds = body.items.map(item => item.track.id);
  
  // 2. Reuse our helper function to get audio features
  const audioFeatures = await _getAudioFeaturesForTracks(trackIds);

  // 3. Reuse our helper function to calculate the average vibe
  const analysisResult = _calculateAverageVibe(audioFeatures);

  return analysisResult;
}

// We export the functions we want other files to be able to use.
module.exports = {
  setSpotifyApi,
  analyzeRecentTracks,
  analyzePlaylist,
};