const XLSX = require('xlsx');
const prisma = require('../config/prisma');

/**
 * Generate standard student import Excel template
 */
function generateStudentTemplateBuffer() {
  const sampleData = [
    {
      'NISN': '0081293841',
      'Nama Siswa': 'Aditya Pratama Putra',
      'Kelas': '7-A',
      'No WA Orang Tua': '081234567801',
    },
    {
      'NISN': '0082491029',
      'Nama Siswa': 'Alya Widya Kusuma',
      'Kelas': '7-A',
      'No WA Orang Tua': '081234567802',
    },
    {
      'NISN': '0084392019',
      'Nama Siswa': 'Bagus Fajar Ramadhan',
      'Kelas': '7-B',
      'No WA Orang Tua': '081234567803',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // NISN
    { wch: 30 }, // Nama Siswa
    { wch: 12 }, // Kelas
    { wch: 22 }, // No WA
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse uploaded Excel file and import students with duplicate NISN validation
 */
async function parseAndImportStudents(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  if (!rows || rows.length === 0) {
    throw new Error('Berkas Excel kosong atau tidak memiliki baris data.');
  }

  const results = {
    total: rows.length,
    successCount: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row index

    const rawNisn = row['NISN'] || row['nisn'] || row['Nisn'];
    const rawName = row['Nama Siswa'] || row['Nama'] || row['name'] || row['nama'] || row['Name'];
    const rawClass = row['Kelas'] || row['Rombel'] || row['class_name'] || row['kelas'] || row['className'] || row['ClassName'] || row['Class'] || row['class'];
    const rawWa = row['No WA Orang Tua'] || row['No WA'] || row['WhatsApp'] || row['parent_wa_number'] || row['parentWaNumber'] || row['ParentWaNumber'] || row['telepon'] || row['wa'];

    if (!rawNisn || !rawName || !rawClass) {
      results.errors.push(`Baris ${rowNum}: NISN, Nama, dan Kelas wajib diisi.`);
      continue;
    }

    const nisn = String(rawNisn).trim();
    const name = String(rawName).trim();
    const className = String(rawClass).trim().toUpperCase();
    let wa = String(rawWa || '').trim().replace(/[^0-9]/g, '');
    if (wa.startsWith('0')) {
      wa = '62' + wa.substring(1);
    } else if (wa && !wa.startsWith('62')) {
      wa = '62' + wa;
    }
    if (!wa) wa = '6280000000000';

    try {
      // Check existing NISN
      const existing = await prisma.student.findUnique({ where: { nisn } });
      if (existing) {
        results.skippedDuplicates++;
        results.errors.push(`Baris ${rowNum}: NISN ${nisn} (${name}) sudah terdaftar (dilewati).`);
        continue;
      }

      await prisma.student.create({
        data: {
          nisn,
          name,
          className,
          parentWaNumber: wa,
        },
      });
      results.successCount++;
    } catch (err) {
      results.errors.push(`Baris ${rowNum}: Gagal menyimpan (${err.message}).`);
    }
  }

  return results;
}

/**
 * Export attendance records to Excel
 */
async function exportAttendanceToExcel({ date, className, startDate, endDate }) {
  const where = {};
  if (startDate && endDate) {
    if (startDate === endDate) {
      where.date = startDate;
    } else {
      where.date = { gte: startDate, lte: endDate };
    }
  } else if (startDate) {
    where.date = { gte: startDate };
  } else if (endDate) {
    where.date = { lte: endDate };
  } else if (date) {
    where.date = date;
  }

  if (className) where.student = { className };

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: true,
    },
    orderBy: [
      { date: 'desc' },
      { student: { className: 'asc' } },
      { student: { name: 'asc' } },
    ],
  });

  // Prevent CSV/Formula Injection (=, +, -, @)
  const sanitizeFormula = (val) => {
    if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
      return `'${val}`;
    }
    return val;
  };

  const data = attendances.map((item, index) => ({
    'No': index + 1,
    'Tanggal': item.date,
    'Kelas': item.student?.className || '-',
    'NISN': item.student?.nisn || '-',
    'Nama Siswa': sanitizeFormula(item.student?.name || '-'),
    'Status Presensi': item.status,
    'Jam Masuk': item.timeIn || '-',
    'Keterangan / Catatan': sanitizeFormula(item.note || '-'),
    'Status Notif WA': item.waStatus || (item.waSent ? 'Terkirim' : '-'),
  }));

  // Format Indonesian date helper
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const formatIndo = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    }
    return dStr;
  };

  let periodText = 'Semua Periode';
  if (startDate && endDate) {
    periodText = startDate === endDate ? formatIndo(startDate) : `${formatIndo(startDate)} s/d ${formatIndo(endDate)}`;
  } else if (startDate) {
    periodText = `Mulai ${formatIndo(startDate)}`;
  } else if (endDate) {
    periodText = `Sampai ${formatIndo(endDate)}`;
  } else if (date) {
    periodText = formatIndo(date);
  }

  // 1. Build Kop Surat Kedinasan Rows (5 rows)
  const kopRows = [
    ['PEMERINTAH KABUPATEN JEMBER - DINAS PENDIDIKAN'],
    ['UPTD SMP NEGERI 3 JEMBER'],
    ['LAPORAN REKAPITULASI PRESENSI SISWA'],
    [`Kelas: ${className || 'Semua Kelas'} | Periode: ${periodText} | Semester: Ganjil 2026/2027`],
    [], // Baris kosong pembatas
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(kopRows);

  // 2. Add Table Data starting from row A6
  if (data.length > 0) {
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A6' });
  } else {
    XLSX.utils.sheet_add_aoa(worksheet, [['(Tidak ada data presensi pada rentang waktu yang dipilih)']], { origin: 'A6' });
  }

  // 3. Add Official Signature Blocks
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayIndo = formatIndo(todayStr);
  const footerStartRow = 6 + Math.max(data.length, 1) + 2;

  const footerRows = [
    [],
    ['Mengetahui,', '', '', '', '', '', '', 'Jember, ' + todayIndo],
    ['Kepala SMP Negeri 3 Jember', '', '', '', '', '', '', 'Guru Piket / Petugas Presensi'],
    [],
    [],
    ['( ..................................... )', '', '', '', '', '', '', '( ..................................... )'],
    ['NIP. ..................................', '', '', '', '', '', '', 'NIP. ..................................'],
  ];

  XLSX.utils.sheet_add_aoa(worksheet, footerRows, { origin: `A${footerStartRow}` });

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
  ];

  const sheetTitle = className ? `Absensi ${className}` : 'Rekapitulasi Absensi';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 31));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  generateStudentTemplateBuffer,
  parseAndImportStudents,
  exportAttendanceToExcel,
};
