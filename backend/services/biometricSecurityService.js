import pool from '../db.js';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const TEMPORARY_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes temporary lockout
const IP_WINDOW_MS = 60 * 1000; // 1 minute window
const IP_MAX_REQUESTS = 30; // Max 30 biometric requests per minute per IP
const PROGRESSIVE_DELAY_BASE_MS = 350; // Delay added per consecutive failure (up to 2000ms)

// In-memory security tracking stores
const userFailureTracker = new Map(); // key: userId/email -> { failedAttempts, lockedUntil, lastAttempt }
const ipTracker = new Map(); // key: ip -> { count, windowStart, failedAttempts, lockedUntil }
const sessionTracker = new Map(); // key: sessionId -> { count, createdTime }

/**
 * Normalizes identifier string for security map lookups
 */
function normalizeKey(str) {
  return (str || '').toString().toLowerCase().trim();
}

/**
 * Checks whether a biometric request is permitted and calculates progressive delay.
 */
export async function checkBiometricSecurity(identifier, clientIp, sessionId = null) {
  const now = Date.now();
  const userKey = normalizeKey(identifier);
  const ipKey = normalizeKey(clientIp) || '127.0.0.1';

  // 1. Check IP Burst Rate Limit (30 req / minute)
  let ipRecord = ipTracker.get(ipKey);
  if (!ipRecord || (now - ipRecord.windowStart) > IP_WINDOW_MS) {
    ipRecord = { count: 1, windowStart: now, failedAttempts: ipRecord?.failedAttempts || 0, lockedUntil: ipRecord?.lockedUntil || 0 };
    ipTracker.set(ipKey, ipRecord);
  } else {
    ipRecord.count += 1;
    if (ipRecord.count > IP_MAX_REQUESTS) {
      const remainingSeconds = Math.ceil((IP_WINDOW_MS - (now - ipRecord.windowStart)) / 1000);
      return {
        allowed: false,
        status: 429,
        reason: 'IP_RATE_LIMITED',
        message: `Too many biometric requests from this IP. Please wait ${remainingSeconds} seconds.`,
        remainingSeconds
      };
    }
  }

  // 2. Check IP Temporary Lockout
  if (ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
    const remainingSeconds = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      status: 429,
      reason: 'IP_TEMPORARILY_LOCKED',
      message: `Biometric authentication temporarily locked for this IP due to repeated failures. Try again in ${Math.ceil(remainingSeconds / 60)} minutes (or sign in with password).`,
      remainingSeconds
    };
  }

  // 3. Check User Account Temporary Lockout
  let userRecord = userKey ? userFailureTracker.get(userKey) : null;
  if (userRecord && userRecord.lockedUntil && now < userRecord.lockedUntil) {
    const remainingSeconds = Math.ceil((userRecord.lockedUntil - now) / 1000);
    return {
      allowed: false,
      status: 429,
      reason: 'USER_TEMPORARILY_LOCKED',
      message: `Face verification temporarily suspended for this account after multiple failed attempts. Try again in ${Math.ceil(remainingSeconds / 60)} minutes, or sign in with your password.`,
      remainingSeconds
    };
  }

  // 4. Check Session Rate Limit (if session ID provided)
  if (sessionId) {
    const sessionKey = normalizeKey(sessionId);
    let sRec = sessionTracker.get(sessionKey);
    if (!sRec) {
      sessionTracker.set(sessionKey, { count: 1, createdTime: now });
    } else {
      sRec.count += 1;
      if (sRec.count > 10) {
        return {
          allowed: false,
          status: 429,
          reason: 'SESSION_RATE_LIMITED',
          message: 'Liveness session rate limit exceeded. Please request a new liveness challenge.',
          remainingSeconds: 30
        };
      }
    }
  }

  // 5. Calculate Progressive Delay (Throttle attack speed)
  const failedCount = (userRecord?.failedAttempts || 0) + (ipRecord?.failedAttempts || 0);
  const delayMs = Math.min(2000, failedCount * PROGRESSIVE_DELAY_BASE_MS);

  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return {
    allowed: true,
    delayMs,
    failedAttempts: userRecord?.failedAttempts || 0
  };
}

/**
 * Records a successful biometric verification attempt and clears failure penalties.
 */
