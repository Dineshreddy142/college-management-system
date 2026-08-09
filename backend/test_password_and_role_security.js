import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const PORTALS = [
  { role: 'admin', expectedRole: 'Admin', email: 'admin@collegeerp.com', pass: 'Admin@123', port: 5171 },
  { role: 'student', expectedRole: 'Student', email: 'student@collegeerp.com', pass: 'Student@123', port: 5172 },
  { role: 'faculty', expectedRole: 'Faculty', email: 'faculty@collegeerp.com', pass: 'Faculty@123', port: 5173 },
  { role: 'hod', expectedRole: 'HOD', email: 'hod@collegeerp.com', pass: 'Hod@123', port: 5174 },
  { role: 'parent', expectedRole: 'Parent', email: 'parent@collegeerp.com', pass: 'Parent@123', port: 5175 },
  { role: 'principal', expectedRole: 'Principal', email: 'principal@collegeerp.com', pass: 'Principal@123', port: 5176 },
  { role: 'office', expectedRole: 'Accountant', email: 'accounts@collegeerp.com', pass: 'Accounts@123', port: 5177 },
];

function makePostRequest(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

function makeGetRequest(urlPath, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runSecuritySuite() {
  console.log('========================================================================');
  console.log('  🔒 7-PORTAL PASSWORD & ROLE ISOLATION SECURITY VERIFICATION SUITE');
  console.log('========================================================================\n');

  let total = 0;
  let passed = 0;
  let failed = 0;
  const tokens = {};

  // 1. Test Valid Credentials for All 7 Portals
  console.log('--- TEST 1: VALID PASSWORD & PORTAL ROLE ACCESS (7 PORTALS) ---');
  for (const portal of PORTALS) {
    total++;
    try {
      const res = await makePostRequest('/api/login', {
        identifier: portal.email,
        password: portal.pass,
        portalRole: portal.role
      });

      if (res.status === 200 && res.body.success && res.body.data?.token) {
        console.log(`  ✅ [PASS] ${portal.role.toUpperCase()} Login (${portal.email}) -> HTTP 200 OK`);
        tokens[portal.role] = res.body.data.token;
        passed++;
      } else {
        console.log(`  ❌ [FAIL] ${portal.role.toUpperCase()} Login (${portal.email}) -> Status ${res.status}: ${JSON.stringify(res.body)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] ${portal.role.toUpperCase()} Login (${portal.email}) -> Error: ${err.message}`);
      failed++;
    }
  }

  // 2. Test Token Validation Route GET /api/validate-token
  console.log('\n--- TEST 2: TOKEN VALIDATION ROUTE GET /api/validate-token ---');
  for (const portal of PORTALS) {
    total++;
    try {
      const token = tokens[portal.role];
      const res = await makeGetRequest('/api/validate-token', token);

      if (res.status === 200 && res.body.success && res.body.data?.user?.email === portal.email) {
        console.log(`  ✅ [PASS] ${portal.role.toUpperCase()} Token Validation -> HTTP 200 OK (${res.body.data.user.email})`);
        passed++;
      } else {
        console.log(`  ❌ [FAIL] ${portal.role.toUpperCase()} Token Validation -> Status ${res.status}: ${JSON.stringify(res.body)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] ${portal.role.toUpperCase()} Token Validation -> Error: ${err.message}`);
      failed++;
    }
  }

  // 3. Test 7x7 Role-Based Portal Isolation Matrix (Cross-Portal Access Rejection)
  console.log('\n--- TEST 3: 7x7 CROSS-PORTAL ISOLATION MATRIX (ROLE_MISMATCH REJECTION) ---');
  for (const userAcc of PORTALS) {
    for (const portalTarget of PORTALS) {
      if (userAcc.role === portalTarget.role) continue; // Skip matching portal
      
      total++;
      try {
        const res = await makePostRequest('/api/login', {
          identifier: userAcc.email,
          password: userAcc.pass,
          portalRole: portalTarget.role
        });

        if (res.status === 403 && res.body.code === 'ROLE_MISMATCH') {
          console.log(`  ✅ [PASS] ${userAcc.role.toUpperCase()} user on ${portalTarget.role.toUpperCase()} portal -> HTTP 403 ROLE_MISMATCH`);
          passed++;
        } else {
          console.log(`  ❌ [FAIL] ${userAcc.role.toUpperCase()} user on ${portalTarget.role.toUpperCase()} portal -> Status ${res.status} (Expected 403 ROLE_MISMATCH)`);
          failed++;
        }
      } catch (err) {
        console.log(`  ❌ [FAIL] Error testing ${userAcc.role} on ${portalTarget.role}: ${err.message}`);
        failed++;
      }
    }
  }

  // 4. Test Invalid Password Rejection
  console.log('\n--- TEST 4: INVALID PASSWORD REJECTION ---');
  for (const portal of PORTALS) {
    total++;
    try {
      const res = await makePostRequest('/api/login', {
        identifier: portal.email,
        password: 'WrongPassword123!',
        portalRole: portal.role
      });

      if (res.status === 401 || res.status === 400) {
        console.log(`  ✅ [PASS] ${portal.role.toUpperCase()} Wrong Password -> Rejection HTTP ${res.status}`);
        passed++;
      } else {
        console.log(`  ❌ [FAIL] ${portal.role.toUpperCase()} Wrong Password -> Unexpected Status ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] Error testing wrong password: ${err.message}`);
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED (${failed} FAILED)`);
  console.log('========================================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSecuritySuite();
