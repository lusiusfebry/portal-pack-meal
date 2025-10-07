// recovery-scripts.js
// Emergency Admin Recovery Toolkit — Bebang Pack Meal Portal
//
// Sections:
// 1) Node.js Recovery (Prisma) — programmatic recovery with validations and audit logging
// 2) SQL Direct Recovery — portable SQL statements for manual DB operations
// 3) Bash / PowerShell Quick Scripts — convenience wrappers to call this tool
// 4) Instructions — how to run with examples and safety notes
//
// IMPORTANT SECURITY NOTES
// - This tool is intended for emergency use by trusted operators only.
// - It enforces confirmations (use --yes to force) and performs validations.
// - Passwords are hashed with bcrypt (SALT_ROUNDS=10); hashes never logged.
// - AuditTrail entries are recorded for all changes via Prisma when possible.
// - Environment: loads backend/.env for DATABASE_URL if not set.
//
// References:
// - Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
// - Auth service flow: [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)
// - Users service ops: [backend/src/users/users.service.ts](backend/src/users/users.service.ts)

'use strict';

/* ===========================
 * 0) Bootstrap Environment
 * =========================== */
const fs = require('fs');
const path = require('path');

/** Load dotenv with fallback to backend/.env if DATABASE_URL not set */
(function loadEnv() {
  try {
    // Prefer existing env; otherwise try backend/.env
    if (!process.env.DATABASE_URL) {
      const dotenvPath = path.join(__dirname, 'backend', '.env');
      if (fs.existsSync(dotenvPath)) {
        require('dotenv').config({ path: dotenvPath });
        console.log('[info] Loaded environment from backend/.env');
      } else {
        console.warn(
          '[warn] DATABASE_URL is not set and backend/.env not found. Ensure env is present before DB ops.',
        );
      }
    }
  } catch (e) {
    console.warn('[warn] dotenv load failed:', e?.message || e);
  }
})();

/** Resolve PrismaClient from either root node_modules or backend workspace node_modules */
function resolvePrisma() {
  const candidates = [
    () => require('@prisma/client'),
    () =>
      require(path.join(
        __dirname,
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
  throw new Error(
    'Unable to resolve @prisma/client. Install dependencies or run via workspace with Prisma generated.',
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
  // Allow non-DB commands (e.g., --print-sql, --print-shell, --hash) to run without Prisma
  // DB actions will fail later with explicit message if Prisma missing.
}

/* ===========================
 * 1) Argument Parsing (no deps)
 * =========================== */
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

/* ===========================
 * 2) Helpers & Validations
 * =========================== */
const SALT_ROUNDS = 10;

function exitWith(msg, code = 1) {
  console.error(`[error] ${msg}`);
  process.exit(code);
}

function info(msg) {
  console.log(`[info] ${msg}`);
}

function warn(msg) {
  console.warn(`[warn] ${msg}`);
}

function requireIdentifier(cliObj) {
  const id =
    cliObj.id || cliObj.nik || cliObj.username || cliObj.identifier || null;
  if (!id) {
    exitWith(
      'Missing identifier. Provide --id, --nik, or --username (user NIK/username).',
    );
  }
  return String(id).trim();
}

function normalizeAction(action) {
  const a = (action || '').toLowerCase();
  // map aliases
  if (a === 'admin' || a === 'grant-admin' || a === 'escalate') return 'make-admin';
  if (a === 'reset' || a === 'pw-reset' || a === 'password') return 'reset-password';
  if (a === 'find' || a === 'lookup') return 'find';
  if (a === 'verify' || a === 'status' || a === 'check') return 'verify';
  if (a === 'sql' || a === 'printsql') return 'print-sql';
  if (a === 'bash' || a === 'shell') return 'print-shell';
  if (a === 'ps' || a === 'powershell') return 'print-powershell';
  if (a === 'emit-shell' || a === 'emit') return 'emit-shell';
  if (a === 'hash' || a === 'bcrypt') return 'hash';
  if (a === 'help' || a === '--help' || a === '-h') return 'help';
  return a;
}

function confirmGuard(cliObj, purpose) {
  const bypass = cliObj.yes === true || String(cliObj.yes || '').toLowerCase() === 'true';
  if (bypass) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    process.stdout.write(
      `Are you sure you want to ${purpose}? Type YES to continue: `,
    );
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      const ans = String(data || '').trim();
      resolve(ans === 'YES');
    });
  });
}

