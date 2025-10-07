// activate-user.js
// Utility CLI to activate user, diagnose login issues, and reset user state with audit logging.
// Usage examples:
//   node activate-user.js --nik EMP001 --activate
//   node activate-user.js --nik EMP001 --diagnose --password emp123 --probe-http
//   node activate-user.js --nik EMP001 --reset --role employee --probe-http --admin-nik ADM001
//
// Notes:
// - Loads environment from backend/.env (fallback: backend/.env.example)
// - Uses PrismaClient to operate on database directly (tables: users, master_karyawan, log_audit_trail)
// - Mimics AuthService token generation and password validation
// - Optional HTTP probe will call backend /api/auth/login if server is running
//
// This script adheres to backend conventions:
// - JWT payload shape: see backend/src/common/interfaces/jwt-payload.interface.ts
// - Audit actions analogous to AuditTrailService helpers
// - Username equals NIK,, node activate-user.js --nik ADM001 --activate --admin-nik ADM001

'use strict';

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
let PrismaClient;
try {
  // Prefer regular package resolution (workspace hoisting)
  ({ PrismaClient } = require('@prisma/client'));
} catch (e) {
  try {
    // Fallback to backend-local Prisma client if not hoisted
    ({ PrismaClient } = require(path.resolve(__dirname, 'backend/node_modules/@prisma/client')));
  } catch (e2) {
    console.error('[ERROR] @prisma/client not found. Run: npm exec -w backend prisma generate');
    process.exit(1);
  }
}
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require(path.resolve(__dirname, 'backend/node_modules/bcrypt'));
  } catch (e2) {
    console.error('[ERROR] bcrypt not found. Install deps or run from workspace root where deps are hoisted.');
    process.exit(1);
  }
}
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  try {
    jwt = require(path.resolve(__dirname, 'backend/node_modules/jsonwebtoken'));
  } catch (e2) {
    console.error('[ERROR] jsonwebtoken not found. Install deps or run from workspace root.');
    process.exit(1);
  }
}
let axios;
try {
  axios = require('axios');
} catch (e) {
  try {
    axios = require(path.resolve(__dirname, 'backend/node_modules/axios'));
  } catch (e2) {
    // Optional; only needed for HTTP probe. We'll gate usage.
    axios = null;
  }
}

const prisma = new PrismaClient();

// ----------------------------- ENV LOADING -----------------------------
function loadEnv() {
  const envPath = fs.existsSync(path.join(__dirname, 'backend/.env'))
    ? path.join(__dirname, 'backend/.env')
    : fs.existsSync(path.join(__dirname, 'backend/.env.example'))
      ? path.join(__dirname, 'backend/.env.example')
      : null;
  if (envPath) {
    dotenv.config({ path: envPath });
    console.log(`[INFO] Loaded environment from ${path.relative(process.cwd(), envPath)}`);
  } else {
    console.warn('[WARN] No backend/.env found. Using process.env defaults if any.');
  }

  // Sensible defaults mirroring AuthService
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefresh';
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  process.env.PORT = process.env.PORT || '3000';
}

// ----------------------------- ARG PARSING -----------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    nik: null,
    adminNik: null,
    password: null,
    role: null,
    activate: false,
    diagnose: false,
    reset: false,
    probeHttp: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--nik') flags.nik = args[++i];
    else if (a === '--admin-nik') flags.adminNik = args[++i];
    else if (a === '--password') flags.password = args[++i];
    else if (a === '--role') flags.role = args[++i];
    else if (a === '--activate') flags.activate = true;
    else if (a === '--diagnose') flags.diagnose = true;
    else if (a === '--reset') flags.reset = true;
    else if (a === '--probe-http') flags.probeHttp = true;
    else if (a === '--help') {
      printUsageAndExit();
    } else {
      console.warn(`[WARN] Unknown argument: ${a}`);
    }
  }

  if (!flags.nik) {
    printUsageAndExit('[ERROR] --nik is required');
  }
  return flags;
}

function printUsageAndExit(msg) {
  if (msg) console.error(msg);
  console.log(`
Usage:
  node activate-user.js --nik <NIK> --activate [--admin-nik <ADMIN_NIK>]
  node activate-user.js --nik <NIK> --diagnose [--password <PWD>] [--probe-http]
  node activate-user.js --nik <NIK> --reset [--role <roleAccess>] [--probe-http] [--admin-nik <ADMIN_NIK>]

Examples:
  node activate-user.js --nik EMP001 --activate --admin-nik ADM001
  node activate-user.js --nik EMP001 --diagnose --password emp123 --probe-http
  node activate-user.js --nik EMP001 --reset --role employee --probe-http --admin-nik ADM001

Notes:
  - roleAccess must be one of: administrator | employee | dapur | delivery
  - --probe-http will attempt POST http://localhost:${process.env.PORT || '3000'}/api/auth/login
  - Audit logs will attribute to admin if --admin-nik resolves to a karyawan; otherwise userId=null
`);
  process.exit(msg ? 1 : 0);
}

