import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const ROLE = {
  administrator: 'administrator',
  employee: 'employee',
  dapur: 'dapur',
  delivery: 'delivery',
} as const;

const STATUS = {
  MENUNGGU: 'MENUNGGU',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  ON_DELIVERY: 'ON_DELIVERY',
  COMPLETE: 'COMPLETE',
  DITOLAK: 'DITOLAK',
  MENUNGGU_PERSETUJUAN: 'MENUNGGU_PERSETUJUAN',
} as const;

function parseTime(time: string): Date {
  // time format 'HH:MM'
  const [hh, mm] = time.split(':').map(Number);
  const d = new Date(Date.UTC(1970, 0, 1, hh, mm, 0));
  return d;
}

function formatDateYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function upsertDepartments() {
  console.log('Seeding: Department...');
  // IT Department
  let it = await prisma.department.findFirst({ where: { namaDivisi: 'IT Department' } });
  if (!it) {
    it = await prisma.department.create({ data: { namaDivisi: 'IT Department' } });
  }

  // Human Resources
  let hr = await prisma.department.findFirst({ where: { namaDivisi: 'Human Resources' } });
  if (!hr) {
    hr = await prisma.department.create({ data: { namaDivisi: 'Human Resources' } });
  }

  // Operations
  let ops = await prisma.department.findFirst({ where: { namaDivisi: 'Operations' } });
  if (!ops) {
    ops = await prisma.department.create({ data: { namaDivisi: 'Operations' } });
  }

  console.log('Departments OK');
  return { it, hr, ops };
}

async function upsertJabatans(depts: { it: any; hr: any; ops: any }) {
  console.log('Seeding: Jabatan...');
  // Manager in IT
  let managerIt = await prisma.jabatan.findFirst({
    where: { namaJabatan: 'Manager', departmentId: depts.it.id },
  });
  if (!managerIt) {
    managerIt = await prisma.jabatan.create({
      data: { namaJabatan: 'Manager', departmentId: depts.it.id },
    });
  }

  // Staff in HR
  let staffHr = await prisma.jabatan.findFirst({
    where: { namaJabatan: 'Staff', departmentId: depts.hr.id },
  });
  if (!staffHr) {
    staffHr = await prisma.jabatan.create({
      data: { namaJabatan: 'Staff', departmentId: depts.hr.id },
    });
  }

  // Supervisor in Ops
  let supervisorOps = await prisma.jabatan.findFirst({
    where: { namaJabatan: 'Supervisor', departmentId: depts.ops.id },
  });
  if (!supervisorOps) {
    supervisorOps = await prisma.jabatan.create({
      data: { namaJabatan: 'Supervisor', departmentId: depts.ops.id },
    });
  }

  console.log('Jabatan OK');
  return { managerIt, staffHr, supervisorOps };
}

async function upsertShifts() {
  console.log('Seeding: Shift...');
  // Shift 1
  let s1 = await prisma.shift.findFirst({ where: { namaShift: 'Shift 1' } });
  if (s1) {
    s1 = await prisma.shift.update({
      where: { id: s1.id },
      data: { jamMulai: parseTime('07:00'), jamSelesai: parseTime('15:00') },
    });
  } else {
    s1 = await prisma.shift.create({
      data: { namaShift: 'Shift 1', jamMulai: parseTime('07:00'), jamSelesai: parseTime('15:00') },
    });
  }

  // Shift 2
  let s2 = await prisma.shift.findFirst({ where: { namaShift: 'Shift 2' } });
  if (s2) {
    s2 = await prisma.shift.update({
      where: { id: s2.id },
      data: { jamMulai: parseTime('15:00'), jamSelesai: parseTime('23:00') },
    });
  } else {
    s2 = await prisma.shift.create({
      data: { namaShift: 'Shift 2', jamMulai: parseTime('15:00'), jamSelesai: parseTime('23:00') },
    });
  }

  // Shift 3
  let s3 = await prisma.shift.findFirst({ where: { namaShift: 'Shift 3' } });
  if (s3) {
    s3 = await prisma.shift.update({
      where: { id: s3.id },
      data: { jamMulai: parseTime('23:00'), jamSelesai: parseTime('07:00') },
    });
  } else {
    s3 = await prisma.shift.create({
      data: { namaShift: 'Shift 3', jamMulai: parseTime('23:00'), jamSelesai: parseTime('07:00') },
    });
  }

  console.log('Shifts OK');
  return { s1, s2, s3 };
}

