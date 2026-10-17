Product Requirements Document (PRD)
Product Name: Smart School Attendance System (SSAS) Document Status: Draft / v1.0 Target Release: Phase 1 (MVP) Date: 14 Oktober 2026
1. Product Overview
1.1. Tujuan Produk
Membangun sistem absensi siswa berbasis web yang terintegrasi dengan pemindai barcode fisik (1D) dan notifikasi WhatsApp real-time. Sistem ini dirancang untuk menangani hingga 1.000 siswa, mengotomatiskan pencatatan kehadiran, meminimalisir kecurangan, dan memberikan transparansi langsung kepada orang tua wali terkait kedatangan siswa di sekolah.
1.2. Masalah yang Diselesaikan
•	Pencatatan absensi manual yang memakan waktu dan rentan human error.
•	Keterlambatan informasi kepada orang tua mengenai kehadiran atau ketidakhadiran anak.
•	Kesulitan rekapitulasi data kehadiran untuk laporan akhir semester/tahun.
2. Target Pengguna & Hak Akses
Peran	Deskripsi	Hak Akses Utama
Admin	Staf tata usaha / guru piket yang mengelola operasional absensi harian.	Full access (CRUD Data Siswa, Pengaturan Sistem, Edit Status Absensi, Manajemen Kalender, Akses Laporan).
Reguler	Guru kelas / staf yang hanya membutuhkan informasi data kehadiran.	Read-only access (Dashboard Utama, Dashboard Per Kelas).
Sistem (Backend)	Proses otomatis (Cron & Worker).	Menjalankan job Alpa otomatis, memproses antrean pesan WhatsApp.
3. Arsitektur & Tech Stack
•	Frontend: React.js (Di-deploy via Vercel).
•	Backend: Express.js (Di-deploy via Render untuk dukungan background task & cron jobs).
•	Database: PostgreSQL (Relational Database untuk reliabilitas data transaksi absensi).
•	Message Broker / Queue: Redis + Bull (Untuk mengelola antrean API WhatsApp agar tidak rate-limited).
•	3rd Party API: Fonnte WhatsApp API (Master/Free tier).
•	Hardware Input: Wireless 1D Barcode Scanner (Berfungsi sebagai Keyboard Emulator).
4. Functional Requirements (Kebutuhan Fungsional)
4.1. Modul Manajemen Data Siswa (Admin)
•	CRUD Data Siswa: Admin dapat menambah, mengedit, dan menghapus data siswa (Nama, NISN, Kelas, No. WA Orang Tua).
•	Import/Export Excel: Sistem menyediakan template Excel. Admin dapat mengunggah (upload) data massal yang otomatis memvalidasi duplikasi NISN, serta mengunduh data saat ini.
•	Barcode Generator: Sistem otomatis menghasilkan barcode (format JPG/PNG) berdasarkan NISN saat data siswa ditambahkan. Tersedia opsi cetak satuan atau massal (auto-zip).
4.2. Modul Operasional Absensi (Admin)
•	Global Event Listener: Halaman dashboard dilengkapi listener tersembunyi yang menangkap input barcode scanner tanpa memerlukan fokus kursor manual pada sebuah kolom input.
•	Pengaturan Waktu Fleksibel: Admin dapat menentukan parameter:
o	Jam Masuk: Waktu normal mulai absensi.
o	Batas Telat: Waktu di mana siswa terhitung "Terlambat".
o	Batas Alpa: Waktu pemotongan (cut-off) di mana sesi absensi ditutup.
•	Status Izin/Sakit: Form pop-up pada Dashboard Per Kelas bagi Admin untuk memasukkan status "Izin" atau "Sakit" beserta keterangan tambahan, yang dapat diinput sebelum atau sesudah "Batas Alpa" terlewati.
•	Kalender Akademik (Libur): Antarmuka pemilihan tanggal jamak (multi-date picker) untuk menandai hari libur (termasuk tanggal merah). Sistem tidak akan memicu absensi atau status Alpa pada tanggal yang ditandai libur.
4.3. Modul Otomatisasi & Notifikasi (Backend System)
•	Cron Job Alpa Harian: Tepat pada waktu Batas Alpa, sistem akan memindai seluruh data siswa aktif. Siswa yang belum memiliki log absensi hari itu (dan tidak ditandai Izin/Sakit) akan otomatis diubah statusnya menjadi "Alpa".
•	Antrean Pesan WhatsApp: Setiap tap absensi, input Izin/Sakit, atau eksekusi Alpa otomatis akan memicu pengiriman pesan ke nomor WA orang tua. Pesan dimasukkan ke dalam antrean (2-5 pesan/detik) untuk mencegah pemblokiran nomor Fonnte.
•	Template Pesan Kustom: Admin dapat mengubah format copywriting pesan WhatsApp melalui halaman Pengaturan (menyediakan variabel seperti [NAMA], [WAKTU], [STATUS]).
4.4. Modul Dashboard & Pelaporan
•	Dashboard Total (Admin & Reguler): Menampilkan metrik agregat seluruh sekolah dan per kelas (Total Hadir, Telat, Izin, Sakit, Alpa). Terdapat fitur ekspor ke Excel untuk laporan tahunan.
•	Dashboard Per Kelas (Admin & Reguler): Menampilkan tabel absensi spesifik siswa. Admin memiliki akses inline editing untuk mengoreksi status (mengantisipasi kecurangan tap kartu atau perubahan status perizinan mendadak).
4.5. Modul Keamanan & Pengaturan (Admin)
•	Otentikasi & Otorisasi: Sistem login standar untuk Admin. Akses langsung tanpa otentikasi untuk role Reguler (hanya view).
•	Manajemen PIN & Log: Penghapusan riwayat log absensi tahunan memerlukan verifikasi PIN khusus terpisah dari password login.
•	Pengaturan Koneksi Hardware: Indikator visual di antarmuka web untuk memastikan bahwa scanner telah diuji coba (test scan) sebelum sesi absensi harian dimulai.
5. Non-Functional Requirements (NFR)
•	Performance / Latency: Waktu respons dari tap barcode hingga data tersimpan dan tampil di layar Dashboard tidak boleh lebih dari 1.5 detik untuk memastikan kelancaran antrean fisik 1.000 siswa.
•	Reliability: Sistem antrean (message broker) harus memiliki mekanisme retry jika koneksi API Fonnte mengalami gangguan sementara (timeout).
•	Data Integrity: Mencegah terjadinya double tap (entri ganda). Jika siswa memindai kartu dua kali dalam rentang waktu yang sama di hari yang sama, sistem hanya menyimpan log pertama dan mengabaikan sisanya.