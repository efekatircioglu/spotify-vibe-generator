const axios = require('axios');

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_CONSUMER_KEY;
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

async function searchArtist(artistName) {
  const url = `${BASE_URL}/attractions.json`;
  try {
    const response = await axios.get(url, {
      params: {
        keyword: artistName,
        apikey: TICKETMASTER_API_KEY,
      },
    });
    // Return the first matching artist or all if needed
    return response.data;
  } catch (error) {
    throw new Error('Failed to search artist on Ticketmaster');
  }
}

async function getEventsByArtistId(artistId) {
  const url = `${BASE_URL}/events.json`;
  try {
    const response = await axios.get(url, {
      params: {
        attractionId: artistId,
        apikey: TICKETMASTER_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get events from Ticketmaster');
  }
}

module.exports = {
  searchArtist,
  getEventsByArtistId,
}; 