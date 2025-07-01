# Spotify Vibe Generator

A modern web app that analyzes your Spotify listening habits, generates custom playlists, and will soon provide a "Spotify Wrapped"-style experience (upcoming feature). Built with a React/Next.js frontend and a Node.js/Express backend, using Spotify OAuth and the Spotify Web API.

## Features

- **Spotify OAuth authentication**
- Analyze your last 50 played songs (with genre, artist, album, year, duration)
- View your own playlists (with cover, track count, total duration)
- Analyze genre distribution for any playlist (interactive, paginated chart)
- Responsive, modern dark-themed UI with smooth effects
- Handles missing data gracefully (shows "Unknown" for missing genres)
- No sensitive data committed (see `.gitignore`)
- **Upcoming:** Spotify Wrapped-style yearly summary and insights


## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- A Spotify Developer account ([create an app here](https://developer.spotify.com/dashboard/applications))

### Clone the repository
```bash
git clone https://github.com/efekatircioglu/spotify-vibe-generator.git
cd spotify-vibe-generator
```

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
SESSION_SECRET=your_session_secret
```

Start the backend:
```bash
npm start
# or
node src/index.js
```

### 2. Frontend Setup

```bash
cd ../client
npm install
```

Start the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend).

## Environment Variables
- **server/.env**: _Never commit this file!_
  - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SESSION_SECRET`
- **client/.env**: (if needed for custom frontend config)

## Usage
1. Go to the frontend URL and log in with Spotify.
2. Analyze your last 50 songs or your playlists.
3. View genre analytics and playlist breakdowns.

## Project Structure
```
spotify-vibe-generator/
├── client/   # Next.js React frontend
├── server/   # Node.js Express backend
├── README.md
└── .gitignore
```


---

**Note:** This project is not affiliated with or endorsed by Spotify. For educational and personal use only.
