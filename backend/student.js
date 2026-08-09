import express from 'express';
import pool from './db.js';

const router = express.Router();

// Middleware to ensure user is a student
router.use((req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Access denied: student access required' });
  }
  next();
});

// GET profile
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.email, u.phone, u.name 
       FROM Students s 
       JOIN Users u ON s.user_id = u.id 
       WHERE s.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// GET attendance
router.get('/attendance', async (req, res) => {
  try {
    // Assuming student_id is known or fetched via user_id
    const [studentRows] = await pool.query(`SELECT id FROM Students WHERE user_id = ?`, [req.user.id]);
    if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const [rows] = await pool.query(
      `SELECT a.*, sa.subject_name 
       FROM Attendance a
       JOIN SubjectAllocations sa ON a.allocation_id = sa.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC LIMIT 30`,
      [studentRows[0].id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// GET assignments
router.get('/assignments', async (req, res) => {
  try {
    res.json([
      // Mock data representing assignments assigned to the student's current class/section
    ]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET timetable
router.get('/timetable', async (req, res) => {
  try {
    const timetable = {
      department: "Computer Science",
      semester: "6",
      section: "A",
      batch: "2021-2025",
      schedule: [
        {
          day: "Monday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Theory", subject: "Data Structures", faculty: "Dr. Ramesh", room: "Room C204", code: "CS301" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Theory", subject: "Operating Systems", faculty: "Prof. D. Joshi", room: "Room C205", code: "CS302" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Theory", subject: "Mathematics III", faculty: "Dr. S. Sharma", room: "Room C201", code: "MA201" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Theory", subject: "Database Management", faculty: "Prof. Amit", room: "Room C206", code: "CS303" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Lab", subject: "OS Lab", faculty: "Prof. D. Joshi", room: "CS-Lab 1", code: "CS302L" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Lab", subject: "OS Lab", faculty: "Prof. D. Joshi", room: "CS-Lab 1", code: "CS302L" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Elective", subject: "Cloud Computing", faculty: "Dr. K. Pillai", room: "Room C301", code: "CS401" }
          ]
        },
        {
          day: "Tuesday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Theory", subject: "Database Management", faculty: "Prof. Amit", room: "Room C206", code: "CS303" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Theory", subject: "Software Engineering", faculty: "Dr. L. Kumar", room: "Room C207", code: "CS304" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Theory", subject: "Data Structures", faculty: "Dr. Ramesh", room: "Room C204", code: "CS301" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Tutorial", subject: "DBMS Tutorial", faculty: "Prof. Amit", room: "Room C206", code: "CS303T" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Lab", subject: "DS Lab", faculty: "Dr. Ramesh", room: "CS-Lab 2", code: "CS301L" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Lab", subject: "DS Lab", faculty: "Dr. Ramesh", room: "CS-Lab 2", code: "CS301L" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Elective", subject: "Cloud Computing", faculty: "Dr. K. Pillai", room: "Room C301", code: "CS401" }
          ]
        },
        {
          day: "Wednesday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Theory", subject: "Mathematics III", faculty: "Dr. S. Sharma", room: "Room C201", code: "MA201" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Theory", subject: "Software Engineering", faculty: "Dr. L. Kumar", room: "Room C207", code: "CS304" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Theory", subject: "Operating Systems", faculty: "Prof. D. Joshi", room: "Room C205", code: "CS302" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Tutorial", subject: "Math Tutorial", faculty: "Dr. S. Sharma", room: "Room C201", code: "MA201T" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Theory", subject: "Data Structures", faculty: "Dr. Ramesh", room: "Room C204", code: "CS301" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Elective", subject: "Cloud Computing", faculty: "Dr. K. Pillai", room: "Room C301", code: "CS401" }
          ]
        },
        {
          day: "Thursday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Theory", subject: "Software Engineering", faculty: "Dr. L. Kumar", room: "Room C207", code: "CS304" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Theory", subject: "Database Management", faculty: "Prof. Amit", room: "Room C206", code: "CS303" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Lab", subject: "Web Dev Lab", faculty: "Prof. Verma", room: "CS-Lab 3", code: "CS305L" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Lab", subject: "Web Dev Lab", faculty: "Prof. Verma", room: "CS-Lab 3", code: "CS305L" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Theory", subject: "Operating Systems", faculty: "Prof. D. Joshi", room: "Room C205", code: "CS302" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Theory", subject: "Mathematics III", faculty: "Dr. S. Sharma", room: "Room C201", code: "MA201" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Free", subject: "", faculty: "", room: "", code: "" }
          ]
        },
        {
          day: "Friday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Theory", subject: "Mathematics III", faculty: "Dr. S. Sharma", room: "Room C201", code: "MA201" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Theory", subject: "Data Structures", faculty: "Dr. Ramesh", room: "Room C204", code: "CS301" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Tutorial", subject: "SE Tutorial", faculty: "Dr. L. Kumar", room: "Room C207", code: "CS304T" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Theory", subject: "Database Management", faculty: "Prof. Amit", room: "Room C206", code: "CS303" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Tutorial", subject: "OS Tutorial", faculty: "Prof. D. Joshi", room: "Room C205", code: "CS302T" }
          ]
        },
        {
          day: "Saturday",
          periods: [
            { period: 1, time: "08:45 AM - 09:45 AM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 2, time: "09:45 AM - 10:45 AM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 3, time: "11:00 AM - 12:00 PM", type: "Lab", subject: "Project Work", faculty: "Dr. Ramesh", room: "Innovation Lab", code: "PRJ301" },
            { period: 4, time: "12:00 PM - 01:00 PM", type: "Lab", subject: "Project Work", faculty: "Dr. Ramesh", room: "Innovation Lab", code: "PRJ301" },
            { period: 5, time: "02:00 PM - 03:00 PM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 6, time: "03:00 PM - 04:00 PM", type: "Free", subject: "", faculty: "", room: "", code: "" },
            { period: 7, time: "04:15 PM - 05:15 PM", type: "Free", subject: "", faculty: "", room: "", code: "" }
          ]
        }
      ]
    };
    res.json(timetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
