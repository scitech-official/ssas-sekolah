# 📋 PANDUAN PENGUJIAN MENYELURUH (FULL UAT & PRE-DEPLOYMENT TEST PLAN)
**Sistem:** SSAS - Smart School Attendance System | SMP Negeri 3 Jember  
**Versi Dokumen:** 1.0 (Final Pre-Deployment)  
**Target Pengujian:** Internal Full Functional, UI/UX, Edge Cases, & Security Flow  
**Catatan Khusus Kuota WhatsApp:** Seluruh pengujian WhatsApp wajib dijalankan dalam **MODE SIMULATOR (MOCK LOG)** untuk menghemat dan menjaga limit kuota akun Fonnte Free (0 kuota terpakai).

---

## 📑 DAFTAR ISI
1. [Prasyarat & Persiapan Lingkungan Uji](#1-prasyarat--persiapan-lingkungan-uji)
2. [Matriks Pengujian Modul 1: Dashboard Utama & Monitoring](#2-modul-1-dashboard-utama--monitoring-real-time)
3. [Matriks Pengujian Modul 2: Mode Kios Gerbang & Scanner Barcode](#3-modul-2-mode-kios-gerbang--scanner-barcode)
4. [Matriks Pengujian Modul 3: Manajemen Siswa & Generator Barcode](#4-modul-3-manajemen-siswa--generator-barcode-pngzip)
5. [Matriks Pengujian Modul 4: Absensi Per Kelas & Dispensasi](#5-modul-4-absensi-per-kelas--dispensasi-khusus)
6. [Matriks Pengujian Modul 5: Otomatisasi Cut-Off Alpa & Kasus Waktu Ekstrem](#6-modul-5-otomatisasi-cut-off-alpa--kasus-ekstrem)
7. [Matriks Pengujian Modul 6: Verifikasi Notifikasi WA (Mock Simulator)](#7-modul-6-verifikasi-notifikasi-wa-mode-simulator)
8. [Matriks Pengujian Modul 7: Pengaturan Sistem & 14 Titik Pop-Up Konfirmasi](#8-modul-7-pengaturan-sistem--14-titik-modal-konfirmasi)
9. [Matriks Pengujian Modul 8: Responsivitas Mobile, Tablet & Desktop](#9-modul-8-responsivitas-tampilan-mobile-tablet--desktop)
10. [Tabel Rekapitulasi & Lembar Checklist UAT](#10-tabel-rekapitulasi-checklist-uat)

---

## 1. Prasyarat & Persiapan Lingkungan Uji

### 1.1 Persiapan Layanan Lokal
Pastikan server backend dan frontend berjalan dengan baik di komputer lokal:
1. **Backend:** Berjalan di `http://localhost:5000` (`npm run dev` pada folder `backend/`)
2. **Frontend:** Berjalan di `http://localhost:5173` (`npm run dev` pada folder `frontend/`)
3. **Database:** SQLite (`backend/prisma/dev.db`) dalam keadaan siap.

### 1.2 Proteksi Limit Kuota Akun Fonnte (PENTING!)
Sebelum memulai pengujian apa pun:
1. Buka browser dan akses menu **Pengaturan** (`http://localhost:5173/pengaturan`).
2. Gulir ke bagian **Integrasi Gateway WhatsApp (Fonnte API)**.
3. Pastikan **Mode Pengiriman** terpilih pada opsi:
   > 🟢 **Simulator / Mock Log (Hemat Kuota - Untuk Uji Coba)**
4. Klik tombol **Simpan Token & Mode Fonnte** dan setujui konfirmasi pop-up.
5. *Hasil:* Seluruh pesan WhatsApp akan diarahkan ke log backend terminal tanpa mengirimkan HTTP request ke server Fonnte, sehingga **kuota Fonnte tetap utuh 100%**.

---

## 2. MODUL 1: Dashboard Utama & Monitoring Real-Time

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **DASH-01** | Visualisasi Metrik Kehadiran | Buka halaman Beranda (`/`). Perhatikan 7 kartu ringkasan (Total Siswa, Hadir, Telat, Belum Masuk, Sakit, Izin, Alpa). | Angka pada kartu sesuai dengan jumlah total siswa dan data presensi hari ini. Tidak ada angka bernilai `NaN` atau `undefined`. | [ ] |
| **DASH-02** | Ubah Parameter Waktu Presensi | 1. Pada panel *Parameter Waktu*, klik tombol **Edit Parameter Waktu**.<br>2. Ubah Jam Masuk, Batas Tepat Waktu, dan Cut-Off Alpa.<br>3. Klik **Simpan Parameter Waktu**. | Muncul pop-up konfirmasi detail rincian waktu baru. Setelah dikonfirmasi, parameter tersimpan dan banner hijau sukses muncul. | [ ] |
| **DASH-03** | Kontrol Sesi: Mulai Sesi | Klik tombol **Mulai Sesi Presensi**. | Muncul pop-up konfirmasi. Status sesi berubah menjadi aktif dan tombol berubah warna/indikator. | [ ] |
| **DASH-04** | Kontrol Sesi: Akhiri Sesi | Klik tombol **Akhiri Sesi Presensi**. | Muncul pop-up peringatan konfirmasi. Sesi berhenti dengan aman. | [ ] |
| **DASH-05** | Ekspor Rekap Excel Total | Klik tombol **Cetak Rekap Presensi Hari Ini (Excel)**. | Muncul pop-up konfirmasi. Setelah disetujui, file `.xlsx` otomatis terunduh berisi rekap kehadiran seluruh kelas hari ini. | [ ] |
| **DASH-06** | Reset Riwayat Presensi | Klik tombol **Hapus Riwayat Presensi Hari Ini**. | Muncul pop-up konfirmasi bahaya (merah). Setelah disetujui, seluruh record kehadiran hari ini terhapus dan metrik kembali 0. | [ ] |
| **DASH-07** | Live Feed Interaktif | Lakukan pemindaian kartu siswa (di Kios atau scanner input). | Item baru langsung muncul di bagian paling atas tabel Live Feed lengkap dengan nama, kelas, jam, badge status, dan status WA. | [ ] |

---

## 3. MODUL 2: Mode Kios Gerbang & Scanner Barcode

> Mode Kios diakses melalui tombol **Buka Kios Presensi** di pojok kanan atas atau URL `/kiosk`.

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **KIOS-01** | Tap Tepat Waktu (Sebelum Batas Waktu) | 1. Atur batas tepat waktu misal `07:00`.<br>2. Masukkan NISN siswa pada jam `06:30` (atau input manual NISN terdaftar lalu tekan Enter). | 🟢 Muncul banner hijau: *Presensi Berhasil (HADIR)*.<br>🔊 Suara *Success Beep* terdengar.<br>⏱️ Waktu respons tercatat `< 0.30 detik`. | [ ] |
| **KIOS-02** | Tap Terlambat (Melewati Batas Waktu) | 1. Atur batas tepat waktu lebih awal dari jam sekarang (misal jam sekarang 07:15, batas diatur 07:00).<br>2. Tap kartu siswa. | 🟡 Muncul banner peringatan: *Presensi Berhasil (TELAT)*.<br>Tercatat keterangan telat pada log.<br>🔊 Suara notifikasi terdengar. | [ ] |
| **KIOS-03** | Pencegahan Double-Tap | Tap kembali kartu siswa yang **sudah berhasil absen** pada hari yang sama. | 🟡 DITOLAK: Muncul banner kuning *Presensi Ganda (Double Tap)* dengan pesan bahwa siswa sudah tap hari ini.<br>🔊 Suara *Warning Beep* terdengar. Data tidak terduplikasi. | [ ] |
| **KIOS-04** | Kartu / NISN Tidak Terdaftar | Ketikkan nomor NISN sembarang (misal: `9999999999`) lalu tekan Enter. | 🔴 DITOLAK: Muncul banner merah *NISN Tidak Terdaftar*.<br>🔊 Suara *Error Beep* terdengar. Database tetap bersih. | [ ] |
| **KIOS-05** | Perangkat Barcode Scanner Fisik (1D Laser) | Colokkan scanner USB/Wireless, arahkan laser ke cetakan barcode kartu siswa. | Sistem otomatis menangkap *keystroke* scanner dan memproses absen tanpa perlu mengklik kotak input terlebih dahulu. | [ ] |
| **KIOS-06** | Keamanan Keluar Kios | Klik tombol **Keluar Kios (Power)** di pojok kanan atas. | Muncul modal konfirmasi keamanan PIN Admin. Kios tidak tertutup secara tidak sengaja oleh siswa. | [ ] |

---

## 4. MODUL 3: Manajemen Siswa & Generator Barcode (PNG/ZIP)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SISWA-01** | Pencarian & Filter Siswa | Ketikkan nama siswa, kelas, atau potongan NISN pada kolom pencarian. | Tabel data siswa langsung memfilter hasil secara instan (*real-time reactive*). | [ ] |
| **SISWA-02** | Tambah Siswa Manual | Klik **+ Tambah Siswa**, isi form (Nama, NISN, Kelas, No HP Ortu, Gender). | Muncul pop-up konfirmasi. Siswa baru berhasil disimpan dan muncul di daftar tabel. | [ ] |
| **SISWA-03** | Edit Siswa | Klik ikon pensil (Edit) pada baris salah satu siswa, ubah nama atau nomor WA. | Muncul pop-up konfirmasi. Data terupdate di database secara instan. | [ ] |
| **SISWA-04** | Hapus Siswa Satuan | Klik ikon tempat sampah (Hapus) pada siswa target. | Muncul pop-up konfirmasi peringatan. Siswa terhapus dari daftar. | [ ] |
| **SISWA-05** | Download Template Excel | Klik tombol **Unduh Template Excel**. | File `template_siswa_smp3.xlsx` berhasil terunduh dengan header kolom yang sesuai (`nisn`, `name`, `className`, `gender`, `parentWaNumber`, `address`). | [ ] |
| **SISWA-06** | Import Siswa Massal Excel | Klik **Import Data Siswa (Excel)**, pilih file Excel berisi daftar siswa. | Muncul pop-up konfirmasi file. Sistem mengimpor seluruh baris siswa sekaligus dan menampilkan jumlah data yang berhasil masuk. | [ ] |
| **SISWA-07** | Cetak Barcode Per Siswa (PNG) | Pada baris siswa, klik tombol **Cetak Barcode (PNG)**. | Muncul pop-up konfirmasi. File gambar **PNG** berhasil terunduh berisi: Kartu Siswa, Nama Lengkap, Kelas, NISN, dan Barcode tajam (bukan PDF). | [ ] |
| **SISWA-08** | Download Barcode Massal (ZIP) | Klik tombol **Unduh Semua Barcode (ZIP)**. | Muncul pop-up konfirmasi. File arsip `.zip` terunduh. Ketika diekstrak, isinya adalah kumpulan file gambar `.png` untuk seluruh siswa. | [ ] |
| **SISWA-09** | Hapus Siswa Per Kelas | Pilih kelas pada dropdown, lalu klik tombol **Hapus Siswa Kelas Ini**. | Muncul pop-up konfirmasi bahaya dengan nama kelas target. Hanya siswa pada kelas terpilih yang terhapus. | [ ] |
| **SISWA-10** | Hapus Semua Data Siswa | Klik tombol **Hapus Semua Siswa**. | Muncul pop-up konfirmasi dengan peringatan ganda. Seluruh data siswa terhapus bersih. | [ ] |

---

## 5. MODUL 4: Absensi Per Kelas & Dispensasi Khusus

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **KELAS-01** | Tab Navigasi Kelas | Buka menu **Absensi Perkelas** (`/kelas`). Klik tab kelas (misal 7A, 7B, 8A). | Menampilkan daftar siswa khusus kelas terpilih beserta status presensinya pada hari ini. | [ ] |
| **KELAS-02** | Edit Kehadiran Manual | Klik tombol **Edit** pada siswa yang berstatus 'Belum Masuk' atau 'Alpa'. Ubah status menjadi **SAKIT** atau **IZIN**. | Muncul pop-up konfirmasi. Status langsung terupdate dan warna badge berubah sesuai status baru. | [ ] |
| **KELAS-03** | Tetapkan Dispensasi Siswa | Klik tombol **Dispensasi**, masukkan catatan resmi (contoh: *"Mewakili Lomba FLS2N Tingkat Kabupaten"*). | Muncul pop-up konfirmasi. Status siswa berubah menjadi **DISPENSASI** lengkap dengan keterangan kegiatan. | [ ] |
| **KELAS-04** | Ekspor Rekap Excel Per Kelas | Klik tombol **Cetak Rekap Kelas (Excel)**. | Muncul pop-up konfirmasi. File Excel khusus kelas tersebut berhasil terunduh dengan rapi. | [ ] |

---

## 6. MODUL 5: Otomatisasi Cut-Off Alpa & Kasus Ekstrem

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TIME-01** | Otomatisasi Cut-Off Alpa | 1. Pastikan ada siswa yang belum absen.<br>2. Ubah parameter *Cut-Off Alpa* menjadi 1 menit lebih lambat dari jam sekarang, atau biarkan cron berjalan melewati jam cut-off.<br>3. Buka Dashboard. | Seluruh siswa yang belum tap secara otomatis berubah statusnya menjadi **ALPA** dengan catatan *"Otomatis oleh sistem (Batas Alpa terlewati)"*. Metrik Alpa bertambah. | [ ] |
| **TIME-02** | Kasus Absen Jam 05.30 (Sebelum Jam Masuk) | Simulasikan tap presensi sebelum jam masuk (misal jam 05.30, dengan batas tepat waktu jam 07.00). | Sistem menerima tap dengan sukses, mencatat waktu `05:30:xx WIB`, dan memberi status **`HADIR` (Tepat Waktu)**. | [ ] |
| **TIME-03** | Kasus Absen Jam 15.00 (Sore Hari Setelah Alpa) | Simulasikan tap kartu siswa pada jam 15.00 (di mana siswa tersebut sudah berstatus ALPA sejak jam 09.00 pagi). | Scanner menolak dengan notifikasi **Double-Tap / Sudah Terdata**. Status ALPA tidak tertimpa otomatis untuk mencegah pemalsuan kehadiran sore hari. | [ ] |
| **TIME-04** | Perubahan Status Siswa Alpa via Admin | Guru piket mengubah status siswa yang terlanjur Alpa (karena ada izin susulan) melalui menu Absensi Perkelas. | Status berhasil diubah oleh admin menjadi Izin/Hadir/Dispensasi dengan catatan keterangan resmi. | [ ] |

---

## 7. MODUL 6: Verifikasi Notifikasi WA (Mode Simulator)

> 💡 **Proteksi Kuota Fonnte:** Pengujian ini membuktikan alur notifikasi bekerja 100% tanpa mengirim paket ke API Fonnte internet.

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **WA-01** | Verifikasi Mode Simulator Aktif | Cek halaman Pengaturan bagian Fonnte. | Radio button terpilih pada **Simulator / Mock Log**. | [ ] |
| **WA-02** | Log Pengiriman Tap Presensi | Lakukan tap presensi pada siswa yang memiliki nomor HP orang tua. | Di terminal console backend muncul log pesan:<br>`[MOCK FONNTE] Kirim ke 08xxxxxxxxxx: [Isi template pesan presensi]`<br>Kecepatan tap di frontend tidak terganggu sama sekali. | [ ] |
| **WA-03** | Personalisasi Template Pesan | Ubah template pesan di Pengaturan, masukkan tag `{nama}`, `{kelas}`, `{status}`, `{jam}`, `{tanggal}`. Lakukan tap presensi. | Log terminal menampilkan pesan dengan seluruh variabel telah terisi data riil siswa secara presisi. | [ ] |
| **WA-04** | Form Uji Coba Simulasi WA | Di Pengaturan, masukkan nomor telepon tujuan dan pesan uji coba pada kotak *Uji Coba Kirim WhatsApp*, lalu klik kirim. | Pesan uji coba tercatat di log backend tanpa mengurangi kuota Fonnte asli. | [ ] |

---

## 8. MODUL 7: Pengaturan Sistem & 14 Titik Modal Konfirmasi

Verifikasi bahwa **seluruh 14 aksi krusial** berikut memicu pop-up konfirmasi interaktif sebelum aksi dieksekusi:

| ID Titik | Lokasi Menu | Tombol Aksi | Teks Konfirmasi Terbaca Jelas? | Status |
| :---: | :--- | :--- | :---: | :---: |
| **CONF-01** | Dashboard Utama | Tombol *Mulai Sesi Presensi* | ✅ Ya | [ ] |
| **CONF-02** | Dashboard Utama | Tombol *Akhiri Sesi Presensi* | ✅ Ya | [ ] |
| **CONF-03** | Dashboard Utama | Tombol *Simpan Parameter Waktu* | ✅ Ya | [ ] |
| **CONF-04** | Dashboard Utama | Tombol *Cetak Rekap Presensi Total (Excel)* | ✅ Ya | [ ] |
| **CONF-05** | Dashboard Utama | Tombol *Hapus Riwayat Presensi Hari Ini* | ✅ Ya | [ ] |
| **CONF-06** | Data Siswa | Tombol *Simpan Siswa Baru* | ✅ Ya | [ ] |
| **CONF-07** | Data Siswa | Tombol *Simpan Perubahan Siswa (Edit)* | ✅ Ya | [ ] |
| **CONF-08** | Data Siswa | Tombol *Hapus Siswa (Satuan)* | ✅ Ya | [ ] |
| **CONF-09** | Data Siswa | Tombol *Upload File Excel Siswa* | ✅ Ya | [ ] |
| **CONF-10** | Data Siswa | Tombol *Cetak Barcode Siswa (PNG)* | ✅ Ya | [ ] |
| **CONF-11** | Data Siswa | Tombol *Unduh Semua Barcode (ZIP)* | ✅ Ya | [ ] |
| **CONF-12** | Data Siswa | Tombol *Hapus Siswa Per Kelas* & *Hapus Semua Siswa* | ✅ Ya | [ ] |
| **CONF-13** | Absensi Perkelas | Tombol *Simpan Perubahan Kehadiran / Dispensasi* | ✅ Ya | [ ] |
| **CONF-14** | Pengaturan | Tombol *Simpan Pengaturan Profil* & *Simpan Token Fonnte* | ✅ Ya | [ ] |

---

## 9. MODUL 8: Responsivitas Tampilan (Mobile, Tablet & Desktop)

| ID Uji | Perangkat / Resolusi | Komponen yang Diuji | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| **RESP-01** | Desktop PC (>= 1280px) | Sidebar & Layout Grid | Sidebar statis di sisi kiri, kartu statistik 4 kolom, tabel proporsional tanpa terpotong. | [ ] |
| **RESP-02** | Tablet / iPad (768px - 1024px) | Transisi Navigasi & Tabel | Tata letak menyesuaikan 2-3 kolom, tabel dapat digeser horizontal dengan nyaman. | [ ] |
| **RESP-03** | Smartphone (<= 640px) | Drawer Sidebar Navigasi | Sidebar tersembunyi secara default. Tombol burger menu membuka drawer geser yang mulus dan menutup saat menu diklik. | [ ] |
| **RESP-04** | Smartphone (<= 640px) | Form Input & Modal Konfirmasi | Dialog modal konfirmasi pas di tengah layar HP dengan tombol Batal dan Konfirmasi yang mudah ditekan jari. | [ ] |
| **RESP-05** | Kalender & Tahun Ajaran | Dropdown & Datepicker | Tahun ajaran otomatis terpasang tahun berjalan (bukan tahun statis masa lalu). Kalender responsif. | [ ] |

---

## 10. Tabel Rekapitulasi Checklist UAT

Gunakan lembar ini sebagai checklist resmi sebelum melakukan instalasi/deploy ke server produksi:

```text
================================================================================
          LEMBAR REKAPITULASI UAT SSAS SMP NEGERI 3 JEMBER
================================================================================
Tanggal Pengujian : ...................................
Penguji (Tester)  : ...................................
Lingkungan Uji    : Localhost (Node.js & SQLite)

[ ] MODUL 1: Dashboard Utama & Monitoring Real-Time     (7 Skenario)
[ ] MODUL 2: Mode Kios Gerbang & Barcode Scanner         (6 Skenario)
[ ] MODUL 3: Manajemen Siswa & Generator Barcode         (10 Skenario)
[ ] MODUL 4: Absensi Per Kelas & Dispensasi Khusus       (4 Skenario)
[ ] MODUL 5: Otomatisasi Alpa & Waktu Ekstrem            (4 Skenario)
[ ] MODUL 6: Verifikasi Notifikasi WA (Mode Simulator)   (4 Skenario)
[ ] MODUL 7: Pengaturan Sistem & 14 Titik Pop-Up Modal   (14 Titik)
[ ] MODUL 8: Responsivitas Mobile, Tablet & Desktop      (5 Skenario)
--------------------------------------------------------------------------------
Total Skenario Diuji   : 54 Poin Pengujian
Status Kelayakan Deploy: [  ] SIAP DEPLOY (PASSED)    [  ] PERLU PERBAIKAN (FAILED)

Catatan Tambahan:
................................................................................
................................................................................
Tanda Tangan Penguji: ___________________________
================================================================================
```

---
*Dokumen ini disusun sebagai acuan standar jaminan mutu perangkat lunak (*Software Quality Assurance*) sebelum sistem presensi dioperasikan secara resmi di SMP Negeri 3 Jember.*
