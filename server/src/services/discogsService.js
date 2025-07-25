const fetch = require('node-fetch');

const DISCOGS_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_SECRET = process.env.DISCOGS_CONSUMER_SECRET;
const DISCOGS_USER_AGENT = process.env.DISCOGS_USER_AGENT;

async function getArtistBio(artistName) {
  const authHeaders = {
    'User-Agent': DISCOGS_USER_AGENT,
    'Authorization': `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
  };

  try {
    console.log(`[Discogs] Searching for artist: ${artistName}`);
    // Step 1: Search for the artist to get their ID
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist`;
    const searchResponse = await fetch(searchUrl, { headers: authHeaders });
    if (!searchResponse.ok) {
      console.error(`[Discogs] Search failed with status: ${searchResponse.status}`);
      throw new Error(`Search failed with status: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    console.log(`[Discogs] Search results:`, searchData.results && searchData.results.length ? searchData.results[0] : 'No results');
    if (!searchData.results || searchData.results.length === 0) {
      return { error: 'Artist not found.' };
    }
    const artistId = searchData.results[0].id;
    console.log(`[Discogs] Artist ID: ${artistId}`);

    // Step 2: Use the ID to get the full artist profile
    console.log(`[Discogs] Fetching details for artist ID: ${artistId}`);
    const artistUrl = `https://api.discogs.com/artists/${artistId}`;
    const artistResponse = await fetch(artistUrl, { headers: authHeaders });
    if (!artistResponse.ok) {
      console.error(`[Discogs] Fetching artist profile failed with status: ${artistResponse.status}`);
      throw new Error(`Fetching artist profile failed with status: ${artistResponse.status}`);
    }
    const artistData = await artistResponse.json();
    console.log(`[Discogs] Artist profile:`, artistData.profile ? artistData.profile.substring(0, 120) + '...' : 'No profile');
    return {
        artistId: artistData.artistId,
      name: artistData.name,
      realName: artistData.realname || null,
      profile: artistData.profile,
      //
    };
  } catch (error) {
    console.error('Discogs API Error:', error);
    return { error: error.message };
  }
}

module.exports = { getArtistBio };
