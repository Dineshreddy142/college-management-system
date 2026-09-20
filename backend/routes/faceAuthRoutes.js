import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { authenticateToken } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { faceCryptoService } from '../services/faceCryptoService.js';
import { faceNonceService } from '../services/faceNonceService.js';
import { faceRateLimitService } from '../services/faceRateLimitService.js';
import { faceInferenceService } from '../services/faceInferenceService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FACE_MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.85');
const FACE_UNIQUENESS_THRESHOLD = parseFloat(process.env.FACE_UNIQUENESS_THRESHOLD || '0.90');

// Single-use enrollment tokens store (5-minute TTL)
const enrollmentTokenStore = new Map(); // token -> { userId, expiresAt }

/**
 * Feature Flag Interceptor Middleware
 * Fails closed with 503 if FACE_AUTH_ENABLED === 'false'
 */
const checkFeatureFlag = (req, res, next) => {
    if (process.env.FACE_AUTH_ENABLED === 'false') {
        return errorResponse(res, 'Biometric face authentication is currently disabled.', [], 503, { code: 'FEATURE_DISABLED' });
    }
    next();
};

router.use(checkFeatureFlag);

/**
 * GET /api/auth/face/challenge
 * Issues a cryptographically random single-use 15s challenge nonce.
 */
