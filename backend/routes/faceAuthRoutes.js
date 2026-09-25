import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  parseAndValidateFrames,
  checkLivenessMotion,
  extractFaceEmbedding,
  encryptTemplate,
  decryptTemplate,
  calculateCosineSimilarity
} from '../services/faceAuthService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SIMILARITY_THRESHOLD = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || '0.48');

// Ensure sample_image column exists in face_biometrics table
(async () => {
  try {
    await pool.execute(`ALTER TABLE face_biometrics ADD COLUMN sample_image LONGTEXT NULL`);
  } catch (e) {}
})();

// Middleware to check feature flag FACE_AUTH_ENABLED
function checkFaceAuthFeatureFlag(req, res, next) {
  const isEnabled = process.env.FACE_AUTH_ENABLED !== 'false';
  if (!isEnabled) {
    return errorResponse(res, 'Face authentication service is currently disabled', [], 503, { code: 'FEATURE_DISABLED' });
  }
  next();
}

/**
 * Helper to resolve user by email, username, roll number, admission number, phone, or employee ID
 */
async function findUserByIdentifier(identifier) {
  const loginIdentifier = (identifier || '').trim().toLowerCase();
  if (!loginIdentifier) return null;

  let [rows] = await pool.execute(
    `SELECT u.*, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE LOWER(u.email) = ? OR LOWER(u.username) = ?`,
    [loginIdentifier, loginIdentifier]
  );

  if (rows.length === 0) {
    try {
      const [studentRows] = await pool.execute(
        `SELECT u.*, r.name as role_name 
         FROM students s 
         JOIN users u ON s.user_id = u.id 
         JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(s.roll_number) = ? OR LOWER(s.admission_number) = ? OR LOWER(s.phone) = ? OR LOWER(s.email) = ?`,
        [loginIdentifier, loginIdentifier, loginIdentifier, loginIdentifier]
      );
      if (studentRows.length > 0) rows = studentRows;
      else {
        const [facultyRows] = await pool.execute(
          `SELECT u.*, r.name as role_name 
           FROM faculty f 
           JOIN users u ON f.user_id = u.id 
           JOIN roles r ON u.role_id = r.id 
           WHERE LOWER(f.employee_id) = ? OR LOWER(f.phone) = ? OR LOWER(f.email) = ?`,
          [loginIdentifier, loginIdentifier, loginIdentifier]
        );
        if (facultyRows.length > 0) rows = facultyRows;
        else {
          const [parentRows] = await pool.execute(
            `SELECT u.*, r.name as role_name 
             FROM parents p 
             JOIN users u ON p.user_id = u.id 
             JOIN roles r ON u.role_id = r.id 
             WHERE LOWER(p.phone) = ? OR LOWER(p.email) = ?`,
            [loginIdentifier, loginIdentifier]
          );
          if (parentRows.length > 0) rows = parentRows;
        }
      }
    } catch (e) {
      console.warn('[FACE AUTH] Auxiliary user lookup notice:', e.message);
    }
  }

  return rows.length > 0 ? rows[0] : null;
}

/**
 * GET /api/face/status
 */
router.get('/status', async (req, res) => {
  const isEnabled = process.env.FACE_AUTH_ENABLED !== 'false';
  let identifier = req.query.identifier;
  let isEnrolled = false;

  let targetUserId = null;

  if (identifier && isEnabled) {
    const user = await findUserByIdentifier(identifier);
    if (user) targetUserId = user.id;
  }

  // Check Authorization token if targetUserId not resolved by query identifier
  if (!targetUserId) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          targetUserId = decoded.id;
        }
      } catch (e) {}
    }
  }

  if (targetUserId && isEnabled) {
    const [bioRows] = await pool.execute(
      `SELECT id FROM face_biometrics WHERE user_id = ?`,
      [targetUserId]
    );
    isEnrolled = bioRows.length > 0;
  }

  return successResponse(res, 'Face auth service status', {
    face_auth_enabled: isEnabled,
    is_enrolled: isEnrolled
  });
});

/**
 * Helper to fetch complete user profile including Student Roll No / Admission No / Faculty Employee ID
 */
