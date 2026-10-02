import pool from './db.js';

export async function initBlockTables() {
  try {
    console.log('[BlockSystem] Dropping block management database tables...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DROP TABLE IF EXISTS floor_connections, floor_versions, floor_objects, floor_layers, floors, buildings, block_audit_logs');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[BlockSystem] Database tables dropped successfully.');
  } catch (err) {
    console.error('[BlockSystem] Database cleanup error:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('init_block_tables.js')) {
  initBlockTables().then(() => process.exit(0));
}
