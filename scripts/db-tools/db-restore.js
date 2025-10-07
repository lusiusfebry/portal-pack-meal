'use strict';

/**
 * Database Restore Tool — Bebang Pack Meal Portal
 *
 * Purpose:
 * - Restore database content from JSON backup created by db-cleanup.js
 * - Preserve referential integrity and ensure at least one admin exists
 * - Run in a single transaction (where feasible) and reset sequences
 *
 * Usage:
 *   node scripts\\db-tools\\db-restore.js [--file <path-to-backup.json>] [--yes] [--dry-run]
 *
 * Options:
 *   --file <path>      Path ke file backup JSON. Jika tidak diisi, pakai backup terbaru di ./backups
 *   --yes              Skip konfirmasi interaktif
 *   --dry-run          Tampilkan ringkasan tanpa eksekusi restore
 *   --api-base <url>   (Opsional) Verifikasi login admin via API /auth/login
 *   --admin-nik <nik>  (Opsional) NIK admin untuk verifikasi
 *   --admin-password <pw> (Opsional) Password admin untuk verifikasi
 *
 * Notes:
 * - Script memuat env dari backend/.env bila DATABASE_URL tidak di-set.
 * - Proses restore memasukkan data sesuai ID (explicit) untuk menjaga konsistensi relasi.
 * - Setelah restore, sequence/identity akan di-reset ke MAX(id).
 */

const fs = require('fs');
const path = require('path');

// 0) Bootstrap env
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

// 1) Resolve Prisma Client
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
      // try next
    }
  }
  throw new Error('Unable to resolve @prisma/client');
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

// 2) CLI args
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
      } else {
        const key = tok.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith('--')) {
          out[key] = true;
          i += 1;
        } else {
          out[key] = next;
          i += 2;
        }
      }
    } else {
      out._.push(tok);
      i += 1;
    }
  }
  return out;
}
const cli = parseArgs(args);

function toBool(v) {
  if (v === true) return true;
  const s = String(v || '').toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}
const DRY_RUN = toBool(cli['dry-run']);
const SKIP_CONFIRM = toBool(cli.yes);
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

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

function listBackups(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .map((f) => path.join(dir, f));
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files;
}

function resolveBackupPath() {
  if (cli.file) {
    const p = path.isAbsolute(cli.file) ? cli.file : path.join(process.cwd(), cli.file);
    if (!fs.existsSync(p)) exitWith(`Backup file not found: ${p}`);
    return p;
  }
  const files = listBackups(BACKUPS_DIR);
  if (!files.length) exitWith(`No backup files found in ${BACKUPS_DIR}`);
  return files[0];
}

function readBackup(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  if (!json || !json.tables) exitWith('Invalid backup format: missing tables');
  const t = json.tables;
  for (const key of [
    'users',
    'karyawan',
    'departments',
    'jabatans',
    'shifts',
    'lokasi',
    'pesanan',
    'auditTrail',
  ]) {
    if (!Object.prototype.hasOwnProperty.call(t, key)) {
      exitWith(`Invalid backup format: missing tables.${key}`);
    }
  }
  return json;
}
// Helper: coerce BigInt from string/number/backward-compatible formats
function isNumericString(s) {
  return typeof s === 'string' && /^[0-9]+$/.test(s);
}
function coerceBigInt(val) {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'string') {
    if (isNumericString(val)) {
      try {
        return BigInt(val);
      } catch (_) {
        // fallback: return original if cannot parse
        return val;
      }
    }
    return val;
  }
  if (typeof val === 'number') {
    // Attempt safe conversion; if fractional, truncate
    try {
      return BigInt(val);
    } catch (_) {
      return BigInt(Math.trunc(val));
    }
  }
  return val;
}

// Revive BigInt fields in backup payload to JS BigInt for Prisma
// Currently schema has BigInt on AuditTrail.id (see backend/prisma/schema.prisma)
function reviveBigIntFields(backupJson) {
  if (!backupJson || !backupJson.tables) return backupJson;
  const t = backupJson.tables;
  const auditTrailRev = Array.isArray(t.auditTrail)
    ? t.auditTrail.map((row) => {
        const out = { ...row };
        if (out && Object.prototype.hasOwnProperty.call(out, 'id')) {
          out.id = coerceBigInt(out.id);
        }
        return out;
      })
    : t.auditTrail;
  return {
    ...backupJson,
    tables: {
      ...t,
      auditTrail: auditTrailRev,
    },
  };
}

async function openPrisma() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (e) {
    exitWith(`Prisma connection failed: ${e?.message || e}`);
  }
}

async function ensureAtLeastOneAdmin(prisma) {
  const [ua, ka] = await Promise.all([
    prisma.user.count({ where: { role: PrismaEnums.RoleAccess.administrator } }),
    prisma.karyawan.count({ where: { roleAccess: PrismaEnums.RoleAccess.administrator } }),
  ]);
  if (ua < 1 || ka < 1) {
    exitWith(
      `No admin present (users.admin=${ua}, karyawan.admin=${ka}). Aborting.`,
    );
  }
}

