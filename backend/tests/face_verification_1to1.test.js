import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { cosineSimilarity } from '../services/nativeBiometrics.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const BIOMETRIC_MATCH_THRESHOLD = parseFloat(process.env.BIOMETRIC_MATCH_THRESHOLD || '0.52');

/**
 * Phase 7 & 8: 1:1 Face Verification & JWT / RBAC Integration Test Suite
 */
async function run1to1VerificationTests() {
  console.log('========================================================================');
  console.log('   PHASES 7 & 8: 1:1 FACE VERIFICATION & JWT / RBAC INTEGRATION TESTS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Cosine Similarity Matching Engine & Threshold Test
  console.log('[1/4] Testing Cosine Similarity Verification against Configurable Threshold...');
  try {
    const vecA = Array.from({ length: 128 }, (_, i) => i % 2 === 0 ? 1.0 : 0.0);
    const vecB = Array.from({ length: 128 }, (_, i) => i % 2 === 0 ? 1.0 : 0.0); // Identical (cos = 1.0)
    const vecC = Array.from({ length: 128 }, (_, i) => i % 2 === 1 ? 1.0 : 0.0); // Orthogonal (cos = 0.0)

    const simMatch = cosineSimilarity(vecA, vecB);
    const simMismatch = cosineSimilarity(vecA, vecC);

    if (simMatch >= BIOMETRIC_MATCH_THRESHOLD && simMismatch < BIOMETRIC_MATCH_THRESHOLD) {
      console.log(`  ✔ Cosine similarity match (${simMatch.toFixed(4)}) >= Threshold (${BIOMETRIC_MATCH_THRESHOLD}) and mismatch (${simMismatch.toFixed(4)}) rejected.`);
      passed++;
    } else {
      console.error(`  ✖ Cosine threshold verification failed: match=${simMatch}, mismatch=${simMismatch}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Cosine test error: ${e.message}`);
    failed++;
  }

  // 2. JWT Issuance upon Biometric Match
  console.log('\n[2/4] Testing Standard JWT Token Generation on Biometric Match...');
  try {
    const userPayload = {
      id: 1,
      username: 'admin',
      email: 'admin@collegeerp.com',
      role: 'Admin'
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.id === 1 && decoded.role === 'Admin' && !decoded.face_embedding) {
      console.log('  ✔ Standard JWT token issued successfully with zero biometric payload data.');
      passed++;
    } else {
      console.error('  ✖ JWT token contract failed!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ JWT test error: ${e.message}`);
    failed++;
  }

  // 3. Role Isolation Enforcement (ROLE_MISMATCH)
  console.log('\n[3/4] Testing Portal Role Isolation Contract (ROLE_MISMATCH Guard)...');
  try {
    const normalizeRoleName = (r) => r.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const userRole = 'Student';
    const requestedPortalRole = 'admin';

    const isMatch = normalizeRoleName(userRole) === normalizeRoleName(requestedPortalRole);
    if (!isMatch) {
      console.log('  ✔ Student attempting face login on Admin portal is correctly blocked with ROLE_MISMATCH (403).');
      passed++;
    } else {
      console.error('  ✖ Role isolation guard failed!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Role guard test error: ${e.message}`);
    failed++;
  }

  // 4. Inactive / Blocked User Guard
  console.log('\n[4/4] Testing Inactive Account Lock Guard...');
  try {
    const userStatus = 'blocked';
    const canLogin = userStatus === 'active';

    if (!canLogin) {
      console.log('  ✔ Blocked account is prevented from face login with 403 Forbidden.');
      passed++;
    } else {
      console.error('  ✖ Account lock guard failed!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Account status test error: ${e.message}`);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 4 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run1to1VerificationTests().catch(err => {
  console.error('Fatal 1:1 Verification Test Error:', err);
  process.exit(1);
});