// ----------------------------- UTILS -----------------------------
async function auditLog(userId, aksi, detail) {
  try {
    return await prisma.auditTrail.create({
      data: {
        userId: userId ?? null,
        aksi,
        detail: detail ?? null,
      },
    });
  } catch (e) {
    console.error('[ERROR] Failed to write audit log:', e.message);
  }
}

async function getKaryawanByNik(nik, includeUser = true) {
  return prisma.karyawan.findUnique({
    where: { nomorIndukKaryawan: nik },
    include: includeUser ? { user: true, department: true, jabatan: true } : undefined,
  });
}

async function getAdminIdByNik(adminNik) {
  if (!adminNik) return null;
  const admin = await prisma.karyawan.findUnique({
    where: { nomorIndukKaryawan: adminNik },
  });
  return admin ? admin.id : null;
}

function buildJwtPayload(k) {
  if (!k || !k.user) throw new Error('Invalid karyawan object for JWT payload');
  return {
    sub: k.user.id,
    karyawanId: k.id,
    nik: k.nomorIndukKaryawan,
    role: k.roleAccess,
  };
}

async function signTokens(k) {
  const payload = buildJwtPayload(k);
  const accessToken = await new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => (err ? reject(err) : resolve(token))
    );
  });
  const refreshToken = await new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
      (err, token) => (err ? reject(err) : resolve(token))
    );
  });
  return { accessToken, refreshToken };
}

function decodeJwt(token, secretHint = 'access') {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return { decoded, valid: !!decoded, hint: secretHint };
  } catch (e) {
    return { decoded: null, valid: false, hint: secretHint, error: e.message };
  }
}

// ----------------------------- OPERATIONS -----------------------------

// 1) Activate user: set isActive = true, log, and verify
async function activateUser(nik, adminId) {
  const k = await getKaryawanByNik(nik, true);
  if (!k) {
    console.error(`[ERROR] Karyawan with NIK ${nik} not found`);
    return { success: false };
  }

  if (k.isActive) {
    console.log(`[INFO] Karyawan ${nik} already active (no change)`);
  } else {
    await prisma.karyawan.update({
      where: { id: k.id },
      data: { isActive: true },
    });
    await auditLog(adminId, 'USER_STATUS_CHANGED', `Admin activated user ${nik}`);
    console.log(`[OK] Activated karyawan ${nik}`);
  }

  const k2 = await getKaryawanByNik(nik, true);
  console.log('[VERIFY] Karyawan status:', { isActive: k2?.isActive, hasUser: !!k2?.user });
  return { success: true, karyawan: k2 };
}

