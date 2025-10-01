Tentu, ini adalah rincian lengkap mengenai fitur, alur kerja, struktur database, dan arsitektur untuk aplikasi web progresif **Bebang Pack Meal Portal** yang Anda rencanakan. Desain ini akan mengikuti semua spesifikasi yang Anda berikan, menggunakan Django dan PostgreSQL.

### **Nama Aplikasi:** Bebang Pack Meal Portal

---

### **1. Rincian Fitur Berdasarkan Peran Pengguna (Role Access)**

Aplikasi akan memiliki empat peran utama dengan fitur yang disesuaikan untuk masing-masing.

#### **A. Administrator (Full Access)**
Administrator memiliki kontrol penuh atas seluruh sistem.
*   **Dashboard Administrator:**
    *   Menampilkan ringkasan statistik: total pesanan hari ini, total pesanan per divisi, pesanan yang menunggu persetujuan, dan jumlah pengguna aktif.
    *   Grafik realtime untuk memantau aktivitas pesanan.
*   **Manajemen Master Data (CRUD - Create, Read, Update, Delete):**
    *   **Departemen:** Mengelola daftar semua departemen di perusahaan.
    *   **Jabatan:** Mengelola jabatan dan menghubungkannya dengan departemen.
    *   **Shift:** Mengelola jadwal shift (misal: Shift 1, Shift 2, dll.) beserta jamnya.
    *   **Karyawan:** Mendaftarkan karyawan baru, mengubah data, dan menonaktifkan karyawan yang sudah tidak bekerja.
*   **Manajemen Pengguna & Akses:**
    *   Membuat akun login untuk karyawan.
    *   Menetapkan peran (Administrator, Employee, Dapur, Delivery) untuk setiap karyawan.
    *   Reset password karyawan.
    *   Mengaktifkan atau menonaktifkan akses login karyawan.
*   **Persetujuan (Approval Workflow):**
    *   Menerima notifikasi realtime untuk permintaan persetujuan.
    *   Melihat daftar pesanan yang ditolak atau diedit oleh bagian Dapur yang memerlukan persetujuan.
    *   Menyetujui (approve) atau menolak (reject) permintaan tersebut. Jika ditolak oleh admin, status pesanan akan kembali ke sebelumnya.
*   **Melihat Laporan:**
    *   Mengakses semua jenis laporan yang tersedia di sistem.
*   **Audit Trail:**
    *   Melihat log semua aktivitas penting yang terjadi di dalam aplikasi untuk keperluan audit.

#### **B. Employee (Karyawan Pemesan)**
Peran ini ditujukan untuk karyawan di setiap divisi yang bertugas memesan pack meal.
*   **Dashboard Karyawan:**
    *   Menampilkan riwayat pesanan terbaru beserta statusnya (Menunggu, Diproses, Siap Diambil, Selesai, Ditolak).
    *   Formulir cepat untuk membuat pesanan baru.
*   **Formulir Pemesanan:**
    *   Membuat pesanan baru dengan memilih shift dan jumlah pack meal.
    *   Nama dan divisi pemesan akan terisi otomatis berdasarkan data login.
*   **Riwayat & Monitoring Pesanan:**
    *   Melihat daftar semua pesanan yang pernah dibuat olehnya atau divisinya.
    *   Melacak status pesanan secara realtime.
*   **Notifikasi:**
    *   Menerima notifikasi realtime ketika status pesanannya berubah (mis., pesanan diterima Dapur, pesanan siap diantar, pesanan ditolak).

#### **C. Dapur (Kitchen Staff)**
Peran ini untuk staf dapur yang menyiapkan makanan.
*   **Dashboard Dapur:**
    *   Menampilkan daftar pesanan yang masuk secara realtime, dipisahkan berdasarkan shift.
    *   Ringkasan total pack meal yang harus disiapkan per shift.
    *   Daftar pesanan yang sedang dalam proses dan yang sudah siap diambil.
*   **Manajemen Proses Pesanan:**
    *   Melihat detail pesanan yang masuk.
    *   **Terima Pesanan:** Mengubah status pesanan dari "Menunggu" menjadi "In Progress" (Sedang Diproses).
    *   **Tolak Pesanan:** Menolak pesanan. Sistem akan meminta **wajib mengisi catatan/alasan** penolakan. Pesanan ini akan masuk ke alur persetujuan Administrator.
    *   **Edit Jumlah Pesanan:** Mengubah jumlah pack meal pada pesanan. Perubahan ini juga akan masuk ke alur persetujuan Administrator.
    *   **Siap Diambil:** Setelah selesai memasak, mengubah status menjadi "Ready" (Siap Diambil). Ini akan memicu notifikasi ke bagian Delivery.
*   **Monitoring Pengiriman:**
    *   Melihat pesanan mana yang sudah di-pickup oleh tim Delivery dan mana yang sudah selesai diantar.

#### **D. Delivery (Staf Pengiriman)**
Peran ini untuk staf yang mengantar pack meal ke setiap divisi.
*   **Dashboard Delivery:**
    *   Menampilkan daftar pesanan yang berstatus "Ready" (Siap Diambil), dikelompokkan berdasarkan divisi tujuan.
*   **Proses Pengiriman:**
    *   **Pickup Order:** Saat mengambil pack meal dari dapur, staf mengubah status menjadi "On Delivery" (Sedang Diantar).
    *   **Complete Order:** Setelah pack meal sampai di divisi tujuan, staf mengubah status menjadi "Complete" (Selesai). Ini menandai akhir dari siklus pesanan.