async function upsertUsersAndKaryawan(depts: any, jabs: any) {
  console.log('Seeding: Users & Karyawan...');
  const specs = [
    { nik: 'ADM001', nama: 'Admin User', role: ROLE.administrator, dept: depts.it.id, jab: jabs.managerIt.id, pass: 'admin123' },
    { nik: 'EMP001', nama: 'Employee User', role: ROLE.employee, dept: depts.hr.id, jab: jabs.staffHr.id, pass: 'emp123' },
    { nik: 'KIT001', nama: 'Kitchen User', role: ROLE.dapur, dept: depts.ops.id, jab: jabs.supervisorOps.id, pass: 'kitchen123' },
    { nik: 'DEL001', nama: 'Delivery User', role: ROLE.delivery, dept: depts.ops.id, jab: jabs.supervisorOps.id, pass: 'delivery123' },
    { nik: 'EMP002', nama: 'Another Employee', role: ROLE.employee, dept: depts.hr.id, jab: jabs.staffHr.id, pass: 'emp123' },
  ] as const;

  const results: Record<string, any> = {};
  for (const s of specs) {
    const hash = await bcrypt.hash(s.pass, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { username: s.nik },
      update: { passwordHash: hash, role: s.role as any },
      create: { username: s.nik, passwordHash: hash, role: s.role as any },
    });
    const kar = await prisma.karyawan.upsert({
      where: { nomorIndukKaryawan: s.nik },
      update: { namaLengkap: s.nama, roleAccess: s.role as any, departmentId: s.dept, jabatanId: s.jab, userId: user.id },
      create: { nomorIndukKaryawan: s.nik, namaLengkap: s.nama, roleAccess: s.role as any, departmentId: s.dept, jabatanId: s.jab, userId: user.id },
    });
    results[s.nik] = { user, kar };
    console.log(`User/Karyawan ${s.nik} OK`);
  }
  return results;
}

async function upsertOrders(shifts: any, karys: Record<string, any>) {
  console.log('Seeding: Pesanan...');
  const today = new Date();
  const ymd = formatDateYYYYMMDD(today);
  const k1 = `PM-${ymd}-001`;
  const k2 = `PM-${ymd}-002`;
  const emp1 = karys['EMP001'].kar;
  const emp2 = karys['EMP002'].kar;

  // Order 1
  let o1 = await prisma.pesanan.findFirst({ where: { kodePesanan: k1 } });
  if (o1) {
    o1 = await prisma.pesanan.update({
      where: { id: o1.id },
      data: {
        statusPesanan: STATUS.MENUNGGU as any,
        shiftId: shifts.s1.id,
        jumlahPesanan: 10,
        departmentPemesanId: emp1.departmentId!,
        karyawanPemesanId: emp1.id,
        tanggalPesanan: today,
        jumlahPesananAwal: 10,
      },
    });
  } else {
    o1 = await prisma.pesanan.create({
      data: {
        kodePesanan: k1,
        statusPesanan: STATUS.MENUNGGU as any,
        shiftId: shifts.s1.id,
        jumlahPesanan: 10,
        departmentPemesanId: emp1.departmentId!,
        karyawanPemesanId: emp1.id,
        tanggalPesanan: today,
        jumlahPesananAwal: 10,
      },
    });
  }

  // Order 2
  let o2 = await prisma.pesanan.findFirst({ where: { kodePesanan: k2 } });
  if (o2) {
    o2 = await prisma.pesanan.update({
      where: { id: o2.id },
      data: {
        statusPesanan: STATUS.IN_PROGRESS as any,
        shiftId: shifts.s2.id,
        jumlahPesanan: 15,
        departmentPemesanId: emp2.departmentId!,
        karyawanPemesanId: emp2.id,
        tanggalPesanan: today,
        jumlahPesananAwal: 15,
      },
    });
  } else {
    o2 = await prisma.pesanan.create({
      data: {
        kodePesanan: k2,
        statusPesanan: STATUS.IN_PROGRESS as any,
        shiftId: shifts.s2.id,
        jumlahPesanan: 15,
        departmentPemesanId: emp2.departmentId!,
        karyawanPemesanId: emp2.id,
        tanggalPesanan: today,
        jumlahPesananAwal: 15,
      },
    });
  }

  console.log('Pesanan OK');
  return { o1, o2 };
}

async function upsertAuditTrail(karys: Record<string, any>, orders: any) {
  console.log('Seeding: AuditTrail...');
  const adminKaryawanId = karys['ADM001'].kar.id;
  const empKaryawanId = karys['EMP001'].kar.id;

  const existingAdminLog = await prisma.auditTrail.findFirst({
    where: { aksi: 'Admin login', userId: adminKaryawanId },
  });
  if (!existingAdminLog) {
    await prisma.auditTrail.create({
      data: { aksi: 'Admin login', detail: 'Administrator melakukan login awal', userId: adminKaryawanId },
    });
  }

  const existingEmpLog = await prisma.auditTrail.findFirst({
    where: { aksi: 'Employee created order', userId: empKaryawanId },
  });
  if (!existingEmpLog) {
    await prisma.auditTrail.create({
      data: { aksi: 'Employee created order', detail: `EMP001 membuat pesanan ${orders.o1.kodePesanan}`, userId: empKaryawanId },
    });
  }
  console.log('AuditTrail OK');
}

async function main() {
  console.log('=== Seed Start ===');
  const depts = await upsertDepartments();
  const jabs = await upsertJabatans(depts);
  const shifts = await upsertShifts();
  const karys = await upsertUsersAndKaryawan(depts, jabs);
  const orders = await upsertOrders(shifts, karys);
  await upsertAuditTrail(karys, orders);
  console.log('=== Seed Done ===');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });