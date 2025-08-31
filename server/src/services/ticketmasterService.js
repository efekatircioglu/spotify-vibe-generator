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
    const attractions = response.data._embedded?.attractions || [];
    
    // Log the first few attractions with their IDs for debugging
    if (attractions.length > 0) {
      // Find music attractions and log their IDs
      const musicAttractions = attractions.filter(a => 
        a.type === 'attraction' && 
        a.classifications?.[0]?.segment?.name === 'Music' && 
        a.classifications?.[0]?.primary
      );
    }
    // Return the first matching artist or all if needed
    return response.data;
  } catch (error) {
    console.error('Artist search failed:', error.message);
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
    
    let allEvents = [];
    let page = 0;
    let hasMorePages = true;
    let totalApiCalls = 0;
    
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
      
      const response = await axios.get(url, { params });
      const data = response.data;
      const events = data._embedded?.events || [];
      
      totalApiCalls++;
      
      allEvents = allEvents.concat(events);
      
      // Check if there are more pages
      const pageInfo = data.page || {};
      hasMorePages = page < pageInfo.totalPages - 1;
      page++;
      
      // Safety check to prevent infinite loops
      if (page > 10) {
        break;
      }
    }
    
    // Return both events and API call count
    return { 
      _embedded: { events: allEvents },
      apiCallCount: totalApiCalls
    };
  } catch (error) {
    console.error('Batch API error:', error.response?.data || error.message);
    throw new Error('Failed to get events from Ticketmaster');
  }
}

module.exports = {
  searchArtist,
  getEventsByArtistId,
  getEventsByMultipleArtistIds,
}; 