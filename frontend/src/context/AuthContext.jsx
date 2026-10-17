import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ssas_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ssas_token') || null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authLoadingMessage, setAuthLoadingMessage] = useState('');

  useEffect(() => {
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem('ssas_user');
      const savedToken = localStorage.getItem('ssas_token');
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setToken(savedToken || null);
    };

    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  const login = async (username, password) => {
    setAuthLoading(true);
    setAuthLoadingMessage('Memverifikasi kredensial & menyiapkan sesi Admin...');
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('ssas_token', token);
        localStorage.setItem('ssas_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        // Small graceful pause so user sees verification feedback
        await new Promise((r) => setTimeout(r, 650));
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } finally {
      setAuthLoading(false);
      setAuthLoadingMessage('');
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    setAuthLoadingMessage('Mengakhiri sesi Admin & memuat portal absensi reguler...');
    await new Promise((r) => setTimeout(r, 650));
    localStorage.removeItem('ssas_token');
    localStorage.removeItem('ssas_user');
    setToken(null);
    setUser(null);
    setAuthLoading(false);
    setAuthLoadingMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        authLoading,
        authLoadingMessage,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
      {children}

      {/* Global Auth Transition Loading Overlay (Login & Logout) */}
      {authLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="p-7 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center relative shadow-lg shadow-blue-500/10">
              <div className="w-7 h-7 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base tracking-wide flex items-center justify-center space-x-1.5">
                <span>SSAS SMPN 3 JEMBER</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                {authLoadingMessage || 'Memproses otentikasi sistem...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
