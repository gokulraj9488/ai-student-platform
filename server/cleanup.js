require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanup() {
  try {
    await pool.query('TRUNCATE TABLE topic_memory');
    await pool.query('TRUNCATE TABLE questions');
    console.log('✅ Cleaned topic_memory and questions tables');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  } finally {
    await pool.end();
  }
}

cleanup();