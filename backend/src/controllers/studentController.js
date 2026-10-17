const prisma = require('../config/prisma');
const { generateStudentTemplateBuffer, parseAndImportStudents } = require('../services/excelService');
const { generateBarcodeBuffer, generateStudentCardPng, streamBarcodesZip } = require('../services/barcodeService');
const { checkIsAdmin, maskPhoneNumber } = require('../middleware/auth');

async function getStudents(req, res) {
  try {
    const { className, search, page = 1, limit = 50 } = req.query;

    const where = {};
    if (className && className !== 'ALL') {
      where.className = className;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nisn: { contains: search } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ className: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const isAdmin = checkIsAdmin(req);
    const sanitizedStudents = students.map((s) => ({
      ...s,
      parentWaNumber: isAdmin ? s.parentWaNumber : maskPhoneNumber(s.parentWaNumber),
    }));

    return res.json({
      success: true,
      data: sanitizedStudents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getStudents error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
  }
}

async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendances: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    console.error('getStudentById error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
  }
}

async function createStudent(req, res) {
  try {
    const { nisn, name, className, parentWaNumber } = req.body;

    if (!nisn || !name || !className) {
      return res.status(400).json({ success: false, message: 'NISN, Nama, dan Kelas wajib diisi' });
    }

    const cleanNisn = String(nisn).trim();
    const existing = await prisma.student.findUnique({ where: { nisn: cleanNisn } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Siswa dengan NISN ${cleanNisn} sudah ada!` });
    }

    let wa = String(parentWaNumber || '').trim().replace(/[^0-9]/g, '');
    if (wa.startsWith('0')) {
      wa = '62' + wa.substring(1);
    } else if (wa && !wa.startsWith('62')) {
      wa = '62' + wa;
    }
    if (!wa) wa = '6280000000000';

    const newStudent = await prisma.student.create({
      data: {
        nisn: cleanNisn,
        name: String(name).trim(),
        className: String(className).trim().toUpperCase(),
        parentWaNumber: wa,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Siswa berhasil ditambahkan',
      data: newStudent,
    });
  } catch (error) {
    console.error('createStudent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal menambahkan siswa' });
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { nisn, name, className, parentWaNumber } = req.body;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    let wa = existing.parentWaNumber;
    if (parentWaNumber !== undefined) {
      wa = String(parentWaNumber).trim().replace(/[^0-9]/g, '');
      if (wa.startsWith('0')) wa = '62' + wa.substring(1);
      else if (wa && !wa.startsWith('62')) wa = '62' + wa;
      if (!wa) wa = '6280000000000';
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        nisn: nisn ? String(nisn).trim() : undefined,
        name: name ? String(name).trim() : undefined,
        className: className ? String(className).trim().toUpperCase() : undefined,
        parentWaNumber: wa,
      },
    });

    return res.json({
      success: true,
      message: 'Data siswa berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('updateStudent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui data siswa' });
  }
}

async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    return res.json({ success: true, message: 'Data siswa berhasil dihapus' });
  } catch (error) {
    console.error('deleteStudent error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus siswa' });
  }
}

async function downloadTemplate(req, res) {
  try {
    const buffer = generateStudentTemplateBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename=Template_Data_Siswa_SMP3.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('downloadTemplate error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengunduh template Excel' });
  }
}

async function uploadExcel(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Berkas Excel wajib diunggah' });
    }

    const result = await parseAndImportStudents(req.file.buffer);
    return res.json({
      success: true,
      message: `Impor berhasil: ${result.successCount} siswa ditambahkan, ${result.skippedDuplicates} duplikat dilewati.`,
      result,
    });
  } catch (error) {
    console.error('uploadExcel error:', error);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ success: false, message: error.message || 'Gagal memproses berkas Excel' });
  }
}

async function getBarcodePng(req, res) {
  try {
    const { nisn } = req.params;
    if (!nisn) {
      return res.status(400).send('NISN diperlukan');
    }

    const buffer = await generateBarcodeBuffer(nisn);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    return res.send(buffer);
  } catch (error) {
    console.error('getBarcodePng error:', error);
    return res.status(500).send('Gagal menghasilkan barcode');
  }
}

async function downloadBarcodesZip(req, res) {
  try {
    const { className } = req.query;
    await streamBarcodesZip(res, className || null);
  } catch (error) {
    console.error('downloadBarcodesZip error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message || 'Gagal mengunduh zip barcode' });
    }
  }
}

async function getStudentCardPng(req, res) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    const buffer = await generateStudentCardPng(student);
    const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="Kartu_Barcode_${student.nisn}_${safeName}.png"`);
    return res.send(buffer);
  } catch (error) {
    console.error('getStudentCardPng error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat kartu barcode siswa' });
  }
}

async function deleteAllStudents(req, res) {
  try {
    const deleted = await prisma.student.deleteMany({});
    return res.json({
      success: true,
      message: `Berhasil menghapus seluruh data siswa (${deleted.count} siswa)`,
      count: deleted.count,
    });
  } catch (error) {
    console.error('deleteAllStudents error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus seluruh data siswa' });
  }
}

async function deleteStudentsByClass(req, res) {
  try {
    const { className } = req.params;
    if (!className) {
      return res.status(400).json({ success: false, message: 'Nama kelas wajib diisi' });
    }

    const targetClass = String(className).trim().toUpperCase();
    const deleted = await prisma.student.deleteMany({
      where: { className: targetClass },
    });

    return res.json({
      success: true,
      message: `Berhasil menghapus seluruh data siswa kelas ${targetClass} (${deleted.count} siswa)`,
      count: deleted.count,
    });
  } catch (error) {
    console.error('deleteStudentsByClass error:', error);
    return res.status(500).json({ success: false, message: `Gagal menghapus siswa kelas ${req.params.className}` });
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  deleteAllStudents,
  deleteStudentsByClass,
  downloadTemplate,
  uploadExcel,
  getBarcodePng,
  getStudentCardPng,
  downloadBarcodesZip,
};
