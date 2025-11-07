import React, { useState } from 'react';
import { X } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PopUpOrderDetail = ({ order, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCashInput, setShowCashInput] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');

    const handleEditOrder = () => {
        navigate('/edit-order', { state: { currentOrder: order } });
    };

    const { currentUser } = useAuth();

    const handleProcessPayment = async (method, jumlah_bayar = null) => {
        try {
            const body = { metode_pembayaran: method };
            if (jumlah_bayar != null) body.jumlah_bayar = jumlah_bayar;

            // Attach cashier info from current session so backend can attribute payment to logged-in user
            const userId = currentUser?.id || currentUser?.user_id || null;
            const namaKasir = currentUser?.nama || currentUser?.nama_lengkap || currentUser?.name || null;
            if (userId) body.user_id = userId;
            if (namaKasir) body.nama_kasir = namaKasir;

            const response = await fetch(`/api/penjualan/${order.transaksi_id}/bayar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Gagal memproses pembayaran');
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

    const handleCancelOrder = async () => {
        try {
            const response = await fetch(`/api/penjualan/${order.transaksi_id}/batal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Gagal membatalkan pesanan');
            }

            alert('Pesanan berhasil dibatalkan');
            setShowCancelConfirm(false);
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
            case 'Lunas': return 'text-green-700 bg-green-100';
            case 'Pending': return 'text-yellow-700 bg-yellow-100';
            case 'Belum Lunas': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    // --- LOGIKA BARU UNTUK KONDISI TOMBOL ---
    // Pesanan dianggap "read-only" jika sudah lunas atau dibatalkan.
    const isReadOnly = order.paymentStatus === 'Lunas' || order.orderStatus === 'Dibatalkan' || order.orderStatus === 'Cancel';

    // Kasir / petugas yang memproses pembayaran - fallback ke beberapa kemungkinan nama field
    const cashierName = order.cashier || order.nama_kasir || order.nama_user || order.user_name || order.petugas || order.nama_petugas;
    const paymentMethodText = order.paymentMethod === 'Tunai' ? 'Cash' : (order.paymentMethod === 'QRIS' ? 'Online Payment' : (order.paymentMethod || order.metode_pembayaran || ''));

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
                        <div>
                            { (order.customer || order.nama_pembeli) && (
                                <p className="text-gray-500">Nama Customer: <span className="font-semibold text-gray-800">{order.customer || order.nama_pembeli}</span></p>
                            )}

                            {/* Show payment method only when already paid */}
                            {order.paymentStatus === 'Lunas' && (
                                <p className="text-gray-500">
                                    {paymentMethodText}
                                    {paymentMethodText === 'Cash' && cashierName ? ` oleh ${cashierName}` : ''}
                                </p>
                            )}
                        </div>
                        <p className="text-gray-500">{new Date(order.date).toLocaleString('id-ID')}</p>
                    </div>
                
                {/* --- BAGIAN TOMBOL AKSI DENGAN LOGIKA BARU --- */}
                <div className="mt-6 space-y-4">
                    {isReadOnly ? (
                        // JIKA SUDAH Lunas ATAU Dibatalkan, HANYA TAMPILKAN CETAK STRUK
                        <button className="w-full py-3 bg-white border border-[#D4A15D] text-[#D4A15D] font-semibold rounded-lg hover:bg-orange-50 transition">
                            Cetak Struk
                        </button>
                    ) : (
                        // JIKA BELUM BAYAR (Belum Lunas / PENDING) DAN TIDAK Dibatalkan
                        <>
                            {!showPaymentOptions && !showCancelConfirm ? (
                                <div className="space-y-3">
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowPaymentOptions(true)} className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                                            Pilih Pembayaran
                                        </button>
                                        <button onClick={handleEditOrder} className="flex-1 py-3 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
                                            Ubah Pesanan
                                        </button>
                                    </div>
                                    <button onClick={() => setShowCancelConfirm(true)} className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition">
                                        Batalkan Pesanan
                                    </button>
                                </div>
                            ) : showCancelConfirm ? (
                                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                                    <p className="font-semibold text-center mb-3 text-red-800">⚠️ Yakin batalkan pesanan ini?</p>
                                    <p className="text-sm text-center text-gray-600 mb-4">Pesanan yang dibatalkan tidak dapat dikembalikan.</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                                            Tidak
                                        </button>
                                        <button onClick={handleCancelOrder} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                            Ya, Batalkan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-4">
                                    <p className="font-semibold text-center mb-3">Pilih Metode Pembayaran</p>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            {!showCashInput ? (
                                                <button onClick={() => setShowCashInput(true)} className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                                    Tunai (Cash)
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(e.target.value)}
                                                        placeholder="Masukkan jumlah tunai"
                                                        className="w-full px-3 py-2 rounded-md border border-gray-300"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const amt = Number(amountPaid);
                                                                if (isNaN(amt) || amt <= 0) return alert('Masukkan jumlah tunai yang valid');
                                                                if (amt < Number(order.total || order.total_harga || 0)) return alert('Jumlah tunai kurang dari total');
                                                                handleProcessPayment('Tunai', amt);
                                                            }}
                                                            className="flex-1 py-2 bg-green-600 text-white rounded-lg"
                                                        >Bayar & Cetak</button>
                                                        <button onClick={() => { setShowCashInput(false); setAmountPaid(''); }} className="flex-1 py-2 bg-gray-200 rounded-lg">Batal</button>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Kembalian: <span className="font-semibold">Rp { ( (Number(amountPaid || 0) - Number(order.total || order.total_harga || 0)) > 0 ? (Number(amountPaid || 0) - Number(order.total || order.total_harga || 0)) : 0 ).toLocaleString('id-ID') }</span></p>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleProcessPayment('QRIS')} className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                                            Digital (QRIS)
                                        </button>
                                    </div>
                                    <button onClick={() => { setShowPaymentOptions(false); setShowCashInput(false); setAmountPaid(''); }} className="w-full mt-3 text-sm text-gray-500 hover:underline">
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