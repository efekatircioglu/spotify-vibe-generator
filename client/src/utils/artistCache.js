// localStorage utilities for artist name -> Ticketmaster ID caching
export const getArtistCache = () => {
  try {
    const cached = localStorage.getItem('artistNameToTicketmasterId');
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading artist cache:', error);
    return {};
  }
};

export const setArtistCache = (artistName, ticketmasterId, imageUrl = null, spotifyId = null) => {
  try {
    const cache = getArtistCache();
    cache[artistName.toLowerCase()] = {
      id: ticketmasterId,
      image: imageUrl,
      spotifyId: spotifyId
    };
    localStorage.setItem('artistNameToTicketmasterId', JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing artist cache:', error);
  }
};

export const getCachedArtistId = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached ? (typeof cached === 'string' ? cached : cached.id) : null;
};

export const getCachedArtistImage = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached && typeof cached === 'object' ? cached.image : null;
};

export const getCachedSpotifyId = (artistName) => {
  const cache = getArtistCache();
  const cached = cache[artistName.toLowerCase()];
  return cached && typeof cached === 'object' ? cached.spotifyId : null;
};

export const clearArtistCache = () => {
  try {
    localStorage.removeItem('artistNameToTicketmasterId');
  } catch (error) {
    console.error('Error clearing artist cache:', error);
  }
};

export const getCacheStats = () => {
  try {
    const cache = getArtistCache();
    return {
      total: Object.keys(cache).length,
      valid: Object.keys(cache).length,
      expired: 0
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total: 0, valid: 0, expired: 0 };
  }
}; 