-- 1. Membuat Tipe Data ENUM untuk standardisasi nilai kolom
CREATE TYPE user_role AS ENUM ('admin', 'reguler');
CREATE TYPE attendance_status AS ENUM ('HADIR', 'TELAT', 'ALPA', 'IZIN', 'SAKIT');

-- 2. Tabel Users (Admin & Reguler)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'admin',
    pin_hash VARCHAR(255), -- Khusus admin untuk verifikasi hapus data tahunan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Students (Data Siswa)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nisn VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    parent_wa_number VARCHAR(20) NOT NULL, -- Format standar: 628xxx
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing pada NISN sangat penting karena akan dipindai/query ribuan kali dalam waktu singkat
CREATE INDEX idx_students_nisn ON students(nisn);
CREATE INDEX idx_students_class ON students(class_name);

-- 4. Tabel Attendances (Log Absensi Harian)
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_in TIME, -- Kosong (NULL) jika statusnya ALPA, IZIN, atau SAKIT
    status attendance_status NOT NULL,
    note TEXT, -- Untuk menyimpan alasan dari status IZIN / SAKIT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint penting: Mencegah 1 siswa absen 2 kali di hari yang sama (Double Tap)
    CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- Indexing untuk mempercepat pencarian data absensi per tanggal dan dashboard per kelas
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_attendances_student_date ON attendances(student_id, date);

-- 5. Tabel Holidays (Kalender Libur Akademik)
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Settings (Pengaturan Global Sistem)
CREATE TABLE settings (
    id INT PRIMARY KEY DEFAULT 1, -- Selalu 1, karena hanya butuh 1 baris pengaturan
    time_start TIME NOT NULL DEFAULT '06:00:00',
    time_late TIME NOT NULL DEFAULT '07:00:00',
    time_alpa TIME NOT NULL DEFAULT '08:00:00',
    wa_message_template TEXT NOT NULL,
    fonnte_api_token VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint untuk memastikan hanya ada 1 baris data pengaturan di tabel ini
    CONSTRAINT check_single_row CHECK (id = 1)
);


Penjelasan Keputusan Teknis (Architectural Decisions):
1.	Penggunaan UUID (Universally Unique Identifier): Saya menggunakan gen_random_uuid() untuk Primary Key tabel (kecuali tabel settings). Ini lebih aman daripada menggunakan angka urut (SERIAL), mencegah pihak luar menebak jumlah data, dan sangat aman jika suatu saat sistem perlu migrasi atau digabung (merge) datanya.
2.	CONSTRAINT unique_student_date pada Tabel Absensi: Ini adalah safeguard paling ampuh di level database. Jika ada anak iseng melakukan tap scanner berkali-kali pada kartu pelajar yang sama di hari yang sama, database akan otomatis menolak penyimpanan data kedua dan seterusnya, sehingga aplikasi (Express.js) tinggal menangkap error penolakan ini dan mengabaikannya tanpa merusak data.
3.	Penerapan ON DELETE CASCADE: Pada tabel attendances, jika Admin menghapus data seorang siswa di tabel students, maka seluruh log absensi anak tersebut akan ikut terhapus otomatis secara rapi tanpa meninggalkan "data sampah" (orphan data).
4.	Pembatasan 1 Baris pada settings (CHECK (id = 1)): Tabel settings didesain secara khusus agar tidak bisa ditambahkan baris baru (INSERT). Admin hanya bisa melakukan pembaruan (UPDATE pada id=1). Hal ini mencegah aplikasi backend bingung membaca konfigurasi jam absen mana yang sedang aktif.

