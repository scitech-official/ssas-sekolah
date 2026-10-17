import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', title = '', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, title = 'Berhasil') => addToast({ message: msg, type: 'success', title }),
    error: (msg, title = 'Terjadi Kesalahan') => addToast({ message: msg, type: 'error', title }),
    warning: (msg, title = 'Peringatan') => addToast({ message: msg, type: 'warning', title }),
    info: (msg, title = 'Informasi') => addToast({ message: msg, type: 'info', title }),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((item) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let icon = <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />;

          if (item.type === 'success') {
            bg = 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/40';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
          } else if (item.type === 'error') {
            bg = 'bg-slate-900/95 text-white border-rose-500/50 shadow-rose-950/40';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
          } else if (item.type === 'warning') {
            bg = 'bg-slate-900/95 text-white border-amber-500/50 shadow-amber-950/40';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start space-x-3 transition-all duration-300 transform translate-y-0 animate-slideIn ${bg}`}
              role="alert"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0 pr-1">
                {item.title && (
                  <div className="text-xs font-bold tracking-tight text-white mb-0.5 leading-snug">
                    {item.title}
                  </div>
                )}
                <div className="text-xs text-slate-300 leading-relaxed break-words font-medium">
                  {item.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(item.id)}
                className="p-1 -mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if invoked outside provider
    return {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg),
      info: (msg) => console.info('[Toast Info]', msg),
    };
  }
  return ctx.toast;
}
