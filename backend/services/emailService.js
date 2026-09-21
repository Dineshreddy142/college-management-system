import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const emailLogFile = path.join(logsDir, 'security_emails.log');

/**
 * Creates and configures the Nodemailer SMTP Transporter
 */
export function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM || 'backendteamsecurity@gmail.com';
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!pass) {
    // Transporter cannot authenticate without password/app password
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * Validates SMTP configuration and connection status
 */
export async function verifySmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return {
      configured: false,
      message: 'SMTP credentials incomplete in .env. SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required.'
    };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { configured: false, message: 'SMTP password not provided in environment variables.' };
    }
    console.log(`[EMAIL] Connecting to SMTP host: ${host} user: ${user}`);
    await transporter.verify();
    console.log(`[EMAIL] SMTP authentication successful`);
    return {
      configured: true,
      verified: true,
      message: 'SMTP server connected and authenticated successfully.'
    };
  } catch (err) {
    console.error(`[EMAIL] SMTP connection failed: ${err.message}`);
    return {
      configured: true,
      verified: false,
      error: err.message,
      errorCode: err.code || 'SMTP_CONNECTION_FAILED',
      message: `SMTP connection failed: ${err.message}`
    };
  }
}

/**
 * Centralized Core Email Dispatcher with Retry & TiDB Auditing
 * @param {Object} options
 * @param {string} options.to - Recipient email (verified from database)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plaintext body
 * @param {string} [options.html] - HTML body
 * @param {Array} [options.attachments] - Array of attachment objects
 * @param {string} [options.notificationType] - Category (SECURITY, ACADEMIC, FEE, ATTENDANCE, EXAM, ACCOUNT)
 * @param {number} [options.recipientUserId] - User ID in TiDB
 * @param {number} [options.maxRetries=2] - Maximum retry attempts
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
  notificationType = 'GENERAL',
  recipientUserId = null,
  maxRetries = 2
}) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const fromName = process.env.MAIL_FROM_NAME || 'College ERP';
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER || 'backendteamsecurity@gmail.com';
  const fromHeader = `"${fromName}" <${fromEmail}>`;

  // 1. Validate Recipient
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to.trim())) {
    console.error(`[EMAIL] Recipient rejected: Invalid email address '${to}'`);
    await recordEmailNotification({
      recipientUserId,
      recipientEmail: to || 'invalid',
      notificationType,
      subject,
      status: 'FAILED',
      errorMessage: 'Invalid recipient email format'
    });
    return {
      success: false,
      message: 'Invalid recipient email address',
      errorCode: 'RECIPIENT_REJECTED'
    };
  }

  const validRecipient = to.trim();
  console.log(`[EMAIL] Preparing email for recipient: ${validRecipient} | Type: ${notificationType} | Subject: "${subject}"`);
  console.log(`[EMAIL] Recipient validated: ${validRecipient}`);

  // 2. Insert PENDING record into email_notifications table
  const notificationId = await recordEmailNotification({
    recipientUserId,
    recipientEmail: validRecipient,
    notificationType,
    subject,
    status: 'PENDING'
  });

  // 3. Initialize Transporter
  const transporter = createTransporter();
  const hasAttachments = attachments && attachments.length > 0;

  if (hasAttachments) {
    for (const att of attachments) {
      if (att.path && !fs.existsSync(att.path)) {
        console.error(`[EMAIL] Attachment failed: File not found at path ${att.path}`);
      }
    }
  }

  // 4. If SMTP credentials not provided in .env: Log to sandbox and return structured diagnostic status
  if (!transporter) {
    console.warn(`[EMAIL] SMTP connection failed: SMTP_PASSWORD is not set in backend/.env. Logging to fallback log.`);
    const logEntry = `\n[${timestamp}] === EMAIL NOTIFICATION (SANDBOX/LOGGED) ===\nTo: ${validRecipient}\nType: ${notificationType}\nSubject: ${subject}\nAttachments: ${hasAttachments ? attachments.map(a => a.filename).join(', ') : 'None'}\nBody:\n${text}\n======================================================\n`;
    fs.appendFileSync(emailLogFile, logEntry);

    await updateEmailNotification(notificationId, {
      status: 'SENT',
      messageId: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      providerResponse: 'Written to security_emails.log (SMTP credentials not configured in .env)'
    });

    return {
      success: true,
      mode: 'logged',
      message: 'Email accepted and logged to security_emails.log (Configure SMTP_PASSWORD in .env for live inbox delivery)',
      messageId: `log_${Date.now()}`
    };
  }

  // 5. Send with bounded retry loop
  const mailOptions = {
    from: fromHeader,
    to: validRecipient,
    subject,
    text,
    html: html || text,
    attachments
  };

  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL] Connecting to SMTP (Attempt ${attempt}/${maxRetries}) to send to ${validRecipient}...`);
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`[EMAIL] Message accepted. Message ID: ${info.messageId}`);
      console.log(`[EMAIL] Email delivery request completed. Status: SENT`);

      // Update TiDB audit record with SUCCESS
      await updateEmailNotification(notificationId, {
        status: 'SENT',
        messageId: info.messageId,
        providerResponse: typeof info.response === 'string' ? info.response : JSON.stringify(info.response || 'OK')
      });

      return {
        success: true,
        message: 'Email accepted by SMTP server',
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response
      };
    } catch (err) {
      lastError = err;
      console.error(`[EMAIL] SMTP delivery attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  // All retries failed
  const errorMsg = lastError ? lastError.message : 'Unknown SMTP failure';
  const errorCode = lastError?.code || 'SMTP_DELIVERY_FAILED';
  console.error(`[EMAIL] Email delivery request completed. Status: FAILED | Error: ${errorMsg}`);

  // Update TiDB audit record with FAILED
  await updateEmailNotification(notificationId, {
    status: 'FAILED',
    errorMessage: errorMsg
  });

  return {
    success: false,
    message: 'Email could not be sent',
    errorCode,
    error: errorMsg
  };
}

/**
 * Records an email entry in the email_notifications database table
 */
