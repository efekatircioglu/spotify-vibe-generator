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

async function getEventsByArtistId(artistId, location = null) {
  const url = `${BASE_URL}/events.json`;
  try {
    const params = {
      attractionId: artistId,
      apikey: TICKETMASTER_API_KEY,
    };
    
    // Add location parameter if provided
    if (location) {
      params.city = location;
    }
    
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get events from Ticketmaster');
  }
}

async function getEventsByMultipleArtistIds(artistIds, location = null) {
  const url = `${BASE_URL}/events.json`;
  try {
    // Join artist IDs with commas, no spaces
    const attractionIds = artistIds.join(',');
    
    console.log(`Making batch request for ${artistIds.length} artists: ${attractionIds}`);
    
    let allEvents = [];
    let page = 0;
    let hasMorePages = true;
    
    // Fetch all pages of events
    while (hasMorePages) {
      const params = {
        attractionId: attractionIds,
        apikey: TICKETMASTER_API_KEY,
        page: page,
        size: 200 // Maximum page size to reduce number of requests
      };
      
      // Add location parameter if provided
      if (location) {
        params.city = location;
      }
      
      console.log(`Fetching page ${page} with ${params.size} events per page`);
      
      const response = await axios.get(url, { params });
      const data = response.data;
      const events = data._embedded?.events || [];
      
      console.log(`Page ${page}: Found ${events.length} events`);
      
      allEvents = allEvents.concat(events);
      
      // Check if there are more pages
      const pageInfo = data.page || {};
      hasMorePages = page < pageInfo.totalPages - 1;
      page++;
      
      // Safety check to prevent infinite loops
      if (page > 10) {
        console.log('Reached maximum page limit (10), stopping pagination');
        break;
      }
    }
    
    console.log(`Total events found across all pages: ${allEvents.length}`);
    return { _embedded: { events: allEvents } };
  } catch (error) {
    console.error('Batch Ticketmaster API error:', error.response?.data || error.message);
    throw new Error('Failed to get events from Ticketmaster');
  }
}

module.exports = {
  searchArtist,
  getEventsByArtistId,
  getEventsByMultipleArtistIds,
}; 