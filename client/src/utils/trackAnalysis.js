// --- Analysis Cache Management ---
const ANALYSIS_CACHE_KEY = 'analysis_cache';

export function getAnalysis(mbid) {
  try {
    const cache = JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY)) || {};
    return cache[mbid];
  } catch {
    return undefined;
  }
}

export function setAnalysis(mbid, analysis) {
  try {
    const cache = JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY)) || {};
    cache[mbid] = analysis;
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore write errors
  }
}

export function clearAnalysisCache() {
  try {
    localStorage.removeItem(ANALYSIS_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}
