import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || 'WJ28@krhps';
const dbName = process.env.DB_NAME || 'college_management_system';

async function createSecurityTable() {
  const pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5
  });

  const conn = await pool.getConnection();

  try {
    console.log('Creating security_login_attempts table if not exists...');
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS security_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(255) NOT NULL,
        attempt_count INT DEFAULT 1,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(512) NULL,
        device_information VARCHAR(255) NULL,
        camera_permission VARCHAR(50) DEFAULT 'unavailable',
        image_captured BOOLEAN DEFAULT FALSE,
        image_reference VARCHAR(255) NULL,
        security_event VARCHAR(100) DEFAULT 'SUSPICIOUS_LOGIN_ATTEMPT',
        account_locked BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sec_user_id (user_id),
        INDEX idx_sec_email (email),
        INDEX idx_sec_created_at (created_at),
        INDEX idx_sec_ip_address (ip_address),
        CONSTRAINT fk_sec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Table security_login_attempts created successfully.');

    // Also ensure lock_until or status in users if needed
    const [cols] = await conn.execute('SHOW COLUMNS FROM users LIKE "locked_until"');
    if (cols.length === 0) {
      await conn.query('ALTER TABLE users ADD COLUMN locked_until DATETIME NULL AFTER status');
      console.log('Added locked_until column to users table.');
    }

  } catch (err) {
    console.error('Error creating security table:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

createSecurityTable();
