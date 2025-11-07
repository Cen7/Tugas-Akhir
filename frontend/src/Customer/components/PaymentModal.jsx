import React from 'react';
import { X } from 'react-feather';
import { useNotification } from '../contexts/NotificationContext';

const PaymentModal = ({ isOpen, onClose, orderId, totalAmount, onPaymentSuccess }) => {
    const { showNotification } = useNotification();
    
    if (!isOpen) return null;

    const handlePayment = async (method) => {
        // Simulasi / Panggil API Pembayaran
        try {
            // Ganti URL ini dengan endpoint Anda
            const response = await fetch(`/api/penjualan/${orderId}/bayar`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metode_pembayaran: method })
            });
            if (!response.ok) throw new Error(`Pembayaran ${method} gagal`);

            // Jika berhasil
            onPaymentSuccess();

        } catch(err) {
            showNotification(err.message, "error");
            // Anda bisa tambahkan logic jika pembayaran gagal
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Pilih Pembayaran</h3>
                     <button onClick={onClose}><X size={20} /></button>
                </div>
                 <p className="text-center mb-2">Total: <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span></p>
                <div className="space-y-3">
                     <button onClick={() => handlePayment('QRIS')} className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold">
                        Bayar Digital (QRIS)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;