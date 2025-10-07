-- CreateEnum
CREATE TYPE "RoleAccess" AS ENUM ('administrator', 'employee', 'dapur', 'delivery');

-- CreateEnum
CREATE TYPE "StatusPesanan" AS ENUM ('MENUNGGU', 'IN_PROGRESS', 'READY', 'ON_DELIVERY', 'COMPLETE', 'DITOLAK', 'MENUNGGU_PERSETUJUAN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_access" "RoleAccess" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_department" (
    "id" SERIAL NOT NULL,
    "nama_divisi" VARCHAR(100) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_jabatan" (
    "id" SERIAL NOT NULL,
    "nama_jabatan" VARCHAR(100) NOT NULL,
    "department_id" INTEGER,
    "keterangan" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_jabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_shift" (
    "id" SERIAL NOT NULL,
    "nama_shift" VARCHAR(50) NOT NULL,
    "jam_mulai" TIME NOT NULL,
    "jam_selesai" TIME NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_karyawan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "nomor_induk_karyawan" VARCHAR(50) NOT NULL,
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "department_id" INTEGER,
    "jabatan_id" INTEGER,
    "role_access" "RoleAccess" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "keterangan" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_pesanan" (
    "id" SERIAL NOT NULL,
    "kode_pesanan" VARCHAR(20) NOT NULL,
    "karyawan_pemesan_id" INTEGER NOT NULL,
    "department_pemesan_id" INTEGER NOT NULL,
    "shift_id" INTEGER NOT NULL,
    "jumlah_pesanan" INTEGER NOT NULL,
    "jumlah_pesanan_awal" INTEGER,
    "status_pesanan" "StatusPesanan" NOT NULL,
    "tanggal_pesanan" DATE NOT NULL DEFAULT CURRENT_DATE,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" "ApprovalStatus",
    "catatan_dapur" TEXT,
    "catatan_admin" TEXT,
    "approved_by_id" INTEGER,
    "waktu_dibuat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_diproses" TIMESTAMPTZ,
    "waktu_siap" TIMESTAMPTZ,
    "waktu_diantar" TIMESTAMPTZ,
    "waktu_selesai" TIMESTAMPTZ,

    CONSTRAINT "transaction_pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_audit_trail" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "aksi" VARCHAR(255) NOT NULL,
    "detail" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role_access");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_master_department_nama_divisi" ON "master_department"("nama_divisi");

-- CreateIndex
CREATE UNIQUE INDEX "master_department_nama_divisi_key" ON "master_department"("nama_divisi");

-- CreateIndex
CREATE INDEX "idx_master_jabatan_department_id" ON "master_jabatan"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_jabatan_nama_jabatan_department_id_key" ON "master_jabatan"("nama_jabatan", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_shift_nama_shift_key" ON "master_shift"("nama_shift");

-- CreateIndex
CREATE UNIQUE INDEX "master_karyawan_user_id_key" ON "master_karyawan"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_karyawan_nomor_induk_karyawan_key" ON "master_karyawan"("nomor_induk_karyawan");

-- CreateIndex
CREATE INDEX "idx_master_karyawan_department_id" ON "master_karyawan"("department_id");

-- CreateIndex
CREATE INDEX "idx_master_karyawan_jabatan_id" ON "master_karyawan"("jabatan_id");

-- CreateIndex
CREATE INDEX "idx_master_karyawan_role_access" ON "master_karyawan"("role_access");

-- CreateIndex
CREATE INDEX "idx_master_karyawan_is_active" ON "master_karyawan"("is_active");

-- CreateIndex
CREATE INDEX "idx_transaction_pesanan_karyawan_tanggal" ON "transaction_pesanan"("karyawan_pemesan_id", "tanggal_pesanan");

-- CreateIndex
CREATE INDEX "idx_transaction_pesanan_status" ON "transaction_pesanan"("status_pesanan");

-- CreateIndex
CREATE INDEX "idx_transaction_pesanan_shift_tanggal" ON "transaction_pesanan"("shift_id", "tanggal_pesanan");

-- CreateIndex
CREATE INDEX "idx_transaction_pesanan_requires_approval" ON "transaction_pesanan"("requires_approval");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_pesanan_kode_pesanan_key" ON "transaction_pesanan"("kode_pesanan");

-- CreateIndex
CREATE INDEX "idx_log_audit_trail_user_id" ON "log_audit_trail"("user_id");

-- CreateIndex
CREATE INDEX "idx_log_audit_trail_timestamp" ON "log_audit_trail"("timestamp");

-- AddForeignKey
ALTER TABLE "master_jabatan" ADD CONSTRAINT "master_jabatan_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "master_department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_karyawan" ADD CONSTRAINT "master_karyawan_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "master_department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_karyawan" ADD CONSTRAINT "master_karyawan_jabatan_id_fkey" FOREIGN KEY ("jabatan_id") REFERENCES "master_jabatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_karyawan" ADD CONSTRAINT "master_karyawan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_pesanan" ADD CONSTRAINT "transaction_pesanan_karyawan_pemesan_id_fkey" FOREIGN KEY ("karyawan_pemesan_id") REFERENCES "master_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_pesanan" ADD CONSTRAINT "transaction_pesanan_department_pemesan_id_fkey" FOREIGN KEY ("department_pemesan_id") REFERENCES "master_department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_pesanan" ADD CONSTRAINT "transaction_pesanan_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "master_shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_pesanan" ADD CONSTRAINT "transaction_pesanan_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "master_karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_audit_trail" ADD CONSTRAINT "log_audit_trail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "master_karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
