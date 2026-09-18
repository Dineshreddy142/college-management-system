import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from both backend directory and root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'college_management_system';
const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (isRemote ? '4000' : '3306'), 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'WJ28@krhps',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isRemote ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
});

export default pool;

// Auto-create webauthn_credentials table if missing
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
    console.log('[DB] Table webauthn_credentials verified/created.');
  } catch (err) {
    console.error('[DB] Failed to ensure webauthn_credentials table:', err.message);
  }
})();

