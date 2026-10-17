const prisma = require('../config/prisma');
const queueWorker = require('../services/queueWorker');
const { sendWhatsAppMessage } = require('../services/fonnteService');
const { getCurrentWIB } = require('../services/cronService');

async function getSettings(req, res) {
  try {
    let settings = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.setting.create({
        data: { id: 1 },
      });
    }

    const { dateStr, timeStr } = getCurrentWIB();
    const queueStatus = queueWorker.getMetrics();

    // Calculate WhatsApp stats for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayWaSent = await prisma.waLog.count({
      where: {
        status: { in: ['SENT', 'MOCK_SENT'] },
        createdAt: { gte: startOfToday },
      },
    }).catch(() => 0);

    const todayWaFailed = await prisma.waLog.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: startOfToday },
      },
    }).catch(() => 0);

    return res.json({
      success: true,
      data: settings,
      serverTime: {
        date: dateStr,
        time: timeStr,
        timeZone: 'WIB (GMT+7)',
      },
      queue: queueStatus,
      waStats: {
        sentToday: todayWaSent || queueStatus.stats.processed,
        failedToday: todayWaFailed || queueStatus.stats.failed,
        pending: queueStatus.pending,
      },
    });
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan sistem' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      timeStart,
      timeLate,
      timeAlpa,
      waMessageTemplate,
      fonnteApiToken,
      fonnteMockMode,
      schoolName,
      academicYear,
      semester,
    } = req.body;

    const updated = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        timeStart: timeStart || undefined,
        timeLate: timeLate || undefined,
        timeAlpa: timeAlpa || undefined,
        waMessageTemplate: waMessageTemplate || undefined,
        fonnteApiToken: fonnteApiToken !== undefined ? String(fonnteApiToken).trim() : undefined,
        fonnteMockMode: fonnteMockMode !== undefined ? Boolean(fonnteMockMode) : undefined,
        schoolName: schoolName || undefined,
        academicYear: academicYear || undefined,
        semester: semester || undefined,
      },
      create: {
        id: 1,
        timeStart: timeStart || '06:00',
        timeLate: timeLate || '07:00',
        timeAlpa: timeAlpa || '08:00',
        waMessageTemplate: waMessageTemplate || 'Yth. Bapak/Ibu...',
        fonnteApiToken: fonnteApiToken || '',
        fonnteMockMode: fonnteMockMode !== undefined ? Boolean(fonnteMockMode) : true,
        schoolName: schoolName || 'SMP NEGERI 3 JEMBER',
        academicYear: academicYear || '2024/2025',
        semester: semester || 'Ganjil',
      },
    });

    // Trigger auto-alpa check immediately upon setting changes
    const { executeAutoAlpa } = require('../services/cronService');
    executeAutoAlpa().catch(err => console.error('Auto-alpa check on settings update error:', err));

    return res.json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan',
      data: updated,
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan sistem' });
  }
}

async function testFonnte(req, res) {
  try {
    const { targetPhone, token, mockMode } = req.body;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp tujuan wajib diisi' });
    }

    const { timeStr, dateStr } = getCurrentWIB();
    const testMessage = `[TEST FONNTE]\nSistem Presensi SMP Negeri 3 Jember berhasil terkoneksi ke WhatsApp Gateway.\nWaktu tes: ${dateStr} pukul ${timeStr} WIB.`;

    const result = await sendWhatsAppMessage({
      target: targetPhone,
      message: testMessage,
      tokenOverride: token,
      mockOverride: mockMode,
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Pesan uji coba berhasil diproses!' : 'Pengiriman pesan gagal.',
      result,
    });
  } catch (error) {
    console.error('testFonnte error:', error);
    return res.status(500).json({ success: false, message: 'Gagal melakukan tes Fonnte WhatsApp' });
  }
}

async function getWaLogs(req, res) {
  try {
    const logs = await prisma.waLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('getWaLogs error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil log WA' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testFonnte,
  getWaLogs,
};
