# 📘 BUKU PANDUAN PENGGUNAAN SISTEM (USER MANUAL)
## Smart School Attendance System (SSAS) — SMP Negeri 3 Jember
**Versi Dokumen:** v1.0.0 (Production Edition)  
**Institusi:** UPTD SMP Negeri 3 Jember  
**Alamat:** Jl. PB Sudirman No. 12, Jember, Jawa Timur  
**Penyusun:** Tim Pengembang Sistem (Supported by SCI Tech)  
**Tahun Ajaran:** 2026/2027  

---

## 📑 DAFTAR ISI

- [BAB I: PENDAHULUAN & PENGENALAN SISTEM](#bab-i-pendahuluan--pengenalan-sistem)
  - [1.1 Mengenal SSAS SMP Negeri 3 Jember](#11-mengenal-ssas-smp-negeri-3-jember)
  - [1.2 Hak Akses Pengguna (Portal Reguler vs Portal Admin)](#12-hak-akses-pengguna)
  - [1.3 Kebutuhan Perangkat Keras & Peramban](#13-kebutuhan-perangkat-keras--peramban)
  - [1.4 Daftar Pintasan Tombol Cepat Keyboard (Global Shortcuts)](#14-daftar-pintasan-tombol-cepat-keyboard)
  - [1.5 Skema Alur Presensi Harian Siswa](#15-skema-alur-presensi-harian-siswa)
- [BAB II: PORTAL UTAMA & MONITORING PRESENSI (USER REGULER)](#bab-ii-portal-utama--monitoring-presensi-user-reguler)
  - [2.1 Mengakses Dashboard Presensi Total](#21-mengakses-dashboard-presensi-total)
  - [2.2 Membaca Banner Status Sesi & Salam Dinamis](#22-membaca-banner-status-sesi--salam-dinamis)
  - [2.3 Memahami Diagram Donut Presensi & Grafik Jam Kedatangan Siswa](#23-memahami-diagram-donut-presensi--grafik-jam-kedatangan-siswa)
  - [2.4 Membaca Tabel Aktivitas Presensi Terkini](#24-membaca-tabel-aktivitas-presensi-terkini)
  - [2.5 Menggunakan Fitur Pencarian Cepat Siswa (Ctrl + K)](#25-menggunakan-fitur-pencarian-cepat-siswa-ctrl--k)
- [BAB III: OPERASIONAL GERBANG SEKOLAH (LIVE KIOSK MODE)](#bab-iii-operasional-gerbang-sekolah-live-kiosk-mode)
  - [3.1 Menjalankan Layar Penuh Kiosk Mode](#31-menjalankan-layar-penuh-kiosk-mode)
  - [3.2 Menghubungkan & Menggunakan Scanner Barcode USB](#32-menghubungkan--menggunakan-scanner-barcode-usb)
  - [3.3 Indikator & Respon Pemindaian (Suara TTS Bahasa Indonesia)](#33-indikator--respon-pemindaian-suara-tts-bahasa-indonesia)
  - [3.4 Pengaturan Suara (Mute/Unmute) & Layar Penuh (F11 Helper)](#34-pengaturan-suara-muteunmute--layar-penuh-f11-helper)
  - [3.5 Mengakhiri Sesi Kiosk dengan Verifikasi PIN Admin 6-Digit](#35-mengakhiri-sesi-kiosk-dengan-verifikasi-pin-admin-6-digit)
- [BAB IV: REKAPITULASI & CETAK DOKUMEN PER KELAS](#bab-iv-rekapitulasi--cetak-dokumen-per-kelas)
  - [4.1 Navigasi Rombongan Belajar (Rombel Kelas 7, 8, dan 9)](#41-navigasi-rombongan-belajar-rombel)
  - [4.2 Mengubah Status Presensi Siswa Secara Manual (Admin)](#42-mengubah-status-presensi-siswa-secara-manual-admin)
  - [4.3 Mengunduh Berkas Rekapitulasi Excel (.xlsx) Ber-Kop Surat Resmi](#43-mengunduh-berkas-rekapitulasi-excel-xlsx-ber-kop-surat-resmi)
  - [4.4 Mencetak Rapor Presensi Siswa Format PDF (Landscape Siap Cetak)](#44-mencetak-rapor-presensi-siswa-format-pdf)
- [BAB V: PENGELOLAAN DATA SISWA & KARTU BARCODE (ADMIN)](#bab-v-pengelolaan-data-siswa--kartu-barcode-admin)
  - [5.1 Masuk ke Sistem (Login Petugas Admin)](#51-masuk-ke-sistem-login-petugas-admin)
  - [5.2 Menambahkan Siswa Baru Secara Manual](#52-menambahkan-siswa-baru-secara-manual)
  - [5.3 Mengimpor Data Siswa Secara Masal Menggunakan File Excel](#53-mengimpor-data-siswa-secara-masal-menggunakan-file-excel)
  - [5.4 Mencetak Kartu Pelajar Barcode Satuan & Unduh Masal Format ZIP](#54-mencetak-kartu-pelajar-barcode-satuan--unduh-masal-format-zip)
  - [5.5 Menghapus Data Siswa (Satuan & Per Rombel)](#55-menghapus-data-siswa)
- [BAB VI: PENGATURAN SISTEM & KEAMANAN (ADMIN)](#bab-vi-pengaturan-sistem--keamanan-admin)
  - [6.1 Menyesuaikan Parameter Jam Masuk, Telat, dan Cut-Off Alpa](#61-menyesuaikan-parameter-jam-operasional)
  - [6.2 Mengatur Format Pesan Notifikasi WhatsApp Orang Tua](#62-mengatur-format-pesan-notifikasi-whatsapp-orang-tua)
  - [6.3 Memantau Status Kuota & Antrean WhatsApp Gateway (Fonnte API)](#63-memantau-status-kuota--antrean-whatsapp-gateway-fonnte-api)
  - [6.4 Mengubah Password Akun Admin dan PIN Kios 6-Digit](#64-mengubah-password-akun-admin-dan-pin-kios-6-digit)
  - [6.5 Prosedur Tutup Buku / Reset Riwayat Presensi Tahunan](#65-prosedur-tutup-buku--reset-riwayat-presensi-tahunan)
- [BAB VII: PANDUAN PENANGANAN MASALAH (TROUBLESHOOTING & FAQ)](#bab-vii-panduan-penanganan-masalah-troubleshooting--faq)
- [LAMPIRAN I: GLOSARIUM & DAFTAR ISTILAH TEKNIS](#lampiran-i-glosarium--daftar-istilah-teknis)
- [LEMBAR PENGESAHAN DOKUMEN](#lembar-pengesahan-dokumen)

---

# BAB I: PENDAHULUAN & PENGENALAN SISTEM

### 1.1 Mengenal SSAS SMP Negeri 3 Jember
**Smart School Attendance System (SSAS)** adalah aplikasi presensi digital terpadu berbasis pemindaian barcode yang dirancang khusus untuk memenuhi kebutuhan operasional UPTD SMP Negeri 3 Jember. 

Sistem ini mengotomatiskan pencatatan kehadiran siswa di gerbang sekolah, mendeteksi keterlambatan secara *real-time*, menyiarkan notifikasi presensi otomatis kepada orang tua melalui WhatsApp Gateway, serta menghasilkan laporan presensi berstandar kedinasan lengkap dengan Kop Surat Resmi Dinas Pendidikan Kabupaten Jember.

Aplikasi ini dibangun dengan arsitektur web modern yang responsif, berkecepatan tinggi, dan dapat dioperasikan secara lokal (Offline LAN) maupun daring (Online Cloud).

---

### 1.2 Hak Akses Pengguna
Aplikasi ini membagi hak akses ke dalam dua tingkatan utama demi menjaga integritas data dan keamanan operasional sekolah:

1. **Portal Reguler (Akses Publik / Guru Piket):**
   * Dapat diakses langsung tanpa memerlukan proses masuk (*login*).
   * Digunakan untuk melihat monitoring kehadiran harian secara *live*, memantau statistik per kelas, mencari data kelas siswa, serta mencetak laporan presensi.
   * **Fitur Perlindungan Privasi (PII Masking):** Nomor WhatsApp pribadi wali murid secara otomatis disamarkan (contoh: `62812****432`) untuk mencegah penyalahgunaan kontak.

2. **Portal Administrator (Akses Khusus Admin Sekolah):**
   * Memerlukan autentikasi Username dan Password Admin yang sah.
   * Memiliki kendali penuh untuk:
     * Membuka dan mengoperasikan sesi *Live Kiosk* pemindaian gerbang sekolah.
     * Mengelola data master siswa (Tambah, Edit, Hapus, dan Impor Excel).
     * Mencetak kartu barcode pelajar (satuan maupun unduh massal format ZIP).
     * Melakukan koreksi status kehadiran manual siswa (Hadir, Izin, Sakit, Alpa).
     * Mengubah konfigurasi jam masuk, batas telat, pesan notifikasi WhatsApp, serta mengganti kata sandi dan PIN Kios keamanan.

---

### 1.3 Kebutuhan Perangkat Keras & Peramban
Untuk menjamin kelancaran pemindaian kartu di gerbang sekolah tanpa jeda antrean, spesifikasi perangkat yang disarankan adalah sebagai berikut:

* **Komputer / Laptop Gerbang:**
  * Prosesor: Minimal Intel Core i3 / AMD Ryzen 3 atau setara.
  * Memori (RAM): Minimal 4 GB DDR4.
  * Penyimpanan: SSD dengan ruang kosong minimal 5 GB.
  * Sistem Operasi: Microsoft Windows 10 atau Windows 11 (64-bit).
* **Perangkat Pemindai Barcode:**
  * Barcode Scanner 1D Laser atau 2D Image Scanner dengan koneksi USB.
  * Mode Operasi: *Keyboard Wedge (HID)*, yaitu scanner langsung mengirimkan teks NISN diikuti tombol `Enter` secara otomatis tanpa perlu driver tambahan.
* **Peramban Web (Browser):**
  * Google Chrome versi terbaru (Sangat direkomendasikan).
  * Microsoft Edge versi terbaru.
* **Koneksi Jaringan:**
  * Jaringan Lokal (LAN Kabel / WiFi Sekolah) berkecepatan stabil minimal 10 Mbps.
  * Akses Internet aktif jika fitur kirim pesan WhatsApp Gateway (Fonnte API) difungsikan ke ponsel orang tua secara *real-time*.

---

### 1.4 Daftar Pintasan Tombol Cepat Keyboard
Sistem menyediakan sejumlah tombol pintas (*global keyboard shortcuts*) untuk mempercepat navigasi petugas sekolah:

| Tombol Pintas | Fungsi Operasional | Lokasi Berlaku |
| :---: | :--- | :--- |
| **`F2`** | Membuka layar Live Kiosk Presensi Gerbang secara langsung | Seluruh Halaman |
| **`Ctrl + K`** | Membuka jendela pencarian cepat siswa (Cari nama/NISN) | Seluruh Halaman |
| **`Esc`** | Menutup jendela pop-up / modal yang sedang aktif | Seluruh Jendela Pop-up |
| **`F11`** | Mengaktifkan / menonaktifkan mode layar penuh (*Fullscreen*) browser | Kiosk Mode Gerbang |

---

### 1.5 Skema Alur Presensi Harian Siswa
Berikut adalah diagram alur kerja presensi siswa dari kedatangan di gerbang hingga pelaporan:

```
[ Siswa Tiba di Gerbang ]
           │
           ▼
[ Scan Kartu Barcode pada Scanner USB ]
           │
     ┌─────┴───────────────────────┐
     ▼                             ▼
[ Terdaftar di Database ]     [ Tidak Terdaftar ]
     │                             │
     │                             ▼
     │                      [ Layar Kiosk Merah: Siswa Tidak Ditemukan ]
     ▼
[ Verifikasi Waktu Pemindaian ]
     │
     ├─── Pukul 06.00 – 07.00 WIB ──► [ Status: HADIR TEPAT WAKTU (Hijau) ]
     │                                🔊 "Terima kasih, [Nama]. Selamat belajar!"
     │
     └─── Pukul > 07.00 WIB ────────► [ Status: TERLAMBAT (Kuning) ]
                                      🔊 "Mohon maaf, [Nama], Anda tercatat terlambat."
           │
           ▼
[ Notifikasi WhatsApp Otomatis Terkirim ke Orang Tua ]
           │
           ▼
[ Dashboard & Rekapitulasi Kelas Terbarui Real-Time ]
```

---

# BAB II: PORTAL UTAMA & MONITORING PRESENSI (USER REGULER)

### 2.1 Mengakses Dashboard Presensi Total
1. Pastikan server aplikasi telah dijalankan oleh petugas IT.
2. Buka peramban Google Chrome, kemudian masukkan alamat web aplikasi pada bilah alamat (*address bar*):
   > **`http://localhost:5173`** (atau alamat IP lokal server yang telah ditentukan pihak sekolah).
3. Halaman utama **Absensi Total** akan ditampilkan secara otomatis.

[gambar ss bagian Dashboard Utama & Banner Salam Dinamis]

---

### 2.2 Membaca Banner Status Sesi & Salam Dinamis
Pada bagian paling atas dashboard, terdapat banner utama interaktif yang menampilkan logo resmi SMP Negeri 3 Jember beserta salam kontekstual yang menyesuaikan waktu operasional:

* **Pukul 06.00 – 07.00 WIB:** *"Selamat Pagi, Petugas Piket • Gerbang Masuk Dibuka"*
* **Pukul 07.00 – 12.00 WIB:** *"Sesi Kegiatan Belajar Mengajar Berlangsung"*
* **Pukul 12.00 WIB ke atas:** *"Rekapitulasi Kehadiran Hari Ini Selesai"*

Tepat di bawah banner salam, tersedia 4 kartu indikator angka utama (*Key Performance Indicators*):
* **Total Siswa Terdaftar:** Menampilkan jumlah total seluruh peserta didik aktif di sekolah.
* **Hadir Tepat Waktu (Hijau):** Jumlah siswa yang memindai kartu sebelum jam batas keterlambatan.
* **Terlambat (Kuning):** Jumlah siswa yang hadir setelah batas jam 07.00 WIB.
* **Belum Hadir / Alpa (Merah):** Jumlah siswa yang belum melakukan pemindaian kartu hari ini.

---

### 2.3 Memahami Diagram Donut Presensi & Grafik Jam Kedatangan Siswa
Dashboard dilengkapi dengan dua komponen analitik visual modern untuk membantu guru piket dan kepala sekolah membaca pola kedatangan siswa secara cepat:

[gambar ss bagian Grafik Donut Presensi dan Area Peak Arrival Chart]

1. **Diagram Donut Distribusi Presensi:**
   * Menunjukkan persentase proporsi kehadiran hari ini antara **Hadir Tepat (Hijau)**, **Terlambat (Kuning)**, **Izin/Sakit (Biru)**, dan **Alpa (Merah)**.
   * Guru piket dapat mengarahkan kursor (*hover*) pada irisan diagram untuk melihat rincian jumlah pastinya.

2. **Grafik Kurva Jam Puncak Kedatangan (*Peak Arrival Curve Chart*):**
   * Berupa grafik area bergelombang halus yang memetakan lonjakan kedatangan siswa berdasarkan interval 15 menit:
     * `06.00 – 06.15 WIB` : Kelompok siswa yang datang lebih awal.
     * `06.15 – 06.30 WIB` : Arus kedatangan normal.
     * `06.30 – 06.45 WIB` : Arus kedatangan puncak.
     * `06.45 – 07.00 WIB` : Arus menit-menit menjelang bel masuk berbunyi.
     * `> 07.00 WIB` : Kelompok siswa yang terlambat.

---

### 2.4 Membaca Tabel Aktivitas Presensi Terkini
Pada bagian bawah grafik, terdapat tabel **Presensi Terkini (*Recent Activity Feed*)** yang menampilkan 10 pemindaian kartu terakhir secara langsung:

[gambar ss bagian Tabel Rekapitulasi Presensi Terkini di Dashboard]

* Setiap kali seorang siswa memindai kartu di gerbang, baris baru akan langsung muncul di baris teratas tabel tanpa perlu memuat ulang (*refresh*) halaman.
* Kolom tabel mencakup: Waktu Tap (Jam:Menit:Detik), Nama Siswa, NISN, Kelas/Rombel, dan Label Status Kehadiran berwarna.

---

### 2.5 Menggunakan Fitur Pencarian Cepat Siswa (`Ctrl + K`)
Untuk mencari informasi seorang siswa tanpa harus membuka data per kelas satu per satu:
1. Tekan kombinasi tombol **`Ctrl + K`** pada keyboard, atau klik kotak pencarian bertuliskan **"Cari Siswa..."** di navbar atas.

[gambar ss bagian Modal Pencarian Cepat Siswa Ctrl K]

2. Ketik nama siswa atau minimal 3 digit nomor NISN.
3. Hasil pencarian akan muncul seketika menampilkan nama, NISN, kelas, dan status kehadiran hari ini.
4. Klik pada nama siswa yang diinginkan atau tekan tombol **`Enter`** untuk langsung diarahkan ke tabel absensi kelas siswa tersebut.
5. Tekan tombol **`Esc`** untuk menutup jendela pencarian.

---

# BAB III: OPERASIONAL GERBANG SEKOLAH (LIVE KIOSK MODE)

### 3.1 Menjalankan Layar Penuh Kiosk Mode
*Mode ini dirancang khusus untuk komputer/layar pos satpam di pintu gerbang utama tempat siswa memindai kartu pelajar secara mandiri.*

1. Pastikan Anda telah masuk sebagai **Admin** (klik tombol **Login Petugas** di sudut kanan atas).
2. Pada menu bilah samping (*sidebar*), klik menu **Live Kiosk Absensi** (atau tekan tombol pintas **`F2`**).
3. Layar akan langsung berganti menjadi mode terminal berlatar belakang gelap dengan tampilan jam digital besar berdetak presisi, logo sekolah, dan target pemindaian barcode beranimasi laser hijau siaga.

[gambar ss bagian Layar Penuh Kiosk Mode Gerbang]

---

### 3.2 Menghubungkan & Menggunakan Scanner Barcode USB
1. Hubungkan kabel USB pemindai barcode ke salah satu port USB komputer.
2. Tunggu beberapa detik hingga sistem operasi mendeteksi perangkat (lampu scanner menyala).
3. **Penting:** Petugas gerbang **tidak perlu mengarahkan mouse atau mengklik kotak teks apa pun**. Sistem memiliki pendengar ketukan (*Keyboard Wedge Listener*) otomatis di latar belakang yang selalu siaga menangkap data pemindaian.
4. Siswa cukup mendekatkan kode barcode kartu pelajarnya di depan sinar pemindai dengan jarak sekitar 5 – 10 cm.
5. Scanner akan berbunyi *bip* satu kali dan data langsung diproses dalam waktu kurang dari 0,5 detik.

---

### 3.3 Indikator & Respon Pemindaian (Suara TTS Bahasa Indonesia)
Setiap kali kartu dipindai, layar Kiosk akan memunculkan kartu informasi visual berukuran besar dan mengeluarkan suara ucapan sambutan otomatis (*Indonesian Text-to-Speech*):

| Kondisi Pemindaian | Warna & Indikator Layar | Respon Suara Sambutan Otomatis |
| :--- | :--- | :--- |
| **Hadir Tepat Waktu** | 🟢 **Kartu Hijau:** Menampilkan Foto/Inisial, Nama Lengkap, NISN, Kelas, dan Jam Masuk Presisi | 🔊 *"Terima kasih, [Nama Siswa]. Selamat belajar!"* |
| **Terlambat** | 🟡 **Kartu Kuning/Amber:** Menampilkan label peringatan keterlambatan | 🔊 *"Mohon maaf, [Nama Siswa], Anda tercatat terlambat."* |
| **Pemindaian Ganda (*Double Tap*)** | 🟠 **Kartu Oranye:** Peringatan kartu sudah ditap sebelumnya hari ini | 🔊 *"Kartu sudah dipindai hari ini."* |
| **Siswa Ditandai ALPA** | 🔴 **Kartu Merah Peringatan:** Siswa datang setelah jam cut-off alpa | 🔊 Nada peringatan: *"Status Anda alpa, silakan lapor ke Guru Piket"* |
| **Kartu Tidak Dikenal** | 🔴 **Kartu Merah (*Not Found*):** Nomor barcode tidak cocok dengan database sekolah | 🔊 Nada peringatan: *"Siswa tidak ditemukan di database"* |

---

### 3.4 Pengaturan Suara (Mute/Unmute) & Layar Penuh (F11 Helper)
Pada sudut kanan atas bilah kontrol Kiosk, tersedia dua tombol bantuan operasional:

[gambar ss bagian Tombol Kontrol Suara dan Fullscreen Kiosk]

* **Tombol Suara (Speaker):** Klik untuk membisukan (*Mute*) atau mengaktifkan kembali (*Unmute*) suara sambutan otomatis. Sangat berguna jika di sekitar pos gerbang sedang berlangsung upacara bendera atau kegiatan yang membutuhkan ketenangan.
* **Tombol Layar Penuh (*Fullscreen*):** Klik untuk menyembunyikan bilah alamat (*address bar*) browser dan taskbar Windows sehingga monitor gerbang tampil bersih layaknya anjungan mesin mandiri profesional. Tekan tombol **`F11`** pada keyboard untuk keluar/masuk layar penuh kapan saja.

---

### 3.5 Mengakhiri Sesi Kiosk dengan Verifikasi PIN Admin 6-Digit
Untuk mencegah peserta didik atau pihak yang tidak berwenang keluar dari mode kios dan mengacak-acak sistem komputer:

1. Klik tombol merah **AKHIRI SESI** di sudut kanan atas layar Kiosk.
2. Jendela modal otorisasi keamanan akan muncul meminta **6 Digit PIN Otoritas Admin**.

[gambar ss bagian Modal Input PIN Otoritas Admin Keluar Kios]

3. Ketikkan 6 angka PIN Admin yang sah (PIN bawaan default: `123456`), lalu klik tombol **Verifikasi & Keluar**.
4. Jika PIN yang dimasukkan benar, sesi kios akan tertutup dan layar otomatis kembali ke Dashboard.
5. **Proteksi Keamanan Anti-Brute-Force:** Jika PIN salah dimasukkan lebih dari 5 kali berturut-turut, sistem otomatis mengunci akses otorisasi selama 5 menit untuk melindungi sistem dari upaya penerobosan paksa.

---

# BAB IV: REKAPITULASI & CETAK DOKUMEN PER KELAS

### 4.1 Navigasi Rombongan Belajar (Rombel)
Sistem membagi data presensi ke dalam tingkatan kelas dan rombongan belajar resmi:
1. Buka menu **Absensi Perkelas** pada bilah samping (*sidebar*).
2. Tentukan kelas yang ingin dipantau menggunakan pemilih tombol di bagian atas:
   * **Pilih Tingkat:** Klik tombol `Kelas 7`, `Kelas 8`, atau `Kelas 9`.
   * **Pilih Rombel:** Klik salah satu abjad rombel `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, atau `I`.
3. Tabel data kehadiran seluruh siswa di rombel terpilih akan langsung disajikan secara lengkap.

[gambar ss bagian Navigasi Pemilih Tingkat dan Rombel Kelas]

[gambar ss bagian Tabel Presensi Kelas dengan Filter Tanggal]

---

### 4.2 Mengubah Status Presensi Siswa Secara Manual (Admin)
Jika ada siswa yang lupa membawa kartu barcode, izin mengikuti lomba, atau sakit dengan surat dokter terlampir:
1. Pastikan Anda telah masuk sebagai **Admin**.
2. Pada tabel kehadiran siswa kelas tersebut, klik tombol **Koreksi / Edit** (ikon pensil biru) pada baris siswa yang dituju.

[gambar ss bagian Modal Koreksi Status Kehadiran Siswa]

3. Pilih status baru yang sesuai: **HADIR**, **TERLAMBAT**, **IZIN**, **SAKIT**, atau **ALPA**.
4. Masukkan keterangan atau alasan pada kolom catatan (contoh: *"Surat dokter terlampir tertanggal 16 Oktober 2026"* atau *"Dispensasi Lomba Sains Nasional"*).
5. Klik tombol **Simpan Perubahan**. Data kehadiran dan ringkasan angka di kelas tersebut akan seketika terbarui.

---

### 4.3 Mengunduh Berkas Rekapitulasi Excel (.xlsx) Ber-Kop Surat Resmi
Fitur ini digunakan saat guru piket atau staf tata usaha ingin merekapitulasi kehadiran siswa ke dalam berkas Microsoft Excel:
1. Pada halaman Absensi Perkelas, klik tombol hijau bertuliskan **Unduh Excel (.xlsx)**.
2. Jendela pop-up pemilihan rentang tanggal akan terbuka:

[gambar ss bagian Modal Opsi Rentang Tanggal Ekspor Excel]

   * **Opsi 1 — Hari Ini Saja:** Mengunduh presensi tanggal aktif saat ini.
   * **Opsi 2 — Rentang Tanggal Khusus:** Memungkinkan Anda memilih `Tanggal Mulai` dan `Tanggal Akhir` (Sangat cocok untuk rekapitulasi mingguan, bulanan, atau tengah semester).
   * **Opsi 3 — Semua Tanggal:** Mengunduh seluruh riwayat presensi siswa sejak awal tahun ajaran.
3. Klik tombol **Unduh File Excel**.
4. Berkas Excel yang terunduh telah dilengkapi secara otomatis dengan:
   * **5 Baris Kop Surat Resmi:** Dinas Pendidikan Kabupaten Jember & UPTD SMP Negeri 3 Jember.
   * Garis pemisah ganda kop surat standar kedinasan.
   * Tabel kehadiran bergaris rapi (*cell borders*) dengan warna status yang jelas.
   * **Blok Tanda Tangan Pengesahan:** Kolom mengetahui Kepala Sekolah dan Guru Piket di sudut kanan bawah dokumen.

[gambar ss bagian Lembar Hasil Ekspor Excel Ber-Kop Surat]

---

### 4.4 Mencetak Rapor Presensi Siswa Format PDF
Fitur ini digunakan untuk mencetak lembar rekapitulasi siap bagi saat pembagian rapor berkala atau rapat pleno wali murid:
1. Klik tombol biru **Cetak Rapor Presensi (PDF)** di samping tombol unduh Excel.
2. Jendela pratinjau (*Print Preview*) akan muncul menampilkan tata letak dokumen berorientasi mendatar (*Landscape*).

[gambar ss bagian Modal Pratinjau Cetak Rapor PDF]

3. Dokumen memuat: Logo SMP Negeri 3 Jember, Kop Dinas, Keterangan Rombel, Tabel Kehadiran lengkap dengan persentase kehadiran, serta kolom tanda tangan basah Wali Kelas dan Kepala Sekolah.
4. Klik tombol **Cetak / Simpan PDF** di sudut kanan atas modal pratinjau.
5. Kotak dialog cetak Google Chrome akan muncul. Anda dapat langsung memilih printer fisik, atau memilih opsi **"Save as PDF"** untuk menyimpannya sebagai arsip digital.

---

# BAB V: PENGELOLAAN DATA SISWA & KARTU BARCODE (ADMIN)

### 5.1 Masuk ke Sistem (Login Petugas Admin)
1. Klik tombol **Login Petugas** berwarna biru di navbar sudut kanan atas.
2. Masukkan kredensial administrator:
   * **Username:** `admin`
   * **Password:** `admin123` (atau kata sandi baru yang telah Anda atur).
3. Anda dapat mengklik **ikon mata** pada kotak input kata sandi untuk menampilkan atau menyembunyikan karakter sandi yang Anda ketik.

[gambar ss bagian Pop-up Form Login Petugas Admin]

4. Klik tombol **Masuk ke Sistem**. Notifikasi Toast hijau akan muncul mengonfirmasi bahwa login berhasil, dan menu administrasi khusus (Data Siswa dan Pengaturan) akan otomatis terbuka di bilah samping.

---

### 5.2 Menambahkan Siswa Baru Secara Manual
1. Klik menu **Data Siswa** pada navigasi samping.
2. Klik tombol hijau **+ Tambah Siswa Baru** di pojok kanan atas tabel.

[gambar ss bagian Form Tambah Siswa Baru]

3. Lengkapi formulir pendaftaran:
   * **NISN:** Masukkan 10 digit Nomor Induk Siswa Nasional (harus unik dan tidak boleh ganda).
   * **Nama Lengkap:** Masukkan nama lengkap siswa sesuai dokumen akta kelahiran / ijazah SD.
   * **Kelas / Rombel:** Pilih rombel siswa (contoh: `7-A`, `8-C`, atau `9-I`).
   * **No. WhatsApp Wali Murid:** Masukkan nomor ponsel aktif orang tua diawali dengan `08` atau `628` (contoh: `081234567890`).
4. Klik tombol **Simpan Data**. Siswa baru akan langsung terdaftar di sistem.

---

### 5.3 Mengimpor Data Siswa Secara Masal Menggunakan File Excel
Jika sekolah memasukkan ratusan siswa baru sekaligus pada saat Penerimaan Peserta Didik Baru (PPDB):
1. Buka halaman **Data Siswa**, lalu klik tombol biru **Unggah File Excel**.
2. Jika Anda belum memiliki format tabel yang baku, klik tautan bertuliskan **"Unduh Template Excel Di Sini"**.

[gambar ss bagian Modal Unggah Berkas Excel Siswa]

3. Buka file template yang baru saja diunduh di Microsoft Excel, lalu isi data siswa dengan kolom:
   * Kolom A: `NISN`
   * Kolom B: `Nama Siswa`
   * Kolom C: `Kelas`
   * Kolom D: `No WA Orang Tua`
4. Simpan berkas Excel Anda (`.xlsx` atau `.xls`).
5. Seret (*drag-and-drop*) berkas Excel ke dalam kotak pengunggahan, kemudian klik tombol **Proses Impor Siswa**.
6. Sistem akan memvalidasi data dan menyimpannya secara massal. Data NISN yang sudah ada di database akan dilewati secara otomatis tanpa menimbulkan galat (*error*).

---

### 5.4 Mencetak Kartu Pelajar Barcode Satuan & Unduh Masal Format ZIP
Sistem menghasilkan kartu pelajar digital berbarcode secara otomatis untuk setiap siswa terdaftar:

[gambar ss bagian Tabel Manajemen Data Siswa Terdaftar]

* **Mencetak Kartu Pelajar Satuan:**
  1. Cari nama siswa pada tabel Data Siswa.
  2. Klik ikon barcode atau tombol **Lihat Kartu**.
  3. Desain resmi kartu pelajar SMP Negeri 3 Jember akan tampil lengkap dengan logo sekolah, nama, NISN, rombel, dan barcode batang Code-128 berkualitas tinggi.

[gambar ss bagian Pratinjau Desain Kartu Pelajar Barcode Siswa]

  4. Klik tombol **Unduh PNG** untuk menyimpan gambar kartu dalam resolusi tinggi, siap dicetak pada blanko kartu PVC atau kertas foto.

* **Mengunduh Kartu Pelajar Massal Per Kelas (.ZIP):**
  1. Terapkan filter kelas pada tabel (misalnya pilih `Kelas 7-A`).
  2. Klik tombol oranye **Unduh Semua Barcode (ZIP)** di bagian atas tabel.
  3. Seluruh barcode siswa di kelas tersebut akan dikemas ke dalam satu file arsip zip terkompresi dan otomatis terunduh ke komputer Anda.

---

### 5.5 Menghapus Data Siswa
* **Hapus Siswa Satuan:** Klik ikon tempat sampah merah pada baris siswa yang ingin dihapus, lalu klik tombol konfirmasi persetujuan.
* **Hapus Siswa Massal Per Rombel:** Buka tab rombel siswa yang telah lulus, klik tombol opsi hapus rombel, lalu masukkan PIN Admin untuk menyetujui pembersihan.

---

# BAB VI: PENGATURAN SISTEM & KEAMANAN (ADMIN)

### 6.1 Menyesuaikan Parameter Jam Operasional
Buka menu **Pengaturan** pada bilah samping untuk mengatur jadwal jam sekolah:

[gambar ss bagian Form Pengaturan Jam Operasional Sekolah]

1. **Jam Buka Gerbang (*Time Start*):** Waktu dimulainya penerimaan presensi kartu di gerbang (standar: `06:00:00 WIB`). Pemindaian sebelum jam ini akan ditolak.
2. **Batas Tepat Waktu (*Time Late*):** Batas waktu toleransi keterlambatan (standar: `07:00:00 WIB`). Pemindaian tepat atau sebelum jam ini berstatus **HADIR TEPAT WAKTU**, sedangkan pemindaian setelah jam ini berstatus **TERLAMBAT**.
3. **Batas Akhir / Cut-Off Alpa (*Time Alpa*):** Batas toleransi akhir presensi gerbang (standar: `08:00:00 WIB`). Pada jam ini, sistem latar belakang (*Cron Job*) otomatis menandai seluruh siswa yang belum hadir sebagai **ALPA**.
4. Klik tombol hijau **Simpan Konfigurasi Jam**.

---

### 6.2 Mengatur Format Pesan Notifikasi WhatsApp Orang Tua
Sistem dapat mempersonalisasi pesan WhatsApp yang dikirimkan ke wali murid:
1. Pada menu Pengaturan, gulir ke panel **Template Notifikasi WhatsApp**.

[gambar ss bagian Form Template Notifikasi WhatsApp]

2. Anda dapat memanfaatkan tag variabel dinamis berikut yang akan digantikan otomatis oleh sistem:
   * `{nama}` : Nama lengkap peserta didik.
   * `{kelas}` : Kelas dan rombel siswa.
   * `{status}` : Status kehadiran (Hadir Tepat Waktu / Terlambat / Alpa).
   * `{jam}` : Jam pemindaian kartu di gerbang.
   * `{tanggal}` : Tanggal pelaksanaan presensi.
   * `{catatan}` : Keterangan tambahan atau catatan dispensasi.
3. Contoh susunan pesan standar kedinasan:
   > *"Yth. Orang Tua/Wali dari {nama} ({kelas}), kami informasikan bahwa ananda telah hadir di SMP Negeri 3 Jember pada pukul {jam} WIB ({status}). Terima kasih."*
4. Klik tombol **Simpan Format Pesan**.

---

### 6.3 Memantau Status Kuota & Antrean WhatsApp Gateway (Fonnte API)
Pada panel pemantauan WhatsApp, admin dapat memeriksa kesiapan transmisi pesan keluar:

[gambar ss bagian Widget Monitoring Kuota WhatsApp Fonnte]

* **Status Token API:** Menampilkan indikator hijau `TERHUBUNG` jika token Fonnte aktif dan valid.
* **Pesan Sukses Terkirim Hari Ini:** Menghitung total pesan yang sukses diterima server WhatsApp orang tua.
* **Pesan Mengantre / Gagal:** Menampilkan jumlah pesan yang tertahan (misal akibat koneksi internet terputus atau nomor orang tua tidak terdaftar di WhatsApp).
* **Mode Simulator (*Mock Mode*):** Tombol sakelar untuk menguji coba presensi tanpa memotong kuota paket WhatsApp Fonnte sekolah.

---

### 6.4 Mengubah Password Akun Admin dan PIN Kios 6-Digit
Untuk menjamin keamanan sistem secara berkala:
1. Buka panel **Keamanan Akses Admin** pada menu Pengaturan.

[gambar ss bagian Form Ubah Password dan PIN Keamanan Admin]

2. **Mengubah Kata Sandi Login:**
   * Masukkan kata sandi baru pada kolom Kata Sandi Baru.
   * Ketik ulang pada kolom Konfirmasi Kata Sandi.
   * Klik tombol **Perbarui Kata Sandi**.
3. **Mengubah PIN Otoritas Kios (6-Digit):**
   * Masukkan 6 angka rahasia baru pada kolom PIN Kios (contoh: `654321`).
   * Konfirmasi ulang 6 angka PIN tersebut.
   * Klik tombol **Perbarui PIN Kios**.

---

### 6.5 Prosedur Tutup Buku / Reset Riwayat Presensi Tahunan
Pada pergantian tahun ajaran baru, admin dapat mengarsipkan dan mengosongkan riwayat kehadiran lama:
1. Gulir ke panel paling bawah halaman Pengaturan pada bagian **Zona Bahaya (*Danger Zone*)**.

[gambar ss bagian Panel Zona Bahaya Tutup Buku Tahunan]

2. Klik tombol merah **Reset Seluruh Riwayat Absensi**.
3. Masukkan 6 digit PIN Admin untuk memvalidasi otorisasi.
4. Sistem akan mengosongkan seluruh catatan log presensi lama dan mengembalikan counter harian ke nol, siap menyongsong tahun ajaran baru. *(Data master nama siswa dan kelas tetap utuh dan aman)*.

---

# BAB VII: PANDUAN PENANGANAN MASALAH (TROUBLESHOOTING & FAQ)

### Q1: Kartu barcode siswa diarahkan ke scanner USB, tetapi lampu scanner berbunyi bip tanpa ada respon apa pun di layar?
* **Kemungkinan Penyebab:**
  1. Jendela browser Google Chrome kehilangan fokus aktif (misal petugas sempat mengklik jendela aplikasi lain di luar browser).
  2. Kabel scanner USB kendor atau terlepas dari port laptop.
* **Langkah Pemecahan:**
  1. Klik satu kali di sembarang area kosong pada layar Live Kiosk untuk mengembalikan fokus browser.
  2. Lakukan pengujian perangkat keras: Buka aplikasi **Notepad** bawaan Windows, lalu scan kartu barcode. Jika angka NISN muncul di Notepad, dipastikan perangkat scanner dalam kondisi sehat 100%. Buka kembali layar Live Kiosk dan lanjutkan pemindaian.

---

### Q2: Mengapa muncul pesan peringatan merah: *"Terlalu banyak percobaan PIN salah. Otorisasi PIN dikunci sementara selama 5 menit"* saat ingin keluar dari Kios?
* **Kemungkinan Penyebab:** Petugas salah memasukkan 6 digit PIN Admin lebih dari 5 kali berturut-turut.
* **Langkah Pemecahan:** Ini adalah fitur pengamanan aktif (*Rate Limiting*) untuk mencegah orang lain menebak PIN secara paksa. Tunggu selama 5 menit hingga sistem membuka kunci secara otomatis, kemudian masukkan PIN yang sah.

---

### Q3: Mengapa sebagian digit nomor WhatsApp wali murid bertanda bintang (contoh: `62812****432`) di tabel?
* **Kemungkinan Penyebab:** Anda sedang membuka aplikasi dalam mode **User Reguler (Belum Login Admin)**.
* **Langkah Pemecahan:** Ini bukan galat/kerusakan, melainkan fitur perlindungan data pribadi (*PII Protection*). Untuk melihat nomor telepon lengkap, silakan klik tombol **Login Petugas** di kanan atas dan masukkan akun Administrator Anda.

---

### Q4: Muncul pesan penolakan: *"Akses Ditolak: Pemindaian kartu hanya dapat dilakukan melalui terminal Kios resmi sekolah"*?
* **Kemungkinan Penyebab:** Seseorang mencoba menembak data presensi dari luar halaman Kiosk resmi atau melalui script eksternal tanpa token gerbang yang sah (*Gate Token Protection*).
* **Langkah Pemecahan:** Pastikan proses scan kartu selalu dijalankan melalui menu resmi **Live Kiosk Absensi** (`http://localhost:5173/#kiosk`).

---

### Q5: Bagaimana jika tiba-tiba terjadi pemadaman listrik di pos satpam saat jam presensi pagi berlangsung?
* **Kemungkinan Penyebab:** Gangguan aliran listrik PLN.
* **Langkah Pemecahan:**
  1. Jangan khawatir, sistem menggunakan basis data SQLite dengan konfigurasi *Write-Ahead Logging (WAL)* yang menyimpan setiap transaksi pemindaian kartu secara instan dan permanen. Seluruh siswa yang sudah men-tap kartu sebelum mati lampu **tetap tersimpan aman 100%**.
  2. Setelah aliran listrik menyala kembali, hidupkan komputer dan buka kembali halaman Live Kiosk (`F2`). Presensi dapat langsung dilanjutkan tanpa kehilangan data sedikit pun.

---

# LAMPIRAN I: GLOSARIUM & DAFTAR ISTILAH TEKNIS

* **SSAS (*Smart School Attendance System*):** Sistem informasi presensi cerdas terpadu berbasis pemindaian barcode untuk lingkungan pendidikan sekolah.
* **Kiosk Mode:** Tampilan antarmuka khusus layar penuh tanpa navigasi umum, difungsikan sebagai anjungan interaksi mandiri siswa di gerbang.
* **Barcode Code-128:** Standar simbologi barcode batang 1D berdensitas tinggi yang memuat karakter alfanumerik NISN secara ringkas dan mudah dibaca oleh sensor laser.
* **Keyboard Wedge (HID):** Mode pengiriman data pemindai barcode USB yang berperilaku menyerupai papan ketik (*keyboard*) fisik komputer tanpa memerlukan instalasi driver khusus.
* **Text-to-Speech (TTS):** Teknologi kecerdasan buatan sintesis suara yang mengubah teks notifikasi sistem menjadi ucapan vokal berbahasa Indonesia secara otomatis.
* **WhatsApp Gateway (Fonnte API):** Layanan jembatan komunikasi pihak ketiga untuk mendistribusikan notifikasi pesan singkat secara otomatis dari server aplikasi ke aplikasi WhatsApp di ponsel orang tua.
* **PII Masking (*Personally Identifiable Information Masking*):** Penyensoran data sensitif (nomor ponsel pribadi) untuk mencegah kebocoran informasi pribadi kepada pihak yang tidak berkepentingan.
* **Rate Limiting:** Mekanisme keamanan jaringan pembatas kuota percobaan permintaan akses ke server guna menangkal serangan tebak kata sandi (*Brute-force attack*).
* **Rombel (*Rombongan Belajar*):** Kelompok peserta didik yang terdaftar dalam satu satuan kelas belajar tertentu di sekolah (contoh: 7-A, 8-B, 9-I).

---

# LEMBAR PENGESAHAN DOKUMEN

Buku Panduan Operasional (*User Manual*) **Smart School Attendance System (SSAS)** ini telah ditinjau dan disahkan sebagai acuan baku tata kelola presensi digital di lingkungan UPTD SMP Negeri 3 Jember.

Ditetapkan di : Jember  
Pada tanggal : 16 Oktober 2026  

<br>

| Mengetahui, <br> **Kepala UPTD SMP Negeri 3 Jember** | Disusun & Divalidasi Oleh, <br> **Tim Pengembang Sistem (SCI Tech)** |
| :---: | :---: |
| <br><br><br><br> **___________________________________** <br> NIP. .................................................... | <br><br><br><br> **___________________________________** <br> Lead Systems Engineer |
