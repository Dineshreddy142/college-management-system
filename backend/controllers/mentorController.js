import pool from '../db.js';

export const getMentees = async (req, res) => {
  try {
    res.json([
      { id: 1, name: "Arjun Sharma", roll: "CS2021001", year: "3", dept: "Computer Science", cgpa: 9.2, attendance: 88.4, status: "safe" },
      { id: 2, name: "Priya Patel", roll: "CS2021045", year: "3", dept: "Computer Science", cgpa: 5.8, attendance: 68.2, status: "risk" },
      { id: 3, name: "Rahul Verma", roll: "CS2022012", year: "2", dept: "Computer Science", cgpa: 7.5, attendance: 78.0, status: "safe" }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMenteeDetails = async (req, res) => {
  try {
    res.json({
      id: req.params.id,
      name: "Arjun Sharma",
      roll: "CS2021001",
      cgpa: 9.2,
      attendance: 88.4,
      fees_status: "Paid",
      placement_status: "Eligible for Super Dream",
      recent_marks: [
        { sub: "Data Structures", score: "92/100", grade: "A+" },
        { sub: "Operating Systems", score: "88/100", grade: "A" }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recordCounselingSession = async (req, res) => {
  const { student_id, discussion, action_plan, date } = req.body;
  try {
    await pool.execute(
      'INSERT INTO counseling_sessions (faculty_id, student_id, session_date, discussion, action_plan) VALUES (?, ?, ?, ?, ?)',
      [req.faculty_id, student_id, date || new Date(), discussion, action_plan]
    );
    res.json({ message: "Counseling session recorded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMentorAlerts = async (req, res) => {
  try {
    res.json([
      { id: 1, type: "Attendance Risk", message: "Priya Patel's attendance is below 75%", date: new Date().toISOString() },
      { id: 2, type: "Fee Pending", message: "Rahul Verma has pending library fees", date: new Date().toISOString() }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
