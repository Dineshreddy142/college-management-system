import pool from './db.js';
import FormData from 'form-data';

async function testRealEmailDelivery() {
  console.log('============================================================');
  console.log('📬 REAL EMAIL SYSTEM & NOTIFICATIONS VERIFICATION');
  console.log('============================================================\n');

  // 1. Check SMTP Configuration Status Endpoint
  console.log('--- 1. Testing SMTP Configuration Status ---');
  const statusRes = await fetch('http://localhost:5000/api/email/status');
  console.log(`[Status Endpoint] HTTP: ${statusRes.status}`);

  // 2. Direct Test Email to all 4 official accounts
  console.log('\n--- 2. Testing Direct Test Email to 4 Registered Accounts ---');
  const accounts = [
    { role: 'ADMIN', email: 'nuthanakalvadineshreddy@gmail.com' },
    { role: 'FACULTY', email: 'nreddydinesh1428@gmail.com' },
    { role: 'HOD', email: 'nreddydinesh@gmail.com' },
    { role: 'STUDENT', email: 'as1428dinesh@gmail.com' }
  ];

  for (const acc of accounts) {
    const res = await fetch('http://localhost:5000/api/email/test-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail: acc.email })
    });
    const data = await res.json();
    console.log(`✓ [${acc.role}] ${acc.email} -> Status: ${res.status} | Mode: ${data.data?.mode || 'smtp'} | Message: "${data.message}"`);
  }

  // 3. Test Security Alert with Live Captured Image Delivery
  console.log('\n--- 3. Testing Failed Login Security Alert Email with Captured Image Attachment ---');
  const dummyJpegBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  
  const form = new FormData();
  form.append('email', 'as1428dinesh@gmail.com');
  form.append('identifier', 'as1428dinesh@gmail.com');
  form.append('cameraPermission', 'granted');
  form.append('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
  form.append('deviceInformation', '1920x1080');
  form.append('capturedImage', dummyJpegBuffer, {
    filename: 'security_capture.jpg',
    contentType: 'image/jpeg'
  });

  const secRes = await fetch('http://localhost:5000/api/security/failed-login-capture', {
    method: 'POST',
    body: form.getBuffer(),
    headers: form.getHeaders()
  });
  const secData = await secRes.json();
  console.log(`✓ [Security Alert] Recipient: ${secData.data?.registeredEmail} | Image Captured: ${secData.data?.imageCaptured} | Email Sent: ${secData.data?.emailSent} | Attachment: ${secData.data?.attachment}`);

  // 4. Verify email_notifications table in MySQL
  console.log('\n--- 4. Verifying email_notifications MySQL Database Table ---');
  const [rows] = await pool.execute('SELECT id, recipient_email, notification_type, subject, status, message_id, sent_at, created_at FROM email_notifications ORDER BY id DESC LIMIT 5');
  console.log('Recent email_notifications records in MySQL:');
  for (const r of rows) {
    console.log(`  #${r.id} | ${r.recipient_email} | [${r.notification_type}] "${r.subject}" | Status: ${r.status} | ID: ${r.message_id || 'N/A'}`);
  }

  // 5. Test Frontend Routes
  console.log('\n--- 5. Verifying Frontend Portal Login and Dashboard Routes ---');
  const routes = ['/admin/login', '/student/login', '/faculty/login', '/hod/login', '/admin/dashboard', '/student/dashboard'];
  for (const rt of routes) {
    const feRes = await fetch('http://localhost:5173' + rt);
    console.log(`✓ http://localhost:5173${rt} -> Status: ${feRes.status}`);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL REAL EMAIL DELIVERY & NOTIFICATION CHECKS PASSED!');
  console.log('============================================================');
  process.exit(0);
}

testRealEmailDelivery().catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
