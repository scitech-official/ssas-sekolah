import React, { useState, useEffect } from 'react';
import api, { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  UserPlus, 
  QrCode, 
  Search, 
  Printer, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Download,
  Users,
  MessageSquare
} from 'lucide-react';

export default function DataSiswa() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('7');
  const [selectedClass, setSelectedClass] = useState('7-A');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Modals state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({ id: '', nisn: '', name: '', className: '7-A', parentWaNumber: '' });
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);

  const [printModalStudent, setPrintModalStudent] = useState(null);

  // Central ConfirmModal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    variant: 'primary',
    isLoading: false,
    onConfirm: () => {},
  });

  const classes = [];
  ['7', '8', '9'].forEach(lvl => {
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(sec => {
      classes.push(`${lvl}-${sec}`);
    });
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students?className=${selectedClass}&search=${search}&page=${pagination.page}&limit=50`);
      if (res.data.success) {
        setStudents(res.data.data || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, search, pagination.page]);

  const handleLevelChange = (lvl) => {
    setSelectedLevel(lvl);
    setSelectedClass(`${lvl}-A`);
  };

  // Trigger: Download Barcode Siswa Massal (ZIP)
  const triggerDownloadMassBarcode = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Download Barcode Siswa Massal (ZIP)',
      message: `Unduh seluruh Kartu Barcode Siswa Kelas ${selectedClass} dalam satu arsip ZIP?\n\nFile ZIP berisi gambar PNG kartu identitas lengkap (berisi Nama, Kelas, NISN, dan Barcode) yang siap dicetak langsung.`,
      variant: 'primary',
      confirmText: 'Unduh File ZIP',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setZipLoading(true);
        setTimeout(() => {
          window.open(getApiUrl(`/api/students/barcodes/zip?className=${selectedClass}`), '_blank');
          setZipLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }, 700);
      },
    });
  };

  // Trigger: Download Barcode Siswa Tunggal (PNG)
  const triggerDownloadSingleBarcode = (student) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Download Kartu Barcode (PNG)',
      message: `Unduh Kartu Identitas & Barcode berformat PNG untuk ananda:\n\n• Nama: ${student.name}\n• Kelas: ${student.className}\n• NISN: ${student.nisn}\n\nGambar PNG mencakup Kop Resmi Sekolah, Nama Siswa, Kelas, NISN, dan Barcode 1D Code-128.`,
      variant: 'primary',
      confirmText: 'Unduh Kartu PNG',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        window.open(getApiUrl(`/api/students/${student.id}/card-png`), '_blank');
      },
    });
  };

  // Trigger: Hapus Siswa Tunggal
  const triggerDeleteStudent = (student) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Data Siswa',
      message: `Apakah Anda yakin ingin menghapus siswa "${student.name}" (NISN: ${student.nisn})?\n\nTindakan ini permanen dan seluruh riwayat presensinya akan terhapus.`,
      variant: 'danger',
      confirmText: 'Hapus Siswa',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/students/${student.id}`);
          fetchStudents();
          toast.success(`Siswa "${student.name}" berhasil dihapus.`);
        } catch (err) {
          toast.error('Gagal menghapus siswa');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Trigger: Hapus Siswa Per Kelas
  const triggerDeleteClassStudents = () => {
    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi Hapus Siswa Kelas ${selectedClass}`,
      message: `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SELURUH SISWA pada Kelas ${selectedClass}?\n\nSeluruh data siswa di rombel ini beserta riwayat absensinya akan dihapus permanen.`,
      variant: 'danger',
      confirmText: `Hapus Siswa Kelas ${selectedClass}`,
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await api.delete(`/students/bulk/class/${selectedClass}`);
          toast.success(res.data.message || `Siswa kelas ${selectedClass} berhasil dihapus`);
          fetchStudents();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menghapus siswa kelas ini');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Trigger: Hapus Semua Siswa
  const triggerDeleteAllStudents = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Seluruh Master Data Siswa',
      message: 'PERINGATAN KRUSIAL: Apakah Anda yakin ingin MENGHAPUS SELURUH DATA SISWA DI SEKOLAH?\n\nSeluruh database siswa dan riwayat presensi akan dikosongkan. Tindakan ini TIDAK DAPAT DIBATALKAN!',
      variant: 'danger',
      confirmText: 'Hapus Seluruh Data Siswa',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await api.delete('/students/bulk/all');
          toast.success(res.data.message || 'Seluruh data siswa berhasil dihapus');
          fetchStudents();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menghapus seluruh data siswa');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Trigger: Tambah / Edit Siswa
  const triggerSaveStudent = (e) => {
    e.preventDefault();
    if (!currentStudent.name || !currentStudent.nisn || !currentStudent.className) {
      toast.warning('Nama, NISN, dan Kelas wajib diisi');
      return;
    }

    if (isEditing) {
      setConfirmModal({
        isOpen: true,
        title: 'Konfirmasi Edit Data Siswa',
        message: `Simpan pembaruan data untuk siswa "${currentStudent.name}" (NISN: ${currentStudent.nisn})?`,
        variant: 'warning',
        confirmText: 'Simpan Pembaruan',
        cancelText: 'Batal',
        isLoading: false,
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          try {
            await api.put(`/students/${currentStudent.id}`, currentStudent);
            setStudentModalOpen(false);
            fetchStudents();
            toast.success('Data siswa berhasil diperbarui!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui siswa');
          } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Konfirmasi Tambah Siswa Baru',
        message: `Tambahkan siswa baru ke database?\n\n• Nama: ${currentStudent.name}\n• NISN: ${currentStudent.nisn}\n• Kelas: ${currentStudent.className}\n• WA Wali: ${currentStudent.parentWaNumber || '-'}`,
        variant: 'primary',
        confirmText: 'Tambah Siswa',
        cancelText: 'Batal',
        isLoading: false,
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          try {
            await api.post('/students', currentStudent);
            setStudentModalOpen(false);
            fetchStudents();
            toast.success('Siswa baru berhasil ditambahkan!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menambahkan siswa');
          } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
      });
    }
  };

  // Trigger: Upload Excel
  const triggerUploadExcel = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Upload Template Excel',
      message: `Mulai memproses impor data siswa dari berkas "${uploadFile.name}"? Siswa baru akan didaftarkan dan data duplikat akan dilewati.`,
      variant: 'primary',
      confirmText: 'Mulai Impor',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const formData = new FormData();
        formData.append('file', uploadFile);
        setUploading(true);
        setUploadResult(null);

        try {
          const res = await api.post('/students/upload-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data.success) {
            setUploadResult(res.data.result);
            fetchStudents();
            toast.success('Impor data siswa dari Excel berhasil!');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal mengunggah file Excel');
        } finally {
          setUploading(false);
        }
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Filter and Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Level and Rombel Selector */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PEMILIH TINGKAT KELAS
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
              Aktif: Kelas {selectedLevel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { lvl: '7', label: 'KELAS TUJUH' },
              { lvl: '8', label: 'KELAS DELAPAN' },
              { lvl: '9', label: 'KELAS SEMBILAN' },
            ].map((item) => (
              <button
                key={item.lvl}
                onClick={() => handleLevelChange(item.lvl)}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center transition-all cursor-pointer border ${
                  selectedLevel === item.lvl
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xl sm:text-2xl font-black font-mono leading-none">{item.lvl}</div>
                <div className={`text-[9px] sm:text-[10px] font-bold mt-1.5 ${selectedLevel === item.lvl ? 'text-slate-300' : 'text-slate-400'}`}>
                  {item.label}
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              PILIH ROMBONGAN BELAJAR (ROMBEL)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {classes
                .filter((c) => c.startsWith(selectedLevel))
                .map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls} (Rombel {cls.split('-')[1]})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Right: Action Buttons Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AKSI KELOLA DATA SISWA
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Database Terhubung</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Template Excel */}
            <a
              href={getApiUrl('/api/students/template')}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex items-center space-x-3 text-emerald-800 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-900 leading-tight">Download Template Excel</div>
                <div className="text-[10px] text-emerald-700">Format standar master siswa</div>
              </div>
            </a>

            {/* Upload Template Excel */}
            <button
              onClick={() => {
                setUploadFile(null);
                setUploadResult(null);
                setUploadModalOpen(true);
              }}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-all flex items-center space-x-3 text-blue-800 cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900 leading-tight">Upload Template Excel</div>
                <div className="text-[10px] text-blue-700">Impor massal dari file .xlsx</div>
              </div>
            </button>

            {/* Tambah Siswa Manual */}
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentStudent({ id: '', nisn: '', name: '', className: selectedClass, parentWaNumber: '' });
                setStudentModalOpen(true);
              }}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-all flex items-center space-x-3 text-indigo-800 cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-900 leading-tight">Tambah Siswa Manual</div>
                <div className="text-[10px] text-indigo-700">Form input profil mandiri</div>
              </div>
            </button>

            {/* Download Barcode Siswa (Massal ZIP) */}
            <button
              onClick={triggerDownloadMassBarcode}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all flex items-center space-x-3 text-white cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Download Barcode Siswa (ZIP)</div>
                <div className="text-[10px] text-slate-300">File PNG kartu lengkap (.zip)</div>
              </div>
            </button>
          </div>

          {/* Danger Actions Row: Hapus Data Per Kelas & Hapus Semua Data */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-semibold text-slate-600">Aksi Hapus Massal:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerDeleteClassStudents}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                title={`Hapus seluruh siswa hanya pada kelas ${selectedClass}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Siswa Rombel {selectedClass}</span>
              </button>
              <button
                type="button"
                onClick={triggerDeleteAllStudents}
                className="px-3.5 py-1.5 rounded-xl border border-red-600 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm shadow-red-500/25 cursor-pointer"
                title="Hapus seluruh master data siswa di sekolah"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Siswa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search Bar Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-800">
                Daftar Siswa Terdaftar
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
                {pagination.total} Siswa Terpilih
              </span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Semua barcode siap cetak</span>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa dari nama atau NISN..."
              className="pl-9 pr-3 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">NAMA SISWA</th>
                <th className="py-3.5 px-6">NISN & BARCODE</th>
                <th className="py-3.5 px-4 text-center">KELAS</th>
                <th className="py-3.5 px-6">NO ORTU (WHATSAPP)</th>
                <th className="py-3.5 px-6 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200"></div>
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-200 rounded font-mono"></div>
                        <div className="h-5 w-28 bg-slate-100 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-12 bg-slate-200 rounded-full mx-auto"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-28 bg-slate-200 rounded font-mono"></div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-7 w-20 bg-slate-200 rounded-lg mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    Belum ada siswa pada rombel ini.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const initials = student.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                            <div className="text-[10px] text-slate-400">Siswa Reguler</div>
                          </div>
                        </div>
                      </td>

                      {/* NISN & Barcode Visual */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-800 text-xs tracking-wider">
                            {student.nisn}
                          </span>
                          <img
                            src={getApiUrl(`/api/students/barcode/${student.nisn}`)}
                            alt={student.nisn}
                            className="h-9 max-w-[140px] object-contain py-0.5 filter contrast-125"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs">
                          {student.className}
                        </span>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-6">
                        <a
                          href={`https://wa.me/${student.parentWaNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-mono text-xs font-semibold hover:underline"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+{student.parentWaNumber}</span>
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="inline-flex items-center space-x-1">
                          {/* 1. Download Kartu Barcode (PNG) */}
                          <button
                            onClick={() => triggerDownloadSingleBarcode(student)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Download Kartu Barcode (PNG)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* 2. Lihat / Cetak Kartu Barcode */}
                          <button
                            onClick={() => setPrintModalStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lihat / Cetak Kartu Barcode"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* 3. Edit Data Siswa */}
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setCurrentStudent(student);
                              setStudentModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* 4. Hapus Data Siswa */}
                          <button
                            onClick={() => triggerDeleteStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {students.length} siswa pada Kelas {selectedClass}</span>
        </div>
      </div>

      {/* Modal 1: Tambah / Edit Siswa Manual */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isEditing ? 'Edit Profil Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setStudentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={triggerSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  required
                  value={currentStudent.nisn}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, nisn: e.target.value })}
                  placeholder="Contoh: 0081293841"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={currentStudent.name}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                  placeholder="Nama lengkap siswa"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kelas / Rombel
                  </label>
                  <select
                    value={currentStudent.className}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, className: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  >
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    No WA Orang Tua
                  </label>
                  <input
                    type="text"
                    value={currentStudent.parentWaNumber}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, parentWaNumber: e.target.value })}
                    placeholder="08123456789"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {isEditing ? 'Simpan Pembaruan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Upload Excel Impor Massal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Unggah Berkas Master Excel Siswa</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={triggerUploadExcel} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Pastikan format kolom berkas Excel sesuai dengan template (Kolom: NISN, Nama Siswa, Kelas, No WA Orang Tua).
              </p>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <input
                  type="file"
                  required
                  accept=".xlsx, .xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {uploading && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3 text-xs text-blue-900 animate-fadeIn">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <div>
                    <div className="font-bold">Sedang memproses dan mengimpor file Excel...</div>
                    <div className="text-[11px] text-blue-700">Mohon tunggu, sedang memverifikasi NISN dan data rombel siswa.</div>
                  </div>
                </div>
              )}

              {uploadResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hasil Pemrosesan:</span>
                  </div>
                  <div>• {uploadResult.successCount} siswa berhasil ditambahkan.</div>
                  <div>• {uploadResult.skippedDuplicates} siswa duplikat dilewati.</div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses Impor...</span>
                    </>
                  ) : (
                    <span>Mulai Impor Siswa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Print Preview Barcode Kartu Pelajar (PNG Card) */}
      {printModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-center p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 text-left">
                <img src="/logo.png" alt="Logo SMPN 3 Jember" className="w-10 h-10 object-contain rounded-lg p-0.5 border border-slate-200" />
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    KARTU IDENTITAS PRESENSI SISWA (PNG)
                  </div>
                  <div className="font-extrabold text-base text-slate-800">
                    {printModalStudent.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPrintModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Generated PNG Card Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <img
                src={getApiUrl(`/api/students/${printModalStudent.id}/card-png`)}
                alt={`Kartu ${printModalStudent.name}`}
                className="w-full max-w-[480px] rounded-xl shadow-sm border border-slate-300"
              />
              <div className="text-[11px] text-slate-500 mt-2">
                Format gambar PNG resmi memuat Logo Sekolah SMP Negeri 3 Jember, Nama, Kelas, NISN, dan Barcode 1D.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintModalStudent(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => triggerDownloadSingleBarcode(printModalStudent)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Kartu (PNG)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Cetak via dialog printer browser"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
