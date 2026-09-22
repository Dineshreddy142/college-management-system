import assert from 'assert';
import jpeg from 'jpeg-js';
import pool from '../db.js';
import {
  parseAndValidateFrames,
  checkLivenessMotion,
  extractFaceEmbedding,
  encryptTemplate,
  decryptTemplate,
  calculateCosineSimilarity
} from '../services/faceAuthService.js';

console.log('=== RUNNING END-TO-END FACE AUTH INTEGRATION SUITE ===');

function generateFaceJpeg(rColor, skinWidth = 100) {
  const w = 320, h = 240;
  const rawData = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dx = (x - 160) / (skinWidth / 2);
      const dy = (y - 120) / 60;
      if (dx * dx + dy * dy <= 1.0) {
        rawData[idx] = rColor;
        rawData[idx+1] = 180;
        rawData[idx+2] = 150;
      } else {
        rawData[idx] = 40;
        rawData[idx+1] = 40;
        rawData[idx+2] = 40;
      }
      rawData[idx+3] = 255;
    }
  }
  const encoded = jpeg.encode({ width: w, height: h, data: rawData }, 80);
  return 'data:image/jpeg;base64,' + encoded.data.toString('base64');
}

(async () => {
  try {
    // 1. Generate frames
    const frameA1 = generateFaceJpeg(220, 100);
    const frameA2 = generateFaceJpeg(222, 100);

    const frameB1 = generateFaceJpeg(140, 70);
    const frameB2 = generateFaceJpeg(142, 70);

    // 2. Test Frame Parsing
    console.log('[E2E TEST 1] Validating Frame Payload Parsing...');
    const parsedA = parseAndValidateFrames([frameA1, frameA2]);
    assert.strictEqual(parsedA.length, 2, 'Parsed 2 frames');
    console.log('  -> PASS: Frame parsing verified.');

    // 3. Test Liveness Check
    console.log('[E2E TEST 2] Validating Temporal Motion Liveness...');
    const livenessA = checkLivenessMotion(parsedA);
    assert.strictEqual(livenessA.isLive, true, 'Liveness should pass');
    console.log(`  -> PASS: Liveness check passed with delta=${livenessA.delta}.`);

    // 4. Test Embedding Extraction
    console.log('[E2E TEST 3] Extracting 512-d ONNX Face Embeddings...');
    const embA1 = await extractFaceEmbedding(parsedA[0].buffer);
    const embA2 = await extractFaceEmbedding(parsedA[1].buffer);
    assert.strictEqual(embA1.length, 512, 'Embedding length is 512');

    const simSelf = calculateCosineSimilarity(embA1, embA2);
    console.log(`  -> Self-similarity score for user frames: ${simSelf.toFixed(4)}`);
    assert.ok(simSelf >= 0.85, 'Same user face frames cosine similarity must be >= 0.85');
    console.log('  -> PASS: Embedding extraction & high self-similarity verified.');

    // 5. Test Different Face / Non-Face Similarity Rejection
    console.log('[E2E TEST 4] Testing Cross-Face & Non-Face Rejection...');
    try {
      const parsedB = parseAndValidateFrames([frameB1, frameB2]);
      const embB1 = await extractFaceEmbedding(parsedB[0].buffer);
      const simDiff = calculateCosineSimilarity(embA1, embB1);
      console.log(`  -> Cross-face similarity score: ${simDiff.toFixed(4)}`);
      assert.ok(simDiff < 0.85, 'Different face frames cosine similarity must be < 0.85');
    } catch (e) {
      assert.strictEqual(e.code, 'FACE_NOT_DETECTED', 'Non-face / invalid face correctly rejected');
      console.log('  -> PASS: Non-face camera frame correctly rejected with code FACE_NOT_DETECTED.');
    }

    // 6. Test DB Nonce and Biometric Storage
    console.log('[E2E TEST 5] Testing Database Persistence against TiDB Cloud...');
    const [users] = await pool.execute('SELECT id, username FROM users LIMIT 1');
    assert.ok(users.length > 0, 'Test user should exist in DB');
    const testUserId = users[0].id;

    const enc = encryptTemplate(embA1);
    await pool.execute(
      `INSERT INTO face_biometrics (user_id, encrypted_template, iv, auth_tag, algorithm)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE encrypted_template = ?, iv = ?, auth_tag = ?, algorithm = ?`,
      [testUserId, enc.encrypted_template, enc.iv, enc.auth_tag, enc.algorithm,
       enc.encrypted_template, enc.iv, enc.auth_tag, enc.algorithm]
    );

    const [bioRows] = await pool.execute('SELECT * FROM face_biometrics WHERE user_id = ?', [testUserId]);
    assert.strictEqual(bioRows.length, 1, 'Biometrics record stored');
    const dec = decryptTemplate(bioRows[0].encrypted_template, bioRows[0].iv, bioRows[0].auth_tag);
    assert.strictEqual(dec.length, 512, 'Decrypted embedding length is 512');
    const simDB = calculateCosineSimilarity(embA1, dec);
    assert.ok(simDB > 0.999, 'Decrypted template matches original embedding');
    console.log('  -> PASS: TiDB Cloud encryption, storage & decryption verified.');

    console.log('=== ALL E2E FACE AUTH INTEGRATION TESTS PASSED ===');
    process.exit(0);
  } catch (err) {
    console.error('E2E TEST FAILURE:', err);
    process.exit(1);
  }
})();
