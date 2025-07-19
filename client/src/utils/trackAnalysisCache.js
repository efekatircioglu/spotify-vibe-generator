// Persistent cache for track analysis, using localStorage

const CACHE_KEY = 'trackAnalysisCache';

// In-memory cache
let cache = {};

// Load cache from localStorage on module load
function loadCache() {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    cache = data ? JSON.parse(data) : {};
  } catch (e) {
    cache = {};
  }
}

// Save cache to localStorage
function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Ignore write errors
  }
}

// Get cache entry for a track
export function getTrackAnalysis(spotifyId) {
  return cache[spotifyId];
}

// Set/update cache entry for a track
export function setTrackAnalysis(spotifyId, data) {
  cache[spotifyId] = { ...cache[spotifyId], ...data };
  saveCache();
}

// Check if a track has already been analyzed (has analysis or missingMBID)
export function isTrackAnalyzed(spotifyId) {
  const entry = cache[spotifyId];
  return !!(entry && (entry.analysis || entry.missingMBID));
}

// Optionally, clear the cache (not used for now)
export function clearTrackAnalysisCache() {
  cache = {};
  saveCache();
}

// Get ISRC for a track
export function getTrackISRC(spotifyId) {
  return cache[spotifyId]?.isrc;
}

// Set ISRC for a track
export function setTrackISRC(spotifyId, isrc) {
  cache[spotifyId] = { ...cache[spotifyId], isrc };
  saveCache();
}

// Get MBID for a track
export function getTrackMBID(spotifyId) {
  return cache[spotifyId]?.mbid;
}

// Set MBID for a track
export function setTrackMBID(spotifyId, mbid) {
  cache[spotifyId] = { ...cache[spotifyId], mbid };
  saveCache();
}

// Comprehensive MBID lookup function
// Sequence: 1) Check localStorage cache, 2) Spotify ID -> ISRC -> MBID
export async function lookupTrackMBID(spotifyId) {
  if (!spotifyId) {
    console.warn('No Spotify ID provided for MBID lookup');
    return null;
  }

  // Step 1: Check localStorage cache first
  const cachedMBID = getTrackMBID(spotifyId);
  if (cachedMBID && cachedMBID !== 'Not Found') {
    console.log(`[MBID Lookup] Found cached MBID for ${spotifyId}:`, cachedMBID);
    return cachedMBID;
  }

  // Step 2: Get ISRC from Spotify
  let isrc = getTrackISRC(spotifyId);
  if (!isrc) {
    try {
      console.log(`[MBID Lookup] Fetching ISRC for ${spotifyId}...`);
      const isrcRes = await fetch(`http://127.0.0.1:8000/track-isrc/${spotifyId}`);
      if (!isrcRes.ok) {
        console.warn(`[MBID Lookup] Failed to fetch ISRC for ${spotifyId}`);
        setTrackISRC(spotifyId, 'Not found');
        return null;
      }
      const isrcData = await isrcRes.json();
      isrc = isrcData.isrc || 'Not found';
      setTrackISRC(spotifyId, isrc);
    } catch (error) {
      console.error(`[MBID Lookup] Error fetching ISRC for ${spotifyId}:`, error);
      setTrackISRC(spotifyId, 'Not found');
      return null;
    }
  }

  if (!isrc || isrc === 'Not found') {
    console.warn(`[MBID Lookup] No ISRC found for ${spotifyId}`);
    setTrackMBID(spotifyId, 'Not Found');
    return null;
  }

  // Step 3: Get MBID from MusicBrainz using ISRC
  try {
    console.log(`[MBID Lookup] Fetching MBID for ISRC ${isrc}...`);
    const mbidRes = await fetch(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`, {
      headers: { 'User-Agent': 'spotify-vibe-generator/1.0 (your@email.com)' }
    });
    
    if (!mbidRes.ok) {
      console.warn(`[MBID Lookup] Failed to fetch MBID for ISRC ${isrc}`);
      setTrackMBID(spotifyId, 'Not Found');
      return null;
    }

    const mbidData = await mbidRes.json();
    const mbid = mbidData.recordings && mbidData.recordings.length > 0 ? mbidData.recordings[0].id : null;
    
    if (mbid) {
      console.log(`[MBID Lookup] Found MBID for ${spotifyId}:`, mbid);
      setTrackMBID(spotifyId, mbid);
      return mbid;
    } else {
      console.warn(`[MBID Lookup] No MBID found for ISRC ${isrc}`);
      setTrackMBID(spotifyId, 'Not Found');
      return null;
    }
  } catch (error) {
    console.error(`[MBID Lookup] Error fetching MBID for ISRC ${isrc}:`, error);
    setTrackMBID(spotifyId, 'Not Found');
    return null;
  }
}

// Initialize cache on module load
loadCache(); 