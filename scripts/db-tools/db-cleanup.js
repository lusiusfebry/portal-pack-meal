'use strict';

/**
 * Database Cleanup Tool — Bebang Pack Meal Portal
 *
 * Goals:
 * - Hapus data testing/sample: Pesanan, AuditTrail, Karyawan/Users non-admin
 * - Opsi hapus master data sample/testing (Department, Jabatan, Shift, Lokasi) dengan mode aman
 * - Pertahankan user admin dan karyawan admin (role: administrator)
 * - Backup otomatis sebelum cleanup (JSON)
 * - Transaksi dan rollback otomatis bila gagal
 * - Konfirmasi interaktif sebelum delete
 * - Logging detail dan verifikasi pasca-cleanup
 *
 * Usage (Windows CMD / PowerShell / Bash):
 *   node scripts\\db-tools\\db-cleanup.js [options]
 *
 * Options:
 *   --yes                         Skip interactive confirmation (use with care)
 *   --dry-run                     Tampilkan ringkasan target tanpa eksekusi
 *   --delete-master <mode>        Mode hapus master data sampel/testing:
 *                                   - none          : tidak hapus master (default, aman)
 *                                   - patterns      : hapus master dengan nama mengandung 'sample'/'testing'/'demo' (insensitive), dan tidak direferensikan admin
 *                                   - unreferenced  : hapus master yang tidak direferensikan oleh karyawan admin (sisa)
 *                                   - all           : hapus semua master yang tidak direferensikan admin (agresif, pakai konfirmasi)
 *   --backup-dir <path>           Direktori output backup (default: ./backups)
 *   --api-base <url>             URL API untuk verifikasi login (opsional, pasca-cleanup)
 *   --admin-nik <nik>             NIK admin untuk verifikasi login (opsional)
 *   --admin-password <pw>         Password admin untuk verifikasi login (opsional)
 *
 * Examples:
 *   node scripts\\db-tools\\db-cleanup.js --dry-run
 *   node scripts\\db-tools\\db-cleanup.js --delete-master patterns
 *   node scripts\\db-tools\\db-cleanup.js --delete-master unreferenced --yes
 *
 * Notes:
 * - Backup file menyertakan passwordHash; simpan secara aman dan jangan commit ke VCS.
 * - Script memuat env dari backend/.env bila DATABASE_URL belum di-set.
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

// 2) CLI args (minimal parser)
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
const SKIP_CONFIRM = toBool(cli.yes);
const DRY_RUN = toBool(cli['dry-run']);
const DELETE_MASTER_MODE = (cli['delete-master'] || 'none').toLowerCase(); // none|patterns|unreferenced|all
const BACKUP_DIR = cli['backup-dir'] || path.join(process.cwd(), 'backups');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
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

async function ensureAdminsExist(prisma) {
  const [userAdmins, karyawanAdmins] = await Promise.all([
    prisma.user.count({ where: { role: PrismaEnums.RoleAccess.administrator } }),
    prisma.karyawan.count({
      where: { roleAccess: PrismaEnums.RoleAccess.administrator },
    }),
  ]);
  if (userAdmins < 1 || karyawanAdmins < 1) {
    exitWith(
      `Admin not found or inconsistent (users.admin=${userAdmins}, karyawan.admin=${karyawanAdmins}). Aborting.`,
    );
  }
  info(`Admin verified (users.admin=${userAdmins}, karyawan.admin=${karyawanAdmins}).`);
}

async function collectAdminRefs(prisma) {
  const admins = await prisma.karyawan.findMany({
    where: { roleAccess: PrismaEnums.RoleAccess.administrator },
    select: { id: true, departmentId: true, jabatanId: true },
  });
  const preserveDepartments = [
    ...new Set(admins.map((a) => a.departmentId).filter((v) => typeof v === 'number')),
  ];
  const preserveJabatans = [
    ...new Set(admins.map((a) => a.jabatanId).filter((v) => typeof v === 'number')),
  ];
  return { preserveDepartments, preserveJabatans };
}

function masterPatternWhere(field) {
  // Insensitive contains: sample, testing, demo
  return {
    OR: [
      { [field]: { contains: 'sample', mode: 'insensitive' } },
      { [field]: { contains: 'testing', mode: 'insensitive' } },
      { [field]: { contains: 'demo', mode: 'insensitive' } },
    ],
  };
}

async function getTargetsSummary(prisma, deleteMasterMode) {
  const pesananCount = await prisma.pesanan.count();
  const auditCount = await prisma.auditTrail.count();
  const karyawanNonAdminCount = await prisma.karyawan.count({
    where: { roleAccess: { not: PrismaEnums.RoleAccess.administrator } },
  });
  const userNonAdminCount = await prisma.user.count({
    where: { role: { not: PrismaEnums.RoleAccess.administrator } },
  });

  let masterSummary = {
    departments: 0,
    jabatans: 0,
    shifts: 0,
    lokasi: 0,
    mode: deleteMasterMode,
  };
  if (deleteMasterMode === 'patterns') {
    const [departments, jabatans, shifts, lokasi] = await Promise.all([
      prisma.department.count(masterPatternWhere('namaDivisi')),
      prisma.jabatan.count(masterPatternWhere('namaJabatan')),
      prisma.shift.count(masterPatternWhere('namaShift')),
      prisma.lokasi.count(masterPatternWhere('namaLokasi')),
    ]);
    masterSummary = { departments, jabatans, shifts, lokasi, mode: deleteMasterMode };
  } else if (deleteMasterMode === 'unreferenced' || deleteMasterMode === 'all') {
    const [departments, jabatans, shifts, lokasi] = await Promise.all([
      prisma.department.count({ where: { karyawans: { none: {} } } }),
      prisma.jabatan.count({ where: { karyawans: { none: {} } } }),
      prisma.shift.count({ where: { pesanan: { none: {} } } }),
      prisma.lokasi.count(), // Lokasi tidak ber-relasi; treat all as removable in 'all', none in 'unreferenced'
    ]);
    masterSummary = {
      departments,
      jabatans,
      shifts,
      lokasi: deleteMasterMode === 'all' ? lokasi : 0,
      mode: deleteMasterMode,
    };
  }

  return {
    pesananCount,
    auditCount,
    karyawanNonAdminCount,
    userNonAdminCount,
    masterSummary,
  };
}

async function confirmPrompt(purposeWord = 'CLEAN') {
  if (SKIP_CONFIRM) return true;
  return new Promise((resolve) => {
    process.stdout.write(
      `Type ${purposeWord} to proceed with cleanup (this is destructive): `,
    );
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      const ans = String(data || '').trim();
      resolve(ans === purposeWord);
    });
  });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

// JSON stringify helper to safely handle BigInt values (e.g., AuditTrail.id BigInt)
// Converts any BigInt encountered into string during serialization to avoid
// "TypeError: Do not know how to serialize a BigInt". This keeps backup JSON readable
// and restores can re-hydrate BigInt fields as needed.
function jsonStringifySafe(value, space = 2) {
  const replacer = (_key, val) => {
    if (typeof val === 'bigint') return val.toString();
    return val;
  };
  return JSON.stringify(value, replacer, space);
}
async function backupDatabase(prisma, backupDirPath) {
  ensureDir(backupDirPath);
  const file = path.join(backupDirPath, `backup-${timestamp()}.json`);
  info(`Creating backup at: ${file}`);

  const [users, karyawan, departments, jabatans, shifts, lokasi, pesanan, auditTrail] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.karyawan.findMany(),
      prisma.department.findMany(),
      prisma.jabatan.findMany(),
      prisma.shift.findMany(),
      prisma.lokasi.findMany(),
      prisma.pesanan.findMany(),
      prisma.auditTrail.findMany(),
    ]);

  const payload = {
    meta: {
      createdAt: new Date().toISOString(),
      note:
        'Backup includes passwordHash values; store securely and DO NOT commit to VCS.',
    },
    tables: {
      users,
      karyawan,
      departments,
      jabatans,
      shifts,
      lokasi,
      pesanan,
      auditTrail,
    },
  };

  fs.writeFileSync(file, jsonStringifySafe(payload, 2), 'utf8');
  info('Backup completed.');
  return file;
}

async function performCleanup(prisma, deleteMasterMode) {
  info('Starting cleanup transaction...');
  const { preserveDepartments, preserveJabatans } = await collectAdminRefs(prisma);

  await prisma.$transaction(async (tx) => {
    // 1) Delete transactional data first (no admin impact)
    await tx.pesanan.deleteMany({});
    await tx.auditTrail.deleteMany({});

    // 2) Delete karyawan/users non-admin (preserve admin)
    await tx.karyawan.deleteMany({
      where: { roleAccess: { not: PrismaEnums.RoleAccess.administrator } },
    });
    await tx.user.deleteMany({
      where: { role: { not: PrismaEnums.RoleAccess.administrator } },
    });

    // 3) Optional master cleanup
    if (deleteMasterMode === 'patterns') {
      // Hanya nama yang mengandung pola umum, dan tidak direferensikan admin
      if (preserveDepartments.length > 0) {
        await tx.department.deleteMany({
          where: {
            ...masterPatternWhere('namaDivisi'),
            id: { notIn: preserveDepartments },
          },
        });
      } else {
        await tx.department.deleteMany(masterPatternWhere('namaDivisi'));
      }

      if (preserveJabatans.length > 0) {
        await tx.jabatan.deleteMany({
          where: {
            ...masterPatternWhere('namaJabatan'),
            id: { notIn: preserveJabatans },
          },
        });
      } else {
        await tx.jabatan.deleteMany(masterPatternWhere('namaJabatan'));
      }

      await tx.shift.deleteMany(masterPatternWhere('namaShift'));
      await tx.lokasi.deleteMany(masterPatternWhere('namaLokasi'));
    } else if (deleteMasterMode === 'unreferenced') {
      // Hapus master yang tidak direferensikan karyawan (none)
      await tx.jabatan.deleteMany({ where: { karyawans: { none: {} } } });
      await tx.department.deleteMany({ where: { karyawans: { none: {} } } });
      await tx.shift.deleteMany({ where: { pesanan: { none: {} } } });
      // Lokasi: tidak ada relasi; aman untuk DIAMKAN pada mode ini
    } else if (deleteMasterMode === 'all') {
      // Hapus semua master yang tidak direferensikan admin
      if (preserveDepartments.length > 0) {
        await tx.department.deleteMany({
          where: { id: { notIn: preserveDepartments } },
        });
      } else {
        await tx.department.deleteMany({});
      }
      if (preserveJabatans.length > 0) {
        await tx.jabatan.deleteMany({
          where: { id: { notIn: preserveJabatans } },
        });
      } else {
        await tx.jabatan.deleteMany({});
      }
      await tx.shift.deleteMany({}); // pesanan sudah dihapus; shift menjadi orphan
      await tx.lokasi.deleteMany({});
    }
  });

  info('Cleanup transaction completed.');
}

async function verifyPostCleanup(prisma) {
  // Pastikan admin masih ada
  await ensureAdminsExist(prisma);
  // Pastikan tabel transactional kosong
  const [pesanan, audit] = await Promise.all([
    prisma.pesanan.count(),
    prisma.auditTrail.count(),
  ]);
  info(`Post-cleanup verification: pesanan=${pesanan}, audit_trail=${audit}`);
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
    warn(`Admin login verification failed: ${e?.response?.status} ${e?.response?.data || e?.message || e}`);
  }
}

async function main() {
  info(`Mode: delete-master=${DELETE_MASTER_MODE}, dry-run=${DRY_RUN}, yes=${SKIP_CONFIRM}`);
  const prisma = await openPrisma();
  try {
    // Safety: verify admin before anything
    await ensureAdminsExist(prisma);

    // Summary
    const summary = await getTargetsSummary(prisma, DELETE_MASTER_MODE);
    console.log(JSON.stringify({ summary }, null, 2));

    if (DRY_RUN) {
      info('Dry-run mode: no changes applied.');
      return;
    }

    // Confirm destructive action
    const ok = await confirmPrompt('CLEAN');
    if (!ok) {
      exitWith('Aborted by user.');
    }

    // Backup
    const backupDir = BACKUP_DIR;
    const backupPath = await backupDatabase(prisma, backupDir);
    info(`Backup saved: ${backupPath}`);

    // Cleanup (transactional)
    await performCleanup(prisma, DELETE_MASTER_MODE);

    // Verify
    await verifyPostCleanup(prisma);

    // Optional login verification
    await tryLoginAdmin(cli['api-base'], cli['admin-nik'], cli['admin-password']);

    info('Database cleanup completed safely.');
  } finally {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  }
}

// Fire main
if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err?.stack || err?.message || String(err));
    process.exit(1);
  });
}