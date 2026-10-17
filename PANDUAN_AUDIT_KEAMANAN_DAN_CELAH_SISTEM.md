# 🛡️ PANDUAN AUDIT KEAMANAN & PENGUJIAN CELAH SISTEM (SECURITY & VULNERABILITY)
## Smart School Attendance System (SSAS) — SMP Negeri 3 Jember
**Status:** DRAFT RENCANA PENGUJIAN (Menunggu Review & Persetujuan Pengguna)  
**Tanggal Penyusunan:** 16 Oktober 2026  
**Dokumen Terkait:** [PANDUAN_TESTING_SISTEM.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/PANDUAN_TESTING_SISTEM.md), [LAPORAN_BUG_DAN_HASIL_TESTING.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/LAPORAN_BUG_DAN_HASIL_TESTING.md)

---

## 📌 1. Tujuan & Ruang Lingkup Audit Keamanan

Audit keamanan ini dirancang untuk menguji ketahanan, integritas, dan perlindungan privasi data pada aplikasi **SSAS SMP Negeri 3 Jember** sebelum sistem diserahkan atau dioperasikan penuh di lingkungan sekolah. Pengujian berfokus pada pendekatan **defensif institusional** mengacu pada standar industri (OWASP Web Security Standards).

### Ruang Lingkup Pengujian:
1. **Autentikasi & Kontrol Akses (Broken Access Control & Session)**
2. **Ketahanan Brute-Force & Proteksi Rate Limiting**
3. **Integritas Pemindaian Barcode & Anti-Spoofing Presensi**
4. **Validasi Input, Sanitasi Data, & Proteksi Injeksi**
5. **Perlindungan Data Pribadi Siswa & Orang Tua (PII Exposure)**
6. **Keamanan Konfigurasi Server, Header HTTP, & Variabel Rahasia (.env)**
7. **Keamanan Terminal Fisik (Kiosk Escape / Bypass)**

---

## 🔍 2. Matriks Rencana Pengujian Celah Keamanan (Vulnerability Matrix)

Berikut adalah 8 modul skenario pengujian celah yang dirancang khusus untuk arsitektur SSAS:

| ID | Kategori Pengujian | Potensi Celah / Risiko | Tingkat Risiko | Metode Pengujian Defensif |
| :---: | :--- | :--- | :---: | :--- |
| **SEC-01** | **Bypass Autentikasi Endpoint Admin** | Pengguna reguler/tamu menembak endpoint manipulasi data tanpa JWT Token Admin | **KRITIS (High)** | Mengirim request HTTP langsung ke endpoint manipulasi (`/api/attendance/manual`, `/api/settings`, `/api/students`) tanpa header `Authorization`. Memastikan ditolak dengan kode `401/403`. |
| **SEC-02** | **Brute-Force PIN Kios (6 Digit)** | PIN 6-digit (`000000` - `999999`) ditebak secara otomatis tanpa ada pembatasan percobaan | **TINGGI (High)** | Melakukan simulasi 20 kali salah input PIN secara berturut-turut pada endpoint `/api/auth/verify-pin` untuk melihat apakah ada pembatasan/lockout sementara. |
| **SEC-03** | **Brute-Force Password Login Admin** | Menebak password admin melalui automated dictionary attack pada `/api/auth/login` | **TINGGI (High)** | Melakukan simulasi pengiriman login salah berulang kali dalam jeda singkat untuk menguji ada tidaknya *Rate Limiter*. |
| **SEC-04** | **Spoofing Presensi (Fake Barcode Tap via API)** | Siswa di luar gerbang menembak endpoint `/api/attendance/scan` dengan script tanpa scan fisik | **SEDANG (Medium)** | Menganalisis apakah endpoint `/api/attendance/scan` dapat diakses dari luar jaringan lokal sekolah atau tanpa validasi token mesin kiosk. |
| **SEC-05** | **Eksposur Data Pribadi (PII Leakage via Public API)** | Nomor WhatsApp orang tua dan NISN bocor kepada publik melalui endpoint baca | **SEDANG (Medium)** | Menguji endpoint publik seperti `/api/students` atau `/api/attendance/class/:className` apakah mengekspos nomor telepon orang tua ke user reguler/publik. |
| **SEC-06** | **Injeksi File Upload (Malicious Excel / DoS)** | Mengunggah file non-Excel, file berukuran raksasa, atau script jahat pada fitur import siswa | **SEDANG (Medium)** | Menguji pengunggahan file berekstensi `.exe`, `.php`, `.sh`, atau file `.xlsx` kosong/rusak ke `/api/students/upload-excel`. Memastikan server memvalidasi MIME type dengan benar. |
| **SEC-07** | **Injeksi Skrip (Stored XSS) pada Catatan & Nama** | Memasukkan kode HTML/JS `<script>` pada nama siswa atau catatan izin manual | **SEDANG (Medium)** | Memasukkan teks berkarakter khusus (seperti `<img src=x onerror=alert(1)>`) pada kolom catatan dan nama untuk memastikan React merender sebagai plain text, bukan script aktif. |
| **SEC-08** | **Kiosk Screen Escape (Bypass Terminal Gerbang)** | Siswa/orang lain menekan kombinasi tombol keyboard di laptop/PC gerbang untuk keluar dari Kios | **RENDAH (Low)** | Menguji kombinasi tombol `Alt+Tab`, `F12` (DevTools), `Ctrl+Shift+I`, `Windows Key`, dan klik kanan pada layar Live Kiosk Mode. |

