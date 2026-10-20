const prisma = require('../config/prisma');
const { processWfaAttendance } = require('../services/cronService');

async function getHolidays(req, res) {
  try {
    const { year } = req.query;
    let where = {};
    if (year) {
      where.holidayDate = { startsWith: String(year) };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { holidayDate: 'asc' },
    });

    const formatted = holidays.map((h) => {
      const isWfa = Boolean(h.description && h.description.startsWith('[WFA]'));
      return {
        ...h,
        isWfa,
        type: isWfa ? 'WFA' : 'HOLIDAY',
        cleanDescription: isWfa ? h.description.replace(/^\[WFA\]\s*/, '') : h.description,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getHolidays error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil kalender libur & WFA' });
  }
}

async function toggleHoliday(req, res) {
  try {
    const { holidayDate, description, type } = req.body;
    if (!holidayDate) {
      return res.status(400).json({ success: false, message: 'holidayDate wajib diisi (YYYY-MM-DD)' });
    }

    const requestedType = type === 'WFA' ? 'WFA' : 'HOLIDAY';
    const existing = await prisma.holiday.findUnique({
      where: { holidayDate },
    });

    if (existing) {
      const existingIsWfa = Boolean(existing.description && existing.description.startsWith('[WFA]'));

      // If clicking the same type -> Toggle OFF (Remove back to Effective Day)
      if ((existingIsWfa && requestedType === 'WFA') || (!existingIsWfa && requestedType === 'HOLIDAY')) {
        await prisma.holiday.delete({ where: { holidayDate } });

        // If removing WFA, clean up auto-generated attendances for this date
        if (existingIsWfa) {
          await prisma.attendance.deleteMany({
            where: {
              date: holidayDate,
              waStatus: 'SKIPPED_WFA',
              note: { contains: 'WFA' },
            },
          });
        }

        return res.json({
          success: true,
          action: 'REMOVED',
          type: requestedType,
          message: `Tanggal ${holidayDate} telah dikembalikan menjadi Hari Efektif Sekolah.`,
        });
      } else {
        // Switching between HOLIDAY <-> WFA
        let newDesc = '';
        if (requestedType === 'WFA') {
          newDesc = `[WFA] ${description || 'WFA / Belajar Dari Rumah'}`;
        } else {
          newDesc = description || 'Libur Khusus/Sekolah';
        }

        const updated = await prisma.holiday.update({
          where: { holidayDate },
          data: { description: newDesc },
        });

        if (requestedType === 'WFA') {
          await processWfaAttendance(holidayDate);
        } else {
          // Switched from WFA to HOLIDAY, clean up auto-generated WFA attendances
          await prisma.attendance.deleteMany({
            where: {
              date: holidayDate,
              waStatus: 'SKIPPED_WFA',
              note: { contains: 'WFA' },
            },
          });
        }

        return res.json({
          success: true,
          action: 'UPDATED',
          type: requestedType,
          message: requestedType === 'WFA'
            ? `Tanggal ${holidayDate} diubah menjadi Hari WFA / PJJ (Seluruh siswa otomatis HADIR).`
            : `Tanggal ${holidayDate} diubah menjadi Hari Libur Sekolah.`,
          data: {
            ...updated,
            isWfa: requestedType === 'WFA',
            type: requestedType,
          },
        });
      }
    } else {
      // Adding new record
      let finalDesc = '';
      if (requestedType === 'WFA') {
        finalDesc = `[WFA] ${description || 'WFA / Belajar Dari Rumah'}`;
      } else {
        finalDesc = description || 'Libur Khusus/Sekolah';
      }

      const created = await prisma.holiday.create({
        data: {
          holidayDate,
          description: finalDesc,
        },
      });

      if (requestedType === 'WFA') {
        // Automatically mark all active students as HADIR for this WFA date
        await processWfaAttendance(holidayDate);
      }

      return res.json({
        success: true,
        action: 'ADDED',
        type: requestedType,
        message: requestedType === 'WFA'
          ? `Tanggal ${holidayDate} berhasil ditandai sebagai Hari WFA / PJJ. Seluruh siswa otomatis dicatat HADIR tanpa pesan WA.`
          : `Tanggal ${holidayDate} berhasil ditandai sebagai hari libur.`,
        data: {
          ...created,
          isWfa: requestedType === 'WFA',
          type: requestedType,
        },
      });
    }
  } catch (error) {
    console.error('toggleHoliday error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah hari libur / WFA' });
  }
}

module.exports = {
  getHolidays,
  toggleHoliday,
};
