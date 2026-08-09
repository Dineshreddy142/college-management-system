import express from 'express';
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
            if (profile.role.toLowerCase() === 'student') {
                const [students] = await pool.execute(
                    'SELECT phone, address, roll_number, current_semester FROM students WHERE user_id = ?',
                    [req.user.id]
                );
                if (students.length > 0) Object.assign(profile, students[0]);
            } else if (profile.role.toLowerCase() === 'faculty') {
                const [faculties] = await pool.execute(
                    'SELECT phone, employee_id, designation FROM faculties WHERE user_id = ?',
                    [req.user.id]
                );
                if (faculties.length > 0) Object.assign(profile, faculties[0]);
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
        const { phone, address } = req.body;
        
        try {
            if (req.user.role.toLowerCase() === 'student') {
                await pool.execute(
                    'UPDATE students SET phone = ?, address = ? WHERE user_id = ?',
                    [phone, address, req.user.id]
                );
            } else if (req.user.role.toLowerCase() === 'faculty') {
                await pool.execute(
                    'UPDATE faculties SET phone = ? WHERE user_id = ?',
                    [phone, req.user.id]
                );
            }
        } catch (dbErr) {
            console.warn('Could not update role specific table:', dbErr.message);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
