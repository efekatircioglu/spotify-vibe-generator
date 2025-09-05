// Simple database connection test
const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    return;
  }

  // Test different connection configurations
  const configs = [
    {
      name: 'Direct URL',
      config: { connectionString: process.env.DATABASE_URL }
    },
    {
      name: 'URL with SSL',
      config: { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Parsed components',
      config: (() => {
        const url = new URL(process.env.DATABASE_URL);
        return {
          host: url.hostname,
          port: url.port || 5432,
          database: url.pathname.substring(1),
          user: url.username,
          password: url.password,
          ssl: { rejectUnauthorized: false }
        };
      })()
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🧪 Testing ${name}...`);
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log(`✅ ${name} - Success!`);
      console.log(`   Server time: ${result.rows[0].current_time}`);
      client.release();
      await pool.end();
      break; // If one works, we're good
    } catch (error) {
      console.error(`❌ ${name} - Failed:`, error.message);
      await pool.end();
    }
  }
}

testConnection();