async function confirmPrompt() {
  if (SKIP_CONFIRM) return true;
  return new Promise((resolve) => {
    process.stdout.write('Type RESTORE to proceed (destructive): ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => {
      const ans = String(d || '').trim();
      resolve(ans === 'RESTORE');
    });
  });
}

function coerceDates(arr, fields) {
  // Prisma accepts JS Date or string; keep as-is if string.
  // If needed, convert ISO string to Date. We'll leave as-is to avoid TZ shifts.
  return arr;
}

async function resetSequence(prisma, table, idCol = 'id') {
  // Works for serial/identity columns by resolving sequence name automatically
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence($1, $2), GREATEST((SELECT COALESCE(MAX(${idCol}), 0) FROM ${table}) + 1, 1), false);`,
    table,
    idCol,
  );
}

async function resetAllSequences(prisma) {
  // Table names as mapped in schema @@map
  await resetSequence(prisma, 'users', 'id');
  await resetSequence(prisma, 'master_department', 'id');
  await resetSequence(prisma, 'master_jabatan', 'id');
  await resetSequence(prisma, 'master_shift', 'id');
  await resetSequence(prisma, 'master_karyawan', 'id');
  await resetSequence(prisma, 'transaction_pesanan', 'id');
  await resetSequence(prisma, 'log_audit_trail', 'id');
  await resetSequence(prisma, 'master_lokasi', 'id');
}

async function performRestore(prisma, backup) {
  const t = backup.tables;

  // Summary
  const summary = {
    users: t.users.length,
    karyawan: t.karyawan.length,
    departments: t.departments.length,
    jabatans: t.jabatans.length,
    shifts: t.shifts.length,
    lokasi: t.lokasi.length,
    pesanan: t.pesanan.length,
    auditTrail: t.auditTrail.length,
  };
  console.log(JSON.stringify({ restoreSummary: summary }, null, 2));

  if (DRY_RUN) {
    info('Dry-run mode: no changes applied.');
    return;
  }

  const ok = await confirmPrompt();
  if (!ok) exitWith('Aborted by user.');

  // Transactional restore
  info('Starting restore transaction...');
  await prisma.$transaction(async (tx) => {
    // 1) Delete in FK-safe order (children first)
    await tx.pesanan.deleteMany({});
    await tx.auditTrail.deleteMany({});
    await tx.karyawan.deleteMany({});
    await tx.user.deleteMany({});
    await tx.jabatan.deleteMany({});
    await tx.department.deleteMany({});
    await tx.shift.deleteMany({});
    await tx.lokasi.deleteMany({});

    // 2) Insert masters first
    if (t.departments.length) {
      await tx.department.createMany({ data: coerceDates(t.departments) });
    }
    if (t.jabatans.length) {
      await tx.jabatan.createMany({ data: coerceDates(t.jabatans) });
    }
    if (t.shifts.length) {
      await tx.shift.createMany({ data: coerceDates(t.shifts) });
    }
    if (t.lokasi.length) {
      await tx.lokasi.createMany({ data: coerceDates(t.lokasi) });
    }

    // 3) Insert users then karyawan
    if (t.users.length) {
      await tx.user.createMany({ data: coerceDates(t.users) });
    }
    if (t.karyawan.length) {
      await tx.karyawan.createMany({ data: coerceDates(t.karyawan) });
    }

    // 4) Insert transactional tables
    if (t.pesanan.length) {
      await tx.pesanan.createMany({ data: coerceDates(t.pesanan) });
    }
    if (t.auditTrail.length) {
      await tx.auditTrail.createMany({ data: coerceDates(t.auditTrail) });
    }
  });
  info('Restore transaction completed.');

  // Reset sequences for all tables
  await resetAllSequences(prisma);

  // Verify admin exists
  await ensureAtLeastOneAdmin(prisma);
}

async function tryLoginAdmin(apiBase, nik, password) {
  if (!apiBase || !nik || !password) {
    warn('Login verification skipped: missing --api-base / --admin-nik / --admin-password.');
    return;
  }
  try {
    const axios = require('axios');
    const url = `${apiBase.replace(/\/$/, '')}/auth/login`;
    const resp = await axios.post(url, { nik, password });
    if (resp.status === 201 || resp.status === 200) {
      info('Admin login verification success via API.');
    } else {
      warn(`Admin login verification unexpected status: ${resp.status}`);
    }
  } catch (e) {
    warn(
      `Admin login verification failed: ${e?.response?.status} ${e?.response?.data || e?.message || e}`,
    );
  }
}

async function main() {
  const backupPath = resolveBackupPath();
  info(`Using backup file: ${backupPath}`);
  const backup = reviveBigIntFields(readBackup(backupPath));

  const prisma = await openPrisma();
  try {
    await performRestore(prisma, backup);
    await tryLoginAdmin(cli['api-base'], cli['admin-nik'], cli['admin-password']);
    info('Database restore completed successfully.');
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