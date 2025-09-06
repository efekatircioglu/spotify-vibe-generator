const { Pool } = require('pg');
const crypto = require('crypto');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });
  }

  // Encryption key - in production, this should be stored securely
  getEncryptionKey() {
    return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  // Encrypt sensitive data
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data (backward compatible)
  decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    
    // Check if the encrypted text contains IV (new format)
    if (encryptedText.includes(':')) {
      // New format with IV
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = textParts.join(':');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // Old format without IV (backward compatibility)
      try {
        const decipher = crypto.createDecipher(algorithm, this.getEncryptionKey());
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        console.error('Error decrypting with old method:', error);
        throw error;
      }
    }
  }

  // Create or update user session
  async createOrUpdateUserSession(sessionId, spotifyData, tokens, jwtToken = null) {
    const client = await this.pool.connect();
    try {
      
      const {
        id: spotifyId,
        display_name: displayName,
        email,
        images
      } = spotifyData;

      const profileImageUrl = images && images.length > 0 ? images[0].url : null;
      const encryptedAccessToken = this.encrypt(tokens.access_token);
      const encryptedRefreshToken = this.encrypt(tokens.refresh_token);
      
      // Calculate expiration time (Spotify tokens typically expire in 1 hour)
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      // First, delete any existing sessions for this Spotify user
      const deleteQuery = 'DELETE FROM user_sessions WHERE spotify_id = $1';
      await client.query(deleteQuery, [spotifyId]);

      // Then insert the new session
      const insertQuery = `
        INSERT INTO user_sessions (
          session_id, spotify_id, display_name, email, profile_image_url,
          encrypted_access_token, encrypted_refresh_token, jwt_token, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at, updated_at, jwt_token
      `;

      const values = [
        sessionId,
        spotifyId,
        displayName,
        email,
        profileImageUrl,
        encryptedAccessToken,
        encryptedRefreshToken,
        jwtToken,
        expiresAt
      ];

      const result = await client.query(insertQuery, values);
      console.log('User session saved to database (Spotify ID unique):', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving user session to database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user session by Spotify ID
  async getUserSessionBySpotifyId(spotifyId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, session_id, spotify_id, display_name, email, profile_image_url,
               encrypted_access_token, encrypted_refresh_token, created_at, updated_at, expires_at
        FROM user_sessions 
        WHERE spotify_id = $1 AND expires_at > NOW()
      `;
      
      const result = await client.query(query, [spotifyId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      
      // Decrypt tokens
      session.access_token = this.decrypt(session.encrypted_access_token);
      session.refresh_token = this.decrypt(session.encrypted_refresh_token);
      
      // Remove encrypted tokens from response
      delete session.encrypted_access_token;
      delete session.encrypted_refresh_token;
      
      return session;
    } catch (error) {
      console.error('Error retrieving user session by Spotify ID from database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user session by session ID
  async getUserSession(sessionId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, session_id, spotify_id, display_name, email, profile_image_url,
               encrypted_access_token, encrypted_refresh_token, created_at, updated_at, expires_at
        FROM user_sessions 
        WHERE session_id = $1 AND expires_at > NOW()
      `;
      
      const result = await client.query(query, [sessionId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      
      // Decrypt tokens
      session.access_token = this.decrypt(session.encrypted_access_token);
      session.refresh_token = this.decrypt(session.encrypted_refresh_token);
      
      // Remove encrypted tokens from response
      delete session.encrypted_access_token;
      delete session.encrypted_refresh_token;
      
      return session;
    } catch (error) {
      console.error('Error retrieving user session from database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user session by JWT token
  async getUserSessionByJWT(jwtToken) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, session_id, spotify_id, display_name, email, profile_image_url,
               encrypted_access_token, encrypted_refresh_token, created_at, updated_at, expires_at
        FROM user_sessions 
        WHERE jwt_token = $1 AND expires_at > NOW()
      `;
      
      const result = await client.query(query, [jwtToken]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      
      // Decrypt tokens
      session.access_token = this.decrypt(session.encrypted_access_token);
      session.refresh_token = this.decrypt(session.encrypted_refresh_token);
      
      // Remove encrypted tokens from response
      delete session.encrypted_access_token;
      delete session.encrypted_refresh_token;
      
      return session;
    } catch (error) {
      console.error('Error retrieving user session by JWT from database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update tokens for existing session by Spotify ID
  async updateUserSessionTokensBySpotifyId(spotifyId, tokens) {
    const client = await this.pool.connect();
    try {
      const encryptedAccessToken = this.encrypt(tokens.access_token);
      const encryptedRefreshToken = this.encrypt(tokens.refresh_token);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      const query = `
        UPDATE user_sessions 
        SET encrypted_access_token = $1, 
            encrypted_refresh_token = $2, 
            expires_at = $3,
            updated_at = NOW()
        WHERE spotify_id = $4
        RETURNING id, updated_at
      `;

      const result = await client.query(query, [
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        spotifyId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Session not found for Spotify ID');
      }

      console.log('User session tokens updated in database by Spotify ID:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user session tokens by Spotify ID in database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update tokens for existing session
  async updateUserSessionTokens(sessionId, tokens) {
    const client = await this.pool.connect();
    try {
      const encryptedAccessToken = this.encrypt(tokens.access_token);
      const encryptedRefreshToken = this.encrypt(tokens.refresh_token);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      const query = `
        UPDATE user_sessions 
        SET encrypted_access_token = $1, 
            encrypted_refresh_token = $2, 
            expires_at = $3,
            updated_at = NOW()
        WHERE session_id = $4
        RETURNING id, updated_at
      `;

      const result = await client.query(query, [
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        sessionId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }

      console.log('User session tokens updated in database:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user session tokens in database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete user session
  async deleteUserSession(sessionId) {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM user_sessions WHERE session_id = $1';
      const result = await client.query(query, [sessionId]);
      console.log('User session deleted from database');
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user session from database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update JWT token for a user session by Spotify ID
  async updateUserSessionJWTBySpotifyId(spotifyId, jwtToken) {
    const client = await this.pool.connect();
    try {
      const query = 'UPDATE user_sessions SET jwt_token = $1, updated_at = NOW() WHERE spotify_id = $2';
      const result = await client.query(query, [jwtToken, spotifyId]);
      console.log(`JWT token updated for user: ${spotifyId}`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating JWT token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
      const result = await client.query(query);
      console.log(`Cleaned up ${result.rowCount} expired sessions`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

module.exports = new DatabaseService();
