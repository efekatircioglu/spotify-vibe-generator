# Vibe Generator 

A sophisticated music analytics platform that provides deep insights into your Spotify listening habits and personalized concert discovery. Built with modern web technologies and advanced API integration strategies.

## Tech Stack

### **Frontend**
- **Next.js 15.3.4** with React components and App Router
- **Tailwind CSS** for utility-first styling with custom CSS modules
- **localStorage and sessionStorage** for client-side data management
- **Framer Motion** for smooth animations and transitions
- **Responsive Design** with mobile-first approach

### **Backend**
- **Node.js** with **Express.js** framework
- **Server-side session management** for OAuth authentication
- **OAuth 2.0** integration with Spotify
- **ID mapping roadmaps** for external API platforms
- **PM2** for production process management

### **Data Management**
- **Intelligent Caching System**: Multi-layer caching with memory and browser storage
- **API Rate Limiting**: Smart request batching and rate limit respect
- **Data Pipeline Optimization**: Parallel processing and concurrent request management
- **Storage Optimization**: LRU eviction and compression strategies

### **Smart API Integration**
- **Request Batching**: Groups multiple API calls into single requests
- **Intelligent Pagination**: Handles large datasets with optimized page sizes
- **Rate Limit Management**: Implements per-API rate limiting with exponential backoff
- **Concurrent Processing**: Controlled parallelism with `p-limit`

## Core Features

### **Music Analytics Dashboard**
- **OAuth 2.0 Authentication**: Secure Spotify login with automatic token refresh
- **Top Songs/Artists Discovery**:Users most played songs and artists across different time periods 
- **Song Breakdown**: Deep analysis of song's genre distribution, audio features, backstory, contributors, samples, and much more
- **Playlist Intelligence**: Deep analysis of playlist composition, genre distribution, and audio features
- **Real-time Listening**: Recent tracks with playback analytics and listening patterns
- **Custom Wrapped**: Generate personalized music wrapped for user's playlists, artist's albums, and user's top songs

### **Concert Discovery Engine**
- **Personalized Recommendations**: Find concerts based on your top 150 unique artists
- **Worldwide Search**: Discover concerts globally with location-based filtering
- **Smart Artist Mapping**: Advanced ID mapping roadmaps between Spotify and Ticketmaster APIs
- **Real-time Availability**: Live concert data with venue information and pricing

### **Multi-API Music Intelligence**
The platform integrates with 5 major music APIs to provide comprehensive data enrichment:

## Backend Architecture & APIs

### **Multi-API Data Enrichment Pipeline**
The platform orchestrates a sophisticated data enrichment workflow using 6 major music APIs:

#### **Data Flow Pipeline:**
```
Spotify Track → ISRC → MusicBrainz MBID → AcousticBrainz 
     ↓              ↓           ↓              ↓            
  Basic Info    Universal ID   Metadata   Audio Analysis  
```

### **API Integration Details:**

#### **1. Spotify Web API** (Primary Data Source)
- **Authentication**: OAuth 2.0 with automatic token refresh
- **Key Endpoints**:
  - `GET /me` - User profile and authentication
  - `GET /top-tracks` - User's most played tracks (4w/6m/12m)
  - `GET /top-artists` - User's favorite artists
  - `GET /recent-tracks` - Recently played tracks
  - `GET /playlists-with-duration` - User's playlists
  - `GET /audio-features/:trackId` - Track audio analysis
  - `GET /track-isrc/:id` - Extract ISRC codes from tracks

#### **2. MusicBrainz API** (Universal ID Mapping)
- **Purpose**: Convert Spotify ISRC codes to MusicBrainz IDs (MBID)
- **Key Endpoints**:
  - `GET /ws/2/recording?query=isrc:{ISRC}&fmt=json` - ISRC to MBID lookup
  - `GET /ws/2/recording?query={songName}%20{artistName}&fmt=json` - Name-based search
- **Rate Limiting**: 1 request per second (enforced with delays)

