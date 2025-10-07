// scripts/api-smoke/create-department.js
// Node 18+ built-in fetch

const BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_NIK = process.env.ADMIN_NIK || 'ADM001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const payload = {
  namaDivisi: 'Quality Assurance',
  keterangan: 'Divisi QA untuk pengujian',
};

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nik: ADMIN_NIK, password: ADMIN_PASSWORD }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${text}`);
  }
  const json = JSON.parse(text);
  if (!json.accessToken) {
    throw new Error('Missing accessToken in login response');
  }
  return json.accessToken;
}

async function createDepartment(token) {
  const res = await fetch(`${BASE}/master-data/departments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  console.log('Create Department status:', res.status);
  console.log('Body:', body);
  if (!res.ok) {
    // If conflict, treat as non-fatal for smoke
    if (res.status === 409) {
      console.log('Conflict: Department already exists.');
      return;
    }
    throw new Error(`Create department failed ${res.status}`);
  }
}

async function main() {
  try {
    console.log('BASE:', BASE);
    const token = await login();
    console.log('Token obtained:', token.slice(0, 16) + '...');
    await createDepartment(token);
    console.log('Done.');
  } catch (e) {
    console.error('Error:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

main();