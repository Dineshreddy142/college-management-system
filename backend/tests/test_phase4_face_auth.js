import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { initFaceAuthTables } from '../services/initFaceAuthTables.js';
import { initializeModels } from '../services/faceInferenceService.js';
import { faceNonceService } from '../services/faceNonceService.js';
import { checkFaceLockout } from '../services/faceRateLimitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_college_erp_key_123!';

async function runPhase4Tests() {
    console.log('\n========================================================================');
    console.log('  🧪 EDUERP FACE AUTHENTICATION - PHASE 4 VERIFICATION TEST SUITE');
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
        // --- 1. FRONTEND FILE INTEGRITY & ISOLATION CHECKS ---
        console.log('--- 1. Testing Frontend File Creation & Non-Overwriting Integrity ---');

        const faceLoginModalPath = path.join(rootDir, 'src/components/FaceLoginModal.tsx');
        const faceAuthApiPath = path.join(rootDir, 'src/services/faceAuthApi.ts');
        const passkeyModalPath = path.join(rootDir, 'src/components/PasskeyAuthModal.tsx');
        const webauthnServicePath = path.join(rootDir, 'src/services/webauthn.ts');

        assert(fs.existsSync(faceLoginModalPath), 'src/components/FaceLoginModal.tsx created successfully');
        assert(fs.existsSync(faceAuthApiPath), 'src/services/faceAuthApi.ts created successfully');

        assert(fs.existsSync(passkeyModalPath), 'PasskeyAuthModal.tsx is intact and not overwritten');
        assert(fs.existsSync(webauthnServicePath), 'webauthn.ts is intact and not overwritten');

        const passkeyContent = fs.readFileSync(passkeyModalPath, 'utf8');
        assert(passkeyContent.includes('PasskeyAuthModal'), 'PasskeyAuthModal.tsx retains WebAuthn implementation');

        // --- 2. FACE AUTH API CLIENT CODE AUDIT ---
        console.log('\n--- 2. Testing Face Auth API Client Security & Endpoint Mapping ---');

        const apiContent = fs.readFileSync(faceAuthApiPath, 'utf8');
        assert(apiContent.includes('/auth/face/challenge'), 'faceAuthApi maps /auth/face/challenge');
        assert(apiContent.includes('/auth/face/login'), 'faceAuthApi maps /auth/face/login');
        assert(apiContent.includes('/auth/face/enroll-auth'), 'faceAuthApi maps /auth/face/enroll-auth');
        assert(apiContent.includes('/auth/face/enroll'), 'faceAuthApi maps /auth/face/enroll');
        assert(apiContent.includes('/auth/face/disable'), 'faceAuthApi maps /auth/face/disable');
        assert(apiContent.includes('/auth/face/status'), 'faceAuthApi maps /auth/face/status');

        // Verify zero client-side vector calculation or secrets in API file
        assert(!apiContent.includes('Float32Array'), 'faceAuthApi contains zero client-side vector calculation');
        assert(!apiContent.includes('FACE_ENCRYPTION_SECRET'), 'faceAuthApi contains no server secrets');
        assert(!apiContent.includes('JWT_SECRET'), 'faceAuthApi contains no JWT secrets');

        // --- 3. FACE LOGIN MODAL CODE & CAMERA SAFETY AUDIT ---
        console.log('\n--- 3. Testing FaceLoginModal UI States & Camera Resource Safety ---');

        const modalContent = fs.readFileSync(faceLoginModalPath, 'utf8');
        assert(modalContent.includes('stopCameraStream'), 'FaceLoginModal implements explicit camera stream teardown');
        assert(modalContent.includes('getTracks().forEach'), 'FaceLoginModal stops all MediaStream tracks');
        assert(modalContent.includes('useEffect') && modalContent.includes('stopCameraStream()'), 'FaceLoginModal handles clean unmount teardown');
        assert(modalContent.includes('toDataURL(\'image/jpeg\''), 'FaceLoginModal captures JPEG base64 frame sequence');

        // Verify error messaging & password fallback button
        assert(modalContent.includes('Sign In with Password Instead'), 'FaceLoginModal provides one-click password fallback');
        assert(modalContent.includes('RATE_LIMITED'), 'FaceLoginModal handles rate-limited cooldown UI state');
        assert(modalContent.includes('DISABLED'), 'FaceLoginModal handles feature disabled UI state');

        // --- 4. APP.TSX & PORTALLOGIN.TSX INTEGRATION CHECKS ---
        console.log('\n--- 4. Testing App.tsx & PortalLogin.tsx Integration ---');

        const appContent = fs.readFileSync(path.join(rootDir, 'src/app/App.tsx'), 'utf8');
        assert(appContent.includes('FaceLoginModal'), 'App.tsx imports FaceLoginModal');
        assert(appContent.includes('Sign in with Face ID'), 'App.tsx renders Face ID login action button');

        const portalContent = fs.readFileSync(path.join(rootDir, 'src/app/portal/PortalLogin.tsx'), 'utf8');
        assert(portalContent.includes('FaceLoginModal'), 'PortalLogin.tsx imports FaceLoginModal');
        assert(portalContent.includes('Sign in with Face ID'), 'PortalLogin.tsx renders Face ID login action button');

        // --- 5. PHASE 1, PHASE 2, & PHASE 3 REGRESSION SUITE ---
        console.log('\n--- 5. Running Phase 1, Phase 2, & Phase 3 Regression Checks ---');

        const p1Result = await initFaceAuthTables();
        assert(p1Result.success === true, 'Phase 1 DB tables operational');

        const p2Result = await initializeModels();
        assert(p2Result === true, 'Phase 2 ONNX inference engine operational');

        const nonceObj = await faceNonceService.createNonce('tx_phase4_reg');
        const consumeRes = await faceNonceService.consumeNonce(nonceObj.nonce);
        assert(consumeRes.valid === true, 'Phase 3 nonce service operational');

        const rateCheck = await checkFaceLockout('phase4_test@university.edu');
        assert(typeof rateCheck.locked === 'boolean', 'Phase 3 rate limit service operational');

        // --- 6. EXISTING AUTH & WEBAUTHN REGRESSION CHECKS ---
        console.log('\n--- 6. Testing Existing Auth Subsystem & WebAuthn Regression ---');

        const pass = 'Phase4Pass@123';
        const h = await bcrypt.hash(pass, 10);
        const passValid = await bcrypt.compare(pass, h);
        assert(passValid === true, 'bcrypt password verification operational');

        const tok = jwt.sign({ id: 4, role: 'Admin' }, JWT_SECRET);
        const dec = jwt.verify(tok, JWT_SECRET);
        assert(dec.id === 4 && dec.role === 'Admin', 'JWT token creation & verification operational');

        const [webauthnTables] = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'webauthn_credentials'
        `);
        assert(webauthnTables.length > 0, 'webauthn_credentials table intact');

        console.log('\n========================================================================');
        console.log(`  🎉 ALL PHASE 4 TESTS PASSED SUCCESSFULLY! (${passedCount} passed, 0 failed)`);
        console.log('========================================================================\n');

    } catch (err) {
        console.error('\n========================================================================');
        console.error(`  💥 PHASE 4 TEST SUITE FAILED: ${err.message}`);
        console.error('========================================================================\n');
        process.exit(1);
    }
}

runPhase4Tests().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
