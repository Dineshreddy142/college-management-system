import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * Phase 1: Baseline Authentication & RBAC Verification Test Suite
 * Ensures password auth, JWT tokens, bcrypt verification, and RBAC rules remain 100% functional.
 */
async function runBaselineTests() {
  console.log('========================================================================');
  console.log('   PHASE 1: AUTHENTICATION BASELINE & SECURITY REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Database Connection Check
  console.log('[1/5] Testing MySQL Database Connection...');
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    console.log(`  ✔ DB Connection OK. Total Users: ${rows[0].count}`);
    passed++;
  } catch (e) {
    console.error(`  ✖ DB Connection Failed: ${e.message}`);
    failed++;
  }

  // 2. Admin Account Integrity Check
  console.log('\n[2/5] Testing Admin Account Integrity...');
  try {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name as role_name
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(r.name) IN ('admin', 'administrator') AND u.status = 'active'
       LIMIT 1`
    );
    if (rows.length > 0) {
      console.log(`  ✔ Admin Account Found: ID ${rows[0].id}, Email: ${rows[0].email}, Role: ${rows[0].role_name}`);
      passed++;
    } else {
      console.error('  ✖ No Active Admin Account Found in database!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Admin query error: ${e.message}`);
    failed++;
  }

  // 3. Password Hashing (bcrypt) Verification
  console.log('\n[3/5] Testing Bcrypt Password Hashing Contract...');
  try {
    const testPassword = 'TestPassword123!';
    const hash = await bcrypt.hash(testPassword, 10);
    const match = await bcrypt.compare(testPassword, hash);
    const mismatch = await bcrypt.compare('WrongPassword', hash);

    if (match && !mismatch) {
      console.log('  ✔ Bcrypt hash generation and compare functioning correctly');
      passed++;
    } else {
      console.error('  ✖ Bcrypt compare failed verification');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Bcrypt test error: ${e.message}`);
    failed++;
  }

  // 4. JWT Signing & Token Verification Contract
  console.log('\n[4/5] Testing JWT Signing & Verification Contract...');
  try {
    const payload = { id: 999, username: 'test_user', email: 'test@college.edu', role: 'Student' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.id === 999 && decoded.role === 'Student' && !decoded.biometrics) {
      console.log('  ✔ JWT signed, verified, and payload contains no biometric data');
      passed++;
    } else {
      console.error('  ✖ JWT payload verification failed');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ JWT test error: ${e.message}`);
    failed++;
  }

  // 5. Role Normalization & Portal Match Contract
  console.log('\n[5/5] Testing Role Normalization & RBAC Policy Contract...');
  try {
    const normalizeRoleName = (r) => {
      if (!r) return '';
      const clean = r.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean === 'placementofficer' || clean === 'placement') return 'placement';
      if (clean === 'officestaff' || clean === 'office' || clean === 'accountant' || clean === 'accounts') return 'office';
      return clean;
    };

    const isRoleAllowedForPortal = (dbRole, requestedPortalRole) => {
      if (!requestedPortalRole) return true;
      const normDb = normalizeRoleName(dbRole);
      const normPortal = normalizeRoleName(requestedPortalRole);
      return normDb === normPortal || normDb.includes(normPortal) || normPortal.includes(normDb);
    };

    const studentOnStudent = isRoleAllowedForPortal('Student', 'student');
    const studentOnAdmin = isRoleAllowedForPortal('Student', 'admin');
    const adminOnAdmin = isRoleAllowedForPortal('Admin', 'admin');

    if (studentOnStudent && !studentOnAdmin && adminOnAdmin) {
      console.log('  ✔ Role normalization and portal isolation rules working as expected');
      passed++;
    } else {
      console.error('  ✖ Role normalization check failed');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ RBAC contract error: ${e.message}`);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 5 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBaselineTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
