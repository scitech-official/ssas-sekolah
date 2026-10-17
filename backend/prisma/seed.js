const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function getTodayWIB() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (3600000 * 7));
  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, '0');
  const day = String(wibTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log('🌱 Memulai proses seeding database SSAS SMP Negeri 3 Jember...');

  // 1. Clean existing records for clean test state
  await prisma.waLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const pinHash = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'admin',
      pinHash,
    },
  });
  console.log(`👤 User Admin berhasil dibuat: ${admin.username} (password: admin123, PIN: 123456)`);

  // 3. Create Global Settings
  const setting = await prisma.setting.create({
    data: {
      id: 1,
      timeStart: '06:00',
      timeLate: '07:00',
      timeAlpa: '08:00',
      waMessageTemplate: `Yth. Bapak/Ibu Wali Murid,\n\nDiberitahukan bahwa ananda [NAMA] (Kelas [KELAS]) telah tercatat [STATUS] di sistem presensi SMP Negeri 3 Jember pada tanggal [TANGGAL] pukul [JAM] WIB.[CATATAN]\n\nTerima kasih atas kerja sama Bapak/Ibu.\n- SSAS SMP Negeri 3 Jember -`,
      fonnteApiToken: '',
      fonnteMockMode: true,
      schoolName: 'SMP NEGERI 3 JEMBER',
      academicYear: '2024/2025',
      semester: 'Ganjil',
    },
  });
  console.log('⚙️ Pengaturan Global sistem berhasil diinisialisasi.');

  // 4. Create Holidays (Sample national & school holidays)
  const today = getTodayWIB();
  const currentYear = today.split('-')[0];
  const holidaysData = [
    { holidayDate: `${currentYear}-01-01`, description: 'Tahun Baru Masehi' },
    { holidayDate: `${currentYear}-08-17`, description: 'Hari Kemerdekaan RI' },
    { holidayDate: `${currentYear}-12-25`, description: 'Hari Raya Natal' },
  ];

  for (const h of holidaysData) {
    await prisma.holiday.create({ data: h });
  }
  console.log(`🏖️ ${holidaysData.length} hari libur nasional ditambahkan.`);

  // 5. Generate Classes (7-A s.d 7-I, 8-A s.d 8-I, 9-A s.d 9-I = 27 rombel)
  const classes = [];
  const levels = [7, 8, 9];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  for (const lvl of levels) {
    for (const sec of sections) {
      classes.push(`${lvl}-${sec}`);
    }
  }

  // Realistic Indonesian Student Names
  const firstNames = [
    'Ahmad', 'Aditya', 'Alya', 'Annisa', 'Bagus', 'Citra', 'Dimas', 'Dhimas', 'Fajar', 'Farhan',
    'Gilang', 'Hafiz', 'Indah', 'Joko', 'Kevin', 'Lestari', 'Muhammad', 'Nabila', 'Putri', 'Rafi',
    'Rizky', 'Siti', 'Tiara', 'Wahyu', 'Yoga', 'Zaki', 'Bayu', 'Chandra', 'Dewi', 'Eka'
  ];
  const lastNames = [
    'Pratama', 'Kusuma', 'Putra', 'Ramadhan', 'Kinanti', 'Sasikirana', 'Hendrawan', 'Syahputra',
    'Nugroho', 'Maulana', 'Akbar', 'Wardana', 'Rahmawati', 'Ridwan', 'Jaya', 'Bagaskara', 'Nurhaliza',
    'Sanjaya', 'Maharani', 'Al-Fathir', 'Santoso', 'Wijaya', 'Permana', 'Saputra', 'Wibowo'
  ];

  console.log(`📚 Menghasilkan data siswa untuk 27 Rombel...`);
  const createdStudents = [];
  let nisnCounter = 81293800;

  // We will populate 32-38 students per class
  // To keep initial seed fast, we seed 35 students in 7-A (exact wireframe showcase),
  // and 4-8 students in each of the remaining 26 classes, total ~150-200 students
  for (const cls of classes) {
    const studentCount = cls === '7-A' ? 36 : 6;
    for (let i = 0; i < studentCount; i++) {
      nisnCounter++;
      const fName = firstNames[(i + nisnCounter) % firstNames.length];
      const lName = lastNames[(i * 3 + nisnCounter) % lastNames.length];
      const fullName = `${fName} ${lName}`;
      const nisnStr = `00${nisnCounter}`;
      const waNumber = `628${Math.floor(100000000 + Math.random() * 900000000)}`;

      const student = await prisma.student.create({
        data: {
          nisn: nisnStr,
          name: fullName,
          className: cls,
          parentWaNumber: waNumber,
        },
      });
      createdStudents.push(student);
    }
  }

  console.log(`👥 Berhasil membuat ${createdStudents.length} siswa di seluruh 27 kelas.`);

  // 6. Generate Sample Attendances for Today
  console.log(`⏱️ Menghasilkan data absensi realistis hari ini (${today})...`);
  const students7A = createdStudents.filter(s => s.className === '7-A');

  // Exact sample from wireframe for 7-A
  const custom7A = [
    { index: 0, status: 'HADIR', timeIn: '06:42:15' },
    { index: 1, status: 'HADIR', timeIn: '06:38:02' },
    { index: 2, status: 'TELAT', timeIn: '07:08:44' },
    { index: 3, status: 'SAKIT', timeIn: null, note: 'Surat dokter: demam tinggi' },
    { index: 4, status: 'IZIN', timeIn: null, note: 'Acara keluarga di luar kota' },
    { index: 5, status: 'HADIR', timeIn: '06:51:20' },
    { index: 6, status: 'TELAT', timeIn: '07:04:18' },
    { index: 7, status: 'HADIR', timeIn: '06:25:40' },
  ];

  for (const c of custom7A) {
    if (students7A[c.index]) {
      await prisma.attendance.create({
        data: {
          studentId: students7A[c.index].id,
          date: today,
          status: c.status,
          timeIn: c.timeIn,
          note: c.note || null,
          waSent: true,
          waStatus: 'MOCK_SENT',
        },
      });
    }
  }

  // Populate remaining students in 7-A (mostly Hadir)
  for (let i = 8; i < students7A.length; i++) {
    const isPresent = i < 32;
    if (isPresent) {
      const min = String(Math.floor(20 + Math.random() * 38)).padStart(2, '0');
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      await prisma.attendance.create({
        data: {
          studentId: students7A[i].id,
          date: today,
          status: 'HADIR',
          timeIn: `06:${min}:${sec}`,
          waSent: true,
          waStatus: 'MOCK_SENT',
        },
      });
    }
  }

  // Populate some attendances across other classes
  const otherStudents = createdStudents.filter(s => s.className !== '7-A');
  for (let i = 0; i < otherStudents.length; i++) {
    // 85% hadir, 7% telat, 3% izin/sakit
    const rand = Math.random();
    if (rand < 0.85) {
      const min = String(Math.floor(25 + Math.random() * 32)).padStart(2, '0');
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      await prisma.attendance.create({
        data: {
          studentId: otherStudents[i].id,
          date: today,
          status: 'HADIR',
          timeIn: `06:${min}:${sec}`,
          waSent: true,
          waStatus: 'MOCK_SENT',
        },
      });
    } else if (rand < 0.93) {
      const min = String(Math.floor(2 + Math.random() * 15)).padStart(2, '0');
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      await prisma.attendance.create({
        data: {
          studentId: otherStudents[i].id,
          date: today,
          status: 'TELAT',
          timeIn: `07:${min}:${sec}`,
          waSent: true,
          waStatus: 'MOCK_SENT',
        },
      });
    } else if (rand < 0.97) {
      await prisma.attendance.create({
        data: {
          studentId: otherStudents[i].id,
          date: today,
          status: 'IZIN',
          note: 'Izin urusan keluarga',
          waSent: true,
          waStatus: 'MOCK_SENT',
        },
      });
    }
  }

  console.log('✅ Seeding selesai! Database siap digunakan untuk pengujian internal.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
