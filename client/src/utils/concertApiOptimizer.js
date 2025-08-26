/**
 * Concert API Optimizer
 * 
 * This utility provides optimized API calls for concert-related operations,
 * integrating with the existing artist cache system and implementing
 * intelligent delays between API calls.
 */

import { getCachedArtistId, getCachedArtistImage, getCachedSpotifyId, isArtistCached, getCachedArtistStatus, setFailedArtistCache, setArtistCache } from './artistCache';

// Cache for storing API responses
const concertApiCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Checks if a cached response is still valid
 * @param {Object} cachedItem - The cached item to check
 * @returns {boolean} - Whether the cached item is still valid
 */
function isCacheValid(cachedItem) {
  // For artist cache items (no timestamp), consider them always valid
  if (!cachedItem) return false;
  
  // If it has a timestamp, check expiry (for API responses)
  if (cachedItem.timestamp) {
    return Date.now() - cachedItem.timestamp < CACHE_EXPIRY;
  }
  
  // If no timestamp, it's an artist cache item - always valid
  return true;
}

/**
 * Gets a cached response if available and valid
 * @param {string} cacheKey - The key to look up in cache
 * @returns {*} - The cached response or null if not found/invalid
 */
function getCachedResponse(cacheKey) {
  const cached = concertApiCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    console.log(`Concert API cache hit for: ${cacheKey}`);
    return cached.data;
  }
  return null;
}

/**
 * Stores a response in the cache
 * @param {string} cacheKey - The key to store the response under
 * @param {*} data - The data to cache
 */
