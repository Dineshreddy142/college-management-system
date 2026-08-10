async function runValidationTests() {
  const backendBaseUrl = 'https://college-management-system-xqea.onrender.com/api';
  const vercelProxyUrl = 'https://college-management-system-khaki.vercel.app/api';
  const adminEmail = 'nuthanakalvadineshreddy@gmail.com';
  const adminPassword = 'Dinesh@123';

  console.log('========================================================================');
  console.log('   PERMANENT ADMIN AUTHENTICATION & RBAC ISOLATION TEST SUITE');
  console.log('========================================================================\n');

  // --- TEST 1: ADMIN LOGIN VIA BACKEND API ---
  console.log('--- TEST 1: Admin Portal Login with Valid Credentials ---');
  try {
    const res = await fetch(`${backendBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminEmail,
        password: adminPassword,
        portalRole: 'admin'
      })
    });
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response Payload:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.success && data.data?.token && data.data?.user?.role === 'Admin') {
      console.log('✔ PASS: Admin logged in successfully with valid JWT and role Admin!\n');
    } else {
      console.error('✖ FAIL: Admin login failed\n');
    }
  } catch (e) {
    console.error('✖ ERROR in Test 1:', e.message);
  }

  // --- TEST 2: ADMIN LOGIN VIA VERCEL EDGE REVERSE PROXY ---
  console.log('--- TEST 2: Admin Login via Vercel Production Reverse-Proxy ---');
  try {
    const res = await fetch(`${vercelProxyUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminEmail,
        password: adminPassword,
        portalRole: 'admin'
      })
    });
    console.log('Vercel Proxy HTTP Status:', res.status);
    const data = await res.json();
    if (res.status === 200 && data.success) {
      console.log('✔ PASS: Vercel Edge Proxy forwarded login request and returned 200 OK!\n');
    } else {
      console.error('✖ FAIL: Vercel proxy login failed\n');
    }
  } catch (e) {
    console.error('✖ ERROR in Test 2:', e.message);
  }

  // --- TEST 3: REJECT WRONG PASSWORD ---
  console.log('--- TEST 3: Security Check - Wrong Password Attempt ---');
  try {
    const res = await fetch(`${backendBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminEmail,
        password: 'IncorrectPassword@999',
        portalRole: 'admin'
      })
    });
    console.log('Wrong Password HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response:', data.message);
    if (res.status === 401 && !data.success) {
      console.log('✔ PASS: Wrong password rejected with 401 Unauthorized!\n');
    } else {
      console.error('✖ FAIL: Wrong password was not rejected properly\n');
    }
  } catch (e) {
    console.error('✖ ERROR in Test 3:', e.message);
  }

  // --- TEST 4: ROLE ISOLATION / PREVENT ACCESS TO OTHER PORTALS ---
  console.log('--- TEST 4: Server-Side Portal Isolation Enforcement ---');
  const otherPortals = ['student', 'faculty', 'hod', 'parent', 'principal', 'office'];

  for (const portal of otherPortals) {
    try {
      const res = await fetch(`${backendBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: adminEmail,
          password: adminPassword,
          portalRole: portal
        })
      });
      const data = await res.json();
      console.log(`Portal [${portal.toUpperCase()}]: Status ${res.status} => ${data.message || data.error}`);
      if (res.status === 403 && data.code === 'ROLE_MISMATCH') {
        console.log(`✔ PASS: Access to ${portal.toUpperCase()} portal correctly blocked with 403 Forbidden.`);
      } else {
        console.error(`✖ FAIL: Portal ${portal} isolation failed!`);
      }
    } catch (e) {
      console.error(`✖ ERROR testing ${portal} portal:`, e.message);
    }
  }

  console.log('\n========================================================================');
  console.log('   ALL AUTHENTICATION & SECURITY VALIDATION TESTS COMPLETED!');
  console.log('========================================================================');
}

runValidationTests().catch(console.error);
