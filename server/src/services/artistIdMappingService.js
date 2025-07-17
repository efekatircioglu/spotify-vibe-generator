const axios = require('axios');
const spotifyService = require('./spotifyService');
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_CONSUMER_KEY;

// 1. Get a popular track for the artist
async function getPopularTrackIdForArtist(spotifyApi, artistId) {
  // Use Spotify API to get the artist's top tracks (default: country=US)
  const { body } = await spotifyApi.getArtistTopTracks(artistId, 'US');
  if (!body.tracks || body.tracks.length === 0) throw new Error('No top tracks found for artist');
  const trackId = body.tracks[0].id;
  console.log(`[Mapping] Popular track ID for artist ${artistId}:`, trackId);
  return trackId;
}

// 2. Get ISRC from Spotify
async function getISRCFromSpotifyTrack(spotifyApi, trackId) {
  const { body } = await spotifyApi.getTrack(trackId);
  const isrc = body && body.external_ids && body.external_ids.isrc ? body.external_ids.isrc : null;
  console.log(`[Mapping] ISRC for track ${trackId}:`, isrc);
  if (!isrc) throw new Error('No ISRC found for track');
  return isrc;
}

// 3. Get MBID from MusicBrainz using ISRC
async function getMBIDFromISRC(isrc) {
  const url = `https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`;
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
  });
  const recordings = response.data.recordings;
  if (!recordings || recordings.length === 0) throw new Error('No MusicBrainz recording found for ISRC');
  // Find the first artist-credit with an artist id
  const artistCredit = recordings[0]['artist-credit'];
  if (!artistCredit || artistCredit.length === 0 || !artistCredit[0].artist || !artistCredit[0].artist.id) throw new Error('No MBID found in MusicBrainz recording');
  const mbid = artistCredit[0].artist.id;
  console.log(`[Mapping] MBID for ISRC ${isrc}:`, mbid);
  return mbid;
}

// 4. Get Ticketmaster ID from MBID
async function getTicketmasterIdFromMBID(mbid) {
  const url = `https://app.ticketmaster.com/discovery/v2/attractions.json`;
  const response = await axios.get(url, {
    params: {
      musicBrainzId: mbid,
      apikey: TICKETMASTER_API_KEY,
    },
  });
  const attractions = response.data._embedded && response.data._embedded.attractions;
  if (!attractions || attractions.length === 0) throw new Error('No Ticketmaster artist found for MBID');
  const ticketmasterId = attractions[0].id;
  console.log(`[Mapping] Ticketmaster ID for MBID ${mbid}:`, ticketmasterId);
  return ticketmasterId;
}

// Main function: Spotify Artist ID -> Ticketmaster ID
async function spotifyArtistIdToTicketmasterId(spotifyApi, artistId) {
  console.log(`[Mapping] Starting mapping for Spotify artist ID:`, artistId);
  // 1. Get a popular track for the artist
  const trackId = await getPopularTrackIdForArtist(spotifyApi, artistId);
  // 2. Get ISRC from Spotify
  const isrc = await getISRCFromSpotifyTrack(spotifyApi, trackId);
  // 3. Get MBID from MusicBrainz
  const mbid = await getMBIDFromISRC(isrc);
  // 4. Get Ticketmaster ID
  const ticketmasterId = await getTicketmasterIdFromMBID(mbid);
  console.log(`[Mapping] Final result for artist ${artistId}:`, { ticketmasterId, mbid, isrc, trackId });
  return { ticketmasterId, mbid, isrc, trackId };
}

module.exports = {
  spotifyArtistIdToTicketmasterId,
  getPopularTrackIdForArtist,
  getISRCFromSpotifyTrack,
  getMBIDFromISRC,
  getTicketmasterIdFromMBID,
}; 