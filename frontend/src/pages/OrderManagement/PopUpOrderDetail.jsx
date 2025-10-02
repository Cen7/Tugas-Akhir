import React, { useState } from 'react';
import { X } from 'react-feather';
import { useNavigate } from 'react-router-dom';

const PopUpOrderDetail = ({ order, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);

    const handleEditOrder = () => {
        navigate('/edit-order', { state: { currentOrder: order } });
    };

    const handleProcessPayment = async (method) => {
        try {
            const response = await fetch(`/api/penjualan/${order.transaksi_id}/bayar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metode_pembayaran: method }),
            });

            if (!response.ok) {
                throw new Error('Gagal memproses pembayaran');
            }

            alert(`Pembayaran berhasil dengan metode ${method}`);
            onClose(); 
            if (onUpdate) {
                onUpdate(); 
            }
        } catch (err) {
            alert(err.message);
        }
    };

    if (!order) return null;

    const getPaymentBadgeStyle = (status) => {
        switch (status) {
            case 'Paid': return 'text-green-700 bg-green-100';
            case 'Pending': return 'text-yellow-700 bg-yellow-100';
            case 'Not Paid': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    // --- LOGIKA BARU UNTUK KONDISI TOMBOL ---
    // Pesanan dianggap "read-only" jika sudah lunas atau dibatalkan.
    const isReadOnly = order.paymentStatus === 'Paid' || order.orderStatus === 'Cancelled';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 font-sans" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative text-gray-800" onClick={(e) => e.stopPropagation()}>
                {/* Header, Info Pesanan, Daftar Item, Total, dan Info Tambahan (tidak berubah) */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">{order.id || `Order #${order.transaksi_id}`}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex justify-between items-center py-4">
                    <div>
                        <p className="text-sm text-gray-500">Order type</p>
                        <p className="font-semibold">{order.type}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Order status</p>
                        <span className={`text-sm font-semibold px-2 py-1 rounded-md ${getPaymentBadgeStyle(order.paymentStatus)}`}>
                            {order.paymentStatus}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 py-4 border-t border-gray-200 max-h-48 overflow-y-auto">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="w-8 text-sm text-gray-600">{`x${item.quantity}`}</span>
                                <span className="font-medium">{item.name}</span>
                            </div>
                            <span className="text-sm text-gray-600">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 border-b-2 border-gray-200 font-bold">
                    <span>Total</span>
                    <span>Rp {order.total.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center pt-4 text-sm">
                    <p className="text-gray-500">
                        {order.paymentMethod || 'Belum Bayar'} by <span className="font-semibold text-gray-800">{order.cashier}</span>
                    </p>
                    <p className="text-gray-500">{new Date(order.date).toLocaleString('id-ID')}</p>
                </div>
                
                {/* --- BAGIAN TOMBOL AKSI DENGAN LOGIKA BARU --- */}
                <div className="mt-6 space-y-4">
                    {isReadOnly ? (
                        // JIKA SUDAH PAID ATAU CANCELLED, HANYA TAMPILKAN CETAK STRUK
                        <button className="w-full py-3 bg-white border border-[#D4A15D] text-[#D4A15D] font-semibold rounded-lg hover:bg-orange-50 transition">
                            Cetak Struk
                        </button>
                    ) : (
                        // JIKA BELUM BAYAR (NOT PAID / PENDING) DAN TIDAK CANCELLED
                        <>
                            {!showPaymentOptions ? (
                                <div className="flex gap-4">
                                    <button onClick={() => setShowPaymentOptions(true)} className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                                        Pilih Pembayaran
                                    </button>
                                    <button onClick={handleEditOrder} className="flex-1 py-3 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
                                        Ubah Pesanan
                                    </button>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-4">
                                    <p className="font-semibold text-center mb-3">Pilih Metode Pembayaran</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => handleProcessPayment('Tunai')} className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                            Tunai (Cash)
                                        </button>
                                        <button onClick={() => handleProcessPayment('QRIS')} className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                                            Digital (QRIS)
                                        </button>
                                    </div>
                                    <button onClick={() => setShowPaymentOptions(false)} className="w-full mt-3 text-sm text-gray-500 hover:underline">
                                        Batal
                                    </button>
                                </div>
                            )}
                            <button className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition">
                                Cetak Struk
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopUpOrderDetail;