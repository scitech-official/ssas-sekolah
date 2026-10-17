const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { loginLimiter, pinVerifyLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.get('/me', verifyToken, authController.getMe);
router.post('/change-password', requireAdmin, authController.changePassword);
router.post('/change-pin', requireAdmin, authController.changePin);
router.post('/verify-pin', pinVerifyLimiter, (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'smp3_jember_secret_key_super_secure_2026';
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // ignore
    }
  }
  next();
}, authController.verifyPin);

module.exports = router;
