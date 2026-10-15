import express from 'express';
import {
  getPlacementDashboardSummary,
  getPlacementDrives,
  createPlacementDrive,
  getEligibleStudents,
  getPlacementApplications,
  reviewPlacementApplication,
  applyForPlacementDrive,
  getSlotBookings,
  createSlotBooking,
  getAlumniMentors,
  createAlumniMentor
} from '../controllers/placementController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

const tpoRoles = ['Admin', 'Placement', 'Placement Officer', 'TPO', 'Chancellor', 'Vice Chancellor', 'Dean', 'Principal'];

// Dashboard & Summary Analytics
router.get('/dashboard-summary', authenticateToken, getPlacementDashboardSummary);

// Drives Management
router.get('/drives', authenticateToken, getPlacementDrives);
router.post('/drives', authenticateToken, authorizeRole(tpoRoles), createPlacementDrive);

// Eligible Students Directory
router.get('/eligible-students', authenticateToken, authorizeRole(tpoRoles), getEligibleStudents);

// Applications & Resume Shortlisting Hub
router.get('/applications', authenticateToken, authorizeRole(tpoRoles), getPlacementApplications);
router.post('/applications/review', authenticateToken, authorizeRole(tpoRoles), reviewPlacementApplication);
router.post('/apply', authenticateToken, applyForPlacementDrive);

// Company On-Campus Slot Booking
router.get('/slots', authenticateToken, getSlotBookings);
router.post('/slots', authenticateToken, authorizeRole(tpoRoles), createSlotBooking);

// Alumni Mentor Networking Hub
router.get('/alumni-mentors', authenticateToken, getAlumniMentors);
router.post('/alumni-mentors', authenticateToken, authorizeRole(tpoRoles), createAlumniMentor);

export default router;
