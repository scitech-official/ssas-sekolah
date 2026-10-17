import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { playSuccessBeep, playWarningBeep, playErrorBeep } from '../utils/audio';
import ConfirmModal from '../components/ConfirmModal';
import { 
  ScanLine, 
  Clock, 
  Power, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  Cpu, 
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';

export default function KioskMode({ onExit }) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [exitPinError, setExitPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [clock, setClock] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('kiosk_muted') === 'true';
  });
  const [settings, setSettings] = useState({
    timeLate: '07:00:00',
    timeAlpa: '08:00:00',
    schoolName: 'SMP NEGERI 3 JEMBER',
  });
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalHadir: 0,
    totalTelat: 0,
    totalBelumMasuk: 0,
  });
  const [liveFeed, setLiveFeed] = useState([]);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSpeed, setScanSpeed] = useState('~0.25 detik/tap');

  // Keystroke buffer for physical 1D wireless barcode scanner (Keyboard Wedge)
  const keyBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Sync mute state to localStorage
  useEffect(() => {
    localStorage.setItem('kiosk_muted', String(isMuted));
  }, [isMuted]);

  // Track Fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Web Speech API Voice Greeting (Indonesian)
  const speakGreeting = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // Digital clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial summary & settings
  const fetchSummary = async () => {
    try {
      const [sumRes, setRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/settings'),
      ]);

      if (sumRes.data.success) {
        const m = sumRes.data.metrics;
        setMetrics({
          totalStudents: m.totalStudents,
          totalHadir: m.totalHadir,
          totalTelat: m.totalTelat,
          totalBelumMasuk: m.totalBelumMasuk,
        });
        setLiveFeed(sumRes.data.recentScans || []);
      }

      if (setRes.data.success && setRes.data.data) {
        setSettings({
          timeLate: setRes.data.data.timeLate || '07:00:00',
          timeAlpa: setRes.data.data.timeAlpa || '08:00:00',
          schoolName: setRes.data.data.schoolName || 'SMP NEGERI 3 JEMBER',
        });
      }
    } catch (err) {
      console.error('Kiosk fetch error:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // Polling update every 10s
    return () => clearInterval(interval);
  }, []);

  // Barcode Submission Handler
  const handleProcessBarcode = async (nisnCode) => {
    if (!nisnCode || isProcessing) return;
    const cleanNisn = String(nisnCode).trim();
    if (!cleanNisn) return;

    setIsProcessing(true);
    const startMs = performance.now();

    try {
      const res = await api.post(
        '/attendance/scan', 
        { nisn: cleanNisn },
        { headers: { 'x-kiosk-secret': 'smp3_kiosk_gate_token_2026' } }
      );
      const elapsed = ((performance.now() - startMs) / 1000).toFixed(2);
      setScanSpeed(`~${elapsed} detik/tap`);

      if (res.data.success) {
        playSuccessBeep();
        const { student, attendance, status } = res.data;

        const newFeedItem = {
          id: attendance.id,
          student: {
            id: student.id,
            name: student.name,
            className: student.className,
            nisn: student.nisn,
          },
          status,
          timeIn: attendance.timeIn,
          waStatus: 'WA Terkirim',
          createdAt: new Date().toISOString(),
        };

        setLiveFeed((prev) => [newFeedItem, ...prev.slice(0, 19)]);
        setLastScanResult({
          type: 'success',
          status,
          title: `Presensi Berhasil: ${student.name}`,
          subtitle: `${student.className} • NISN ${student.nisn} • ${attendance.timeIn} WIB`,
        });

        // Trigger Indonesian Voice Greeting
        if (status === 'HADIR') {
          speakGreeting(`Terima kasih, ${student.name}. Selamat belajar!`);
        } else {
          speakGreeting(`Mohon maaf, ${student.name}, Anda tercatat terlambat.`);
        }

        // Update counts
        setMetrics((prev) => ({
          ...prev,
          totalHadir: status === 'HADIR' ? prev.totalHadir + 1 : prev.totalHadir,
          totalTelat: status === 'TELAT' ? prev.totalTelat + 1 : prev.totalTelat,
          totalBelumMasuk: Math.max(0, prev.totalBelumMasuk - 1),
        }));
      }
    } catch (error) {
      const elapsed = ((performance.now() - startMs) / 1000).toFixed(2);
      setScanSpeed(`~${elapsed} detik/tap`);

      if (error.response?.data?.doubleTap) {
        playWarningBeep();
        speakGreeting('Kartu sudah dipindai hari ini.');
        setLastScanResult({
          type: 'warning',
          title: 'Presensi Ganda (Double Tap)',
          subtitle: error.response.data.message,
        });
      } else if (error.response?.data?.notFound) {
        playErrorBeep();
        setLastScanResult({
          type: 'error',
          title: 'NISN Tidak Terdaftar',
          subtitle: error.response.data.message,
        });
      } else {
        playErrorBeep();
        setLastScanResult({
          type: 'error',
          title: 'Gagal Memproses Kartu',
          subtitle: error.response?.data?.message || 'Koneksi ke server bermasalah.',
        });
      }
    } finally {
      setIsProcessing(false);
      setManualInput('');
      // Auto-clear notification after 4s
      setTimeout(() => {
        setLastScanResult(null);
      }, 4000);
    }
  };

  // Global Keystroke Listener for 1D Barcode Scanner (Keyboard Wedge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in standard inputs other than the scanner simulation
      if (e.target.tagName === 'INPUT' && e.target.id !== 'kiosk-sim-input') {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 3) {
          e.preventDefault();
          const scannedCode = keyBufferRef.current;
          keyBufferRef.current = '';
          handleProcessBarcode(scannedCode);
        } else {
          keyBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        // Barcode scanners usually dump characters very fast (<50ms).
        // If timeDiff > 300ms, reset buffer unless it's first key
        if (timeDiff > 400) {
          keyBufferRef.current = '';
        }
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Simulation Test Buttons
  const handleSimulate = (scenario) => {
    if (scenario === 'hadir') {
      // Pick a student from 7A
      handleProcessBarcode('0081293841');
    } else if (scenario === 'telat') {
      handleProcessBarcode('0084392019');
    } else if (scenario === 'double') {
      // Trigger scan twice
      handleProcessBarcode('0081293841');
    } else if (scenario === 'salah') {
      handleProcessBarcode('9999999999');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Kiosk Header */}
      <header className="min-h-20 bg-[#0b0f19] border-b border-slate-800/80 px-4 sm:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shadow-xl shadow-blue-600/10 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo SMPN 3 Jember" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">SSAS</span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] sm:text-xs font-bold tracking-wide">
                LIVE KIOSK MODE
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-semibold tracking-wide">
              {settings.schoolName}
            </div>
          </div>
        </div>

        {/* Center Digital Clock & Cut-off parameters */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-slate-900/80 px-4 sm:px-6 py-2 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
            <div className="text-left font-mono">
              <div className="text-xl sm:text-2xl font-bold tracking-wider text-white">{clock}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">WIB (GMT+7)</div>
            </div>
          </div>

          <div className="hidden sm:block h-6 sm:h-8 w-px bg-slate-800"></div>

          <div className="text-left font-mono text-xs">
            <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">BATAS TELAT</div>
            <div className="text-amber-400 font-bold">{settings.timeLate} <span className="text-[9px] sm:text-[10px] font-normal">WIB</span></div>
          </div>

          <div className="text-left font-mono text-xs">
            <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">CUT-OFF ALPA</div>
            <div className="text-red-400 font-bold">{settings.timeAlpa} <span className="text-[9px] sm:text-[10px] font-normal">WIB</span></div>
          </div>

          <div className="hidden sm:block h-6 sm:h-8 w-px bg-slate-800"></div>

          {/* Wedge status indicator */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-mono font-medium text-emerald-400">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="hidden xl:inline">Keyboard Wedge Listening</span>
          </div>
        </div>

        {/* Right Action Buttons (Audio Toggle + Fullscreen + Exit PIN) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Audio Mute/Unmute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`px-3 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${
              isMuted
                ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
            }`}
            title={isMuted ? 'Suara Sambutan: Mati (Klik untuk Mengaktifkan)' : 'Suara Sambutan: Aktif (Klik untuk Mematikan)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
            <span className="hidden md:inline">{isMuted ? 'Suara Mati' : 'Suara Aktif'}</span>
          </button>

          {/* True Fullscreen Toggle (F11 Helper) */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
            title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh (F11)'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-blue-400" /> : <Maximize className="w-4 h-4 text-blue-400" />}
            <span className="hidden md:inline">{isFullscreen ? 'Normal' : 'Layar Penuh'}</span>
          </button>

          {/* Exit Kiosk Button with PIN Protection */}
          <button
            onClick={() => {
              setExitPin('');
              setExitPinError('');
              setShowExitConfirm(true);
            }}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>AKHIRI SESI</span>
          </button>
        </div>
      </header>

      {/* Main Kiosk Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-[1700px] w-full mx-auto">
        {/* Left Column: Scanner Target Graphic, Hardware Status, and Simulation Box */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Visual Scanner Card */}
          <div className="relative bg-gradient-to-b from-[#0f172a] to-[#0b0f19] border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden min-h-[360px]">
            {/* Siaga Otomatis Badge */}
            <div className="mb-6 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>SISTEM SIAGA OTOMATIS</span>
            </div>

            {/* Scanner Graphic with Laser */}
            <div className="relative w-44 h-44 rounded-2xl bg-slate-900 border-2 border-slate-700/80 flex items-center justify-center p-4 shadow-inner mb-6">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

              {/* Barcode Lines Graphic */}
              <div className="flex items-center space-x-1 opacity-70">
                <div className="w-1.5 h-24 bg-emerald-400 rounded-sm"></div>
                <div className="w-0.5 h-24 bg-emerald-400"></div>
                <div className="w-2 h-24 bg-emerald-400 rounded-sm"></div>
                <div className="w-1 h-24 bg-emerald-400"></div>
                <div className="w-3 h-24 bg-emerald-400 rounded-sm"></div>
                <div className="w-0.5 h-24 bg-emerald-400"></div>
                <div className="w-1.5 h-24 bg-emerald-400"></div>
                <div className="w-2 h-24 bg-emerald-400"></div>
                <div className="w-1 h-24 bg-emerald-400"></div>
                <div className="w-2.5 h-24 bg-emerald-400 rounded-sm"></div>
              </div>

              {/* Animated Laser Sweep Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-laser"></div>
            </div>

            {/* Call to action */}
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white flex items-center justify-center space-x-2">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-400">Memproses Barcode...</span>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Scanner Aktif: Silakan Tap Kartu Pelajar</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {isProcessing ? (
                  <span className="text-blue-300 font-medium">Sedang memverifikasi data kehadiran siswa ke server...</span>
                ) : (
                  'Arahkan barcode kartu ke sinar laser scanner 1D. Sistem menangkap input NISN otomatis tanpa perlu klik mouse.'
                )}
              </p>
            </div>

            {/* Hardware Port Tag */}
            <div className="mt-6 flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Port Hardware: COM3 USB HID (Auto-Focused)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          {/* Testing / Simulation Tap Card Canvas */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Simulasi Tap Kartu (Testing Canvas)
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Klik tombol untuk uji coba:</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSimulate('hadir')}
                className="py-2.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+ Scan Hadir Tepat</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulate('telat')}
                className="py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>+ Scan Terlambat</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulate('double')}
                className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>! Test Double Tap</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulate('salah')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>! Test NISN Salah</span>
              </button>
            </div>

            {/* Manual test input box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessBarcode(manualInput);
              }}
              className="pt-2"
            >
              <div className="relative">
                <input
                  id="kiosk-sim-input"
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Atau ketik angka NISN di keyboard Anda lalu tekan Enter"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold font-mono transition-all disabled:opacity-30 cursor-pointer"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>

          {/* Quick Metrics Bar at Bottom of Left Column */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TELAH HADIR</div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">{metrics.totalHadir}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Siswa hari ini</div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TERLAMBAT</div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">{metrics.totalTelat}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">&gt; {settings.timeLate.substring(0, 5)} WIB</div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BELUM MASUK</div>
              <div className="text-3xl font-extrabold text-blue-400 font-mono mt-1">{metrics.totalBelumMasuk}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Dari {metrics.totalStudents} siswa</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed Stream of Scanned Students */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Header of Feed */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Live Feed Kedatangan Siswa</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium">
                    Real-Time Stream
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Data terbaru otomatis bertambah di posisi paling atas dan mendorong riwayat ke bawah.
                </p>
              </div>
            </div>
          </div>

          {/* Pop-up Flash Banner for Latest Scan */}
          {lastScanResult && (
            <div
              className={`p-4 rounded-2xl border flex items-center space-x-3 transition-all animate-fadeIn ${
                lastScanResult.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : lastScanResult.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                  : 'bg-red-950/80 border-red-500 text-red-200'
              }`}
            >
              {lastScanResult.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              ) : lastScanResult.type === 'warning' ? (
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              )}
              <div className="text-left flex-1">
                <div className="font-bold text-sm text-white">{lastScanResult.title}</div>
                <div className="text-xs opacity-90">{lastScanResult.subtitle}</div>
              </div>
            </div>
          )}

          {/* Feed List Items */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[640px] pr-2 dark-scroll">
            {liveFeed.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                <ScanLine className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
                <div className="text-sm font-semibold">Belum ada pemindaian kartu hari ini</div>
                <div className="text-xs text-slate-600 mt-1">Tap kartu atau gunakan tombol simulasi</div>
              </div>
            ) : (
              liveFeed.map((item, idx) => {
                const isLate = item.status === 'TELAT';
                const isHadir = item.status === 'HADIR';
                const name = item.student?.name || 'Siswa';
                const initials = name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      idx === 0
                        ? 'bg-[#0f172a] border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-[#0b0f19]/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          isLate
                            ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                            : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                            {item.student?.className || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          NISN: {item.student?.nisn || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill, Time, WA indicator */}
                    <div className="text-right flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                            isLate
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {item.timeIn || '-'} WIB
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-[11px] text-emerald-400">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WA Terkirim</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info Bar */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Kecepatan proses scanner: <strong className="text-white">{scanSpeed}</strong></span>
            </div>
            <span>Riwayat sesi aktif tersimpan otomatis</span>
          </div>
        </div>
      </main>

      {/* Kiosk Bottom Footer Bar & Vendor Credit */}
      <footer className="py-2.5 px-4 sm:px-8 border-t border-slate-800/80 bg-[#070b12] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono select-none">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SSAS Terminal Gate • SMP Negeri 3 Jember</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <span>Supported by</span>
          <span className="font-bold text-slate-200 tracking-wide">SCI Tech</span>
        </div>
      </footer>

      {/* Confirmation Modal for Exit Kiosk with PIN Verification */}
      <ConfirmModal
        isOpen={showExitConfirm}
        title="Otorisasi PIN: Akhiri Sesi Absensi"
        message="Masukkan 6-digit PIN Otoritas Admin untuk menutup Kios Presensi dan kembali ke Dashboard:"
        confirmText="Verifikasi & Keluar"
        cancelText="Batal (Tetap di Kios)"
        variant="danger"
        isLoading={isVerifyingPin}
        onConfirm={async () => {
          if (!exitPin || exitPin.trim().length < 6) {
            setExitPinError('Masukkan 6 digit PIN Admin');
            return;
          }

          setIsVerifyingPin(true);
          setExitPinError('');

          try {
            const res = await api.post('/auth/verify-pin', { pin: exitPin.trim() });
            if (res.data.success) {
              setShowExitConfirm(false);
              setExitPin('');
              onExit();
            } else {
              setExitPinError(res.data.message || 'PIN Admin salah');
            }
          } catch (err) {
            setExitPinError(err.response?.data?.message || 'PIN Otoritas Admin salah!');
          } finally {
            setIsVerifyingPin(false);
          }
        }}
        onClose={() => {
          setShowExitConfirm(false);
          setExitPin('');
          setExitPinError('');
        }}
      >
        <div className="space-y-2">
          <input
            id="kiosk-exit-pin-input"
            type="password"
            maxLength={6}
            autoFocus
            value={exitPin}
            onChange={(e) => {
              setExitPin(e.target.value.replace(/[^0-9]/g, ''));
              setExitPinError('');
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!exitPin || exitPin.trim().length < 6) {
                  setExitPinError('Masukkan 6 digit PIN Admin');
                  return;
                }
                setIsVerifyingPin(true);
                setExitPinError('');
                try {
                  const res = await api.post('/auth/verify-pin', { pin: exitPin.trim() });
                  if (res.data.success) {
                    setShowExitConfirm(false);
                    setExitPin('');
                    onExit();
                  } else {
                    setExitPinError(res.data.message || 'PIN Admin salah');
                  }
                } catch (err) {
                  setExitPinError(err.response?.data?.message || 'PIN Otoritas Admin salah!');
                } finally {
                  setIsVerifyingPin(false);
                }
              }
            }}
            placeholder="• • • • • •"
            className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {exitPinError && (
            <p className="text-xs text-rose-500 font-medium text-center">
              {exitPinError}
            </p>
          )}
          <p className="text-[11px] text-slate-400 text-center">
            Hanya Admin / Petugas berwenang yang dapat menutup sesi gerbang.
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
