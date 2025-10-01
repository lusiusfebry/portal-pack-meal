Tentu saja. Membuat *prompt* untuk UI/UX yang spesifik adalah kunci untuk menghindari hasil yang generik. Prompt ini dirancang untuk diberikan kepada desainer UI/UX atau AI image generator (seperti Midjourney dengan instruksi yang detail) untuk menciptakan desain yang sesuai dengan visi Anda.

Prompt ini sengaja dibuat sangat deskriptif dan beropini untuk memberikan arahan seni (*art direction*) yang kuat.

---

### **PROMPT LENGKAP UNTUK DESAIN UI/UX APLIKASI "BEBANG PACK MEAL PORTAL"**

**Judul Proyek:** Desain Antarmuka (UI) dan Pengalaman Pengguna (UX) untuk "Bebang Pack Meal Portal"

**Visi Utama:** Menciptakan desain yang **modern, profesional, dan premium**. Tampilannya harus terasa seperti aplikasi SaaS (Software-as-a-Service) premium yang efisien, bukan sekadar aplikasi internal biasa. Fokus pada kejelasan, kecepatan, dan kepercayaan. Hindari sepenuhnya estetika generik, ilustrasi stok yang klise, dan palet warna biru-putih korporat yang membosankan.

---

#### **1. Filosofi & Prinsip Desain (Design Philosophy)**

*   **Clarity over Clutter:** Setiap elemen harus memiliki tujuan yang jelas. Prioritaskan informasi yang paling penting. Gunakan ruang putih (white space) secara strategis untuk memberikan "napas" pada desain dan mengurangi kelelahan visual.
*   **Efficiency in Action:** Alur kerja pengguna harus seintuitif mungkin. Kurangi jumlah klik yang diperlukan untuk menyelesaikan tugas utama (membuat pesanan, mengubah status).
*   **Data-Driven Elegance:** Tampilkan data dan laporan dengan cara yang elegan dan mudah dipahami. Gunakan visualisasi data (grafik, bagan) yang bersih dan interaktif, bukan tabel yang monoton.
*   **Subtle Sophistication:** Ke-premium-an datang dari detail. Gunakan animasi mikro yang halus, bayangan (shadow) yang lembut, gradien yang tidak mencolok, dan ikonografi yang konsisten.

---

#### **2. Identitas Visual (Visual Identity)**

*   **Palet Warna (Color Palette):**
    *   **Primary/Dark Mode:** Gunakan warna dasar gelap yang profesional seperti **Charcoal Blue** (`#1A2B44`) atau **Deep Slate Gray** (`#2D3748`). Ini akan menjadi latar belakang utama untuk memberikan nuansa premium dan fokus.
    *   **Aksen Utama (Primary Accent):** Pilih satu warna cerah yang menonjol untuk tombol aksi utama (CTA), link, dan elemen aktif. Contoh: **Emerald Green** (`#34D399`) yang melambangkan kesegaran dan status "sukses", atau **Amber Yellow** (`#FBBF24`) yang enerjik.
    *   **Warna Sekunder:** Gunakan warna netral seperti abu-abu muda (`#A0AEC0`) untuk teks sekunder, batas (border), dan ikon non-aktif.
    *   **Warna Semantik:**
        *   **Sukses:** Gunakan warna Aksen Utama (hijau).
        *   **Peringatan/Menunggu:** **Soft Orange** (`#F97316`).
        *   **Error/Ditolak:** **Crimson Red** (`#DC2626`).

*   **Tipografi (Typography):**
    *   **Font Utama (UI & Body):** Gunakan font Sans-Serif yang modern dan sangat mudah dibaca seperti **"Inter"**, **"Poppins"**, atau **"Figtree"**. Font ini memiliki berbagai ketebalan (weights) yang bagus untuk hierarki visual.
    *   **Ukuran & Hierarki:** Tetapkan sistem skala tipografi yang jelas. Judul Halaman (Heading 1) harus besar dan tegas, diikuti oleh sub-judul, teks isi, dan label yang lebih kecil. Pastikan kontras teks dengan latar belakang sangat tinggi untuk keterbacaan.

