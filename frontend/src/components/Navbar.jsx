import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldCheck, User, LogOut, CheckCircle, Wifi, Menu, Search } from 'lucide-react';

export default function Navbar({ onToggleSidebar, onLogout, onOpenQuickSearch }) {
  const { user, isAdmin, logout, setIsLoginModalOpen } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Status Indicators + Hamburger Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* School Logo & Title for Mobile */}
        <div className="lg:hidden flex items-center space-x-2">
          <img src="/logo.png" alt="Logo SMPN 3 Jember" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-xs text-slate-800">SMPN 3</span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] sm:text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isAdmin ? 'SCANNER ONLINE' : 'Server Sinkron'}</span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Middle/Right Quick Search + Auth Action */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Quick Search Button (Ctrl + K) */}
        <button
          type="button"
          id="btn-quick-search"
          onClick={onOpenQuickSearch}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs transition-colors cursor-pointer"
          title="Buka Pencarian Siswa (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Cari Siswa...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 font-bold shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                A
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight flex items-center space-x-1">
                  <span>Petugas Admin</span>
                  <CheckCircle className="w-3 h-3 text-blue-600 fill-blue-600 text-white" />
                </div>
                <div className="text-[10px] text-slate-500">Piket SMPN 3</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
                  Login sebagai: <span className="font-bold text-slate-700">{user?.username}</span>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="btn-login-modal"
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login Petugas</span>
          </button>
        )}
      </div>
    </header>
  );
}
