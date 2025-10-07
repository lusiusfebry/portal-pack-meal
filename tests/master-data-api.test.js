/**
 * Master Data API Integration Tests
 * Testing Department, Jabatan, dan Shift endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test credentials - admin user
const ADMIN_CREDENTIALS = {
  nik: 'ADM001',
  password: 'admin123'
};

// Test data untuk CRUD operations
const TEST_DATA = {
  department: {
    namaDivisi: 'Test Department',
    keterangan: 'Department untuk testing'
  },
  jabatan: {
    namaJabatan: 'Test Jabatan',
    keterangan: 'Jabatan untuk testing'
  },
  shift: {
    namaShift: 'Test Shift',
    jamMulai: '08:00:00',
    jamSelesai: '17:00:00',
    keterangan: 'Shift untuk testing'
  }
};

class MasterDataTester {
  constructor() {
    this.results = {
      auth: { passed: 0, failed: 0, tests: [] },
      department: { passed: 0, failed: 0, tests: [] },
      jabatan: { passed: 0, failed: 0, tests: [] },
      shift: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] }
    };
  }

  async test(description, testFn, category = 'general') {
    try {
      console.log(`🧪 Testing: ${description}`);
      const result = await testFn();
      this.results[category].passed++;
      this.results[category].tests.push({
        description,
        status: 'PASSED',
        result
      });
      console.log(`✅ PASSED: ${description}`);
      return result;
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({
        description,
        status: 'FAILED',
        error: error.message,
        response: error.response?.data
      });
      console.log(`❌ FAILED: ${description}`);
      console.log(`   Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw error;
    }
  }

  async authenticateAdmin() {
    return this.test('Admin Authentication', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
      authToken = response.data.accessToken;
      
      if (!authToken) {
        throw new Error('No access token received');
      }
      
      return { token: authToken, user: response.data.user };
    }, 'auth');
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Department CRUD Tests
  async testDepartmentCRUD() {
    let createdId;

    // Test Create Department
    const createResult = await this.test('Create Department', async () => {
      const response = await axios.post(
        `${BASE_URL}/master-data/departments`,
        TEST_DATA.department,
        { headers: this.getAuthHeaders() }
      );
      createdId = response.data.id;
      return response.data;
    }, 'department');

    // Test Get All Departments
    await this.test('Get All Departments', async () => {
      const response = await axios.get(
        `${BASE_URL}/master-data/departments`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'department');

    // Test Update Department
    await this.test('Update Department', async () => {
      const updateData = { namaDivisi: 'Updated Test Department' };
      const response = await axios.patch(
        `${BASE_URL}/master-data/departments/${createdId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'department');

    // Test Delete Department
    await this.test('Delete Department', async () => {
      const response = await axios.delete(
        `${BASE_URL}/master-data/departments/${createdId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'department');
  }

  // Jabatan CRUD Tests
  async testJabatanCRUD() {
    let createdId;

    const createResult = await this.test('Create Jabatan', async () => {
      const response = await axios.post(
        `${BASE_URL}/master-data/jabatan`,
        TEST_DATA.jabatan,
        { headers: this.getAuthHeaders() }
      );
      createdId = response.data.id;
      return response.data;
    }, 'jabatan');

    await this.test('Get All Jabatan', async () => {
      const response = await axios.get(
        `${BASE_URL}/master-data/jabatan`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'jabatan');

    await this.test('Update Jabatan', async () => {
      const updateData = { namaJabatan: 'Updated Test Jabatan' };
      const response = await axios.patch(
        `${BASE_URL}/master-data/jabatan/${createdId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'jabatan');

    await this.test('Delete Jabatan', async () => {
      const response = await axios.delete(
        `${BASE_URL}/master-data/jabatan/${createdId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'jabatan');
  }

  // Shift CRUD Tests
  async testShiftCRUD() {
    let createdId;

    const createResult = await this.test('Create Shift', async () => {
      const response = await axios.post(
        `${BASE_URL}/master-data/shifts`,
        TEST_DATA.shift,
        { headers: this.getAuthHeaders() }
      );
      createdId = response.data.id;
      return response.data;
    }, 'shift');

    await this.test('Get All Shifts', async () => {
      const response = await axios.get(
        `${BASE_URL}/master-data/shifts`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'shift');

    await this.test('Update Shift', async () => {
      const updateData = { namaShift: 'Updated Test Shift' };
      const response = await axios.patch(
        `${BASE_URL}/master-data/shifts/${createdId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'shift');

    await this.test('Delete Shift', async () => {
      const response = await axios.delete(
        `${BASE_URL}/master-data/shifts/${createdId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    }, 'shift');
  }

  // Security Tests
  async testSecurity() {
    // Test without authentication
    await this.test('Access without token should fail', async () => {
      try {
        await axios.get(`${BASE_URL}/master-data/departments`);
        throw new Error('Expected 401 Unauthorized');
      } catch (error) {
        if (error.response?.status === 401) {
          return 'Correctly blocked unauthorized access';
        }
        throw error;
      }
    }, 'security');

    // Test with invalid token
    await this.test('Access with invalid token should fail', async () => {
      try {
        await axios.get(`${BASE_URL}/master-data/departments`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        });
        throw new Error('Expected 401 Unauthorized');
      } catch (error) {
        if (error.response?.status === 401) {
          return 'Correctly blocked invalid token';
        }
        throw error;
      }
    }, 'security');
  }

  // Validation Tests
  async testValidation() {
    // Test invalid department data
    await this.test('Create department with invalid data should fail', async () => {
      try {
        await axios.post(
          `${BASE_URL}/master-data/departments`,
          { namaDivisi: '' }, // Empty name should fail
          { headers: this.getAuthHeaders() }
        );
        throw new Error('Expected validation error');
      } catch (error) {
        if (error.response?.status === 400) {
          return 'Correctly rejected invalid data';
        }
        throw error;
      }
    }, 'department');

    // Test invalid shift data
    await this.test('Create shift with invalid time should fail', async () => {
      try {
        await axios.post(
          `${BASE_URL}/master-data/shifts`,
          { 
            namaShift: 'Test Shift',
            jamMulai: '25:00', // Invalid time
            jamSelesai: '17:00'
          },
          { headers: this.getAuthHeaders() }
        );
        throw new Error('Expected validation error');
      } catch (error) {
        if (error.response?.status === 400) {
          return 'Correctly rejected invalid time format';
        }
        throw error;
      }
    }, 'shift');
  }

  async runAllTests() {
    console.log('🚀 Starting Master Data API Testing...\n');

    try {
      // Authentication
      await this.authenticateAdmin();
      
      // Security tests
      await this.testSecurity();
      
      // CRUD Tests
      await this.testDepartmentCRUD();
      await this.testJabatanCRUD();
      await this.testShiftCRUD();
      
      // Validation tests
      await this.testValidation();

    } catch (error) {
      console.log('\n❌ Testing stopped due to critical error:', error.message);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TESTING SUMMARY');
    console.log('==================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([category, results]) => {
      if (results.tests.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        
        totalPassed += results.passed;
        totalFailed += results.failed;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`OVERALL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log(`SUCCESS RATE: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);
  }
}

// Run the tests
if (require.main === module) {
  const tester = new MasterDataTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MasterDataTester;