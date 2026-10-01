import pool from '../db.js';

export const getMentees = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, d.name as department_name, sec.name as section_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       ORDER BY s.id ASC LIMIT 50`
    );

    const formatted = rows.map(s => {
      const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Student';
      const cgpaVal = s.cgpa !== undefined && s.cgpa !== null ? Number(s.cgpa) : 8.2;
      const attVal = s.attendance !== undefined && s.attendance !== null ? Number(s.attendance) : 85.0;
      return {
        id: s.id,
        dbId: s.id,
        name: name,
        roll: s.roll_number || s.admission_number || `CS${s.id}`,
        year: s.semester ? String(Math.ceil(s.semester / 2)) : '3',
        dept: s.department_name || s.department || 'Computer Science',
        cgpa: cgpaVal,
        attendance: attVal,
        status: attVal < 75 ? 'risk' : 'safe'
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('getMentees error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};

export const getMenteeDetails = async (req, res) => {
  try {
    const menteeId = req.params.id;
    const [students] = await pool.execute(
      `SELECT s.*, d.name as department_name 
       FROM students s 
       LEFT JOIN departments d ON s.department_id = d.id 
       WHERE s.id = ? OR s.admission_number = ? LIMIT 1`,
      [menteeId, menteeId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Mentee not found' });
    }

    const s = students[0];
    const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Student';

    res.json({
      id: s.id,
      name: name,
      roll: s.roll_number || s.admission_number || `STU${s.id}`,
      cgpa: s.cgpa !== undefined && s.cgpa !== null ? Number(s.cgpa) : 8.5,
      attendance: s.attendance !== undefined && s.attendance !== null ? Number(s.attendance) : 88.4,
      fees_status: 'Paid',
      placement_status: 'Eligible for Super Dream',
      recent_marks: [
        { sub: 'Data Structures', score: '92/100', grade: 'A+' },
        { sub: 'Operating Systems', score: '88/100', grade: 'A' }
      ]
    });
  } catch (err) {
    console.error('getMenteeDetails error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};

export const recordCounselingSession = async (req, res) => {
  const { student_id, discussion, action_plan, date } = req.body;
  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS counseling_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faculty_id INT NULL,
        student_id VARCHAR(50) NULL,
        session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        discussion TEXT NULL,
        action_plan TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await pool.execute(
      'INSERT INTO counseling_sessions (faculty_id, student_id, session_date, discussion, action_plan) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id || 1, student_id || 'STU1', date || new Date(), discussion || '', action_plan || '']
    );
    res.json({ success: true, message: 'Counseling session recorded successfully.' });
  } catch (err) {
    console.error('recordCounselingSession error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};

export const getMentorAlerts = async (req, res) => {
  try {
    const [riskStudents] = await pool.execute(
      `SELECT s.* FROM students s WHERE s.attendance < 75 OR s.cgpa < 6.0 LIMIT 10`
    );

    const alerts = riskStudents.map((st, idx) => ({
      id: idx + 1,
      type: st.attendance < 75 ? 'Attendance Risk' : 'Academic Alert',
      message: `${st.name || st.first_name || 'Student'} (${st.admission_number || st.roll_number}) has ${st.attendance < 75 ? 'attendance below 75%' : 'CGPA below 6.0'}`,
      date: new Date().toISOString()
    }));

    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        type: 'System Notice',
        message: 'All mentees have satisfactory academic and attendance standings.',
        date: new Date().toISOString()
      });
    }

    res.json(alerts);
  } catch (err) {
    console.error('getMentorAlerts error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};

