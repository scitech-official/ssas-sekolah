import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  Settings, 
  ShieldCheck, 
  ScanLine, 
  CheckCircle2, 
  Clock,
  Lock,
  X 
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, sidebarOpen, setSidebarOpen }) {
  const { isAdmin, setIsLoginModalOpen } = useAuth();

  const navItems = [
    {
      id: 'absensi-total',
      label: 'Absensi Total',
      icon: BarChart3,
      adminOnly: false,
    },
    {
      id: 'absensi-perkelas',
      label: 'Absensi Perkelas',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'data-siswa',
      label: 'Data Siswa',
      icon: GraduationCap,
      adminOnly: true,
      badge: 'Admin',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: Settings,
      adminOnly: true,
      badge: 'Admin',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0b0f19] text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800/80 select-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/60' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/10 flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo SMPN 3 Jember" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-white tracking-wider flex items-center space-x-1">
                <span>SSAS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium">v1.0</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-tight">SMP NEGERI 3 JEMBER</div>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          <button
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            {isAdmin ? 'NAVIGASI UTAMA (ADMIN)' : 'NAVIGASI PORTAL'}
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const isRestricted = item.adminOnly && !isAdmin;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  if (!isRestricted) {
                    setCurrentTab(item.id);
                    if (setSidebarOpen) setSidebarOpen(false);
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Live Kiosk Mode Button (Restricted to Admin) */}
          <div className="pt-4 px-1">
            <button
              id="nav-kiosk"
              onClick={() => {
                if (!isAdmin) {
                  setIsLoginModalOpen(true);
                  return;
                }
                setCurrentTab('kiosk');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
              className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                currentTab === 'kiosk'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : isAdmin
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isAdmin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-amber-400'
                }`}>
                  {isAdmin ? (
                    <ScanLine className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Live Kiosk Absensi</span>
                    {isAdmin && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isAdmin ? 'Mode Layar Pemindaian' : 'Hanya Bisa Dibuka Admin'}
                  </div>
                </div>
              </div>
              {!isAdmin && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold border border-amber-500/20">
                  Admin
                </span>
              )}
            </button>
          </div>
        </div>

      {/* Bottom Info Card & Vendor Endorsement */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
        {isAdmin ? (
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sistem Piket v2.4</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Terminal Gate Utama Aktif</div>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-xs font-medium text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Data Terbuka</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Portal informatif kehadiran harian bagi orang tua dan guru piket.
            </div>
          </div>
        )}

        {/* Vendor Credit */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-medium">
          <span>Supported by</span>
          <span className="font-bold text-slate-200 tracking-wide">SCI Tech</span>
        </div>
      </div>
    </aside>
  </>
  );
}
