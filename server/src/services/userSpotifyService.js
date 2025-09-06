const SpotifyWebApi = require('spotify-web-api-node');
const databaseService = require('./databaseService');

class UserSpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = 'https://api.vibegenerator.me/callback';
  }

  // Create a user-specific Spotify API instance
  createUserSpotifyApi(accessToken, refreshToken) {
    const spotifyApi = new SpotifyWebApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    });

    if (accessToken) {
      spotifyApi.setAccessToken(accessToken);
    }
    if (refreshToken) {
      spotifyApi.setRefreshToken(refreshToken);
    }

    return spotifyApi;
  }

  // Get user-specific Spotify API instance from session
  async getUserSpotifyApi(req) {
    try {
      // First try to get tokens from session
      if (req.session && req.session.access_token) {
        const spotifyApi = this.createUserSpotifyApi(
          req.session.access_token,
          req.session.refresh_token
        );

        // Test if the token is still valid
        try {
          await spotifyApi.getMe();
          return spotifyApi;
        } catch (error) {
          if (error.statusCode === 401) {
            // Token expired, try to refresh
            console.log('Token expired, attempting to refresh...');
            return await this.refreshUserToken(req, spotifyApi);
          }
          throw error;
        }
      }

      // If no session tokens, try to get from database using session ID
      if (req.sessionID) {
        const userSession = await databaseService.getUserSession(req.sessionID);
        if (userSession && userSession.access_token) {
          const spotifyApi = this.createUserSpotifyApi(
            userSession.access_token,
            userSession.refresh_token
          );

          // Test if the token is still valid
          try {
            await spotifyApi.getMe();
            return spotifyApi;
          } catch (error) {
            if (error.statusCode === 401) {
              // Token expired, try to refresh
              console.log('Token expired, attempting to refresh from database...');
              return await this.refreshUserTokenFromDatabase(req, userSession, spotifyApi);
            }
            throw error;
          }
        }
      }

      throw new Error('No valid access token found');
    } catch (error) {
      console.error('Error getting user Spotify API:', error);
      throw error;
    }
  }

  // Refresh user token from session
  async refreshUserToken(req, spotifyApi) {
    try {
      const refreshToken = spotifyApi.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const data = await spotifyApi.refreshAccessToken();
      const newAccessToken = data.body.access_token;

      // Update session with new token
      req.session.access_token = newAccessToken;
      spotifyApi.setAccessToken(newAccessToken);

      // Update database with new token
      try {
        const userData = await spotifyApi.getMe();
        const spotifyId = userData.body.id;
        
        await databaseService.updateUserSessionTokensBySpotifyId(
          spotifyId,
          { access_token: newAccessToken, refresh_token: refreshToken }
        );
        console.log('Token updated in database successfully by Spotify ID');
      } catch (dbError) {
        console.error('Error updating token in database:', dbError);
      }

      return spotifyApi;
    } catch (error) {
      console.error('Error refreshing user token:', error);
      throw error;
    }
  }

  // Refresh user token from database
  async refreshUserTokenFromDatabase(req, userSession, spotifyApi) {
    try {
      const refreshToken = userSession.refresh_token;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      spotifyApi.setRefreshToken(refreshToken);
      const data = await spotifyApi.refreshAccessToken();
      const newAccessToken = data.body.access_token;

      // Update session with new token
      req.session.access_token = newAccessToken;
      req.session.refresh_token = refreshToken;
      spotifyApi.setAccessToken(newAccessToken);

      // Update database with new token
      try {
        await databaseService.updateUserSessionTokensBySpotifyId(
          userSession.spotify_id,
          { access_token: newAccessToken, refresh_token: refreshToken }
        );
        console.log('Token updated in database successfully by Spotify ID');
      } catch (dbError) {
        console.error('Error updating token in database:', dbError);
      }

      return spotifyApi;
    } catch (error) {
      console.error('Error refreshing user token from database:', error);
      throw error;
    }
  }

  // Middleware to ensure user has valid Spotify API access
  async ensureUserSpotifyApi(req, res, next) {
    try {
      req.userSpotifyApi = await this.getUserSpotifyApi(req);
      next();
    } catch (error) {
      console.error('Failed to get user Spotify API:', error);
      res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }
  }
}

module.exports = new UserSpotifyService();
