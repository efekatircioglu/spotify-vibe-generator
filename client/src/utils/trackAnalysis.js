const CACHE_KEY = 'trackAnalysisCache';

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function setCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function getMbidForTrack(track) {
  const cache = getCache();
  const cachedData = cache[track.id];

  if (cachedData) {
    if (cachedData.mbid) {
      console.log(`[getMbidForTrack] Found MBID in cache for ${track.name}: ${cachedData.mbid}`);
      return cachedData.mbid;
    } else {
      console.log(`[getMbidForTrack] Cached data for ${track.name} exists but has no MBID. Will not re-fetch.`);
      return null;
    }
  }

  console.log(`[getMbidForTrack] No entry in cache for ${track.name}. Fetching from /find-mbid...`);
  try {
    const artistName = track.artist || (track.artists && track.artists.length > 0 ? track.artists[0].name : '');
    const trackName = track.name;
    const res = await fetch(`http://127.0.0.1:8000/find-mbid?artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}`);
    
    if (!res.ok) {
      console.log(`[getMbidForTrack] Server responded with ${res.status} for ${track.name}`);
      return null;
    }

    const data = await res.json();

    if (data.mbid) {
      console.log(`[getMbidForTrack] Successfully fetched MBID for ${track.name}: ${data.mbid}. Caching it.`);
      const newCache = getCache();
      newCache[track.id] = { isrc: data.isrc, mbid: data.mbid };
      setCache(newCache);
      return data.mbid;
    } else {
      console.log(`[getMbidForTrack] /find-mbid did not return an MBID for ${track.name}. Caching as not found.`);
      const newCache = getCache();
      newCache[track.id] = { isrc: null, mbid: null }; // Cache as not found
      setCache(newCache);
      return null;
    }
  } catch (error) {
    console.log(`[getMbidForTrack] Error fetching MBID for ${track.name}:`, error);
    return null;
  }
}
