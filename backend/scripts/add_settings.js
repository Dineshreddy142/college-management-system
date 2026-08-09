import pool from '../db.js';

async function initSettings() {
  try {
    console.log('Creating system_settings table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255)
      )
    `);
    
    console.log('Inserting default MANDATORY_FACE_ENROLLMENT setting...');
    await pool.execute(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value) 
      VALUES ('MANDATORY_FACE_ENROLLMENT', 'true')
    `);
    
    console.log('Settings initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing settings:', error);
    process.exit(1);
  }
}

initSettings();
