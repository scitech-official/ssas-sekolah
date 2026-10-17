const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smp3_jember_secret_key_super_secure_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid' });
  }
}

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya Admin yang diizinkan' });
    }
    next();
  });
}

function checkIsAdmin(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === 'admin';
  } catch (err) {
    return false;
  }
}

function maskPhoneNumber(phone) {
  if (!phone) return null;
  const str = String(phone).trim();
  if (str.length < 7) return '******';
  return str.slice(0, 5) + '****' + str.slice(-3);
}

module.exports = {
  verifyToken,
  requireAdmin,
  checkIsAdmin,
  maskPhoneNumber,
  JWT_SECRET,
};
