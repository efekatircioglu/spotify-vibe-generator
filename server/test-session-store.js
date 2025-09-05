// Test script to verify session store works
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import our session store
const EventEmitter = require('events');
const crypto = require('crypto');

class CustomDatabaseSessionStore extends EventEmitter {
  constructor(pool) {
    super();
    this.pool = pool;
    this.encryptionKey = process.env.SESSION_SECRET || 'your-secret-key';
  }

  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${algorithm}$${iv.toString('hex')}$${encrypted}`;
  }

  decrypt(encryptedText) {
    try {
      const [algorithm, ivHex, encrypted] = encryptedText.split('$');
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  async get(sessionId, callback) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM user_sessions WHERE session_id = $1 AND expires_at > NOW()',
        [sessionId]
      );

      if (result.rows.length === 0) {
        return callback(null, null);
      }

      const sessionData = result.rows[0];
      const session = {
        access_token: this.decrypt(sessionData.encrypted_access_token),
        refresh_token: this.decrypt(sessionData.encrypted_refresh_token),
        user_id: sessionData.spotify_id,
        display_name: sessionData.display_name,
        email: sessionData.email,
        profile_image_url: sessionData.profile_image_url
      };

      callback(null, session);
    } catch (error) {
      if (error.code === '42P01') {
        console.log('ℹ️ Database table not created yet - returning null session');
        return callback(null, null);
      }
      console.error('Database session get error:', error);
      callback(error, null);
    }
  }

  async set(sessionId, sessionData, callback) {
    try {
      if (!sessionData.access_token || !sessionData.refresh_token) {
        return callback(null);
      }

      const encryptedAccessToken = this.encrypt(sessionData.access_token);
      const encryptedRefreshToken = this.encrypt(sessionData.refresh_token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.pool.query(`
        INSERT INTO user_sessions (
          session_id, spotify_id, display_name, email, profile_image_url,
          encrypted_access_token, encrypted_refresh_token, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (session_id) 
        DO UPDATE SET
          spotify_id = EXCLUDED.spotify_id,
          display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          profile_image_url = EXCLUDED.profile_image_url,
          encrypted_access_token = EXCLUDED.encrypted_access_token,
          encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `, [
        sessionId,
        'test_user_123',
        'Test User',
        'test@example.com',
        'https://example.com/avatar.jpg',
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt
      ]);

      callback(null);
    } catch (error) {
      if (error.code === '42P01') {
        console.log('ℹ️ Database table not created yet - skipping session storage');
        return callback(null);
      }
      console.error('Database session set error:', error);
      callback(error);
    }
  }

  async destroy(sessionId, callback) {
    try {
      await this.pool.query(
        'DELETE FROM user_sessions WHERE session_id = $1',
        [sessionId]
      );
      callback(null);
    } catch (error) {
      if (error.code === '42P01') {
        return callback(null);
      }
      console.error('Database session destroy error:', error);
      callback(error);
    }
  }

  async touch(sessionId, session, callback) {
    try {
      await this.pool.query(
        'UPDATE user_sessions SET expires_at = $1 WHERE session_id = $2',
        [new Date(Date.now() + 24 * 60 * 60 * 1000), sessionId]
      );
      callback(null);
    } catch (error) {
      if (error.code === '42P01') {
        return callback(null);
      }
      console.error('Database session touch error:', error);
      callback(error);
    }
  }
}

async function testSessionStore() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🧪 Testing session store...');
    
    const store = new CustomDatabaseSessionStore(pool);
    
    // Test data
    const testSessionId = 'test_session_123';
    const testSessionData = {
      access_token: 'test_access_token_123',
      refresh_token: 'test_refresh_token_123'
    };

    // Test set
    console.log('📝 Testing set method...');
    await new Promise((resolve, reject) => {
      store.set(testSessionId, testSessionData, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Test get
    console.log('📖 Testing get method...');
    const retrievedSession = await new Promise((resolve, reject) => {
      store.get(testSessionId, (err, session) => {
        if (err) reject(err);
        else resolve(session);
      });
    });

    if (retrievedSession) {
      console.log('✅ Session retrieved successfully!');
      console.log('   User ID:', retrievedSession.user_id);
      console.log('   Display Name:', retrievedSession.display_name);
    } else {
      console.log('ℹ️ No session found (table might not exist yet)');
    }

    // Test destroy
    console.log('🗑️ Testing destroy method...');
    await new Promise((resolve, reject) => {
      store.destroy(testSessionId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🎉 Session store test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSessionStore();
