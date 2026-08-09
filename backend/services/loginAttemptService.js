import pool from '../db.js';

const WINDOW_MINUTES = 15;
const WARNING_THRESHOLD = 3;
const LOCK_THRESHOLD = 6;
const LOCK_DURATION_MINUTES = 15;

/**
 * Service to manage login attempts, brute-force mitigation, and account protection
 */
export const loginAttemptService = {
  /**
   * Records a failed login attempt and calculates consecutive failure metrics
   */
  async recordFailedAttempt(userId, email, ipAddress, reason = 'INVALID_PASSWORD') {
    try {
      // 1. Insert into failed_login_attempts
      await pool.execute(
        `INSERT INTO failed_login_attempts (user_id, ip_address, reason, attempt_time) 
         VALUES (?, ?, ?, NOW())`,
        [userId || null, ipAddress || '127.0.0.1', reason]
      );

      // 2. Count recent failed attempts within sliding window
      let countQuery;
      let countParams;
      if (userId) {
        countQuery = `SELECT COUNT(*) as cnt FROM failed_login_attempts 
                      WHERE user_id = ? AND attempt_time >= NOW() - INTERVAL ? MINUTE`;
        countParams = [userId, WINDOW_MINUTES];
      } else {
        countQuery = `SELECT COUNT(*) as cnt FROM failed_login_attempts 
                      WHERE ip_address = ? AND attempt_time >= NOW() - INTERVAL ? MINUTE`;
        countParams = [ipAddress || '127.0.0.1', WINDOW_MINUTES];
      }

      const [rows] = await pool.execute(countQuery, countParams);
      const attemptCount = rows[0]?.cnt || 1;

      let accountLocked = false;

      // 3. If failures exceed temporary lock threshold, apply lock (EXCEPT for Admin)
      if (attemptCount >= LOCK_THRESHOLD && userId) {
        const [userRows] = await pool.execute(
          'SELECT role_id, username FROM users WHERE id = ?',
          [userId]
        );
        const isAdm = userRows.length > 0 && (userRows[0].role_id === 1 || (userRows[0].username || '').toLowerCase() === 'admin');

        if (!isAdm) {
          accountLocked = true;
        }
      }

      return {
        attempts: attemptCount,
        isWarning: attemptCount === WARNING_THRESHOLD,
        isLocked: accountLocked
      };
    } catch (error) {
      console.error('[loginAttemptService] Error recording failed attempt:', error);
      return { attempts: 1, isWarning: false, isLocked: false };
    }
  },

  /**
   * Checks if user is currently locked out (>=5 recent failed attempts)
   */
  async checkAccountLocked(userId) {
    if (!userId) return false;
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM failed_login_attempts WHERE user_id = ? AND attempt_time >= NOW() - INTERVAL 15 MINUTE`,
        [userId]
      );
      return (rows[0]?.cnt || 0) >= 5;
    } catch (e) {
      return false;
    }
  },

  /**
   * Resets failed login counters upon successful authentication or admin unlock
   */
  async resetAttempts(userId) {
    if (!userId) return;
    try {
      await pool.execute('DELETE FROM failed_login_attempts WHERE user_id = ?', [userId]);
    } catch (error) {
      console.error('[loginAttemptService] Error resetting attempts:', error);
    }
  }
};
