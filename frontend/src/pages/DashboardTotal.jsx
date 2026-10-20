import React, { useState, useEffect, useRef } from 'react';
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
  Play, 
  Search, 
  ArrowRight, 
  School, 
  Sparkles,
  ShieldCheck,
  UserCheck,
  Calendar,
  CalendarX,
  X,
  ChevronDown,
  Layers,
  ChevronRight,
  Save,
  Edit2,
  PieChart,
  TrendingUp,
  Sunrise,
  Sun,
  Sunset
} from 'lucide-react';

export default function DashboardTotal({ onStartKiosk, onSelectClass }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalHadir: 0,
    totalTelat: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpa: 0,
    totalRecorded: 0,
    attendanceRate: '0',
  });
  const [recentScans, setRecentScans] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [arrivalDistribution, setArrivalDistribution] = useState(null);
  const [settings, setSettings] = useState({
    timeStart: '06:00',
    timeLate: '07:00',
    timeAlpa: '08:00',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    schoolName: 'SMP NEGERI 3 JEMBER',
  });

  // Parameter Waktu Absen Editable state
  const [paramTimes, setParamTimes] = useState({
    timeStart: '06:00',
    timeLate: '07:00',
    timeAlpa: '08:00',
  });
  const [paramSaving, setParamSaving] = useState(false);
  const [paramSuccess, setParamSuccess] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Confirmation Modal State
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

  // Indonesian Day & Date formatting
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const currentDayName = dayNames[now.getDay()];
  const currentFormattedDate = `${currentDayName}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Holidays and Sunday detection
  const [holidays, setHolidays] = useState([]);
  const todayHoliday = holidays.find((h) => h.holidayDate === todayDateStr);
  const isTodayWfa = Boolean(todayHoliday && (todayHoliday.isWfa || (todayHoliday.description && todayHoliday.description.startsWith('[WFA]'))));
  const isOffDay = isSunday || (Boolean(todayHoliday) && !isTodayWfa);
  const offDayReason = isSunday 
    ? 'Hari Minggu (Libur Akhir Pekan)' 
    : (todayHoliday?.description || 'Hari Libur Khusus Sekolah');
  const wfaReason = isTodayWfa
    ? (todayHoliday?.description?.replace(/^\[WFA\]\s*/, '') || 'WFA / Belajar Dari Rumah')
    : '';

  // Fast permission quick form (Admin) & Searchable Combobox
  const [allStudents, setAllStudents] = useState([]);
  const [quickStudentId, setQuickStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);
  const [quickStatus, setQuickStatus] = useState('IZIN');
  const [quickNote, setQuickNote] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');

  // Close student search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Class table filters (Reguler)
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [classSearch, setClassSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, statsRes, setRes, holRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/stats-classes'),
        api.get('/settings'),
        api.get('/holidays'),
      ]);

      if (sumRes.data.success) {
        setMetrics(sumRes.data.metrics);
        setRecentScans(sumRes.data.recentScans || []);
        if (sumRes.data.arrivalDistribution) {
          setArrivalDistribution(sumRes.data.arrivalDistribution);
        }
      }
      if (statsRes.data.success) {
        setClassStats(statsRes.data.data || []);
      }
      if (setRes.data.success && setRes.data.data) {
        setSettings(setRes.data.data);
        setParamTimes({
          timeStart: setRes.data.data.timeStart || '06:00',
          timeLate: setRes.data.data.timeLate || '07:00',
          timeAlpa: setRes.data.data.timeAlpa || '08:00',
        });
      }
      if (holRes.data.success) {
        setHolidays(holRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load student list for quick permission if admin (fetch all active students)
    if (isAdmin) {
      api.get('/students?limit=1500').then((res) => {
        if (res.data.success) setAllStudents(res.data.data || []);
      });
    }
  }, [isAdmin]);

  // Trigger Confirmation: Start Absensi (Buka Kios - Khusus Admin)
  const triggerStartKiosk = () => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Mulai Sesi Absensi',
      message: 'Apakah Anda ingin membuka Layar Kios Scanner untuk memulai sesi pemindaian barcode presensi siswa di gerbang sekolah sekarang?',
      variant: 'primary',
      confirmText: 'Buka Layar Kios',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onStartKiosk();
      },
    });
  };

  // Trigger Confirmation: Cetak Excel (Semua)
  const triggerExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Cetak Rekap Excel',
      message: 'Apakah Anda yakin ingin mengunduh laporan rekapitulasi data absensi seluruh siswa hari ini dalam format Microsoft Excel (.xlsx)?',
      variant: 'success',
      confirmText: 'Unduh Excel',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setExportLoading(true);
        setTimeout(() => {
          window.open(getApiUrl('/api/attendance/export-excel'), '_blank');
          setExportLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }, 700);
      },
    });
  };

  // Trigger Confirmation: Tetapkan Dispensasi
  const triggerQuickPermission = (e) => {
    e.preventDefault();
    if (!quickStudentId) return;

    const targetStudent = allStudents.find((s) => s.id === quickStudentId);
    const studentLabel = targetStudent ? `${targetStudent.name} (Kelas ${targetStudent.className})` : 'siswa terpilih';

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Tetapkan Dispensasi',
      message: `Tetapkan status presensi menjadi "${quickStatus}" untuk ${studentLabel}?\n\nCatatan: "${quickNote || `Dispensasi ${quickStatus} dari Petugas Piket`}"`,
      variant: 'warning',
      confirmText: 'Tetapkan Sekarang',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await api.post('/attendance/manual', {
            studentId: quickStudentId,
            status: quickStatus,
            note: quickNote || `Dispensasi ${quickStatus} dari Petugas Piket`,
          });
          if (res.data.success) {
            setQuickSuccess(`Berhasil menetapkan ${quickStatus} untuk siswa.`);
            setQuickStudentId('');
            setStudentSearch('');
            setIsDropdownOpen(false);
            setQuickNote('');
            fetchData();
            setTimeout(() => setQuickSuccess(''), 4000);
            toast.success(`Berhasil menetapkan status ${quickStatus} siswa.`);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menyimpan dispensasi');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Selected student and filtered students for Quick Permission Searchable Combobox
  const selectedStudent = allStudents.find((s) => s.id === quickStudentId);

  const filteredStudents = allStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const query = studentSearch.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(query);
    const nisnMatch = s.nisn?.includes(query);
    const classMatch = s.className?.toLowerCase().includes(query);
    return nameMatch || nisnMatch || classMatch;
  });

  // Trigger Confirmation: Edit Parameter Waktu Absen
  const triggerSaveParamTimes = (e) => {
    if (e) e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Edit Parameter Waktu Absen',
      message: `Simpan pembaruan parameter waktu presensi sekolah berikut?\n\n• Jam Masuk: ${paramTimes.timeStart} WIB\n• Batas Tepat Waktu: ${paramTimes.timeLate} WIB\n• Cut-Off Alpa: ${paramTimes.timeAlpa} WIB\n\nPerubahan ini akan langsung mempengaruhi penentuan status HADIR, TELAT, dan cut-off otomatis ALPA.`,
      variant: 'primary',
      confirmText: 'Simpan Perubahan',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setParamSaving(true);
        try {
          const res = await api.put('/settings', {
            timeStart: paramTimes.timeStart,
            timeLate: paramTimes.timeLate,
            timeAlpa: paramTimes.timeAlpa,
          });
          if (res.data.success) {
            setSettings((prev) => ({
              ...prev,
              timeStart: paramTimes.timeStart,
              timeLate: paramTimes.timeLate,
              timeAlpa: paramTimes.timeAlpa,
            }));
            setParamSuccess('Parameter waktu berhasil diperbarui!');
            toast.success('Parameter waktu operasional berhasil diperbarui!');
            setTimeout(() => setParamSuccess(''), 4000);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal memperbarui parameter waktu');
        } finally {
          setParamSaving(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Filtered classes for table
  const filteredClasses = classStats.filter((c) => {
    const matchesLevel =
      selectedLevel === 'ALL' || c.className.startsWith(selectedLevel);
    const matchesSearch =
      !classSearch ||
      c.className.toLowerCase().includes(classSearch.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Dynamic Greeting based on operating hours or holidays
  const getDynamicGreeting = () => {
    if (isTodayWfa) {
      return {
        badge: 'MODE WFA / BDR AKTIF',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        title: `Hari Ini Pembelajaran Jarak Jauh (WFA) • ${wfaReason}`,
        desc: 'Seluruh siswa secara otomatis dicatat berstatus HADIR di sistem tanpa pengiriman notifikasi WhatsApp ke orang tua.',
      };
    }

    if (isOffDay) {
      return {
        badge: isSunday ? 'LIBUR AKHIR PEKAN (MINGGU)' : `LIBUR SEKOLAH • ${(todayHoliday?.description || 'LIBUR KHUSUS').toUpperCase()}`,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        title: `Hari Ini Sekolah Libur • ${offDayReason}`,
        desc: 'Tidak ada sesi kegiatan belajar mengajar atau presensi wajib. Sistem auto-alpa dinonaktifkan.',
      };
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) {
      return {
        badge: 'GERBANG DIBUKA (06.00 - 07.00)',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        title: 'Selamat Pagi, Petugas Piket • Gerbang Masuk Dibuka',
        desc: 'Pemindaian barcode kartu presensi siswa aktif di terminal gerbang masuk sekolah.',
      };
    } else if (hour >= 7 && hour < 12) {
      return {
        badge: 'KBM BERLANGSUNG (07.00 - 12.00)',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        title: 'Sesi Kegiatan Belajar Mengajar Berlangsung',
        desc: 'Siswa telah berada di ruang kelas. Presensi keterlambatan dan cut-off otomatis berjalan.',
      };
    } else {
      return {
        badge: 'SESI SELESAI (12.00+)',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        title: 'Rekapitulasi Kehadiran Hari Ini Selesai',
        desc: 'Laporan kehadiran seluruh kelas siap dievaluasi dan diunduh dalam format resmi.',
      };
    }
  };

  const greeting = getDynamicGreeting();

  // Donut Chart Calculations
  const donutSegmentsData = [
    { label: 'Hadir Tepat', value: metrics.totalHadir, color: '#10b981' },
    { label: 'Terlambat', value: metrics.totalTelat, color: '#f59e0b' },
    { label: 'Izin Resmi', value: metrics.totalIzin, color: '#3b82f6' },
    { label: 'Sakit', value: metrics.totalSakit, color: '#6366f1' },
    { label: 'Alpa', value: metrics.totalAlpa, color: '#f43f5e' },
  ].map((item) => {
    const total = metrics.totalRecorded || 1;
    const percent = ((item.value / total) * 100).toFixed(1);
    return { ...item, percent: isNaN(percent) ? '0.0' : percent };
  });

  const renderDonutSegments = () => {
    const circumference = 2 * Math.PI * 45; // ~282.74
    const total = metrics.totalRecorded || 1;
    let accumulatedOffset = 0;

    return donutSegmentsData.map((item, idx) => {
      if (item.value <= 0) return null;
      const segmentRatio = item.value / total;
      const strokeDasharray = `${segmentRatio * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += segmentRatio * circumference;

      return (
        <circle
          key={idx}
          cx="60"
          cy="60"
          r="45"
          fill="transparent"
          stroke={item.color}
          strokeWidth="14"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700"
        />
      );
    });
  };

  // Peak Arrival Curve / Bar Calculations
  const peakBins = arrivalDistribution || {
    '06.00-06.15': metrics.totalHadir > 0 ? Math.round(metrics.totalHadir * 0.15) : 0,
    '06.15-06.30': metrics.totalHadir > 0 ? Math.round(metrics.totalHadir * 0.40) : 0,
    '06.30-06.45': metrics.totalHadir > 0 ? Math.round(metrics.totalHadir * 0.30) : 0,
    '06.45-07.00': metrics.totalHadir > 0 ? Math.round(metrics.totalHadir * 0.10) : 0,
    '> 07.00': metrics.totalTelat || 0,
  };

  const peakEntries = Object.entries(peakBins);
  const maxPeakVal = Math.max(...peakEntries.map(([, v]) => v), 1);
  const peakIntervalName = peakEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max), peakEntries[0] || ['06.15-06.30', 0])[0];

  const renderPeakArrivalBars = () => {
    return peakEntries.map(([timeRange, count]) => {
      const heightPercent = Math.max((count / maxPeakVal) * 100, 8);
      const isPeak = timeRange === peakIntervalName && count > 0;

      return (
        <div key={timeRange} className="flex-1 flex flex-col items-center h-full justify-end group">
          <div className={`mb-1.5 text-[11px] font-mono font-bold transition-colors ${
            isPeak ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'
          }`}>
            {count}
          </div>
          <div className="w-full max-w-[46px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-32 relative">
            <div
              style={{ height: `${heightPercent}%` }}
              className={`w-full rounded-t-xl transition-all duration-700 ${
                isPeak
                  ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                  : 'bg-gradient-to-t from-slate-300 to-blue-400 group-hover:from-blue-500 group-hover:to-indigo-400'
              }`}
            ></div>
          </div>
          <div className={`mt-2 text-[10px] font-mono truncate ${
            isPeak ? 'text-blue-700 font-extrabold' : 'text-slate-500 font-medium'
          }`}>
            {timeRange}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner / Dynamic Greeting with Official School Logo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-start space-x-3.5 sm:space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo SMPN 3 Jember" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${greeting.badgeColor}`}>
                {greeting.badge}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentFormattedDate}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Semester {settings.semester} TA {settings.academicYear}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              {greeting.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {greeting.desc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-emerald-800">
            <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600" />
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-600">Kehadiran Hari Ini</div>
              <div className="text-base sm:text-lg font-black font-mono leading-tight">{metrics.attendanceRate}%</div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={triggerExportExcel}
              className="flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Cetak Excel (.xlsx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Holiday / Sunday Notice Alert Banner */}
      {isOffDay && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/90 rounded-2xl flex items-start space-x-3.5 shadow-sm text-slate-800 animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
            <CalendarX className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-rose-900">
                Pemberitahuan Hari Libur Sekolah
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/90 text-rose-800 border border-rose-300">
                {offDayReason}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
              Hari ini ({currentFormattedDate}) terhitung sebagai <strong>hari libur sekolah</strong>. Sesi presensi siswa di gerbang ditiadakan dan sistem tidak akan menandai siswa sebagai status Alpa.
            </p>
          </div>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL SISWA</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-slate-800 font-mono">{metrics.totalStudents}</div>
          )}
          <div className="text-[11px] text-slate-500 mt-1">Terdaftar aktif</div>
        </div>

        {/* Hadir Tepat */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">HADIR TEPAT</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-emerald-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-emerald-600 font-mono">{metrics.totalHadir}</div>
          )}
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {metrics.totalStudents > 0 ? ((metrics.totalHadir / metrics.totalStudents) * 100).toFixed(1) : 0}% kehadiran
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-white to-amber-50/30 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">TERLAMBAT</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-amber-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-amber-600 font-mono">{metrics.totalTelat}</div>
          )}
          <div className="text-[11px] text-amber-700 font-medium mt-1">Toleransi piket</div>
        </div>

        {/* Izin Resmi */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-white to-blue-50/30 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">IZIN RESMI</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-blue-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-blue-600 font-mono">{metrics.totalIzin}</div>
          )}
          <div className="text-[11px] text-blue-700 font-medium mt-1">Surat masuk</div>
        </div>

        {/* Sakit */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-white to-indigo-50/30 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">SAKIT</span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-indigo-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-indigo-600 font-mono">{metrics.totalSakit}</div>
          )}
          <div className="text-[11px] text-indigo-700 font-medium mt-1">Keterangan medis</div>
        </div>

        {/* Alpa */}
        <div className="bg-white p-5 rounded-2xl border border-red-200/80 bg-gradient-to-b from-white to-red-50/30 shadow-sm">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">ALPA</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-red-100 animate-pulse rounded-lg my-1"></div>
          ) : (
            <div className="text-3xl font-black text-red-600 font-mono">{metrics.totalAlpa}</div>
          )}
          <div className="text-[11px] text-red-700 font-medium mt-1">Tanpa kabar</div>
        </div>
      </div>

      {/* Interactive Analytics: Donut Composition & Peak Arrival Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diagram Donut Komposisi Presensi Harian (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Komposisi Presensi Harian</h3>
                <p className="text-[11px] text-slate-500">Perbandingan rasio kehadiran siswa hari ini</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              REALTIME
            </span>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="14"
                />
                {renderDonutSegments()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 font-mono leading-none">
                  {metrics.attendanceRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Kehadiran
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 w-full sm:w-auto text-xs flex-1">
              {donutSegmentsData.map((item) => (
                <div key={item.label} className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="font-medium text-slate-600">{item.label}</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {item.value} <span className="text-[10px] font-normal text-slate-400">({item.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Terdata: <strong className="font-mono text-slate-700">{metrics.totalRecorded}</strong> siswa</span>
            <span>Target: <strong className="font-mono text-emerald-600">95%</strong></span>
          </div>
        </div>

        {/* Grafik Jam Puncak Kedatangan Siswa (Peak Arrival Chart - 7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Kurva Jam Puncak Kedatangan Siswa</h3>
                <p className="text-[11px] text-slate-500">Distribusi pemindaian kartu di gerbang (interval 15 menit)</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
              GATE METRICS
            </span>
          </div>

          {/* Chart Display Area */}
          <div className="py-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
              {renderPeakArrivalBars()}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Puncak kedatangan: <strong className="text-slate-800 font-semibold">{peakIntervalName}</strong></span>
            </div>
            <span className="text-slate-400">Membantu antisipasi kepadatan antrean scanner gerbang</span>
          </div>
        </div>
      </div>

      {/* Admin Specific Action Controls Row */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Big Start Kiosk Box */}
          <div className="lg:col-span-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl shadow-red-500/25 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90 mb-3">
                <span>PINTU GERBANG MASUK</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">AKTIF</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">
                START ABSENSI
              </h2>
              <p className="text-xs text-white/90 leading-relaxed mb-6">
                Buka Live Kiosk Pemindai Barcode untuk memulai proses absensi siswa di gerbang sekolah.
              </p>
            </div>

            <button
              onClick={triggerStartKiosk}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-red-600 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-red-600 text-red-600" />
              <span>Buka Layar Kios Scanner</span>
            </button>
          </div>

          {/* Parameter Waktu Presensi Card (Editable by Admin) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Parameter Waktu Absen</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                EDIT LANGSUNG
              </span>
            </div>

            {paramSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center space-x-1.5 font-medium animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{paramSuccess}</span>
              </div>
            )}

            <form onSubmit={triggerSaveParamTimes} className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Jam Masuk */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block">Jam Masuk (Buka Gerbang)</label>
                    <span className="text-[10px] text-slate-500">Mulai pemindaian kartu</span>
                  </div>
                  <input
                    type="time"
                    value={paramTimes.timeStart}
                    onChange={(e) => setParamTimes((p) => ({ ...p, timeStart: e.target.value }))}
                    className="font-mono font-bold text-sm text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Batas Tepat Waktu */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div>
                    <label className="text-xs font-semibold text-amber-900 block">Batas Tepat Waktu</label>
                    <span className="text-[10px] text-amber-700">Lewat jam ini dihitung Telat</span>
                  </div>
                  <input
                    type="time"
                    value={paramTimes.timeLate}
                    onChange={(e) => setParamTimes((p) => ({ ...p, timeLate: e.target.value }))}
                    className="font-mono font-bold text-sm text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Cut-off Alpa */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/60 border border-red-200">
                  <div>
                    <label className="text-xs font-semibold text-red-900 block">Cut-Off Alpa Sistem</label>
                    <span className="text-[10px] text-red-700">Otomatis dialpakan harian</span>
                  </div>
                  <input
                    type="time"
                    value={paramTimes.timeAlpa}
                    onChange={(e) => setParamTimes((p) => ({ ...p, timeAlpa: e.target.value }))}
                    className="font-mono font-bold text-sm text-red-900 bg-white px-3 py-1.5 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={paramSaving}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{paramSaving ? 'Menyimpan...' : 'Simpan Parameter Waktu Absen'}</span>
              </button>
            </form>
          </div>

          {/* Quick Dispensasi / Izin Sakit Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Pemberian Izin / Sakit Cepat</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Ketik nama siswa untuk mengubah status kehadiran dispensasi tanpa scan kartu.
            </p>

            {quickSuccess && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{quickSuccess}</span>
              </div>
            )}

            <form onSubmit={triggerQuickPermission} className="space-y-3">
              {/* Searchable Student Combobox */}
              <div className="relative" ref={studentDropdownRef}>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pilih Siswa (Cari Nama atau NISN)
                </label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-[10px]">
                        {selectedStudent.className}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedStudent.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({selectedStudent.nisn})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickStudentId('');
                        setStudentSearch('');
                        setIsDropdownOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Ganti Siswa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Ketik Nama atau NISN siswa..."
                      className="w-full text-xs pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <ChevronDown
                      className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 cursor-pointer"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    />
                  </div>
                )}

                {/* Dropdown Popover List */}
                {isDropdownOpen && !selectedStudent && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {allStudents.length === 0
                          ? 'Memuat data siswa...'
                          : `Tidak ditemukan siswa dengan kata kunci "${studentSearch}"`}
                      </div>
                    ) : (
                      filteredStudents.slice(0, 60).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setQuickStudentId(s.id);
                            setIsDropdownOpen(false);
                            setStudentSearch('');
                          }}
                          className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="truncate mr-2">
                            <span className="font-bold text-slate-800">{s.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                              NISN: {s.nisn}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 flex-shrink-0">
                            {s.className}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value)}
                  className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="IZIN">Status: IZIN</option>
                  <option value="SAKIT">Status: SAKIT</option>
                  <option value="HADIR">Status: HADIR</option>
                </select>

                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Alasan (opsional)..."
                  className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!quickStudentId}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 cursor-pointer"
              >
                Tetapkan Dispensasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Distribusi Kehadiran Progress Bar Strip */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Distribusi Kehadiran Siswa Pagi Ini</h3>
            <p className="text-xs text-slate-500">Rasio kumulatif dari seluruh rombel tingkat 7, 8, dan 9</p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Hadir ({metrics.totalStudents > 0 ? ((metrics.totalHadir / metrics.totalStudents) * 100).toFixed(1) : 0}%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Telat ({metrics.totalStudents > 0 ? ((metrics.totalTelat / metrics.totalStudents) * 100).toFixed(1) : 0}%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Izin/Sakit ({metrics.totalStudents > 0 ? (((metrics.totalIzin + metrics.totalSakit) / metrics.totalStudents) * 100).toFixed(1) : 0}%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Alpa ({metrics.totalStudents > 0 ? ((metrics.totalAlpa / metrics.totalStudents) * 100).toFixed(1) : 0}%)</span>
            </span>
          </div>
        </div>

        {/* Multi-segment Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${metrics.totalStudents > 0 ? (metrics.totalHadir / metrics.totalStudents) * 100 : 0}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title="Hadir"
          ></div>
          <div
            style={{ width: `${metrics.totalStudents > 0 ? (metrics.totalTelat / metrics.totalStudents) * 100 : 0}%` }}
            className="bg-amber-500 h-full transition-all duration-500"
            title="Terlambat"
          ></div>
          <div
            style={{ width: `${metrics.totalStudents > 0 ? ((metrics.totalIzin + metrics.totalSakit) / metrics.totalStudents) * 100 : 0}%` }}
            className="bg-blue-500 h-full transition-all duration-500"
            title="Izin / Sakit"
          ></div>
          <div
            style={{ width: `${metrics.totalStudents > 0 ? (metrics.totalAlpa / metrics.totalStudents) * 100 : 0}%` }}
            className="bg-red-500 h-full transition-all duration-500"
            title="Alpa"
          ></div>
        </div>
      </div>

      {/* Rekapitulasi Kehadiran Per Kelas Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">Rekapitulasi Kehadiran Per Kelas</h3>
            <p className="text-xs text-slate-500">Daftar presensi kelas secara rinci untuk pengawasan wali murid dan guru piket</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === 'ALL' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Tingkat
              </button>
              <button
                onClick={() => setSelectedLevel('7')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '7' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 7
              </button>
              <button
                onClick={() => setSelectedLevel('8')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '8' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 8
              </button>
              <button
                onClick={() => setSelectedLevel('9')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '9' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 9
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Cari nama rombel/kelas..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Rombel / Kelas</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">Hadir</th>
                <th className="py-3.5 px-4 text-center">Telat</th>
                <th className="py-3.5 px-4 text-center">Izin/Sakit</th>
                <th className="py-3.5 px-4 text-center">Alpa</th>
                <th className="py-3.5 px-6">Tingkat Kehadiran</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-200"></div>
                        <div className="h-4 w-28 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-slate-200 rounded mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-emerald-100 rounded mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-amber-100 rounded mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-blue-100 rounded mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-red-100 rounded mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-2.5 w-full bg-slate-200 rounded-full"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 w-14 bg-slate-200 rounded-lg mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Tidak ada rombel yang cocok.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => {
                  return (
                    <tr key={item.className} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {item.className.replace('-', '')}
                          </span>
                          <span className="font-bold text-slate-800">
                            Kelas {item.className.split('-')[0] === '7' ? 'VII' : item.className.split('-')[0] === '8' ? 'VIII' : 'IX'} - {item.className.split('-')[1]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{item.total}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{item.hadir}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">{item.telat}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600">{item.izinSakit}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-red-600">{item.alpa}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.rate}%` }}
                              className={`h-full rounded-full ${
                                item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-xs w-10 text-right">{item.rate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onSelectClass(item.className)}
                          className="px-2.5 py-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredClasses.length} dari 27 Rombel Terakreditasi</span>
          <span>Klik tombol Detail pada kelas untuk melihat daftar nama siswa & jam scan spesifik</span>
        </div>
      </div>

      {/* Jadwal Operasional Presensi Siswa Footer Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Jadwal Operasional Presensi Siswa</h3>
            <p className="text-xs text-slate-500">Aturan batas waktu kehadiran harian mesin barcode gerbang</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono font-semibold">
            WIB (GMT+7)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">01. GERBANG BUKA</div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-1">{settings.timeStart}</div>
            <p className="text-xs text-slate-500 mt-1">Pemindaian kartu mulai aktif dan disambut oleh guru piket.</p>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Standby Normal</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">02. BATAS TEPAT WAKTU</div>
            <div className="text-2xl font-black font-mono text-amber-700 mt-1">{settings.timeLate}</div>
            <p className="text-xs text-slate-500 mt-1">Siswa memindai setelah pukul {settings.timeLate} terdata otomatis sebagai Terlambat.</p>
            <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Catatan Kedisiplinan</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">03. ALPA SISTEM</div>
            <div className="text-2xl font-black font-mono text-red-700 mt-1">{settings.timeAlpa}</div>
            <p className="text-xs text-slate-500 mt-1">Siswa tanpa tap dan tanpa konfirmasi wali kelas otomatis dihitung Alpa.</p>
            <div className="mt-2 text-[11px] font-semibold text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Notifikasi WA Orang Tua</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup Modal */}
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
