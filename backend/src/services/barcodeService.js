const bwipjs = require('bwip-js');
const archiver = require('archiver');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');

/**
 * Generate 1D Barcode (Code 128) PNG buffer from NISN
 */
async function generateBarcodeBuffer(text, options = {}) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128', // Barcode type 1D Code 128
        text: String(text).trim(),
        scale: options.scale || 3,
        height: options.height || 12,
        includetext: true,
        textxalign: 'center',
        textsize: 11,
        paddingwidth: 10,
        paddingheight: 6,
        backgroundcolor: 'ffffff',
      },
      (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      }
    );
  });
}

/**
 * Generate a complete Student Identity & Barcode Card as a PNG Buffer
 * Contains: Nama Siswa, Kelas, NISN, and 1D Barcode
 */
async function generateStudentCardPng(student) {
  const width = 540;
  const height = 340;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border with subtle rounded card effect
  ctx.strokeStyle = '#2563eb'; // Brand blue border
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Header Banner
  ctx.fillStyle = '#1e3a8a'; // Dark blue
  ctx.fillRect(11, 11, width - 22, 60);

  // Draw Official School Logo if available
  let logoDrawn = false;
  try {
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoImg = await loadImage(logoPath);
      ctx.drawImage(logoImg, 22, 16, 50, 50);
      logoDrawn = true;
    }
  } catch (err) {
    // Graceful fallback
  }

  // School Header Text
  const textCenterX = logoDrawn ? (width + 40) / 2 : width / 2;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SMP NEGERI 3 JEMBER', textCenterX, 38);

  ctx.fillStyle = '#93c5fd'; // Light blue
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('KARTU IDENTITAS PRESENSI SISWA', textCenterX, 57);

  // Student Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(student.name || 'Nama Siswa', width / 2, 110);

  // Class and NISN details
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`KELAS: ${student.className || '-'}   •   NISN: ${student.nisn || '-'}`, width / 2, 138);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 154);
  ctx.lineTo(width - 40, 154);
  ctx.stroke();

  // Generate and draw 1D Barcode
  try {
    const rawBarcodeBuffer = await generateBarcodeBuffer(student.nisn);
    const barcodeImage = await loadImage(rawBarcodeBuffer);
    // Draw barcode centered
    const barcodeW = 420;
    const barcodeH = 130;
    ctx.drawImage(barcodeImage, (width - barcodeW) / 2, 165, barcodeW, barcodeH);
  } catch (err) {
    console.error('Error drawing barcode on card:', err);
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px sans-serif';
    ctx.fillText('Gagal memuat barcode', width / 2, 220);
  }

  // Footer text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText('Smart School Attendance System (SSAS) • Berlaku Selama Menjadi Siswa Aktif', width / 2, 320);

  return canvas.toBuffer('image/png');
}

/**
 * Generate a ZIP file of complete Student Card PNGs (all or filtered by class)
 * Pipes the ZIP archive directly to the Express response
 */
async function streamBarcodesZip(res, filterClass = null) {
  const where = filterClass ? { className: filterClass } : {};
  const students = await prisma.student.findMany({
    where,
    orderBy: [{ className: 'asc' }, { name: 'asc' }],
  });

  if (students.length === 0) {
    throw new Error('Tidak ada data siswa untuk diekspor');
  }

  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  const filename = filterClass 
    ? `Kartu_Barcode_Kelas_${filterClass.replace(/[^a-zA-Z0-9]/g, '_')}.zip`
    : `Kartu_Barcode_Semua_Siswa_SMP3_${Date.now()}.zip`;

  res.attachment(filename);
  res.setHeader('Content-Type', 'application/zip');

  archive.pipe(res);

  for (const student of students) {
    try {
      const cardBuffer = await generateStudentCardPng(student);
      const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
      const safeClass = student.className.replace(/[^a-zA-Z0-9]/g, '_');
      const entryName = `${safeClass}/${student.nisn}_${safeName}.png`;
      archive.append(cardBuffer, { name: entryName });
    } catch (err) {
      console.warn(`Failed to generate barcode card for ${student.nisn}:`, err.message);
    }
  }

  await archive.finalize();
}

module.exports = {
  generateBarcodeBuffer,
  generateStudentCardPng,
  streamBarcodesZip,
};