router.get('/challenge', async (req, res) => {
    try {
        const { transactionId } = req.query;
        const actions = ['BLINK_TWICE', 'TURN_HEAD_RIGHT', 'TURN_HEAD_LEFT', 'SMILE'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        const nonceObj = await faceNonceService.createNonce(transactionId, 'FACE_LOGIN', {
            ip: req.ip || '127.0.0.1',
            action: randomAction
        });

        return successResponse(res, 'Challenge nonce issued successfully', {
            nonce: nonceObj.nonce,
            transactionId: nonceObj.transactionId,
            challengeAction: randomAction,
            expiresAt: nonceObj.expiresAt,
            ttlMs: nonceObj.ttlMs
        });
    } catch (error) {
        console.error('[FACE ROUTE ERROR] Challenge generation failed:', error.message);
        return errorResponse(res, 'Failed to generate challenge nonce', [error.message], 500);
    }
});

/**
 * POST /api/auth/face/login
 * 1:1 Face Authentication Endpoint
 */
router.post('/login', async (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    try {
        const { identifier, transactionId, nonce, frames } = req.body;
        const loginIdentifier = (identifier || '').trim().toLowerCase();

        // 1. Validate request payload structure
        if (!loginIdentifier || !nonce || !frames) {
            return errorResponse(res, 'Identifier, single-use nonce, and camera frames are required', [], 400);
        }

        if (!Array.isArray(frames) || frames.length === 0 || frames.length > 5) {
            return errorResponse(res, 'Frames payload must be an array of 1 to 5 image frames', [], 400);
        }

        // Validate payload total size limit (Max 2MB)
        let totalBytes = 0;
        for (const frame of frames) {
            const frameLen = typeof frame === 'string' ? frame.length : (frame.byteLength || 0);
            if (frameLen > 300 * 1024 * 1.35) { // ~300KB base64 check
                return errorResponse(res, 'Individual image frame exceeds maximum 300KB limit', [], 413, { code: 'FRAME_TOO_LARGE' });
            }
            totalBytes += frameLen;
        }

        if (totalBytes > 2 * 1024 * 1024 * 1.35) { // ~2MB base64 check
            return errorResponse(res, 'Total request payload exceeds maximum 2MB limit', [], 413, { code: 'PAYLOAD_TOO_LARGE' });
        }

        // 2. Check face rate-limiting cooldown before expensive inference
        const rateCheck = await faceRateLimitService.checkFaceLockout(loginIdentifier);
        if (rateCheck.locked) {
            return errorResponse(res, 'Face authentication temporarily locked due to multiple failed attempts. Please sign in using password.', [], 429, {
                code: 'RATE_LIMITED',
                remainingSeconds: rateCheck.remainingSeconds,
                lockoutUntil: rateCheck.lockoutUntil
            });
        }

        // 3. Atomically validate and consume single-use challenge nonce (Replay Protection)
        const nonceConsume = await faceNonceService.consumeNonce(nonce);
        if (!nonceConsume.valid) {
            return errorResponse(res, 'Invalid, expired, or replayed challenge nonce. Please request a new challenge.', [], 400, {
                code: nonceConsume.reason || 'INVALID_NONCE'
            });
        }

        // 4. Resolve target user account by identifier (email, username, roll number, employee ID)
        let [rows] = await pool.execute(
            `SELECT u.*, r.name as role_name
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE LOWER(u.email) = ? OR LOWER(u.username) = ?`,
            [loginIdentifier, loginIdentifier]
        );

        if (rows.length === 0) {
            // Check student roll_number / admission_number or faculty employee_id
            try {
                const [studentRows] = await pool.execute(
                    `SELECT u.*, r.name as role_name
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     JOIN roles r ON u.role_id = r.id
                     WHERE LOWER(s.roll_number) = ? OR LOWER(s.admission_number) = ?`,
                    [loginIdentifier, loginIdentifier]
                );
                if (studentRows.length > 0) {
                    rows = studentRows;
                } else {
                    const [facultyRows] = await pool.execute(
                        `SELECT u.*, r.name as role_name
                         FROM faculty f
                         JOIN users u ON f.user_id = u.id
                         JOIN roles r ON u.role_id = r.id
                         WHERE LOWER(f.employee_id) = ?`,
                        [loginIdentifier]
                    );
                    if (facultyRows.length > 0) rows = facultyRows;
                }
            } catch (auxErr) {
                console.warn('[FACE LOGIN] Auxiliary lookup note:', auxErr.message);
            }
        }

        if (rows.length === 0) {
            await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, 'USER_NOT_FOUND');
            return errorResponse(res, 'Biometric verification failed. Please check identifier or use password login.', [], 401);
        }

        const user = rows[0];

        if (user.status !== 'active') {
            return errorResponse(res, 'Your account is disabled or locked. Please contact administrator.', [], 403);
        }

        // 5. Retrieve enrolled biometric template for target user
        const [bioRows] = await pool.execute(
            'SELECT encrypted_embedding, iv, auth_tag, algorithm_version FROM user_face_biometrics WHERE user_id = ? AND status = "active"',
            [user.id]
        );

        if (bioRows.length === 0) {
            await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, 'NO_ENROLLED_TEMPLATE');
            return errorResponse(res, 'Biometric verification failed. Please check identifier or use password login.', [], 401);
        }

        const templateRecord = bioRows[0];

        // 6. Perform server-side liveness validation & ONNX feature extraction from candidate frame sequence
        let candidateVector;
        try {
            if (frames.length > 1) {
                const livenessResult = await faceInferenceService.validateServerLiveness(frames, nonceConsume.metadata?.action);
                if (!livenessResult.passed) {
                    await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, livenessResult.reason);
                    return errorResponse(res, 'Biometric verification failed. Server liveness check failed.', [], 401, { code: 'LIVENESS_FAILED' });
                }
            }
            const aligned = await faceInferenceService.detectAndAlignFace(frames[0]);
            candidateVector = await faceInferenceService.extractEmbedding(aligned.tensor);
        } catch (inferenceErr) {
            await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, inferenceErr.message);
            return errorResponse(res, 'Biometric verification failed. Please position face clearly and try again.', [], 401);
        }

        // 7. Decrypt target user's enrolled 512D vector using faceCryptoService
        let enrolledVector;
        try {
            enrolledVector = await faceCryptoService.decryptEmbedding(
                templateRecord.encrypted_embedding,
                templateRecord.iv,
                templateRecord.auth_tag
            );
        } catch (decryptErr) {
            console.error('[FACE LOGIN ERROR] Template decryption failure:', decryptErr.message);
            await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, 'TEMPLATE_DECRYPTION_FAILED');
            return errorResponse(res, 'Biometric verification failed. Internal security error.', [], 500);
        }

        // 8. Compute Cosine Similarity between candidate vector and target enrolled vector
        const similarityScore = faceInferenceService.computeCosineSimilarity(candidateVector, enrolledVector);
        const isMatch = similarityScore >= FACE_MATCH_THRESHOLD;

        if (!isMatch) {
            await faceRateLimitService.recordFailedAttempt(loginIdentifier, clientIp, `LOW_SIMILARITY_${similarityScore.toFixed(3)}`);
            await pool.execute(
                'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address, failure_reason) VALUES (?, ?, ?, ?, ?)',
                [user.id, loginIdentifier, 'FACE_LOGIN_FAILURE', clientIp, 'Similarity below threshold']
            );
            return errorResponse(res, 'Biometric verification failed. Please check identifier or use password login.', [], 401);
        }

        // 9. Match Success: Clear face rate limit counter and issue standard session JWT
        await faceRateLimitService.resetFailedAttempts(loginIdentifier, true);

        const token = jwt.sign(
            { id: user.id, role: user.role_name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Audit Log Success
        await pool.execute(
            'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address) VALUES (?, ?, ?, ?)',
            [user.id, user.email, 'FACE_LOGIN_SUCCESS', clientIp]
        );

        try {
            await pool.execute('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)', [
                user.id,
                'FACE_LOGIN_SUCCESS',
                `User logged in via biometric face verification from IP: ${clientIp}`
            ]);
        } catch (actErr) {}

        const displayName = user.full_name || user.username || 'User';

        return successResponse(res, 'Face authentication successful', {
            token,
            user: {
                id: user.id,
                username: user.username,
                name: displayName,
                full_name: displayName,
                email: user.email,
                role: user.role_name,
                must_change_password: Boolean(user.must_change_password)
            }
        });
    } catch (error) {
        console.error('[FACE LOGIN FATAL ERROR]:', error);
        return errorResponse(res, 'Internal Server Error during face authentication', [error.message], 500);
    }
});

