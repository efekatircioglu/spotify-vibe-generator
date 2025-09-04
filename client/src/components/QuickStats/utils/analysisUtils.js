/**
 * Analysis Utilities for QuickStats Components
 * 
 * Contains all the analysis functions extracted from the monolithic QuickStats component
 * Each function is focused on a specific analysis task
 * 
 * BENEFITS:
 * ✅ Reusable across different components
 * ✅ Testable in isolation
 * ✅ Easy to optimize individual functions
 * ✅ Clear separation of concerns
 */

/**
 * Analyze listening evolution by comparing recent vs long-term listening patterns
 */
export const analyzeListeningEvolution = async (tracks, recentTracks, topArtists = []) => {
  // Helper function to get artist data with images from sessionStorage
  const getArtistDataWithImages = (artistId, artistName) => {
    try {
      const topArtistsData = sessionStorage.getItem('spotify_top_artists');
      if (!topArtistsData) return null;
      
      const topArtistsCache = JSON.parse(topArtistsData);
      if (!topArtistsCache.artists || !Array.isArray(topArtistsCache.artists)) return null;
      
      // Find the artist in the cache
      const artist = topArtistsCache.artists.find(a => {
        if (artistId && a.id === artistId) return true;
        if (artistName && a.name && a.name.toLowerCase() === artistName.toLowerCase()) return true;
        return false;
      });
      
      return artist;
    } catch (error) {
      console.error('Error getting artist data with images:', error);
      return null;
    }
  };

  const evolution = {
    newSongs: [],
    newArtists: [],
    breakSongs: [],
    breakArtists: []
  };

  try {
    // Create sets for easy comparison
    const recentSongIds = new Set(recentTracks.map(track => track.id));
    const recentArtistIds = new Set();
    recentTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => recentArtistIds.add(artist.id));
      }
    });

    // Get 4 weeks tracks (last month)
    const fourWeeksTracks = tracks.filter(track => track.rankings && track.rankings['4_weeks']);
    const fourWeeksSongIds = new Set(fourWeeksTracks.map(track => track.id));
    const fourWeeksArtistIds = new Set();
    fourWeeksTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => fourWeeksArtistIds.add(artist.id));
      }
    });

    // Get 6-12 months tracks (longer term)
    const longTermTracks = tracks.filter(track => 
      (track.rankings && track.rankings['6_months']) || 
      (track.rankings && track.rankings['12_months'])
    );
    const longTermSongIds = new Set(longTermTracks.map(track => track.id));
    const longTermArtistIds = new Set();
    longTermTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => longTermArtistIds.add(artist.id));
      }
    });

    // RULE 1: Newly Discovered Songs - in recent + 4 weeks but NOT in 6 or 12 months unified_top_tracks
    const recentAndFourWeeksSongIds = new Set([...recentSongIds, ...fourWeeksSongIds]);
    tracks.forEach(track => {
      if (recentAndFourWeeksSongIds.has(track.id) && !longTermSongIds.has(track.id)) {
        evolution.newSongs.push({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          rankings: track.rankings
        });
      }
    });

    // RULE 2: Newly Discovered Artists - in recent + 4 weeks but NOT in 6 or 12 months spotify_top_artists
    const recentAndFourWeeksArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
    tracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          if (recentAndFourWeeksArtistIds.has(artist.id) && !longTermArtistIds.has(artist.id)) {
            const existingArtist = evolution.newArtists.find(a => a.id === artist.id);
            if (!existingArtist) {
              // Try to get artist image from localStorage cache
              const artistDataWithImages = getArtistDataWithImages(artist.id, artist.name);
              
              // Try to find album image from tracks featuring this artist
              let albumImage = null;
              const artistTracks = tracks.filter(track => 
                track.artists && track.artists.some(a => a.id === artist.id)
              );
              if (artistTracks.length > 0) {
                const trackWithAlbum = artistTracks.find(track => 
                  track.album && track.album.images && track.album.images[0] && track.album.images[0].url
                );
                if (trackWithAlbum) {
                  albumImage = trackWithAlbum.album.images[0].url;
                }
              }
              
              evolution.newArtists.push({
                id: artist.id,
                name: artist.name,
                images: artistDataWithImages?.images || artist.images,
                albumImage: albumImage,
                trackCount: 1
              });
            } else {
              existingArtist.trackCount++;
            }
          }
        });
      }
    });

    // RULE 3: Songs Taking a Break - in 6-12 months but NOT in last 4 weeks unified_top_tracks
    const allRecentSongIds = new Set([...recentSongIds, ...fourWeeksSongIds]);
    longTermTracks.forEach(track => {
      if (!allRecentSongIds.has(track.id)) {
        evolution.breakSongs.push({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          rankings: track.rankings
        });
      }
    });

    // RULE 4: Artists Taking a Break - in 6-12 months but NOT in last 4 weeks spotify_top_artists
    const allRecentArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
    longTermTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          if (!allRecentArtistIds.has(artist.id)) {
            const existingArtist = evolution.breakArtists.find(a => a.id === artist.id);
            if (!existingArtist) {
              // Try to get artist image from localStorage cache
              const artistDataWithImages = getArtistDataWithImages(artist.id, artist.name);
              
              // Try to find album image from tracks featuring this artist
              let albumImage = null;
              const artistTracks = tracks.filter(track => 
                track.artists && track.artists.some(a => a.id === artist.id)
              );
              if (artistTracks.length > 0) {
                const trackWithAlbum = artistTracks.find(track => 
                  track.album && track.album.images && track.album.images[0] && track.album.images[0].url
                );
                if (trackWithAlbum) {
                  albumImage = trackWithAlbum.album.images[0].url;
                }
              }
              
              evolution.breakArtists.push({
                id: artist.id,
                name: artist.name,
                images: artistDataWithImages?.images || artist.images,
                albumImage: albumImage,
                trackCount: 1
              });
            } else {
              existingArtist.trackCount++;
            }
          }
        });
      }
    });

    // Sort by track count for artists
    evolution.newArtists.sort((a, b) => b.trackCount - a.trackCount);
    evolution.breakArtists.sort((a, b) => b.trackCount - a.trackCount);
  } catch (error) {
    console.error('Error analyzing listening evolution:', error);
  }

  return evolution;
};

