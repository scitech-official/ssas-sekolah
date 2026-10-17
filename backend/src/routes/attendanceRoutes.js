const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAdmin } = require('../middleware/auth');

// Barcode Scan endpoint (Fast response for Kiosk Mode)
router.post('/scan', attendanceController.scan);

// Public / Reguler read endpoints
router.get('/today', attendanceController.getTodaySummary);
router.get('/stats-classes', attendanceController.getStatsByClass);
router.get('/class/:className', attendanceController.getClassAttendance);
router.get('/export-excel', attendanceController.exportExcel);

// Automated Cron Trigger (Invoked by Vercel Cron or external scheduler)
router.get('/cron/auto-alpa', async (req, res) => {
  try {
    const { executeAutoAlpa } = require('../services/cronService');
    const result = await executeAutoAlpa(false);
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Cron auto-alpa error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin-only operations
router.post('/manual', requireAdmin, attendanceController.manualUpdate);
router.post('/trigger-alpa', requireAdmin, attendanceController.triggerAutoAlpa);
router.post('/reset-logs', requireAdmin, attendanceController.resetYearlyLogs);

module.exports = router;