function assertNewPasswordSafety(pw) {
  if (typeof pw !== 'string' || pw.length < 8) {
    exitWith('New password must be at least 8 characters.');
  }
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
    warn(
      'Password does not include recommended complexity (uppercase, lowercase, digit). Proceeding.',
    );
  }
}

/* ===========================
 * 3) Prisma-based Recovery Ops
 * =========================== */
const bcrypt = require('bcrypt');

async function openPrisma() {
  if (!PrismaClient) {
    exitWith('PrismaClient not available. Install dependencies and ensure @prisma/client is generated.');
  }
  try {
    const prisma = new PrismaClient();
    // test connection by a trivial query
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (e) {
    exitWith(`Failed to initialize PrismaClient: ${e?.message || e}`);
  }
}

async function findUserByIdentifier(prisma, identifier) {
  // Try locate by User.username first
  const user = await prisma.user.findUnique({
    where: { username: identifier },
  });

  if (user) {
    const karyawan = await prisma.karyawan.findFirst({
      where: { userId: user.id },
    });
    return { user, karyawan };
  }

  // Otherwise, try by Karyawan.nomorIndukKaryawan
  const karyawan = await prisma.karyawan.findUnique({
    where: { nomorIndukKaryawan: identifier },
    include: { user: true },
  });
  if (karyawan && karyawan.user) {
    return { user: karyawan.user, karyawan };
  }

  // Not found or karyawan without user
  if (karyawan && !karyawan.user) {
    return { user: null, karyawan };
  }

  return null;
}

async function printUserSnapshot(prisma, identifier) {
  const found = await findUserByIdentifier(prisma, identifier);
  if (!found) {
    console.log(JSON.stringify({ found: false, identifier }, null, 2));
    return;
  }
  const { user, karyawan } = found;
  const redactedUser = user
    ? {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        passwordHash: '<redacted>',
      }
    : null;
  const snapshot = {
    found: true,
    identifier,
    user: redactedUser,
    karyawan: karyawan
      ? {
          id: karyawan.id,
          nomorIndukKaryawan: karyawan.nomorIndukKaryawan,
          roleAccess: karyawan.roleAccess,
          isActive: karyawan.isActive,
          departmentId: karyawan.departmentId,
          jabatanId: karyawan.jabatanId,
          createdAt: karyawan.createdAt,
          updatedAt: karyawan.updatedAt,
          userId: karyawan.userId,
        }
      : null,
  };
  console.log(JSON.stringify(snapshot, null, 2));
}

async function logAudit(prisma, adminKaryawanId, aksi, detail) {
  try {
    await prisma.auditTrail.create({
      data: {
        userId: adminKaryawanId ?? null, // In emergency we may not know actor; can be null
        aksi,
        detail,
      },
    });
  } catch (e) {
    console.warn('[warn] AuditTrail logging failed:', e?.message || e);
  }
}

async function makeAdministrator(prisma, identifier) {
  const found = await findUserByIdentifier(prisma, identifier);
  if (!found) {
    exitWith(`User not found for identifier: ${identifier}`);
  }
  const { user, karyawan } = found;
  if (!user) {
    exitWith(
      `Associated user account not found for NIK ${karyawan?.nomorIndukKaryawan || identifier}`,
    );
  }
  const alreadyAdmin =
    user.role === PrismaEnums.RoleAccess.administrator ||
    karyawan?.roleAccess === PrismaEnums.RoleAccess.administrator;

  if (alreadyAdmin) {
    info('User already has administrator role. No changes applied.');
    return { updated: false, userId: user.id, karyawanId: karyawan?.id };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { role: PrismaEnums.RoleAccess.administrator },
    }),
    ...(karyawan
      ? [
          prisma.karyawan.update({
            where: { id: karyawan.id },
            data: { roleAccess: PrismaEnums.RoleAccess.administrator, isActive: true },
          }),
        ]
      : []),
  ]);

  await logAudit(
    prisma,
    karyawan?.id ?? null,
    'EMERGENCY_ADMIN_RECOVERY_MAKE_ADMIN',
    `Escalated to administrator for identifier=${identifier} (userId=${user.id}, karyawanId=${karyawan?.id ?? 'null'})`,
  );

  info('Administrator role granted on both User.role and Karyawan.roleAccess (if present).');
  return { updated: true, userId: user.id, karyawanId: karyawan?.id ?? null };
}

