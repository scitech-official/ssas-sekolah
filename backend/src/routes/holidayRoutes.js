const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', holidayController.getHolidays);
router.post('/toggle', requireAdmin, holidayController.toggleHoliday);

module.exports = router;
