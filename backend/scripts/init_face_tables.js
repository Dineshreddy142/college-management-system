import pool from '../db.js';

async function initFaceTables() {
  console.log('[DB EXECUTE] Connecting to database and verifying face authentication tables...');

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS webauthn_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        credential_id VARCHAR(512) NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter INT DEFAULT 0,
        device_label VARCHAR(100) DEFAULT 'Mobile Passkey',
        transports VARCHAR(255) DEFAULT '["internal"]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(' -> Verified/Created table: webauthn_credentials');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS face_biometrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        encrypted_template TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        auth_tag VARCHAR(64) NOT NULL,
        algorithm VARCHAR(32) DEFAULT 'aes-256-gcm',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(' -> Verified/Created table: face_biometrics');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS face_auth_nonces (
        nonce VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(' -> Verified/Created table: face_auth_nonces');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS face_failed_attempts (
        user_id INT PRIMARY KEY,
        failed_count INT DEFAULT 0,
        cooldown_until DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(' -> Verified/Created table: face_failed_attempts');

    // Query information schema or show tables to confirm
    const [tables] = await pool.execute(`SHOW TABLES LIKE 'face_%'`);
    console.log('\n[DB CONFIRMATION] Face authentication tables currently in database:');
    console.table(tables);

    process.exit(0);
  } catch (err) {
    console.error('[DB FATAL ERROR] Failed to create face authentication tables:', err);
    process.exit(1);
  }
}

initFaceTables();
