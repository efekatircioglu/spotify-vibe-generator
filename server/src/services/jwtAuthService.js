const jwtService = require('./jwtService');
const databaseService = require('./databaseService');
const userSpotifyService = require('./userSpotifyService');

class JWTAuthService {
  // Middleware to authenticate JWT and provide user-specific Spotify API
  async authenticateAndGetSpotifyApi(req, res, next) {
    try {
      console.log('🔍 [JWTAuth] Starting JWT authentication...');
      
      // Extract and verify JWT token
      const authHeader = req.headers.authorization;
      const token = jwtService.extractTokenFromHeader(authHeader);
      const decoded = jwtService.verifyToken(token);
      
      console.log(`✅ [JWTAuth] JWT verified for user: ${decoded.displayName} (${decoded.spotifyId})`);
      
      // Get user session from database using JWT token
      const userSession = await databaseService.getUserSessionByJWT(token);
      if (!userSession) {
        throw new Error('No valid session found for JWT token');
      }
      
      console.log(`✅ [JWTAuth] Database session found: ${userSession.display_name}`);
      
      // Create user-specific Spotify API instance
      const spotifyApi = userSpotifyService.createUserSpotifyApi(
        userSession.access_token,
        userSession.refresh_token
      );
      
      // Test if the token is still valid
      try {
        await spotifyApi.getMe();
        console.log('✅ [JWTAuth] Spotify tokens are valid');
      } catch (error) {
        if (error.statusCode === 401) {
          console.log('🔄 [JWTAuth] Spotify token expired, refreshing...');
          // Refresh the token
          const refreshData = await spotifyApi.refreshAccessToken();
          const newAccessToken = refreshData.body.access_token;
          
          // Update database with new token
          await databaseService.updateUserSessionTokensBySpotifyId(
            userSession.spotify_id,
            { access_token: newAccessToken, refresh_token: userSession.refresh_token }
          );
          
          // Update the API instance with new token
          spotifyApi.setAccessToken(newAccessToken);
          console.log('✅ [JWTAuth] Token refreshed successfully');
        } else {
          throw error;
        }
      }
      
      // Add user info and Spotify API to request
      req.user = {
        spotifyId: decoded.spotifyId,
        displayName: decoded.displayName,
        email: decoded.email
      };
      req.userSpotifyApi = spotifyApi;
      
      console.log(`✅ [JWTAuth] Authentication complete for: ${decoded.displayName}`);
      next();
    } catch (error) {
      console.error(`❌ [JWTAuth] Authentication failed: ${error.message}`);
      res.status(401).json({ 
        error: 'Authentication required. Please log in again.',
        details: error.message 
      });
    }
  }
}

module.exports = new JWTAuthService();