/**
 * Analyze time of day patterns from recent tracks
 */
export const analyzeTimeOfDay = async (recentTracks) => {
  // Helper function to get artist data with images from sessionStorage
  const getArtistDataWithImages = (artistId, artistName) => {
    try {
      const topArtistsData = sessionStorage.getItem('spotify_top_artists');
      if (!topArtistsData) return null;
      
      const topArtistsCache = JSON.parse(topArtistsData);
      if (!topArtistsCache.artists || !Array.isArray(topArtistsCache.artists)) return null;
      
      // Find the artist in the cache
      const artist = topArtistsCache.artists.find(a => {
        if (artistId && a.id === artistId) return true;
        if (artistName && a.name && a.name.toLowerCase() === artistName.toLowerCase()) return true;
        return false;
      });
      
      return artist;
    } catch (error) {
      console.error('Error getting artist data with images:', error);
      return null;
    }
  };
  const timeSlots = {
    '8-12 AM': { start: 8, end: 12, count: 0, songs: [] },        // 8:00 - 12:00
    '12-4 PM': { start: 12, end: 16, count: 0, songs: [] },       // 12:00 - 16:00
    '4-8 PM': { start: 16, end: 20, count: 0, songs: [] },        // 16:00 - 20:00
    '8-12 PM': { start: 20, end: 24, count: 0, songs: [] },       // 20:00 - 24:00
    '12-8 AM': { start: 0, end: 8, count: 0, songs: [] },         // 0:00 - 8:00
  };

  try {
    // Process each track
    recentTracks.forEach(track => {
      if (track.played_at) {
        // Convert to UTC+2 (assuming user is in UTC+2 timezone)
        const playedAt = new Date(track.played_at);
        const utcPlus2 = new Date(playedAt.getTime() + (2 * 60 * 60 * 1000)); // UTC+2
        const hour = utcPlus2.getUTCHours();
        
        // Find which time slot this hour belongs to
        let slotFound = false;
        Object.keys(timeSlots).forEach(slotName => {
          const slot = timeSlots[slotName];
          if (slot.start <= slot.end) {
            // Normal case: start < end (e.g., 9-12)
            if (hour >= slot.start && hour < slot.end) {
              slot.count++;
              // Get enhanced artist data with images
              const enhancedArtists = track.artists.map(artist => {
                const artistDataWithImages = getArtistDataWithImages(artist.id, artist.name);
                return {
                  ...artist,
                  images: artistDataWithImages?.images || artist.images
                };
              });
              
              slot.songs.push({
                name: track.name,
                artists: enhancedArtists,
                album: track.album,
                played_at: utcPlus2,
                hour: hour,
                minute: utcPlus2.getUTCMinutes()
              });
              slotFound = true;
            }
          } else {
            // Wrapping case: start > end (e.g., 21-5 for night)
            if (hour >= slot.start || hour < slot.end) {
              slot.count++;
              // Get enhanced artist data with images
              const enhancedArtists = track.artists.map(artist => {
                const artistDataWithImages = getArtistDataWithImages(artist.id, artist.name);
                return {
                  ...artist,
                  images: artistDataWithImages?.images || artist.images
                };
              });
              
              slot.songs.push({
                name: track.name,
                artists: enhancedArtists,
                album: track.album,
                played_at: utcPlus2,
                hour: hour,
                minute: utcPlus2.getUTCMinutes()
              });
              slotFound = true;
            }
          }
        });
      }
    });

    // Sort songs by most recent in each slot
    Object.keys(timeSlots).forEach(slotName => {
      timeSlots[slotName].songs.sort((a, b) => new Date(b.played_at) - new Date(a.played_at));
    });

    // Find the most active time slot
    let mostActiveSlot = null;
    let maxCount = 0;
    Object.keys(timeSlots).forEach(slotName => {
      if (timeSlots[slotName].count > maxCount) {
        maxCount = timeSlots[slotName].count;
        mostActiveSlot = slotName;
      }
    });

    return {
      timeSlots,
      mostActiveSlot,
      totalSongs: recentTracks.length,
      analyzedSongs: Object.values(timeSlots).reduce((sum, slot) => sum + slot.count, 0)
    };
  } catch (error) {
    console.error('Error analyzing time of day:', error);
  }

  return null;
};

