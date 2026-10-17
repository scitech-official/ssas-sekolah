const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const queueWorker = require('../services/queueWorker');
const { compileMessage } = require('../services/fonnteService');
const { exportAttendanceToExcel } = require('../services/excelService');
const { getCurrentWIB } = require('../services/cronService');
const { checkIsAdmin, maskPhoneNumber } = require('../middleware/auth');

/**
 * Scan Barcode NISN (Endpoint Inti Kios Absensi)
 */
async function scan(req, res) {
  const startTime = Date.now();
  try {
    // 0. Verify Kiosk Terminal Secret / Admin Authorization (Anti-Spoofing)
    const kioskSecret = req.headers['x-kiosk-secret'];
    const expectedSecret = process.env.KIOSK_SECRET_KEY || 'smp3_kiosk_gate_token_2026';
    if (!kioskSecret || kioskSecret !== expectedSecret) {
      const isAdmin = checkIsAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak: Pemindaian kartu hanya dapat dilakukan melalui terminal Kios resmi sekolah.',
        });
      }
    }

    const { nisn } = req.body;
    if (!nisn) {
      return res.status(400).json({ success: false, message: 'NISN tidak boleh kosong' });
    }

    const cleanNisn = String(nisn).trim();
    const { dateStr, timeStr } = getCurrentWIB();

    // 1. Find Student by NISN
    const student = await prisma.student.findUnique({
      where: { nisn: cleanNisn },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: `Siswa dengan NISN "${cleanNisn}" tidak terdaftar di sistem.`,
      });
    }

    // 2. Double-tap Prevention Check
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: student.id,
          date: dateStr,
        },
      },
    });

    if (existing) {
      let message = `Siswa ${student.name} (${student.className}) sudah melakukan tap presensi hari ini pada pukul ${existing.timeIn} WIB (Status: ${existing.status}).`;
      if (existing.status === 'ALPA' || !existing.timeIn) {
        message = `Siswa ${student.name} (${student.className}) sudah tercatat ${existing.status} hari ini oleh sistem. Silakan lapor ke Guru Piket untuk klarifikasi kehadiran.`;
      }

      return res.status(409).json({
        success: false,
        doubleTap: true,
        message,
        attendance: existing,
        student,
      });
    }

    // 3. Determine Status based on current time vs settings
    const settings = await prisma.setting.findUnique({ where: { id: 1 } });
    const timeLate = settings?.timeLate || '07:00';
    const currentTimeShort = timeStr.substring(0, 5); // "HH:mm"
    const timeLateShort = timeLate.substring(0, 5);

    let status = 'HADIR';
    let note = null;

    if (currentTimeShort > timeLateShort) {
      status = 'TELAT';
      note = `Terlambat hadir (Tap pukul ${timeStr} WIB, batas tepat waktu: ${timeLate})`;
    }

    // 4. Save Attendance Record
    const attendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: dateStr,
        timeIn: timeStr,
        status,
        note,
        waSent: false,
        waStatus: 'PENDING',
      },
    });

    // 5. Queue WhatsApp Notification
    if (student.parentWaNumber) {
      const statusLabel = status === 'HADIR' ? 'HADIR TEPAT WAKTU' : 'TERLAMBAT';
      const waMessage = compileMessage(settings?.waMessageTemplate, {
        name: student.name,
        status: statusLabel,
        time: timeStr,
        date: dateStr,
        className: student.className,
        note,
      });

      queueWorker.enqueue({
        attendanceId: attendance.id,
        studentId: student.id,
        target: student.parentWaNumber,
        message: waMessage,
      });
    }

    const elapsedMs = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      message: `Presensi berhasil: ${student.name} (${status})`,
      student,
      attendance,
      status,
      elapsedMs,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses pemindaian kartu' });
  }
}

/**
 * Get Today's Aggregated Summary & Live Feed
 */
