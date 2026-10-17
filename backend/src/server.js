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
  const results = {};
  const { PrismaClient } = require('@prisma/client');
  const net = require('net');
  const testTcp = (host, port) => new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(4000);
    socket.on('connect', () => { socket.destroy(); resolve({ connected: true }); });
    socket.on('timeout', () => { socket.destroy(); resolve({ connected: false, error: 'TIMEOUT' }); });
    socket.on('error', (err) => { resolve({ connected: false, error: err.message }); });
    socket.connect(port, host);
  });

  results.tcp = {
    pooler6543: await testTcp('aws-0-ap-southeast-1.pooler.supabase.com', 6543),
    pooler5432: await testTcp('aws-0-ap-southeast-1.pooler.supabase.com', 5432),
  };

  // Test 1: Standard Prisma instance
  try {
    const prisma = require('./config/prisma');
    results.primary = {
      status: 'OK',
      userCount: await prisma.user.count(),
    };
  } catch (err) {
    results.primary = {
      status: 'FAILED',
      name: err.name,
      message: err.message,
    };
  }

  // Test 2: Direct URL if available
  if (process.env.DIRECT_URL) {
    try {
      const directPrisma = new PrismaClient({
        datasources: { db: { url: process.env.DIRECT_URL } }
      });
      results.direct = {
        status: 'OK',
        userCount: await directPrisma.user.count(),
      };
      await directPrisma.$disconnect();
    } catch (err) {
      results.direct = {
        status: 'FAILED',
        name: err.name,
        message: err.message,
      };
    }
  }

  // Test 3: Direct Supabase Host (db.xxwpzwrufvozpvqmusix.supabase.co:5432)
  const directHostUrl = "postgresql://postgres:Sc1tcch_a26@db.xxwpzwrufvozpvqmusix.supabase.co:5432/postgres";
  try {
    const hostPrisma = new PrismaClient({
      datasources: { db: { url: directHostUrl } }
    });
    results.directHost5432 = {
      status: 'OK',
      userCount: await hostPrisma.user.count(),
    };
    await hostPrisma.$disconnect();
  } catch (err) {
    results.directHost5432 = {
      status: 'FAILED',
      name: err.name,
      message: err.message,
    };
  }

  res.json({
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    directUrlConfigured: !!process.env.DIRECT_URL,
    results,
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
