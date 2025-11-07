import React from 'react';
import { X } from 'react-feather';

const StockWarning = ({ warnings, onClose }) => {
  if (!warnings || (warnings.stokMenipis.length === 0 && warnings.stokKadaluwarsa.length === 0)) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center pt-20 z-50" onClick={onClose}>
      <div 
        className="bg-red-50 border border-red-200 rounded-lg shadow-xl w-full max-w-md p-6 relative text-red-800" 
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-100 transition">
          <X size={20} />
        </button>
        
        <h3 className="text-lg font-bold text-red-900 mb-4">Peringatan Stok</h3>

        {warnings.stokMenipis.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold">Stok Menipis:</p>
            <ul className="list-disc list-inside text-sm">
              {warnings.stokMenipis.map((item, index) => (
                <li key={`low-${index}`}>{item.nama_bahan} ({item.total_stok} {item.satuan})</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.stokKadaluwarsa.length > 0 && (
          <div>
            <p className="font-semibold">Stok Kedaluwarsa:</p>
            <ul className="list-disc list-inside text-sm">
              {warnings.stokKadaluwarsa.map((item, index) => (
                <li key={`exp-${index}`}>{item.nama_bahan} - {item.sisa_hari} hari lagi</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockWarning;