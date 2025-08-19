/**
 * Optimized API Call System
 * 
 * This utility provides an efficient way to make API calls with intelligent caching
 * and rate limiting. It only adds delays between actual API calls, not between
 * cache hits and API calls.
 */

// Cache for storing API responses
const apiCache = new Map();
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
  const cached = apiCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    console.log(`Cache hit for: ${cacheKey}`);
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
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached response for: ${cacheKey}`);
}

/**
 * Creates a unique cache key for an API call
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - The parameters for the API call
 * @returns {string} - A unique cache key
 */
function createCacheKey(endpoint, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${endpoint}|${sortedParams}`;
}

/**
 * Makes an optimized API call with caching and intelligent delays
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
export async function optimizedApiCall(endpoint, options = {}) {
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
    console.log(`Making API call to: ${url.toString()}`);
    
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
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Makes multiple optimized API calls with intelligent batching and delays
 * @param {Array} apiCalls - Array of API call configurations
 * @param {number} delayBetweenApiCalls - Delay in milliseconds between API calls (default: 200)
 * @returns {Promise<Array>} - Array of results in the same order as input
 */
export async function optimizedBatchApiCalls(apiCalls, delayBetweenApiCalls = 200) {
  const results = [];
  let lastApiCallTime = 0;
  
  for (let i = 0; i < apiCalls.length; i++) {
    const apiCall = apiCalls[i];
    const { endpoint, options = {} } = apiCall;
    
    try {
      // Check if we need to make an API call or if it's cached
      const cacheKey = options.cacheKey || createCacheKey(endpoint, options.params);
      const cachedResponse = getCachedResponse(cacheKey);
      
      if (cachedResponse !== null) {
        // Cache hit - no delay needed
        console.log(`Cache hit for call ${i + 1}/${apiCalls.length}, no delay needed`);
        results.push({ success: true, data: cachedResponse, cached: true });
      } else {
        // Cache miss - need to make API call
        console.log(`Cache miss for call ${i + 1}/${apiCalls.length}, making API call`);
        
        // Check if we need to wait before making this API call
        const now = Date.now();
        const timeSinceLastApiCall = now - lastApiCallTime;
        
        if (timeSinceLastApiCall < delayBetweenApiCalls) {
          const waitTime = delayBetweenApiCalls - timeSinceLastApiCall;
          console.log(`Waiting ${waitTime}ms before API call ${i + 1}/${apiCalls.length}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Make the API call
        const startTime = Date.now();
        const data = await optimizedApiCall(endpoint, options);
        lastApiCallTime = Date.now();
        
        const callDuration = lastApiCallTime - startTime;
        console.log(`API call ${i + 1}/${apiCalls.length} completed in ${callDuration}ms`);
        
        results.push({ success: true, data, cached: false });
      }
    } catch (error) {
      console.error(`API call ${i + 1}/${apiCalls.length} failed:`, error);
      results.push({ success: false, error, cached: false });
    }
  }
  
  return results;
}

/**
 * Makes optimized API calls for track analysis with Spotify IDs
 * @param {Array<string>} spotifyTrackIds - Array of Spotify track IDs
 * @param {number} delayBetweenApiCalls - Delay in milliseconds between API calls (default: 200)
 * @returns {Promise<Array>} - Array of track analysis results
 */
export async function optimizedTrackAnalysisCalls(spotifyTrackIds, delayBetweenApiCalls = 200) {
  const apiCalls = spotifyTrackIds.map(trackId => ({
    endpoint: `http://127.0.0.1:8000/track-analysis/${trackId}`,
    options: {
      cacheKey: `track-analysis-${trackId}`,
      skipCache: false
    }
  }));
  
  return await optimizedBatchApiCalls(apiCalls, delayBetweenApiCalls);
}

/**
 * Makes optimized API calls for audio features with Spotify IDs
 * @param {Array<string>} spotifyTrackIds - Array of Spotify track IDs
 * @param {number} delayBetweenApiCalls - Delay in milliseconds between API calls (default: 200)
 * @returns {Promise<Array>} - Array of audio features results
 */
export async function optimizedAudioFeaturesCalls(spotifyTrackIds, delayBetweenApiCalls = 200) {
  const apiCalls = spotifyTrackIds.map(trackId => ({
    endpoint: `http://127.0.0.1:8000/audio-features/${trackId}`,
    options: {
      cacheKey: `audio-features-${trackId}`,
      skipCache: false
    }
  }));
  
  return await optimizedBatchApiCalls(apiCalls, delayBetweenApiCalls);
}

/**
 * Clears the API cache
 */
export function clearApiCache() {
  apiCache.clear();
  console.log('API cache cleared');
}

/**
 * Gets cache statistics
 * @returns {Object} - Cache statistics
 */
export function getApiCacheStats() {
  const totalEntries = apiCache.size;
  const validEntries = Array.from(apiCache.values()).filter(isCacheValid).length;
  const expiredEntries = totalEntries - validEntries;
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: expiredEntries
  };
}
