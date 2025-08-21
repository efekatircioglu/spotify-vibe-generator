# Genius API Integration for Spotify Vibe Generator

## Overview

This integration adds a powerful "About" feature to your track table that fetches rich song information from Genius API. Users can now get detailed information about any song including:

- Song descriptions and background
- Sample information (what songs this samples, what samples this)
- Related songs and musical relationships
- Release dates and album information
- Direct links to Genius for more details

## How It Works

### The Two-Step API Workflow

Since Genius doesn't have direct Spotify ID mapping, we use a sophisticated two-step process:

#### Step 1: Search for the Song
1. **Input**: Spotify song name + artist name
2. **API Call**: `GET /search?q={songName} {artistName}`
3. **Process**: Intelligent matching algorithm scores results by:
   - Artist name similarity (exact match = 100, partial = 80, word overlap = 60)
   - Song title similarity (exact = +20, partial = +10)
   - Minimum score threshold: 50/100
4. **Output**: Genius Song ID

#### Step 2: Get Detailed Information
1. **Input**: Genius Song ID from Step 1
2. **API Call**: `GET /songs/{geniusId}`
3. **Process**: Extract and format:
   - Basic song info (title, artist, album, release date)
   - Song description/annotation
   - Sample relationships
   - Musical relationships
   - Featured artists
4. **Output**: Rich song data object

## Technical Implementation

### Server-Side Components

#### 1. Genius Service (`server/src/services/geniusService.js`)
- **Token Management**: Automatic OAuth token refresh
- **Search Logic**: Intelligent artist/song matching with scoring
- **Data Extraction**: Parses complex Genius API responses
- **Error Handling**: Graceful fallbacks and detailed logging

#### 2. API Endpoint (`server/src/index.js`)
- **Route**: `GET /genius/song-info`
- **Parameters**: `songName`, `artistName`
- **Response**: Complete song information or error details

### Client-Side Components

#### 1. Genius Modal (`client/src/components/GeniusSongModal.jsx`)
- **Rich UI**: Beautiful modal with sections for different data types
- **Responsive Design**: Works on both desktop and mobile
- **Loading States**: Spinner and error handling
- **Data Display**: Organized sections for samples, relationships, etc.

#### 2. Track Table Integration (`client/src/components/NewTrackTable.jsx`)
- **New Button**: "About" button in the "Breakdown" dropdown
- **API Integration**: Calls Genius endpoint with track data
- **State Management**: Loading, error, and success states
- **Mobile Support**: Works in mobile dropdown menu

## API Response Structure

### Success Response
```json
{
  "searchResult": {
    "id": 12345,
    "title": "Song Title",
    "primary_artist": { "name": "Artist Name", "id": 67890 },
    "url": "https://genius.com/...",
    "score": 95
  },
  "songDetails": {
    "id": 12345,
    "title": "Song Title",
    "url": "https://genius.com/...",
    "primary_artist": { "name": "Artist Name", "id": 67890 },
    "featured_artists": [...],
    "album": { "name": "Album Name", "id": 11111, "url": "..." },
    "release_date": "2023-01-01",
    "description": "Song description...",
    "samples": [
      {
        "type": "samples",
        "song": { "title": "Sampled Song", "primary_artist": {...} }
      }
    ],
    "relationships": [
      {
        "type": "remixed_by",
        "song": { "title": "Remix", "primary_artist": {...} }
      }
    ]
  }
}
```

### Error Response
```json
{
  "error": "No suitable match found"
}
```

## Environment Variables Required

Add these to your `.env` file:

```bash
GENIUS_CLIENT_ID=your_genius_client_id
GENIUS_CLIENT_SECRET=your_genius_client_secret
GENIUS_CLIENT_ACCESS_TOKEN=your_generated_access_token
```

**Important Notes:**
- **GENIUS_CLIENT_ID**: Your application's client ID from Genius
- **GENIUS_CLIENT_SECRET**: Your application's client secret from Genius  
- **GENIUS_CLIENT_ACCESS_TOKEN**: The access token you generate from your Genius dashboard (this is what actually authenticates your API calls)

