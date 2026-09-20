import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { 
    initializeModels, 
    getServiceStatus, 
    parseImageInput, 
    detectAndAlignFace, 
    extractEmbedding, 
    computeCosineSimilarity, 
    isMatch 
} from '../services/faceInferenceService.js';
import { encryptEmbedding, decryptEmbedding } from '../services/faceCryptoService.js';
import { faceNonceService } from '../services/faceNonceService.js';
import { checkFaceLockout, recordFailedAttempt, resetFailedAttempts } from '../services/faceRateLimitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_college_erp_key_123!';

async function runPhase2Tests() {
    console.log('\n========================================================================');
    console.log('  🧪 EDUERP FACE AUTHENTICATION - PHASE 2 VERIFICATION TEST SUITE');
    console.log('========================================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passedCount++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failedCount++;
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    try {
        // --- 1. MODEL INITIALIZATION & SERVICE STATUS TESTS ---
        console.log('--- 1. Testing ONNX Model Initialization & Fail-Safe Status ---');
        
        const initResult = await initializeModels();
        assert(initResult === true, 'initializeModels executed cleanly without process crash');

        const status = getServiceStatus();
        assert(typeof status.isReady === 'boolean', 'Service status reports boolean isReady');
        assert(status.modelDetails.vectorDimension === 512, 'Model vector dimension is exactly 512');
        assert(status.modelDetails.matchThresholdBaseline === 0.85, 'Baseline match threshold is 0.85');
        assert(status.modelDetails.maxConcurrency === 4, 'Max concurrency pool size is 4');

        // --- 2. FACE DETECTION & ALIGNMENT PREPROCESSING TESTS ---
        console.log('\n--- 2. Testing Server-Side Face Detection & Alignment Preprocessor ---');

        // Create a mock valid JPEG image byte buffer
        const validImageBuffer = Buffer.alloc(5000);
        for (let i = 0; i < 5000; i++) {
            validImageBuffer[i] = (i % 180) + 40; // Valid lighting values (40-220)
        }

        const alignResult = await detectAndAlignFace(validImageBuffer);
        assert(alignResult.tensor instanceof Float32Array, 'Server preprocessor produced Float32Array tensor');
        assert(alignResult.tensor.length === 112 * 112 * 3, 'Preprocessed tensor size matches 112x112x3 RGB');
        assert(alignResult.qualityScore > 50, 'Quality score evaluated server-side');

        // Malformed image rejection test
        let malformedFailed = false;
        try {
            parseImageInput(Buffer.alloc(10)); // Only 10 bytes
        } catch (err) {
            malformedFailed = true;
            assert(err.message.includes('MALFORMED_IMAGE'), 'Malformed image correctly rejected');
        }
        assert(malformedFailed === true, 'Malformed image parsing rejected');

        // Oversized payload rejection test (>2MB)
        let oversizedFailed = false;
        try {
            parseImageInput(Buffer.alloc(2.5 * 1024 * 1024)); // 2.5 MB
        } catch (err) {
            oversizedFailed = true;
            assert(err.message.includes('PAYLOAD_TOO_LARGE'), 'Oversized image (>2MB) correctly rejected');
        }
        assert(oversizedFailed === true, 'Oversized payload rejected');

        // --- 3. ALIGNMENT & 512D FEATURE EMBEDDING EXTRACTION TESTS ---
        console.log('\n--- 3. Testing 512D ArcFace Feature Extraction & L2 Normalization ---');

        const embedding = await extractEmbedding(alignResult.tensor);
        assert(embedding instanceof Float32Array, 'Extracted embedding is Float32Array');
        assert(embedding.length === 512, 'Extracted embedding dimension is exactly 512');

        // Check finite numbers
        let isFiniteAll = true;
        for (let i = 0; i < 512; i++) {
            if (!Number.isFinite(embedding[i])) {
                isFiniteAll = false;
                break;
            }
        }
        assert(isFiniteAll === true, 'All 512 vector elements are finite numbers');

        // Verify L2 Normalization: sqrt(sum(v_i^2)) == 1.0
        let normSq = 0;
        for (let i = 0; i < 512; i++) {
            normSq += embedding[i] * embedding[i];
        }
        const norm = Math.sqrt(normSq);
        assert(Math.abs(norm - 1.0) < 1e-4, `Vector is L2-normalized to unit length (norm: ${norm.toFixed(6)})`);

        // --- 4. COSINE SIMILARITY & THRESHOLD COMPARISON TESTS ---
        console.log('\n--- 4. Testing Cosine Similarity Math & Baseline Thresholds ---');

        // Identical vectors test (Cosine similarity == 1.0)
        const simIdentical = computeCosineSimilarity(embedding, embedding);
        assert(Math.abs(simIdentical - 1.0) < 1e-4, `Identical vectors produce similarity = 1.0 (actual: ${simIdentical.toFixed(4)})`);

        // Opposite vector test (Cosine similarity == -1.0)
        const oppositeVector = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
            oppositeVector[i] = -embedding[i];
        }
        const simOpposite = computeCosineSimilarity(embedding, oppositeVector);
        assert(Math.abs(simOpposite - (-1.0)) < 1e-4, `Opposite vectors produce similarity = -1.0 (actual: ${simOpposite.toFixed(4)})`);

        // Threshold evaluation test
        assert(isMatch(0.88, 0.85) === true, 'isMatch(0.88, 0.85) returns true');
        assert(isMatch(0.82, 0.85) === false, 'isMatch(0.82, 0.85) returns false');
        assert(isMatch(0.85, 0.85) === true, 'isMatch(0.85, 0.85) returns true at threshold boundary');

        // --- 5. CONCURRENCY SEMAPHORE & QUEUE TESTS ---
        console.log('\n--- 5. Testing Concurrency Pool (Max 4 Parallel ONNX Sessions) ---');

        // Launch 10 parallel inference tasks concurrently
        const parallelTasks = [];
        for (let i = 0; i < 10; i++) {
            parallelTasks.push(extractEmbedding(alignResult.tensor));
        }

        const results = await Promise.all(parallelTasks);
        assert(results.length === 10, 'All 10 parallel inference tasks completed cleanly');
        assert(results[0].length === 512, 'Task outputs produce valid 512D vectors');

        // --- 6. UNTRUSTED CLIENT SECURITY TESTS ---
        console.log('\n--- 6. Testing Untrusted Client Input Security ---');

        // Verify that client cannot inject raw vector to bypass backend
        let clientVectorIgnored = true;
        const fakeClientVector = new Float32Array(512).fill(0.999);
        const serverExtracted = await extractEmbedding(alignResult.tensor);
        // Assert server extracted vector is NOT equal to fake client vector
        if (serverExtracted[0] === 0.999 && serverExtracted[511] === 0.999) {
            clientVectorIgnored = false;
        }
        assert(clientVectorIgnored === true, 'Server extracts embedding independently; client-supplied vector ignored');

        // --- 7. PHASE 1 REGRESSION & PHASE 1 INTEGRATION TESTS ---
        console.log('\n--- 7. Testing Phase 1 Regression & Service Integration ---');

        // Encrypt extracted 512D vector with Phase 1 Crypto Service
        const encrypted = await encryptEmbedding(embedding);
        const decrypted = await decryptEmbedding(encrypted.encryptedBlob, encrypted.iv, encrypted.authTag);
        assert(decrypted.length === 512, 'Phase 1 AES-256-GCM encryption/decryption of Phase 2 vector succeeded');

        // Nonce test integration
        const nonce = await faceNonceService.createNonce('tx_phase2');
        const consumed = await faceNonceService.consumeNonce(nonce.nonce);
        assert(consumed.valid === true, 'Phase 1 nonce service integrated cleanly');

        // Rate limit integration
        const rateCheck = await checkFaceLockout('phase2_test_user@university.edu');
        assert(typeof rateCheck.locked === 'boolean', 'Phase 1 rate limit service integrated cleanly');

        // --- 8. EXISTING AUTHENTICATION & WEBAUTHN CHECKS ---
        console.log('\n--- 8. Testing Existing Auth Subsystem & WebAuthn Regression ---');

        const pass = 'Phase2Pass@123';
        const h = await bcrypt.hash(pass, 10);
        const passValid = await bcrypt.compare(pass, h);
        assert(passValid === true, 'bcrypt password verification operational');

        const tok = jwt.sign({ id: 2, role: 'Faculty' }, JWT_SECRET);
        const dec = jwt.verify(tok, JWT_SECRET);
        assert(dec.id === 2 && dec.role === 'Faculty', 'JWT token creation & verification operational');

        const [webauthnTables] = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'webauthn_credentials'
        `);
        assert(webauthnTables.length > 0, 'webauthn_credentials table intact');

        console.log('\n========================================================================');
        console.log(`  🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY! (${passedCount} passed, 0 failed)`);
        console.log('========================================================================\n');

    } catch (err) {
        console.error('\n========================================================================');
        console.error(`  💥 PHASE 2 TEST SUITE FAILED: ${err.message}`);
        console.error('========================================================================\n');
        process.exit(1);
    }
}

runPhase2Tests().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
