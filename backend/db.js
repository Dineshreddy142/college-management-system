import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Load .env files for local development mode
if (!isProduction) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'college_management_system';
const dbPort = parseInt(process.env.DB_PORT || '4000', 10);

if (!dbHost || !dbUser || !dbPass) {
  throw new Error('[DATABASE CONFIG FATAL] Database configuration is missing. Configure TiDB Cloud environment variables (DB_HOST, DB_USER, DB_PASS, DB_NAME).');
}

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPass,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

export default pool;

// Auto-create webauthn & face biometrics tables if missing
(async () => {
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

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS face_auth_nonces (
        nonce VARCHAR(64) PRIMARY KEY,
        user_id INT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try {
      await pool.execute(`ALTER TABLE face_auth_nonces MODIFY COLUMN user_id INT NULL`);
    } catch (colErr) {}

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS face_failed_attempts (
        user_id INT PRIMARY KEY,
        failed_count INT DEFAULT 0,
        cooldown_until DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('[DB] Tables webauthn_credentials, face_biometrics, face_auth_nonces, face_failed_attempts verified/created.');
  } catch (err) {
    console.error('[DB] Failed to ensure face/webauthn tables:', err.message);
  }
})();
