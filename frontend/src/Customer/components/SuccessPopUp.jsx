// frontend/src/Customer/components/SuccessPopup.jsx
import React from 'react';

const SuccessPopup = ({ show, onClose, message, orderId }) => { 
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
             <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-xs" onClick={e => e.stopPropagation()}>
                 <h3 className="text-lg font-bold mb-3 text-green-600">Berhasil!</h3>
                 <p className="mb-4 text-gray-700">{message}</p>
                 {orderId && (
                    <div className="mb-4 p-2 bg-gray-100 rounded border border-gray-300">
                        <p className="text-sm text-gray-600">Nomor Pesanan Anda:</p>
                        <p className="font-bold text-2xl text-gray-800">#{orderId}</p>
                    </div>
                 )}
                 <p className="text-xs text-gray-500 mb-4">
                    {/* Pesan disesuaikan */}
                    {orderId ? "Silakan tunjukkan nomor ini ke kasir untuk pembayaran." : "Silakan tunggu pesanan Anda."}
                 </p>
                 <button onClick={onClose} className="w-full px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition">
                    OK
                 </button>
             </div>
        </div>
    );
};

export default SuccessPopup;