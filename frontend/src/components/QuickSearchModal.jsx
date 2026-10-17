import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Search, GraduationCap, X, ArrowRight, User } from 'lucide-react';

export default function QuickSearchModal({ isOpen, onClose, onSelectStudentClass }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students?search=${encodeURIComponent(query.trim())}&limit=8`);
        if (res.data.success) {
          setResults(res.data.data || []);
        }
      } catch (err) {
        console.error('Quick search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama siswa atau NISN... (Tekan Esc untuk menutup)"
            className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold hidden sm:inline-block">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {loading && (
            <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Mencari data siswa...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="text-xs font-semibold text-slate-600">Tidak ada siswa ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Periksa kembali ejaan nama atau nomor NISN</p>
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-slate-400">
              <p className="text-xs text-slate-500 font-medium">
                Ketik nama atau NISN siswa untuk pencarian cepat lintas rombel.
              </p>
            </div>
          )}

          {!loading && results.map((student) => (
            <div
              key={student.id}
              onClick={() => {
                if (onSelectStudentClass) {
                  onSelectStudentClass(student.className);
                }
                onClose();
              }}
              className="p-3.5 sm:p-4 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                    <span className="font-mono text-blue-600 font-semibold">NISN: {student.nisn}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Kelas {student.className}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Buka Rombel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer shortcuts note */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Pintasan:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">Ctrl+K</kbd>
            <span>Cari</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">F2</kbd>
            <span>Kiosk</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
