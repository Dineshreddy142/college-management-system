import express from 'express';
import {
  getStudentFeeAccount,
  getStudentPaymentHistory,
  processStudentPayment,
  getReceiptDetails,
  getFeeCategories,
  createFeeCategory,
  getFeeStructures,
  createFeeStructure,
  getAdminFinanceOverview,
  assignScholarshipOrConcession,
  requestRefund,
  reviewRefund
} from '../controllers/feeController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Student Routes
router.get('/fees/my-account', authenticateToken, getStudentFeeAccount);
router.get('/fees/my-history', authenticateToken, getStudentPaymentHistory);
router.post('/fees/payment/process', authenticateToken, processStudentPayment);
router.get('/fees/receipt/:id', authenticateToken, getReceiptDetails);

// Fee Categories
router.get('/fees/categories', authenticateToken, getFeeCategories);
router.post('/fees/categories', authenticateToken, authorizeRole(['Admin', 'HOD']), createFeeCategory);

// Admin / Finance Routes
router.get('/admin/fee-structures', authenticateToken, authorizeRole(['Admin', 'HOD']), getFeeStructures);
router.post('/admin/fee-structures', authenticateToken, authorizeRole(['Admin', 'HOD']), createFeeStructure);
router.get('/admin/fees/overview', authenticateToken, authorizeRole(['Admin', 'HOD']), getAdminFinanceOverview);
router.post('/admin/scholarships/assign', authenticateToken, authorizeRole(['Admin', 'HOD']), assignScholarshipOrConcession);
router.post('/admin/refunds', authenticateToken, authorizeRole(['Admin', 'HOD']), requestRefund);
router.post('/admin/refunds/:id/review', authenticateToken, authorizeRole(['Admin', 'HOD']), reviewRefund);

export default router;