// 2) Diagnose login: verify presence, active, bcrypt, token generation, optional HTTP probe, frontend config
async function diagnoseLogin(nik, password, probeHttp) {
  const result = { checks: [] };

  const k = await getKaryawanByNik(nik, true);
  if (!k) {
    result.checks.push({ step: 'presence', ok: false, msg: `Karyawan ${nik} not found` });
    console.log('[DIAGNOSE] Karyawan presence:', result.checks.at(-1));
    return result;
  }
  result.checks.push({ step: 'presence', ok: true, msg: 'Karyawan found' });

  result.checks.push({ step: 'active', ok: !!k.isActive, msg: `isActive=${k.isActive}` });
  result.checks.push({ step: 'userLink', ok: !!k.user, msg: `hasUser=${!!k.user}` });

  if (k.user && password) {
    try {
      const ok = await bcrypt.compare(password, k.user.passwordHash);
      result.checks.push({ step: 'bcryptCompare', ok, msg: ok ? 'Password valid' : 'Password invalid' });
    } catch (e) {
      result.checks.push({ step: 'bcryptCompare', ok: false, msg: e.message });
    }
  } else {
    result.checks.push({ step: 'bcryptCompare', ok: false, msg: 'Skipped (missing user or password)' });
  }

  if (k.user) {
    try {
      const { accessToken, refreshToken } = await signTokens(k);
      const a = decodeJwt(accessToken, 'access');
      const r = decodeJwt(refreshToken, 'refresh');
      result.checks.push({ step: 'tokenGenerate', ok: !!accessToken && !!refreshToken, msg: 'JWT generated' });
      result.checks.push({
        step: 'tokenDecode',
        ok: a.valid && r.valid,
        msg: `Access iat/exp: ${(a.decoded && a.decoded.payload && a.decoded.payload.iat) || '-'} / ${(a.decoded && a.decoded.payload && a.decoded.payload.exp) || '-'}`,
      });
    } catch (e) {
      result.checks.push({ step: 'tokenGenerate', ok: false, msg: e.message });
    }
  } else {
    result.checks.push({ step: 'tokenGenerate', ok: false, msg: 'Skipped (no user)' });
  }

  // Frontend/.env sanity and optional HTTP probe to backend
  let apiBase = null;
  const feEnvPath = fs.existsSync(path.join(__dirname, 'frontend/.env'))
    ? path.join(__dirname, 'frontend/.env')
    : fs.existsSync(path.join(__dirname, 'frontend/.env.example'))
      ? path.join(__dirname, 'frontend/.env.example')
      : null;
  if (feEnvPath) {
    const feEnv = fs.readFileSync(feEnvPath, 'utf8');
    const m = feEnv.match(/VITE_API_BASE_URL\s*=\s*(.*)/);
    apiBase = m ? m[1].trim() : null;
    result.checks.push({ step: 'frontendEnv', ok: !!apiBase, msg: `VITE_API_BASE_URL=${apiBase || '-'}` });
  } else {
    result.checks.push({ step: 'frontendEnv', ok: false, msg: 'No frontend .env found' });
  }

  if (probeHttp) {
    if (!axios) {
      result.checks.push({ step: 'httpProbe', ok: false, msg: 'axios not available' });
    } else if (!password) {
      result.checks.push({ step: 'httpProbe', ok: false, msg: 'Requires --password' });
    } else {
      const url = `http://localhost:${process.env.PORT || '3000'}/api/auth/login`;
      try {
        const resp = await axios.post(url, { nik, password }, { timeout: 5000 });
        result.checks.push({ step: 'httpProbe', ok: true, msg: `HTTP login OK, user.id=${resp.data?.user?.id || '-'}` });
      } catch (e) {
        result.checks.push({ step: 'httpProbe', ok: false, msg: e.response?.data?.message || e.message });
      }
    }
  } else {
    result.checks.push({ step: 'httpProbe', ok: false, msg: 'Skipped (--probe-http not set)' });
  }

  console.table(result.checks);
  await auditLog(null, 'SCRIPT_DIAGNOSE_LOGIN', `Diagnose for ${nik}: ${JSON.stringify(result.checks)}`);
  return result;
}

