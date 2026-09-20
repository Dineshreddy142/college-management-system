import express from 'express';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import pool from '../db.js';
import { authenticateToken } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// In-memory challenge store with automatic expiration
const challengesMap = new Map();

const setChallenge = (key, challenge) => {
  challengesMap.set(String(key), { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
};

const getChallenge = (key) => {
  const item = challengesMap.get(String(key));
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    challengesMap.delete(String(key));
    return null;
  }
  challengesMap.delete(String(key));
  return item.challenge;
};

// Helper: Get Clean RP ID and Expected Origin
const getWebAuthnConfig = (req) => {
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5171';
  const hostname = rawHost.split(':')[0]; // Remove port if present
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  
  const rpID = process.env.RP_ID || hostname;
  const origin = process.env.EXPECTED_ORIGIN || `${protocol}://${rawHost}`;
  
  return { rpID, origin };
};

// Helper: Find User by Identifier
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const term = String(identifier).trim().toLowerCase();

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.status, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE LOWER(u.email) = ? OR LOWER(u.username) = ? OR u.id = ? 
     LIMIT 1`,
    [term, term, isNaN(Number(term)) ? -1 : Number(term)]
  );

  if (rows.length > 0) return rows[0];

  // Try matching student roll/admission number or faculty employee ID
  const [stuRows] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.status, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     JOIN students s ON s.user_id = u.id 
     WHERE LOWER(s.admission_number) = ? OR LOWER(s.roll_number) = ? 
     LIMIT 1`,
    [term, term]
  );
  if (stuRows.length > 0) return stuRows[0];

  const [facRows] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.status, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     JOIN faculty f ON f.user_id = u.id 
     WHERE LOWER(f.employee_id) = ? 
     LIMIT 1`,
    [term]
  );
  return facRows.length > 0 ? facRows[0] : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GENERATE REGISTRATION OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register/options', async (req, res) => {
  try {
    const { identifier } = req.body;
    let user = null;

    // Check if request is authenticated
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [uRows] = await pool.execute(
          `SELECT u.id, u.username, u.email, u.status, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
          [decoded.id]
        );
        if (uRows.length > 0) user = uRows[0];
      } catch (e) {
        // Token invalid, fall back to identifier
      }
    }

    if (!user && identifier) {
      user = await findUserByIdentifier(identifier);
    }

    if (!user) {
      return errorResponse(res, 'User account not found. Please provide a valid College ID or email.', [], 404);
    }

    if (user.status === 'blocked') {
      return errorResponse(res, 'Account is blocked. Please contact university administrator.', [], 403);
    }

    const { rpID } = getWebAuthnConfig(req);

    // Fetch existing credentials to exclude
    const [existingCreds] = await pool.execute(
      `SELECT credential_id FROM webauthn_credentials WHERE user_id = ?`,
      [user.id]
    );

    const excludeCredentials = existingCreds.map(c => ({
      id: c.credential_id,
      transports: ['internal', 'hybrid'],
    }));

    const options = await generateRegistrationOptions({
      rpName: 'College ERP System',
      rpID,
      userID: new Uint8Array(Buffer.from(String(user.id))),
      userName: user.username || user.email,
      userDisplayName: user.username || user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });

    setChallenge(`reg_${user.id}`, options.challenge);

    return successResponse(res, 'Registration options generated', {
      options,
      userId: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error('[WebAuthn] Register Options Error:', error);
    return errorResponse(res, 'Failed to generate WebAuthn registration options', [error.message], 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. VERIFY REGISTRATION RESPONSE
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register/verify', async (req, res) => {
  try {
    const { userId, response: credentialResponse, deviceLabel } = req.body;

    if (!userId || !credentialResponse) {
      return errorResponse(res, 'Missing userId or credential response body', [], 400);
    }

    const expectedChallenge = getChallenge(`reg_${userId}`);
    if (!expectedChallenge) {
      return errorResponse(res, 'Registration session expired or invalid. Please try registering again.', [], 400);
    }

    const { rpID, origin } = getWebAuthnConfig(req);

    const verification = await verifyRegistrationResponse({
      response: credentialResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return errorResponse(res, 'Biometric registration verification failed.', [], 400);
    }

    const { credential } = verification.registrationInfo;
    const credentialId = credential.id;
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString('base64');
    const counter = credential.counter;
    const label = deviceLabel || (req.headers['user-agent']?.includes('Mobile') ? 'Mobile Passkey' : 'Desktop Passkey');

    // Save Credential
    await pool.execute(
      `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, device_label)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE public_key = VALUES(public_key), counter = VALUES(counter)`,
      [userId, credentialId, publicKeyBase64, counter, label]
    );

    return successResponse(res, 'WebAuthn Passkey registered successfully!', {
      userId,
      credentialId,
      deviceLabel: label,
    });
  } catch (error) {
    console.error('[WebAuthn] Register Verify Error:', error);
    return errorResponse(res, 'Biometric registration failed', [error.message], 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERATE AUTHENTICATION OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login/options', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return errorResponse(res, 'Please enter your College ID, Username, or Email to continue.', [], 400);
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return errorResponse(res, 'No account found matching the provided ID/email.', [], 444);
    }

    if (user.status === 'blocked') {
      return errorResponse(res, 'Account is BLOCKED by Administrator. Login access denied.', [], 403);
    }

    // Retrieve user passkeys
    const [creds] = await pool.execute(
      `SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ?`,
      [user.id]
    );

    if (creds.length === 0) {
      return errorResponse(res, 'No Biometric Passkey registered for this account. Please log in with password to register your device.', [], 404);
    }

    const { rpID } = getWebAuthnConfig(req);

    const allowCredentials = creds.map(c => ({
      id: c.credential_id,
      transports: ['internal', 'hybrid'],
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'required',
    });

    setChallenge(`login_${user.id}`, options.challenge);

    return successResponse(res, 'Authentication options generated', {
      options,
      userId: user.id,
      username: user.username,
      role: user.role_name,
    });
  } catch (error) {
    console.error('[WebAuthn] Login Options Error:', error);
    return errorResponse(res, 'Failed to generate WebAuthn login options', [error.message], 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. VERIFY AUTHENTICATION RESPONSE
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login/verify', async (req, res) => {
  try {
    const { userId, response: assertionResponse } = req.body;

    if (!userId || !assertionResponse) {
      return errorResponse(res, 'Missing userId or assertion response body', [], 400);
    }

    const [userRows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.status, u.must_change_password, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return errorResponse(res, 'User account not found', [], 404);
    }
    const user = userRows[0];

    if (user.status === 'blocked') {
      return errorResponse(res, 'Account is BLOCKED by Administrator. Access denied.', [], 403);
    }

    // Get expected challenge
    const expectedChallenge = getChallenge(`login_${userId}`);
    if (!expectedChallenge) {
      return errorResponse(res, 'Authentication session expired. Please tap Login again.', [], 400);
    }

    // Find credential in DB
    const [credRows] = await pool.execute(
      `SELECT * FROM webauthn_credentials WHERE user_id = ? AND credential_id = ?`,
      [userId, assertionResponse.id]
    );

    if (credRows.length === 0) {
      return errorResponse(res, 'Unrecognized Passkey credential for this user account.', [], 400);
    }
    const dbCred = credRows[0];

    const { rpID, origin } = getWebAuthnConfig(req);

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCred.credential_id,
        publicKey: new Uint8Array(Buffer.from(dbCred.public_key, 'base64')),
        counter: dbCred.counter,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return errorResponse(res, 'Biometric Passkey verification failed.', [], 401);
    }

    // Update Counter
    const newCounter = verification.authenticationInfo.newCounter;
    await pool.execute(
      `UPDATE webauthn_credentials SET counter = ? WHERE id = ?`,
      [newCounter, dbCred.id]
    );

    // Issue Session Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, 'Biometric Passkey authentication successful!', {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        must_change_password: user.must_change_password || 0,
      }
    });
  } catch (error) {
    console.error('[WebAuthn] Login Verify Error:', error);
    return errorResponse(res, 'Passkey authentication failed: ' + error.message, [], 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. LIST USER PASSKEYS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/credentials', authenticateToken, async (req, res) => {
  try {
    const [creds] = await pool.execute(
      `SELECT id, credential_id, device_label, created_at FROM webauthn_credentials WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return successResponse(res, 'Passkeys retrieved', creds);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user passkeys', [error.message], 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE USER PASSKEY
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/credentials/:id', authenticateToken, async (req, res) => {
  try {
    const credId = req.params.id;
    await pool.execute(
      `DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?`,
      [credId, req.user.id]
    );

    return successResponse(res, 'Passkey device removed successfully', { credId });
  } catch (error) {
    return errorResponse(res, 'Failed to remove passkey device', [error.message], 500);
  }
});

export default router;