export function recordBiometricSuccess(identifier, clientIp) {
  const userKey = normalizeKey(identifier);
  const ipKey = normalizeKey(clientIp) || '127.0.0.1';

  if (userKey) {
    userFailureTracker.delete(userKey);
  }

  if (ipTracker.has(ipKey)) {
    const rec = ipTracker.get(ipKey);
    rec.failedAttempts = 0;
    rec.lockedUntil = 0;
  }
}

/**
 * Records a failed biometric attempt, applying progressive penalties and temporary lockouts.
 */
export async function recordBiometricFailure(identifier, clientIp) {
  const now = Date.now();
  const userKey = normalizeKey(identifier);
  const ipKey = normalizeKey(clientIp) || '127.0.0.1';

  let userRecord = userKey ? userFailureTracker.get(userKey) : null;
  if (!userRecord) {
    userRecord = { failedAttempts: 1, lockedUntil: 0, lastAttempt: now };
    if (userKey) userFailureTracker.set(userKey, userRecord);
  } else {
    userRecord.failedAttempts += 1;
    userRecord.lastAttempt = now;
  }

  let ipRecord = ipTracker.get(ipKey);
  if (!ipRecord) {
    ipRecord = { count: 1, windowStart: now, failedAttempts: 1, lockedUntil: 0 };
    ipTracker.set(ipKey, ipRecord);
  } else {
    ipRecord.failedAttempts = (ipRecord.failedAttempts || 0) + 1;
  }

  let isLocked = false;
  let remainingSeconds = 0;

  // If user reaches max failed attempts, apply temporary lockout
  if (userRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    userRecord.lockedUntil = now + TEMPORARY_LOCKOUT_MS;
    isLocked = true;
    remainingSeconds = Math.ceil(TEMPORARY_LOCKOUT_MS / 1000);

    await logBiometricSecurityEvent(
      userKey,
      ipKey,
      'TEMPORARY_BIOMETRIC_LOCKOUT',
      `Account face auth temporarily suspended for 5 minutes after ${userRecord.failedAttempts} failed attempts`
    );
  }

  // If IP generates excessive failures across accounts, lock out the IP
  if (ipRecord.failedAttempts >= (MAX_FAILED_ATTEMPTS * 2)) {
    ipRecord.lockedUntil = now + TEMPORARY_LOCKOUT_MS;
    isLocked = true;
    remainingSeconds = Math.ceil(TEMPORARY_LOCKOUT_MS / 1000);

    await logBiometricSecurityEvent(
      null,
      ipKey,
      'IP_BIOMETRIC_LOCKOUT',
      `IP address temporarily locked for 5 minutes after ${ipRecord.failedAttempts} cross-account failures`
    );
  }

  return {
    isLocked,
    failedAttempts: userRecord.failedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - userRecord.failedAttempts),
    remainingSeconds
  };
}

/**
 * Sanitized security event logger:
 * NEVER logs passwords, JWTs, raw face embeddings, encryption keys, or biometric blobs.
 */
export async function logBiometricSecurityEvent(userIdentifier, ipAddress, eventType, description) {
  try {
    // Sanitize parameters to guarantee zero sensitive data exposure
    const safeIp = (ipAddress || '127.0.0.1').substring(0, 45);
    const safeType = (eventType || 'BIOMETRIC_SECURITY').substring(0, 50);
    const safeDesc = (description || '').replace(/(password|jwt|key|token|embedding|secret)=[\w\.-]+/gi, '$1=[REDACTED]');

    // Find user ID if available
    let targetUserId = null;
    if (userIdentifier && !isNaN(Number(userIdentifier))) {
      targetUserId = Number(userIdentifier);
    } else if (userIdentifier) {
      const [u] = await pool.execute('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1', [userIdentifier, userIdentifier]);
      if (u.length > 0) targetUserId = u[0].id;
    }

    await pool.execute(
      'INSERT INTO face_auth_audit_log (user_id, matched, confidence, ip_address, liveness_passed) VALUES (?, 0, 0.0000, ?, 0)',
      [targetUserId, safeIp]
    );

    console.warn(`[BIOMETRIC_SECURITY_EVENT] ${safeType} | User: ${userIdentifier || 'N/A'} | IP: ${safeIp} | ${safeDesc}`);
  } catch (err) {
    console.error('[SECURITY_LOG_ERROR]:', err.message);
  }
}
