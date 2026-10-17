const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter for Admin Login
 * Max 5 failed attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // only count failed attempts (non-2xx)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login gagal. Akses ditangguhkan sementara selama 15 menit demi keamanan sistem.',
  },
});

/**
 * Rate Limiter for Kiosk Exit PIN Verification
 * Max 5 failed attempts per 5 minutes per IP
 */
const pinVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan PIN salah. Otorisasi PIN dikunci sementara selama 5 menit.',
  },
});

/**
 * General API Limiter (DoS prevention)
 * Max 300 requests per minute per IP
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan ke server. Silakan perlambat navigasi Anda.',
  },
});

module.exports = {
  loginLimiter,
  pinVerifyLimiter,
  generalLimiter,
};
