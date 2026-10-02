import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken, authorizeRole } from './middleware.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Modular API Routers
import authRoutes from './routes/authRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import departmentRoutes from './routes/departmentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import semesterRoutes from './routes/semesterRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import webauthnRoutes from './routes/webauthnRoutes.js';
import faceAuthRoutes from './routes/faceAuthRoutes.js';
import bulkUploadRoutes from './routes/bulkUploadRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import facultyAssignmentRoutes from './routes/facultyAssignmentRoutes.js';
import chancellorRoutes from './routes/chancellorRoutes.js';

import attendanceRoutes from './routes/attendanceRoutes.js';
import examRoutes from './routes/examRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import { initializeDatabase } from './init_db.js';
import { getAnalyticsSummary } from './controllers/dashboardController.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 5000;

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
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/face', faceAuthRoutes);

// --- EMAIL NOTIFICATION & DIAGNOSTIC ROUTES ---
app.use('/api/email', emailRoutes);
app.use('/api/admin/email', emailRoutes);

// --- V1 ENTERPRISE ACADEMIC ROUTES ---
app.use('/api/v1/academic/departments', departmentRoutes);
app.use('/api/v1/academic/courses', courseRoutes);
app.use('/api/v1/academic/semesters', semesterRoutes);

// --- FACULTY & MENTOR ROUTES ---
app.use('/api/faculty', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), facultyRoutes);
app.use('/api/mentor', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), mentorRoutes);

// --- STUDENT & PARENT PORTAL ROUTES ---
app.use('/api/student', authenticateToken, authorizeRole(['Admin', 'Student']), studentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/parent', authenticateToken, authorizeRole(['Admin', 'Parent']), parentRoutes);

// --- ACADEMIC & CURRICULUM MANAGEMENT ---
app.use('/api', subjectRoutes);
app.use('/api/academic', subjectRoutes);
app.use('/api', curriculumRoutes);
app.use('/api/academic', curriculumRoutes);
app.use('/api', facultyAssignmentRoutes);
app.use('/api/academic', facultyAssignmentRoutes);
app.use('/api', studentRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', examRoutes);
app.use('/api', feeRoutes);
app.use('/api', libraryRoutes);
app.use('/api/academic', authenticateToken, authorizeRole(['Admin', 'HOD']), academicRoutes);

// --- TIMETABLE, DASHBOARD, NOTIFICATIONS, SEARCH & PROFILE ---
app.use('/api/timetable', authenticateToken, timetableRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);

// --- VEHICLES, SETTINGS, AI & BULK UPLOAD ---
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/bulk', bulkUploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chancellor', chancellorRoutes);
app.use('/api/admission', admissionRoutes);

// --- DASHBOARD ANALYTICS & AUDIT LOGS ---
app.get('/api/analytics/summary', authenticateToken, authorizeRole(['Admin']), getAnalyticsSummary);
app.get('/api/activity-logs', authenticateToken, authorizeRole(['Admin', 'Chancellor', 'Vice Chancellor', 'Principal', 'Registrar']), async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT l.id, l.user_id, u.username, u.full_name, r.name as role_name, l.action, l.description, l.ip_address, l.created_at
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[AUDIT LOGS ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// --- DATABASE INITIALIZATION ENDPOINTS ---
app.get('/api/init-db', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

app.post('/api/init-db', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Backend server running instantly on http://localhost:${PORT}`);
  console.log(`Database initialization runs via "npm run db:init" or POST /api/init-db`);
});

