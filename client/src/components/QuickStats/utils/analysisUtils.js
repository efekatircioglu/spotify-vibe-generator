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
export const analyzeListeningEvolution = async (tracks, recentTracks) => {
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

    // Find newly discovered songs (in recent + 4 weeks but not in 6-12 months)
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

    // Find songs taking a break (in 6-12 months but not in recent + 4 weeks)
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

    // Find newly discovered artists (in recent + 4 weeks but not in 6-12 months)
    const recentAndFourWeeksArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
    tracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          if (recentAndFourWeeksArtistIds.has(artist.id) && !longTermArtistIds.has(artist.id)) {
            const existingArtist = evolution.newArtists.find(a => a.id === artist.id);
            if (!existingArtist) {
              evolution.newArtists.push({
                id: artist.id,
                name: artist.name,
                trackCount: 1
              });
            } else {
              existingArtist.trackCount++;
            }
          }
        });
      }
    });

    // Find artists taking a break (in 6-12 months but not in recent + 4 weeks)
    const allRecentArtistIds = new Set([...recentArtistIds, ...fourWeeksArtistIds]);
    longTermTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          if (!allRecentArtistIds.has(artist.id)) {
            const existingArtist = evolution.breakArtists.find(a => a.id === artist.id);
            if (!existingArtist) {
              evolution.breakArtists.push({
                id: artist.id,
                name: artist.name,
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
              slot.songs.push({
                name: track.name,
                artists: track.artists,
                played_at: utcPlus2,
                hour: hour
              });
              slotFound = true;
            }
          } else {
            // Wrapping case: start > end (e.g., 21-5 for night)
            if (hour >= slot.start || hour < slot.end) {
              slot.count++;
              slot.songs.push({
                name: track.name,
                artists: track.artists,
                played_at: utcPlus2,
                hour: hour
              });
              slotFound = true;
            }
          }
        });
      }
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
    // Count unique artists in recent tracks
    const artistCounts = {};
    recentTracks.forEach(track => {
      if (track.artists && track.artists.length > 0) {
        track.artists.forEach(artist => {
          artistCounts[artist.id] = {
            id: artist.id,
            name: artist.name,
            count: (artistCounts[artist.id]?.count || 0) + 1
          };
        });
      }
    });

    // Calculate diversity metrics
    const uniqueArtists = Object.keys(artistCounts).length;
    const totalSongs = recentTracks.length;
    const artistDiversity = uniqueArtists / totalSongs; // Higher = more diverse

    // Find top artist in recent tracks
    const sortedArtists = Object.values(artistCounts).sort((a, b) => b.count - a.count);
    const topRecentArtist = sortedArtists[0];
    const topArtistPercentage = (topRecentArtist.count / totalSongs) * 100;

    // Superfan indicators
    const superfanIndicators = {
      highTopArtistPercentage: topArtistPercentage > 30, // More than 30% from one artist
      lowDiversity: artistDiversity < 0.3, // Less than 30% unique artists
      artistConcentration: topArtistPercentage
    };

    // Explorer indicators
    const explorerIndicators = {
      lowTopArtistPercentage: topArtistPercentage < 15, // Less than 15% from one artist
      highDiversity: artistDiversity > 0.6, // More than 60% unique artists
      manyUniqueArtists: uniqueArtists > 20, // More than 20 unique artists
      artistDiversity: artistDiversity
    };

    // Calculate superfan score
    let superfanScore = 0;
    if (superfanIndicators.highTopArtistPercentage) superfanScore += 30;
    if (superfanIndicators.lowDiversity) superfanScore += 25;
    superfanScore += Math.min(superfanIndicators.artistConcentration / 2, 20);

    // Calculate explorer score
    let explorerScore = 0;
    if (explorerIndicators.lowTopArtistPercentage) explorerScore += 30;
    if (explorerIndicators.highDiversity) explorerScore += 25;
    if (explorerIndicators.manyUniqueArtists) explorerScore += 25;
    explorerScore += Math.min(explorerIndicators.artistDiversity * 50, 20);

    // Determine listener type
    if (superfanScore > explorerScore && superfanScore > 50) {
      analysis.type = 'Superfan';
      analysis.confidence = Math.min(superfanScore, 100);
      analysis.topArtist = topRecentArtist;
      analysis.artistDiversity = artistDiversity;
      analysis.superfanMetrics = {
        topArtistPercentage: topArtistPercentage,
        uniqueArtists: uniqueArtists,
        totalSongs: totalSongs,
        score: superfanScore
      };
    } else if (explorerScore > superfanScore && explorerScore > 50) {
      analysis.type = 'Artist Explorer';
      analysis.confidence = Math.min(explorerScore, 100);
      analysis.topArtist = topRecentArtist;
      analysis.artistDiversity = artistDiversity;
      analysis.explorerMetrics = {
        topArtistPercentage: topArtistPercentage,
        uniqueArtists: uniqueArtists,
        totalSongs: totalSongs,
        score: explorerScore
      };
    } else {
      analysis.type = 'Balanced Listener';
      analysis.confidence = Math.max(superfanScore, explorerScore);
      analysis.topArtist = topRecentArtist;
      analysis.artistDiversity = artistDiversity;
    }

    // Add all artists for display
    analysis.allArtists = sortedArtists;
  } catch (error) {
    console.error('Error analyzing listener type:', error);
  }

  return analysis;
};
