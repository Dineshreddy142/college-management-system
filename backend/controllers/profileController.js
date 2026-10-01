import pool from '../db.js';
import bcrypt from 'bcryptjs';

// Auto-ensure avatar and comprehensive profile columns exist in users table
(async () => {
    const columns = [
        `full_name VARCHAR(150) NULL`,
        `first_name VARCHAR(100) NULL`,
        `last_name VARCHAR(100) NULL`,
        `department VARCHAR(150) NULL`,
        `phone VARCHAR(25) NULL`,
        `alt_phone VARCHAR(25) NULL`,
        `designation VARCHAR(100) NULL`,
        `address TEXT NULL`,
        `permanent_address TEXT NULL`,
        `emergency_contact_name VARCHAR(150) NULL`,
        `emergency_contact_relation VARCHAR(100) NULL`,
        `emergency_contact_phone VARCHAR(25) NULL`,
        `dob VARCHAR(50) NULL`,
        `gender VARCHAR(20) NULL`,
        `blood_group VARCHAR(10) NULL`,
        `nationality VARCHAR(50) NULL`,
        `marital_status VARCHAR(50) NULL`,
        `employee_id VARCHAR(50) NULL`,
        `student_id VARCHAR(50) NULL`,
        `avatar LONGTEXT NULL`
    ];
    for (const colDef of columns) {
        try {
            await pool.execute(`ALTER TABLE users ADD COLUMN ${colDef}`);
        } catch (e) {}
    }
})();

