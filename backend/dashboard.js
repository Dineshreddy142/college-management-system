import express from 'express';
import pool from './db.js';

const router = express.Router();

router.get('/admin', async (req, res) => {
    try {
        const [students] = await pool.execute('SELECT COUNT(*) as count FROM students');
        const [faculties] = await pool.execute('SELECT COUNT(*) as count FROM faculties');
        const [departments] = await pool.execute('SELECT COUNT(*) as count FROM departments');
        
        // Mock pending fees and attendance for now, as tables don't exist yet
        const stats = {
            totalStudents: students[0].count,
            totalFaculty: faculties[0].count,
            departments: departments[0].count,
            pendingFees: '₹138L', // Placeholder until Fee module is built
            avgAttendance: '88.4%' // Placeholder until Attendance module is complete
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/faculty', async (req, res) => {
    try {
        // We'll return mock/calculated data for now
        res.json({
            classesToday: 3,
            pendingAssignments: 12,
            averageAttendance: '89%'
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/student', async (req, res) => {
    try {
        res.json({
            attendance: '91%',
            upcomingExams: 2,
            pendingAssignments: 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
