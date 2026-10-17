const prisma = require('../config/prisma');

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

    return res.json({ success: true, data: holidays });
  } catch (error) {
    console.error('getHolidays error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil kalender libur' });
  }
}

async function toggleHoliday(req, res) {
  try {
    const { holidayDate, description } = req.body;
    if (!holidayDate) {
      return res.status(400).json({ success: false, message: 'holidayDate wajib diisi (YYYY-MM-DD)' });
    }

    const existing = await prisma.holiday.findUnique({
      where: { holidayDate },
    });

    if (existing) {
      await prisma.holiday.delete({ where: { holidayDate } });
      return res.json({
        success: true,
        action: 'REMOVED',
        message: `Tanggal ${holidayDate} telah dihapus dari hari libur (Hari Efektif).`,
      });
    } else {
      const created = await prisma.holiday.create({
        data: {
          holidayDate,
          description: description || 'Libur Khusus/Sekolah',
        },
      });
      return res.json({
        success: true,
        action: 'ADDED',
        message: `Tanggal ${holidayDate} berhasil ditandai sebagai hari libur.`,
        data: created,
      });
    }
  } catch (error) {
    console.error('toggleHoliday error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah hari libur' });
  }
}

module.exports = {
  getHolidays,
  toggleHoliday,
};