---

## 📋 3. Rincian Prosedur Pengujian Setiap Modul

### 🛡️ SEC-01: Verifikasi Otorisasi Endpoint Terproteksi
* **Tujuan:** Memastikan endpoint sensitif mutlak tertutup bagi siapa pun yang tidak memiliki hak akses Admin.
* **Titik Endpoint yang Diuji:**
  1. `POST /api/attendance/manual` (Ubah status hadir/izin/sakit/alpa).
  2. `POST /api/attendance/reset-logs` (Reset data kehadiran).
  3. `PUT /api/settings` (Ubah jam batas masuk, token WA, nomor kontak).
  4. `DELETE /api/students/:id` dan `/api/students/bulk/all` (Hapus siswa).
* **Kriteria Lulus (Pass):**
  * Request tanpa token ➡️ Mengembalikan `401 Unauthorized` (`Akses ditolak: Token otentikasi tidak ditemukan`).
  * Request dengan token acak/palsu ➡️ Mengembalikan `401 Unauthorized` (`Sesi kedaluwarsa atau token tidak valid`).

---

### 🛡️ SEC-02: Ketahanan Brute-Force pada PIN Kios 6 Digit
* **Tujuan:** Mencegah upaya penebakan PIN keluar Kios oleh oknum siswa atau pihak tak berwenang di terminal gerbang.
* **Kondisi Saat Ini:**
  * Endpoint `/api/auth/verify-pin` saat ini memeriksa kecocokan hash bcrypt, tetapi belum memiliki middleware pembatas laju percobaan (*rate limit*).
* **Langkah Pengujian:**
  1. Mengirim 10 request verifikasi PIN yang salah dalam waktu 2 detik.
  2. Mengamati apakah server memberikan delay, lockout, atau membatasi percobaan setelah X kali salah berturut-turut.
* **Rekomendasi Mitigasi:**
  * Menerapkan delay progressive (misal: setelah 5 kali salah, kunci input selama 30 detik).

---

### 🛡️ SEC-03: Ketahanan Brute-Force Login Admin
* **Tujuan:** Menjaga kredensial utama administrator sekolah dari serangan tebakan kamus kata sandi.
* **Langkah Pengujian:**
  1. Mengirim simulasi request POST ke `/api/auth/login` dengan username `admin` dan password salah berulang kali.
  2. Memeriksa apakah ada pembatasan request per menit (misal maksimal 5 percobaan per IP).
* **Rekomendasi Mitigasi:**
  * Memasang middleware `express-rate-limit` khusus pada rute `/api/auth/login`.

---

### 🛡️ SEC-04: Integritas Pemindaian Barcode (Anti-Remote Spoofing)
* **Tujuan:** Mengetahui apakah presensi dapat "ditembak" oleh siswa dari rumah atau dari ponsel mereka.
* **Analisis Celah:**
  * Endpoint `POST /api/attendance/scan` saat ini terbuka publik agar scanner barcode USB dapat bekerja tanpa autentikasi login browser yang rumit.
  * Jika server backend di-hosting di VPS publik/Cloud, siswa yang mengetahui endpoint ini secara teknis bisa mengirim POST dengan NISN miliknya dari jarak jauh.