#### **3. AcousticBrainz API** (Audio Analysis)
- **Purpose**: Advanced audio feature analysis using MBIDs
- **Key Endpoints**:
  - `GET /api/v1/high-level?recording_ids={MBID}` - High-level descriptors
  - `GET /api/v1/low-level?recording_ids={MBID}` - Low-level audio features
- **Batch Processing**: Up to 25 MBIDs per request

#### **4. Discogs API** (Music Metadata)
- **Purpose**: Detailed artist profiles, album information, and genre data
- **Key Endpoints**:
  - `GET /database/search?q={artistName}&type=artist` - Artist search
  - `GET /artists/{artistId}` - Artist profile and bio
  - `GET /artists/{artistId}/releases` - Artist discography
  - `GET /releases/{releaseId}` - Release details
- **Rate Limiting**: 60 requests per minute with exponential backoff

#### **5. Genius API** (Lyrics & Song Information)
- **Purpose**: Song relationships, and music information
- **Key Endpoints**:
  - `GET /search?q={songName}%20{artistName}` - Song search
  - `GET /songs/{songId}` - Song details and lyrics
  - `GET /artists/{artistId}` - Artist information
- **Authentication**: Client Access Token (permanent)
- **Features**: Song relationships (samples, interpolations, remixes)

#### **6. Ticketmaster API** (Concert Discovery)
- **Purpose**: Find concerts for user's favorite artists
- **Key Endpoints**:
  - `GET /discovery/v2/attractions.json` - Artist search
  - `GET /discovery/v2/events.json` - Event discovery
- **Features**: Location-based filtering, venue information, pricing
### **API Call Workflow & Rate Limiting**

#### **Intelligent Request Management**
The platform implements sophisticated rate limiting and request optimization:

#### **Rate Limiting Strategy**
- **Spotify API**: Automatic token refresh, no explicit limits
- **MusicBrainz**: 1 request per second (enforced with 500ms delays)
- **AcousticBrainz**: Batch processing (25 MBIDs per request)
- **Discogs**: 60 requests per minute with exponential backoff
- **Genius**: No strict limits, uses permanent access tokens
- **Ticketmaster**: No strict limits, optimized pagination

#### **Error Handling & Retry Logic**
- **Exponential backoff** for failed requests
- **Graceful degradation** when APIs are unavailable
- **Fallback mechanisms** for missing data
- **Comprehensive logging** for debugging.

## Project Structure

```
vibegenerator/
├── client/                    # Next.js React frontend
│   ├── src/
│   │   ├── app/              # Next.js app directory (pages)
│   │   ├── components/       # Reusable UI components
│   │   ├── utils/            # Client-side utilities & caching
│   │   └── config/           # API configuration
│   └── package.json
├── server/                    # Node.js Express backend
│   ├── src/
│   │   ├── index.js         # Main server file with API routes
│   │   └── services/        # External API integrations
│   │       ├── spotifyService.js
│   │       ├── ticketmasterService.js
│   │       ├── discogsService.js
│   │       └── geniusService.js
│   └── package.json
└── README.md
```

##  Installation & Setup

### **Prerequisites**
- Node.js (v16+)
- Spotify Developer Account
- API keys for external services

### **Initial Setup:**
- **Clone repository**: `git clone <repository-url>`
- **Navigate to project**: `cd vibegenerator`

### **Backend Setup (3 simple steps):**
- **Navigate and install**: `cd server` + `npm install`
- **Configure**: Create `.env` file with API keys
- **Start**: `npm start`

### **Frontend Setup (3 simple steps):**
- **Navigate and install**: `cd client` + `npm install`
- **Start**: `npm run dev`
- **Access**: Open `http://localhost:3000`

### **Environment Variables**
Create `server/.env`:
```env
# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:8000/callback

# Ticketmaster API
TICKETMASTER_CONSUMER_KEY=your_ticketmaster_key

# Discogs API
DISCOGS_CONSUMER_KEY=your_discogs_key
DISCOGS_CONSUMER_SECRET=your_discogs_secret
DISCOGS_USER_AGENT=your_discogs_user_agent

# Genius API
GENIUS_CLIENT_ID=your_genius_client_id
GENIUS_CLIENT_SECRET=your_genius_client_secret
GENIUS_CLIENT_ACCESS_TOKEN=your_genius_access_token
```

