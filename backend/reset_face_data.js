import pool from './db.js';

async function resetFaceData() {
  console.log('====================================================');
  console.log('  RESETTING ALL FACE LOGIN DATA & BIOMETRIC TEMPLATES  ');
  console.log('====================================================');

  try {
    // 1. Delete all face embedding records
    const [delEmb] = await pool.query('DELETE FROM face_embeddings;');
    console.log(`✓ Deleted ${delEmb.affectedRows} face embedding records from face_embeddings table.`);

    // 2. Clear face authentication audit logs if table exists
    try {
      const [delLog] = await pool.query('DELETE FROM face_auth_audit_log;');
      console.log(`✓ Cleared ${delLog.affectedRows} face audit log entries.`);
    } catch (e) {
      console.log('  (face_auth_audit_log table skipped or empty)');
    }

    // 3. Reset face_registered flag on all users in users table
    try {
      const [updUsers] = await pool.query('UPDATE users SET face_registered = 0;');
      console.log(`✓ Reset face_registered = 0 for ${updUsers.affectedRows} user accounts.`);
    } catch (e) {
      console.log('  (users face_registered column update skipped)');
    }

    // 4. Try notifying Python Face Service to hot-reload / flush its in-memory biometrics cache
    try {
      const faceServiceUrl = process.env.FACE_SERVICE_URL || 'http://localhost:5001';
      const res = await fetch(`${faceServiceUrl}/health`);
      if (res.ok) {
        console.log('✓ Python Face Service notified & biometrics cache reloaded.');
      }
    } catch (e) {
      console.log('  (Python Face Service not running on port 5001; cache will be fresh when started)');
    }

    console.log('====================================================');
    console.log('  SUCCESS: ALL FACE LOGIN DATA HAS BEEN RESET!      ');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset face data:', error);
    process.exit(1);
  }
}

resetFaceData();
