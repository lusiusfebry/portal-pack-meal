/**
 * Test script untuk memverifikasi akses dapur ke pending approvals endpoint
 * Setelah perbaikan RBAC di OrdersController
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Kredensial dapur untuk testing
const DAPUR_NIK = process.env.DAPUR_NIK || 'KIT001';
const DAPUR_PASSWORD = process.env.DAPUR_PASSWORD || 'kitchen123';

async function login(nik, password) {
  console.log(`[LOGIN] Attempting login untuk NIK: ${nik}`);
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nik, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.log(`[LOGIN ERROR] Status: ${response.status}`);
    console.log(`[LOGIN ERROR] Response:`, JSON.stringify(data, null, 2));
    throw new Error(`Login failed: ${data.message || 'Unknown error'}`);
  }

  console.log(`[LOGIN SUCCESS] Role: ${data.user?.role}, Token exists: ${!!data.accessToken}`);
  return data.accessToken;
}

async function testPendingApprovals(token) {
  console.log(`[TEST] Testing GET /orders/pending-approvals with dapur token`);
  
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
    console.log(`[SUCCESS] Berhasil mengakses pending approvals!`);
    console.log(`[SUCCESS] Jumlah pending approvals: ${data.length}`);
    console.log(`[SUCCESS] Data:`, JSON.stringify(data, null, 2));
    return true;
  } else {
    const errorData = await response.text();
    console.log(`[FAILED] Error accessing pending approvals:`);
    console.log(`[FAILED] Response:`, errorData);
    return false;
  }
}

async function testAdminAccess() {
  console.log(`\n[ADMIN TEST] Testing administrator masih bisa akses...`);
  
  try {
    const adminToken = await login('ADM001', 'admin123');
    const success = await testPendingApprovals(adminToken);
    console.log(`[ADMIN TEST] Administrator access: ${success ? 'PASS' : 'FAIL'}`);
    return success;
  } catch (e) {
    console.log(`[ADMIN TEST] Administrator test failed:`, e.message);
    return false;
  }
}

async function main() {
  console.log('=== Test Perbaikan RBAC untuk Dapur Pending Approvals ===');
  console.log(`BASE URL: ${BASE_URL}`);
  
  try {
    // Test 1: Login dapur dan akses pending approvals
    console.log('\n--- Test 1: Dapur Access ---');
    const dapurToken = await login(DAPUR_NIK, DAPUR_PASSWORD);
    const dapurSuccess = await testPendingApprovals(dapurToken);
    
    // Test 2: Verify administrator masih bisa akses
    console.log('\n--- Test 2: Administrator Access ---');
    const adminSuccess = await testAdminAccess();
    
    // Summary
    console.log('\n=== HASIL TEST ===');
    console.log(`✓ Dapur dapat akses pending approvals: ${dapurSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Administrator masih dapat akses: ${adminSuccess ? 'PASS' : 'FAIL'}`);
    
    if (dapurSuccess && adminSuccess) {
      console.log('\n🎉 PERBAIKAN BERHASIL! Role dapur sekarang bisa akses pending approvals tanpa mengganggu administrator.');
      process.exit(0);
    } else {
      console.log('\n❌ MASIH ADA MASALAH! Perlu investigasi lebih lanjut.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);