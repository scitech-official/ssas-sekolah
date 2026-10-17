# 🏫 SSAS — Smart School Attendance System
### UPTD SMP Negeri 3 Jember
*Sistem Manajemen & Presensi Siswa Cerdas Terintegrasi Barcode Scanner, Notifikasi WhatsApp, dan Laporan Kedinasan Siap Cetak.*

---

## ⚡ Quick Start (Cara Menjalankan Cepat)

### 1. Prasyarat
* **Node.js** v18+ atau v20+ terpasang di komputer Anda.

### 2. Menjalankan Sistem
Dari folder utama project, buka terminal PowerShell/CMD dan jalankan:
```bash
npm run dev
```
* **Frontend UI:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)

### 3. Kredensial Akses Awal
* **Akun Admin:** `admin` / Password: `admin123`
* **PIN Keluar Kios Gerbang:** `123456`

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Web Speech API (TTS), Canvas Barcode.
* **Backend:** Node.js, Express.js, Prisma ORM, SQLite Database, Multer, Helmet, Express Rate Limit, node-cron.
* **Integrasi Eksternal:** WhatsApp Gateway via Fonnte API (mendukung Mode Simulator kuota gratis).
* **Perangkat Keras:** Scanner Barcode 1D / 2D USB (Keyboard Wedge HID).

---

## 📚 Indeks Dokumentasi Proyek

Untuk mempermudah pemeliharaan berkala oleh tim IT atau developer lanjutan, dokumen panduan teknis telah disusun secara rapi:

1. **[PANDUAN_MAINTENANCE_DAN_ARSITEKTUR.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/PANDUAN_MAINTENANCE_DAN_ARSITEKTUR.md)**: Panduan lengkap arsitektur, manajemen database SQLite, konfigurasi keamanan, dan integrasi perangkat keras.
2. **[PANDUAN_TESTING_SISTEM.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/PANDUAN_TESTING_SISTEM.md)**: Skenario pengujian fungsional seluruh modul sistem.
3. **[LAPORAN_BUG_DAN_HASIL_TESTING.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/LAPORAN_BUG_DAN_HASIL_TESTING.md)**: Riwayat pengujian, perbaikan bug (01, 02, 03), evaluasi role, dan fitur loading.
4. **[PANDUAN_AUDIT_KEAMANAN_DAN_CELAH_SISTEM.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/PANDUAN_AUDIT_KEAMANAN_DAN_CELAH_SISTEM.md)**: Rencana dan metodologi audit celah keamanan web (OWASP).
5. **[LAPORAN_AUDIT_KEAMANAN_DAN_CELAH_SISTEM.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/LAPORAN_AUDIT_KEAMANAN_DAN_CELAH_SISTEM.md)**: Hasil pengujian keamanan dan verifikasi perbaikan celah (Rate Limiting, PII Masking, Kiosk Anti-Spoofing, Helmet Headers).
6. **[REKOMENDASI_PENINGKATAN_PROFESIONALITAS_SISTEM.md](file:///d:/Bisnis/SciTech/Jasa%20Web/Web_Absensi_SMP3/REKOMENDASI_PENINGKATAN_PROFESIONALITAS_SISTEM.md)**: 6 pilar profesionalitas (Branding Logo SMPN 3 Jember, Dynamic Greeting, Analitik Donut & Peak Arrival, Kop Kedinasan Excel & PDF, Indonesian TTS Kiosk, dan Toast Notifications).

---

## 📜 Perintah Tersedia (*Available Scripts*)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan backend dan frontend secara bersamaan |
| `npm run dev:backend` | Menjalankan server backend saja (`http://localhost:5000`) |
| `npm run dev:frontend` | Menjalankan server frontend saja (`http://localhost:5173`) |
| `npm run studio` | Membuka Prisma Studio visual database di browser (`http://localhost:5555`) |
| `npm run seed` | Mereset dan mengisi ulang data awal database (Akun admin, siswa, libur) |
| `npm run build` | Melakukan build produksi untuk backend dan frontend |

---
*Supported by SCI Tech — Smart School Attendance System for SMP Negeri 3 Jember*
