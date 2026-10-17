require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initCronJobs } = require('./services/cronService');

const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const holidayRoutes = require('./routes/holidayRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for reverse proxy deployments (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter (Anti DoS / Flood)
app.use('/api', generalLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Smart School Attendance System (SSAS) SMP Negeri 3 Jember',
    timestamp: new Date().toISOString(),
  });
});

// Database Diagnostic Check (For debugging deployment connection)
app.get('/api/debug-db', async (req, res) => {
  try {
    const prisma = require('./config/prisma');
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      message: 'Koneksi database PostgreSQL Supabase BERHASIL!',
      userCount,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      databaseUrlSample: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'TIDAK DITEMUKAN',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke database Supabase',
      errorName: err.name,
      errorCode: err.code,
      errorMessage: err.message,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      databaseUrlSample: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'TIDAK DITEMUKAN',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/holidays', holidayRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Background Cron (Only if running directly / locally, not in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SSAS Backend Running on: http://localhost:${PORT}`);
    console.log(`🏫 Unit: SMP NEGERI 3 JEMBER`);
    console.log(`⏰ Timezone: Asia/Jakarta (WIB GMT+7)`);
    console.log(`======================================================\n`);

    initCronJobs();
  });
}

module.exports = app;