async function recordEmailNotification({ recipientUserId, recipientEmail, notificationType, subject, status, errorMessage }) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO email_notifications 
       (recipient_user_id, recipient_email, notification_type, subject, status, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [recipientUserId || null, recipientEmail, notificationType, subject, status, errorMessage || null]
    );
    return result.insertId;
  } catch (err) {
    console.error('[EMAIL] Error inserting email_notifications log:', err.message);
    return null;
  }
}

/**
 * Updates an email notification record upon provider response
 */
async function updateEmailNotification(id, { status, messageId, providerResponse, errorMessage }) {
  if (!id) return;
  try {
    await pool.execute(
      `UPDATE email_notifications 
       SET status = ?, message_id = ?, provider_response = ?, error_message = ?, sent_at = ${status === 'SENT' ? 'NOW()' : 'sent_at'}
       WHERE id = ?`,
      [status, messageId || null, providerResponse || null, errorMessage || null, id]
    );
  } catch (err) {
    console.error('[EMAIL] Error updating email_notifications log:', err.message);
  }
}

/**
 * Sends a Security Alert Email with the LIVE CAPTURED photograph attachment
 */
export async function sendSecurityAlert({
  toEmail,
  userRole,
  failedAttempts = 4,
  ipAddress,
  userAgent,
  deviceInfo,
  cameraPermission,
  imageCaptured,
  imagePath,
  recipientUserId = null
}) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const attachmentFilename = `suspicious-login-${formattedDate}.jpg`;

  const subject = 'Security Alert - Multiple Failed Login Attempts';

  const textContent = `
Dear User,

Multiple unsuccessful login attempts were detected on your College ERP account.

Account:
${toEmail}

Role:
${userRole || 'User'}

Time:
${timestamp}

Failed Attempts:
${failedAttempts}

IP Address:
${ipAddress || '127.0.0.1'}

Browser:
${userAgent || 'Unknown Browser'}

Device:
${deviceInfo || 'Standard Desktop / Mobile Browser'}

A security image captured during the suspicious login attempt is attached to this email.

If you did not attempt to log in, please change your password and contact the system administrator.

Regards,
College ERP Security System
`.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #dc2626; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">🚨 College Management ERP Security Alert</h2>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: 600; color: #b91c1c; margin-top: 0;">
          Dear User,
        </p>
        <p style="font-size: 14px; color: #334155;">
          Multiple unsuccessful login attempts were detected on your College ERP account.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold; width: 150px;">Account:</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${toEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Role:</td>
            <td style="padding: 10px 0; color: #0f172a;">${userRole || 'User'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Time:</td>
            <td style="padding: 10px 0; color: #0f172a;">${timestamp}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Failed Attempts:</td>
            <td style="padding: 10px 0; color: #dc2626; font-weight: bold;">${failedAttempts}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">IP Address:</td>
            <td style="padding: 10px 0; color: #0f172a;">${ipAddress || '127.0.0.1'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Browser:</td>
            <td style="padding: 10px 0; color: #0f172a; word-break: break-all;">${userAgent || 'Web Browser'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Security Image:</td>
            <td style="padding: 10px 0; color: #0f172a;">${imageCaptured ? 'Attached (' + attachmentFilename + ')' : 'Camera Unavailable / Denied'}</td>
          </tr>
        </table>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
            A security image captured during the suspicious login attempt is attached to this email. If you did not attempt to log in, please change your password immediately and contact the system administrator.
          </p>
        </div>
        
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Regards,<br>
          <strong>College ERP Security System</strong>
        </p>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
        College ERP Automated Security Daemon &bull; Incident ID: SEC-${Date.now()}
      </div>
    </div>
  `;

  const attachments = [];
  if (imageCaptured && imagePath && fs.existsSync(imagePath)) {
    attachments.push({
      filename: attachmentFilename,
      path: imagePath,
      cid: 'security_photo'
    });
    console.log(`[EMAIL] Attachment prepared: ${attachmentFilename} from ${imagePath}`);
  }

  const result = await sendEmail({
    to: toEmail,
    subject,
    text: textContent,
    html: htmlContent,
    attachments,
    notificationType: 'SECURITY',
    recipientUserId
  });

  result.attachment = attachmentFilename;
  return result;
}

/**
 * Backward compatibility alias for sendSecurityAlert
 */
export const sendSecurityAlertEmail = sendSecurityAlert;

/**
 * Sends a Password Reset Email
 */
export async function sendPasswordResetEmail({ toEmail, resetLink, userName, recipientUserId = null }) {
  const subject = 'Password Reset Request - College ERP';
  const text = `Dear ${userName || 'User'},\n\nA password reset was requested for your College ERP account.\n\nPlease use the link below to set a new password:\n${resetLink}\n\nThis link will expire in 1 hour.\nIf you did not request this reset, please ignore this message.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
      <p>Dear ${userName || 'User'},</p>
      <p>A password reset was requested for your College ERP account.</p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link into your browser: <br>${resetLink}</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'ACCOUNT',
    recipientUserId
  });
}

