import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { authenticateToken, authorizeRole } from './middleware.js';
import { successResponse, errorResponse } from './utils/response.js';
import { loginAttemptService } from './services/loginAttemptService.js';
import { sendTestEmail } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const capturesDir = path.join(__dirname, 'security_captures');
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

        // Query user and join role name
        const [rows] = await pool.execute(
            `SELECT u.*, r.name as role_name
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE LOWER(u.email) = ? OR LOWER(u.username) = ?`, 
            [loginIdentifier, loginIdentifier]
        );

        if (rows.length === 0) {
            const att = await loginAttemptService.recordFailedAttempt(null, loginIdentifier, clientIp, 'USER_NOT_FOUND');
            await logActivity(null, 'LOGIN_FAILED', `Failed login attempt for unknown identifier: ${loginIdentifier}`);
            return errorResponse(res, 'Invalid credentials', [], 401, { attempts: att.attempts });
        }

        const user = rows[0];

        // Check if account is temporarily locked due to brute-force rate limit
        const isLocked = await loginAttemptService.checkAccountLocked(user.id);
        if (isLocked) {
            await logActivity(user.id, 'LOGIN_BLOCKED', 'Login blocked due to active temporary account lock');
            return errorResponse(res, 'Account is temporarily locked due to multiple unsuccessful attempts. Please reset password or contact administrator.', [], 403, { accountLocked: true });
        }
        
        // Helper for Role Normalization and Validation
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

        // Check if password is a bcrypt hash
        if (user.password && user.password.startsWith('$2')) {
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext fallback & auto-upgrade
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

            // Wrong Password #4+: Trigger suspicious-login security workflow with camera capture
            if (newFailedCount >= 4) {
                console.log(`[SECURITY] Suspicious login threshold reached for email: ${user.email}`);
                return errorResponse(res, 'Multiple unsuccessful login attempts detected.', [], 401, {
                    securityCaptureRequired: true,
                    triggerFaceCapture: true,
                    userId: user.id,
                    email: user.email,
                    role: user.role_name,
                    attempts: newFailedCount
                });
            } else if (newFailedCount === 3) {
                return errorResponse(res, '⚠️ Security Warning: 3 consecutive failed login attempts detected.', [], 401, {
                    isWarning: true,
                    attempts: 3
                });
            } else {
                return errorResponse(res, 'Invalid credentials or unauthorized portal access.', [], 401, { attempts: newFailedCount });
            }
        }

        // 4. Password Valid -> Check Server-Side Database Role against Requested Portal Role
        const portalRole = req.body.portalRole || req.body.expectedRole || req.body.requiredRole;
        if (!isRoleAllowedForPortal(user.role_name, portalRole || role)) {
            await logActivity(user.id, 'LOGIN_ROLE_MISMATCH', `Attempted login to portal '${portalRole || role}' with DB role '${user.role_name}'`);

            return res.status(403).json({
                success: false,
                code: 'ROLE_MISMATCH',
                error: 'UNAUTHORIZED_PORTAL_ACCESS',
                message: 'Invalid credentials or unauthorized portal access.'
            });
        }

        if (user.status !== 'active') {
            return errorResponse(res, 'Account is disabled or locked. Please contact admin.', [], 403);
        }

        // Reset failed_login_attempts to 0 on successful login
        await loginAttemptService.resetAttempts(user.id);

        const token = jwt.sign(
            { id: user.id, role: user.role_name, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        await logActivity(user.id, 'LOGIN_SUCCESS', `User logged in from IP: ${clientIp}`);

        return successResponse(res, 'Login successful', { 
            token, 
            user: { id: user.id, username: user.username, email: user.email, role: user.role_name } 
        });
    } catch (error) {
        console.error(error);
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

// Diagnostic test-email endpoint for admin verification
const handleTestEmailEndpoint = async (req, res) => {
    try {
        const { toEmail } = req.body || {};
        const target = toEmail || 'nuthanakalvadineshreddy@gmail.com';
        console.log(`[SECURITY] Initiating diagnostic test email to: ${target}`);
        const result = await sendTestEmail({ toEmail: target });
        return successResponse(res, 'Test email processed successfully', result);
    } catch (error) {
        console.error('[SECURITY] Diagnostic test email error:', error.message);
        return errorResponse(res, 'Failed to send test email', [error.message], 500);
    }
};

router.post('/admin/security/test-email', handleTestEmailEndpoint);
router.post('/security/test-email', handleTestEmailEndpoint);

// Admin users list endpoint
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
        const [rows] = await pool.execute(
            `SELECT u.id, u.username, u.email, r.name as role_name
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.status = 'active'`, 
            [req.user.id]
        );

        if (rows.length === 0) {
            return errorResponse(res, 'User not found or inactive', [], 401);
        }
        const user = rows[0];
        return successResponse(res, 'User details retrieved', { 
            user: { id: user.id, username: user.username, email: user.email, role: user.role_name } 
        });
    } catch (error) {
        return errorResponse(res, 'Internal Server Error', [error.message], 500);
    }
});

