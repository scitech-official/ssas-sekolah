# 📖 PANDUAN LENGKAP MAINTENANCE & ARSITEKTUR SISTEM (UNTUK PENGELOLA / DEVELOPER)
## Smart School Attendance System (SSAS) — SMP Negeri 3 Jember
**Versi:** 1.0.0 (Production Ready)  
**Terakhir Diperbarui:** 16 Oktober 2026  
**Vendor Pengembang:** Supported by SCI Tech  

---

## 📌 1. Ikhtisar Arsitektur Sistem

Sistem ini dibangun dengan arsitektur monorepo terpisah antara antarmuka (*Client Frontend*) dan server (*API Backend*) yang saling berkomunikasi melalui protokol REST API.

```text
Web_Absensi_SMP3/
├── frontend/                  # Antarmuka Pengguna (Vite + React 18 + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Komponen UI Reusable (Navbar, Sidebar, Modals, QuickSearch)
│   │   ├── context/           # State Global (AuthContext, ToastContext)
│   │   ├── pages/             # Halaman Utama (DashboardTotal, AbsensiPerkelas, DataSiswa, Pengaturan, KioskMode)
│   │   └── utils/             # Helper API (Axios instance) & Web Audio Sound Generator
│   ├── public/                # Aset Statis Publik (logo.png)
│   └── vite.config.js         # Konfigurasi Port & Reverse Proxy API
│
├── backend/                   # Server API & Logika Bisnis (Express.js + Prisma ORM)
│   ├── src/
│   │   ├── config/            # Inisialisasi Database Prisma Client
│   │   ├── controllers/       # Logika Bisnis (Attendance, Student, Auth, Settings)
│   │   ├── middleware/        # Keamanan (Auth JWT, Rate Limiter, PII Masker)
│   │   ├── routes/            # Definisi Rute API (/auth, /students, /attendance, /settings)
│   │   ├── services/          # Worker & Layanan (Excel Import/Export, Barcode PNG, Fonnte WA, Cron)
│   │   └── server.js          # Entry Point Express Server & Helmet Protection
│   ├── prisma/
│   │   ├── schema.prisma      # Definisi Skema Database SQLite
│   │   ├── seed.js            # Generator Data Awal (Akun Admin, 39 Siswa Sampel, Jadwal Libur)
│   │   └── dev.db             # Berkas Database SQLite Aktif
│   └── .env                   # Variabel Lingkungan & Kunci Rahasia
│
└── package.json               # Root Package Runner (Menjalankan Frontend & Backend Sekaligus)
```

---

## 🚀 2. Panduan Menjalankan Sistem (*Operational Guide*)

### A. Menjalankan Sekaligus (Paling Mudah)
Dari folder utama (`Web_Absensi_SMP3/`), cukup jalankan perintah:
```bash
npm run dev
```
* Perintah ini akan menyalakan **Backend pada `http://localhost:5000`** dan **Frontend pada `http://localhost:5173`** secara bersamaan (*concurrently*).

### B. Menjalankan Secara Terpisah
Jika ingin menjalankan pada terminal terpisah:
* **Terminal 1 (Backend API):**
  ```bash
  npm run dev:backend
  # Atau: cd backend && node src/server.js
  ```
* **Terminal 2 (Frontend UI):**
  ```bash
  npm run dev:frontend
  # Atau: cd frontend && npm run dev
  ```

### C. Build Produksi (Deployment)
Untuk menguji atau membuat paket build produksi:
```bash
npm run build
```

---

## 🔑 3. Kredensial Default & Hak Akses

| Role | Username | Password Default | PIN Keluar Kiosk | Hak Akses |
| :--- | :--- | :--- | :---: | :--- |
| **Administrator Sekolah** | `admin` | `admin123` | `123456` | Akses Penuh: Data Siswa, Pengaturan, Edit Manual, Live Kiosk, Reset Riwayat, Import/Export |
| **Pengguna Reguler / Tamu** | *(Tanpa Login)* | - | - | Akses Terbatas: Dashboard Total, Monitoring Absensi Per Kelas, Cetak Rapor PDF, Cari Siswa |

> [!TIP]
> **Cara Mengubah Password / PIN:**  
> Admin dapat mengubah Password dan PIN 6-digit sewaktu-waktu melalui menu **Pengaturan** pada panel **Keamanan Akses Admin**.

> [!IMPORTANT]
> **Lupa Password / Emergency Reset:**  
> Jika password Admin lupa, jalankan perintah seeding database:
> ```bash
> npm run seed
> ```
> Perintah ini akan mereset akun `admin` kembali ke password `admin123` dan PIN `123456`.

---

## 🗄️ 4. Manajemen Database (Prisma ORM & SQLite)

### A. Membuka Tampilan Database Visual (Prisma Studio)
Untuk melihat, mengedit, atau menambah data langsung di database melalui tampilan browser:
```bash
npm run studio
```
Lalu buka alamat **`http://localhost:5555`** di browser Anda.

### B. Prosedur Backup Database Rutin
Sistem menggunakan database file SQLite yang sangat praktis dan portabel:
* **Lokasi Berkas:** `backend/prisma/dev.db`
* **Cara Backup:**
  1. Cukup salin (*copy-paste*) berkas `dev.db` ke folder cadangan, flashdisk, atau Google Drive sekolah.
  2. Direkomendasikan melakukan backup mingguan setiap hari Sabtu setelah jam pulang sekolah.
