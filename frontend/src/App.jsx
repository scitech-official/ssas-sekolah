import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import QuickSearchModal from './components/QuickSearchModal';

import DashboardTotal from './pages/DashboardTotal';
import AbsensiPerkelas from './pages/AbsensiPerkelas';
import DataSiswa from './pages/DataSiswa';
import PengaturanSistem from './pages/PengaturanSistem';
import KioskMode from './pages/KioskMode';

function MainApp() {
  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (['absensi-total', 'absensi-perkelas', 'data-siswa', 'pengaturan', 'kiosk'].includes(hash)) {
      return hash;
    }
    return 'absensi-total';
  });
  const [selectedClassForPerkelas, setSelectedClassForPerkelas] = useState('7-A');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const { isAdmin, setIsLoginModalOpen, isLoginModalOpen } = useAuth();
  const prevIsAdminRef = useRef(isAdmin);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
    setSidebarOpen(false);
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['absensi-total', 'absensi-perkelas', 'data-siswa', 'pengaturan', 'kiosk'].includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K: Search, Esc: Close, F2: Kiosk)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ctrl + K / Cmd + K -> Quick Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
        return;
      }

      // 2. Esc -> Close Active Modal
      if (e.key === 'Escape') {
        if (isQuickSearchOpen) {
          setIsQuickSearchOpen(false);
          return;
        }
        if (isLoginModalOpen) {
          setIsLoginModalOpen(false);
          return;
        }
      }

      // 3. F2 -> Quick Open Kiosk Mode
      if (e.key === 'F2') {
        e.preventDefault();
        if (isAdmin) {
          setCurrentTab('kiosk');
        } else {
          setIsLoginModalOpen(true);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, isLoginModalOpen, isQuickSearchOpen, setIsLoginModalOpen]);

  // Auto redirect to Absensi Total (User Reguler) when Admin logs out
  useEffect(() => {
    if (prevIsAdminRef.current && !isAdmin) {
      setCurrentTab('absensi-total');
    }
    prevIsAdminRef.current = isAdmin;
  }, [isAdmin]);

  // If in Kiosk Mode, render full screen without Sidebar/Navbar (Admin Only)
  if (currentTab === 'kiosk') {
    if (!isAdmin) {
      // Regular user cannot open live kiosk
      setCurrentTab('absensi-total');
      return null;
    }
    return (
      <>
        <KioskMode onExit={() => setCurrentTab('absensi-total')} />
        <LoginModal />
        <QuickSearchModal 
          isOpen={isQuickSearchOpen} 
          onClose={() => setIsQuickSearchOpen(false)}
          onSelectStudentClass={(cls) => {
            setSelectedClassForPerkelas(cls);
            setCurrentTab('absensi-perkelas');
          }}
        />
      </>
    );
  }

  const handleSelectClassFromTotal = (className) => {
    setSelectedClassForPerkelas(className);
    setCurrentTab('absensi-perkelas');
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Responsive Sidebar (Desktop Fixed + Mobile/Tablet Drawer) */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={handleTabChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
          onLogout={() => setCurrentTab('absensi-total')}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        />

        <main className="flex-1 overflow-y-auto w-full">
          {currentTab === 'absensi-total' && (
            <DashboardTotal
              onStartKiosk={() => setCurrentTab('kiosk')}
              onSelectClass={handleSelectClassFromTotal}
            />
          )}

          {currentTab === 'absensi-perkelas' && (
            <AbsensiPerkelas initialClass={selectedClassForPerkelas} />
          )}

          {currentTab === 'data-siswa' && <DataSiswa />}

          {currentTab === 'pengaturan' && <PengaturanSistem />}
        </main>
      </div>

      <LoginModal />
      <QuickSearchModal 
        isOpen={isQuickSearchOpen} 
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectStudentClass={(cls) => {
          setSelectedClassForPerkelas(cls);
          setCurrentTab('absensi-perkelas');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
