// --- Analysis Cache Management ---
import { safeSetItem, safeGetItem, safeRemoveItem } from './safeStorage';

const ANALYSIS_CACHE_KEY = 'analysis_cache';

export function getAnalysis(mbid) {
  try {
    const cache = safeGetItem(ANALYSIS_CACHE_KEY) || {};
    return cache[mbid];
  } catch {
    return undefined;
  }
}

export function setAnalysis(mbid, analysis) {
  try {
    const cache = safeGetItem(ANALYSIS_CACHE_KEY) || {};
    cache[mbid] = analysis;
    const saveSuccess = safeSetItem(ANALYSIS_CACHE_KEY, cache);
    if (!saveSuccess) {
      console.warn('Cannot save analysis cache - storage quota exceeded');
    }
  } catch {
    // Ignore write errors
  }
}

export function clearAnalysisCache() {
  try {
    safeRemoveItem(ANALYSIS_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}
