import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  sendEmail,
  sendTestEmail,
  sendSecurityAlert,
  sendPasswordResetEmail,
  sendAccountNotification,
  sendAcademicNotification,
  sendAttendanceNotification,
  sendFeeNotification,
  sendExamNotification,
  sendTimetableNotification,
  verifySmtpConfig,
  getEmailLogs
} from '../services/emailService.js';
import pool from '../db.js';

const router = express.Router();

/**
 * Diagnostic SMTP status verification
 */
router.get('/status', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const status = await verifySmtpConfig();
    return successResponse(res, 'SMTP status checked', {
      ...status,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '465',
      user: process.env.SMTP_USER || process.env.MAIL_FROM || 'backendteamsecurity@gmail.com',
      from: process.env.MAIL_FROM || 'backendteamsecurity@gmail.com',
      fromName: process.env.MAIL_FROM_NAME || 'College ERP'
    });
  } catch (error) {
    return errorResponse(res, 'Failed to verify SMTP status', [error.message], 500);
  }
});

/**
 * Admin test email dispatcher
 */
router.post('/test', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { toEmail } = req.body || {};
    const targetEmail = toEmail || req.user?.email || 'nuthanakalvadineshreddy@gmail.com';
    
    console.log(`[EMAIL] Admin requested test email delivery to: ${targetEmail}`);
    const result = await sendTestEmail({ toEmail: targetEmail });

    if (!result.success && result.errorCode) {
      return errorResponse(res, result.message || 'Email delivery failed', [result.error || result.message], 400, {
        errorCode: result.errorCode
      });
    }

    return successResponse(res, result.message || 'Email accepted by SMTP server', result);
  } catch (error) {
    return errorResponse(res, 'Failed to dispatch test email', [error.message], 500);
  }
});

/**
 * Public/Unauthenticated diagnostic test email (restricted to registered user emails)
 */
router.post('/test-direct', async (req, res) => {
  try {
    const { toEmail } = req.body || {};
    const targetEmail = toEmail || 'nuthanakalvadineshreddy@gmail.com';

    // Verify recipient exists in database
    const [users] = await pool.execute('SELECT id, email FROM users WHERE LOWER(email) = ? LIMIT 1', [targetEmail.toLowerCase().trim()]);
    if (users.length === 0) {
      return errorResponse(res, 'Test email can only be dispatched to registered database user emails', [], 400);
    }

    const result = await sendTestEmail({ toEmail: users[0].email });
    return successResponse(res, result.message || 'Email accepted by SMTP server', result);
  } catch (error) {
    return errorResponse(res, 'Failed to dispatch test email', [error.message], 500);
  }
});

/**
 * Get email delivery logs
 */
router.get('/logs', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { limit = 50, page = 1, status = null, recipientEmail = null } = req.query;
    const logs = await getEmailLogs({
      limit: Number(limit),
      page: Number(page),
      status,
      recipientEmail
    });
    return successResponse(res, 'Email notifications log retrieved', logs);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch email logs', [error.message], 500);
  }
});

/**
 * Generic notification dispatcher (for Academic, Fee, Attendance, Exams)
 */
router.post('/send-notification', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), async (req, res) => {
  try {
    const { userId, recipientEmail, notificationType = 'GENERAL', subject, message, meta = {} } = req.body;

    let targetEmail = recipientEmail;
    let targetUserId = userId;

    if (userId && !targetEmail) {
      const [users] = await pool.execute('SELECT id, email FROM users WHERE id = ?', [userId]);
      if (users.length > 0) {
        targetEmail = users[0].email;
        targetUserId = users[0].id;
      }
    }

    if (!targetEmail) {
      return errorResponse(res, 'Recipient email or valid user ID is required', [], 400);
    }

    let result;
    switch (notificationType.toUpperCase()) {
      case 'ACADEMIC':
        result = await sendAcademicNotification({
          toEmail: targetEmail,
          title: subject || 'Academic Update',
          message,
          courseName: meta.courseName,
          recipientUserId: targetUserId
        });
        break;
      case 'ATTENDANCE':
        result = await sendAttendanceNotification({
          toEmail: targetEmail,
          title: subject || 'Attendance Alert',
          message,
          attendancePercentage: meta.attendancePercentage,
          recipientUserId: targetUserId
        });
        break;
      case 'FEE':
        result = await sendFeeNotification({
          toEmail: targetEmail,
          title: subject || 'Fee Notification',
          amount: meta.amount,
          dueDate: meta.dueDate,
          receiptUrl: meta.receiptUrl,
          recipientUserId: targetUserId
        });
        break;
      case 'EXAM':
        result = await sendExamNotification({
          toEmail: targetEmail,
          title: subject || 'Exam Notification',
          examDetails: message,
          recipientUserId: targetUserId
        });
        break;
      case 'TIMETABLE':
        result = await sendTimetableNotification({
          toEmail: targetEmail,
          title: subject || 'Timetable Change',
          scheduleChanges: message,
          recipientUserId: targetUserId
        });
        break;
      default:
        result = await sendEmail({
          to: targetEmail,
          subject: subject || 'College ERP Notification',
          text: message,
          notificationType,
          recipientUserId: targetUserId
        });
    }

    return successResponse(res, result.message || 'Notification dispatched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to send notification', [error.message], 500);
  }
});

export default router;
