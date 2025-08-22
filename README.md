# Spotify Vibe Generator

A sophisticated music analytics platform that leverages multiple APIs to provide deep insights into your Spotify listening habits. Built with a robust Node.js/Express backend and React/Next.js frontend, featuring advanced data pipelines, caching strategies, and real-time music intelligence.

## 🎯 Core Functionality

### **Spotify Data Analysis**
- **OAuth 2.0 Integration**: Secure authentication with Spotify Web API
- **Top Tracks Analysis**: Your most played songs across different time periods (4 weeks, 6 months, 12 months)
- **Top Artists Discovery**: Personalized artist rankings with detailed metrics
- **Playlist Intelligence**: Deep analysis of playlist composition, genre distribution, and audio features
- **Real-time Listening**: Recent tracks with playback analytics and listening patterns

### **Multi-API Music Intelligence Pipeline**
The backend orchestrates a complex data enrichment pipeline using multiple music databases:

#### **Data Flow Pipeline:**
```
Spotify Track → ISRC → MusicBrainz MBID → Discogs → AcousticBrainz → Genius
     ↓              ↓           ↓           ↓            ↓           ↓
  Basic Info    Universal ID   Metadata   Releases   Audio Analysis  Lyrics/Info
```

## 🏗️ Backend Architecture & APIs

### **1. Spotify Service Integration**
```javascript
// Enhanced Spotify operations with smart retry and rate limiting
class SpotifyService {
  async getTopTracks(timeRange, limit) {
    // Implements exponential backoff for rate limiting
    // Handles token refresh automatically
    // Batch processes large requests
  }
}
```

### **2. MusicBrainz Integration**
- **ISRC → MBID Mapping**: Convert Spotify's ISRC codes to MusicBrainz IDs
- **Artist Disambiguation**: Resolve artist conflicts using MB's sophisticated matching
- **Release Relationships**: Track album versions, reissues, and variants

### **3. Discogs Service**
```javascript
// Discogs API integration for detailed release information
const discogsService = {
  searchByISRC: async (isrc) => {
    // Rate-limited requests (60/min)
    // Caches release data for 24 hours
    // Handles pagination for large discographies
  }
}
```

### **4. AcousticBrainz Integration**
- **Audio Feature Analysis**: Tempo, key, loudness, spectral features
- **Machine Learning Insights**: Genre prediction, mood analysis
- **High-Level Descriptors**: Danceability, energy, valence calculations

### **5. Genius Service**
```javascript
// Genius API for lyrics and song relationships
class GeniusService {
  async getSongInfo(artist, title) {
    // Advanced string matching algorithms
    // Handles artist name variations and aliases
    // Retrieves song relationships (samples, covers, remixes)
  }
}
```

## 🚀 Advanced Backend Features

### **Intelligent Caching System**
```javascript
// Multi-layer caching strategy
const cacheStrategy = {
  // L1: In-memory cache (Node.js Map)
  memoryCache: new Map(), // 15-minute TTL
  
  // L2: Browser localStorage (client-side)
  browserCache: {
    artistCache: '24-hour TTL',
    trackAnalysis: '7-day TTL',
    recentSearches: '30-day TTL'
  },
  
  // Cache warming for frequently accessed data
  warmCache: async () => {
    await preloadTopArtists();
    await preloadRecentTracks();
  }
}
```

### **API Rate Limiting & Optimization**
- **Request Batching**: Groups multiple API calls into single requests
- **Intelligent Pagination**: Automatically handles large datasets with optimized page sizes
- **Rate Limit Respect**: Implements per-API rate limiting with backoff strategies
- **Concurrent Request Management**: Uses `p-limit` for controlled parallelism

### **Data Pipeline Optimization**
```javascript
// Example: Parallel data enrichment
async function enrichTrackData(tracks) {
  const limit = pLimit(5); // Max 5 concurrent requests
  
  return Promise.all(tracks.map(track => 
    limit(async () => {
      const [discogs, acousticBrainz, genius] = await Promise.allSettled([
        discogsService.getRelease(track.isrc),
        acousticBrainzService.getFeatures(track.mbid),
        geniusService.getSongInfo(track.artist, track.title)
      ]);
      
      return mergeEnrichmentData(track, { discogs, acousticBrainz, genius });
    })
  ));
}
```

## 🎪 Personalized Concert Discovery

### **Ticketmaster Integration**
```javascript
// Smart concert recommendation engine
const concertFinder = {
  async findPersonalizedConcerts(userLocation, topArtists) {
    // Maps Spotify artists to Ticketmaster artist IDs
    const artistMappings = await Promise.all(
      topArtists.map(artist => 
        ticketmasterService.findArtistId(artist.name)
      )
    );
    
    // Searches for upcoming events within radius
    const concerts = await ticketmasterService.getEvents({
      artistIds: artistMappings,
      location: userLocation,
      radius: '50miles',
      sort: 'date,asc'
    });
    
    // Ranks by user preference and listening frequency
    return rankConcertsByUserPreference(concerts, topArtists);
  }
}
```

