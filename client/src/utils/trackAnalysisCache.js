// Persistent cache for ISRC/MBID mapping, using localStorage
import { safeSetItem, safeGetItem, safeRemoveItem, hasStorageSpace } from './safeStorage';

const CACHE_KEY = 'trackAnalysisCache';
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB limit (tracks can have more data)
const MAX_CACHE_ENTRIES = 2000; // Maximum number of cached tracks
let cache = {};

// Helper function to estimate cache size
const estimateCacheSize = (cache) => {
  try {
    return new Blob([JSON.stringify(cache)]).size;
  } catch (error) {
    // Fallback: rough estimation based on string length
    return JSON.stringify(cache).length * 2; // UTF-16 characters
  }
};

// Helper function to clean old cache entries
const cleanCache = (cache) => {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_CACHE_ENTRIES / 2) return cache; // Don't clean if cache is small
  
  // Sort by timestamp (if available) or keep most recent entries
  const sortedEntries = entries.sort((a, b) => {
    const aTime = a[1].timestamp || 0;
    const bTime = b[1].timestamp || 0;
    return bTime - aTime;
  });
  
  // Keep only the most recent entries
  const cleanedCache = {};
  const entriesToKeep = Math.floor(MAX_CACHE_ENTRIES * 0.7); // Keep 70% of max
  
  for (let i = 0; i < Math.min(entriesToKeep, sortedEntries.length); i++) {
    const [key, value] = sortedEntries[i];
    cleanedCache[key] = value;
  }
  
  return cleanedCache;
};

function isValidSpotifyId(id) {
  return typeof id === 'string' && id.length === 22 && /^[A-Za-z0-9]+$/.test(id);
}

function loadCache() {
  try {
    const data = safeGetItem(CACHE_KEY, {});
    // Only keep valid Spotify IDs
    cache = {};
    for (const key in data) {
      if (isValidSpotifyId(key)) {
        cache[key] = data[key];
      }
    }
  } catch (e) {
    console.error('Error loading track analysis cache:', e);
    // If loading fails, try to clear and start fresh
    try {
      safeRemoveItem(CACHE_KEY);
    } catch (clearError) {
      console.error('Error clearing corrupted track cache:', clearError);
    }
    cache = {};
  }
}

function saveCache() {
  try {
    // Check if cache is getting too large before saving
    const estimatedSize = estimateCacheSize(cache);
    
    if (estimatedSize > MAX_CACHE_SIZE || Object.keys(cache).length > MAX_CACHE_ENTRIES) {
      console.warn('Track cache size limit reached, cleaning old entries...');
      const cleanedCache = cleanCache(cache);
      
      // Try to save the cleaned cache
      const saveSuccess = safeSetItem(CACHE_KEY, cleanedCache);
      if (saveSuccess) {
        console.log('Track cache cleaned and saved successfully');
        // Update the in-memory cache to the cleaned version
        cache = cleanedCache;
      } else {
        console.warn('Cannot save cleaned cache - storage quota exceeded');
        // Keep the cleaned cache in memory but don't save
        cache = cleanedCache;
      }
    } else {
      // Normal save operation
      const saveSuccess = safeSetItem(CACHE_KEY, cache);
      if (!saveSuccess) {
        console.warn('Cannot save cache - storage quota exceeded');
      }
    }
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      console.warn('localStorage quota exceeded for track cache, attempting to clean...');
      
      try {
        // Try to clean the cache and save again
        const cleanedCache = cleanCache(cache);
        const saveSuccess = safeSetItem(CACHE_KEY, cleanedCache);
        if (saveSuccess) {
          console.log('Track cache cleaned and saved after quota error');
          cache = cleanedCache;
        } else {
          console.warn('Cannot save even cleaned cache - storage quota exceeded');
          // Keep cleaned cache in memory but don't save
          cache = cleanedCache;
        }
      } catch (cleanError) {
        console.error('Failed to clean track cache after quota error:', cleanError);
        // Keep current cache in memory but don't save
      }
    } else {
      console.error('Error saving track analysis cache:', error);
    }
  }
}

export function getTrackISRC(spotifyId) {
  return cache[spotifyId]?.isrc;
}

export function setTrackISRC(spotifyId, isrc) {
  if (!isValidSpotifyId(spotifyId)) return;
  cache[spotifyId] = { ...cache[spotifyId], isrc, timestamp: Date.now() };
  saveCache();
}

export function getTrackMBID(spotifyId) {
  return cache[spotifyId]?.mbid;
}

export function setTrackMBID(spotifyId, mbid) {
  if (!isValidSpotifyId(spotifyId)) return;
  cache[spotifyId] = { ...cache[spotifyId], mbid, timestamp: Date.now() };
  saveCache();
}

// New functions for caching analysis data
export function getTrackAnalysis(spotifyId) {
  return cache[spotifyId]?.analysis;
}

export function setTrackAnalysis(spotifyId, analysis) {
  if (!isValidSpotifyId(spotifyId)) return;
  cache[spotifyId] = { ...cache[spotifyId], analysis, timestamp: Date.now() };
  saveCache();
}

export function hasValidAnalysis(spotifyId) {
  const analysis = getTrackAnalysis(spotifyId);
  return analysis && analysis.highLevel && analysis.lowLevel;
}

export async function lookupTrackMBID(spotifyId) {
  if (!spotifyId) {
    console.warn('No Spotify ID provided for MBID lookup');
    return null;
  }
  const cachedMBID = getTrackMBID(spotifyId);
  if (cachedMBID && cachedMBID !== 'Not Found') {
    return cachedMBID;
  }
  let isrc = getTrackISRC(spotifyId);
  if (!isrc) {
    try {
      const isrcRes = await fetch(`http://127.0.0.1:8000/track-isrc/${spotifyId}`);
      if (!isrcRes.ok) {
        setTrackISRC(spotifyId, 'Not found');
        return null;
      }
      const isrcData = await isrcRes.json();
      isrc = isrcData.isrc || 'Not found';
      setTrackISRC(spotifyId, isrc);
    } catch (error) {
      setTrackISRC(spotifyId, 'Not found');
      return null;
    }
  }
  if (!isrc || isrc === 'Not found') {
    setTrackMBID(spotifyId, 'Not Found');
    return null;
  }
  try {
    const mbidRes = await fetch(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`, {
      headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
    });
    if (!mbidRes.ok) {
      setTrackMBID(spotifyId, 'Not Found');
      return null;
    }
    const mbidData = await mbidRes.json();
    const mbid = mbidData.recordings && mbidData.recordings.length > 0 ? mbidData.recordings[0].id : null;
    if (mbid) {
      setTrackMBID(spotifyId, mbid);
      return mbid;
    } else {
      setTrackMBID(spotifyId, 'Not Found');
      return null;
    }
  } catch (error) {
    setTrackMBID(spotifyId, 'Not Found');
    return null;
  }
}

loadCache();
