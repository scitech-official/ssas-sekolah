const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');

// Public read of system hours (for displaying on regular dashboard & kiosk)
router.get('/', settingsController.getSettings);

// Admin-only updates & testing
router.put('/', requireAdmin, settingsController.updateSettings);
router.post('/test-fonnte', requireAdmin, settingsController.testFonnte);
router.get('/logs', requireAdmin, settingsController.getWaLogs);

module.exports = router;
