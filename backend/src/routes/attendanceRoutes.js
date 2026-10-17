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

// Admin-only operations
router.post('/manual', requireAdmin, attendanceController.manualUpdate);
router.post('/trigger-alpa', requireAdmin, attendanceController.triggerAutoAlpa);
router.post('/reset-logs', requireAdmin, attendanceController.resetYearlyLogs);

module.exports = router;