function cacheResponse(cacheKey, data) {
  concertApiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached concert API response for: ${cacheKey}`);
}

/**
 * Creates a unique cache key for a concert API call
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - The parameters for the API call
 * @returns {string} - A unique cache key
 */
function createCacheKey(endpoint, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `concert-${endpoint}|${sortedParams}`;
}

/**
 * Makes an optimized API call for concert-related operations
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} options - Options for the API call
 * @param {Object} options.params - Query parameters for the API call
 * @param {Object} options.body - Request body for POST requests
 * @param {string} options.method - HTTP method (default: 'GET')
 * @param {Object} options.headers - Additional headers
 * @param {string} options.cacheKey - Custom cache key (optional)
 * @param {boolean} options.skipCache - Whether to skip cache checking
 * @returns {Promise<*>} - The API response
 */
export async function optimizedConcertApiCall(endpoint, options = {}) {
  const {
    params = {},
    body = null,
    method = 'GET',
    headers = {},
    cacheKey = null,
    skipCache = false
  } = options;

  // Create cache key if not provided
  const finalCacheKey = cacheKey || createCacheKey(endpoint, params);
  
  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cachedResponse = getCachedResponse(finalCacheKey);
    if (cachedResponse !== null) {
      return cachedResponse;
    }
  }

  // Build the full URL with query parameters
  const url = new URL(endpoint, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  // Prepare request options
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    console.log(`Making concert API call to: ${url.toString()}`);
    
    const response = await fetch(url.toString(), requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the successful response
    if (!skipCache) {
      cacheResponse(finalCacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Concert API call failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Optimizes artist search by checking cache first, then making API calls with delays
 * @param {Array<string>} artistNames - Array of artist names to search for
 * @param {number} delayBetweenApiCalls - Delay in milliseconds between API calls (default: 200)
 * @param {Function} progressCallback - Optional callback for real-time progress updates (current, total)
 * @returns {Promise<Array>} - Array of artist search results
 */
export async function optimizedArtistSearch(artistNames, delayBetweenApiCalls = 200, progressCallback = null) {
  const results = [];
  let lastApiCallTime = 0;
  
  for (let i = 0; i < artistNames.length; i++) {
    const artistName = artistNames[i];
    
    try {
      // Update progress callback
      if (progressCallback) {
        progressCallback(i + 1, artistNames.length);
      }
      
      // Check if artist is cached (either successful or failed)
      const isCached = isArtistCached(artistName);
      const cachedStatus = getCachedArtistStatus(artistName);
      
      if (isCached) {
        if (cachedStatus === 'success') {
          // Cache hit - successful search
          const cachedId = getCachedArtistId(artistName);
          const cachedImage = getCachedArtistImage(artistName);
          const cachedSpotifyId = getCachedSpotifyId(artistName);
          
          console.log(`Artist cache hit for "${artistName}" (${i + 1}/${artistNames.length}), no delay needed`);
          
          const cachedArtist = {
            id: cachedId,
            name: artistName,
            images: cachedImage ? [{ url: cachedImage }] : [],
            spotifyId: cachedSpotifyId,
            classifications: [{ segment: { name: 'Music' } }],
            cached: true
          };
          
          results.push({ success: true, data: cachedArtist, cached: true });
        } else if (cachedStatus === 'failed') {
          // Cache hit - failed search
          console.log(`Artist cache hit for "${artistName}" (${i + 1}/${artistNames.length}) - previously failed, skipping API call`);
          results.push({ success: false, error: 'No music artists found (cached failure)', cached: true });
        }
      } else {
        // Cache miss - need to make API call
        console.log(`Artist cache miss for "${artistName}" (${i + 1}/${artistNames.length}), making API call`);
        
        // Check if we need to wait before making this API call
        const now = Date.now();
        const timeSinceLastApiCall = now - lastApiCallTime;
        
        if (timeSinceLastApiCall < delayBetweenApiCalls) {
          const waitTime = delayBetweenApiCalls - timeSinceLastApiCall;
          console.log(`Waiting ${waitTime}ms before API call for "${artistName}"`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Make the API call
        const startTime = Date.now();
        const searchData = await optimizedConcertApiCall(
          'http://127.0.0.1:8000/ticketmaster/search-artist',
          {
            params: { artistName },
            cacheKey: `artist-search-${artistName.toLowerCase()}`
          }
        );
        lastApiCallTime = Date.now();
        
        const callDuration = lastApiCallTime - startTime;
        console.log(`Artist search API call for "${artistName}" completed in ${callDuration}ms`);
        
        // Process the search results
        const attractions = searchData._embedded?.attractions || searchData.attractions || [];
        const musicArtists = attractions.filter(artist => {
          const isMusic = artist.classifications && 
            artist.classifications.some(classification => 
              classification.segment && classification.segment.name === 'Music'
            );
          return isMusic;
        });
        
        if (musicArtists.length > 0) {
          const firstArtist = musicArtists[0];
          // Cache the successful result with bidirectional mapping
          setArtistCache(artistName, firstArtist.id, firstArtist.images?.[0]?.url || null, null, firstArtist.name);
          console.log(`[OptimizedSearch] Cached bidirectional mapping: "${artistName}" ↔ "${firstArtist.name}" → ${firstArtist.id}`);
          results.push({ success: true, data: firstArtist, cached: false });
        } else {
          // Cache the failed search to avoid repeated API calls
          setFailedArtistCache(artistName);
          results.push({ success: false, error: 'No music artists found', cached: false });
        }
      }
    } catch (error) {
      console.error(`Artist search failed for "${artistName}":`, error);
      // Cache the failed search to avoid repeated API calls
      setFailedArtistCache(artistName);
      results.push({ success: false, error, cached: false });
    }
  }
  
  return results;
}

/**
 * Optimizes concert search by checking cache first, then making API calls with delays
 * @param {Array<string>} artistIds - Array of artist IDs to search concerts for
 * @param {number} delayBetweenApiCalls - Delay in milliseconds between API calls (default: 200)
 * @returns {Promise<Array>} - Array of concert search results
 */
export async function optimizedConcertSearch(artistIds, delayBetweenApiCalls = 200) {
  const results = [];
  let lastApiCallTime = 0;
  
  for (let i = 0; i < artistIds.length; i++) {
    const artistId = artistIds[i];
    
    try {
      // Check concert cache first
      const cacheKey = `concerts-${artistId}`;
      const cachedConcerts = getCachedResponse(cacheKey);
      
      if (cachedConcerts) {
        // Cache hit - no delay needed
        console.log(`Concert cache hit for artist ID ${artistId} (${i + 1}/${artistIds.length}), no delay needed`);
        results.push({ success: true, data: cachedConcerts, cached: true });
      } else {
        // Cache miss - need to make API call
        console.log(`Concert cache miss for artist ID ${artistId} (${i + 1}/${artistIds.length}), making API call`);
        
        // Check if we need to wait before making this API call
        const now = Date.now();
        const timeSinceLastApiCall = now - lastApiCallTime;
        
        if (timeSinceLastApiCall < delayBetweenApiCalls) {
          const waitTime = delayBetweenApiCalls - timeSinceLastApiCall;
          console.log(`Waiting ${waitTime}ms before concert API call for artist ID ${artistId}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Make the API call
        const startTime = Date.now();
        const concertData = await optimizedConcertApiCall(
          'http://127.0.0.1:8000/concerts/events/optimized-batch',
          {
            method: 'POST',
            body: { artistIds: [artistId] },
            cacheKey: `concerts-${artistId}`
          }
        );
        lastApiCallTime = Date.now();
        
        const callDuration = lastApiCallTime - startTime;
        console.log(`Concert API call for artist ID ${artistId} completed in ${callDuration}ms`);
        
        results.push({ success: true, data: concertData, cached: false });
      }
    } catch (error) {
      console.error(`Concert search failed for artist ID ${artistId}:`, error);
      results.push({ success: false, error, cached: false });
    }
  }
  
  return results;
}

/**
 * Clears the concert API cache
 */
export function clearConcertApiCache() {
  concertApiCache.clear();
  console.log('Concert API cache cleared');
}

/**
 * Gets concert API cache statistics
 * @returns {Object} - Cache statistics
 */
export function getConcertApiCacheStats() {
  const totalEntries = concertApiCache.size;
  const validEntries = Array.from(concertApiCache.values()).filter(isCacheValid).length;
  const expiredEntries = totalEntries - validEntries;
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: expiredEntries
  };
}