// 3) Reset complete user state: ensure consistency, reset password, activate, verify login
async function resetUserState(nik, roleAccess, adminId, probeHttp) {
  const out = { tempPassword: null, changes: [] };

  let k = await getKaryawanByNik(nik, true);
  if (!k) {
    out.changes.push({ step: 'presence', ok: false, msg: `Karyawan ${nik} not found` });
    console.table(out.changes);
    return out;
  }
  out.changes.push({ step: 'presence', ok: true, msg: 'Karyawan found' });

  // Ensure user exists
  if (!k.user) {
    // Create user with username=nik, role from karyawan or provided, temp password
    const tempPwd = generateTemporaryPassword();
    const hash = await bcrypt.hash(tempPwd, 10);
    const roleToUse = (roleAccess || k.roleAccess);
    const user = await prisma.user.create({
      data: {
        username: nik,
        passwordHash: hash,
        role: roleToUse,
      },
    });
    out.tempPassword = tempPwd;
    out.changes.push({ step: 'userCreate', ok: true, msg: `Created user.id=${user.id} with role=${roleToUse}` });

    // Link karyawan.userId and ensure isActive true and roleAccess consistent
    k = await prisma.karyawan.update({
      where: { id: k.id },
      data: {
        userId: user.id,
        isActive: true,
        roleAccess: roleToUse,
        keterangan: null,
      },
      include: { user: true },
    });
    out.changes.push({ step: 'linkKaryawan', ok: true, msg: `Linked karyawan.id=${k.id} to user.id=${user.id}` });
    await auditLog(adminId, 'USER_CREATED', `Created user ${nik} and linked to karyawan ${k.id}`);
    await auditLog(adminId, 'USER_STATUS_CHANGED', `Admin activated user ${nik}`);
  } else {
    // Reset password to temp, activate, align roles optionally
    const tempPwd = generateTemporaryPassword();
    const hash = await bcrypt.hash(tempPwd, 10);
    await prisma.user.update({
      where: { id: k.user.id },
      data: { passwordHash: hash, role: roleAccess || k.roleAccess },
    });
    out.tempPassword = tempPwd;
    out.changes.push({ step: 'passwordReset', ok: true, msg: `Reset password for user.id=${k.user.id}` });

    k = await prisma.karyawan.update({
      where: { id: k.id },
      data: {
        isActive: true,
        roleAccess: roleAccess || k.roleAccess,
        keterangan: null,
      },
      include: { user: true },
    });
    out.changes.push({ step: 'activateKaryawan', ok: true, msg: `Karyawan ${nik} activated` });
    await auditLog(adminId, 'PASSWORD_RESET', `Admin reset password for user ${nik}`);
    await auditLog(adminId, 'USER_STATUS_CHANGED', `Admin activated user ${nik}`);
  }

  // Verify login with temp password via local checks and optional HTTP probe
  // Local bcrypt compare
  try {
    const ok = await bcrypt.compare(out.tempPassword, k.user.passwordHash);
    out.changes.push({ step: 'bcryptVerify', ok, msg: ok ? 'Temp password valid' : 'Temp password invalid' });
  } catch (e) {
    out.changes.push({ step: 'bcryptVerify', ok: false, msg: e.message });
  }

  // Token generation
  try {
    const { accessToken, refreshToken } = await signTokens(k);
    const a = decodeJwt(accessToken, 'access');
    const r = decodeJwt(refreshToken, 'refresh');
    out.changes.push({ step: 'tokenGenerate', ok: !!accessToken && !!refreshToken, msg: 'JWT generated' });
    out.changes.push({ step: 'tokenDecode', ok: a.valid && r.valid, msg: 'Tokens decodable' });
  } catch (e) {
    out.changes.push({ step: 'tokenGenerate', ok: false, msg: e.message });
  }

  if (probeHttp && axios) {
    const url = `http://localhost:${process.env.PORT || '3000'}/api/auth/login`;
    try {
      const resp = await axios.post(url, { nik, password: out.tempPassword }, { timeout: 5000 });
      out.changes.push({ step: 'httpProbe', ok: true, msg: `HTTP login OK, user.id=${resp.data?.user?.id || '-'}` });
    } catch (e) {
      out.changes.push({ step: 'httpProbe', ok: false, msg: e.response?.data?.message || e.message });
    }
  } else {
    out.changes.push({ step: 'httpProbe', ok: false, msg: 'Skipped (axios missing or --probe-http not set)' });
  }

  console.table(out.changes);
  await auditLog(adminId, 'SCRIPT_RESET_USER_STATE', `Reset for ${nik}: ${JSON.stringify(out.changes)}`);
  return out;
}

// ----------------------------- HELPERS -----------------------------
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TEMP-';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ----------------------------- MAIN -----------------------------
(async function main() {
  loadEnv();
  const flags = parseArgs();
  const adminId = await getAdminIdByNik(flags.adminNik);

  try {
    if (flags.activate) {
      console.log(`[RUN] activateUser for ${flags.nik}`);
      const res = await activateUser(flags.nik, adminId);
      console.log('[RESULT] activateUser:', { success: res.success });
    }

    if (flags.diagnose) {
      console.log(`[RUN] diagnoseLogin for ${flags.nik}`);
      const res = await diagnoseLogin(flags.nik, flags.password, flags.probeHttp);
      console.log('[RESULT] diagnoseLogin summary:', {
        presence: res.checks.find((c) => c.step === 'presence'),
        active: res.checks.find((c) => c.step === 'active'),
        userLink: res.checks.find((c) => c.step === 'userLink'),
        bcryptCompare: res.checks.find((c) => c.step === 'bcryptCompare'),
        tokenGenerate: res.checks.find((c) => c.step === 'tokenGenerate'),
        httpProbe: res.checks.find((c) => c.step === 'httpProbe'),
      });
    }

    if (flags.reset) {
      if (flags.role && !['administrator', 'employee', 'dapur', 'delivery'].includes(flags.role)) {
        console.error('[ERROR] Invalid --role. Use: administrator | employee | dapur | delivery');
        process.exit(1);
      }
      console.log(`[RUN] resetUserState for ${flags.nik} with role=${flags.role || '(keep current)'}`);
      const res = await resetUserState(flags.nik, flags.role, adminId, flags.probeHttp);
      console.log('[RESULT] resetUserState:', {
        tempPassword: res.tempPassword,
        hint: 'Use this TEMP password for next login, then change it.',
      });
    }

    if (!flags.activate && !flags.diagnose && !flags.reset) {
      printUsageAndExit('[ERROR] No operation selected. Use --activate or --diagnose or --reset');
    }
  } catch (e) {
    console.error('[FATAL]', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();