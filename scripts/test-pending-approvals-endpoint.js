/**
 * Test script untuk memverifikasi endpoint pending approvals setelah perbaikan RBAC
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test users
const ADMIN_NIK = process.env.ADMIN_NIK || 'ADM001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Try different dapur credentials
const DAPUR_CREDENTIALS = [
  { nik: 'KIT001', password: 'kitchen123' },
  { nik: 'KIT001', password: 'kit123' },
  { nik: 'DAPUR001', password: 'dapur123' },
  { nik: 'DAP001', password: 'dapur123' },
];

async function login(nik, password) {
  console.log(`[LOGIN] Testing login untuk NIK: ${nik}`);
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nik, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.log(`[LOGIN FAILED] ${nik}: ${data.message}`);
    return null;
  }

  console.log(`[LOGIN SUCCESS] ${nik} - Role: ${data.user?.role}`);
  return { token: data.accessToken, user: data.user };
}

async function testPendingApprovals(token, userRole) {
  console.log(`[TEST] Testing GET /orders/pending-approvals dengan role: ${userRole}`);
  
  const response = await fetch(`${BASE_URL}/orders/pending-approvals`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`[RESPONSE] Status: ${response.status} ${response.statusText}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`[SUCCESS] Role ${userRole} berhasil akses! Pending approvals count: ${data.length}`);
    return true;
  } else {
    const errorData = await response.text();
    console.log(`[FAILED] Role ${userRole} gagal akses: ${response.status} - ${errorData}`);
    return false;
  }
}

async function main() {
  console.log('=== Test Endpoint Pending Approvals setelah Perbaikan RBAC ===');
  console.log(`BASE URL: ${BASE_URL}\n`);
  
  // Test 1: Administrator access (should still work)
  console.log('--- Test 1: Administrator Access ---');
  const adminAuth = await login(ADMIN_NIK, ADMIN_PASSWORD);
  if (!adminAuth) {
    console.log('❌ Admin login failed - cannot proceed');
    process.exit(1);
  }
  
  const adminSuccess = await testPendingApprovals(adminAuth.token, adminAuth.user.role);
  console.log(`Admin Access: ${adminSuccess ? 'PASS ✓' : 'FAIL ❌'}\n`);
  
  // Test 2: Find working dapur credentials
  console.log('--- Test 2: Finding Dapur Credentials ---');
  let dapurAuth = null;
  
  for (const cred of DAPUR_CREDENTIALS) {
    const auth = await login(cred.nik, cred.password);
    if (auth && auth.user.role === 'dapur') {
      dapurAuth = auth;
      console.log(`✓ Found working dapur credentials: ${cred.nik}\n`);
      break;
    }
  }
  
  if (!dapurAuth) {
    console.log('❌ No working dapur credentials found. Need to create dapur user.\n');
    
    // Show all users that logged in successfully for debugging
    console.log('--- Available Users ---');
    for (const cred of DAPUR_CREDENTIALS) {
      const auth = await login(cred.nik, cred.password);
      if (auth) {
        console.log(`${cred.nik}: role=${auth.user.role}`);
      }
    }
  } else {
    // Test 3: Dapur access to pending approvals
    console.log('--- Test 3: Dapur Access to Pending Approvals ---');
    const dapurSuccess = await testPendingApprovals(dapurAuth.token, dapurAuth.user.role);
    console.log(`Dapur Access: ${dapurSuccess ? 'PASS ✓' : 'FAIL ❌'}\n`);
    
    // Summary
    console.log('=== HASIL TEST ===');
    console.log(`✓ Administrator dapat akses: ${adminSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Dapur dapat akses: ${dapurSuccess ? 'PASS' : 'FAIL'}`);
    
    if (adminSuccess && dapurSuccess) {
      console.log('\n🎉 PERBAIKAN BERHASIL! Kedua role dapat mengakses pending approvals.');
      process.exit(0);
    } else {
      console.log('\n❌ MASIH ADA MASALAH dengan akses endpoint.');
      process.exit(1);
    }
  }
}

main().catch(console.error);