async function getTodaySummary(req, res) {
  try {
    const { dateStr } = getCurrentWIB();
    const queryDate = req.query.date || dateStr;

    // Self-healing: if viewing today's summary, trigger executeAutoAlpa in case cut-off has passed
    if (queryDate === dateStr) {
      const { executeAutoAlpa } = require('../services/cronService');
      await executeAutoAlpa();
    }

    // Total active students
    const totalStudents = await prisma.student.count();

    // Today's attendances
    const attendances = await prisma.attendance.findMany({
      where: { date: queryDate },
      include: {
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
            className: true,
            parentWaNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalHadir = 0;
    let totalTelat = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpa = 0;

    attendances.forEach((att) => {
      if (att.status === 'HADIR') totalHadir++;
      else if (att.status === 'TELAT') totalTelat++;
      else if (att.status === 'IZIN') totalIzin++;
      else if (att.status === 'SAKIT') totalSakit++;
      else if (att.status === 'ALPA') totalAlpa++;
    });

    const totalRecorded = attendances.length;
    const totalBelumMasuk = Math.max(0, totalStudents - totalRecorded);

    // Peak arrival distribution in 15-minute intervals
    const arrivalDistribution = {
      '06.00-06.15': 0,
      '06.15-06.30': 0,
      '06.30-06.45': 0,
      '06.45-07.00': 0,
      '> 07.00': 0,
    };

    attendances.forEach((att) => {
      if (att.timeIn && (att.status === 'HADIR' || att.status === 'TELAT')) {
        const time = att.timeIn.substring(0, 5); // "HH:mm"
        if (time < '06:15') arrivalDistribution['06.00-06.15']++;
        else if (time >= '06:15' && time < '06:30') arrivalDistribution['06.15-06.30']++;
        else if (time >= '06:30' && time < '06:45') arrivalDistribution['06.30-06.45']++;
        else if (time >= '06:45' && time <= '07:00') arrivalDistribution['06.45-07.00']++;
        else if (time > '07:00') arrivalDistribution['> 07.00']++;
      }
    });

    // Latest 20 scans for live stream feed
    const recentScans = attendances.slice(0, 20);

    return res.json({
      success: true,
      date: queryDate,
      metrics: {
        totalStudents,
        totalHadir,
        totalTelat,
        totalIzin,
        totalSakit,
        totalAlpa,
        totalRecorded,
        totalBelumMasuk,
        attendanceRate: totalStudents > 0 ? (((totalHadir + totalTelat) / totalStudents) * 100).toFixed(1) : '0',
      },
      arrivalDistribution,
      recentScans,
    });
  } catch (error) {
    console.error('getTodaySummary error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan presensi' });
  }
}

/**
 * Get Attendance Statistics by Class (27 Rombel)
 */
async function getStatsByClass(req, res) {
  try {
    const { dateStr } = getCurrentWIB();
    const queryDate = req.query.date || dateStr;

    // Group students by className
    const students = await prisma.student.findMany({
      select: { id: true, className: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: { date: queryDate },
      select: { studentId: true, status: true },
    });

    const attendanceMap = new Map();
    attendances.forEach(att => attendanceMap.set(att.studentId, att.status));

    const classStatsMap = {};

    students.forEach((s) => {
      const cls = s.className;
      if (!classStatsMap[cls]) {
        classStatsMap[cls] = {
          className: cls,
          total: 0,
          hadir: 0,
          telat: 0,
          izinSakit: 0,
          alpa: 0,
        };
      }
      classStatsMap[cls].total++;

      const status = attendanceMap.get(s.id);
      if (status === 'HADIR') classStatsMap[cls].hadir++;
      else if (status === 'TELAT') classStatsMap[cls].telat++;
      else if (status === 'IZIN' || status === 'SAKIT') classStatsMap[cls].izinSakit++;
      else if (status === 'ALPA') classStatsMap[cls].alpa++;
    });

    const statsArray = Object.values(classStatsMap).map((item) => {
      const presentCount = item.hadir + item.telat;
      const rate = item.total > 0 ? Math.round((presentCount / item.total) * 100) : 0;
      return {
        ...item,
        rate,
      };
    });

    // Sort by class name naturally (7-A, 7-B, ..., 9-I)
    statsArray.sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

    return res.json({
      success: true,
      date: queryDate,
      data: statsArray,
    });
  } catch (error) {
    console.error('getStatsByClass error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil statistik per kelas' });
  }
}

/**
 * Get Students & Attendance of a specific class
 */
async function getClassAttendance(req, res) {
  try {
    const { className } = req.params;
    const { dateStr } = getCurrentWIB();
    const queryDate = req.query.date || dateStr;

    const students = await prisma.student.findMany({
      where: { className },
      orderBy: { name: 'asc' },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        date: queryDate,
        student: { className },
      },
    });

    const attMap = new Map();
    attendances.forEach(a => attMap.set(a.studentId, a));

    let stats = {
      total: students.length,
      hadir: 0,
      telat: 0,
      izinSakit: 0,
      alpa: 0,
      belumAbsen: 0,
    };

    const isAdmin = checkIsAdmin(req);
    const studentList = students.map((s, index) => {
      const att = attMap.get(s.id);
      if (att) {
        if (att.status === 'HADIR') stats.hadir++;
        else if (att.status === 'TELAT') stats.telat++;
        else if (att.status === 'IZIN' || att.status === 'SAKIT') stats.izinSakit++;
        else if (att.status === 'ALPA') stats.alpa++;
      } else {
        stats.belumAbsen++;
      }

      return {
        no: index + 1,
        studentId: s.id,
        nisn: s.nisn,
        name: s.name,
        className: s.className,
        parentWaNumber: isAdmin ? s.parentWaNumber : maskPhoneNumber(s.parentWaNumber),
        status: att ? att.status : 'BELUM_ABSEN',
        timeIn: att ? att.timeIn : null,
        note: att ? att.note : null,
        waStatus: att ? att.waStatus : null,
        attendanceId: att ? att.id : null,
      };
    });

    return res.json({
      success: true,
      className,
      date: queryDate,
      stats,
      students: studentList,
    });
  } catch (error) {
    console.error('getClassAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil absensi kelas' });
  }
}

