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

// Start Server & Background Cron
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SSAS Backend Running on: http://localhost:${PORT}`);
  console.log(`🏫 Unit: SMP NEGERI 3 JEMBER`);
  console.log(`⏰ Timezone: Asia/Jakarta (WIB GMT+7)`);
  console.log(`======================================================\n`);

  initCronJobs();
});
