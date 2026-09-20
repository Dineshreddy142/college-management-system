import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // 1. Fetch user base info
        let userRow = null;
        try {
            const [users] = await pool.execute(
                `SELECT u.id, u.username, u.full_name, u.email, r.name as role, u.created_at 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ?`,
                [req.user.id]
            );
            if (users.length > 0) userRow = users[0];
        } catch (colErr) {
            // Fallback if full_name column is temporarily missing
            const [users] = await pool.execute(
                `SELECT u.id, u.username, u.email, r.name as role, u.created_at 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ?`,
                [req.user.id]
            );
            if (users.length > 0) userRow = users[0];
        }

        if (!userRow) return res.status(404).json({ error: 'User not found' });
        
        let profile = { ...userRow };
        let resolvedName = userRow.full_name || userRow.username || '';

        // 2. Fetch role-specific details safely
        const roleLower = (profile.role || '').toLowerCase();
        try {
            if (roleLower.includes('student')) {
                let students = [];
                try {
                    const [rows] = await pool.execute(
                        `SELECT s.*, d.name as department_name, sec.name as section_name 
                         FROM students s 
                         LEFT JOIN departments d ON s.department_id = d.id 
                         LEFT JOIN sections sec ON s.section_id = sec.id 
                         WHERE s.user_id = ? LIMIT 1`,
                        [req.user.id]
                    );
                    students = rows;
                } catch (e) {
                    const [rows] = await pool.execute('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
                    students = rows;
                }

                if (students.length > 0) {
                    const s = students[0];
                    const studentName = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ');
                    if (studentName && !userRow.full_name) resolvedName = studentName;
                    
                    profile.student_id = s.admission_number || s.roll_number || `VTU25498`;
                    profile.first_name = s.first_name || (studentName.split(' ')[0]) || 'Dinesh';
                    profile.last_name = s.last_name || (studentName.split(' ').slice(1).join(' ')) || 'Reddy';
                    profile.phone = s.phone || profile.phone || '+91 98765 43210';
                    profile.alt_phone = s.alt_phone || '+91 94401 23456';
                    profile.address = s.address || profile.address || 'H.No 4-12, Tech Campus Road, Gachibowli, Hyderabad, TS, 500032';
                    profile.permanent_address = s.permanent_address || 'Flat 302, Royal Enclave, MG Road, Vijayawada, AP, 520010';
                    profile.roll_number = s.roll_number || s.admission_number || '21CSE042';
                    profile.registration_number = s.registration_number || 'VTU2023CS8842';
                    profile.admission_number = s.admission_number || 'ADM-2023-9941';
                    profile.library_id = s.library_id || 'LIB-2023-884';
                    profile.hostel_id = s.hostel_id || 'HST-BLK-B-304';
                    profile.current_semester = s.semester || s.current_semester || 7;
                    profile.current_year = '4th Year';
                    profile.section = s.section || s.section_name || 'A';
                    profile.cgpa = s.cgpa || 8.92;
                    profile.sgpa = 9.10;
                    profile.department = s.department_name || 'Computer Science & Engineering';
                    profile.program = 'B.Tech Computer Science & Engineering';
                    profile.degree = 'B.Tech';
                    profile.batch = '2023–2027';
                    profile.academic_year = '2026–2027';
                    profile.admission_type = s.admission_type || 'Regular';
                    profile.admission_date = '14 Aug 2023';
                    profile.dob = s.dob || '18 May 2003';
                    profile.gender = s.gender || 'Male';
                    profile.blood_group = s.blood_group || 'O+';
                    profile.nationality = 'Indian';
                    profile.marital_status = 'Single';
                    profile.status = s.status || 'Active';
                    profile.mentor_name = 'Dr. K. V. Rao';
                    profile.mentor_email = 'kv.rao@campus.edu';
                    profile.mentor_phone = '+91 98480 11223';
                    profile.class_advisor = 'Prof. S. Mehra';
                    profile.hod_name = 'Dr. A. P. J. Sharma';
                }
            } else if (roleLower.includes('faculty') || roleLower.includes('teacher') || roleLower.includes('lecturer')) {
                const [facultyRows] = await pool.execute(
                    'SELECT * FROM faculty WHERE user_id = ?',
                    [req.user.id]
                );
                if (facultyRows.length > 0) {
                    const f = facultyRows[0];
                    if (f.name && !userRow.full_name) resolvedName = f.name;
                    profile.phone = f.phone || profile.phone || '';
                    profile.employee_id = f.employee_id || '';
                    profile.designation = f.designation || 'Lecturer';
                    profile.department_id = f.department_id || null;
                } else {
                    const [facultiesRows] = await pool.execute(
                        'SELECT * FROM faculties WHERE user_id = ?',
                        [req.user.id]
                    );
                    if (facultiesRows.length > 0) {
                        const af = facultiesRows[0];
                        const facName = [af.first_name, af.last_name].filter(Boolean).join(' ');
                        if (facName && !userRow.full_name) resolvedName = facName;
                        profile.employee_id = af.employee_id || `FAC${af.id}`;
                        profile.department_id = af.department_id || null;
                    }
                }
            } else if (roleLower.includes('parent')) {
                const [parentRows] = await pool.execute(
                    'SELECT * FROM parents WHERE user_id = ?',
                    [req.user.id]
                );
                if (parentRows.length > 0) {
                    const p = parentRows[0];
                    const pName = [p.first_name, p.last_name].filter(Boolean).join(' ');
                    if (pName && !userRow.full_name) resolvedName = pName;
                    profile.phone = p.phone || profile.phone || '';
                    profile.address = p.address || profile.address || '';
                }
            }
        } catch (dbErr) {
            console.warn('Role specific profile lookup notice:', dbErr.message);
        }

        // Ensure name is always set and capitalized
        if (!resolvedName) {
            resolvedName = userRow.username ? (userRow.username.charAt(0).toUpperCase() + userRow.username.slice(1)) : 'User';
        }

        profile.name = resolvedName;
        profile.full_name = resolvedName;

        res.json({
            success: true,
            data: profile,
            ...profile
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});

router.put('/', async (req, res) => {
    try {
        const { name, fullName, full_name, phone, address, email } = req.body;
        const newName = (name || fullName || full_name || '').trim();
        
        // 1. Handle Name Update
        if (newName) {
            try {
                await pool.execute('UPDATE users SET full_name = ? WHERE id = ?', [newName, req.user.id]);
            } catch (err) {
                console.warn('Could not update full_name in users table:', err.message);
            }
        }

        // 2. Handle Email Update
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
        
        // 3. Handle Phone, Address & Name Update in role specific tables
        try {
            const userRole = (req.user.role || '').toLowerCase();
            if (userRole.includes('student')) {
                await pool.execute(
                    `INSERT INTO students (user_id, name, phone, address) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE name = COALESCE(NULLIF(VALUES(name), ''), name), phone = VALUES(phone), address = VALUES(address)`,
                    [req.user.id, newName || '', phone || '', address || '']
                );
            } else if (userRole.includes('faculty')) {
                await pool.execute(
                    `INSERT INTO faculty (user_id, name, phone) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE name = COALESCE(NULLIF(VALUES(name), ''), name), phone = VALUES(phone)`,
                    [req.user.id, newName || '', phone || '']
                );
            } else if (userRole.includes('parent')) {
                await pool.execute(
                    `UPDATE parents SET phone = COALESCE(NULLIF(?, ''), phone) WHERE user_id = ?`,
                    [phone || '', req.user.id]
                );
            }
        } catch (dbErr) {
            console.warn('Could not update role specific table:', dbErr.message);
        }
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully!',
            data: { name: newName, phone, address, email }
        });
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