/**
 * Sends an Account Notification Email (e.g. Account Created, Role Changed)
 */
export async function sendAccountNotification({ toEmail, title, message, userName, recipientUserId = null }) {
  const subject = `Account Notification: ${title}`;
  const text = `Dear ${userName || 'User'},\n\n${message}\n\nCollege ERP Administration`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #0f172a; margin-top: 0;">${title}</h3>
      <p>Dear ${userName || 'User'},</p>
      <p style="color: #334155; line-height: 1.6;">${message}</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'ACCOUNT',
    recipientUserId
  });
}

/**
 * Sends an Academic Notification Email (Assignment, Exam, Grades)
 */
export async function sendAcademicNotification({ toEmail, title, message, courseName, recipientUserId = null }) {
  const subject = `Academic Alert: ${title}${courseName ? ' - ' + courseName : ''}`;
  const text = `Academic Update:\n\nCourse: ${courseName || 'General'}\nDetails: ${message}\n\nCollege Management System`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #2563eb; margin-top: 0;">🎓 ${title}</h3>
      <p><strong>Course:</strong> ${courseName || 'All Courses'}</p>
      <p style="color: #334155; line-height: 1.6;">${message}</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'ACADEMIC',
    recipientUserId
  });
}

/**
 * Sends an Attendance Notification Email
 */
export async function sendAttendanceNotification({ toEmail, title, message, attendancePercentage, recipientUserId = null }) {
  const isLow = attendancePercentage !== undefined && attendancePercentage < 75;
  const subject = `Attendance Notice: ${title} (${attendancePercentage || 'N/A'}%)`;
  const text = `Attendance Notification:\n\n${message}\nCurrent Attendance: ${attendancePercentage || 'N/A'}%\n\nCollege ERP`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: ${isLow ? '#dc2626' : '#2563eb'}; margin-top: 0;">📋 Attendance Notification</h3>
      <p>${message}</p>
      <p><strong>Current Attendance Percentage:</strong> <span style="color: ${isLow ? '#dc2626' : '#16a34a'}; font-weight: bold;">${attendancePercentage || 'N/A'}%</span></p>
      ${isLow ? '<p style="color: #dc2626; font-size: 13px;">⚠️ Attendance is below the mandatory 75% threshold required for examination eligibility.</p>' : ''}
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'ATTENDANCE',
    recipientUserId
  });
}

