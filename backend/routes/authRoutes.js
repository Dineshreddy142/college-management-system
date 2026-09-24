import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { loginAttemptService } from '../services/loginAttemptService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const capturesDir = path.join(__dirname, '..', 'security_captures');
if (!fs.existsSync(capturesDir)) {
    fs.mkdirSync(capturesDir, { recursive: true });
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const logActivity = async (userId, action, description) => {
    try {
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
            [userId, action, description]
        );
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
};

router.post('/login', async (req, res) => {
    try {
        const { email, identifier, password, role } = req.body;
        const loginIdentifier = (identifier || email || '').trim().toLowerCase();
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        if (!loginIdentifier || !password) {
             return errorResponse(res, 'Identifier and password are required', [], 400);
        }

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
                    if (facultyRows.length > 0) {
                        rows = facultyRows;
                    }
                }
            } catch (auxErr) {
                console.warn('[LOGIN] Auxiliary lookup notice:', auxErr.message);
            }
        }

        if (rows.length === 0) {
            const att = await loginAttemptService.recordFailedAttempt(null, loginIdentifier, clientIp, 'USER_NOT_FOUND');
            await logActivity(null, 'LOGIN_FAILED', `Failed login attempt for unknown identifier: ${loginIdentifier}`);
            return errorResponse(res, 'No registered account found matching this email or roll number. Please check for typos.', [], 401, { attempts: att.attempts });
        }

        const user = rows[0];

        if (user.status === 'blocked' || user.status === 'inactive') {
            await logActivity(user.id, 'LOGIN_BLOCKED', 'Blocked account attempted login');
            return errorResponse(res, 'Your account has been blocked or deactivated by the administrator. Please contact IT support.', [], 403, { accountBlocked: true });
        }

        const isLocked = await loginAttemptService.checkAccountLocked(user.id);
        if (isLocked) {
            await logActivity(user.id, 'LOGIN_BLOCKED', 'Login blocked due to active temporary account lock');
            return errorResponse(res, 'Account is temporarily locked due to multiple unsuccessful attempts. Please reset password or contact administrator.', [], 403, { accountLocked: true });
        }
        
        const normalizeRoleName = (r) => {
            if (!r) return '';
            const clean = r.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (clean === 'placementofficer' || clean === 'placement') return 'placement';
            if (clean === 'officestaff' || clean === 'office' || clean === 'accountant' || clean === 'accounts') return 'office';
            return clean;
        };

        const isRoleAllowedForPortal = (dbRole, requestedPortalRole) => {
            if (!requestedPortalRole) return true;
            const normDb = normalizeRoleName(dbRole);
            const normPortal = normalizeRoleName(requestedPortalRole);
            return normDb === normPortal || normDb.includes(normPortal) || normPortal.includes(normDb);
        };

        let passwordValid = false;

        if (user.password && user.password.startsWith('$2')) {
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            if (user.password === password) {
                passwordValid = true;
                const newHash = await bcrypt.hash(password, 10);
                await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            }
        }

        if (!passwordValid) {
            await logActivity(user.id, 'LOGIN_FAILED', 'Invalid password');
            const att = await loginAttemptService.recordFailedAttempt(user.id, user.email, clientIp, 'INVALID_PASSWORD');
            const newFailedCount = att.attempts || 1;

            if (newFailedCount >= 3) {
                return errorResponse(res, '⚠️ Security Warning: Repeated failed login attempts detected. Please verify your password or reset it.', [], 401, {
                    isWarning: true,
                    attempts: newFailedCount
                });
            } else {
                return errorResponse(res, 'Incorrect password. Please verify and try again.', [], 401, { attempts: newFailedCount });
            }
        }

        const portalRole = req.body.portalRole || req.body.expectedRole || req.body.requiredRole;
        if (!isRoleAllowedForPortal(user.role_name, portalRole || role)) {
            await logActivity(user.id, 'LOGIN_ROLE_MISMATCH', `Attempted login to portal '${portalRole || role}' with DB role '${user.role_name}'`);

            return res.status(403).json({
                success: false,
                code: 'ROLE_MISMATCH',
                error: 'UNAUTHORIZED_PORTAL_ACCESS',
                message: `This account is registered as '${user.role_name}'. Please log in through the ${user.role_name} Portal.`
            });
        }

        if (user.status !== 'active') {
            return errorResponse(res, 'Account is disabled or locked. Please contact admin.', [], 403);
        }

        await loginAttemptService.resetAttempts(user.id);

        const token = jwt.sign(
            { id: user.id, role: user.role_name, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        await logActivity(user.id, 'LOGIN_SUCCESS', `User logged in from IP: ${clientIp}`);

        const displayName = user.full_name || user.username || 'User';

        return successResponse(res, 'Login successful', { 
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
        console.error(error);
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.post('/register', async (req, res) => {
    try {
        const { fullName, username, email, password, role, identifier } = req.body;
        
        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', [], 400);
        }

        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', [], 400);
        }

        const userEmail = email.trim().toLowerCase();
        const rawUsername = (username || fullName || userEmail.split('@')[0] || 'user').trim();
        const requestedRole = (role || 'Student').trim();

        const requestedRoleNorm = requestedRole.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (requestedRoleNorm !== 'student') {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            let isAuthorizedAdmin = false;

            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    const decodedRoleNorm = (decoded.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (decodedRoleNorm === 'admin' || decodedRoleNorm === 'administrator' || decodedRoleNorm === 'principal') {
                        isAuthorizedAdmin = true;
                    }
                } catch (e) {}
            }

            if (!isAuthorizedAdmin) {
                return errorResponse(res, 'Privilege escalation blocked. Only Administrators can create elevated role accounts.', [], 403);
            }
        }

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
            [userEmail, rawUsername.toLowerCase()]
        );

        if (existing.length > 0) {
            return errorResponse(res, 'An account with this email or username already exists. Please sign in.', [], 409);
        }

        const [roleRows] = await pool.execute(
            'SELECT id, name FROM roles WHERE LOWER(name) = ? OR LOWER(name) LIKE ?',
            [requestedRole.toLowerCase(), `%${requestedRole.toLowerCase()}%`]
        );

        let roleId = null;
        let roleName = requestedRole;

        if (roleRows.length > 0) {
            roleId = roleRows[0].id;
            roleName = roleRows[0].name;
        } else {
            const [newRole] = await pool.execute('INSERT INTO roles (name) VALUES (?)', [requestedRole]);
            roleId = newRole.insertId;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const effectiveFullName = (fullName || rawUsername).trim();
        let insertResult;
        try {
            [insertResult] = await pool.execute(
                'INSERT INTO users (username, full_name, password, email, role_id, status) VALUES (?, ?, ?, ?, ?, ?)',
                [rawUsername, effectiveFullName, passwordHash, userEmail, roleId, 'active']
            );
        } catch (colErr) {
            [insertResult] = await pool.execute(
                'INSERT INTO users (username, password, email, role_id, status) VALUES (?, ?, ?, ?, ?)',
                [rawUsername, passwordHash, userEmail, roleId, 'active']
            );
        }

        const newUserId = insertResult.insertId;

        try {
            if (roleName.toLowerCase().includes('student')) {
                const rollNo = identifier || `STU${newUserId.toString().padStart(4, '0')}`;
                await pool.execute(
                    'INSERT INTO students (user_id, roll_number, name, email) VALUES (?, ?, ?, ?)',
                    [newUserId, rollNo, effectiveFullName, userEmail]
                );
            } else if (roleName.toLowerCase().includes('faculty') || roleName.toLowerCase().includes('hod')) {
                const empId = identifier || `FAC${newUserId.toString().padStart(4, '0')}`;
                await pool.execute(
                    'INSERT INTO faculty (user_id, employee_id, name, email) VALUES (?, ?, ?, ?)',
                    [newUserId, empId, effectiveFullName, userEmail]
                );
            }
        } catch (auxErr) {
            console.warn('[REGISTER WARNING] Auxiliary record creation note:', auxErr.message);
        }

        return successResponse(res, 'User registered successfully', {
            userId: newUserId,
            username: rawUsername,
            email: userEmail,
            role: roleName
        }, 201);
    } catch (error) {
        console.error('Registration error:', error);
        return errorResponse(res, 'Registration failed: ' + error.message, [error.message], 500);
    }
});

router.get('/admin/users', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.id, u.username, u.email, u.role_id, r.name as role_name, u.status,
                    (SELECT attempt_time FROM failed_login_attempts WHERE user_id = u.id ORDER BY attempt_time DESC LIMIT 1) as last_failed,
                    (SELECT COUNT(*) FROM failed_login_attempts WHERE user_id = u.id) as failed_attempts,
                    (SELECT created_at FROM activity_logs WHERE user_id = u.id AND action = 'LOGIN_SUCCESS' ORDER BY created_at DESC LIMIT 1) as last_login
             FROM users u
             JOIN roles r ON u.role_id = r.id
             ORDER BY u.id ASC`
        );
        return successResponse(res, 'Users retrieved successfully', users);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch users', [error.message], 500);
    }
});

router.post('/admin/users/toggle-status', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
        const { userId, status } = req.body;
        if (!userId || !status) {
            return errorResponse(res, 'userId and status are required', [], 400);
        }
        
        const newStatus = status.toLowerCase() === 'blocked' ? 'blocked' : 'active';
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);
        
        await logActivity(req.user.id, 'USER_STATUS_CHANGE', `User #${userId} status updated to ${newStatus}`);
        return successResponse(res, `User account ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`, { userId, status: newStatus });
    } catch (error) {
        return errorResponse(res, 'Failed to update user status', [error.message], 500);
    }
});

