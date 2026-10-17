import React, { useState, useEffect } from 'react';
import api, { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Edit3, 
  X, 
  MessageSquare,
  UserCheck,
  Printer
} from 'lucide-react';

export default function AbsensiPerkelas({ initialClass = '7-A' }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [selectedLevel, setSelectedLevel] = useState(initialClass.split('-')[0] || '7');
  const [selectedSection, setSelectedSection] = useState(initialClass.split('-')[1] || 'A');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [classData, setClassData] = useState({
    stats: { total: 0, hadir: 0, telat: 0, izinSakit: 0, alpa: 0 },
    students: [],
  });

  // Edit Modal State (Admin)
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStatus, setEditStatus] = useState('HADIR');
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Custom Date Range Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(selectedDate);
  const [exportEndDate, setExportEndDate] = useState(selectedDate);
  const [exportMode, setExportMode] = useState('custom'); // 'custom' | 'all'
  const [exportLoading, setExportLoading] = useState(false);

  const currentClassName = `${selectedLevel}-${selectedSection}`;
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  const fetchClassAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/class/${currentClassName}?date=${selectedDate}`);
      if (res.data.success) {
        setClassData({
          stats: res.data.stats,
          students: res.data.students || [],
        });
      }
    } catch (err) {
      console.error('Fetch class attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAttendance();
  }, [currentClassName, selectedDate]);

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditStatus(student.status === 'BELUM_ABSEN' ? 'HADIR' : student.status);
    setEditNote(student.note || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Edit Kehadiran Siswa',
      message: `Ubah status presensi siswa ${editingStudent.name} (NISN: ${editingStudent.nisn}) menjadi "${editStatus}" pada tanggal ${selectedDate}?\n\nCatatan: "${editNote || '-'}"`,
      variant: 'warning',
      confirmText: 'Simpan Koreksi',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setSavingEdit(true);
        try {
          const res = await api.post('/attendance/manual', {
            studentId: editingStudent.studentId,
            status: editStatus,
            note: editNote,
            date: selectedDate,
          });

          if (res.data.success) {
            setEditingStudent(null);
            fetchClassAttendance();
            toast.success('Status presensi siswa berhasil diperbarui!');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal mengubah status presensi');
        } finally {
          setSavingEdit(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleOpenExportModal = () => {
    setExportStartDate(selectedDate);
    setExportEndDate(selectedDate);
    setExportMode('custom');
    setShowExportModal(true);
  };

  const handleExecuteExport = (e) => {
    e.preventDefault();
    if (exportMode === 'custom') {
      if (exportStartDate > exportEndDate) {
        toast.warning('Tanggal Mulai tidak boleh lebih besar dari Tanggal Selesai.');
        return;
      }
      setExportLoading(true);
      setTimeout(() => {
        window.open(getApiUrl(`/api/attendance/export-excel?className=${currentClassName}&startDate=${exportStartDate}&endDate=${exportEndDate}`), '_blank');
        setExportLoading(false);
        setShowExportModal(false);
      }, 700);
    } else {
      setExportLoading(true);
      setTimeout(() => {
        window.open(getApiUrl(`/api/attendance/export-excel?className=${currentClassName}`), '_blank');
        setExportLoading(false);
        setShowExportModal(false);
      }, 700);
    }
  };

  // Filter students by search
  const filteredStudents = classData.students.filter((s) => {
    return (
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn.includes(search)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">
            PORTAL {isAdmin ? 'ADMIN' : 'REGULER'}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Monitoring Absensi Per Kelas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan detail presensi siswa dan koreksi status kehadiran per rombongan belajar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none font-mono text-xs font-semibold"
            />
          </div>

          <button
            onClick={handleOpenExportModal}
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>

          <button
            id="btn-cetak-rapor-pdf"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor Presensi (PDF)</span>
          </button>
        </div>
      </div>

      {/* Rombel Selector Navigation Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Pilih Rombongan Belajar (Rombel)</span>
          </div>
          <span className="text-xs text-slate-400">Klik kelas di bawah untuk memuat data absensi murid</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          {/* Tingkat Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">TINGKAT:</span>
            {['7', '8', '9'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kelas {lvl}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

          {/* Section Chips */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">ROMBEL:</span>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Class Statistics 4-Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">HADIR TEPAT WAKTU</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-emerald-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-slate-800 font-mono">
              {classData.stats.hadir} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
          )}
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {classData.stats.total > 0 ? ((classData.stats.hadir / classData.stats.total) * 100).toFixed(1) : 0}% dari total rombel
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">TERLAMBAT</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-amber-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-slate-800 font-mono">
              {classData.stats.telat} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
          )}
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Hadir lewat 07:00 WIB</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-white to-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">IZIN / SAKIT</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-blue-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-slate-800 font-mono">
              {classData.stats.izinSakit} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
          )}
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Surat / Konfirmasi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200/80 bg-gradient-to-b from-white to-red-50/20 shadow-sm">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">TANPA KETERANGAN</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-red-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-slate-800 font-mono">
              {classData.stats.alpa} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
          )}
          <div className="text-[11px] text-red-600 font-semibold mt-1">
            {classData.stats.alpa === 0 ? 'Nihil (Semua Terdata)' : 'Alpa Harian'}
          </div>
        </div>
      </div>

      {/* Student List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-800">
                Daftar Kehadiran Siswa Kelas {currentClassName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
                {classData.stats.total} SISWA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data divalidasi langsung oleh sistem pemindai barcode kartu pelajar gerbang depan
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">NO</th>
                <th className="py-3.5 px-6">NISN</th>
                <th className="py-3.5 px-6">NAMA LENGKAP SISWA</th>
                <th className="py-3.5 px-6">JAM PRESENSI</th>
                <th className="py-3.5 px-6">STATUS KEHADIRAN</th>
                {isAdmin && <th className="py-3.5 px-6 text-center">EDIT KEHADIRAN</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-6 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-200 rounded font-mono"></div></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200"></div>
                        <div className="h-4 w-36 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-center">
                        <div className="h-6 w-20 bg-slate-200 rounded-lg mx-auto"></div>
                      </td>
                    )}
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-slate-400">
                    Tidak ada siswa ditemukan di kelas ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item, idx) => {
                  const initials = item.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  let statusBadge = null;
                  if (item.status === 'HADIR') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Hadir</span>
                      </span>
                    );
                  } else if (item.status === 'TELAT') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Terlambat</span>
                      </span>
                    );
                  } else if (item.status === 'IZIN') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span>Izin</span>
                      </span>
                    );
                  } else if (item.status === 'SAKIT') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                        <AlertCircle className="w-3 h-3 text-indigo-600" />
                        <span>Sakit</span>
                      </span>
                    );
                  } else if (item.status === 'ALPA') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span>Alpa</span>
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-xs">
                        <span>Belum Absen</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={item.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                        {item.nisn}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            {item.note && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                Catatan: {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                        {item.timeIn ? `${item.timeIn} WIB` : '-- : -- : --'}
                      </td>
                      <td className="py-3.5 px-6">{statusBadge}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-6 text-center">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kehadiran"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan 1 - {filteredStudents.length} dari {classData.stats.total} siswa terdaftar di Kelas {currentClassName}</span>
        </div>
      </div>

      {/* Edit Kehadiran Modal for Admin */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Presensi Siswa</h3>
                <p className="text-xs text-slate-400">
                  {editingStudent.name} ({editingStudent.className} - {editingStudent.nisn})
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['HADIR', 'TELAT', 'IZIN', 'SAKIT', 'ALPA'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan / Alasan
                </label>
                <textarea
                  rows="3"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Keterangan dispensasi atau alasan perubahan status..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Date Range Export Excel Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
            <div className="p-6 sm:p-7">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Unduh Rekap Absensi Kelas {currentClassName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih rentang tanggal kustom untuk ekspor format Excel (.xlsx)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleExecuteExport} className="space-y-5 pt-4">
                {/* Presets Bar */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    PILIHAN CEPAT RENTANG WAKTU:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExportStartDate(selectedDate);
                        setExportEndDate(selectedDate);
                        setExportMode('custom');
                      }}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        exportMode === 'custom' && exportStartDate === selectedDate && exportEndDate === selectedDate
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(selectedDate + 'T00:00:00');
                        d.setDate(d.getDate() - 6);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        setExportStartDate(`${y}-${m}-${day}`);
                        setExportEndDate(selectedDate);
                        setExportMode('custom');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      7 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = selectedDate.split('-');
                        setExportStartDate(`${y}-${m}-01`);
                        setExportEndDate(selectedDate);
                        setExportMode('custom');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportMode('all')}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        exportMode === 'all'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Semua Tanggal
                    </button>
                  </div>
                </div>

                {exportMode === 'custom' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        DARI TANGGAL (MULAI):
                      </label>
                      <div className="flex items-center space-x-2 bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-medium text-slate-800 focus-within:ring-2 focus-within:ring-emerald-500">
                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <input
                          type="date"
                          value={exportStartDate}
                          onChange={(e) => setExportStartDate(e.target.value)}
                          required
                          className="bg-transparent focus:outline-none font-mono text-xs font-semibold w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        SAMPAI TANGGAL (SELESAI):
                      </label>
                      <div className="flex items-center space-x-2 bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-medium text-slate-800 focus-within:ring-2 focus-within:ring-emerald-500">
                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <input
                          type="date"
                          value={exportEndDate}
                          onChange={(e) => setExportEndDate(e.target.value)}
                          required
                          className="bg-transparent focus:outline-none font-mono text-xs font-semibold w-full"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-800 leading-relaxed">
                    Mode <strong>Semua Tanggal</strong> dipilih. Sistem akan mengekspor seluruh rekaman absensi siswa <strong>Kelas {currentClassName}</strong> dari awal tahun ajaran hingga saat ini.
                  </div>
                )}

                {/* Summary Info */}
                <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  📄 Berkas Excel akan memuat: No, Tanggal, Kelas, NISN, Nama Siswa, Status Presensi, Jam Masuk, Catatan/Keterangan, dan Status Notifikasi WhatsApp.
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={exportLoading}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {exportLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyiapkan Berkas Excel...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Unduh Berkas Excel</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak Rapor Absensi Bulanan Format PDF */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Action Header (Excluded from Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2.5">
                <Printer className="w-5 h-5 text-blue-400" />
                <span className="font-extrabold text-sm sm:text-base">
                  Pratinjau Cetak Rapor Presensi Siswa ({currentClassName})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper Area */}
            <div id="printable-rapor" className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 text-xs">
              {/* Kop Surat Resmi */}
              <div className="flex items-center space-x-4 border-b-2 border-slate-900 pb-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="Logo SMPN 3 Jember" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
                <div className="text-center flex-1">
                  <div className="font-bold text-xs sm:text-sm tracking-wider uppercase text-slate-700">
                    PEMERINTAH KABUPATEN JEMBER — DINAS PENDIDIKAN
                  </div>
                  <div className="font-black text-base sm:text-xl tracking-tight text-slate-950 uppercase">
                    UPTD SMP NEGERI 3 JEMBER
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
                    Jalan Jawa No. 58 Jember • Telp. (0331) 337582 • Jawa Timur
                  </div>
                </div>
              </div>

              {/* Title & Document Meta */}
              <div className="text-center mb-5">
                <h2 className="font-black text-sm sm:text-base uppercase tracking-wider underline">
                  LAPORAN REKAPITULASI PRESENSI SISWA
                </h2>
                <div className="text-[11px] text-slate-600 font-mono mt-1 flex items-center justify-center space-x-3">
                  <span>KELAS: <strong>{currentClassName}</strong></span>
                  <span>•</span>
                  <span>TANGGAL: <strong>{selectedDate}</strong></span>
                  <span>•</span>
                  <span>SEMESTER: <strong>GANJIL 2026/2027</strong></span>
                </div>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-5 gap-2 text-center mb-5 font-mono text-[11px]">
                <div className="p-2 border border-slate-300 rounded-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Total Siswa</div>
                  <div className="font-bold text-slate-800 text-sm">{classData.stats.total}</div>
                </div>
                <div className="p-2 border border-emerald-300 bg-emerald-50/50 rounded-lg">
                  <div className="text-emerald-700 text-[10px] uppercase font-bold">Hadir Tepat</div>
                  <div className="font-bold text-emerald-800 text-sm">{classData.stats.hadir}</div>
                </div>
                <div className="p-2 border border-amber-300 bg-amber-50/50 rounded-lg">
                  <div className="text-amber-700 text-[10px] uppercase font-bold">Terlambat</div>
                  <div className="font-bold text-amber-800 text-sm">{classData.stats.telat}</div>
                </div>
                <div className="p-2 border border-blue-300 bg-blue-50/50 rounded-lg">
                  <div className="text-blue-700 text-[10px] uppercase font-bold">Izin / Sakit</div>
                  <div className="font-bold text-blue-800 text-sm">{classData.stats.izinSakit}</div>
                </div>
                <div className="p-2 border border-rose-300 bg-rose-50/50 rounded-lg">
                  <div className="text-rose-700 text-[10px] uppercase font-bold">Alpa</div>
                  <div className="font-bold text-rose-800 text-sm">{classData.stats.alpa}</div>
                </div>
              </div>

              {/* Main Table */}
              <table className="w-full border-collapse border border-slate-300 text-[11px] mb-8">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-center border-b border-slate-300">
                    <th className="border border-slate-300 py-1.5 px-2 w-10">No</th>
                    <th className="border border-slate-300 py-1.5 px-3 w-28">NISN</th>
                    <th className="border border-slate-300 py-1.5 px-4 text-left">Nama Siswa</th>
                    <th className="border border-slate-300 py-1.5 px-3 w-24">Status</th>
                    <th className="border border-slate-300 py-1.5 px-3 w-24">Jam Masuk</th>
                    <th className="border border-slate-300 py-1.5 px-4 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.students.map((st, idx) => (
                    <tr key={st.studentId} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center font-mono">{st.nisn}</td>
                      <td className="border border-slate-300 py-1.5 px-4 font-semibold text-slate-900">{st.name}</td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center font-bold">
                        {st.status === 'HADIR' && <span className="text-emerald-700">HADIR</span>}
                        {st.status === 'TELAT' && <span className="text-amber-700">TELAT</span>}
                        {st.status === 'IZIN' && <span className="text-blue-700">IZIN</span>}
                        {st.status === 'SAKIT' && <span className="text-indigo-700">SAKIT</span>}
                        {st.status === 'ALPA' && <span className="text-rose-700">ALPA</span>}
                        {st.status === 'BELUM_ABSEN' && <span className="text-slate-400">BELUM</span>}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center font-mono">{st.timeIn || '-'}</td>
                      <td className="border border-slate-300 py-1.5 px-4 text-slate-600 truncate max-w-[200px]">{st.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6 pt-4 border-t border-slate-200">
                <div>
                  <div className="font-semibold text-slate-700">Mengetahui,</div>
                  <div className="font-bold text-slate-900">Kepala UPTD SMP Negeri 3 Jember</div>
                  <div className="h-16"></div>
                  <div className="font-bold underline text-slate-900">( ...................................................... )</div>
                  <div className="text-[10px] text-slate-500 font-mono">NIP. ...................................................</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Jember, {selectedDate}</div>
                  <div className="font-bold text-slate-900">Guru Piket / Wali Kelas {currentClassName}</div>
                  <div className="h-16"></div>
                  <div className="font-bold underline text-slate-900">( ...................................................... )</div>
                  <div className="text-[10px] text-slate-500 font-mono">NIP. ...................................................</div>
                </div>
              </div>
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
