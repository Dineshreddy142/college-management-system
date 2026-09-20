import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: 'Token is invalid or expired' });
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
            if ((userRoleNorm === 'admin' || userRoleNorm === 'administrator' || userRoleNorm === 'principal' || userRoleNorm === 'systemadmin') && 
                (roleNorm === 'admin' || roleNorm === 'administrator' || roleNorm === 'principal')) {
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
