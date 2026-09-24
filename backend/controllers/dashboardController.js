import pool from '../db.js';

export const getAdminDashboardStats = async (req, res) => {
    try {
        const [students] = await pool.execute('SELECT COUNT(*) as count FROM students').catch(() => [[{ count: 0 }]]);
        
        let facultyCount = 0;
        try {
            const [faculties] = await pool.execute('SELECT COUNT(*) as count FROM faculty');
            facultyCount = faculties[0]?.count || 0;
        } catch {
            try {
                const [faculties] = await pool.execute('SELECT COUNT(*) as count FROM faculties');
                facultyCount = faculties[0]?.count || 0;
            } catch {}
        }
        
        let deptCount = 0;
        try {
            const [depts] = await pool.execute('SELECT COUNT(*) as count FROM departments');
            deptCount = depts[0]?.count || 0;
        } catch {}

        let activeCourses = 0;
        try {
            const [courses] = await pool.execute('SELECT COUNT(*) as count FROM subjects');
            activeCourses = courses[0]?.count || 0;
        } catch {}

        let avgAtt = '0%';
        try {
            const [att] = await pool.execute('SELECT COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present FROM attendance_details');
            if (att[0]?.total > 0) {
                avgAtt = `${((att[0].present / att[0].total) * 100).toFixed(1)}%`;
            }
        } catch {}

        const stats = {
            totalStudents: students[0]?.count || 0,
            totalFaculty: facultyCount,
            departments: deptCount,
            activeCourses,
            pendingFees: '₹0',
            avgAttendance: avgAtt,
            placedStudents: 0,
            booksIssued: 0
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getFacultyDashboardStats = async (req, res) => {
    try {
        res.json({
            classesToday: 0,
            pendingAssignments: 0,
            averageAttendance: '0%'
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStudentDashboardStats = async (req, res) => {
    try {
        res.json({
            attendance: '0%',
            upcomingExams: 0,
            pendingAssignments: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAnalyticsSummary = async (req, res) => {
    try {
        const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students');
        const [facultyCount] = await pool.execute('SELECT COUNT(*) as count FROM faculties');
        const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');
        let pendingFeesStr = '₹0';
        try {
            const [feeResult] = await pool.execute('SELECT SUM(balance_amount) as total FROM student_fee_accounts WHERE status != "paid"');
            const totalPending = feeResult[0]?.total || 0;
            pendingFeesStr = totalPending > 100000 ? `₹${(totalPending / 100000).toFixed(1)}L` : `₹${Number(totalPending).toLocaleString('en-IN')}`;
        } catch (fErr) {
            // Table might be unpopulated or different status column
        }

        res.json({
            totalStudents: studentCount[0]?.count || 0,
            totalFaculty: facultyCount[0]?.count || 0,
            activeCourses: courseCount[0]?.count || 0,
            pendingFees: pendingFeesStr
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
