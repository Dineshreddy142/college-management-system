import fetch from 'node-fetch';

async function testAllAccounts() {
  const accounts = [
    { email: 'as1428dinesh@gmail.com', role: 'student', correct: 'Student@123' },
    { email: 'nreddydinesh1428@gmail.com', role: 'faculty', correct: 'Faculty@123' },
    { email: 'nreddydinesh@gmail.com', role: 'hod', correct: 'Hod@123' }
  ];

  for (const acc of accounts) {
    console.log('\n--- Testing Account: ' + acc.email + ' (' + acc.role + ') ---');
    
    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: 'WrongPass@' + i, role: acc.role })
      });
      const data = await res.json();
      console.log('Attempt ' + i + ' -> Status: ' + res.status + ' | Attempts: ' + data.attempts + ' | Warning: ' + Boolean(data.securityWarning) + ' | Suspicious: ' + Boolean(data.securityCaptureRequired));
    }

    // Trigger security alert
    const secRes = await fetch('http://localhost:5000/api/security-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: acc.email,
        cameraPermission: 'granted',
        userAgent: 'Mozilla/5.0 Chrome/128',
        deviceInformation: 'MacBook / Chrome'
      })
    });
    const secData = await secRes.json();
    console.log('Security Alert Dispatch -> Status: ' + secRes.status + ' | Email Sent: ' + secData.data?.emailSent);

    // Successful login resets attempts
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.correct, role: acc.role })
    });
    const loginData = await loginRes.json();
    console.log('Login Reset -> Status: ' + loginRes.status + ' | Success: ' + loginData.success);
  }
}

testAllAccounts();
