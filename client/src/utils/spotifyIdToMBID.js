// Simple cache for Spotify ID to ISRC/MBID mapping, using localStorage
import { safeSetItem, safeGetItem, safeRemoveItem } from './safeStorage';

const CACHE_KEY = 'spotifyIdToMBID';
const MAX_CACHE_ENTRIES = 5000; // Maximum number of cached mappings
let cache = {};

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
    console.error('Error loading Spotify ID to MBID cache:', e);
    // If loading fails, try to clear and start fresh
    try {
      safeRemoveItem(CACHE_KEY);
    } catch (clearError) {
      console.error('Error clearing corrupted cache:', clearError);
    }
    cache = {};
  }
}

function saveCache() {
  try {
    // Check if cache is getting too large before saving
    if (Object.keys(cache).length > MAX_CACHE_ENTRIES) {
      console.warn('Cache size limit reached, clearing old entries...');
      // Simple approach: keep only the most recent entries
      const entries = Object.entries(cache);
      const entriesToKeep = Math.floor(MAX_CACHE_ENTRIES * 0.8); // Keep 80% of max
      cache = Object.fromEntries(entries.slice(0, entriesToKeep));
    }
    
    const saveSuccess = safeSetItem(CACHE_KEY, cache);
    if (!saveSuccess) {
      console.warn('Cannot save cache - storage quota exceeded');
    }
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

export function getTrackISRC(spotifyId) {
  return cache[spotifyId]?.isrc;
}

export function setTrackISRC(spotifyId, isrc) {
  if (!isValidSpotifyId(spotifyId)) return;
  cache[spotifyId] = { ...cache[spotifyId], isrc };
  saveCache();
}

export function getTrackMBID(spotifyId) {
  return cache[spotifyId]?.mbid;
}

export function setTrackMBID(spotifyId, mbid) {
  if (!isValidSpotifyId(spotifyId)) return;
  cache[spotifyId] = { ...cache[spotifyId], mbid };
  saveCache();
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

// Initialize cache on load
loadCache();
