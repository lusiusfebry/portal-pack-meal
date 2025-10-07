-- CreateTable
CREATE TABLE "master_lokasi" (
    "id" SERIAL NOT NULL,
    "nama_lokasi" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "keterangan" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_master_lokasi_nama_lokasi" ON "master_lokasi"("nama_lokasi");

-- CreateIndex
CREATE INDEX "idx_master_lokasi_is_active" ON "master_lokasi"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "master_lokasi_nama_lokasi_key" ON "master_lokasi"("nama_lokasi");
