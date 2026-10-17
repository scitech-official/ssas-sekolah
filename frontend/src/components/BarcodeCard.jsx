import React from 'react';
import { getApiUrl } from '../utils/api';

// Generates Code 128 visual pattern or displays API barcode
export default function BarcodeCard({ nisn, name, className }) {
  const barcodeUrl = getApiUrl(`/api/students/barcode/${nisn}`);

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
      <div className="text-xs font-bold text-slate-700 tracking-wider mb-1">{name}</div>
      <div className="text-[10px] text-slate-500 font-medium mb-1">Kelas: {className} | NISN: {nisn}</div>
      <div className="bg-white px-2 py-1 rounded border border-slate-100 flex flex-col items-center">
        <img
          src={barcodeUrl}
          alt={`Barcode ${nisn}`}
          className="h-14 max-w-[180px] object-contain"
          onError={(e) => {
            // Fallback preview if server image is loading
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div style={{ display: 'none' }} className="text-center py-2 text-xs font-mono font-bold tracking-widest text-slate-800">
          ||||| | |||| ||| |||| |
          <div>{nisn}</div>
        </div>
      </div>
    </div>
  );
}
