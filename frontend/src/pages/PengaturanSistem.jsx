import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Cpu, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  Lock, 
  Key,
  Eye,
  EyeOff,
  Info,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const getAcademicYearData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 6 is July
  const baseYear = month >= 6 ? year : year - 1;
  const currentAcademicYear = `${baseYear}/${baseYear + 1}`;
  const options = [
    `${baseYear - 1}/${baseYear}`,
    `${baseYear}/${baseYear + 1}`,
    `${baseYear + 1}/${baseYear + 2}`,
  ];
  return { currentAcademicYear, options, thisYear: year };
};

export default function PengaturanSistem() {
  const toast = useToast();
  const { currentAcademicYear, options: academicYearOptions, thisYear } = getAcademicYearData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waStats, setWaStats] = useState({
    sentToday: 0,
    failedToday: 0,
    pending: 0,
  });
  const [settings, setSettings] = useState({
    timeStart: '06:00',
    timeLate: '07:00',
    timeAlpa: '08:00',
    waMessageTemplate: '',
    fonnteApiToken: '',
    fonnteMockMode: true,
    schoolName: 'SMP NEGERI 3 JEMBER',
    academicYear: currentAcademicYear,
    semester: 'Ganjil',
  });

  // Calendar State - automatically follows this year (dynamic)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [wfaDays, setWfaDays] = useState([]);
  const [calendarMode, setCalendarMode] = useState('HOLIDAY'); // 'HOLIDAY' | 'WFA'
  const [showToken, setShowToken] = useState(false);
  const [togglingDate, setTogglingDate] = useState('');

  // WA Test State
  const [testPhone, setTestPhone] = useState('');
  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);

  // Scanner Sandbox State
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // Danger Zone PIN State
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [dangerMsg, setDangerMsg] = useState('');

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

  // Save Notification
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security / Admin Credentials State
  const [securityTab, setSecurityTab] = useState('password'); // 'password' | 'pin'
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassState, setShowPassState] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [pinForm, setPinForm] = useState({
    currentPassword: '',
    newPin: '',
    confirmPin: '',
  });
  const [showPinState, setShowPinState] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changePinLoading, setChangePinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState({ type: '', text: '' });

  const fetchSettingsAndHolidays = async () => {
    try {
      setLoading(true);
      const [setRes, holRes] = await Promise.all([
        api.get('/settings'),
        api.get(`/holidays?year=${currentYear}`),
      ]);

      if (setRes.data.success && setRes.data.data) {
        const data = setRes.data.data;
        setSettings({
          ...data,
          academicYear: data.academicYear || currentAcademicYear,
        });
        if (setRes.data.waStats) {
          setWaStats(setRes.data.waStats);
        }
      }
      if (holRes.data.success && Array.isArray(holRes.data.data)) {
        const holList = [];
        const wfaList = [];
        holRes.data.data.forEach((h) => {
          const isWfa = Boolean(h.isWfa || (h.description && h.description.startsWith('[WFA]')));
          if (isWfa) {
            wfaList.push(h.holidayDate);
          } else {
            holList.push(h.holidayDate);
          }
        });
        setHolidays(holList);
        setWfaDays(wfaList);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndHolidays();
  }, [currentYear]);

  // Trigger: Simpan Perubahan Pengaturan (Header Save)
  const triggerSaveSettings = (e) => {
    if (e) e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Simpan Perubahan Pengaturan',
      message: 'Apakah Anda yakin ingin menyimpan seluruh konfigurasi operasional sistem (jam absensi, kalender akademik, dan template notifikasi WhatsApp)?',
      variant: 'primary',
      confirmText: 'Simpan Pengaturan',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setSaving(true);
        try {
          const res = await api.put('/settings', settings);
          if (res.data.success) {
            setSaveSuccess(true);
            toast.success('Pengaturan operasional sistem berhasil disimpan!');
            setTimeout(() => setSaveSuccess(false), 3000);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan');
        } finally {
          setSaving(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Trigger: Simpan Token & Mode Fonnte
  const triggerSaveFonnteToken = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Simpan Token & Mode Fonnte',
      message: `Simpan konfigurasi WhatsApp Gateway Fonnte?\n\n• Mode Gateway: ${settings.fonnteMockMode ? 'Simulator / Mock WA' : 'Live Fonnte (API Nyata)'}\n• Token Fonnte: ${settings.fonnteApiToken ? '••••••••' : '(Kosong)'}`,
      variant: 'primary',
      confirmText: 'Simpan Konfigurasi WA',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setSaving(true);
        try {
          const res = await api.put('/settings', {
            fonnteApiToken: settings.fonnteApiToken,
            fonnteMockMode: settings.fonnteMockMode,
          });
          if (res.data.success) {
            setSaveSuccess(true);
            toast.success('Konfigurasi Fonnte WhatsApp berhasil disimpan!');
            setTimeout(() => setSaveSuccess(false), 3000);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan Fonnte');
        } finally {
          setSaving(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Toggle Holiday or WFA Date
  const handleToggleCalendarDate = async (dateStr) => {
    try {
      setTogglingDate(dateStr);
      const res = await api.post('/holidays/toggle', {
        holidayDate: dateStr,
        type: calendarMode,
      });
      if (res.data.success) {
        const { action, type, message } = res.data;
        if (action === 'REMOVED') {
          setHolidays((prev) => prev.filter((d) => d !== dateStr));
          setWfaDays((prev) => prev.filter((d) => d !== dateStr));
          toast.info(`Tanggal ${dateStr} dikembalikan ke Hari Efektif Sekolah.`);
        } else if (action === 'ADDED' || action === 'UPDATED') {
          if (type === 'WFA') {
            setHolidays((prev) => prev.filter((d) => d !== dateStr));
            setWfaDays((prev) => [...prev.filter((d) => d !== dateStr), dateStr]);
            toast.success(message || `Tanggal ${dateStr} ditandai sebagai Hari WFA / PJJ.`);
          } else {
            setWfaDays((prev) => prev.filter((d) => d !== dateStr));
            setHolidays((prev) => [...prev.filter((d) => d !== dateStr), dateStr]);
            toast.success(message || `Tanggal ${dateStr} ditandai sebagai Hari Libur Sekolah.`);
          }
        }
      }
    } catch (err) {
      console.error('Toggle calendar date error:', err);
      toast.error(err.response?.data?.message || 'Gagal mengubah status tanggal kalender');
    } finally {
      setTogglingDate('');
    }
  };

  // Insert Variable to WA Template
  const handleInsertVariable = (varTag) => {
    setSettings(prev => ({
      ...prev,
      waMessageTemplate: prev.waMessageTemplate + ` ${varTag} `,
    }));
  };

  // Test WhatsApp
  const handleTestWa = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestingWa(true);
    setWaTestResult(null);

    try {
      const res = await api.post('/settings/test-fonnte', {
        targetPhone: testPhone,
        token: settings.fonnteApiToken,
        mockMode: settings.fonnteMockMode,
      });
      setWaTestResult({
        success: res.data.success,
        message: res.data.message,
        mock: res.data.result?.mock,
      });
    } catch (err) {
      setWaTestResult({
        success: false,
        message: err.response?.data?.message || 'Tes gagal dijalankan',
      });
    } finally {
      setTestingWa(false);
    }
  };

  // Sandbox scanner input
  const handleSandboxSubmit = (e) => {
    e.preventDefault();
    if (!sandboxInput.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setSandboxLogs(prev => [
      {
        id: Date.now(),
        code: sandboxInput.trim(),
        length: sandboxInput.trim().length,
        time,
        source: 'Scanner Laser USB / Manual',
        status: 'VALID CODE-128',
      },
      ...prev.slice(0, 7),
    ]);
    setSandboxInput('');
  };

  // Trigger: Reset yearly logs with PIN
  const triggerResetLogs = (e) => {
    e.preventDefault();
    if (!pin || pin.length < 6) {
      toast.warning('Masukkan 6 digit PIN otoritas admin terlebih dahulu.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Riwayat Presensi Tahunan',
      message: 'PERINGATAN KRUSIAL: Seluruh riwayat presensi siswa tahun ajaran ini akan DIHAPUS PERMANEN dari database lokal sekolah untuk pengosongan kapasitas.\n\nApakah Anda benar-benar yakin ingin melanjutkan dengan otorisasi PIN admin?',
      variant: 'danger',
      confirmText: 'Hapus Riwayat Presensi',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setPinLoading(true);
        setDangerMsg('');

        try {
          const res = await api.post('/attendance/reset-logs', { pin });
          if (res.data.success) {
            setDangerMsg(res.data.message);
            setPin('');
          }
        } catch (err) {
          setDangerMsg(err.response?.data?.message || 'PIN salah atau gagal mereset');
        } finally {
          setPinLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Handler: Ubah Password Admin
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal harus 6 karakter.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Ubah Password Admin',
      message: 'Apakah Anda yakin ingin memperbarui password login Administrator? Anda akan menggunakan password baru ini untuk sesi login berikutnya.',
      variant: 'primary',
      confirmText: 'Ya, Simpan Password',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setPasswordLoading(true);
        try {
          const res = await api.post('/auth/change-password', passwordForm);
          if (res.data.success) {
            setPasswordMsg({ type: 'success', text: res.data.message || 'Password Admin berhasil diperbarui!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          }
        } catch (err) {
          setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memperbarui password admin.' });
        } finally {
          setPasswordLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Handler: Ubah PIN Otoritas Admin
  const handleUpdatePin = (e) => {
    e.preventDefault();
    setPinMsg({ type: '', text: '' });

    const cleanPin = pinForm.newPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPinMsg({ type: 'error', text: 'PIN baru harus berupa 6 digit angka (contoh: 123456).' });
      return;
    }
    if (cleanPin !== pinForm.confirmPin.trim()) {
      setPinMsg({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Ubah PIN Otoritas Admin',
      message: 'Apakah Anda yakin ingin memperbarui PIN otoritas 6-digit? PIN ini digunakan untuk keluar dari Live Kiosk dan reset riwayat presensi.',
      variant: 'primary',
      confirmText: 'Ya, Simpan PIN',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        setChangePinLoading(true);
        try {
          const res = await api.post('/auth/change-pin', {
            currentPassword: pinForm.currentPassword,
            newPin: cleanPin,
            confirmPin: pinForm.confirmPin.trim(),
          });
          if (res.data.success) {
            setPinMsg({ type: 'success', text: res.data.message || 'PIN otoritas Admin berhasil diperbarui!' });
            setPinForm({ currentPassword: '', newPin: '', confirmPin: '' });
          }
        } catch (err) {
          setPinMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memperbarui PIN otoritas admin.' });
        } finally {
          setChangePinLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Month names
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper to render days of month
  const renderMonthDays = (monthIdx) => {
    const daysInMonth = new Date(currentYear, monthIdx + 1, 0).getDate();
    const firstDay = new Date(currentYear, monthIdx, 1).getDay(); // 0 is Sunday
    const cells = [];

    // Empty blank cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty_${i}`} className="w-5 h-5"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = (firstDay + d - 1) % 7;
      const dateStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidays.includes(dateStr);
      const isWfa = wfaDays.includes(dateStr);
      const isToggling = togglingDate === dateStr;

      cells.push(
        <button
          key={d}
          type="button"
          disabled={isToggling}
          onClick={() => handleToggleCalendarDate(dateStr)}
          className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[9px] font-mono font-bold transition-all cursor-pointer ${
            isHoliday
              ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-300'
              : isWfa
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold'
              : isSunday
              ? 'text-rose-500 hover:bg-rose-50'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
          title={`${dateStr} ${
            isHoliday
              ? '(Libur Khusus/Sekolah)'
              : isWfa
              ? '(Hari WFA / Belajar Dari Rumah - Siswa Otomatis Hadir Tanpa WA)'
              : isSunday
              ? '(Minggu)'
              : '(Hari Efektif)'
          }`}
        >
          {isToggling ? (
            <div className={`w-2.5 h-2.5 border-2 ${calendarMode === 'WFA' ? 'border-blue-500' : 'border-rose-500'} border-t-transparent rounded-full animate-spin`}></div>
          ) : (
            d
          )}
        </button>
      );
    }

    return cells;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">
            KONFIGURASI OPERASIONAL
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kalender akademik & hari libur, gateway template WhatsApp Fonnte, uji modul barcode scanner, serta tata kelola data.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan Tersimpan!</span>
            </span>
          )}
          <button
            onClick={triggerSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Kalender & WA) & Right (Hardware Sandbox & Danger Zone) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card 1: Pengaturan Kalender Libur & Akademik */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">
                    Pengaturan Kalender Libur & Akademik
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kelola tahun ajaran, semester, dan multi-select hari libur nasional & sekolah
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-mono font-bold">
                  {holidays.length} Hari Libur Khusus
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>{wfaDays.length} Hari WFA / PJJ</span>
                </div>
              </div>
            </div>

            {/* Filter Year, Semester, Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  TAHUN AJARAN
                </label>
                <select
                  value={settings.academicYear}
                  onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {academicYearOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} {opt === currentAcademicYear ? '(Tahun Ini - Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  SEMESTER AKTIF
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {['Ganjil', 'Genap'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSettings({ ...settings, semester: sem })}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        settings.semester === sem
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  CATATAN PERIODE LIBUR
                </label>
                <input
                  type="text"
                  placeholder={`Contoh: Kalender TA ${settings.academicYear || currentAcademicYear}`}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  value={settings.calendarNote !== undefined ? settings.calendarNote : `Kalender TA ${settings.academicYear || currentAcademicYear}`}
                  onChange={(e) => setSettings({ ...settings, calendarNote: e.target.value })}
                />
              </div>
            </div>

            {/* Legend, Mode Switcher & Year switch */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                {/* Dynamic Year Switcher */}
                <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCurrentYear((prev) => prev - 1)}
                    className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Tahun Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentYear(thisYear)}
                    className={`px-3 py-0.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      currentYear === thisYear
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Klik untuk kembali ke tahun ini"
                  >
                    Tahun {currentYear} {currentYear === thisYear ? '• Tahun Ini' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentYear((prev) => prev + 1)}
                    className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Tahun Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode Klik Switcher (Libur vs WFA) */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCalendarMode('HOLIDAY')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      calendarMode === 'HOLIDAY'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Klik tanggal kalender untuk menandai Hari Libur"
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>Mode Hari Libur</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMode('WFA')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      calendarMode === 'WFA'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Klik tanggal kalender untuk menandai Hari WFA / PJJ"
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>Mode Hari WFA (BDR)</span>
                  </button>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center space-x-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span>Minggu</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Libur Khusus</span>
                </span>
                <span className="flex items-center space-x-1.5 text-blue-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>WFA / PJJ (Hadir)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Hari Kerja</span>
                </span>
              </div>
            </div>

            {/* 12 Months Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {months.map((mName, mIdx) => (
                <div key={mName} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60 mb-2">
                    <span>{mName}</span>
                    <span className="font-mono text-[10px] text-slate-400">{currentYear}</span>
                  </div>

                  {/* Day Initials Header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1">
                    <span className="text-red-500">M</span>
                    <span>S</span>
                    <span>S</span>
                    <span>R</span>
                    <span>K</span>
                    <span>J</span>
                    <span>S</span>
                  </div>

                  {/* Day Numbers */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {renderMonthDays(mIdx)}
                  </div>
                </div>
              ))}
            </div>

            {/* Information Callout Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-900 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aturan Hari Libur: </span>
                  Sistem scanner gerbang dan WhatsApp tidak mencatat siswa Alpa pada hari Minggu serta tanggal yang ditandai merah sebagai hari libur resmi/khusus sekolah.
                </div>
              </div>
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aturan Hari WFA (BDR): </span>
                  Pada tanggal biru, seluruh siswa otomatis dicatat berstatus <strong className="text-blue-800">HADIR</strong> di sistem tanpa pengiriman pesan WhatsApp ke orang tua, dan proses alpa otomatis dinonaktifkan.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Template Pesan WhatsApp Otomatis */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">
                    Template Pesan WhatsApp Otomatis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pengiriman instan ke nomor WhatsApp wali murid saat kartu barcode terdeteksi
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Maks. 500 karakter</span>
            </div>

            {/* Variable Chips */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                VARIABEL CEPAT (KLIK UNTUK MEMASUKKAN):
              </div>
              <div className="flex flex-wrap gap-2">
                {['[NAMA]', '[STATUS]', '[JAM]', '[TANGGAL]', '[KELAS]'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    + {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Textarea */}
            <div>
              <textarea
                rows="5"
                value={settings.waMessageTemplate}
                onChange={(e) => setSettings({ ...settings, waMessageTemplate: e.target.value })}
                className="w-full text-xs font-mono p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                placeholder="Tuliskan format copywriting pesan notifikasi..."
              ></textarea>
            </div>

            {/* Fonnte API Token & Mock Mode Switch */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <div className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
                    <span>Fonnte WhatsApp API Gateway</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Integrasi resmi notifikasi presensi siswa langsung ke nomor WhatsApp wali murid
                  </div>
                </div>

                {/* Status Badge */}
                {!settings.fonnteApiToken ? (
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold font-mono">
                    ⚠️ Token Belum Dimasukkan
                  </span>
                ) : settings.fonnteMockMode ? (
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-800 text-xs font-bold font-mono">
                    🟡 Mode Simulator (Hemat Kuota)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold font-mono flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🟢 LIVE Terhubung ke Fonnte</span>
                  </span>
                )}
              </div>

              {/* Real-time WhatsApp Monitor Widget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                {/* 1. Status API Token */}
                <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    settings.fonnteApiToken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Status API Token</div>
                    <div className="text-xs font-bold text-slate-800">
                      {settings.fonnteApiToken ? (
                        <span className="text-emerald-700 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Tervalidasi Fonnte</span>
                        </span>
                      ) : (
                        <span className="text-amber-700">Belum Terpasang</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Pesan Berhasil Terkirim Hari Ini */}
                <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Terkirim Hari Ini</div>
                    <div className="text-sm font-black font-mono text-emerald-800">
                      {waStats.sentToday} <span className="text-[10px] font-normal text-emerald-600">pesan</span>
                    </div>
                  </div>
                </div>

                {/* 3. Pesan Tertunda / Gagal */}
                <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    waStats.failedToday > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {waStats.failedToday > 0 ? <AlertCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tertunda / Gagal</div>
                    <div className="text-xs font-mono font-bold text-slate-800">
                      <span>Antrean: <strong className="text-blue-700">{waStats.pending}</strong></span>
                      <span className="mx-1">•</span>
                      <span>Gagal: <strong className={waStats.failedToday > 0 ? 'text-rose-600' : 'text-slate-500'}>{waStats.failedToday}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Selection Cards */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  PILIH MODE PENGIRIMAN:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, fonnteMockMode: false })}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !settings.fonnteMockMode
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">1. Mode Live Fonnte</span>
                      {!settings.fonnteMockMode && <span className="text-emerald-600 font-bold text-xs">✓ Aktif</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pesan dikirim <strong className="text-slate-700">nyata</strong> ke nomor WhatsApp wali murid via API Fonnte.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, fonnteMockMode: true })}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.fonnteMockMode
                        ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">2. Mock Simulator (Hemat Kuota)</span>
                      {settings.fonnteMockMode && <span className="text-blue-600 font-bold text-xs">✓ Aktif</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pesan disimulasikan dan dicatat di database log tanpa memotong kuota paket Fonnte Anda.
                    </p>
                  </button>
                </div>
              </div>

              {/* Token Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  TOKEN API FONNTE:
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={settings.fonnteApiToken}
                    onChange={(e) => setSettings({ ...settings, fonnteApiToken: e.target.value })}
                    placeholder="Contoh: vL7xxxxxxxxxxxxxxxxxx (didapat dari dashboard fonnte.com)"
                    className="w-full text-xs font-mono p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Belum punya token? Dapatkan token gratis atau akun resmi di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">fonnte.com</a>.
                </div>
              </div>

              {/* Quick Save Token Button */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={triggerSaveFonnteToken}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Token & Mode Fonnte'}</span>
                </button>
              </div>

              {/* Test WhatsApp Send Form */}
              <div className="pt-3 border-t border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  UJI COBA KIRIM PESAN WHATSAPP:
                </label>
                <form onSubmit={handleTestWa} className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Nomor WA tujuan (contoh: 081234567890)"
                    className="w-full sm:flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={testingWa || !testPhone}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingWa ? 'Mengirim...' : 'Kirim Pesan Tes Sekarang'}</span>
                  </button>
                </form>

                {waTestResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs font-medium ${
                      waTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="font-bold mb-0.5">
                      {waTestResult.success ? '✅ Hasil Uji Coba Berhasil:' : '❌ Gagal Mengirim:'}
                    </div>
                    <div>{waTestResult.message}</div>
                    {waTestResult.mock && (
                      <div className="text-[11px] text-blue-700 mt-1">
                        Catatan: Pesan berjalan di mode Simulator. Untuk mengirim nyata ke HP tujuan, pilih kartu "1. Mode Live Fonnte" di atas dan isi Token Fonnte Anda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Scanner Barcode & Hardware Sandbox */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-800">Status Scanner Barcode</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                SIAP DIGUNAKAN
              </span>
            </div>

            {/* Explanation Helper Callout */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center space-x-1.5 text-blue-800 text-xs">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Area Uji Coba Hardware Scanner Laser</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Area ini digunakan untuk <strong>menguji pembacaan scanner laser barcode fisik</strong> (USB / Wireless Keyboard Wedge) atau input manual guna memverifikasi kartu barcode siswa sebelum dipakai di gerbang sekolah tanpa mempengaruhi data presensi harian.
              </p>
              <div className="text-[11px] text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-xl border border-blue-100">
                <div><strong>Langkah Pengujian:</strong> Klik kolom input di bawah, lalu tembak kartu barcode siswa dengan scanner laser atau ketik nomor NISN lalu tekan Enter.</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">HID Keyboard Barcode Reader</div>
                <div className="text-[10px] text-slate-400 font-mono">USB / Wireless Generic Input</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Standby</span>
              </span>
            </div>

            {/* Sandbox Input Form */}
            <form onSubmit={handleSandboxSubmit} className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>INPUT MANUAL / SCANNER LASER:</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">AMAN (TIDAK MASUK ABSEN)</span>
              </div>
              <input
                type="text"
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                placeholder="Klik di sini & tembak barcode dengan scanner laser..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
              />
              <div className="text-[10px] text-slate-400">
                Ketik angka NISN atau tembak barcode kartu fisik lalu tekan Enter.
              </div>
            </form>

            {/* Sandbox Results Stream */}
            <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-300">HASIL PEMBACAAN KARTU</span>
                <button
                  onClick={() => setSandboxLogs([])}
                  className="hover:text-white transition-colors cursor-pointer text-[10px] underline"
                >
                  Bersihkan Log
                </button>
              </div>

              {sandboxLogs.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center font-mono">
                  Belum ada pembacaan kartu.<br />
                  <span className="text-[11px] text-slate-600">Klik kolom input di atas lalu tembak barcode fisik atau ketik NISN.</span>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto">
                  {sandboxLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <div className="text-emerald-400 font-bold">
                          NISN: {log.code} ({log.length} digit)
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.source || 'Scanner USB'} • {log.status || 'OK'}
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px] font-bold">{log.time} WIB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Keamanan & Kredensial Admin Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Keamanan Kredensial Admin</h3>
                  <p className="text-[11px] text-slate-500">Ubah kata sandi login dan PIN otoritas sistem</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                OTORITAS
              </span>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl space-x-1">
              <button
                type="button"
                onClick={() => {
                  setSecurityTab('password');
                  setPasswordMsg({ type: '', text: '' });
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  securityTab === 'password'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecurityTab('pin');
                  setPinMsg({ type: '', text: '' });
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  securityTab === 'pin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>PIN Otoritas (6 Digit)</span>
              </button>
            </div>

            {/* Tab 1: Ubah Password Admin */}
            {securityTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-3.5 animate-fadeIn">
                {passwordMsg.text && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password Saat Ini:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassState.current ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Masukkan password admin saat ini"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassState((p) => ({ ...p, current: !p.current }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassState.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassState.new ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassState((p) => ({ ...p, new: !p.new }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassState.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Konfirmasi Password Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassState.confirm ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ketik ulang password baru"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassState((p) => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassState.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{passwordLoading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                </button>
              </form>
            )}

            {/* Tab 2: Ubah PIN Otoritas 6-Digit */}
            {securityTab === 'pin' && (
              <form onSubmit={handleUpdatePin} className="space-y-3.5 animate-fadeIn">
                {pinMsg.text && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                      pinMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {pinMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{pinMsg.text}</span>
                  </div>
                )}

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                  PIN 6 digit ini digunakan untuk <strong>Keluar dari Live Kiosk</strong> di terminal sekolah dan <strong>Reset Riwayat Presensi</strong> di Zona Bahaya.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password Admin Saat Ini:
                  </label>
                  <div className="relative">
                    <input
                      type={showPinState.current ? 'text' : 'password'}
                      required
                      value={pinForm.currentPassword}
                      onChange={(e) => setPinForm({ ...pinForm, currentPassword: e.target.value })}
                      placeholder="Masukkan password admin untuk verifikasi"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinState((p) => ({ ...p, current: !p.current }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPinState.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Baru (6 Digit Angka):
                  </label>
                  <div className="relative">
                    <input
                      type={showPinState.new ? 'text' : 'password'}
                      required
                      maxLength={6}
                      value={pinForm.newPin}
                      onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="Contoh: 123456"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono tracking-widest font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinState((p) => ({ ...p, new: !p.new }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPinState.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Konfirmasi PIN Baru (6 Digit Angka):
                  </label>
                  <div className="relative">
                    <input
                      type={showPinState.confirm ? 'text' : 'password'}
                      required
                      maxLength={6}
                      value={pinForm.confirmPin}
                      onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ketik ulang 6 digit PIN baru"
                      className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono tracking-widest font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinState((p) => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPinState.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changePinLoading || pinForm.newPin.length < 6}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{changePinLoading ? 'Menyimpan...' : 'Simpan PIN Otoritas'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Danger Zone: Reset Riwayat Tahunan Presensi */}
          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-extrabold text-sm">Zona Bahaya</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tindakan penghapusan data bersifat permanen dan tidak dapat dibatalkan.
            </p>

            <div className="p-4 bg-red-50/60 rounded-xl border border-red-100 space-y-3">
              <div className="text-xs font-bold text-red-900">Reset Riwayat Tahunan Presensi</div>
              <p className="text-[11px] text-red-700">
                Menghapus seluruh log kehadiran tahun ajaran sebelumnya untuk mengosongkan kapasitas database lokal sekolah.
              </p>

              {dangerMsg && (
                <div className="p-2 rounded bg-white border border-red-200 text-xs font-medium text-red-800">
                  {dangerMsg}
                </div>
              )}

              <form onSubmit={triggerResetLogs} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">
                    MASUKKAN PIN OTORITAS ADMIN (6 DIGIT):
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Contoh: 123456"
                    className="w-full text-sm font-mono tracking-widest text-center p-2.5 bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pinLoading || pin.length < 6}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{pinLoading ? 'Memverifikasi...' : 'Hapus Riwayat Presensi'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

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
