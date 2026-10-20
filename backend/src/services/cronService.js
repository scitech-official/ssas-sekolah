const cron = require('node-cron');
const prisma = require('../config/prisma');
const queueWorker = require('./queueWorker');
const { compileMessage } = require('./fonnteService');

// Mutex to prevent overlapping executions
let isProcessingAutoAlpa = false;

function getCurrentWIB() {
  const now = new Date();
  // Adjust to UTC+7 (WIB)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (3600000 * 7));
  
  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, '0');
  const day = String(wibTime.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(wibTime.getHours()).padStart(2, '0');
  const minutes = String(wibTime.getMinutes()).padStart(2, '0');
  const seconds = String(wibTime.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  const dayOfWeek = wibTime.getDay(); // 0 = Sunday

  return { dateStr, timeStr, dayOfWeek, wibTime };
}

async function executeAutoAlpa(force = false) {
  if (isProcessingAutoAlpa) {
    return { executed: false, reason: 'Eksekusi Auto-Alpa sedang berlangsung' };
  }

  isProcessingAutoAlpa = true;
  try {
    const { dateStr, timeStr, dayOfWeek } = getCurrentWIB();

    // 1. Check if Sunday (SMP typically does not have school on Sunday)
    if (dayOfWeek === 0 && !force) {
      return { executed: false, reason: 'Hari Minggu (Sekolah Libur)' };
    }

    // 2. Fetch system settings
    const settings = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!settings) return { executed: false, reason: 'Pengaturan sistem tidak ditemukan' };

    const timeAlpa = settings.timeAlpa || '08:00';
    const currentTimeShort = timeStr.substring(0, 5); // "HH:mm"
    const timeAlpaShort = timeAlpa.substring(0, 5);

    // Check if current time has reached or passed timeAlpa
    if (!force && currentTimeShort < timeAlpaShort) {
      return { executed: false, reason: `Waktu saat ini (${timeStr} WIB) belum mencapai batas Alpa (${timeAlpa} WIB)` };
    }

    // 3. Check if today is marked as a Holiday or WFA
    const holiday = await prisma.holiday.findUnique({
      where: { holidayDate: dateStr },
    });
    if (holiday && !force) {
      if (holiday.description && holiday.description.startsWith('[WFA]')) {
        const countWfa = await processWfaAttendance(dateStr);
        return {
          executed: true,
          isWfa: true,
          countWfa,
          reason: `Hari ini ditandai sebagai hari WFA (${holiday.description}). Seluruh siswa otomatis dicatat HADIR tanpa pesan WA.`,
        };
      }
      return { executed: false, reason: `Hari ini ditandai sebagai hari libur (${holiday.description})` };
    }

    // 4. Find all active students who do NOT have an attendance record for today
    const attendedStudentIds = await prisma.attendance.findMany({
      where: { date: dateStr },
      select: { studentId: true },
    }).then(rows => rows.map(r => r.studentId));

    const absentStudents = await prisma.student.findMany({
      where: {
        id: { notIn: attendedStudentIds },
      },
    });

    if (absentStudents.length === 0) {
      return { executed: false, reason: 'Semua siswa sudah tercatat presensi atau alpa.' };
    }

    console.log(`⏰ [CRON AUTO-ALPA] Ditemukan ${absentStudents.length} siswa belum absen pada tanggal ${dateStr} (Batas Alpa: ${timeAlpa} WIB). Memproses status ALPA...`);

    // 5. Bulk insert/create attendance record for absent students
    let countAlpa = 0;
    for (const student of absentStudents) {
      try {
        const attendance = await prisma.attendance.create({
          data: {
            studentId: student.id,
            date: dateStr,
            status: 'ALPA',
            timeIn: null,
            note: 'Otomatis oleh sistem (Batas Alpa terlewati)',
            waSent: false,
            waStatus: 'PENDING',
          },
        });

        countAlpa++;

        // 6. Queue WhatsApp notification
        if (student.parentWaNumber) {
          const msg = compileMessage(settings.waMessageTemplate, {
            name: student.name,
            status: 'ALPA (Tidak Masuk Tanpa Keterangan)',
            time: timeStr,
            date: dateStr,
            className: student.className,
            note: 'Siswa belum hadir di sekolah hingga batas akhir absensi.',
          });

          queueWorker.enqueue({
            attendanceId: attendance.id,
            studentId: student.id,
            target: student.parentWaNumber,
            message: msg,
          });
        }
      } catch (err) {
        console.warn(`Gagal mencatat alpa untuk ${student.name}:`, err.message);
      }
    }

    console.log(`🎯 [CRON AUTO-ALPA] Selesai: ${countAlpa} siswa berhasil ditandai ALPA & notifikasi diantrekan.`);
    return { executed: true, countAlpa };
  } finally {
    isProcessingAutoAlpa = false;
  }
}

async function processWfaAttendance(targetDate) {
  try {
    const { dateStr } = getCurrentWIB();
    const date = targetDate || dateStr;

    // 1. Fetch all active students
    const allStudents = await prisma.student.findMany();
    if (!allStudents.length) return 0;

    // 2. Fetch existing attendance for this date
    const existing = await prisma.attendance.findMany({
      where: { date },
      select: { studentId: true },
    });
    const existingMap = new Set(existing.map((e) => e.studentId));

    // 3. Students without attendance
    const pendingStudents = allStudents.filter((s) => !existingMap.has(s.id));
    if (!pendingStudents.length) return 0;

    let countHadir = 0;
    for (const student of pendingStudents) {
      try {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            date,
            timeIn: '07:00:00',
            status: 'HADIR',
            note: 'WFA / Pembelajaran Jarak Jauh (BDR)',
            waSent: false,
            waStatus: 'SKIPPED_WFA',
          },
        });
        countHadir++;
      } catch (err) {
        // Ignore duplicate if race condition occurs
      }
    }

    if (countHadir > 0) {
      console.log(`🏠 [WFA PRESENSI] Berhasil mencatat kehadiran otomatis ${countHadir} siswa untuk hari WFA (${date}) tanpa pengiriman WA.`);
    }

    return countHadir;
  } catch (error) {
    console.error('❌ Error processWfaAttendance:', error.message || error);
    return 0;
  }
}

function initCronJobs() {
  console.log('🕒 Inisialisasi background Cron Job (Auto-Alpa & WFA Check)...');

  // Immediate check on startup (in case server started after cut-off time or on WFA day)
  executeAutoAlpa().catch((err) => {
    console.error('❌ Error executing initial Auto-Alpa check on startup:', err);
  });

  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      await executeAutoAlpa();
    } catch (err) {
      console.error('❌ Error executing Auto-Alpa cron:', err);
    }
  });
}

module.exports = {
  initCronJobs,
  executeAutoAlpa,
  processWfaAttendance,
  getCurrentWIB,
};
