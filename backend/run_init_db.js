import { initializeDatabase } from './init_db.js';
import pool from './db.js';

async function run() {
  console.log('[DB MIGRATION] Starting database initialization...');
  const startTime = Date.now();
  try {
    const result = await initializeDatabase();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[DB MIGRATION SUCCESS] Database initialized in ${duration}s.`, result);
  } catch (err) {
    console.error('[DB MIGRATION ERROR] Database initialization failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