* **Rekomendasi Mitigasi:**
  * Jika sistem berjalan di **Jaringan Lokal Sekolah (LAN / Offline)**: Risiko otomatis terminimalisasi karena server tidak terhubung langsung ke internet publik.
  * Jika sistem berjalan di **Cloud/Internet**: Diberikan *Kiosk API Secret Header* atau pembatasan IP statis gerbang sekolah.

---

### 🛡️ SEC-05: Perlindungan Privasi Data Siswa & Orang Tua (PII)
* **Tujuan:** Memastikan nomor WhatsApp orang tua siswa tidak dapat diintip oleh sembarang orang yang membuka web.
* **Langkah Pengujian:**
  1. Mengakses endpoint `GET /api/attendance/class/:className` sebagai pengguna reguler.
  2. Memeriksa apakah data respons JSON menyertakan kolom `parentWaNumber`.
* **Kriteria Evaluasi:**
  * Untuk pengguna reguler, nomor telepon orang tua idealnya disamarkan/disensor (misal: `0812****8901`) atau tidak dikirimkan sama sekali ke browser reguler, dan hanya dikirimkan jika user memiliki sesi Admin.

---

### 🛡️ SEC-06: Validasi Berkas Impor Siswa (File Upload Security)
* **Tujuan:** Mencegah kerusakan server (*server crash*), memory overflow, atau serangan pengunggahan file berbahaya melalui form import Excel.
* **Langkah Pengujian:**
  1. Uji batas ukuran berkas (melebihi limit 15MB).
  2. Uji tipe berkas yang bukan `.xlsx` / `.xls` (misal mengganti ekstensi file teks biasa menjadi `.xlsx`).
  3. Uji struktur berkas Excel yang kolomnya kosong total atau tidak beraturan.
* **Kriteria Lulus (Pass):**
  * Server menangani error secara aman dengan kode HTTP 400 tanpa memicu server mati (*unhandled exception crash*).

---

### 🛡️ SEC-07: Pencegahan Stored Cross-Site Scripting (XSS)
* **Tujuan:** Memastikan input teks dari guru atau file Excel tidak dapat mengeksekusi skrip JavaScript liar di browser pengguna lain.
* **Titik Uji:**
  * Input Nama Siswa pada Data Siswa.
  * Input Keterangan Manual Izin/Sakit pada Absensi Perkelas.
  * Template Pesan WhatsApp pada Pengaturan.
* **Kriteria Lulus (Pass):**
  * Teks yang mengandung tag `<script>` atau tag HTML dirender murni sebagai string teks biasa (*escaped HTML text*), bukan elemen yang dieksekusi oleh DOM.

---

### 🛡️ SEC-08: Keamanan Layar Terminal Kiosk Gerbang (*Kiosk Escape*)
* **Tujuan:** Mencegah siswa usil mematikan browser atau membuka aplikasi Windows lain saat scanner ditinggal tanpa pengawasan.
* **Langkah Pengujian:**
  1. Menekan tombol `F12` atau klik kanan untuk membuka Inspect Element / Developer Tools.
  2. Mencoba menutup modal keluar kios tanpa memasukkan PIN Admin yang valid.
* **Kriteria Evaluasi:**
  * Tombol keluar kios terlindungi penuh oleh PIN Admin (sudah terverifikasi pada Bug 03).
  * Pada implementasi fisik di sekolah, disarankan menjalankan browser Chrome dalam parameter `--kiosk` pada Windows.

---

## 🚦 4. Panduan Eksekusi Pengujian (Checklist Persetujuan Pengguna)

Pengujian keamanan di atas akan dilakukan secara bertahap dan **hanya akan dijalankan setelah Anda meninjau dan memberi instruksi persetujuan**:

- [ ] **Fase 1: Audit Autentikasi & Otorisasi API** (SEC-01, SEC-02, SEC-03)
- [ ] **Fase 2: Audit Integritas Data & Validasi Input** (SEC-06, SEC-07)
- [ ] **Fase 3: Audit Privasi Data & Anti-Spoofing** (SEC-04, SEC-05, SEC-08)

---

*Silakan review dokumen ini. Beri tahu saya jika ada skenario yang ingin Anda tambahkan, kurangi, atau jika Anda sudah siap untuk saya mulai melakukan pengujian bertahap.*