## Usage Examples

### Basic Usage
1. Click the "Breakdown" button on any track
2. Select "About" from the dropdown
3. View rich song information in the modal

### API Call Example
```javascript
// Frontend call
const response = await fetch(
  `http://127.0.0.1:8000/genius/song-info?songName=${encodeURIComponent(songName)}&artistName=${encodeURIComponent(artistName)}`
);
const songInfo = await response.json();
```

### Direct Service Usage
```javascript
// Backend service call
const songInfo = await geniusService.getSongInfoFromSpotify(songName, artistName);
```

## Features

### 🎯 Intelligent Matching
- **Fuzzy Artist Matching**: Handles variations in artist names
- **Song Title Scoring**: Prioritizes exact matches
- **Fallback Logic**: Multiple search strategies

### 📊 Rich Data Display
- **Song Descriptions**: Full song background and context
- **Sample Information**: What songs this samples, what samples this
- **Musical Relationships**: Covers, remixes, interpolations
- **Artist Information**: Featured artists and collaborations

### 🔄 Smart Caching
- **Token Management**: Automatic OAuth refresh
- **Rate Limiting**: Built-in delays between API calls
- **Error Recovery**: Graceful handling of API failures

### 📱 Responsive Design
- **Desktop Modal**: Full-featured modal with all information
- **Mobile Support**: Optimized for small screens
- **Touch Friendly**: Proper mobile interactions

## Error Handling

### Common Error Scenarios
1. **No Match Found**: Song doesn't exist on Genius
2. **API Rate Limits**: Too many requests
3. **Network Issues**: Connection problems
4. **Invalid Data**: Missing song/artist information

### User Experience
- **Loading States**: Clear feedback during API calls
- **Error Messages**: Helpful error descriptions
- **Graceful Degradation**: App continues working even if Genius fails

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Only fetch data when user requests it
- **Token Caching**: Reuse OAuth tokens until expiry
- **Efficient Matching**: Smart scoring reduces unnecessary API calls
- **Response Parsing**: Minimal data processing on server

### Rate Limiting
- **Built-in Delays**: Automatic spacing between requests
- **Token Refresh**: Efficient OAuth flow
- **Error Backoff**: Exponential backoff for failed requests

## Future Enhancements

### Potential Improvements
1. **Local Caching**: Cache successful Genius lookups
2. **Batch Processing**: Handle multiple songs at once
3. **Advanced Matching**: Use Spotify metadata for better matching
4. **User Preferences**: Allow users to customize what data to show

### Integration Opportunities
1. **Playlist Analysis**: Show Genius data for entire playlists
2. **Artist Pages**: Integrate with existing artist functionality
3. **Music Discovery**: Suggest related songs based on Genius data
4. **Social Features**: Share song insights with other users

## Troubleshooting

### Common Issues
1. **Missing Environment Variables**: Ensure all three Genius environment variables are set
2. **Client Access Token**: Make sure you've generated the access token from your Genius dashboard
3. **API Rate Limits**: Check Genius API documentation for limits
4. **Authentication**: Verify the Client Access Token is correct and active
5. **Network Issues**: Verify server connectivity

### Debug Information
- **Server Logs**: Detailed logging in `server/src/services/geniusService.js`
- **Client Console**: Frontend logging for API calls
- **Network Tab**: Check browser network requests
- **API Response**: Verify Genius API responses

## Security Considerations

### Data Protection
- **No User Data**: Only song metadata is processed
- **Secure Tokens**: Client Access Token stored securely on server
- **Input Validation**: Sanitize song/artist names
- **Rate Limiting**: Prevent API abuse
- **Token Security**: Client Access Token is permanent and should be kept secure

### Privacy
- **No Personal Data**: Only public song information
- **Anonymous Requests**: No user tracking or profiling
- **Secure Communication**: HTTPS for all API calls

## Conclusion

This Genius integration provides a powerful way to enrich your Spotify track data with rich musical context. The intelligent matching system ensures accurate results, while the beautiful UI makes the information easily accessible to users. The modular design makes it easy to extend and customize for future needs.
