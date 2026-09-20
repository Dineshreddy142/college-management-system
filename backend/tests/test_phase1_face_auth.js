import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { initFaceAuthTables } from '../services/initFaceAuthTables.js';
import { encryptEmbedding, decryptEmbedding } from '../services/faceCryptoService.js';
import { faceNonceService, InMemoryNonceStore } from '../services/faceNonceService.js';
import { checkFaceLockout, recordFailedAttempt, resetFailedAttempts } from '../services/faceRateLimitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_college_erp_key_123!';

async function runPhase1Tests() {
    console.log('\n========================================================================');
    console.log('  🧪 EDUERP FACE AUTHENTICATION - PHASE 1 VERIFICATION TEST SUITE');
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
        // --- 1. MIGRATION & TABLE VERIFICATION TESTS ---
        console.log('--- 1. Testing Database Schema & Migration Repeatability ---');
        
        // Initial execution
        const initResult1 = await initFaceAuthTables();
        assert(initResult1.success === true, 'initFaceAuthTables executed successfully');

        // Verify table existence in MySQL
        const [tables] = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
              AND table_name IN ('user_face_biometrics', 'face_audit_logs', 'face_failed_attempts')
        `);
        const foundTableNames = tables.map(t => t.table_name || t.TABLE_NAME);
        assert(foundTableNames.includes('user_face_biometrics'), 'user_face_biometrics table exists');
        assert(foundTableNames.includes('face_audit_logs'), 'face_audit_logs table exists');
        assert(foundTableNames.includes('face_failed_attempts'), 'face_failed_attempts table exists');

        // Repeatable execution test
        const initResult2 = await initFaceAuthTables();
        assert(initResult2.success === true, 'Migration is safely repeatable (idempotent execution)');

        // --- 2. AES-256-GCM CRYPTO SERVICE TESTS ---
        console.log('\n--- 2. Testing AES-256-GCM Biometric Vector Crypto Service ---');
        
        // Generate mock 512D float array
        const originalVector = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
            originalVector[i] = (i * 0.001953125) - 0.5; // Values between -0.5 and +0.5
        }

        // Encrypt vector
        const encrypted = await encryptEmbedding(originalVector);
        assert(encrypted.encryptedBlob instanceof Buffer, 'Encrypted output contains binary BLOB');
        assert(typeof encrypted.iv === 'string' && encrypted.iv.length === 24, 'IV is 24-character hex string (12 bytes)');
        assert(typeof encrypted.authTag === 'string' && encrypted.authTag.length === 32, 'Auth Tag is 32-character hex string (16 bytes)');

        // Decrypt vector
        const decrypted = await decryptEmbedding(encrypted.encryptedBlob, encrypted.iv, encrypted.authTag);
        assert(decrypted instanceof Float32Array, 'Decrypted payload is Float32Array');
        assert(decrypted.length === 512, 'Decrypted vector dimension is exactly 512');

        // Check fidelity of all 512 float values
        let maxDelta = 0;
        for (let i = 0; i < 512; i++) {
            const delta = Math.abs(originalVector[i] - decrypted[i]);
            if (delta > maxDelta) maxDelta = delta;
        }
        assert(maxDelta < 1e-6, `Decrypted 512D floats match original with exact fidelity (max delta: ${maxDelta})`);

        // Auth Tag Tampering Rejection Test
        let tamperedTag = encrypted.authTag;
        const lastChar = tamperedTag[tamperedTag.length - 1];
        const newChar = lastChar === '0' ? '1' : '0';
        tamperedTag = tamperedTag.substring(0, tamperedTag.length - 1) + newChar;

        let tagCheckFailed = false;
        try {
            await decryptEmbedding(encrypted.encryptedBlob, encrypted.iv, tamperedTag);
        } catch (err) {
            tagCheckFailed = true;
            assert(err.message.includes('Authentication tag validation failed'), 'Tampered Auth Tag correctly rejected');
        }
        assert(tagCheckFailed === true, 'Decryption rejected tampered auth tag');

        // Invalid dimension rejection test
        let dimCheckFailed = false;
        try {
            await encryptEmbedding(new Float32Array(10));
        } catch (err) {
            dimCheckFailed = true;
            assert(err.message.includes('Expected 512 floats'), 'Invalid vector dimension correctly rejected');
        }
        assert(dimCheckFailed === true, 'Encryption rejected invalid vector dimension');

        // --- 3. CRYPTOGRAPHIC NONCE SERVICE TESTS ---
        console.log('\n--- 3. Testing Single-Use Cryptographic Nonce Service ---');

        const nonceObj = await faceNonceService.createNonce('tx_test_123', 'FACE_LOGIN', { test: true });
        assert(typeof nonceObj.nonce === 'string' && nonceObj.nonce.length === 64, 'Nonce is 64-character hex string (256 bits)');
        assert(nonceObj.transactionId === 'tx_test_123', 'Transaction ID correctly associated');

        // Consume nonce first time
        const consume1 = await faceNonceService.consumeNonce(nonceObj.nonce);
        assert(consume1.valid === true, 'First nonce consumption succeeded');
        assert(consume1.transactionId === 'tx_test_123', 'Transaction ID returned upon consumption');

        // Attempt replay (consuming same nonce second time)
        const consume2 = await faceNonceService.consumeNonce(nonceObj.nonce);
        assert(consume2.valid === false, 'Replay attempt correctly rejected');
        assert(consume2.reason === 'NONCE_NOT_FOUND', 'Reason correctly reported as NONCE_NOT_FOUND after single-use purge');

        // Expiration Test
        const shortStore = new InMemoryNonceStore(50); // 50ms TTL
        const shortNonce = await shortStore.createNonce('tx_short');
        await new Promise(r => setTimeout(r, 100)); // Wait 100ms
        const expireConsume = await shortStore.consumeNonce(shortNonce.nonce);
        assert(expireConsume.valid === false, 'Expired nonce correctly rejected');
        assert(expireConsume.reason === 'NONCE_EXPIRED', 'Reason correctly reported as NONCE_EXPIRED');
        shortStore.destroy();

        // --- 4. DECOUPLED RATE LIMIT SERVICE TESTS ---
        console.log('\n--- 4. Testing Decoupled Face Rate Limiting Service ---');

        const testId = 'test_rate_limit_user@university.edu.in';
        
        // Clean up test identifier
        await pool.execute('DELETE FROM face_failed_attempts WHERE LOWER(identifier) = ?', [testId]);

        // Record 4 failed attempts
        for (let i = 1; i <= 4; i++) {
            const res = await recordFailedAttempt(testId, '127.0.0.1', 'TEST_FAIL');
            assert(res.failedCount === i, `Failed attempt ${i} recorded`);
            assert(res.locked === false, `Not locked at attempt ${i}`);
        }

        // 5th failed attempt triggers lockout
        const res5 = await recordFailedAttempt(testId, '127.0.0.1', 'TEST_FAIL');
        assert(res5.failedCount === 5, '5th failed attempt recorded');
        assert(res5.locked === true, '15-minute face lockout triggered on 5th failure');

        // Check lockout status
        const lockStatus = await checkFaceLockout(testId);
        assert(lockStatus.locked === true, 'checkFaceLockout reports active lockout');
        assert(lockStatus.remainingSeconds > 0 && lockStatus.remainingSeconds <= 900, 'Remaining seconds accurate (<= 15 mins)');

        // Verify users table is completely unaffected
        const [users] = await pool.query('SELECT status FROM users WHERE email = ?', ['dineshreddy@university.edu.in']);
        if (users.length > 0) {
            assert(users[0].status === 'active', 'Existing user account status in users table remains ACTIVE');
        }

        // Unauthorized reset attempt without password authentication
        let unauthResetFailed = false;
        try {
            await resetFailedAttempts(testId, false);
        } catch (err) {
            unauthResetFailed = true;
            assert(err.message.includes('Resetting face cooldown requires verified password authentication'), 'Unauthorized reset correctly blocked');
        }
        assert(unauthResetFailed === true, 'Resetting rate limit rejected without password authentication');

        // Authorized reset with password authentication
        const resetRes = await resetFailedAttempts(testId, true);
        assert(resetRes.success === true, 'Authorized reset cleared face lockout');
        
        const checkAfterReset = await checkFaceLockout(testId);
        assert(checkAfterReset.locked === false, 'Face lockout verified cleared after password authentication');

        // --- 5. EXISTING AUTH & WEBAUTHN REGRESSION CHECKS ---
        console.log('\n--- 5. Testing Existing Auth Subsystem Compatibility ---');

        // Test bcrypt password hashing & verification
        const rawPassword = 'TestPassword@123';
        const hash = await bcrypt.hash(rawPassword, 10);
        const isValidPassword = await bcrypt.compare(rawPassword, hash);
        assert(isValidPassword === true, 'bcrypt password verification operational');

        // Test JWT signing & verification
        const mockPayload = { id: 1, role: 'Admin', email: 'admin@collegeerp.com' };
        const token = jwt.sign(mockPayload, JWT_SECRET, { expiresIn: '24h' });
        const decoded = jwt.verify(token, JWT_SECRET);
        assert(decoded.id === 1 && decoded.role === 'Admin', 'JWT token creation & verification operational');

        // Test webauthn_credentials table existence
        const [webauthnTables] = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'webauthn_credentials'
        `);
        assert(webauthnTables.length > 0, 'webauthn_credentials table intact');

        console.log('\n========================================================================');
        console.log(`  🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY! (${passedCount} passed, 0 failed)`);
        console.log('========================================================================\n');

    } catch (err) {
        console.error('\n========================================================================');
        console.error(`  💥 PHASE 1 TEST SUITE FAILED: ${err.message}`);
        console.error('========================================================================\n');
        process.exit(1);
    }
}

runPhase1Tests().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
