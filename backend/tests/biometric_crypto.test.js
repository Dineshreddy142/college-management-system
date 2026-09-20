import crypto from 'crypto';
import { encryptEmbedding, decryptEmbedding } from '../services/nativeBiometrics.js';

/**
 * Phase 3: Biometric Crypto & Authenticated AES-256-GCM Test Suite
 */
async function runCryptoTests() {
  console.log('========================================================================');
  console.log('   PHASE 3: BIOMETRIC AES-256-GCM ENCRYPTION & INTEGRITY TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Roundtrip Encryption & Decryption
  console.log('[1/3] Testing AES-256-GCM Vector Roundtrip...');
  try {
    const originalVector = Array.from({ length: 128 }, (_, i) => Math.sin(i / 10.0));
    const { encryptedEmbedding, iv, authTag, keyVersion, modelVersion } = encryptEmbedding(originalVector);

    const decryptedVector = decryptEmbedding(encryptedEmbedding, iv, authTag, keyVersion, modelVersion);

    let diffMax = 0;
    for (let i = 0; i < originalVector.length; i++) {
      diffMax = Math.max(diffMax, Math.abs(originalVector[i] - decryptedVector[i]));
    }

    if (diffMax < 1e-6 && authTag && authTag.length === 16 && iv.length === 12) {
      console.log('  ✔ 128-D Vector encrypted and decrypted with 100% precision using 16-byte auth tag.');
      passed++;
    } else {
      console.error(`  ✖ Vector precision error: max diff ${diffMax}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Roundtrip error: ${e.message}`);
    failed++;
  }

  // 2. Tampered Auth Tag Rejection Test
  console.log('\n[2/3] Testing Tampered Auth Tag Rejection (GCM Integrity Guard)...');
  try {
    const originalVector = [0.1, 0.2, 0.3, 0.4, 0.5];
    const { encryptedEmbedding, iv, authTag } = encryptEmbedding(originalVector);

    // Corrupt auth tag by corrupting byte 0
    const tamperedTag = Buffer.from(authTag);
    tamperedTag[0] ^= 0xFF;

    let threwError = false;
    try {
      decryptEmbedding(encryptedEmbedding, iv, tamperedTag);
    } catch {
      threwError = true;
    }

    if (threwError) {
      console.log('  ✔ Tampered authentication tag correctly rejected with decryption error.');
      passed++;
    } else {
      console.error('  ✖ Tampered auth tag failed to throw decryption error!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Auth tag test error: ${e.message}`);
    failed++;
  }

  // 3. Unique IV Generation Test
  console.log('\n[3/3] Testing Cryptographically Random IV Uniqueness...');
  try {
    const vec = [0.5, 0.5];
    const enc1 = encryptEmbedding(vec);
    const enc2 = encryptEmbedding(vec);

    if (!enc1.iv.equals(enc2.iv) && !enc1.encryptedEmbedding.equals(enc2.encryptedEmbedding)) {
      console.log('  ✔ Unique IV generated for every encryption pass.');
      passed++;
    } else {
      console.error('  ✖ IV reuse detected!');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ IV test error: ${e.message}`);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 3 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCryptoTests().catch(err => {
  console.error('Fatal Crypto Test Error:', err);
  process.exit(1);
});