/**
 * Analyze listener type (Superfan vs Artist Explorer)
 * NEW LOGIC: Compare last 50 songs with 6-12 month data
 * If artists in last 50 are also in 6-12 months = Superfan (re-listening known artists)
 * If artists in last 50 are NOT in 6-12 months = Artist Explorer (discovering new artists)
 */
export const analyzeListenerType = async (recentTracks) => {
  const analysis = {
    type: null,
    confidence: 0,
    topArtist: null,
    artistDiversity: 0,
    superfanMetrics: {},
    explorerMetrics: {}
  };

  try {
    // Get spotify top artists data from sessionStorage
    const topArtistsData = sessionStorage.getItem('spotify_top_artists');
    if (!topArtistsData) {
      console.warn('No spotify top artists data available for listener type analysis');
      return analysis;
    }

    const topArtists = JSON.parse(topArtistsData);
    
    // Create a map of all artists from spotify_top_artists for easy lookup
    const allTopArtistsMap = new Map();
    if (topArtists.artists && Array.isArray(topArtists.artists)) {
      topArtists.artists.forEach(artist => {
        allTopArtistsMap.set(artist.id, artist);
      });
    }

    // Count unique main artists in recent tracks (last 50 songs)
    const artistCounts = {};
    const recentArtists = [];
    recentTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        // Only look at the main artist (first artist) of each song
        const mainArtist = track.artists[0];
        
        // Count occurrences
        artistCounts[mainArtist.id] = {
          id: mainArtist.id,
          name: mainArtist.name,
          count: (artistCounts[mainArtist.id]?.count || 0) + 1
        };
        
        // Add to recent artists list if not already added
        if (!recentArtists.find(a => a.id === mainArtist.id)) {
          recentArtists.push(mainArtist);
        }
      }
    });

    // Calculate metrics based on main artists only
    const uniqueArtists = recentArtists.length;
    const totalSongs = recentTracks.length;
    
    // Get unified top tracks data from sessionStorage for additional check
    const unifiedTopTracksData = sessionStorage.getItem('unified_top_tracks');
    const unifiedTopTracks = unifiedTopTracksData ? JSON.parse(unifiedTopTracksData) : [];
    
    // Create a map of artists from unified top tracks for easy lookup
    const unifiedTracksArtistsMap = new Map();
    unifiedTopTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          if (!unifiedTracksArtistsMap.has(artist.id)) {
            unifiedTracksArtistsMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              has6Months: track.rankings && track.rankings['6_months'] !== null && track.rankings['6_months'] !== undefined,
              has12Months: track.rankings && track.rankings['12_months'] !== null && track.rankings['12_months'] !== undefined
            });
          } else {
            // Update existing entry if this track has rankings
            const existing = unifiedTracksArtistsMap.get(artist.id);
            if (track.rankings) {
              existing.has6Months = existing.has6Months || (track.rankings['6_months'] !== null && track.rankings['6_months'] !== undefined);
              existing.has12Months = existing.has12Months || (track.rankings['12_months'] !== null && track.rankings['12_months'] !== undefined);
            }
          }
        });
      }
    });
    
    // Check each unique main artist from recent 50 songs
    let knownArtistCount = 0;
    let newArtistCount = 0;
    const knownArtists = [];
    const newArtists = [];
    
    recentArtists.forEach(artist => {
      const topArtistEntry = allTopArtistsMap.get(artist.id);
      const unifiedTrackEntry = unifiedTracksArtistsMap.get(artist.id);
      
      // Check if this artist appears in 6-12 months rankings (either in top artists OR unified tracks)
      let has6Months = false;
      let has12Months = false;
      let ranking6Months = null;
      let ranking12Months = null;
      
      if (topArtistEntry && topArtistEntry.rankings) {
        has6Months = topArtistEntry.rankings['6_months'] !== null && topArtistEntry.rankings['6_months'] !== undefined;
        has12Months = topArtistEntry.rankings['12_months'] !== null && topArtistEntry.rankings['12_months'] !== undefined;
        ranking6Months = topArtistEntry.rankings['6_months'];
        ranking12Months = topArtistEntry.rankings['12_months'];
      }
      
      // Also check unified tracks data
      if (unifiedTrackEntry) {
        has6Months = has6Months || unifiedTrackEntry.has6Months;
        has12Months = has12Months || unifiedTrackEntry.has12Months;
      }
      
      if (has6Months || has12Months) {
        // This is a known artist (appears in 6-12 months in either top artists OR unified tracks)
        knownArtistCount++;
        knownArtists.push({
          id: artist.id,
          name: artist.name,
          has6Months,
          has12Months,
          ranking6Months,
          ranking12Months,
          foundInTopArtists: !!topArtistEntry,
          foundInUnifiedTracks: !!unifiedTrackEntry
        });
      } else {
        // This is a new artist (not in 6-12 months in either dataset)
        newArtistCount++;
        newArtists.push({
          id: artist.id,
          name: artist.name
        });
      }
    });
    
    // Calculate artist diversity as percentage of new vs known artists
    const artistDiversity = (newArtistCount / uniqueArtists) * 100; // Percentage of new artists
    
  

    // Find top artist in recent tracks
    const sortedArtists = Object.values(artistCounts).sort((a, b) => b.count - a.count);
    const topRecentArtist = sortedArtists[0];
    const topArtistPercentage = (topRecentArtist.count / totalSongs) * 100;

    // CLASSIFICATION LOGIC
    // Compare main artists from last 50 songs with 6-12 months top artists
    // If less than 10 new main artists = Superfan (mostly re-listening known artists)
    // If 10 or more new main artists = Artist Explorer (discovering new artists)
    const isSuperfan = newArtistCount < 10;
    const isArtistExplorer = newArtistCount >= 10;

    // Calculate confidence based on how clear the pattern is
    let confidence = 0;
    if (isSuperfan) {
      // Higher confidence if very few new artists
      confidence = Math.max(50, 100 - (newArtistCount * 10));
      analysis.type = 'Superfan';
      analysis.confidence = Math.min(confidence, 100);
      analysis.superfanMetrics = {
        newArtistCount,
        knownArtistCount,
        totalArtists: uniqueArtists,
        totalSongs,
        topArtistPercentage,
        reListeningRate: (knownArtistCount / uniqueArtists) * 100
      };
    } else if (isArtistExplorer) {
      // Higher confidence if many new artists
      confidence = Math.max(50, (newArtistCount / uniqueArtists) * 100);
      analysis.type = 'Artist Explorer';
      analysis.confidence = Math.min(confidence, 100);
      analysis.explorerMetrics = {
        newArtistCount,
        knownArtistCount,
        totalArtists: uniqueArtists,
        totalSongs,
        topArtistPercentage,
        discoveryRate: (newArtistCount / uniqueArtists) * 100
      };
    } else {
      // Balanced case (edge case)
      analysis.type = 'Balanced Listener';
      analysis.confidence = 50;
    }

    // Set common metrics
    analysis.topArtist = topRecentArtist;
    analysis.artistDiversity = artistDiversity / 100; // Convert back to decimal for display
    analysis.allArtists = sortedArtists;
    
    // Add additional context for display
    analysis.newArtistCount = newArtistCount;
    analysis.knownArtistCount = knownArtistCount;
    analysis.totalArtists = uniqueArtists;
    analysis.knownArtists = knownArtists;
    analysis.newArtists = newArtists;

  } catch (error) {
    console.error('Error analyzing listener type:', error);
  }

  return analysis;
};