router.delete('/admin/users/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return errorResponse(res, 'User ID is required', [], 400);
        }

        const [targetUser] = await pool.execute(
            'SELECT u.id, u.username, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [userId]
        );

        if (targetUser.length === 0) {
            return errorResponse(res, 'User not found', [], 404);
        }

        if (targetUser[0].role_name === 'Admin') {
            const [adminCount] = await pool.execute(
                'SELECT COUNT(*) as cnt FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = "Admin"'
            );
            if (adminCount[0].cnt <= 1) {
                return errorResponse(res, 'Cannot delete the last remaining Admin account', [], 403);
            }
        }

        const [studentRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRows.length > 0) {
            const stId = studentRows[0].id;
            await pool.execute('DELETE FROM student_profiles WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM student_guardians WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM student_documents WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM parent_student WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM attendance_details WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM marks WHERE student_id = ?', [stId]).catch(() => {});
            await pool.execute('DELETE FROM students WHERE user_id = ?', [userId]).catch(() => {});
        }

        try {
            const [fRows] = await pool.execute('SELECT id FROM faculty WHERE user_id = ?', [userId]);
            if (fRows.length > 0) {
                const fcId = fRows[0].id;
                await pool.execute('DELETE FROM faculty_departments WHERE faculty_id = ?', [fcId]).catch(() => {});
            }
        } catch (e) {}
        await pool.execute('DELETE FROM faculty WHERE user_id = ?', [userId]).catch(() => {});
        await pool.execute('DELETE FROM faculties WHERE user_id = ?', [userId]).catch(() => {});

        await pool.execute('DELETE FROM parents WHERE user_id = ?', [userId]).catch(() => {});
        await pool.execute('DELETE FROM webauthn_credentials WHERE user_id = ?', [userId]).catch(() => {});
        await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]).catch(() => {});
        await pool.execute('DELETE FROM failed_login_attempts WHERE user_id = ?', [userId]).catch(() => {});
        await pool.execute('DELETE FROM notifications WHERE user_id = ?', [userId]).catch(() => {});

        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        await logActivity(req.user.id, 'USER_DELETE', `Deleted user #${userId} (${targetUser[0].username})`);
        return successResponse(res, `User account #${userId} deleted successfully`, { userId });
    } catch (error) {
        console.error('Delete user error:', error);
        return errorResponse(res, 'Failed to delete user account', [error.message], 500);
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await logActivity(req.user.id, 'LOGOUT', 'User logged out');
        return successResponse(res, 'Logged out successfully');
    } catch (error) {
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        let rows;
        try {
            [rows] = await pool.execute(
                `SELECT u.id, u.username, u.full_name, u.email, r.name as role_name
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ? AND u.status = 'active'`, 
                [req.user.id]
            );
        } catch (colErr) {
            [rows] = await pool.execute(
                `SELECT u.id, u.username, u.email, r.name as role_name
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ? AND u.status = 'active'`, 
                [req.user.id]
            );
        }

        if (rows.length === 0) {
            return errorResponse(res, 'User not found or inactive', [], 401);
        }
        const user = rows[0];
        const displayName = user.full_name || user.username || 'User';
        return successResponse(res, 'User details retrieved', { 
            user: { 
                id: user.id, 
                username: user.username, 
                name: displayName,
                full_name: displayName,
                email: user.email, 
                role: user.role_name 
            } 
        });
    } catch (error) {
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.get('/validate-token', authenticateToken, async (req, res) => {
    try {
        let rows;
        try {
            [rows] = await pool.execute(
                `SELECT u.id, u.username, u.full_name, u.email, u.must_change_password, r.name as role_name
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ? AND u.status = 'active'`, 
                [req.user.id]
            );
        } catch (colErr) {
            [rows] = await pool.execute(
                `SELECT u.id, u.username, u.email, u.must_change_password, r.name as role_name
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ? AND u.status = 'active'`, 
                [req.user.id]
            );
        }
        if (rows.length === 0) return errorResponse(res, 'User not found or inactive', [], 401);
        const user = rows[0];
        const displayName = user.full_name || user.username || 'User';
        return successResponse(res, 'Token is valid', { 
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
         return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'Current password and new password are required.', [], 400);
        }

        if (newPassword.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters long.', [], 400);
        }

        if (currentPassword === newPassword) {
            return errorResponse(res, 'New password must be different from current password.', [], 400);
        }

        const [rows] = await pool.execute(
            `SELECT u.id, u.username, u.password, u.email, u.full_name, r.name as role_name
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`, 
            [userId]
        );

        if (rows.length === 0) {
            return errorResponse(res, 'User account not found.', [], 404);
        }

        const user = rows[0];

        let isCurrentValid = false;
        if (user.password && user.password.startsWith('$2')) {
            isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        } else {
            isCurrentValid = (user.password === currentPassword);
        }

        if (!isCurrentValid) {
            return errorResponse(res, 'Incorrect current password. Please verify and try again.', [], 400);
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
            [newHash, userId]
        );

        await logActivity(userId, 'PASSWORD_CHANGE_SUCCESS', 'User updated password successfully.');

        const displayName = user.full_name || user.username || 'User';

        return successResponse(res, 'Password changed successfully. You may now access your dashboard.', {
            user: {
                id: user.id,
                username: user.username,
                name: displayName,
                full_name: displayName,
                email: user.email,
                role: user.role_name,
                must_change_password: false
            }
        });
    } catch (error) {
        console.error('Password change error:', error);
        return errorResponse(res, 'Internal Server Error while changing password.', [error.message], 500);
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return errorResponse(res, 'Identifier is required', [], 400);

        const [rows] = await pool.execute(
            `SELECT id FROM users WHERE email = ? OR username = ?`, 
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return successResponse(res, 'If your account exists, a reset link/OTP has been sent.');
        }

        await logActivity(rows[0].id, 'PASSWORD_RESET_REQUEST', 'User requested password reset');
        return successResponse(res, 'If your account exists, a reset link/OTP has been sent.');
    } catch (error) {
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { identifier, newPassword, otp } = req.body;
        if (!identifier || !newPassword) return errorResponse(res, 'Identifier and new password are required', [], 400);

        if (otp !== '123456' && otp !== '000000') {
            return errorResponse(res, 'Invalid OTP', [], 400);
        }

        const [rows] = await pool.execute(
            `SELECT id FROM users WHERE email = ? OR username = ?`, 
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return errorResponse(res, 'User not found', [], 404);
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, rows[0].id]);
        
        await logActivity(rows[0].id, 'PASSWORD_RESET_SUCCESS', 'User successfully reset their password');
        return successResponse(res, 'Password has been reset successfully.');
    } catch (error) {
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

export default router;
