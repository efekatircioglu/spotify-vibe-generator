const axios = require('axios');

class GeniusService {
  constructor() {
    // Genius API uses Client Access Token for authentication
    this.clientId = process.env.GENIUS_CLIENT_ID;
    this.clientSecret = process.env.GENIUS_CLIENT_SECRET;
    this.clientAccessToken = process.env.GENIUS_CLIENT_ACCESS_TOKEN; // This is the actual access token
    this.accessToken = null;
    this.tokenExpiry = null;
    

    
    if (!this.clientAccessToken) {
      console.log('⚠️  IMPORTANT: You need to set GENIUS_CLIENT_ACCESS_TOKEN in your .env file');
      console.log('   Get it from: https://genius.com/api-clients → Generate Access Token');
    }
  }

  // Get or refresh access token
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      
      // Genius API uses Client Access Token (permanent, no refresh needed)
      // This is obtained from: https://genius.com/api-clients → Generate Access Token
      
      if (this.clientAccessToken) {
        this.accessToken = this.clientAccessToken;
        // Client Access Tokens don't expire, but we'll set a long expiry for safety
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        return this.accessToken;
      }
      
      throw new Error('No Client Access Token available. Please set GENIUS_CLIENT_ACCESS_TOKEN in your .env file');
    } catch (error) {
      console.error('[Genius] Error getting access token:', error.message);
      throw new Error('Failed to get Genius access token');
    }
  }

  // Step 1: Search for a song to get its Genius ID
  async searchSong(songName, artistName) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Create search query combining song name and artist
      const searchQuery = `${songName} ${artistName}`.trim();
      // Searching Genius...
      
      const response = await axios.get('https://api.genius.com/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'spotify-vibe-generator/1.0'
        },
        params: {
          q: searchQuery
        }
      });

      // Search response received
      const hits = response.data.response?.hits || [];
      // Search results processed

      if (hits.length === 0) {
        return { error: 'No songs found' };
      }

      // Find the best match by comparing artist names
      let bestMatch = null;
      let bestScore = 0;

      for (const hit of hits) {
        const result = hit.result;
        const geniusArtistName = result.primary_artist.name.toLowerCase();
        const spotifyArtistName = artistName.toLowerCase();
        
        // Calculate similarity score
        let score = 0;
        
        // Exact match gets highest score
        if (geniusArtistName === spotifyArtistName) {
          score = 100;
        } else if (geniusArtistName.includes(spotifyArtistName) || spotifyArtistName.includes(geniusArtistName)) {
          score = 80;
        } else {
          // Partial match scoring
          const words = spotifyArtistName.split(' ');
          const geniusWords = geniusArtistName.split(' ');
          const commonWords = words.filter(word => geniusWords.includes(word));
          score = (commonWords.length / Math.max(words.length, geniusWords.length)) * 60;
        }

        // Bonus points for exact song name match
        const geniusSongName = result.title.toLowerCase();
        const spotifySongName = songName.toLowerCase();
        if (geniusSongName === spotifySongName) {
          score += 20;
        } else if (geniusSongName.includes(spotifySongName) || spotifySongName.includes(geniusSongName)) {
          score += 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            id: result.id,
            title: result.title,
            primary_artist: {
              name: result.primary_artist.name,
              id: result.primary_artist.id
            },
            url: result.url,
            score: score
          };
        }
      }

      if (bestMatch && bestMatch.score >= 50) {
        // Best match found
        return bestMatch;
      } else {
        // No suitable match found
        return { error: 'No suitable match found' };
      }

    } catch (error) {
      console.error('[Genius] Search error:', error.message);
      throw new Error(`Genius search failed: ${error.message}`);
    }
  }

  // Step 2: Get detailed song information using the Genius ID
  async getSongDetails(geniusId) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Fetching song details...
      
      const response = await axios.get(`https://api.genius.com/songs/${geniusId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'spotify-vibe-generator/1.0'
        }
      });

      
      // Log the response structure to debug
     

      // The response structure is: response.data.response.song
      const song = response.data.response?.song;
      if (!song) {
        console.error('[Genius] Response structure:', {
          hasData: !!response.data,
          hasResponse: !!response.data?.response,
          hasSong: !!response.data?.response?.song,
          responseKeys: response.data ? Object.keys(response.data) : [],
          songKeys: response.data?.response?.song ? Object.keys(response.data.response.song) : []
        });
        throw new Error('No song data in response - check response structure');
      }
      
      console.log(`[Genius] Retrieved details for: "${song.title}"`);
      
      // Log the description field specifically
      // Description field analyzed
      
      // Log the actual description content
      if (song.description) {
        // Raw description logged
      }
      if (song.description_annotation) {
        // Raw description annotation logged
      }
      
      // Extract relevant information - now properly accessing song properties
      // Extracting song data...
      
      // Basic song info
      // Basic song info extracted
      
      // Primary artist info
      // Primary artist info extracted
      
      // Featured artists info
      // Featured artists info extracted
      
      // Album info
      // Album info extracted
      
      // Stats info
      // Stats info extracted
      
      // Extract description safely
      let description = 'No description available';
      try {
        // Starting description extraction...
        description = this.extractDescription(song);
        // Description extraction completed
      } catch (descError) {
        console.log('[Genius] Error extracting description, using fallback:', descError.message);
        console.log('[Genius] Full description error:', descError);
        description = 'Error extracting description - using fallback text';
      }
      
      // Extract samples safely
      let samples = [];
      try {
        samples = this.extractSamples(song);
      } catch (samplesError) {
        console.log('[Genius] Error extracting samples, using empty array:', samplesError.message);
        samples = [];
      }
      
      // Extract relationships safely
      let relationships = [];
      try {
        relationships = this.extractRelationships(song);
      } catch (relError) {
        console.log('[Genius] Error extracting relationships, using empty array:', relError.message);
        relationships = [];
      }
      
      const songInfo = {
        id: song.id,
        title: song.title,
        url: song.url,
        primary_artist: {
          name: song.primary_artist?.name,
          id: song.primary_artist?.id
        },
        featured_artists: song.featured_artists?.map(artist => ({
          name: artist.name,
          id: artist.id
        })) || [],
        album: song.album ? {
          name: song.album.name,
          id: song.album.id,
          url: song.album.url
        } : null,
        release_date: song.release_date,
        release_date_for_display: song.release_date_for_display,
        description: description,
        samples: samples,
        relationships: relationships
      };
      
      // Final song info structure
      // Final song info logged
      
      return songInfo;

    } catch (error) {
      console.error('[Genius] Get song details error:', error.message);
      console.error('[Genius] Full error:', error);
      // Return a fallback object instead of throwing
      return {
        id: 'unknown',
        title: 'Unknown Title',
        url: '',
        primary_artist: { name: 'Unknown Artist', id: 'unknown' },
        featured_artists: [],
        album: null,
        release_date: '',
        release_date_for_display: '',
        description: 'Error retrieving song details',
        samples: [],
        relationships: []
      };
    }
  }

  // Extract sample information from song data (now handled by extractRelationships)
  extractSamples(song) {
    // Extracting samples...
    
    // This method is kept for backward compatibility but samples are now part of relationships
    return [];
  }

  // Extract relationship information
  extractRelationships(song) {
    // Extracting relationships...
    // Song relationships available
    
    const relationships = {
      samples: [],
      sampled_in: [],
      interpolates: [],
      interpolated_by: [],
      cover_of: [],
      covered_by: [],
      remix_of: [],
      remixed_by: [],
      live_version_of: [],
      performed_live_as: [],
      other: []
    };
    
    if (song.song_relationships) {
      // Song relationships processed
      
      song.song_relationships.forEach(rel => {
        // Processing relationship
        
        // Handle the songs array structure
        if (rel.songs && Array.isArray(rel.songs)) {
          rel.songs.forEach(song => {
            const relationshipData = {
              type: rel.relationship_type,
              relationship_type: rel.relationship_type,
              relationship_type_for_display: rel.relationship_type_for_display || rel.relationship_type,
              url: rel.url,
              song: {
                title: song.title || 'Unknown Title',
                id: song.id || 'unknown',
                url: song.url || '',
                primary_artist: song.primary_artist?.name || 'Unknown Artist',
                artist_id: song.primary_artist?.id,
                full_title: song.full_title || song.title || 'Unknown Title',
                header_image_url: song.header_image_url || '',
                header_image_thumbnail_url: song.header_image_thumbnail_url || ''
              }
            };
            
            // Categorize relationships by type
            if (rel.relationship_type === 'translation_of' || rel.relationship_type === 'translations') {
              // Skipping translation relationship
              return; // Skip this relationship entirely
            }
            
            switch (rel.relationship_type) {
              case 'samples':
                relationships.samples.push(relationshipData);
                break;
              case 'sampled_in':
                relationships.sampled_in.push(relationshipData);
                break;
              case 'interpolates':
                relationships.interpolates.push(relationshipData);
                break;
              case 'interpolated_by':
                relationships.interpolated_by.push(relationshipData);
                break;
              case 'cover_of':
                relationships.cover_of.push(relationshipData);
                break;
              case 'covered_by':
                relationships.covered_by.push(relationshipData);
                break;
              case 'remix_of':
                relationships.remix_of.push(relationshipData);
                break;
              case 'remixed_by':
                relationships.remixed_by.push(relationshipData);
                break;
              case 'live_version_of':
                relationships.live_version_of.push(relationshipData);
                break;
              case 'performed_live_as':
                relationships.performed_live_as.push(relationshipData);
                break;
              default:
                relationships.other.push(relationshipData);
                break;
            }
          });
        } 
      });
    }

    // Log summary of extracted relationships
    // Relationships extraction summary
    Object.keys(relationships).forEach(key => {
      if (relationships[key].length > 0) {
        // Relationship items counted
      }
    });
    
    return relationships;
  }

  // Extract description from the complex Genius API response structure
  extractDescription(song) {
    try {
      // Extracting description...
      
      let descriptionText = '';
      
      // Extract from song.description.dom structure
      if (song.description && song.description.dom) {
        // Found description DOM structure
        descriptionText += this.parseDescriptionDOM(song.description.dom);
      }
      
      // Extract from song.description_annotation if available
      if (song.description_annotation && song.description_annotation.dom) {
        // Found description annotation DOM structure
        if (descriptionText) descriptionText += '\n\n';
        descriptionText += this.parseDescriptionDOM(song.description_annotation.dom);
      }
      
      // Fallback: if no DOM structure, try plain text
      if (!descriptionText && song.description && typeof song.description === 'string') {
        // Using plain text description
        descriptionText = song.description;
      }
      
      if (!descriptionText) {
        descriptionText = '';
      }
      
      // Final description text processed
      return descriptionText;
    } catch (error) {
      console.log('[Genius] Error extracting description:', error.message);
      return `Error extracting description: ${error.message}`;
    }
  }

  // Parse the DOM-like structure from Genius API
  parseDescriptionDOM(domNode) {
    try {
      if (!domNode) return '';
      
      let text = '';
      
      // If it's a text node (string), return it directly
      if (typeof domNode === 'string') {
        return domNode;
      }
      
      // Log the current node being processed
      // Processing DOM node
      
      // If it's an object with children, process them
      if (domNode.children && Array.isArray(domNode.children)) {
        for (const child of domNode.children) {
          text += this.parseDescriptionDOM(child);
        }
      }
      
      // If it's an object with a single text value
      if (domNode.children && !Array.isArray(domNode.children) && typeof domNode.children === 'string') {
        text += domNode.children;
      }
      
      // Handle special cases for specific tags
      if (domNode.tag === 'p' && text) {
        text = text.trim() + '\n\n';
      } else if (domNode.tag === 'blockquote' && text) {
        text = '\n"' + text.trim() + '"\n\n';
      } else if (domNode.tag === 'em' && text) {
        text = text.trim(); // Emphasis text without extra spacing
      } else if (domNode.tag === 'a' && text) {
        text = text.trim(); // Link text without extra spacing
      }
      
      return text;
    } catch (error) {
      console.log('[Genius] Error parsing DOM node:', error.message);
      console.log('[Genius] Problematic DOM node:', JSON.stringify(domNode, null, 2));
      return '';
    }
  }

  // Main method: Get song info from Spotify data
  async getSongInfoFromSpotify(songName, artistName) {
    // Getting song info...
    
    // Step 1: Search for the song
    const searchResult = await this.searchSong(songName, artistName);
    
    if (searchResult.error) {
      // Search returned error
      return { error: searchResult.error };
    }

    // Search successful

    // Step 2: Get detailed information
    const songDetails = await this.getSongDetails(searchResult.id);
    
    // Song details retrieved
    // Final song details structure logged
    
    // Validate that we have the required data
    if (!songDetails || !songDetails.title || !songDetails.primary_artist || songDetails.title === 'Unknown Title') {
      console.error('[Genius] Invalid song details:', songDetails);
      return { error: 'Failed to retrieve valid song details from Genius API' };
    }
    
    return {
      searchResult,
      songDetails
    };
  }
}

module.exports = new GeniusService();
