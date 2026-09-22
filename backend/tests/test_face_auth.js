import assert from 'assert';
import crypto from 'crypto';
import {
  encryptTemplate,
  decryptTemplate,
  calculateCosineSimilarity,
  checkLivenessMotion,
  parseAndValidateFrames
} from '../services/faceAuthService.js';

console.log('=== RUNNING FACE AUTHENTICATION SYSTEM TESTS ===');

// Test 1: AES-256-GCM Template Encryption & Decryption
(() => {
  console.log('[TEST 1] Testing AES-256-GCM Encryption and Decryption...');
  const originalEmbedding = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    originalEmbedding[i] = (i % 100) / 100.0 - 0.5;
  }

  const encrypted = encryptTemplate(Array.from(originalEmbedding));
  assert.ok(encrypted.encrypted_template, 'Encrypted template should exist');
  assert.ok(encrypted.iv, 'IV should exist');
  assert.ok(encrypted.auth_tag, 'Auth tag should exist');

  const decrypted = decryptTemplate(encrypted.encrypted_template, encrypted.iv, encrypted.auth_tag);
  assert.strictEqual(decrypted.length, 512, 'Decrypted vector must be 512-dimensional');

  for (let i = 0; i < 512; i++) {
    assert.ok(Math.abs(decrypted[i] - originalEmbedding[i]) < 0.0001, `Index ${i} matching precision`);
  }
  console.log('  -> PASS: AES-256-GCM encryption & decryption verified.');
})();

// Test 2: Cosine Similarity Vector Calculation
(() => {
  console.log('[TEST 2] Testing Cosine Similarity Calculation...');
  const vecA = new Array(512).fill(0.1);
  const vecB = new Array(512).fill(0.1);
  const vecC = new Array(512).fill(-0.1);

  const simIdentical = calculateCosineSimilarity(vecA, vecB);
  assert.ok(Math.abs(simIdentical - 1.0) < 0.001, 'Identical vectors cosine similarity should be 1.0');

  const simOpposite = calculateCosineSimilarity(vecA, vecC);
  assert.ok(Math.abs(simOpposite - (-1.0)) < 0.001, 'Opposite vectors cosine similarity should be -1.0');
  console.log('  -> PASS: Cosine similarity vector logic verified.');
})();

// Test 3: Motion Liveness Detection
(() => {
  console.log('[TEST 3] Testing Temporal Motion Liveness Check...');
  const dummyBuf1 = Buffer.alloc(1000, 100);
  const dummyBuf2 = Buffer.alloc(1000, 105);

  const frames = [
    { index: 0, buffer: dummyBuf1, size: 1000 },
    { index: 1, buffer: dummyBuf2, size: 1000 }
  ];

  const liveness = checkLivenessMotion(frames);
  assert.strictEqual(liveness.isLive, true, 'Liveness motion check should pass for moderate frame delta');
  assert.ok(liveness.delta >= 0.5 && liveness.delta <= 300.0, 'Liveness delta should be in acceptable range');
  console.log(`  -> PASS: Motion liveness check passed with delta = ${liveness.delta}.`);
})();

// Test 4: Payload Boundary & Frame Size Validation
(() => {
  console.log('[TEST 4] Testing Frame Payload Size & Limit Validation...');
  const validBase64 = Buffer.alloc(500, 'a').toString('base64');
  const parsed = parseAndValidateFrames([validBase64, validBase64]);
  assert.strictEqual(parsed.length, 2, 'Parsed 2 frames successfully');

  // Test > 5 frames rejection
  assert.throws(() => {
    parseAndValidateFrames([validBase64, validBase64, validBase64, validBase64, validBase64, validBase64]);
  }, /Maximum 5 frames allowed/, 'Should reject requests with > 5 frames');

  console.log('  -> PASS: Payload boundary and frame limit validation verified.');
})();

console.log('=== ALL FACE AUTHENTICATION BACKEND TESTS PASSED ===');
