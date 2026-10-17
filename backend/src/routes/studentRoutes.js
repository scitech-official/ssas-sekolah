const express = require('express');
const multer = require('multer');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAdmin } = require('../middleware/auth');

const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      const error = new Error('Hanya berkas spreadsheet Excel (.xlsx atau .xls) yang diperbolehkan.');
      error.statusCode = 400;
      return cb(error, false);
    }
    cb(null, true);
  },
});

// Public barcode and card access
router.get('/barcode/:nisn', studentController.getBarcodePng);
router.get('/:id/card-png', studentController.getStudentCardPng);

// Students query
router.get('/', studentController.getStudents);
router.get('/template', studentController.downloadTemplate);
router.get('/barcodes/zip', studentController.downloadBarcodesZip);

// Admin-only bulk delete endpoints (MUST be defined before /:id)
router.delete('/bulk/all', requireAdmin, studentController.deleteAllStudents);
router.delete('/bulk/class/:className', requireAdmin, studentController.deleteStudentsByClass);

// Single student operations
router.get('/:id', studentController.getStudentById);
router.post('/', requireAdmin, studentController.createStudent);
router.put('/:id', requireAdmin, studentController.updateStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);
router.post('/upload-excel', requireAdmin, upload.single('file'), studentController.uploadExcel);

module.exports = router;