*   **Riwayat Pengiriman:**
    *   Melihat riwayat pengiriman yang telah diselesaikan.

---

### **2. Fitur Global & Teknis**

Fitur ini berlaku untuk keseluruhan aplikasi.

*   **Progressive Web App (PWA):**
    *   **Installable:** Aplikasi dapat di-"install" di layar utama perangkat (desktop & mobile) untuk akses cepat seperti aplikasi native.
    *   **Offline Access:** Halaman statis dan riwayat pesanan dapat diakses bahkan saat tidak ada koneksi internet (menggunakan service worker).
    *   **Responsive Design:** Tampilan aplikasi akan menyesuaikan secara otomatis di berbagai ukuran layar (desktop, tablet, dan smartphone).
*   **Notifikasi Realtime:**
    *   mengirim pembaruan instan tanpa perlu me-refresh halaman.
    *   Contoh: Saat Dapur mengubah status, Karyawan dan Delivery langsung mendapat notifikasi.
*   **Laporan Lengkap & Detail:**
    *   **Laporan Konsumsi Harian/Bulanan:** Jumlah pack meal yang dipesan per hari, per minggu, atau per bulan.
    *   **Laporan per Departemen:** Rekapitulasi total pesanan dari setiap departemen dalam periode tertentu.
    *   **Laporan Kinerja:** Rata-rata waktu yang dibutuhkan dari pesanan dibuat hingga selesai.
    *   **Laporan Penolakan/Edit:** Daftar pesanan yang pernah ditolak atau diedit beserta alasannya.
    *   Semua laporan dapat difilter berdasarkan tanggal dan diekspor ke format Excel atau PDF.
*   **Audit Trail:**
    *   Sistem akan secara otomatis mencatat setiap aksi penting:
        *   Login berhasil/gagal.
        *   Pembuatan, pembaruan, atau penghapusan data master.
        *   Setiap perubahan status pada pesanan (misal: `teguh` membuat pesanan, `yanti` mengubah status menjadi 'In Progress', `hardiman` menyelesaikan pesanan).
    *   Log ini mencatat: **Siapa** (pengguna), **Apa** (aksi yang dilakukan), dan **Kapan** (timestamp).

---

### **3. Desain Database (Struktur Tabel PostgreSQL)**

Berikut adalah rancangan struktur tabel database untuk aplikasi Anda.

```sql
-- 1. Master Data: Departemen
CREATE TABLE master_department (
    id SERIAL PRIMARY KEY,
    nama_divisi VARCHAR(100) NOT NULL UNIQUE,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Master Data: Jabatan
CREATE TABLE master_jabatan (
    id SERIAL PRIMARY KEY,
    nama_jabatan VARCHAR(100) NOT NULL,
    department_id INT REFERENCES master_department(id),
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Data: Shift
CREATE TABLE master_shift (
    id SERIAL PRIMARY KEY,
    nama_shift VARCHAR(50) NOT NULL UNIQUE,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Master Data: Karyawan & Pengguna
CREATE TABLE master_karyawan (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE, -- Foreign Key ke tabel auth_user Django
    nomor_induk_karyawan VARCHAR(50) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    department_id INT REFERENCES master_department(id),
    jabatan_id INT REFERENCES master_jabatan(id),
    role_access VARCHAR(20) NOT NULL, -- 'administrator', 'employee', 'dapur', 'delivery'
    is_active BOOLEAN DEFAULT TRUE,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Transaksi: Pesanan Pack Meal
CREATE TABLE transaction_pesanan (
    id SERIAL PRIMARY KEY,
    kode_pesanan VARCHAR(20) UNIQUE NOT NULL, -- Contoh: PM-20250930-001
    karyawan_pemesan_id INT REFERENCES master_karyawan(id),
    department_pemesan_id INT REFERENCES master_department(id),
    shift_id INT REFERENCES master_shift(id),
    jumlah_pesanan INT NOT NULL,
    jumlah_pesanan_awal INT, -- Untuk menyimpan jumlah asli jika ada editan
    status_pesanan VARCHAR(30) NOT NULL, -- 'Menunggu', 'In Progress', 'Ready', 'On Delivery', 'Complete', 'Ditolak'
    tanggal_pesanan DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Kolom untuk alur persetujuan
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20), -- 'Pending', 'Approved', 'Rejected'
    catatan_dapur TEXT, -- Alasan penolakan atau edit dari dapur
    catatan_admin TEXT, -- Catatan dari admin saat approve/reject
    approved_by_id INT REFERENCES master_karyawan(id),
    
    -- Timestamps
    waktu_dibuat TIMESTAMPTZ DEFAULT NOW(),
    waktu_diproses TIMESTAMPTZ,
    waktu_siap TIMESTAMPTZ,
    waktu_diantar TIMESTAMPTZ,
    waktu_selesai TIMESTAMPTZ
);

-- 6. Tabel Log: Audit Trail
CREATE TABLE log_audit_trail (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES master_karyawan(id),
    aksi VARCHAR(255) NOT NULL, -- Contoh: "Membuat Pesanan #PM-20250930-001"
    detail TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

```
Dengan struktur dan fitur yang terperinci ini, aplikasi **Bebang Pack Meal Portal** akan menjadi solusi yang kuat, efisien, dan transparan untuk mengelola proses pemesanan makanan di perusahaan Anda.