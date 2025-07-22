import pLimit from 'p-limit';
import { getTrackAnalysis, setTrackAnalysis } from './trackAnalysisCache';

const limit = pLimit(5); // 5 concurrent requests

// Helper to fetch high-level metrics
async function fetchHighLevel(mbid) {
  try {
    const res = await fetch(`https://acousticbrainz.org/${mbid}/high-level`);
    if (!res.ok) {
      console.log(`[fetchTrackMetrics] Failed to fetch high-level for ${mbid}: ${res.status}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.log(`[fetchTrackMetrics] Error in fetchHighLevel for ${mbid}:`, error);
    return null;
  }
}

// Helper to fetch low-level metrics
async function fetchLowLevel(mbid) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/${mbid}/low-level`);
    if (!res.ok) {
      console.log(`[fetchTrackMetrics] Failed to fetch low-level for ${mbid}: ${res.status}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.log(`[fetchTrackMetrics] Error in fetchLowLevel for ${mbid}:`, error);
    return null;
  }
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
        limit(() => fetchHighLevel(mbid)),
        limit(() => fetchLowLevel(mbid))
      ]);
      
      if (highLevel || lowLevel) {
        setTrackAnalysis(mbid, { analysis: { highLevel, lowLevel } });
        results.push({ track, highLevel, lowLevel });
      } else {
        results.push({ track, highLevel: null, lowLevel: null, error: 'No analysis data found' });
      }
    } catch (error) {
      results.push({ track, highLevel: null, lowLevel: null, error: error.message });
    }
    done++;
    if (onProgress) onProgress({ done, total });
  }));

  return results;
}
