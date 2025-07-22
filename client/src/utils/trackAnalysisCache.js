const ANALYSIS_CACHE_KEY = 'analysis_cache';

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function setCache(cache) {
  localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
}

export function getTrackAnalysis(mbid) {
  const cache = getCache();
  return cache[mbid] || null;
}

export function setTrackAnalysis(mbid, analysisData) {
  const cache = getCache();
  cache[mbid] = analysisData;
  setCache(cache);
}
