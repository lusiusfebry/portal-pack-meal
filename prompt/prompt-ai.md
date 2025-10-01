Tentu, ini adalah sebuah *prompt* yang sangat detail dan lengkap yang bisa Anda gunakan untuk AI developer atau sebagai panduan teknis untuk tim Anda.

Prompt ini dirancang untuk memberikan semua konteks, persyaratan, dan detail teknis yang diperlukan untuk membangun aplikasi **Bebang Pack Meal Portal** dari awal hingga akhir, meminimalkan ambiguitas dan memastikan semua fitur yang Anda inginkan tercakup.

---

### **PROMPT LENGKAP UNTUK PENGEMBANGAN APLIKASI**

**Judul Proyek:** Pembangunan Aplikasi Web Progresif (PWA) "Bebang Pack Meal Portal"

**Tujuan Utama:** Mengembangkan aplikasi web progresif internal untuk mengelola dan melacak proses pemesanan, persiapan, dan pengiriman *pack meal* bagi karyawan perusahaan. Aplikasi ini harus realtime, efisien, dan menyediakan data yang akurat untuk pelaporan.

---

#### **1. Spesifikasi Teknologi (Technology Stack)**
*   **Backend Framework:** belum di tentukan
*   **Database:** PostgreSQL
    *   **Credential (untuk development):**
        *   User: `postgres`
        *   Password: `123456789`
*   **Fitur Realtime:** belum di tentukan
*   **Frontend:** belum ditentukan

---

#### **2. Peran Pengguna & Hak Akses (User Roles & Permissions)**
Aplikasi harus mendukung empat peran pengguna yang berbeda dengan fungsionalitas yang spesifik:

*   **A. Administrator (Full Access):**
    *   **Dashboard:** Menampilkan ringkasan data operasional lengkap (total pesanan, status pesanan, pesanan per divisi) secara realtime.
    *   **Manajemen Operasional Terintegrasi:** Dapat melihat dan mengelola **semua pesanan** dari satu menu, seolah-olah memiliki akses ke tampilan Employee, Dapur, dan Delivery sekaligus.
    *   **Override Manual:** Dapat mengubah status, mengedit, atau membatalkan pesanan apa pun jika diperlukan.
    *   **Pusat Persetujuan:** Mengelola dan menyetujui/menolak permintaan edit/tolak pesanan dari Dapur.
    *   **Manajemen Master Data (CRUD):** Mengelola data Departemen, Jabatan, Shift, dan Karyawan.
    *   **Manajemen Pengguna:** Membuat akun, mengatur peran, me-reset password, dan menonaktifkan pengguna.
    *   **Akses Laporan:** Mengakses semua laporan yang tersedia.
    *   **Audit Trail:** Melihat semua log aktivitas sistem.

*   **B. Employee (Karyawan Pemesan):**
    *   **Dashboard:** Melihat riwayat pesanan pribadi dan form untuk membuat pesanan baru.
    *   **Fungsi:** Hanya dapat **membuat pesanan** untuk shift dan jumlah yang ditentukan, serta **melihat status** pesanan mereka secara realtime.
    *   **Notifikasi:** Menerima notifikasi saat status pesanan berubah.

*   **C. Dapur (Staf Dapur):**
    *   **Dashboard:** Melihat daftar pesanan masuk yang perlu diproses, dikelompokkan per shift.
    *   **Fungsi:**
        *   **Menerima Pesanan:** Mengubah status dari `Menunggu` -> `In Progress`.
        *   **Menyiapkan Pesanan:** Mengubah status dari `In Progress` -> `Ready`.
        *   **Menolak Pesanan:** Menolak pesanan dengan **wajib mengisi catatan alasan**. Ini akan mengirim pesanan ke Pusat Persetujuan Admin.
        *   **Mengedit Jumlah Pesanan:** Mengubah total pesanan dengan **wajib mengisi catatan alasan**. Ini juga akan mengirim pesanan ke Pusat Persetujuan Admin.

*   **D. Delivery (Staf Pengiriman):**
    *   **Dashboard:** Melihat daftar pesanan yang berstatus `Ready` dan siap diantar.
    *   **Fungsi:**
        *   **Mengambil Pesanan:** Mengubah status dari `Ready` -> `On Delivery`.
        *   **Menyelesaikan Pesanan:** Mengubah status dari `On Delivery` -> `Complete`.

---

#### **3. Alur Kerja Utama (Core Workflow)**
1.  **Pemesanan:** `Employee` membuat pesanan baru. Status awal: `Menunggu`.
2.  **Proses Dapur:** `Dapur` melihat pesanan, menerimanya, dan status berubah menjadi `In Progress`. Setelah selesai, status diubah menjadi `Ready`. Notifikasi dikirim ke `Delivery`.
3.  **Pengiriman:** `Delivery` melihat pesanan `Ready`, mengambilnya dari dapur, dan mengubah status menjadi `On Delivery`. Setelah tiba di tujuan, status diubah menjadi `Complete`. Notifikasi dikirim ke `Employee` bahwa pesanan telah tiba.
4.  **Alur Pengecualian (Approval Workflow):** Jika `Dapur` menolak atau mengedit pesanan, status berubah menjadi `Menunggu Persetujuan`. `Administrator` menerima notifikasi, meninjau permintaan dan catatan, lalu menyetujui atau menolaknya.

