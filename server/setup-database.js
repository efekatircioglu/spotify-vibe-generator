const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createUserSessionsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create the table
    console.log('📋 Creating user_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        spotify_id VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        email VARCHAR(255),
        profile_image_url TEXT,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    // Create indexes
    console.log('📊 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_spotify_id ON user_sessions(spotify_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
    `);

    // Create function and trigger
    console.log('⚙️ Creating update trigger...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
      CREATE TRIGGER update_user_sessions_updated_at
          BEFORE UPDATE ON user_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('🎉 Database table created successfully!');
    console.log('📝 You can now login and sessions will be stored in the database');

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure your DATABASE_URL is correct in your .env file');
    }
  } finally {
    await pool.end();
  }
}

createUserSessionsTable();