### **Geographical Intelligence**
- **Location-based Filtering**: Finds concerts within specified radius
- **Venue Information**: Detailed venue data with capacity and location
- **Price Tracking**: Concert pricing trends and availability alerts

## 📊 Data Storage & Management

### **Intelligent Storage Strategy**
```javascript
// Storage optimization with size monitoring
const storageManager = {
  // Client-side storage limits and cleanup
  maxStorageSize: 5 * 1024 * 1024, // 5MB limit
  
  cleanup: async () => {
    // Removes oldest entries when approaching limits
    // Prioritizes frequently accessed data
    // Implements LRU (Least Recently Used) eviction
  },
  
  // Compression for large datasets
  compress: (data) => {
    return JSON.stringify(data, (key, value) => {
      // Custom serialization for reduced storage
      if (key === 'images' && Array.isArray(value)) {
        return value[0]; // Store only highest quality image
      }
      return value;
    });
  }
}
```

### **Real-time Data Synchronization**
- **Incremental Updates**: Only fetches changed data since last sync
- **Conflict Resolution**: Handles concurrent data modifications
- **Offline Support**: Graceful degradation when APIs are unavailable

## 🔧 Technical Implementation

### **Backend Stack**
- **Node.js/Express**: RESTful API with middleware for authentication, rate limiting, and error handling
- **OAuth 2.0**: Secure Spotify authentication with automatic token refresh
- **Request Optimization**: Smart batching, concurrent processing, and cache-first strategies
- **Error Handling**: Comprehensive error recovery with fallback mechanisms

### **API Endpoints**
```javascript
// Key backend endpoints
app.get('/api/top-tracks/:timeRange', getTopTracks);
app.get('/api/track-analysis/:trackId', getTrackAnalysis);
app.get('/api/artist-concerts/:artistId', getArtistConcerts);
app.post('/api/batch-analysis', batchTrackAnalysis);
app.get('/api/genre-analysis/:playlistId', getGenreBreakdown);
```

### **Performance Optimizations**
- **Lazy Loading**: Loads data only when needed
- **Virtual Scrolling**: Handles large datasets efficiently
- **Response Compression**: Reduces API response sizes by up to 70%
- **CDN Integration**: Caches static assets and frequently accessed data

## 🎮 Frontend Features

### **Modern React/Next.js Architecture**
- **Server-Side Rendering**: Optimized SEO and initial load times
- **Component-based Design**: Reusable UI components with TypeScript support
- **Real-time Updates**: Live data synchronization without page refreshes
- **Mobile-First Design**: Responsive UI that works on all devices

### **Interactive Data Visualization**
- **Dynamic Charts**: Real-time genre distribution and listening analytics
- **Track Tables**: Sortable, filterable track listings with advanced search
- **Artist Profiles**: Comprehensive artist pages with concert integration
- **Playlist Analytics**: Deep dive into playlist composition and trends

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16+)
- Spotify Developer Account
- API keys for: Discogs, MusicBrainz, Genius, Ticketmaster

### **Installation**

#### **Backend Setup**
```bash
cd server
npm install
```

Create `server/.env`:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
SESSION_SECRET=your_session_secret
DISCOGS_TOKEN=your_discogs_token
GENIUS_ACCESS_TOKEN=your_genius_token
TICKETMASTER_API_KEY=your_ticketmaster_key
```

```bash
npm start
```

#### **Frontend Setup**
```bash
cd client
npm install
npm run dev
```

## 📁 Project Structure
```
spotify-vibe-generator/
├── client/                    # Next.js React frontend
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # Reusable UI components
│   │   └── utils/            # Client-side utilities & caching
│   └── package.json
├── server/                    # Node.js Express backend
│   ├── src/
│   │   ├── index.js         # Main server file with API routes
│   │   └── services/        # External API integrations
│   │       ├── spotifyService.js
│   │       ├── discogsService.js
│   │       ├── geniusService.js
│   │       └── ticketmasterService.js
│   └── package.json
└── README.md
```

## 🔮 Future Enhancements

- **Machine Learning Recommendations**: AI-powered playlist generation
- **Social Features**: Share analyses and compete with friends
- **Advanced Analytics**: Listening pattern prediction and trend analysis
- **API Rate Optimization**: Implement GraphQL for more efficient data fetching
- **Real-time Collaboration**: Live playlist editing with multiple users

---

**Built with passion for music and data.** This project showcases advanced backend development practices, API integration strategies, and modern web application architecture.

*Not affiliated with Spotify, Discogs, MusicBrainz, Genius, or Ticketmaster. For educational and personal use only.*