* **Cara Restore:** Cukup timpa berkas `dev.db` yang ada dengan berkas cadangan Anda saat server dimatikan.

---

## 🛡️ 5. Arsitektur Keamanan yang Diterapkan

Sistem SSAS telah dilengkapi dengan proteksi keamanan institusional:

1. **Anti Brute-Force Rate Limiting (`backend/src/middleware/rateLimiter.js`):**
   * **Login Admin (`/api/auth/login`):** Maksimal 5 kali percobaan gagal per 15 menit per IP. Setelah itu diblokir otomatis dengan kode `HTTP 429 Too Many Requests`.
   * **PIN Kios Gerbang (`/api/auth/verify-pin`):** Maksimal 5 kali percobaan salah per 5 menit per IP.
   * **General API:** Maksimal 300 request/menit untuk mencegah serangan DoS/traffic flooding.
2. **Anti-Spoofing Pemindaian Barcode:**
   * Endpoint `POST /api/attendance/scan` diproteksi header `x-kiosk-secret` (`smp3_kiosk_gate_token_2026`). Request liar dari luar jaringan terminal Kios akan ditolak dengan `HTTP 403 Forbidden`.
3. **Perlindungan Privasi Siswa & Orang Tua (PII Masking):**
   * Nomor WhatsApp orang tua disensor otomatis menjadi format `62812****432` pada endpoint publik (`/api/attendance/class/:className` dan `/api/students`).
   * Hanya Admin resmi ber-token JWT yang dapat membaca nomor WhatsApp lengkap.
4. **Keamanan Upload Berkas Excel:**
   * Multer dilengkapi `fileFilter` yang secara ketat hanya mengizinkan berkas berekstensi `.xlsx` dan `.xls`. Berkas lainnya langsung ditolak dengan `HTTP 400 Bad Request`.
5. **Anti Formula / CSV Injection:**
   * Seluruh string pada ekspor Excel yang diawali karakter formula (`=`, `+`, `-`, `@`) disanitasi otomatis dengan awalan tanda petik tunggal (`'`).
6. **Hardening HTTP Header:**
   * Express dilengkapi middleware `helmet` untuk mengaktifkan proteksi `X-Content-Type-Options`, `X-Frame-Options` (anti-clickjacking), dan HSTS.

---

## 🖨️ 6. Integrasi Perangkat Keras Scanner Barcode

* **Tipe Scanner:** Mendukung seluruh scanner barcode 1D / 2D USB tipe **Keyboard Wedge (HID)**.
* **Cara Pemasangan:** Cukup colokkan kabel USB scanner ke laptop/PC gerbang sekolah. Scanner akan dikenali Windows otomatis sebagai perangkat input keyboard.
* **Logika Keystroke Listener:**
  * File `frontend/src/pages/KioskMode.jsx` memiliki global keystroke buffer.
  * Ketika barcode siswa dipindai, scanner mengirim karakter NISN secara cepat (<50 milidetik per karakter) diakhiri tombol `Enter`.
  * Sistem otomatis menangkap input barcode ini **tanpa petugas gerbang harus mengklik mouse atau memfokuskan kursor ke kotak teks**.

---

## 💬 7. Integrasi WhatsApp Gateway (Fonnte API)

Pengaturan WhatsApp berada pada file `backend/.env` dan menu **Pengaturan**:
* **Mode Simulator (`FONNTE_MOCK_MODE=true`):**
  * Pesan otomatis disimulasikan di konsol backend dan dicatat pada tabel `WaLog` di database.
  * Kuota akun WhatsApp Fonnte **0 kuota terpakai (aman 100%)**. Sangat ideal untuk testing sehari-hari.
* **Mode Live Produksi (`FONNTE_MOCK_MODE=false`):**
  * Masukkan token Fonnte pada baris `FONNTE_API_TOKEN="token_anda"` di file `.env`.
  * Sistem akan mengirimkan pesan WhatsApp secara riil ke nomor handphone orang tua siswa setiap kali siswa melakukan tap kartu presensi di gerbang sekolah.

---

## ⏰ 8. Otomatisasi Jadwal Sistem (Cron Job)

* **Lokasi Kode:** `backend/src/services/cronService.js`
* **Jadwal Eksekusi:** Berjalan setiap 1 menit (`* * * * *`).
* **Logika Auto-Alpa:**
  * Jika jam sistem telah melewati batas **Cut-off Alpa** (default: `08:00 WIB`), seluruh siswa yang belum melakukan tap presensi otomatis ditandai berstatus **`ALPA`**.
  * Dilengkapi **Mutex Lock (`isProcessingAutoAlpa`)** dan **Idempotency Query** untuk memastikan sistem tidak pernah memproses ganda rekaman kehadiran pada hari yang sama.
  * Otomatis libur pada hari Minggu dan tanggal yang didaftarkan pada tabel `Holiday`.

---

*Panduan ini dibuat agar sistem SSAS SMP Negeri 3 Jember dapat dipelihara, dikembangkan, dan dioperasikan secara mandiri oleh tim IT sekolah maupun developer lanjutan dengan mudah dan aman.*
