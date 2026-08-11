import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.id, u.username as name, u.email, r.name as role, u.created_at 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        
        let profile = { ...users[0] };
        
        try {
            // Fetch role-specific details
            if (profile.role && profile.role.toLowerCase() === 'student') {
                const [students] = await pool.execute(
                    'SELECT phone, address, roll_number, current_semester FROM students WHERE user_id = ?',
                    [req.user.id]
                );
                if (students.length > 0) Object.assign(profile, students[0]);
            } else if (profile.role && profile.role.toLowerCase() === 'faculty') {
                const [faculties] = await pool.execute(
                    'SELECT phone, employee_id, designation FROM faculty WHERE user_id = ?',
                    [req.user.id]
                );
                if (faculties.length > 0) {
                    Object.assign(profile, faculties[0]);
                } else {
                    const [altFaculties] = await pool.execute(
                        'SELECT phone, employee_id, designation FROM faculties WHERE user_id = ?',
                        [req.user.id]
                    );
                    if (altFaculties.length > 0) Object.assign(profile, altFaculties[0]);
                }
            }
        } catch (dbErr) {
            console.warn('Role specific profile tables may not exist yet:', dbErr.message);
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/', async (req, res) => {
    try {
        const { phone, address, email } = req.body;
        
        // Handle Email Update
        if (email && typeof email === 'string' && email.trim()) {
            const cleanEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
            }

            // Check if email is already in use by another user
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
                [cleanEmail, req.user.id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'This email address is already in use by another account.' });
            }

            // Update email in users table
            await pool.execute('UPDATE users SET email = ? WHERE id = ?', [cleanEmail, req.user.id]);
            
            // Sync with role auxiliary tables
            try {
                await pool.execute('UPDATE students SET email = ? WHERE user_id = ?', [cleanEmail, req.user.id]);
                await pool.execute('UPDATE faculty SET email = ? WHERE user_id = ?', [cleanEmail, req.user.id]);
            } catch (auxErr) {
                console.warn('Auxiliary email update notice:', auxErr.message);
            }
        }
        
        // Handle Phone & Address Update
        try {
            const userRole = (req.user.role || '').toLowerCase();
            if (userRole === 'student') {
                await pool.execute(
                    `INSERT INTO students (user_id, phone, address) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE phone = VALUES(phone), address = VALUES(address)`,
                    [req.user.id, phone || '', address || '']
                );
            } else if (userRole === 'faculty') {
                await pool.execute(
                    `INSERT INTO faculty (user_id, phone, address) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE phone = VALUES(phone), address = VALUES(address)`,
                    [req.user.id, phone || '', address || '']
                );
            }
        } catch (dbErr) {
            console.warn('Could not update role specific table:', dbErr.message);
        }
        
        res.json({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});

// Dedicated Email Update Endpoint
router.put('/email', async (req, res) => {
    try {
        const { newEmail, password } = req.body;
        if (!newEmail || typeof newEmail !== 'string' || !newEmail.trim()) {
            return res.status(400).json({ success: false, message: 'New email address is required.' });
        }

        const cleanEmail = newEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format.' });
        }

        // Verify password if provided
        if (password) {
            const [userRows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
            if (userRows.length > 0) {
                let isValid = false;
                if (userRows[0].password.startsWith('$2')) {
                    isValid = await bcrypt.compare(password, userRows[0].password);
                } else {
                    isValid = (userRows[0].password === password);
                }
                if (!isValid) {
                    return res.status(401).json({ success: false, message: 'Incorrect account password.' });
                }
            }
        }

        // Check if email already in use
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
            [cleanEmail, req.user.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This email address is already in use by another account.' });
        }

        // Update email in users table
        await pool.execute('UPDATE users SET email = ? WHERE id = ?', [cleanEmail, req.user.id]);
        
        try {
            await pool.execute('UPDATE students SET email = ? WHERE user_id = ?', [cleanEmail, req.user.id]);
            await pool.execute('UPDATE faculty SET email = ? WHERE user_id = ?', [cleanEmail, req.user.id]);
        } catch (e) {}

        res.json({ success: true, message: 'Email address updated successfully!' });
    } catch (error) {
        console.error('Email update error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    }
});

export default router;
