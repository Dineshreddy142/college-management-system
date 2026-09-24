import pool from '../db.js';

export const getParentChildren = async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Arjun Sharma', roll: 'CS2021001', department: 'Computer Science', semester: 6, cgpa: 9.2, attendance: 88.4 },
      { id: 2, name: 'Riya Sharma', roll: 'ME2022045', department: 'Mechanical Engineering', semester: 4, cgpa: 8.7, attendance: 92.1 }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChildAttendance = async (req, res) => {
  res.json({ message: "Mocked attendance data for child " + req.params.id });
};

export const getChildFees = async (req, res) => {
  res.json({ message: "Mocked fee data for child " + req.params.id });
};
