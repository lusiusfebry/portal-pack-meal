'use strict';

/**
 * Database Verification Tool — Bebang Pack Meal Portal
 *
 * Purpose:
 * - Verifikasi kondisi database pasca-cleanup
 * - Pastikan admin tetap ada dan dapat login
 * - Pastikan tabel transactional kosong (Pesanan, AuditTrail)
 * - Laporan ringkas dalam format JSON agar mudah diinspeksi/CI
 *
 * Usage:
 *   node scripts\\db-tools\\db-verify.js [--api-base <url> --admin-nik <nik> --admin-password <pw>]
 *
 * Options:
 *   --api-base <url>        URL API untuk verifikasi login (opsional)
 *   --admin-nik <nik>        NIK admin untuk login verifikasi (opsional)
 *   --admin-password <pw>    Password admin untuk login verifikasi (opsional)
 *   --details               Sertakan detail hitung master data (departments, jabatans, shifts, lokasi)
 *
 * Output:
 *   Mencetak JSON summary:
 *   {
 *     "admin": { "usersAdmin": 1, "karyawanAdmin": 1, "ok": true },
 *     "counts": { "pesanan": 0, "auditTrail": 0, "usersNonAdmin": 0, "karyawanNonAdmin": 0, "details": {...} },
 *     "login": { "attempted": true, "status": 200, "ok": true }
 *   }
 *
 * Notes:
 * - Script memuat env dari backend/.env jika DATABASE_URL tidak ada.
 * - Tidak mengubah data apa pun; hanya baca/verifikasi.
 */

const fs = require('fs');
const path = require('path');

// 0) Bootstrap Environment (dotenv fallback to backend/.env)
(function loadEnv() {
  try {
    if (!process.env.DATABASE_URL) {
      const dotenvPath = path.join(__dirname, '..', '..', 'backend', '.env');
      if (fs.existsSync(dotenvPath)) {
        require('dotenv').config({ path: dotenvPath });
        console.log('[env] Loaded from backend/.env');
      } else {
        console.warn('[env] DATABASE_URL missing and backend/.env not found.');
      }
    }
  } catch (e) {
    console.warn('[env] dotenv load failed:', e?.message || e);
  }
})();

// 1) Resolve Prisma Client (supports workspace install)
function resolvePrisma() {
  const candidates = [
    () => require('@prisma/client'),
    () =>
      require(path.join(
        __dirname,
        '..',
        '..',
        'backend',
        'node_modules',
        '@prisma',
        'client',
      )),
  ];
  for (const get of candidates) {
    try {
      return get();
    } catch (_) {
      // try next candidate
    }
  }
  throw new Error(
    'Unable to resolve @prisma/client. Install deps and ensure Prisma Client is generated.',
  );
}

let PrismaPkg = null;
let PrismaClient = null;
let PrismaEnums = {};
try {
  PrismaPkg = resolvePrisma();
  PrismaClient = PrismaPkg.PrismaClient || PrismaPkg.default?.PrismaClient;
  PrismaEnums.RoleAccess = PrismaPkg.RoleAccess || {
    administrator: 'administrator',
    employee: 'employee',
    dapur: 'dapur',
    delivery: 'delivery',
  };
} catch (e) {
  console.error('[fatal] Prisma resolution failed:', e?.message || e);
  process.exit(1);
}

// 2) CLI args (minimal)
const args = process.argv.slice(2);
function parseArgs(argv) {
  const out = { _: [] };
  let i = 0;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const eqIdx = tok.indexOf('=');
      if (eqIdx !== -1) {
        const key = tok.slice(2, eqIdx);
        const val = tok.slice(eqIdx + 1);
        out[key] = val;
        i += 1;
        continue;
      }
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        out[key] = true;
        i += 1;
      } else {
        out[key] = next;
        i += 2;
      }
    } else {
      out._.push(tok);
      i += 1;
    }
  }
  return out;
}
const cli = parseArgs(args);

function info(msg) {
  console.log(`[info] ${msg}`);
}
function warn(msg) {
  console.warn(`[warn] ${msg}`);
}
function exitWith(msg, code = 1) {
  console.error(`[error] ${msg}`);
  process.exit(code);
}

function toBool(v) {
  if (v === true) return true;
  const s = String(v || '').toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}
const INCLUDE_DETAILS = toBool(cli.details);

async function openPrisma() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (e) {
    exitWith(`Prisma connection failed: ${e?.message || e}`);
  }
}

async function verifyAdminPresence(prisma) {
  const [uAdmin, kAdmin] = await Promise.all([
    prisma.user.count({ where: { role: PrismaEnums.RoleAccess.administrator } }),
    prisma.karyawan.count({ where: { roleAccess: PrismaEnums.RoleAccess.administrator } }),
  ]);
  const ok = uAdmin >= 1 && kAdmin >= 1;
  return { usersAdmin: uAdmin, karyawanAdmin: kAdmin, ok };
}

async function verifyCounts(prisma, includeDetails = false) {
  const [pesanan, auditTrail, usersNonAdmin, karyawanNonAdmin] = await Promise.all([
    prisma.pesanan.count(),
    prisma.auditTrail.count(),
    prisma.user.count({ where: { role: { not: PrismaEnums.RoleAccess.administrator } } }),
    prisma.karyawan.count({ where: { roleAccess: { not: PrismaEnums.RoleAccess.administrator } } }),
  ]);

  const out = { pesanan, auditTrail, usersNonAdmin, karyawanNonAdmin };
  if (includeDetails) {
    const [departments, jabatans, shifts, lokasi] = await Promise.all([
      prisma.department.count(),
      prisma.jabatan.count(),
      prisma.shift.count(),
      prisma.lokasi.count(),
    ]);
    out.details = { departments, jabatans, shifts, lokasi };
  }
  return out;
}

async function tryLoginAdmin(apiBase, nik, password) {
  const result = { attempted: false, status: null, ok: false, error: null };
  if (!apiBase || !nik || !password) {
    return result;
  }
  result.attempted = true;
  try {
    const axios = require('axios');
    const url = `${apiBase.replace(/\/$/, '')}/auth/login`;
    const resp = await axios.post(url, { nik, password }, { timeout: 10000 });
    result.status = resp.status;
    result.ok = resp.status === 200 || resp.status === 201;
    return result;
  } catch (e) {
    result.error =
      e?.response?.data || e?.message || `HTTP ${e?.response?.status || 'ERR'}`;
    return result;
  }
}

async function main() {
  const prisma = await openPrisma();
  try {
    const admin = await verifyAdminPresence(prisma);
    const counts = await verifyCounts(prisma, INCLUDE_DETAILS);
    const login = await tryLoginAdmin(cli['api-base'], cli['admin-nik'], cli['admin-password']);

    const summary = { admin, counts, login };
    console.log(JSON.stringify(summary, null, 2));

    // Optional console hints
    if (!admin.ok) {
      warn('Admin presence verification failed: please run recovery or restore.');
      process.exitCode = 2;
    }
    if (counts.pesanan !== 0 || counts.auditTrail !== 0) {
      warn('Transactional tables are not empty: cleanup may not be complete.');
      process.exitCode = 3;
    }
    if (login.attempted && !login.ok) {
      warn('Admin API login verification failed.');
      process.exitCode = 4;
    }
    info('Verification finished.');
  } finally {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err?.stack || err?.message || String(err));
    process.exit(1);
  });
}