async function getUserProfileDetails(userId) {
  const [rows] = await pool.execute(
    `SELECT u.*, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [userId]
  );
  if (rows.length === 0) return null;
  const user = rows[0];

  let collegeId = user.username;
  let displayName = user.full_name || user.username;

  try {
    const [stRows] = await pool.execute(
      `SELECT roll_number, admission_number, CONCAT_WS(' ', first_name, last_name) as st_name FROM students WHERE user_id = ?`,
      [userId]
    );
    if (stRows.length > 0) {
      if (stRows[0].roll_number) collegeId = stRows[0].roll_number;
      else if (stRows[0].admission_number) collegeId = stRows[0].admission_number;
      if (stRows[0].st_name && stRows[0].st_name.trim()) displayName = stRows[0].st_name.trim();
    } else {
      const [facRows] = await pool.execute(
        `SELECT employee_id, name FROM faculty WHERE user_id = ?`,
        [userId]
      );
      if (facRows.length > 0) {
        if (facRows[0].employee_id) collegeId = facRows[0].employee_id;
        if (facRows[0].name) displayName = facRows[0].name;
      }
    }
  } catch (e) {
    console.warn('[FACE AUTH] Extra profile lookup notice:', e.message);
  }

  user.display_name = displayName;
  user.college_id = collegeId;
  return user;
}

/**
 * POST /api/face/nonce
 * Generates 256-bit single-use 15-second nonce for face verification / auto-detection
 */
router.post('/nonce', checkFaceAuthFeatureFlag, async (req, res) => {
  try {
    const { identifier } = req.body;
    let userId = null;

    if (identifier && identifier.trim() && identifier.trim().toLowerCase() !== 'auto') {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return errorResponse(res, 'Account not found. Please check your username, email, or roll number.', [], 444, { code: 'ACCOUNT_NOT_FOUND' });
      }

      if (user.status === 'blocked' || user.status === 'inactive') {
        return errorResponse(res, 'Account is inactive or blocked. Please contact admin.', [], 403, { code: 'ACCOUNT_BLOCKED' });
      }

      // Check face-specific 15-minute cooldown
      const [attemptRows] = await pool.execute(
        `SELECT failed_count, cooldown_until FROM face_failed_attempts WHERE user_id = ?`,
        [user.id]
      );

      if (attemptRows.length > 0) {
        const att = attemptRows[0];
        if (att.cooldown_until && new Date(att.cooldown_until) > new Date()) {
          const remainingMinutes = Math.ceil((new Date(att.cooldown_until) - new Date()) / (1000 * 60));
          return errorResponse(
            res,
            `Too many failed face login attempts. Face login locked for ${remainingMinutes} more minutes. Please use password login.`,
            [],
            429,
            { code: 'FACE_LOCKED_COOLDOWN', cooldownRemainingMinutes: remainingMinutes }
          );
        }
      }

      // Verify user has enrolled biometrics
      const [bioRows] = await pool.execute(
        `SELECT id FROM face_biometrics WHERE user_id = ?`,
        [user.id]
      );
      if (bioRows.length === 0) {
        return errorResponse(res, 'Face biometrics not enrolled for this account. Please log in with password to enroll.', [], 400, { code: 'BIOMETRIC_NOT_ENROLLED' });
      }

      userId = user.id;
    }

    // Generate 256-bit random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 1000);

    await pool.execute(
      `INSERT INTO face_auth_nonces (nonce, user_id, expires_at, used) VALUES (?, ?, ?, 0)`,
      [nonce, userId, expiresAt]
    );

    return successResponse(res, 'Face authentication challenge generated', {
      nonce,
      expires_in: 15
    });
  } catch (err) {
    console.error('[FACE AUTH NONCE ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to generate face authentication challenge', [], 500, { code: 'NONCE_ERROR' });
  }
});

/**
 * POST /api/face/verify
 * Verifies submitted face frames against 1:1 user biometric template or 1:N auto-detection
 */
router.post('/verify', checkFaceAuthFeatureFlag, async (req, res) => {
  try {
    const { identifier, nonce, frames } = req.body;
    if (!nonce || !frames) {
      return errorResponse(res, 'Nonce challenge and face frames are required', [], 400, { code: 'INVALID_PAYLOAD' });
    }

    const hasSpecificIdentifier = identifier && identifier.trim() && identifier.trim().toLowerCase() !== 'auto';
    let targetUser = null;

    if (hasSpecificIdentifier) {
      targetUser = await findUserByIdentifier(identifier);
      if (!targetUser) {
        return errorResponse(res, 'Invalid account identifier', [], 401, { code: 'ACCOUNT_NOT_FOUND' });
      }

      // Check rate limit / cooldown
      const [attemptRows] = await pool.execute(
        `SELECT failed_count, cooldown_until FROM face_failed_attempts WHERE user_id = ?`,
        [targetUser.id]
      );
      if (attemptRows.length > 0 && attemptRows[0].cooldown_until && new Date(attemptRows[0].cooldown_until) > new Date()) {
        return errorResponse(res, 'Face authentication is locked due to multiple failed attempts. Please use password login.', [], 429, { code: 'FACE_LOCKED_COOLDOWN' });
      }
    }

    // Nonce Validation (Single-use, <= 15s expiry)
    const [nonceRows] = await pool.execute(
      `SELECT * FROM face_auth_nonces WHERE nonce = ?`,
      [nonce]
    );

    if (nonceRows.length === 0) {
      return errorResponse(res, 'Invalid or missing authentication challenge', [], 401, { code: 'NONCE_ERROR' });
    }

    const nonceRecord = nonceRows[0];
    if (nonceRecord.used === 1) {
      return errorResponse(res, 'Authentication challenge has already been used. Please retry.', [], 401, { code: 'NONCE_REUSED' });
    }

    // Instantly invalidate nonce (Single-use!)
    await pool.execute(
      `UPDATE face_auth_nonces SET used = 1 WHERE nonce = ?`,
      [nonce]
    );

    if (new Date(nonceRecord.expires_at) < new Date()) {
      return errorResponse(res, 'Authentication challenge expired. Please retry.', [], 401, { code: 'NONCE_EXPIRED' });
    }

    // Payload & Resource Validation
    const parsedFrames = parseAndValidateFrames(frames);

    // Liveness Motion Verification
    const liveness = checkLivenessMotion(parsedFrames);
    if (!liveness.isLive) {
      console.warn(`[FACE AUTH LIVENESS REJECT]: ${liveness.reason} (delta=${liveness.delta})`);
      if (targetUser) {
        return handleFailedFaceAttempt(res, targetUser.id, 'Liveness verification failed. Please present a live face video.', 'LIVENESS_ERROR');
      }
      return errorResponse(res, 'Liveness verification failed. Please present a live face video.', [], 401, { code: 'LIVENESS_ERROR' });
    }

    // Extract 512-d Face Embedding from live target frame
    const targetEmbedding = await extractFaceEmbedding(parsedFrames[0].buffer);

    let matchedUserId = null;
    let matchedSimilarity = 0;

    if (hasSpecificIdentifier) {
      // 1:1 Verification Mode
      const [bioRows] = await pool.execute(
        `SELECT * FROM face_biometrics WHERE user_id = ?`,
        [targetUser.id]
      );
      if (bioRows.length === 0) {
        return errorResponse(res, 'Face biometrics not enrolled for this account', [], 400, { code: 'BIOMETRIC_NOT_ENROLLED' });
      }

      const bio = bioRows[0];
      let storedEmbedding;
      try {
        storedEmbedding = decryptTemplate(bio.encrypted_template, bio.iv, bio.auth_tag);
      } catch (decErr) {
        console.warn(`[FACE AUTH 1:1] Cannot decrypt template for User ${targetUser.id}:`, decErr.message);
        return errorResponse(
          res,
          'Your registered face template is from an earlier security key version. Please log in with password once to re-enroll your face.',
          [],
          400,
          { code: 'BIOMETRIC_NOT_ENROLLED' }
        );
      }

      matchedSimilarity = calculateCosineSimilarity(targetEmbedding, storedEmbedding);
      console.log(`[FACE AUTH 1:1 VERIFY] User ${targetUser.username} similarity score: ${matchedSimilarity.toFixed(4)} (Threshold: ${SIMILARITY_THRESHOLD})`);

      if (matchedSimilarity < SIMILARITY_THRESHOLD) {
        return handleFailedFaceAttempt(
          res,
          targetUser.id,
          `Face verification failed. Similarity score (${matchedSimilarity.toFixed(2)}) below baseline.`,
          'SIMILARITY_FAILED'
        );
      }
      matchedUserId = targetUser.id;
    } else {
      // 1:N Auto-Detection Mode across ALL enrolled accounts
      const [allBioRows] = await pool.execute(
        `SELECT user_id, encrypted_template, iv, auth_tag FROM face_biometrics`
      );

      if (allBioRows.length === 0) {
        return errorResponse(res, 'No face biometrics registered in the system. Please log in with password to enroll first.', [], 400, { code: 'BIOMETRIC_NOT_ENROLLED' });
      }

      let bestUserId = null;
      let maxScore = 0;

      for (const record of allBioRows) {
        try {
          const storedEmbedding = decryptTemplate(record.encrypted_template, record.iv, record.auth_tag);
          const score = calculateCosineSimilarity(targetEmbedding, storedEmbedding);
          if (score > maxScore) {
            maxScore = score;
            bestUserId = record.user_id;
          }
        } catch (e) {}
      }

      console.log(`[FACE AUTH 1:N AUTO MATCH] Best candidate User ${bestUserId} score: ${maxScore.toFixed(4)} (Threshold: ${SIMILARITY_THRESHOLD})`);

      if (!bestUserId || maxScore < SIMILARITY_THRESHOLD) {
        return errorResponse(
          res,
          `No enrolled account matched this face scan (Best match: ${(maxScore * 100).toFixed(1)}%). Please position your face clearly or enroll biometrics.`,
          [],
          401,
          { code: 'AUTO_MATCH_FAILED', bestSimilarity: parseFloat(maxScore.toFixed(4)) }
        );
      }

      matchedUserId = bestUserId;
      matchedSimilarity = maxScore;
    }

    // Success! Fetch rich user profile with Student ID / Employee ID
    const userProfile = await getUserProfileDetails(matchedUserId);
    if (!userProfile) {
      return errorResponse(res, 'Matched user account record not found', [], 404, { code: 'USER_NOT_FOUND' });
    }

    if (userProfile.status === 'blocked' || userProfile.status === 'inactive') {
      return errorResponse(res, 'Matched account is inactive or blocked. Please contact IT admin.', [], 403, { code: 'ACCOUNT_BLOCKED' });
    }

    // Reset failed face attempt counter
    await pool.execute(
      `INSERT INTO face_failed_attempts (user_id, failed_count, cooldown_until) 
       VALUES (?, 0, NULL) 
       ON DUPLICATE KEY UPDATE failed_count = 0, cooldown_until = NULL`,
      [matchedUserId]
    );

    // Issue standard JWT session token
    const token = jwt.sign(
      {
        id: userProfile.id,
        username: userProfile.username,
        role: userProfile.role_name,
        role_id: userProfile.role_id,
        must_change_password: userProfile.must_change_password
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retrieve registered face biometric image captured during enrollment
    let registeredFaceImage = null;
    try {
      const [bioImgRows] = await pool.execute(
        `SELECT sample_image FROM face_biometrics WHERE user_id = ?`,
        [matchedUserId]
      );
      if (bioImgRows.length > 0 && bioImgRows[0].sample_image) {
        registeredFaceImage = bioImgRows[0].sample_image;
      }
    } catch (e) {}

    const similarityPercent = Math.min(99.9, Math.max(75, Math.round(matchedSimilarity * 1000) / 10)).toFixed(1);

    return successResponse(res, `Face matched successfully! Welcome ${userProfile.display_name}`, {
      token,
      user: {
        id: userProfile.id,
        username: userProfile.username,
        full_name: userProfile.display_name,
        email: userProfile.email,
        role: userProfile.role_name,
        role_id: userProfile.role_id,
        college_id: userProfile.college_id,
        stored_face_image: registeredFaceImage,
        must_change_password: userProfile.must_change_password
      },
      matchDetails: {
        matched_name: userProfile.display_name,
        student_id: userProfile.college_id,
        role: userProfile.role_name,
        similarity_percent: similarityPercent,
        stored_face_image: registeredFaceImage,
        verified: true
      }
    });

  } catch (err) {
    console.error('[FACE AUTH VERIFY ERROR]:', err.code || 'UNKNOWN', err.message);
    const code = err.code || 'VERIFICATION_ERROR';
    return errorResponse(res, err.message || 'Face authentication processing failed', [], 400, { code });
  }
});

/**
 * Helper to handle failed face attempts & 15-min cooldown
 */
async function handleFailedFaceAttempt(res, userId, message, code = 'SIMILARITY_FAILED') {
  let [attemptRows] = await pool.execute(
    `SELECT failed_count FROM face_failed_attempts WHERE user_id = ?`,
    [userId]
  );

  let newCount = (attemptRows.length > 0 ? attemptRows[0].failed_count : 0) + 1;
  let cooldownUntil = null;

  if (newCount >= 5) {
    cooldownUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await pool.execute(
    `INSERT INTO face_failed_attempts (user_id, failed_count, cooldown_until) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE failed_count = ?, cooldown_until = ?`,
    [userId, newCount, cooldownUntil, newCount, cooldownUntil]
  );

  if (newCount >= 5) {
    return errorResponse(
      res,
      'Maximum 5 failed face attempts reached. Face login locked for 15 minutes. Please use password login.',
      [],
      429,
      { code: 'FACE_LOCKED_COOLDOWN', faceAttemptsRemaining: 0, cooldownActive: true }
    );
  }

  return errorResponse(
    res,
    `${message} (${5 - newCount} attempts remaining before 15-min face lock).`,
    [],
    401,
    { code, faceAttemptsRemaining: 5 - newCount }
  );
}

/**
 * POST /api/face/enroll
 * Authenticated endpoint for registering face biometrics
 */
router.post('/enroll', authenticateToken, checkFaceAuthFeatureFlag, async (req, res) => {
  try {
    const { frames } = req.body;
    const userId = req.user.id;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return errorResponse(res, 'Face frames are required for enrollment', [], 400, { code: 'INVALID_PAYLOAD' });
    }

    const parsedFrames = parseAndValidateFrames(frames);

    // Extract sample face embeddings in parallel
    const sampleEmbeddings = await Promise.all(
      parsedFrames.map(frame => extractFaceEmbedding(frame.buffer))
    );

    // Average sample embeddings
    const avgEmbedding = new Array(512).fill(0);
    for (let i = 0; i < 512; i++) {
      let sum = 0;
      for (const emb of sampleEmbeddings) {
        sum += emb[i];
      }
      avgEmbedding[i] = sum / sampleEmbeddings.length;
    }
    // L2 Normalize
    let norm = Math.sqrt(avgEmbedding.reduce((s, v) => s + v * v, 0));
    if (norm === 0) norm = 1;
    const normalizedAvg = avgEmbedding.map(v => v / norm);

    // 1:N Duplicate Biometric Check across ALL existing enrolled accounts
    const [existingBioRows] = await pool.execute(
      `SELECT user_id, encrypted_template, iv, auth_tag FROM face_biometrics WHERE user_id != ?`,
      [userId]
    );

    for (const record of existingBioRows) {
      try {
        const otherTemplate = decryptTemplate(record.encrypted_template, record.iv, record.auth_tag);
        const duplicateSim = calculateCosineSimilarity(normalizedAvg, otherTemplate);
        if (duplicateSim >= SIMILARITY_THRESHOLD) {
          console.warn(`[FACE ENROLL REJECT] Duplicate face detected between User ${userId} and User ${record.user_id} (Score: ${duplicateSim.toFixed(4)})`);
          return errorResponse(
            res,
            'This face biometric pattern is already registered under another account. Duplicate enrollment rejected.',
            [],
            409,
            { code: 'DUPLICATE_FACE_ENROLLED' }
          );
        }
      } catch (decErr) {
        console.warn(`[FACE ENROLL WARNING] Could not decrypt template for user ${record.user_id}:`, decErr.message);
      }
    }

    // Encrypt template with AES-256-GCM
    const encrypted = encryptTemplate(normalizedAvg);
    const sampleImage = parsedFrames[0] ? `data:image/jpeg;base64,${parsedFrames[0].buffer.toString('base64')}` : null;

    // Save/Update in face_biometrics
    await pool.execute(
      `INSERT INTO face_biometrics (user_id, encrypted_template, iv, auth_tag, algorithm, sample_image) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE encrypted_template = ?, iv = ?, auth_tag = ?, algorithm = ?, sample_image = ?, updated_at = CURRENT_TIMESTAMP`,
      [
        userId, encrypted.encrypted_template, encrypted.iv, encrypted.auth_tag, encrypted.algorithm, sampleImage,
        encrypted.encrypted_template, encrypted.iv, encrypted.auth_tag, encrypted.algorithm, sampleImage
      ]
    );

    return successResponse(res, 'Face biometrics enrolled successfully', {
      enrolled: true
    });
  } catch (err) {
    console.error('[FACE ENROLL ERROR]:', err.code || 'UNKNOWN', err.message);
    const code = err.code || 'ENROLLMENT_ERROR';
    return errorResponse(res, err.message || 'Face biometric enrollment failed', [], 400, { code });
  }
});

/**
 * DELETE /api/face/delete
 * Authenticated endpoint to delete registered face biometrics
 */
router.delete('/delete', authenticateToken, checkFaceAuthFeatureFlag, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      `DELETE FROM face_biometrics WHERE user_id = ?`,
      [userId]
    );

    await pool.execute(
      `DELETE FROM face_failed_attempts WHERE user_id = ?`,
      [userId]
    );

    return successResponse(res, 'Face biometrics deleted successfully', {
      deleted: true,
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error('[FACE DELETE ERROR]:', err);
    return errorResponse(res, 'Failed to delete face biometrics', [], 500, { code: 'DELETE_ERROR' });
  }
});

export default router;

