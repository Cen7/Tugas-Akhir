// frontend/src/Resto/TableManagement/PopUpConfirm.jsx
import React from 'react';

const PopUpConfirm = ({ show, message, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-slideUp">
                {/* Header */}
                <div className="bg-amber-500 text-white p-4 rounded-t-lg flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-bold">Konfirmasi</h3>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 text-base leading-relaxed">
                        {message}
                    </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 p-4 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => {
                            if (onConfirm) {
                                onConfirm();
                            }
                            onCancel();
                        }}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        Ya, Lanjutkan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopUpConfirm;
