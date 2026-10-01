import jwt from 'jsonwebtoken';
import { isSessionValid } from './services/sessionManager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.status(401).json({ error: 'Token is invalid or expired' });

        // Validate single active session across devices
        if (user && user.id && user.session_version !== undefined) {
            const isValid = await isSessionValid(user.id, user.session_version);
            if (!isValid) {
                return res.status(401).json({
                    error: 'Your account was logged in from another device. Please log in again.',
                    code: 'LOGGED_IN_ELSEWHERE',
                    loggedOutRemote: true
                });
            }
        }

        req.user = user;
        next();
    });
};

export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access denied, insufficient permissions' });
        }

        const userRoleNorm = req.user.role.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const isAllowed = allowedRoles.some(role => {
            const roleNorm = role.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (roleNorm === userRoleNorm) return true;
            
            const executiveRoles = [
                'admin', 'administrator', 'systemadmin', 'principal', 
                'chancellor', 'vicechancellor', 'registrar', 'coe', 
                'controllerofexaminations', 'dean', 'hod'
            ];
            
            if (executiveRoles.includes(userRoleNorm) && (roleNorm === 'admin' || roleNorm === 'administrator' || executiveRoles.includes(roleNorm))) {
                return true;
            }
            return false;
        });

        if (!isAllowed) {
            return res.status(403).json({ error: 'Access denied, insufficient permissions' });
        }
        next();
    };
};