*   **Ikonografi (Iconography):**
    *   Gaya: **Custom, line-based (outline)** dengan ketebalan garis yang konsisten (misal: 1.5px).
    *   Desain: Ikon harus minimalis, modern, dan mudah dikenali. Hindari ikon 3D atau yang terlalu detail. Gunakan sudut yang sedikit membulat (subtly rounded corners) agar terasa lebih ramah.

*   **Elemen Visual Lainnya:**
    *   **Ilustrasi:** **HINDARI** ilustrasi orang-orangan kartun generik. Jika perlu ilustrasi (misal: untuk halaman kosong atau onboarding), gunakan **pola geometris abstrak** atau **gradien halus** yang konsisten dengan palet warna.
    *   **Border & Shadow:** Gunakan sudut yang sedikit membulat (rounded corners, sekitar 8-12px) untuk kartu (cards), tombol, dan input field. Bayangan harus lembut dan menyebar untuk menciptakan kedalaman, bukan garis hitam tebal.

---

#### **3. Desain Komponen (Component Design)**

*   **Tombol (Buttons):**
    *   Primer: Latar belakang warna aksen utama, teks putih, dengan efek hover yang halus (misal: sedikit lebih cerah).
    *   Sekunder: Outline dengan warna aksen, teks warna aksen, latar belakang transparan.
*   **Formulir & Input:**
    *   Desain bersih dengan label yang jelas di atas field.
    *   Saat field aktif (on focus), berikan highlight dengan warna aksen pada bordernya.
*   **Kartu (Cards):** Gunakan sebagai elemen utama untuk menampilkan ringkasan pesanan, data di dashboard, dan item laporan. Beri `padding` yang cukup di dalamnya.
*   **Tabel Data:** Desain tabel agar tidak terasa sesak. Beri jarak antar baris. Sediakan fitur `sort` dan `filter`. Baris dapat di-highlight saat di-hover.
*   **Notifikasi & Badge Status:** Gunakan "pil" atau "badge" berwarna (sesuai warna semantik) untuk menampilkan status pesanan (`In Progress`, `Ready`, `Complete`). Desainnya harus kecil dan tidak mengganggu.

---

#### **4. Arahan Desain per Layar (Screen-specific Art Direction)**

*   **1. Halaman Login:**
    *   **Mood:** Minimalis, aman, dan profesional.
    *   **Layout:** Logo perusahaan di bagian atas, dua input field (NIK & Password) di tengah, dan satu tombol login besar. Bisa menggunakan latar belakang gradien halus atau gambar abstrak.

*   **2. Dashboard Administrator:**
    *   **Mood:** Pusat komando yang powerful namun tidak membingungkan.
    *   **Layout:** Gunakan grid. Baris atas untuk kartu KPI utama (Total Pesanan, Proses, Selesai). Di bawahnya, tampilkan grafik (misal: diagram batang pesanan per divisi) dan tabel ringkasan aktivitas terbaru. Navigasi utama berada di sidebar kiri yang permanen.

*   **3. Tampilan Dapur (Kitchen View):**
    *   **Mood:** Fungsional, jelas, dan berorientasi pada tugas.
    *   **Layout:** Gunakan **tampilan Kanban Board** dengan kolom status: "Pesanan Baru", "In Progress", "Siap Diambil". Setiap pesanan adalah sebuah kartu yang dapat di-*drag-and-drop* (opsional) atau diubah statusnya via tombol. Tampilkan informasi paling penting di kartu: nama divisi, jumlah, dan shift.

*   **4. Tampilan Delivery:**
    *   **Mood:** Mobile-first, sederhana, dan fokus pada aksi.
    *   **Layout:** Tampilan daftar (list) sederhana dari pesanan yang berstatus "Ready". Setiap item memiliki informasi tujuan yang jelas dan dua tombol besar: "Pickup Order" dan "Complete".

*   **5. Formulir Pemesanan (Employee):**
    *   **Mood:** Cepat dan mudah.
    *   **Layout:** Formulir satu kolom yang simpel. Gunakan `stepper` (+/-) untuk input jumlah agar lebih cepat daripada mengetik manual.

Dengan menggunakan prompt ini, Anda memberikan arahan yang sangat jelas tentang "rasa" dan "tampilan" yang Anda inginkan, memaksa AI atau desainer untuk berpikir di luar kotak dan menghasilkan sesuatu yang benar-benar **modern, profesional, dan premium**.