async function resetPassword(prisma, identifier, newPasswordOpt) {
  const found = await findUserByIdentifier(prisma, identifier);
  if (!found) {
    exitWith(`User not found for identifier: ${identifier}`);
  }
  const { user, karyawan } = found;
  if (!user) {
    exitWith(
      `Associated user account not found for NIK ${karyawan?.nomorIndukKaryawan || identifier}`,
    );
  }

  let newPassword = newPasswordOpt;
  if (!newPassword) {
    // Generate temporary password similar to UsersService.generateTemporaryPassword()
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let generated = 'TEMP-';
    for (let i = 0; i < 6; i++) {
      generated += chars[Math.floor(Math.random() * chars.length)];
    }
    newPassword = generated;
  } else {
    assertNewPasswordSafety(newPassword);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await logAudit(
    prisma,
    karyawan?.id ?? null,
    'EMERGENCY_ADMIN_RECOVERY_PASSWORD_RESET',
    `Password reset for identifier=${identifier} (userId=${user.id}, karyawanId=${karyawan?.id ?? 'null'})`,
  );

  info('Password has been reset successfully.');
  return {
    success: true,
    tempPassword: newPasswordOpt ? undefined : newPassword, // only show if generated
  };
}

/* ===========================
 * 4) SQL Direct Recovery Snippets
 * =========================== */
const SQL_SNIPPETS = {
  viewStatus: `-- View current user/karyawan status by NIK or username
-- Replace :IDENTIFIER with the target NIK/username
SELECT
  u.id            AS user_id,
  u.username      AS username,
  u.role_access   AS user_role,
  k.id            AS karyawan_id,
  k.nomor_induk_karyawan AS nik,
  k.role_access   AS karyawan_role,
  k.is_active     AS is_active,
  k.department_id AS department_id,
  k.jabatan_id    AS jabatan_id
FROM users u
JOIN master_karyawan k ON k.user_id = u.id
WHERE u.username = :IDENTIFIER
   OR k.nomor_induk_karyawan = :IDENTIFIER;`,

  makeAdmin: `-- Promote user to administrator (both users.role_access and master_karyawan.role_access)
-- Replace :IDENTIFIER with the target NIK/username
WITH target AS (
  SELECT u.id AS user_id, k.id AS karyawan_id
  FROM users u
  JOIN master_karyawan k ON k.user_id = u.id
  WHERE u.username = :IDENTIFIER
     OR k.nomor_induk_karyawan = :IDENTIFIER
)
UPDATE users SET role_access = 'administrator'
WHERE id IN (SELECT user_id FROM target);

UPDATE master_karyawan
SET role_access = 'administrator',
    is_active   = TRUE
WHERE id IN (SELECT karyawan_id FROM target);`,

  resetPassword: `-- Reset password directly. You must supply a bcrypt hash.
-- Option A: Paste a bcrypt hash generated via "node recovery-scripts.js hash --password NEWPASS"
-- Option B: Use pgcrypto (if available) is NOT sufficient; bcrypt is required.
-- Replace :IDENTIFIER and :BCRYPT_HASH
WITH target AS (
  SELECT u.id AS user_id
  FROM users u
  LEFT JOIN master_karyawan k ON k.user_id = u.id
  WHERE u.username = :IDENTIFIER
     OR k.nomor_induk_karyawan = :IDENTIFIER
)
UPDATE users
SET password_hash = :BCRYPT_HASH
WHERE id IN (SELECT user_id FROM target);`,

  verify: `-- Verify final status
-- Replace :IDENTIFIER
SELECT
  u.id            AS user_id,
  u.username      AS username,
  u.role_access   AS user_role,
  k.id            AS karyawan_id,
  k.nomor_induk_karyawan AS nik,
  k.role_access   AS karyawan_role,
  k.is_active     AS is_active
FROM users u
JOIN master_karyawan k ON k.user_id = u.id
WHERE u.username = :IDENTIFIER
   OR k.nomor_induk_karyawan = :IDENTIFIER;`,
};

function printSQL() {
  console.log([
    '--- SQL: View Status ---',
    SQL_SNIPPETS.viewStatus,
    '',
    '--- SQL: Make Administrator ---',
    SQL_SNIPPETS.makeAdmin,
    '',
    '--- SQL: Reset Password ---',
    SQL_SNIPPETS.resetPassword,
    '',
    '--- SQL: Verify ---',
    SQL_SNIPPETS.verify,
  ].join('\n'));
}

/* ===========================
 * 5) Quick Scripts (Bash/PowerShell)
 * =========================== */
const BASH_SCRIPT = `#!/usr/bin/env bash
# recovery-linux.sh — wrapper for recovery-scripts.js
# Usage:
#   ./recovery-linux.sh <action> --id <NIK_OR_USERNAME> [--new-password <PW>] [--yes]
# Actions:
#   find | verify | make-admin | reset-password | print-sql

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="\${SCRIPT_DIR}/recovery-scripts.js"

if [ ! -f "\${NODE_SCRIPT}" ]; then
  echo "[error] recovery-scripts.js not found in \${SCRIPT_DIR}" >&2
  exit 1
fi

ACTION="\${1:-help}"
shift || true

node "\${NODE_SCRIPT}" "\${ACTION}" "$@"`;

const POWERSHELL_SCRIPT = `# recovery-windows.ps1 — wrapper for recovery-scripts.js
# Usage:
#   .\\recovery-windows.ps1 <action> --id <NIK_OR_USERNAME> [--new-password <PW>] [--yes]
# Actions:
#   find | verify | make-admin | reset-password | print-sql

param(
  [Parameter(Mandatory=$false, Position=0)]
  [string]$Action = "help",
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$NodeScript = Join-Path $ScriptDir "recovery-scripts.js"

if (!(Test-Path $NodeScript)) {
  Write-Error "recovery-scripts.js not found in $ScriptDir"
  exit 1
}

node $NodeScript $Action @Rest`;

function printShell() {
  console.log(BASH_SCRIPT);
}

function printPowerShell() {
  console.log(POWERSHELL_SCRIPT);
}

function emitShellFiles() {
  const bashPath = path.join(__dirname, 'recovery-linux.sh');
  const ps1Path = path.join(__dirname, 'recovery-windows.ps1');
  fs.writeFileSync(bashPath, BASH_SCRIPT, 'utf8');
  try {
    fs.chmodSync(bashPath, 0o755);
  } catch (_) {}
  fs.writeFileSync(ps1Path, POWERSHELL_SCRIPT, 'utf8');
  console.log(`[info] Emitted:\n - ${bashPath}\n - ${ps1Path}`);
}

/* ===========================
 * 6) Help / Instructions
 * =========================== */
const HELP_TEXT = `Emergency Admin Recovery — Usage

Node (direct):
  node recovery-scripts.js <action> [options]

Actions:
  find                 Show snapshot for a user/karyawan
  verify               Same as find (post-change verification)
  make-admin           Grant administrator role (User.role + Karyawan.roleAccess)
  reset-password       Reset password (auto TEMP-****** or --new-password)
  print-sql            Print SQL snippets for manual DB operations
  print-shell          Print a Linux/macOS wrapper shell script
  print-powershell     Print a Windows PowerShell wrapper script
  emit-shell           Write wrappers to disk: recovery-linux.sh, recovery-windows.ps1
  hash                 Print bcrypt hash for a given --password
  help                 This help

Options:
  --id | --nik | --username <value>   Identifier (NIK or username)
  --new-password <value>              Optional new password (>=8 chars), otherwise temp is generated
  --yes                               Skip interactive confirmation for destructive actions
  --password <value>                  For "hash" action to produce bcrypt hash

Examples:
  # Inspect current status
  node recovery-scripts.js find --id ADM001

  # Promote to administrator with confirmation
  node recovery-scripts.js make-admin --id ADM001

  # Force (non-interactive)
  node recovery-scripts.js make-admin --id ADM001 --yes

  # Reset to generated TEMP-****** and print it
  node recovery-scripts.js reset-password --id ADM001

  # Reset to a specific password (validated) non-interactive
  node recovery-scripts.js reset-password --id ADM001 --new-password "Adm1nStr0ng!" --yes

  # Print SQL templates for manual execution
  node recovery-scripts.js print-sql

  # Emit convenience wrapper scripts
  node recovery-scripts.js emit-shell
  ./recovery-linux.sh verify --id ADM001
  powershell -ExecutionPolicy Bypass -File .\\recovery-windows.ps1 verify --id ADM001

  # Generate bcrypt hash for SQL direct method
  node recovery-scripts.js hash --password "Adm1nStr0ng!"
`;

/* ===========================
 * 7) Main CLI Dispatcher
 * =========================== */
async function main() {
  const action = normalizeAction(cli._[0] || cli.action || 'help');

  // Non-DB actions:
  if (action === 'help') {
    console.log(HELP_TEXT);
    return;
  }
  if (action === 'print-sql') {
    printSQL();
    return;
  }
  if (action === 'print-shell') {
    printShell();
    return;
  }
  if (action === 'print-powershell') {
    printPowerShell();
    return;
  }
  if (action === 'emit-shell') {
    emitShellFiles();
    return;
  }
  if (action === 'hash') {
    const pw = cli.password;
    if (!pw) exitWith('Provide --password to hash.');
    assertNewPasswordSafety(pw);
    bcrypt.hash(pw, SALT_ROUNDS).then((hash) => {
      console.log(hash);
    });
    return;
  }

  // DB actions:
  const prisma = await openPrisma();
  try {
    if (action === 'find' || action === 'verify') {
      const id = requireIdentifier(cli);
      await printUserSnapshot(prisma, id);
      return;
    }

    if (action === 'make-admin') {
      const id = requireIdentifier(cli);
      const ok = await confirmGuard(cli, `grant administrator to identifier "${id}"`);
      if (!ok) {
        exitWith('Aborted by user.');
      }
      const res = await makeAdministrator(prisma, id);
      console.log(JSON.stringify({ action: 'make-admin', ...res }, null, 2));
      // auto-verify
      await printUserSnapshot(prisma, id);
      return;
    }

    if (action === 'reset-password') {
      const id = requireIdentifier(cli);
      const ok = await confirmGuard(cli, `reset password for identifier "${id}"`);
      if (!ok) {
        exitWith('Aborted by user.');
      }
      const res = await resetPassword(prisma, id, cli['new-password']);
      console.log(JSON.stringify({ action: 'reset-password', ...res }, null, 2));
      // auto-verify
      await printUserSnapshot(prisma, id);
      return;
    }

    exitWith(`Unknown or unsupported action: ${action}`);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  }
}

/* ===========================
 * 8) Instructions (inline doc)
 * =========================== */
/*
Instructions — Emergency Admin Recovery

Prerequisites:
- Ensure DATABASE_URL is configured. The script will attempt to load backend/.env automatically.
- Make sure Prisma Client is installed/generated (npm run install:all; prisma generated in backend workspace).

Quick Start:
1) Inspect status
   node recovery-scripts.js find --id ADM001

2) Grant administrator role
   node recovery-scripts.js make-admin --id ADM001
   # Non-interactive:
   node recovery-scripts.js make-admin --id ADM001 --yes

3) Reset password
   # Generate a temporary password (printed to output)
   node recovery-scripts.js reset-password --id ADM001
   # Set a specific password
   node recovery-scripts.js reset-password --id ADM001 --new-password "Adm1nStr0ng!" --yes

4) Verify
   node recovery-scripts.js verify --id ADM001

5) SQL (manual)
   node recovery-scripts.js print-sql
   # Then replace :IDENTIFIER / :BCRYPT_HASH and run on database manually.

6) Convenience Wrappers
   node recovery-scripts.js emit-shell
   ./recovery-linux.sh verify --id ADM001
   powershell -ExecutionPolicy Bypass -File .\\recovery-windows.ps1 verify --id ADM001

Safety:
- Destructive operations prompt for confirmation unless --yes is provided.
- Password complexity is validated (min 8 chars; complexity recommended).
- AuditTrail entries are written with aksi:
  - EMERGENCY_ADMIN_RECOVERY_MAKE_ADMIN
  - EMERGENCY_ADMIN_RECOVERY_PASSWORD_RESET

References:
- Prisma schema (enums/relations): backend/prisma/schema.prisma
- Auth flow & hashing policy: backend/src/auth/auth.service.ts
- Users service (role/password ops): backend/src/users/users.service.ts
*/

if (require.main === module) {
  // Fire and forget main; ensure rejections are surfaced
  main().catch((err) => {
    console.error('[fatal]', err?.stack || err?.message || String(err));
    process.exit(1);
  });
}