router.get('/validate-token', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT u.id, u.username, u.email, r.name as role_name
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.status = 'active'`, 
            [req.user.id]
        );
        if (rows.length === 0) return errorResponse(res, 'User not found or inactive', [], 401);
        const user = rows[0];
        return successResponse(res, 'Token is valid', { 
            user: { id: user.id, username: user.username, email: user.email, role: user.role_name } 
        });
    } catch (error) {
         return errorResponse(res, 'Internal Server Error', [error.message], 500);
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
            // Return success even if not found to prevent user enumeration
            return successResponse(res, 'If your account exists, a reset link/OTP has been sent.');
        }

        // Mock sending OTP / Link
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

        // In a real system, we'd verify the OTP here. We are simulating a successful OTP verification.
        if (otp !== '123456' && otp !== '000000') {
            return errorResponse(res, 'Invalid OTP', [], 400); // Mock check
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

// ============================================================
// SECURE FACE BIOMETRIC AUTHENTICATION API ENDPOINTS
// ============================================================
const upload = multer({ storage: multer.memoryStorage() });
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5001';

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

// Check Face Registration Status
router.get('/auth/face-status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT user_id, created_at FROM face_embeddings WHERE user_id = ?', [req.user.id]);
        return successResponse(res, 'Face status retrieved', {
            registered: rows.length > 0,
            registered_at: rows.length > 0 ? rows[0].created_at : null
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch face status', [error.message], 500);
    }
});

// 3D Multi-Angle Face Registration Endpoint with Strict Anti-Duplication Enforcement
router.post('/auth/face-register', authenticateToken, upload.any(), async (req, res) => {
    try {
        const files = req.files || [];
        if (files.length === 0 && !req.file) {
            return errorResponse(res, 'No image files provided for 3D face registration', [], 400);
        }

        const formData = new FormData();
        formData.append('user_id', String(req.user.id));

        // Append all 3D angle images (Center, Left, Right, Tilt)
        for (const file of files) {
            const blob = new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' });
            formData.append('images', blob, file.originalname || 'face_pose.jpg');
        }

        // Support single file fallback if uploaded via single field
        if (req.file) {
            const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
            formData.append('image', blob, req.file.originalname || 'face.jpg');
        }

        const response = await fetch(`${FACE_SERVICE_URL}/register`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            return errorResponse(res, data.message || '3D face registration failed', [], response.status || 400);
        }

        try {
            await pool.execute('UPDATE users SET face_registered = 1 WHERE id = ?', [req.user.id]);
        } catch (e) {
            console.error('Note updating face_registered flag:', e.message);
        }

        await logActivity(req.user.id, 'FACE_REGISTERED_3D', 'User successfully registered 3D multi-pose face biometrics');
        return successResponse(res, '3D Multi-Angle Face registered successfully', data.data);
    } catch (error) {
        console.error('Face register proxy error:', error);
        return errorResponse(res, 'Face biometric service unavailable. Ensure Python microservice is running.', [error.message], 500);
    }
});

// Face Login Endpoint (Issues 24h JWT Token ONLY on verified face match)
router.post('/auth/face-login', upload.single('image'), async (req, res) => {
    try {
        const { portalRole } = req.body;
        if (!req.file) {
            return errorResponse(res, 'No image file provided', [], 400);
        }

        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
        formData.append('image', blob, req.file.originalname || 'face.jpg');

        const response = await fetch(`${FACE_SERVICE_URL}/identify`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok || !data.success || !data.data?.matched || !data.data?.user_id) {
            return errorResponse(res, data.message || 'Face identification failed or no match found', [], 401);
        }

        const matchedUserId = data.data.user_id;

        // Fetch user from DB
        const [rows] = await pool.execute(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? AND u.status = 'active'`,
            [matchedUserId]
        );

        if (rows.length === 0) {
            return errorResponse(res, 'Account not found or inactive', [], 401);
        }

        const user = rows[0];

        // Validate portal role isolation
        if (portalRole && !isRoleAllowedForPortal(user.role_name, portalRole)) {
            return res.status(403).json({
                success: false,
                code: 'ROLE_MISMATCH',
                message: `Your role (${user.role_name}) does not have permission to access the ${portalRole.toUpperCase()} portal.`
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role_name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await logActivity(user.id, 'FACE_LOGIN_SUCCESS', `User logged in via face recognition on ${portalRole || 'portal'}`);

        return successResponse(res, 'Face login successful', {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        return errorResponse(res, 'Face biometric service unavailable', [error.message], 500);
    }
});

// Remove Registered Face Data
router.delete('/auth/face-remove', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM face_embeddings WHERE user_id = ?', [req.user.id]);
        await pool.execute('UPDATE users SET face_registered = 0 WHERE id = ?', [req.user.id]);
        await logActivity(req.user.id, 'FACE_REMOVED', 'User removed face biometric data');
        return successResponse(res, 'Face biometric data removed successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to remove face data', [error.message], 500);
    }
});

export default router;
