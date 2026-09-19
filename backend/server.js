import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import facultyRouter from './faculty.js';
import studentRouter from './student.js';
import parentRouter from './parent.js';
import mentorRouter from './mentor.js';
import academicRouter from './academic.js';
import timetableRouter from './timetable.js';
import dashboardRouter from './dashboard.js';
import notificationsRouter from './notifications.js';
import searchRouter from './search.js';
import profileRouter from './profile.js';
import authRouter from './auth.js';
import { authenticateToken, authorizeRole } from './middleware.js';
import { errorHandler } from './middlewares/errorHandler.js';

// V1 API Routers
import departmentRoutes from './routes/departmentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import semesterRoutes from './routes/semesterRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import webauthnRoutes from './routes/webauthnRoutes.js';

import bulkUploadRoutes from './routes/bulkUploadRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import facultyAssignmentRoutes from './routes/facultyAssignmentRoutes.js';
import studentRegistrationRoutes from './routes/studentRegistrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import examRoutes from './routes/examRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import { initializeDatabase } from './init_db.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());

app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- BASE & HEALTH CHECK ROUTES ---
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'College Management System API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTHENTICATION ROUTES ---
app.use('/api', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/webauthn', webauthnRoutes);

// --- EMAIL NOTIFICATION & DIAGNOSTIC ROUTES ---
app.use('/api/email', emailRoutes);
app.use('/api/admin/email', emailRoutes);


// --- V1 ENTERPRISE ROUTES ---
app.use('/api/v1/academic/departments', departmentRoutes);
app.use('/api/v1/academic/courses', courseRoutes);
app.use('/api/v1/academic/semesters', semesterRoutes);

// --- FACULTY ROUTES ---
app.use('/api/faculty', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), facultyRouter);

// --- STUDENT PORTAL ROUTES ---
app.use('/api/student', authenticateToken, authorizeRole(['Admin', 'Student']), studentRouter);

// --- PARENT PORTAL ROUTES ---
app.use('/api/parent', authenticateToken, authorizeRole(['Admin', 'Parent']), parentRouter);

// --- MENTOR ROUTES ---
app.use('/api/mentor', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), mentorRouter);

// --- ACADEMIC, SUBJECT, CURRICULUM, FACULTY ASSIGNMENT & STUDENT REGISTRATION ROUTES ---
app.use('/api', subjectRoutes);
app.use('/api/academic', subjectRoutes);
app.use('/api', curriculumRoutes);
app.use('/api/academic', curriculumRoutes);
app.use('/api', facultyAssignmentRoutes);
app.use('/api/academic', facultyAssignmentRoutes);
app.use('/api', studentRegistrationRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', examRoutes);
app.use('/api', feeRoutes);
app.use('/api', libraryRoutes);
app.use('/api/academic', authenticateToken, authorizeRole(['Admin', 'HOD']), academicRouter);

// --- TIMETABLE ROUTES ---
app.use('/api/timetable', authenticateToken, timetableRouter);

// --- DASHBOARD ROUTES ---
app.use('/api/dashboard', authenticateToken, dashboardRouter);

// --- NOTIFICATIONS ROUTES ---
app.use('/api/notifications', authenticateToken, notificationsRouter);

// --- SEARCH ROUTES ---
app.use('/api/search', authenticateToken, searchRouter);

// --- PROFILE, INDOOR MAP & BULK UPLOAD ROUTES ---
app.use('/api/profile', authenticateToken, profileRouter);

app.use('/api/bulk', bulkUploadRoutes);

// --- SETTINGS ROUTES ---
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(row => settings[row.setting_key] = row.setting_value);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/settings', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- STUDENT MANAGEMENT ROUTES ---
app.get('/api/students', authenticateToken, authorizeRole(['Admin', 'HOD', 'Faculty']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT s.*, u.email, u.status FROM students s JOIN users u ON s.user_id = u.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/students', authenticateToken, authorizeRole(['Admin', 'HOD']), async (req, res) => {
  // simplified create logic for MVP
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { first_name, last_name, email, admission_number, password } = req.body;
    
    // Create user first
    const [roleRows] = await conn.execute('SELECT id FROM roles WHERE name = "Student"');
    const roleId = roleRows[0].id;
    
    const [userRes] = await conn.execute(
      'INSERT INTO users (username, password, email, role_id, must_change_password) VALUES (?, ?, ?, ?, 1)',
      [admission_number, password || 'Student@123', email, roleId]
    );
    
    const userId = userRes.insertId;
    
    // Create student
    const [studentRes] = await conn.execute(
      'INSERT INTO students (user_id, admission_number, first_name, last_name) VALUES (?, ?, ?, ?)',
      [userId, admission_number, first_name, last_name]
    );
    
    await conn.commit();
    res.status(201).json({ id: studentRes.insertId, message: 'Student created' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/students/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const studentId = req.params.id;
    // get user_id to delete user (cascade will handle student if FK is set up, but let's delete user)
    const [students] = await pool.execute('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (students.length > 0) {
      await pool.execute('DELETE FROM users WHERE id = ?', [students[0].user_id]);
    }
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DASHBOARD ANALYTICS ---
app.get('/api/analytics/summary', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students');
    const [facultyCount] = await pool.execute('SELECT COUNT(*) as count FROM faculties');
    // Mocking some stats for now
    res.json({
      totalStudents: studentCount[0].count,
      totalFaculty: facultyCount[0].count,
      activeCourses: 12,
      pendingFees: '₹12.5L'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database Initialization & Seed Health Check Endpoint
app.get('/api/init-db', async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

app.post('/api/init-db', async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // Automatically ensure database tables & seed users exist
  try {
    await initializeDatabase();
  } catch (e) {
    console.error('Auto database initialization error:', e);
  }
});
