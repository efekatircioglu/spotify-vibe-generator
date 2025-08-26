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
    // Step 1: Search for the artist to get their ID
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist`;
    const searchResponse = await fetch(searchUrl, { headers: authHeaders });
    if (!searchResponse.ok) {
      console.error(`[Discogs] Search failed with status: ${searchResponse.status}`);
      throw new Error(`Search failed with status: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    // Search results received
    if (!searchData.results || searchData.results.length === 0) {
      return { error: 'Artist not found.' };
    }
    const artistId = searchData.results[0].id;

    // Step 2: Use the ID to get the full artist profile
    // Fetching details for artist ID...
    const artistUrl = `https://api.discogs.com/artists/${artistId}`;
    const artistResponse = await fetch(artistUrl, { headers: authHeaders });
    if (!artistResponse.ok) {
      console.error(`[Discogs] Fetching artist profile failed with status: ${artistResponse.status}`);
      throw new Error(`Fetching artist profile failed with status: ${artistResponse.status}`);
    }
    const artistData = await artistResponse.json();
    // Artist profile fetched
    return {
      artistId: artistData.artistId,
      name: artistData.name,
      realName: artistData.realname || null,
      profile: artistData.profile,
    };
  } catch (error) {
    console.error('Discogs API Error:', error);
    return { error: error.message };
  }
}

/**
 * Fetch all albums (masters, format=album) for an artist from Discogs, paginating through all pages.
 * @param {string} artistName
 * @returns {Promise<Array>} Array of album objects
 */
async function getAllAlbumsByArtistName(artistName) {
  const authHeaders = {
    'User-Agent': DISCOGS_USER_AGENT,
    'Authorization': `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
  };
  const albums = [];
  let page = 1;
  let pages = 1;
  try {
    do {
      const url = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artistName)}&type=master&format=album&page=${page}&per_page=100`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error(`Discogs API error: ${res.status}`);
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        // Only include albums where the main artist is exactly the artistName (case-insensitive)
        const filtered = data.results.filter(r => {
          // Discogs returns 'title' as 'Artist - Album', so split and check artist part
          if (!r.title) return false;
          const dashIdx = r.title.indexOf(' - ');
          if (dashIdx === -1) return false;
          const mainArtist = r.title.substring(0, dashIdx).trim().toLowerCase();
          const target = artistName.trim().toLowerCase();
          // Allow exact match, startsWith, or 'Artist (number)'
          if (mainArtist === target) return true;
          if (mainArtist.startsWith(target + ' ')) return true;
          if (mainArtist.match(new RegExp(`^${target} \(\d+\)$`))) return true;
          return false;
        });
        albums.push(...filtered);
      }
      pages = data.pagination ? data.pagination.pages : 1;
      page++;
    } while (page <= pages);
    return albums;
  } catch (err) {
    console.error('[Discogs] Error fetching all albums:', err);
    throw err;
  }
}

/**
 * Map album title to [genre, style] arrays for all albums by artist.
 * @param {string} artistName
 * @returns {Promise<Object>} { [albumTitle]: [genres, styles] }
 */
async function getAlbumGenreStyleMapByArtistName(artistName) {
  const albums = await getAllAlbumsByArtistName(artistName);
  const map = {};
  for (const album of albums) {
    // genre and style can be arrays or undefined
    map[album.title] = [album.genre || [], album.style || []];
  }
  return map;
}

/**
 * Get the primary genre for an artist from Discogs by analyzing their albums.
 * @param {string} artistName
 * @returns {Promise<Object>} { primaryGenre: string, confidence: number } or { error: string }
 */
async function getArtistPrimaryGenre(artistName) {
  try {
    const albums = await getAllAlbumsByArtistName(artistName);
    if (!albums || albums.length === 0) {
      return { error: 'No albums found for artist' };
    }

    // Count genre occurrences across all albums
    const genreCounts = {};
    let totalAlbumsWithGenres = 0;

    for (const album of albums) {
      if (album.genre && Array.isArray(album.genre) && album.genre.length > 0) {
        totalAlbumsWithGenres++;
        for (const genre of album.genre) {
          if (genre && genre.trim()) {
            const cleanGenre = genre.trim().toLowerCase();
            genreCounts[cleanGenre] = (genreCounts[cleanGenre] || 0) + 1;
          }
        }
      }
    }

    if (totalAlbumsWithGenres === 0) {
      return { error: 'No genre information available for artist' };
    }

    // Find the most common genre
    let primaryGenre = null;
    let maxCount = 0;

    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryGenre = genre;
      }
    }

    // Calculate confidence based on how dominant the primary genre is
    const confidence = maxCount / totalAlbumsWithGenres;

    return {
      primaryGenre: primaryGenre.charAt(0).toUpperCase() + primaryGenre.slice(1), // Capitalize first letter
      confidence: Math.round(confidence * 100) / 100
    };
  } catch (error) {
    console.error('Discogs API Error getting primary genre:', error);
    return { error: error.message };
  }
}

module.exports = { getArtistBio, getAllAlbumsByArtistName, getAlbumGenreStyleMapByArtistName, getArtistPrimaryGenre };
