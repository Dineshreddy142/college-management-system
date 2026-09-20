import pool from '../db.js';
import { recordBiometricFailure, logBiometricSecurityEvent } from '../services/biometricSecurityService.js';

/**
 * Phases 9 & 10: Rate Limiting, Abuse Protection & Audit Zero-Leakage Test Suite
 */
async function runRateLimitAndAuditTests() {
  console.log('========================================================================');
  console.log('   PHASES 9 & 10: ANTI-DOS RATE LIMITING & AUDIT ZERO-LEAKAGE TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Audit Log Metadata Integrity
  console.log('[1/2] Testing Biometric Audit Logging Metadata & Zero-Leakage...');
  try {
    const testIp = '127.0.0.99';
    await logBiometricSecurityEvent(1, testIp, 'TEST_FAILED_SCAN', 'Audit test failure log');

    const [rows] = await pool.execute('SELECT * FROM face_auth_audit_log WHERE ip_address = ? ORDER BY id DESC LIMIT 1', [testIp]);

    if (rows.length > 0) {
      const record = rows[0];
      const hasNoBinaryData = !record.encrypted_embedding && !record.password && !record.token;
      if (record.user_id === 1 && record.matched === 0 && hasNoBinaryData) {
        console.log('  ✔ Audit record created cleanly containing metadata only (zero biometric vector/image leakage).');
        passed++;
      } else {
        console.error('  ✖ Audit record validation failed!');
        failed++;
      }
    } else {
      console.error('  ✖ No audit record inserted!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Audit test error: ${e.message}`);
    failed++;
  }

  // 2. Target User Password Lock Immunity
  console.log('\n[2/2] Testing Target User Password Lock Immunity (Anti-DoS Guard)...');
  try {
    // 5 failed face scans for target user 1
    for (let i = 0; i < 5; i++) {
      await recordBiometricFailure(1, '192.168.1.99');
    }

    const [userRows] = await pool.execute('SELECT status FROM users WHERE id = 1');
    const isUserActive = userRows[0].status === 'active';

    if (isUserActive) {
      console.log('  ✔ Multiple third-party failed face scans did NOT trigger a hard lock on target user account.');
      passed++;
    } else {
      console.error('  ✖ Target user account was improperly locked!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ DoS guard test error: ${e.message}`);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 2 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRateLimitAndAuditTests().catch(err => {
  console.error('Fatal Rate Limit & Audit Test Error:', err);
  process.exit(1);
});