/**
 * POST /api/auth/face/enroll-auth
 * Requires logged in session + password re-authentication.
 * Issues single-use 5-minute enrollmentToken.
 */
router.post('/enroll-auth', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        let userId = req.user?.id || req.user?.userId || req.user?.sub;
        let userEmail = req.user?.email;

        if (!password) {
            return errorResponse(res, 'Current account password is required for enrollment authorization', [], 400);
        }

        let rows = [];
        if (userId) {
            [rows] = await pool.execute('SELECT id, password FROM users WHERE id = ?', [userId]);
        }
        if ((!rows || rows.length === 0) && userEmail) {
            [rows] = await pool.execute('SELECT id, password FROM users WHERE LOWER(email) = ?', [userEmail.toLowerCase()]);
        }

        if (!rows || rows.length === 0) {
            return errorResponse(res, 'User account not found', [], 404);
        }

        const targetUserId = rows[0].id;
        const storedPasswordHash = rows[0].password || '';

        const inputPassword = (password || '').toString();
        const trimmedInputPassword = inputPassword.trim();

        let isPasswordValid = false;
        if (storedPasswordHash.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(inputPassword, storedPasswordHash);
            if (!isPasswordValid && trimmedInputPassword !== inputPassword) {
                isPasswordValid = await bcrypt.compare(trimmedInputPassword, storedPasswordHash);
            }
        } else {
            isPasswordValid = (storedPasswordHash === inputPassword || storedPasswordHash === trimmedInputPassword);
        }

        if (!isPasswordValid) {
            return errorResponse(res, 'Incorrect password. Enrollment authorization denied.', [], 401);
        }

        const enrollmentToken = `enr_${crypto.randomBytes(32).toString('hex')}`;
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5-min TTL

        enrollmentTokenStore.set(enrollmentToken, {
            userId: targetUserId,
            expiresAt
        });

        return successResponse(res, 'Enrollment authorized successfully', {
            enrollmentToken,
            expiresAt
        });
    } catch (error) {
        return errorResponse(res, 'Failed to authorize face enrollment', [error.message], 500);
    }
});

/**
 * POST /api/auth/face/enroll
 * Biometric Enrollment Endpoint
 */
