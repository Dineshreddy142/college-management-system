import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes Face Authentication database tables idempotently.
 * Safe to execute repeatedly on server startup or setup.
 */
export async function initFaceAuthTables() {
    console.log('[FACE AUTH DB] Verifying and initializing Face Authentication database tables...');
    try {
        // 1. user_face_biometrics table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_face_biometrics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                encrypted_embedding LONGBLOB NOT NULL,
                iv VARCHAR(64) NOT NULL,
                auth_tag VARCHAR(64) NOT NULL,
                algorithm_version VARCHAR(50) NOT NULL DEFAULT 'arcface-mobilefacenet-v1',
                vector_dim INT NOT NULL DEFAULT 512,
                quality_score FLOAT DEFAULT 0.0,
                status ENUM('active', 'disabled', 'revoked') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 2. face_audit_logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS face_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                identifier VARCHAR(100) NULL,
                event_type ENUM(
                    'FACE_ENROLLMENT_SUCCESS',
                    'FACE_ENROLLMENT_FAILURE',
                    'FACE_LOGIN_SUCCESS',
                    'FACE_LOGIN_FAILURE',
                    'FACE_LOGIN_RATE_LIMITED',
                    'FACE_DISABLED',
                    'FACE_RE_ENROLLED',
                    'FACE_SERVICE_ERROR'
                ) NOT NULL,
                ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
                failure_reason VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_face_audit_user (user_id),
                INDEX idx_face_audit_event (event_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. face_failed_attempts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS face_failed_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(100) NOT NULL UNIQUE,
                failed_count INT DEFAULT 1,
                lockout_until DATETIME NULL,
                last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_face_failed_id (identifier)
            )
        `);

        console.log('[FACE AUTH DB] Face Authentication tables verified successfully.');
        return { success: true };
    } catch (error) {
        console.error('[FACE AUTH DB] Failed to initialize Face Authentication tables:', error.message);
        throw error;
    }
}

export default initFaceAuthTables;