/**
 * Sends a Fee Notification Email (Due, Payment Confirmation, Receipt)
 */
export async function sendFeeNotification({ toEmail, title, amount, dueDate, receiptUrl, recipientUserId = null }) {
  const subject = `Fee Notice: ${title}`;
  const text = `Fee Notification:\n\nAmount: Rs. ${amount || '0'}\nDue Date: ${dueDate || 'Immediate'}\nDetails: ${title}\n\nCollege Accounts Department`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #0f172a; margin-top: 0;">💳 Fee Notification</h3>
      <p><strong>Details:</strong> ${title}</p>
      <p><strong>Amount:</strong> Rs. ${amount || '0'}</p>
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
      ${receiptUrl ? `<p><a href="${receiptUrl}" style="color: #2563eb; font-weight: bold;">Download Fee Receipt</a></p>` : ''}
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'FEE',
    recipientUserId
  });
}

/**
 * Sends an Examination Schedule Notification Email
 */
export async function sendExamNotification({ toEmail, title, examDetails, recipientUserId = null }) {
  const subject = `Exam Notification: ${title}`;
  const text = `Examination Alert:\n\n${title}\n\nDetails: ${typeof examDetails === 'string' ? examDetails : JSON.stringify(examDetails)}\n\nCollege Examination Cell`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #7c3aed; margin-top: 0;">📝 Examination Notification</h3>
      <p><strong>Title:</strong> ${title}</p>
      <p style="color: #334155;">${typeof examDetails === 'string' ? examDetails : JSON.stringify(examDetails)}</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'EXAM',
    recipientUserId
  });
}

/**
 * Sends a Timetable Schedule Change Notification Email
 */
export async function sendTimetableNotification({ toEmail, title, scheduleChanges, recipientUserId = null }) {
  const subject = `Timetable Update: ${title}`;
  const text = `Timetable Notification:\n\n${title}\n\nSchedule Changes: ${typeof scheduleChanges === 'string' ? scheduleChanges : JSON.stringify(scheduleChanges)}\n\nAcademic Office`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #0284c7; margin-top: 0;">📅 Timetable Update</h3>
      <p><strong>Title:</strong> ${title}</p>
      <p style="color: #334155;">${typeof scheduleChanges === 'string' ? scheduleChanges : JSON.stringify(scheduleChanges)}</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'TIMETABLE',
    recipientUserId
  });
}

/**
 * Diagnostic test email dispatcher for admin testing
 */
export async function sendTestEmail({ toEmail = 'nuthanakalvadineshreddy@gmail.com' } = {}) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const subject = 'College ERP Email System - Diagnostic Test';
  const text = `College Management ERP Real Email Diagnostic Test\n\nStatus: Active\nTimestamp: ${timestamp}\nTarget: ${toEmail}\n\nThis is a verified test email sent from the College Management ERP centralized email service.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb; margin-top: 0;">✓ College ERP Email System Diagnostic Test</h2>
      <p style="color: #334155;">The automated real email notification service is active and connected to the mail provider.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="color: #64748b; font-weight: bold;">Recipient:</td><td>${toEmail}</td></tr>
        <tr><td style="color: #64748b; font-weight: bold;">Timestamp:</td><td>${timestamp}</td></tr>
        <tr><td style="color: #64748b; font-weight: bold;">Provider:</td><td>${process.env.SMTP_HOST || 'smtp.gmail.com'}</td></tr>
      </table>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    notificationType: 'TEST',
    recipientUserId: null
  });
}

/**
 * Retrieves email notification logs for Admin Dashboard
 */
export async function getEmailLogs({ limit = 50, page = 1, status = null, recipientEmail = null } = {}) {
  const offset = (page - 1) * limit;
  let query = `
    SELECT e.*, u.username, r.name as role_name
    FROM email_notifications e
    LEFT JOIN users u ON e.recipient_user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }
  if (recipientEmail) {
    query += ` AND e.recipient_email LIKE ?`;
    params.push(`%${recipientEmail}%`);
  }

  query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);
  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM email_notifications`);

  return {
    data: rows,
    total: countRows[0]?.total || 0,
    page: Number(page),
    limit: Number(limit)
  };
}
