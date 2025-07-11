import pLimit from 'p-limit';
import { getTrackAnalysis, setTrackAnalysis } from './trackAnalysisCache';

const limit = pLimit(5); // 5 concurrent requests

// Helper to fetch high-level metrics
async function fetchHighLevel(mbid) {
  const res = await fetch(`https://acousticbrainz.org/${mbid}/high-level`);
  if (!res.ok) throw new Error('Failed to fetch high-level');
  return res.json();
}

// Helper to fetch low-level metrics
async function fetchLowLevel(mbid) {
  const res = await fetch(`http://127.0.0.1:8000/${mbid}/low-level`);
  if (!res.ok) throw new Error('Failed to fetch low-level');
  return res.json();
}

/**
 * Fetches high-level and low-level metrics for each track with an MBID.
 * @param {Array} tracks - Array of track objects (must have .mbid or .MBID or .mbid property)
 * @param {Function} onProgress - Callback(progress: { done, total })
 * @returns {Promise<Array>} Array of { track, highLevel, lowLevel, error }
 */
export async function fetchTrackMetrics(tracks, onProgress) {
  const tracksWithMBID = tracks.filter(t => t.mbid || t.MBID || t.MBID);
  const total = tracksWithMBID.length;
  let done = 0;
  const results = [];

  await Promise.all(tracksWithMBID.map(async track => {
    const mbid = track.mbid || track.MBID || track.MBID;
    // Check cache first
    const cached = getTrackAnalysis(mbid);
    if (cached && cached.analysis) {
      results.push({ track, ...cached.analysis, fromCache: true });
      done++;
      if (onProgress) onProgress({ done, total });
      return;
    }
    try {
      const [highLevel, lowLevel] = await Promise.all([
        limit(() => fetchHighLevel(mbid).catch(e => ({ error: e.message }))),
        limit(() => fetchLowLevel(mbid).catch(e => ({ error: e.message })))
      ]);
      // Store in cache
      setTrackAnalysis(mbid, { analysis: { highLevel, lowLevel } });
      results.push({ track, highLevel, lowLevel });
    } catch (error) {
      results.push({ track, highLevel: null, lowLevel: null, error: error.message });
    }
    done++;
    if (onProgress) onProgress({ done, total });
  }));

  return results;
} 