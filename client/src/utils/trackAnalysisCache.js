// Persistent cache for ISRC/MBID mapping, using localStorage

const CACHE_KEY = 'trackAnalysisCache';
let cache = {};

function loadCache() {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    cache = data ? JSON.parse(data) : {};
  } catch (e) {
    cache = {};
  }
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Ignore write errors
  }
}

export function getTrackISRC(spotifyId) {
  return cache[spotifyId]?.isrc;
}

export function setTrackISRC(spotifyId, isrc) {
  cache[spotifyId] = { ...cache[spotifyId], isrc };
  saveCache();
}

export function getTrackMBID(spotifyId) {
  return cache[spotifyId]?.mbid;
}

export function setTrackMBID(spotifyId, mbid) {
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

loadCache();
