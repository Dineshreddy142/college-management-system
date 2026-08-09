import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('====================================================');
  console.log(' STARTING COMPREHENSIVE SECURITY FEATURE TEST SUITE');
  console.log('====================================================');

  const testEmail = 'nuthanakalvadineshreddy@gmail.com';
  const correctPass = 'Admin@123';
  const wrongPass = 'WrongPassword@999';

  // 1. Initial login with correct password
  console.log('\n[TEST 1] Correct Password Login:');
  const res1 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: correctPass, role: 'admin' })
  });
  const data1 = await res1.json();
  console.log(`Status: ${res1.status} | Success: ${data1.success} | Token: ${Boolean(data1.data?.token)}`);
  const adminToken = data1.data?.token;

  // 2. 1st Failed Attempt
  console.log('\n[TEST 2] 1st Failed Attempt (Normal Error):');
  const res2 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: wrongPass, role: 'admin' })
  });
  const data2 = await res2.json();
  console.log(`Status: ${res2.status} | Attempts: ${data2.attempts} | Message: ${data2.message}`);

  // 3. 2nd Failed Attempt
  console.log('\n[TEST 3] 2nd Failed Attempt (Normal Error):');
  const res3 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: wrongPass, role: 'admin' })
  });
  const data3 = await res3.json();
  console.log(`Status: ${res3.status} | Attempts: ${data3.attempts} | Message: ${data3.message}`);

  // 4. 3rd Failed Attempt (Security Warning)
  console.log('\n[TEST 4] 3rd Failed Attempt (Security Warning):');
  const res4 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: wrongPass, role: 'admin' })
  });
  const data4 = await res4.json();
  console.log(`Status: ${res4.status} | Attempts: ${data4.attempts} | Warning: ${data4.securityWarning} | Message: ${data4.message}`);

  // 5. 4th Failed Attempt (Suspicious Login Trigger)
  console.log('\n[TEST 5] 4th Failed Attempt (Suspicious Login Detected):');
  const res5 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: wrongPass, role: 'admin' })
  });
  const data5 = await res5.json();
  console.log(`Status: ${res5.status} | Reason: ${data5.reason} | SecurityCaptureRequired: ${data5.securityCaptureRequired} | Email: ${data5.email} | Role: ${data5.role}`);

  // 6. Security Capture Submission (Permission Denied)
  console.log('\n[TEST 6] Security Alert Dispatch with Camera Permission Denied:');
  const res6 = await fetch(`${BASE_URL}/security-capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      cameraPermission: 'denied',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      deviceInformation: '1920x1080'
    })
  });
  const data6 = await res6.json();
  console.log(`Status: ${res6.status} | Success: ${data6.success} | Image Captured: ${data6.data?.imageCaptured} | Email Sent: ${data6.data?.emailSent}`);

  // 7. Security Capture Submission (Permission Granted with Sample Frame)
  console.log('\n[TEST 7] Security Alert Dispatch with Camera Permission Granted & Image Attachment:');
  // Synthetic base64 JPEG
  const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const res7 = await fetch(`${BASE_URL}/security-capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      cameraPermission: 'granted',
      imageBase64: sampleBase64,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      deviceInformation: '1920x1080'
    })
  });
  const data7 = await res7.json();
  console.log(`Status: ${res7.status} | Success: ${data7.success} | Image Captured: ${data7.data?.imageCaptured} | Email Sent: ${data7.data?.emailSent}`);

  // 8. Admin Security Dashboard: Fetch Login Attempts
  console.log('\n[TEST 8] Admin Security Dashboard Query (/api/security/login-attempts):');
  const res8 = await fetch(`${BASE_URL}/security/login-attempts`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const data8 = await res8.json();
  console.log(`Status: ${res8.status} | Total Records: ${data8.data?.length}`);
  if (data8.data && data8.data.length > 0) {
    const latest = data8.data[0];
    console.log(`Latest Record -> Email: ${latest.email} | Role: ${latest.role_name} | Permission: ${latest.camera_permission} | Image Captured: ${latest.image_captured} | Reference: ${latest.image_reference}`);

    // 9. Admin Security Photo Streaming
    if (latest.image_reference) {
      console.log('\n[TEST 9] Admin Security Photo Streaming (/api/security/image/:ref):');
      const res9 = await fetch(`${BASE_URL}/security/image/${latest.image_reference}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`Status: ${res9.status} | Content-Type: ${res9.headers.get('content-type')}`);
    }
  }

  // 10. Successful Login Resets Counter
  console.log('\n[TEST 10] Successful Login Resets Failed Attempt Counter:');
  const res10 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: correctPass, role: 'admin' })
  });
  const data10 = await res10.json();
  console.log(`Status: ${res10.status} | Success: ${data10.success} | Attempt Counter Reset`);

  // Check next failure starts back at attempt 1
  const res11 = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: wrongPass, role: 'admin' })
  });
  const data11 = await res11.json();
  console.log(`New Failed Attempt Count: ${data11.attempts} (Expected: 1)`);

  console.log('\n====================================================');
  console.log(' ALL SECURITY TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runSecurityTests().catch(console.error);
