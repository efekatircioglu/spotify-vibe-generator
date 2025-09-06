const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
    this.expiresIn = '1h'; // JWT expires in 1 hour
  }

  // Generate JWT token for a user
  generateToken(userData) {
    const payload = {
      spotifyId: userData.id,
      displayName: userData.display_name,
      email: userData.email,
      iat: Math.floor(Date.now() / 1000), // Issued at
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expires in 1 hour
    };

    const token = jwt.sign(payload, this.secret);
    console.log(`🔐 [JWT] Generated token for user: ${userData.display_name} (${userData.id})`);
    return token;
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      console.log(`✅ [JWT] Token verified for user: ${decoded.displayName} (${decoded.spotifyId})`);
      return decoded;
    } catch (error) {
      console.log(`❌ [JWT] Token verification failed: ${error.message}`);
      throw new Error('Invalid or expired token');
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  // Middleware to authenticate JWT tokens
  authenticateJWT(req, res, next) {
    try {
      console.log('🔍 [JWT Middleware] Starting authentication...');
      
      const authHeader = req.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);
      
      const decoded = this.verifyToken(token);
      
      // Add user info to request
      req.user = {
        spotifyId: decoded.spotifyId,
        displayName: decoded.displayName,
        email: decoded.email
      };
      
      console.log(`✅ [JWT Middleware] User authenticated: ${decoded.displayName}`);
      next();
    } catch (error) {
      console.log(`❌ [JWT Middleware] Authentication failed: ${error.message}`);
      res.status(401).json({ 
        error: 'Authentication required. Please log in again.',
        details: error.message 
      });
    }
  }

  // Get JWT secret (for environment setup)
  getSecret() {
    return this.secret;
  }
}

module.exports = new JWTService();