### **Getting API Keys**
To run this application locally, you'll need to obtain API keys from the following services:

#### **1. Spotify Developer Account**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:8000/callback` to Redirect URIs
4. Copy `Client ID` and `Client Secret`

#### **2. Ticketmaster API**
1. Go to [Ticketmaster Developer Portal](https://developer-acct.ticketmaster.com/)
2. Create a new application
3. Copy the `Consumer Key`

#### **3. Discogs API**
1. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. Create a new application
3. Copy `Consumer Key`, `Consumer Secret`, and set `User Agent`

#### **4. Genius API**
1. Go to [Genius API Clients](https://genius.com/api-clients)
2. Create a new API client
3. Generate an Access Token
4. Copy `Client ID`, `Client Secret`, and `Access Token`

### **Important Notes for Local Development**
- All URLs in the `.env` file should use `localhost`
- The application runs entirely on your local machine
- No cloud server or external hosting required
- Make sure both frontend (port 3000) and backend (port 8000) are running

- **Spotify**: [Developer Dashboard](https://developer.spotify.com/dashboard) → Add `http://localhost:8000/callback`
- **Ticketmaster**: [Developer Portal](https://developer-acct.ticketmaster.com/) → Get Consumer Key
- **Discogs**: [Developer Settings](https://www.discogs.com/settings/developers) → Get Consumer Key/Secret
- **Genius**: [API Clients](https://genius.com/api-clients) → Generate Access Token

## API Endpoints

### **Authentication**
- `GET /login` - Spotify OAuth login
- `GET /callback` - OAuth callback handler
- `GET /logout` - User logout

### **Music Analytics**
- `GET /me` - User profile information
- `GET /top-tracks` - User's top tracks
- `GET /top-artists` - User's top artists
- `GET /recent-tracks` - Recently played tracks
- `GET /playlists-with-duration` - User's playlists

### **Concert Discovery**
- `GET /concerts/artist-search` - Search for artists on Ticketmaster
- `GET /concerts/events` - Get concert events
- `POST /concerts/events/optimized-batch` - Batch concert search

### **Data Enrichment**
- `GET /audio-features/:trackId` - Track audio analysis
- `GET /playlist-genres/:playlistId` - Playlist genre analysis
- `GET /playlist-artists/:playlistId` - Playlist artist analysis

## Key Features

### **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for all screen sizes
- Touch-friendly interface for mobile devices

### **Performance Optimizations**
- **Lazy Loading**: Loads data only when needed
- **Virtual Scrolling**: Handles large datasets efficiently
- **Response Compression**: Reduces API response sizes
- **CDN Integration**: Caches static assets

### **Data Visualization**
- Dynamic charts for genre distribution
- Interactive track tables with advanced search
- Real-time analytics updates
- Comprehensive artist profiles

## Security Features

- **OAuth 2.0**: Secure authentication with Spotify
- **Session Management**: Server-side session handling
- **CORS Configuration**: Cross-origin security
- **Environment Variables**: Secure configuration storage
- **Input Validation**: Data sanitization and validation

## Deployment

### **Local Development**
This application is designed to run locally on your machine:

- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **No external hosting required**
- **All data processing happens locally**

### **Production Deployment (Optional)**
If you want to deploy to a cloud server:

#### **DigitalOcean Droplet**
- Ubuntu 24.04.3 LTS
- PM2 process management
- Environment-based configuration
- SSL certificate setup (recommended)

#### **Environment Configuration**
```bash
# Production environment variables
REDIRECT_URI=https://yourdomain.com:8000/callback
NODE_ENV=production
```
---

This project is for educational and personal use only. Not affiliated with Spotify, Ticketmaster, Discogs, Genius, or MusicBrainz.


**Built with passion for music and data.** This project showcases advanced backend development practices, API integration strategies, and modern web application architecture.