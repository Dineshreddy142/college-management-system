import express from 'express';
import {
  getDashboardStats,
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  updateCycleStatus,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  updateProgramStatus,
  getApplicants,
  getApplicantById,
  createApplicant,
  updateApplicant,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  getApplicationPreferences,
  updateApplicationPreferences,
  getApplicationDocuments,
  uploadApplicationDocument,
  verifyDocument,
  verifyEligibility,
  getInterviews,
  scheduleInterview,
  updateInterview,
  updateInterviewStatus,
  submitDecision,
  getApplicationDecisions,
  getApplicationPayments,
  recordPayment,
  convertToStudent,

  // Advanced Admission Feature Controllers
  getMeritWeights,
  saveMeritWeights,
  generateMeritRanks,
  getMeritRankings,
  autoShortlist,
  getShortlist,
  publishShortlist,
  getSeatQuotas,
  saveSeatQuota,
  detectDuplicates,
  getAuditLogs,
  getAdmissionAnalytics,
  getCommunications,
  sendCommunication,
  confirmBulkImport,
  generateOfferLetter,
  getEnquiries,
  createEnquiry,
  getCounselling,
  scheduleCounselling,
  processWaitlistNext,
  getSLAMonitoring,
  getCampaigns,
  createCampaign
} from '../controllers/admissionController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();
const allowedRoles = ['Admin', 'Registrar', 'Admission Officer', 'Admission'];

// All routes protected by JWT and RBAC
router.use(authenticateToken);
router.use(authorizeRole(allowedRoles));

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Admission Cycles
router.get('/cycles', getCycles);
router.get('/cycles/:id', getCycleById);
router.post('/cycles', createCycle);
router.put('/cycles/:id', updateCycle);
router.patch('/cycles/:id/status', updateCycleStatus);

// Admission Programs
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.patch('/programs/:id/status', updateProgramStatus);

// Applicants Master
router.get('/applicants', getApplicants);
router.get('/applicants/:id', getApplicantById);
router.post('/applicants', createApplicant);
router.put('/applicants/:id', updateApplicant);

// Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications', createApplication);
router.put('/applications/:id', updateApplication);
router.patch('/applications/:id/status', updateApplicationStatus);

// Preferences
router.get('/applications/:id/preferences', getApplicationPreferences);
router.put('/applications/:id/preferences', updateApplicationPreferences);

// Documents
router.get('/applications/:id/documents', getApplicationDocuments);
router.post('/applications/:id/documents', uploadApplicationDocument);
router.patch('/documents/:docId/verify', verifyDocument);

// Eligibility Verification
router.post('/applications/:id/verify-eligibility', verifyEligibility);

// Interviews
router.get('/interviews', getInterviews);
router.post('/interviews', scheduleInterview);
router.put('/interviews/:id', updateInterview);
router.patch('/interviews/:id/status', updateInterviewStatus);

// Decisions
router.post('/applications/:id/decision', submitDecision);
router.get('/applications/:id/decisions', getApplicationDecisions);

// Payments & Receipts
router.get('/applications/:id/payments', getApplicationPayments);
router.post('/applications/:id/payments', recordPayment);

// Student Enrolment Conversion
router.post('/applications/:id/convert-to-student', convertToStudent);

// --- ADVANCED ADMISSION OFFICER ROUTES ---
// Merit & Ranking
router.get('/merit-weights', getMeritWeights);
router.post('/merit-weights', saveMeritWeights);
router.post('/merit/generate-ranks', generateMeritRanks);
router.get('/merit/rankings', getMeritRankings);

// Shortlisting
router.post('/shortlist/auto', autoShortlist);
router.get('/shortlist', getShortlist);
router.post('/shortlist/publish', publishShortlist);

// Advanced Seat & Intake Management
router.get('/seat-quotas', getSeatQuotas);
router.post('/seat-quotas', saveSeatQuota);

// Duplicate Applicant Detection
router.get('/applicants/duplicates/detect', detectDuplicates);

// Audit Trail
router.get('/audit-logs', getAuditLogs);

// Analytics
router.get('/analytics', getAdmissionAnalytics);

// Communication Center
router.get('/communications', getCommunications);
router.post('/communications/send', sendCommunication);

// Bulk Admission Import
router.post('/bulk-import/confirm', confirmBulkImport);

// Offer Letters
router.get('/applications/:id/offer-letter', generateOfferLetter);

// Enquiry / CRM
router.get('/enquiries', getEnquiries);
router.post('/enquiries', createEnquiry);

// Counselling
router.get('/counselling', getCounselling);
router.post('/counselling', scheduleCounselling);

// Waitlist Automation
router.post('/waitlist/process-next', processWaitlistNext);

// SLA Monitoring
router.get('/sla-monitoring', getSLAMonitoring);

// Campaign Management
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);

export default router;