/**
 * Manual Update / Fast Izin-Sakit by Admin
 */
async function manualUpdate(req, res) {
  try {
    const { studentId, status, note, date } = req.body;

    if (!studentId || !status) {
      return res.status(400).json({ success: false, message: 'studentId dan status wajib diisi' });
    }

    const { dateStr, timeStr } = getCurrentWIB();
    const targetDate = date || dateStr;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // Upsert attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: targetDate,
        },
      },
      update: {
        status,
        note: note || null,
        timeIn: status === 'HADIR' || status === 'TELAT' ? timeStr : null,
      },
      create: {
        studentId,
        date: targetDate,
        status,
        note: note || null,
        timeIn: status === 'HADIR' || status === 'TELAT' ? timeStr : null,
        waSent: false,
        waStatus: 'PENDING',
      },
    });

    // Optionally notify parent if status is IZIN / SAKIT / HADIR
    if (student.parentWaNumber) {
      const settings = await prisma.setting.findUnique({ where: { id: 1 } });
      const waMsg = compileMessage(settings?.waMessageTemplate, {
        name: student.name,
        status: status,
        time: timeStr,
        date: targetDate,
        className: student.className,
        note: note || undefined,
      });

      queueWorker.enqueue({
        attendanceId: attendance.id,
        studentId: student.id,
        target: student.parentWaNumber,
        message: waMsg,
      });
    }

    return res.json({
      success: true,
      message: `Status presensi ${student.name} berhasil diubah menjadi ${status}`,
      attendance,
    });
  } catch (error) {
    console.error('manualUpdate error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah presensi siswa' });
  }
}

/**
 * Danger Zone: Reset Yearly Attendance Logs (Requires PIN)
 */
async function resetYearlyLogs(req, res) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'PIN otoritas Admin 6-digit wajib diisi' });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!adminUser || !adminUser.pinHash) {
      return res.status(403).json({ success: false, message: 'PIN otoritas belum dikonfigurasi' });
    }

    const isValid = await bcrypt.compare(String(pin).trim(), adminUser.pinHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'PIN Otoritas Admin salah!' });
    }

    // Delete all attendance records and WaLogs
    const deletedCount = await prisma.attendance.deleteMany();
    await prisma.waLog.deleteMany();

    console.log(`🚨 [DANGER ZONE] Riwayat absensi direset oleh admin (${deletedCount.count} records terhapus).`);

    return res.json({
      success: true,
      message: `Seluruh riwayat presensi (${deletedCount.count} data) berhasil direset secara bersih.`,
    });
  } catch (error) {
    console.error('resetYearlyLogs error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mereset riwayat presensi' });
  }
}

/**
 * Export Attendance to Excel
 */
async function exportExcel(req, res) {
  try {
    const { date, className, startDate, endDate } = req.query;
    const buffer = await exportAttendanceToExcel({ date, className, startDate, endDate });

    let dateLabel = date || 'Semua';
    if (startDate && endDate) {
      dateLabel = startDate === endDate ? startDate : `${startDate}_sd_${endDate}`;
    } else if (startDate) {
      dateLabel = `Mulai_${startDate}`;
    } else if (endDate) {
      dateLabel = `Sampai_${endDate}`;
    }

    const filename = className 
      ? `Rekap_Presensi_Kelas_${className}_${dateLabel}.xlsx`
      : `Rekapitulasi_Presensi_SMP3_${dateLabel}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('exportExcel error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengekspor laporan Excel' });
  }
}

/**
 * Trigger Auto-Alpa Manually (Admin on-demand)
 */
async function triggerAutoAlpa(req, res) {
  try {
    const { executeAutoAlpa } = require('../services/cronService');
    const result = await executeAutoAlpa(true);
    return res.json({
      success: true,
      message: result.executed 
        ? `Berhasil mengeksekusi cut-off Alpa: ${result.countAlpa} siswa ditandai Alpa dan pesan WA diantrekan.`
        : `Cut-off Alpa: ${result.reason}`,
      result,
    });
  } catch (error) {
    console.error('triggerAutoAlpa error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menjalankan cut-off Alpa otomatis' });
  }
}

module.exports = {
  scan,
  getTodaySummary,
  getStatsByClass,
  getClassAttendance,
  manualUpdate,
  resetYearlyLogs,
  exportExcel,
  triggerAutoAlpa,
};
