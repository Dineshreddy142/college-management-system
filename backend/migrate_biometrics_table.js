import pool from './db.js';

export async function migrateBiometricsTable() {
  try {
    const [cols] = await pool.query('DESCRIBE face_embeddings');
    const columnNames = cols.map(c => c.Field);
    console.log('[BIOMETRIC SCHEMA CHECK] Existing columns:', columnNames.join(', '));

    if (!columnNames.includes('auth_tag')) {
      console.log('[BIOMETRIC MIGRATION] Adding auth_tag column...');
      await pool.query('ALTER TABLE face_embeddings ADD COLUMN auth_tag VARBINARY(16) NULL AFTER encryption_iv');
    }

    if (!columnNames.includes('key_version')) {
      console.log('[BIOMETRIC MIGRATION] Adding key_version column...');
      await pool.query("ALTER TABLE face_embeddings ADD COLUMN key_version VARCHAR(32) DEFAULT 'v1' AFTER auth_tag");
    }

    if (!columnNames.includes('model_version')) {
      console.log('[BIOMETRIC MIGRATION] Adding model_version column...');
      await pool.query("ALTER TABLE face_embeddings ADD COLUMN model_version VARCHAR(64) DEFAULT 'sface_yunet_v1' AFTER key_version");
    }

    console.log('[BIOMETRIC MIGRATION] face_embeddings table schema verified & up to date.');
    return { success: true };
  } catch (err) {
    console.error('[BIOMETRIC MIGRATION ERROR]:', err.message);
    return { success: false, error: err.message };
  }
}

// Auto-run when executed directly
if (process.argv[1]?.endsWith('migrate_biometrics_table.js')) {
  migrateBiometricsTable().then(() => process.exit(0)).catch(() => process.exit(1));
}
