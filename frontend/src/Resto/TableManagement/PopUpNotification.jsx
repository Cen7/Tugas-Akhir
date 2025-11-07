// frontend/src/Resto/TableManagement/PopUpNotification.jsx
import React from 'react';

const PopUpNotification = ({ show, message, type = 'success', onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-[70] animate-slideInRight">
            <div className={`rounded-lg shadow-2xl w-96 overflow-hidden ${
                type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                'bg-amber-50 border-l-4 border-amber-500'
            }`}>
                <div className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${
                        type === 'success' ? 'text-green-500' :
                        type === 'error' ? 'text-red-500' :
                        'text-amber-500'
                    }`}>
                        {type === 'success' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : type === 'error' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    
                    {/* Message */}
                    <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                            type === 'success' ? 'text-green-800' :
                            type === 'error' ? 'text-red-800' :
                            'text-amber-800'
                        }`}>
                            {type === 'success' ? 'Berhasil!' :
                             type === 'error' ? 'Error!' :
                             'Perhatian!'}
                        </h4>
                        <p className={`text-sm ${
                            type === 'success' ? 'text-green-700' :
                            type === 'error' ? 'text-red-700' :
                            'text-amber-700'
                        }`}>
                            {message}
                        </p>
                    </div>
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`flex-shrink-0 ${
                            type === 'success' ? 'text-green-500 hover:text-green-700' :
                            type === 'error' ? 'text-red-500 hover:text-red-700' :
                            'text-amber-500 hover:text-amber-700'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopUpNotification;
