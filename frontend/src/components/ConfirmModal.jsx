import React from 'react';
import { AlertTriangle, HelpCircle, CheckCircle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Aksi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'primary', // 'primary' | 'danger' | 'warning' | 'success'
  isLoading = false,
  children,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
      icon: HelpCircle,
      button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    },
    danger: {
      iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
      icon: AlertTriangle,
      button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
      icon: AlertTriangle,
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    },
    success: {
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
      icon: CheckCircle,
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const IconComponent = currentVariant.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${currentVariant.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {message}
              </p>
              {children && (
                <div className="mt-3">
                  {children}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium text-sm transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all flex items-center gap-2 ${currentVariant.button} ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