router.post('/enroll', authenticateToken, async (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userId = req.user.id;

    try {
        const { enrollmentToken, nonce, frames } = req.body;

        if (!enrollmentToken || !nonce || !frames) {
            return errorResponse(res, 'Enrollment token, challenge nonce, and camera frames are required', [], 400);
        }

        // Validate enrollment token
        const tokenData = enrollmentTokenStore.get(enrollmentToken);
        if (!tokenData || tokenData.userId !== userId || Date.now() > tokenData.expiresAt) {
            enrollmentTokenStore.delete(enrollmentToken);
            return errorResponse(res, 'Invalid or expired enrollment authorization token. Please re-authenticate password.', [], 401);
        }
        enrollmentTokenStore.delete(enrollmentToken); // Single-use consumption

        // Validate nonce
        const nonceConsume = await faceNonceService.consumeNonce(nonce);
        if (!nonceConsume.valid) {
            return errorResponse(res, 'Invalid or expired challenge nonce', [], 400);
        }

        // Extract candidate 512D vector from frame
        const aligned = await faceInferenceService.detectAndAlignFace(frames[0]);
        const candidateVector = await faceInferenceService.extractEmbedding(aligned.tensor);

        // Enrollment 1:N Uniqueness Check: Ensure face is not registered to another account
        const [activeTemplates] = await pool.execute(
            'SELECT user_id, encrypted_embedding, iv, auth_tag FROM user_face_biometrics WHERE user_id != ? AND status = "active"',
            [userId]
        );

        for (const tmpl of activeTemplates) {
            try {
                const existingVector = await faceCryptoService.decryptEmbedding(tmpl.encrypted_embedding, tmpl.iv, tmpl.auth_tag);
                const sim = faceInferenceService.computeCosineSimilarity(candidateVector, existingVector);
                if (sim >= FACE_UNIQUENESS_THRESHOLD) {
                    await pool.execute(
                        'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address, failure_reason) VALUES (?, ?, ?, ?, ?)',
                        [userId, req.user.email, 'FACE_ENROLLMENT_FAILURE', clientIp, 'Duplicate face biometrics detected']
                    );
                    return errorResponse(res, 'This face template is already enrolled on another account.', [], 409, {
                        code: 'DUPLICATE_BIOMETRIC'
                    });
                }
            } catch (decryptErr) {
                // Ignore corrupted comparison
            }
        }

        // Encrypt candidate 512D vector using AES-256-GCM
        const encrypted = await faceCryptoService.encryptEmbedding(candidateVector);

        // Store or update user_face_biometrics
        await pool.execute(
            `INSERT INTO user_face_biometrics (user_id, encrypted_embedding, iv, auth_tag, algorithm_version, vector_dim, quality_score, status)
             VALUES (?, ?, ?, ?, 'arcface-mobilefacenet-v1', 512, ?, 'active')
             ON DUPLICATE KEY UPDATE 
                encrypted_embedding = VALUES(encrypted_embedding),
                iv = VALUES(iv),
                auth_tag = VALUES(auth_tag),
                quality_score = VALUES(quality_score),
                status = 'active',
                updated_at = CURRENT_TIMESTAMP`,
            [userId, encrypted.encryptedBlob, encrypted.iv, encrypted.authTag, aligned.qualityScore || 85.0]
        );

        await pool.execute(
            'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address) VALUES (?, ?, ?, ?)',
            [userId, req.user.email, 'FACE_ENROLLMENT_SUCCESS', clientIp]
        );

        return successResponse(res, 'Face biometrics enrolled successfully');
    } catch (error) {
        console.error('[FACE ENROLL ERROR]:', error);
        return errorResponse(res, 'Failed to enroll face biometrics: ' + error.message, [error.message], 500);
    }
});

/**
 * DELETE /api/auth/face/disable
 * Disables face biometrics (requires password confirmation).
 */
router.delete('/disable', authenticateToken, async (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    let userId = req.user?.id || req.user?.userId || req.user?.sub;
    let userEmail = req.user?.email;

    try {
        const { password } = req.body;
        if (!password) {
            return errorResponse(res, 'Account password is required to disable face biometrics', [], 400);
        }

        let rows = [];
        if (userId) {
            [rows] = await pool.execute('SELECT id, password FROM users WHERE id = ?', [userId]);
        }
        if ((!rows || rows.length === 0) && userEmail) {
            [rows] = await pool.execute('SELECT id, password FROM users WHERE LOWER(email) = ?', [userEmail.toLowerCase()]);
        }

        if (!rows || rows.length === 0) {
            return errorResponse(res, 'User account not found', [], 404);
        }

        const targetUserId = rows[0].id;
        const storedPasswordHash = rows[0].password || '';

        const inputPassword = (password || '').toString();
        const trimmedInputPassword = inputPassword.trim();

        let isPasswordValid = false;
        if (storedPasswordHash.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(inputPassword, storedPasswordHash);
            if (!isPasswordValid && trimmedInputPassword !== inputPassword) {
                isPasswordValid = await bcrypt.compare(trimmedInputPassword, storedPasswordHash);
            }
        } else {
            isPasswordValid = (storedPasswordHash === inputPassword || storedPasswordHash === trimmedInputPassword);
        }

        if (!isPasswordValid) {
            return errorResponse(res, 'Incorrect password. Disablement denied.', [], 401);
        }

        await pool.execute('DELETE FROM user_face_biometrics WHERE user_id = ?', [targetUserId]);

        await pool.execute(
            'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address) VALUES (?, ?, ?, ?)',
            [userId, req.user.email, 'FACE_DISABLED', clientIp]
        );

        return successResponse(res, 'Face biometrics disabled successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to disable face biometrics', [error.message], 500);
    }
});

/**
 * GET /api/auth/face/status
 * Returns biometric status for authenticated user.
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute('SELECT status, created_at FROM user_face_biometrics WHERE user_id = ?', [userId]);

        const isEnrolled = rows.length > 0 && rows[0].status === 'active';
        return successResponse(res, 'Biometric status retrieved', {
            enabled: process.env.FACE_AUTH_ENABLED !== 'false',
            enrolled: isEnrolled,
            enrolledAt: isEnrolled ? rows[0].created_at : null
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch biometric status', [error.message], 500);
    }
});

export default router;
