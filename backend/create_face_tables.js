import pool from './db.js';

export async function createFaceTables() {
  console.log('[DB] Verifying face_embeddings and face_auth_audit_log tables...');
  
  // 1. Ensure users.face_registered column exists
  try {
    const [uCols] = await pool.query('DESCRIBE users');
    const uColNames = uCols.map(c => c.Field);
    if (!uColNames.includes('face_registered')) {
      await pool.query('ALTER TABLE users ADD COLUMN face_registered TINYINT(1) DEFAULT 0 AFTER must_change_password');
      console.log('[DB] Added face_registered column to users table.');
    }
  } catch (err) {
    console.warn('[DB] Note checking users.face_registered:', err.message);
  }

  // 2. Ensure face_embeddings table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      encrypted_embedding MEDIUMBLOB NOT NULL,
      encryption_iv VARBINARY(16) NOT NULL,
      auth_tag VARBINARY(16) NULL,
      key_version VARCHAR(32) DEFAULT 'v1',
      model_version VARCHAR(64) DEFAULT 'sface_yunet_v1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      CONSTRAINT fk_face_embeddings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure columns auth_tag, key_version, model_version exist if pre-created
  try {
    const [feCols] = await pool.query('DESCRIBE face_embeddings');
    const feColNames = feCols.map(c => c.Field);
    if (!feColNames.includes('auth_tag')) {
      await pool.query('ALTER TABLE face_embeddings ADD COLUMN auth_tag VARBINARY(16) NULL AFTER encryption_iv');
    }
    if (!feColNames.includes('key_version')) {
      await pool.query('ALTER TABLE face_embeddings ADD COLUMN key_version VARCHAR(32) DEFAULT "v1" AFTER auth_tag');
    }
    if (!feColNames.includes('model_version')) {
      await pool.query('ALTER TABLE face_embeddings ADD COLUMN model_version VARCHAR(64) DEFAULT "sface_yunet_v1" AFTER key_version');
    }
  } catch (err) {
    console.warn('[DB] Note checking face_embeddings columns:', err.message);
  }

  // 3. Ensure face_auth_audit_log table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS face_auth_audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      matched TINYINT(1) NOT NULL,
      confidence DECIMAL(5,4) NULL,
      ip_address VARCHAR(45),
      liveness_passed TINYINT(1) NOT NULL,
      INDEX idx_face_audit_user (user_id),
      CONSTRAINT fk_face_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('[DB] Face biometric tables verified successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('create_face_tables.js')) {
  createFaceTables().then(() => process.exit(0)).catch(err => {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  });
}

