import pool from '../db.js';

/**
 * Decoupled Face Authentication Rate Limiting & Throttling Service
 * 
 * Manages face authentication attempt thresholds independently of user accounts.
 * NEVER modifies users.status or blocks password authentication.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Checks if face authentication is locked for the given identifier.
 * 
 * @param {string} identifier User identifier (email, username, roll number, employee ID)
 * @returns {Promise<{ locked: boolean, remainingSeconds?: number, lockoutUntil?: string, failedCount: number }>}
 */
export async function checkFaceLockout(identifier) {
    if (!identifier) {
        return { locked: false, failedCount: 0 };
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    try {
        const [rows] = await pool.execute(
            'SELECT failed_count, lockout_until FROM face_failed_attempts WHERE LOWER(identifier) = ?',
            [cleanIdentifier]
        );

        if (rows.length === 0) {
            return { locked: false, failedCount: 0 };
        }

        const record = rows[0];

        if (record.lockout_until) {
            const lockoutTime = new Date(record.lockout_until).getTime();
            const now = Date.now();

            if (lockoutTime > now) {
                const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
                return {
                    locked: true,
                    remainingSeconds,
                    lockoutUntil: record.lockout_until,
                    failedCount: record.failed_count
                };
            }
        }

        return { locked: false, failedCount: record.failed_count };
    } catch (error) {
        console.error('[FACE RATE LIMIT] Error checking lockout:', error.message);
        return { locked: false, failedCount: 0 };
    }
}

/**
 * Records a failed face authentication attempt.
 * Sets 15-minute face cooldown if failed attempts reach 5.
 * 
 * @param {string} identifier User identifier
 * @param {string} ipAddress Client IP address
 * @param {string} reason Failure reason code
 * @returns {Promise<{ failedCount: number, locked: boolean, lockoutUntil?: Date }>}
 */
export async function recordFailedAttempt(identifier, ipAddress = '127.0.0.1', reason = 'FACE_VERIFICATION_FAILED') {
    if (!identifier) {
        throw new Error('Identifier is required to record failed face attempt');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    try {
        const [rows] = await pool.execute(
            'SELECT id, failed_count FROM face_failed_attempts WHERE LOWER(identifier) = ?',
            [cleanIdentifier]
        );

        let newFailedCount = 1;
        let lockoutUntil = null;

        if (rows.length > 0) {
            newFailedCount = rows[0].failed_count + 1;
        }

        const isLocked = newFailedCount >= MAX_FAILED_ATTEMPTS;

        if (isLocked) {
            lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        }

        if (rows.length === 0) {
            await pool.execute(
                'INSERT INTO face_failed_attempts (identifier, failed_count, lockout_until) VALUES (?, ?, ?)',
                [cleanIdentifier, newFailedCount, lockoutUntil]
            );
        } else {
            await pool.execute(
                'UPDATE face_failed_attempts SET failed_count = ?, lockout_until = ? WHERE LOWER(identifier) = ?',
                [newFailedCount, lockoutUntil, cleanIdentifier]
            );
        }

        // Log face rate limit audit event if lockout threshold reached
        if (isLocked) {
            try {
                // Try resolving user_id for audit log
                const [uRows] = await pool.execute(
                    'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
                    [cleanIdentifier, cleanIdentifier]
                );
                const userId = uRows.length > 0 ? uRows[0].id : null;

                await pool.execute(
                    'INSERT INTO face_audit_logs (user_id, identifier, event_type, ip_address, failure_reason) VALUES (?, ?, ?, ?, ?)',
                    [userId, cleanIdentifier, 'FACE_LOGIN_RATE_LIMITED', ipAddress, `Throttled after ${newFailedCount} failed attempts`]
                );
            } catch (auditErr) {
                console.warn('[FACE RATE LIMIT] Audit log notice:', auditErr.message);
            }
        }

        return {
            failedCount: newFailedCount,
            locked: isLocked,
            lockoutUntil
        };
    } catch (error) {
        console.error('[FACE RATE LIMIT] Error recording failed attempt:', error.message);
        throw error;
    }
}

/**
 * Resets face attempt counter upon successful verified password authentication.
 * 
 * @param {string} identifier User identifier
 * @param {boolean} isPasswordAuthenticated Security verification flag
 * @returns {Promise<{ success: boolean }>}
 */
export async function resetFailedAttempts(identifier, isPasswordAuthenticated = false) {
    if (!isPasswordAuthenticated) {
        throw new Error('[SECURITY ERROR] Resetting face cooldown requires verified password authentication.');
    }

    if (!identifier) {
        return { success: true };
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    try {
        await pool.execute(
            'DELETE FROM face_failed_attempts WHERE LOWER(identifier) = ?',
            [cleanIdentifier]
        );
        return { success: true, identifier: cleanIdentifier };
    } catch (error) {
        console.error('[FACE RATE LIMIT] Error resetting attempts:', error.message);
        throw error;
    }
}

export default {
    checkFaceLockout,
    recordFailedAttempt,
    resetFailedAttempts
};
