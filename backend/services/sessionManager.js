import pool from '../db.js';

// In-memory cache for ultra-fast (0ms) single-session validation
const activeSessionsMap = new Map();

/**
 * Ensures session_version column exists on users table
 */
export async function ensureSessionColumn() {
  try {
    const [cols] = await pool.query('DESCRIBE users');
    const colNames = cols.map(c => c.Field);
    if (!colNames.includes('session_version')) {
      await pool.query('ALTER TABLE users ADD COLUMN session_version INT DEFAULT 1');
      console.log('[SESSION MANAGER] Added session_version column to users table.');
    }
  } catch (err) {
    console.warn('[SESSION MANAGER] Column check notice:', err.message);
  }
}

// Ensure column on module import
ensureSessionColumn();

/**
 * Called when a user logs in (Password, Face Auth, Passkey).
 * Increments DB session_version and updates in-memory cache.
 * Returns the new session version to include in the JWT.
 */
export async function createNewSession(userId) {
  try {
    await pool.execute(
      `UPDATE users SET session_version = COALESCE(session_version, 0) + 1 WHERE id = ?`,
      [userId]
    );

    const [rows] = await pool.execute(
      `SELECT session_version FROM users WHERE id = ?`,
      [userId]
    );

    const newVersion = rows.length > 0 && rows[0].session_version ? rows[0].session_version : 1;
    activeSessionsMap.set(Number(userId), Number(newVersion));
    return newVersion;
  } catch (err) {
    console.error('[SESSION MANAGER] Failed to create new session:', err);
    return 1;
  }
}

/**
 * Checks if the JWT session_version matches the current active session version.
 * Returns true if valid, false if logged in on another device.
 */
export async function isSessionValid(userId, tokenSessionVersion) {
  if (!userId) return false;
  
  // If token doesn't carry session_version (legacy token), pass check
  if (tokenSessionVersion === undefined || tokenSessionVersion === null) {
    return true;
  }

  const numUserId = Number(userId);
  const numTokenVersion = Number(tokenSessionVersion);

  // 1. Fast path: check in-memory cache
  if (activeSessionsMap.has(numUserId)) {
    const currentActiveVersion = activeSessionsMap.get(numUserId);
    return numTokenVersion === currentActiveVersion;
  }

  // 2. Fallback path: query DB and populate cache
  try {
    const [rows] = await pool.execute(
      `SELECT session_version FROM users WHERE id = ?`,
      [numUserId]
    );

    if (rows.length === 0) return false;
    
    const dbVersion = rows[0].session_version ? Number(rows[0].session_version) : 1;
    activeSessionsMap.set(numUserId, dbVersion);

    return numTokenVersion === dbVersion;
  } catch (err) {
    console.error('[SESSION MANAGER] Error validating session:', err);
    return true; // Graceful degradation on DB error
  }
}

/**
 * Clears in-memory session cache on logout
 */
export function invalidateSessionCache(userId) {
  activeSessionsMap.delete(Number(userId));
}
