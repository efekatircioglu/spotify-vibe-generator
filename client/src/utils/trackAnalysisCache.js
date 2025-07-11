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

// Initialize cache on module load
loadCache(); 