---

#### **4. Fitur Kunci & Persyaratan Teknis**
*   **Progressive Web App (PWA):** Aplikasi harus dapat di-install di homescreen perangkat mobile/desktop, berfungsi secara minimal saat offline (cache halaman statis), dan responsif.
*   **Notifikasi Realtime:** Perubahan status pesanan harus langsung terlihat di semua antarmuka pengguna yang relevan tanpa perlu refresh halaman (gunakan Django Channels).
*   **Sistem Pelaporan:**
    *   Hasilkan laporan harian, mingguan, dan bulanan.
    *   Filter laporan berdasarkan departemen, rentang tanggal, dan status.
    *   Fitur untuk mengekspor laporan ke format CSV atau PDF.
*   **Audit Trail:**
    *   Catat setiap tindakan penting: `(Siapa, Apa, Kapan)`.
    *   Contoh log: "User `yanti` mengubah status pesanan `PM-001` menjadi `Ready` pada `2025-09-30 10:00:00`".
    *   Log harus mudah dicari dan difilter oleh Administrator.
*   **Otentikasi:** Login menggunakan Nomor Induk Karyawan (NIK) dan password. Hanya karyawan dengan status `active` yang bisa login.

---

#### **5. Desain Skema Database (PostgreSQL)**
Gunakan skema berikut sebagai dasar untuk `models.py` di Django.

```sql
-- Tabel Master
CREATE TABLE master_department (id SERIAL PRIMARY KEY, nama_divisi VARCHAR(100) NOT NULL UNIQUE, keterangan TEXT);
CREATE TABLE master_jabatan (id SERIAL PRIMARY KEY, nama_jabatan VARCHAR(100) NOT NULL, department_id INT REFERENCES master_department(id), keterangan TEXT);
CREATE TABLE master_shift (id SERIAL PRIMARY KEY, nama_shift VARCHAR(50) NOT NULL, jam_mulai TIME, jam_selesai TIME, keterangan TEXT);
CREATE TABLE master_karyawan (id SERIAL PRIMARY KEY, user_id INT UNIQUE, nomor_induk_karyawan VARCHAR(50) UNIQUE, nama_lengkap VARCHAR(150), department_id INT REFERENCES master_department(id), jabatan_id INT REFERENCES master_jabatan(id), role_access VARCHAR(20), is_active BOOLEAN DEFAULT TRUE);

-- Tabel Transaksi
CREATE TABLE transaction_pesanan (
    id SERIAL PRIMARY KEY,
    kode_pesanan VARCHAR(20) UNIQUE,
    karyawan_pemesan_id INT REFERENCES master_karyawan(id),
    shift_id INT REFERENCES master_shift(id),
    jumlah_pesanan INT,
    status_pesanan VARCHAR(30), -- 'Menunggu', 'In Progress', 'Ready', 'On Delivery', 'Complete', 'Ditolak', 'Menunggu Persetujuan'
    tanggal_pesanan DATE,
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20), -- 'Pending', 'Approved', 'Rejected'
    catatan_dapur TEXT,
    catatan_admin TEXT,
    waktu_dibuat TIMESTAMPTZ DEFAULT NOW(),
    waktu_diproses TIMESTAMPTZ,
    waktu_siap TIMESTAMPTZ,
    waktu_diantar TIMESTAMPTZ,
    waktu_selesai TIMESTAMPTZ
);

-- Tabel Log
CREATE TABLE log_audit_trail (id BIGSERIAL PRIMARY KEY, user_id INT REFERENCES master_karyawan(id), aksi VARCHAR(255), detail TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());
```

---

#### **6. Permintaan Output (Requested Output)**
Berdasarkan prompt ini, harap berikan output berikut:
1.  **Struktur Proyek:** Tampilkan struktur direktori dan file yang direkomendasikan untuk proyek Django ini.
2.  **Kode `models.py`:** Buat file `models.py` yang lengkap berdasarkan skema database di atas.
3.  **Kode `views.py`:** Berikan contoh implementasi fungsi-fungsi view utama, seperti:
    *   Dashboard untuk setiap peran (Admin, Employee, Dapur, Delivery).
    *   Logika untuk membuat pesanan.
    *   Logika untuk mengubah status pesanan oleh Dapur dan Delivery.
    *   View untuk "Pusat Persetujuan" Administrator.
4.  **Konfigurasi Django Channels:** Tunjukkan contoh dasar `routing.py` dan `consumers.py` untuk menangani pembaruan status pesanan secara realtime.
5.  **Desain Antarmuka (Wireframe/Deskripsi):** Jelaskan secara singkat tata letak halaman utama untuk setiap peran pengguna.