export const getProfile = async (req, res) => {
    try {
        let userRow = null;
        try {
            const [users] = await pool.execute(
                `SELECT u.*, r.name as role 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ?`,
                [req.user.id]
            );
            if (users.length > 0) userRow = users[0];
        } catch (colErr) {
            console.warn('Profile fetch query warning:', colErr.message);
            const [users] = await pool.execute(
                `SELECT u.id, u.username, u.full_name, u.email, u.avatar, r.name as role, u.created_at 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ?`,
                [req.user.id]
            );
            if (users.length > 0) userRow = users[0];
        }

        if (!userRow) return res.status(404).json({ error: 'User not found' });

        delete userRow.password;

        // Fallback to face biometric sample image if user avatar is null
        if (!userRow.avatar) {
            try {
                const [bioRows] = await pool.execute(
                    `SELECT sample_image FROM face_biometrics WHERE user_id = ?`,
                    [req.user.id]
                );
                if (bioRows.length > 0 && bioRows[0].sample_image) {
                    userRow.avatar = bioRows[0].sample_image;
                }
            } catch (e) {}
        }
        
        let profile = { ...userRow };
        let resolvedName = userRow.full_name || userRow.username || '';

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
                    const [rows] = await pool.execute('SELECT * FROM students WHERE user_id = ? OR email = ? LIMIT 1', [req.user.id, userRow.email]);
                    students = rows;
                }

                if (students.length > 0) {
                    const s = students[0];
                    const studentName = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ');
                    if (studentName && !userRow.full_name) resolvedName = studentName;
                    
                    profile.student_id = s.admission_number || s.roll_number || s.id || profile.student_id || null;
                    profile.first_name = s.first_name || (studentName ? studentName.split(' ')[0] : null) || profile.first_name || null;
                    profile.last_name = s.last_name || (studentName ? studentName.split(' ').slice(1).join(' ') : null) || profile.last_name || null;
                    profile.phone = s.phone || userRow.phone || null;
                    profile.alt_phone = s.alt_phone || userRow.alt_phone || null;
                    profile.address = s.address || userRow.address || null;
                    profile.permanent_address = s.permanent_address || userRow.permanent_address || null;
                    profile.emergency_contact_name = s.emergency_contact_name || s.father_name || s.parent_name || userRow.emergency_contact_name || null;
                    profile.emergency_contact_relation = s.emergency_contact_relation || userRow.emergency_contact_relation || 'Parent/Guardian';
                    profile.emergency_contact_phone = s.emergency_contact_phone || s.father_phone || s.parent_phone || userRow.emergency_contact_phone || null;
                    profile.dob = s.dob || userRow.dob || null;
                    profile.gender = s.gender || userRow.gender || null;
                    profile.blood_group = s.blood_group || userRow.blood_group || null;
                    profile.nationality = s.nationality || userRow.nationality || 'Indian';
                    profile.marital_status = s.marital_status || userRow.marital_status || 'Single';
                    profile.roll_number = s.roll_number || s.admission_number || null;
                    profile.registration_number = s.registration_number || null;
                    profile.admission_number = s.admission_number || null;
                    profile.library_id = s.library_id || s.library_card_id || null;
                    profile.library_card_id = s.library_card_id || s.library_id || null;
                    profile.hostel_id = s.hostel_id || null;
                    profile.current_semester = s.semester || s.current_semester || null;
                    profile.current_year = s.semester ? `Year ${Math.ceil(s.semester / 2)}` : null;
                    profile.section = s.section || s.section_name || null;
                    profile.cgpa = s.cgpa !== undefined ? s.cgpa : null;
                    profile.sgpa = s.sgpa !== undefined ? s.sgpa : null;
                    profile.backlogs = s.backlogs !== undefined ? s.backlogs : 0;
                    profile.department = s.department_name || s.department || userRow.department || null;
                    profile.program = s.program_name || s.course_name || s.program || null;
                    profile.specialization = s.specialization || null;
                    profile.admission_type = s.admission_type || 'Regular';
                    profile.admission_date = s.admission_date || null;
                    profile.batch = s.batch || null;
                    profile.status = s.status || userRow.status || 'Active';
                    profile.father_name = s.father_name || s.parent_name || null;
                    profile.father_phone = s.father_phone || s.parent_phone || null;
                    profile.father_email = s.father_email || null;
                    profile.father_occupation = s.father_occupation || null;
                    profile.mother_name = s.mother_name || null;
                    profile.mother_phone = s.mother_phone || null;
                    profile.mother_email = s.mother_email || null;
                    profile.mother_occupation = s.mother_occupation || null;
                    profile.ssc_percentage = s.ssc_percentage || null;
                    profile.ssc_board = s.ssc_board || null;
                    profile.ssc_year = s.ssc_year || null;
                    profile.intermediate_percentage = s.intermediate_percentage || null;
                    profile.intermediate_board = s.intermediate_board || null;
                    profile.intermediate_year = s.intermediate_year || null;
                    profile.mentor_name = s.mentor_name || null;
                    profile.mentor_email = s.mentor_email || null;
                    profile.mentor_phone = s.mentor_phone || null;
                    profile.mentor_designation = s.mentor_designation || null;
                    profile.class_advisor = s.class_advisor || null;
                    profile.hod_name = s.hod_name || null;
                    profile.hod_email = s.hod_email || null;
                }
            } else if (roleLower.includes('faculty') || roleLower.includes('teacher') || roleLower.includes('lecturer')) {
                const [facultyRows] = await pool.execute(
                    `SELECT f.*, d.name as department_name 
                     FROM faculty f 
                     LEFT JOIN departments d ON f.department_id = d.id 
                     WHERE f.user_id = ? OR f.email = ? LIMIT 1`,
                    [req.user.id, userRow.email]
                );
                if (facultyRows.length > 0) {
                    const f = facultyRows[0];
                    if (f.name && !userRow.full_name) resolvedName = f.name;
                    profile.phone = f.phone || profile.phone || '';
                    profile.employee_id = f.employee_id || profile.employee_id || '';
                    profile.designation = f.designation || profile.designation || 'Lecturer';
                    profile.department = f.department_name || f.department || profile.department || null;
                    profile.department_id = f.department_id || null;
                    profile.qualification = f.qualification || null;
                    profile.experience = f.experience || null;
                    profile.specialization = f.specialization || null;
                } else {
                    const [facultiesRows] = await pool.execute(
                        'SELECT * FROM faculties WHERE user_id = ? OR email = ? LIMIT 1',
                        [req.user.id, userRow.email]
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
                    'SELECT * FROM parents WHERE user_id = ? OR email = ? LIMIT 1',
                    [req.user.id, userRow.email]
                );
                if (parentRows.length > 0) {
                    const p = parentRows[0];
                    const pName = [p.first_name, p.last_name].filter(Boolean).join(' ');
                    if (pName && !userRow.full_name) resolvedName = pName;
                    profile.phone = p.phone || profile.phone || '';
                    profile.address = p.address || profile.address || '';
                    profile.occupation = p.occupation || null;
                    profile.student_id = p.student_id || profile.student_id || null;
                }
            }
        } catch (dbErr) {
            console.warn('Role specific profile lookup notice:', dbErr.message);
        }

        if (!resolvedName) {
            resolvedName = userRow.username ? (userRow.username.charAt(0).toUpperCase() + userRow.username.slice(1)) : 'User';
        }

        profile.name = resolvedName;
        profile.full_name = resolvedName;
        profile.first_name = profile.first_name || resolvedName.split(' ')[0];
        profile.last_name = profile.last_name || (resolvedName.split(' ').length > 1 ? resolvedName.split(' ').slice(1).join(' ') : '');

        res.json({
            success: true,
            data: profile,
            ...profile
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const {
            name, full_name, fullName, first_name, last_name,
            phone, alt_phone, altPhone,
            address, permanent_address, permanentAddress,
            emergency_contact_name, emergencyContactName,
            emergency_contact_relation, emergencyContactRelation,
            emergency_contact_phone, emergencyContactPhone,
            email, dob, gender, blood_group, bloodGroup,
            nationality, marital_status, maritalStatus,
            department, designation, employee_id, officer_id, student_id, avatar
        } = req.body;

        const newFullName = (full_name || name || fullName || '').trim();
        const newFirstName = (first_name || (newFullName ? newFullName.split(' ')[0] : '')).trim();
        const newLastName = (last_name || (newFullName ? newFullName.split(' ').slice(1).join(' ') : '')).trim();

        const phoneVal = phone !== undefined ? phone : null;
        const altPhoneVal = (alt_phone || altPhone) !== undefined ? (alt_phone || altPhone) : null;
        const addressVal = address !== undefined ? address : null;
        const permAddrVal = (permanent_address || permanentAddress) !== undefined ? (permanent_address || permanentAddress) : null;
        const emNameVal = (emergency_contact_name || emergencyContactName) !== undefined ? (emergency_contact_name || emergencyContactName) : null;
        const emRelVal = (emergency_contact_relation || emergencyContactRelation) !== undefined ? (emergency_contact_relation || emergencyContactRelation) : null;
        const emPhoneVal = (emergency_contact_phone || emergencyContactPhone) !== undefined ? (emergency_contact_phone || emergencyContactPhone) : null;
        const dobVal = dob !== undefined ? dob : null;
        const genderVal = gender !== undefined ? gender : null;
        const bloodGroupVal = (blood_group || bloodGroup) !== undefined ? (blood_group || bloodGroup) : null;
        const nationalityVal = nationality !== undefined ? nationality : null;
        const maritalVal = (marital_status || maritalStatus) !== undefined ? (marital_status || maritalStatus) : null;
        const deptVal = department !== undefined ? department : null;
        const desigVal = designation !== undefined ? designation : null;
        const empIdVal = (employee_id || officer_id) !== undefined ? (employee_id || officer_id) : null;
        const stuIdVal = student_id !== undefined ? student_id : null;

        // 1. Build and execute dynamic UPDATE query for users table
        const updateFields = [];
        const updateParams = [];

        if (newFullName) {
            updateFields.push('full_name = ?', 'first_name = ?', 'last_name = ?');
            updateParams.push(newFullName, newFirstName, newLastName);
        }
        if (phoneVal !== null) { updateFields.push('phone = ?'); updateParams.push(phoneVal); }
        if (altPhoneVal !== null) { updateFields.push('alt_phone = ?'); updateParams.push(altPhoneVal); }
        if (addressVal !== null) { updateFields.push('address = ?'); updateParams.push(addressVal); }
        if (permAddrVal !== null) { updateFields.push('permanent_address = ?'); updateParams.push(permAddrVal); }
        if (emNameVal !== null) { updateFields.push('emergency_contact_name = ?'); updateParams.push(emNameVal); }
        if (emRelVal !== null) { updateFields.push('emergency_contact_relation = ?'); updateParams.push(emRelVal); }
        if (emPhoneVal !== null) { updateFields.push('emergency_contact_phone = ?'); updateParams.push(emPhoneVal); }
        if (dobVal !== null) { updateFields.push('dob = ?'); updateParams.push(dobVal); }
        if (genderVal !== null) { updateFields.push('gender = ?'); updateParams.push(genderVal); }
        if (bloodGroupVal !== null) { updateFields.push('blood_group = ?'); updateParams.push(bloodGroupVal); }
        if (nationalityVal !== null) { updateFields.push('nationality = ?'); updateParams.push(nationalityVal); }
        if (maritalVal !== null) { updateFields.push('marital_status = ?'); updateParams.push(maritalVal); }
        if (deptVal !== null) { updateFields.push('department = ?'); updateParams.push(deptVal); }
        if (desigVal !== null) { updateFields.push('designation = ?'); updateParams.push(desigVal); }
        if (empIdVal !== null) { updateFields.push('employee_id = ?'); updateParams.push(empIdVal); }
        if (stuIdVal !== null) { updateFields.push('student_id = ?'); updateParams.push(stuIdVal); }
        if (avatar !== undefined) { updateFields.push('avatar = ?'); updateParams.push(avatar); }

        if (email && typeof email === 'string' && email.trim()) {
            const cleanEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
            }

            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
                [cleanEmail, req.user.id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'This email address is already in use by another account.' });
            }

            updateFields.push('email = ?');
            updateParams.push(cleanEmail);
        }

        if (updateFields.length > 0) {
            updateParams.push(req.user.id);
            await pool.execute(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                updateParams
            );
        }

        // 2. Update role-specific auxiliary tables if applicable
        const userRole = (req.user.role || '').toLowerCase();
        if (userRole.includes('student')) {
            try {
                await pool.execute(
                    `UPDATE students 
                     SET name = COALESCE(NULLIF(?, ''), name),
                         first_name = COALESCE(NULLIF(?, ''), first_name),
                         last_name = COALESCE(NULLIF(?, ''), last_name),
                         phone = COALESCE(?, phone),
                         alt_phone = COALESCE(?, alt_phone),
                         address = COALESCE(?, address),
                         permanent_address = COALESCE(?, permanent_address),
                         emergency_contact_name = COALESCE(?, emergency_contact_name),
                         emergency_contact_relation = COALESCE(?, emergency_contact_relation),
                         emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                         dob = COALESCE(?, dob),
                         gender = COALESCE(?, gender)
                     WHERE user_id = ?`,
                    [
                        newFullName, newFirstName, newLastName,
                        phoneVal, altPhoneVal, addressVal, permAddrVal,
                        emNameVal, emRelVal, emPhoneVal,
                        dobVal, genderVal, req.user.id
                    ]
                );
            } catch (e) {
                console.warn('Student table sync notice:', e.message);
            }
        } else if (userRole.includes('faculty') || userRole.includes('teacher') || userRole.includes('lecturer')) {
            try {
                await pool.execute(
                    `UPDATE faculty 
                     SET name = COALESCE(NULLIF(?, ''), name),
                         phone = COALESCE(?, phone),
                         designation = COALESCE(?, designation)
                     WHERE user_id = ?`,
                    [newFullName, phoneVal, desigVal, req.user.id]
                );
            } catch (e) {}
        } else if (userRole.includes('parent')) {
            try {
                await pool.execute(
                    `UPDATE parents 
                     SET phone = COALESCE(?, phone),
                         address = COALESCE(?, address)
                     WHERE user_id = ?`,
                    [phoneVal, addressVal, req.user.id]
                );
            } catch (e) {}
        }

        // Fetch freshly updated profile and return complete object
        const [updatedRows] = await pool.execute(
            `SELECT u.*, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
            [req.user.id]
        );
        const updatedUser = updatedRows.length > 0 ? updatedRows[0] : {};
        delete updatedUser.password;
        updatedUser.name = updatedUser.full_name || updatedUser.username || 'User';

        res.json({
            success: true,
            message: 'Profile updated successfully!',
            data: updatedUser
        });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};

export const updateProfileEmail = async (req, res) => {
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

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
            [cleanEmail, req.user.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This email address is already in use by another account.' });
        }

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
};

