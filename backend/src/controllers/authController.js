const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'smp3_jember_secret_key_super_secure_2026';

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
}

async function verifyPin(req, res) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'PIN otoritas wajib diisi' });
    }

    let adminUser = null;
    if (req.user?.id) {
      adminUser = await prisma.user.findUnique({
        where: { id: req.user.id },
      });
    }
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { role: 'admin' },
      });
    }

    if (!adminUser || !adminUser.pinHash) {
      return res.status(403).json({ success: false, message: 'PIN belum dikonfigurasi pada sistem' });
    }

    const isPinValid = await bcrypt.compare(String(pin).trim(), adminUser.pinHash);
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: 'PIN Otoritas Admin salah' });
    }

    return res.json({ success: true, message: 'PIN valid' });
  } catch (error) {
    console.error('verifyPin error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
}

/**
 * Change Admin Password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password saat ini dan password baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Konfirmasi password baru tidak sesuai' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User admin tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(`🔐 [AUTH] Password admin (${user.username}) berhasil diperbarui.`);
    return res.json({ success: true, message: 'Password Admin berhasil diperbarui!' });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui password admin' });
  }
}

/**
 * Change Admin Authority PIN (6-digits)
 */
async function changePin(req, res) {
  try {
    const { currentPassword, currentPin, newPin, confirmPin } = req.body;

    if (!newPin) {
      return res.status(400).json({ success: false, message: 'PIN baru 6-digit wajib diisi' });
    }

    const cleanPin = String(newPin).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({ success: false, message: 'PIN baru harus berupa 6 digit angka (contoh: 123456)' });
    }

    if (confirmPin && cleanPin !== String(confirmPin).trim()) {
      return res.status(400).json({ success: false, message: 'Konfirmasi PIN baru tidak cocok' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User admin tidak ditemukan' });
    }

    // Verify identity using currentPassword or currentPin
    let isAuthorized = false;
    if (currentPassword) {
      isAuthorized = await bcrypt.compare(currentPassword, user.passwordHash);
    } else if (currentPin && user.pinHash) {
      isAuthorized = await bcrypt.compare(String(currentPin).trim(), user.pinHash);
    } else {
      return res.status(400).json({ success: false, message: 'Password admin saat ini wajib diisi untuk verifikasi identitas' });
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Verifikasi identitas gagal: Password admin salah' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(cleanPin, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    });

    console.log(`🔢 [AUTH] PIN Otoritas 6-digit admin (${user.username}) berhasil diperbarui.`);
    return res.json({ success: true, message: 'PIN Otoritas Admin (6 digit) berhasil diperbarui!' });
  } catch (error) {
    console.error('changePin error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui PIN otoritas admin' });
  }
}

module.exports = {
  login,
  getMe,
  verifyPin,
  changePassword,
  changePin,
};
