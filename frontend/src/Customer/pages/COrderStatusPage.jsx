// frontend/src/Customer/pages/COrderStatusPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal'; // Pastikan path ini benar

const COrderStatusPage = () => {
    const navigate = useNavigate();
    const [orderId, setOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Fungsi untuk mengambil detail pesanan
    const fetchDetails = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Gunakan endpoint GET /api/penjualan/:id
            const response = await fetch(`/api/penjualan/${id}`);

            if (response.status === 404) {
                // Pesanan mungkin sudah selesai/dihapus di backend
                localStorage.removeItem('activeOrderId');
                alert("Pesanan Anda sudah tidak aktif atau tidak ditemukan.");
                navigate('/order');
                return;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengambil detail pesanan');
            }

            const data = await response.json();
            // Cek lagi jika statusnya sudah selesai (misal dibayar via kasir)
            if (data.orderStatus === 'Completed' || data.orderStatus === 'Cancelled') {
                localStorage.removeItem('activeOrderId');
                alert(`Pesanan #${id} sudah ${data.orderStatus}.`);
                navigate('/order');
                return;
            }
            setOrderDetails(data);
        } catch (err) {
            setError(err.message);
            // Pertimbangkan untuk menghapus ID jika fetch gagal berkali-kali?
            // localStorage.removeItem('activeOrderId');
            // navigate('/order');
        } finally {
            setLoading(false);
        }
    }, [navigate]); // navigate ditambahkan sebagai dependency

    // 1. Baca orderId dari localStorage saat komponen mount
    useEffect(() => {
        const activeId = localStorage.getItem('activeOrderId');
        if (!activeId) {
            console.log("Tidak ada ID pesanan aktif di localStorage, kembali ke home.");
            navigate('/order'); // Kembali jika tidak ada ID
        } else {
            setOrderId(activeId);
        }
    }, [navigate]);

    // 2. Fetch detail pesanan ketika orderId sudah didapatkan
    useEffect(() => {
        if (orderId) {
            fetchDetails(orderId);
            // Set interval untuk refresh status secara berkala (misal setiap 1 menit)
            const interval = setInterval(() => fetchDetails(orderId), 60000);
            return () => clearInterval(interval); // Bersihkan interval saat unmount
        }
    }, [orderId, fetchDetails]); // fetchDetails ditambahkan sebagai dependency

    // Fungsi yang dipanggil setelah pembayaran berhasil
    const handlePaymentComplete = () => {
        setIsPaymentModalOpen(false);
        localStorage.removeItem('activeOrderId'); // Hapus ID setelah lunas
        alert("Pembayaran Berhasil! Terima kasih.");
        navigate('/order'); // Kembali ke halaman awal
    };

    // Tampilan Loading, Error, atau jika data belum siap
    if (loading) return <div className="p-6 text-center text-gray-600">Memuat status pesanan...</div>;
    if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    if (!orderDetails) return null; // Atau tampilkan pesan "Tidak ada detail"

    // Cek apakah tombol bayar boleh ditampilkan
    const canPay = orderDetails.paymentStatus !== 'Paid' && orderDetails.orderStatus !== 'Cancelled';

    return (
        <>
            <Helmet><title>Status Pesanan #{orderId} | MiWau</title></Helmet>
            <div className="flex flex-col min-h-screen bg-gray-50 p-4">
                <h1 className="text-xl font-bold text-center mb-4 bg-gray-700 text-white py-2 rounded-lg shadow">Status Pesanan Anda</h1>

                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <p className="text-sm text-gray-600">Nomor Pesanan:</p>
                    <p className="font-bold text-2xl text-gray-800 mb-2">#{orderDetails.transaksi_id}</p>
                    <div className="flex justify-between items-center text-sm">
                        <span>Status Pesanan: <span className="font-semibold">{orderDetails.orderStatus}</span></span>
                        <span>Status Bayar: <span className="font-semibold">{orderDetails.paymentStatus}</span></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {/* --- PASTIKAN MENAMPILKAN orderDetails.id (ALIAS nomor_meja) --- */}
                        {orderDetails.type === 'Dine-in'
                            ? `Meja ${orderDetails.id || 'N/A'}` // Tampilkan nomor meja dari API
                            : 'Takeaway'}
                        {' - '}
                        {new Date(orderDetails.date).toLocaleString('id-ID', { timeStyle: 'short' })}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex-grow overflow-y-auto mb-4">
                    <h2 className="font-semibold mb-2 text-gray-800">Item Pesanan:</h2>
                    <div className="space-y-1">
                        {(orderDetails.items && orderDetails.items.length > 0) ? orderDetails.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} <span className="text-gray-500">x {item.quantity}</span></span>
                                <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                        )) : <p className="text-sm text-gray-500">Detail item tidak tersedia.</p>}
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4 border-t pt-2">
                        <span>Total</span>
                        <span>Rp {(orderDetails.total || 0).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    {canPay && (
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
                        >
                            Bayar Sekarang
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/order/menu')} // Tombol untuk kembali ke menu
                        className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition"
                    >
                        Kembali ke Menu
                    </button>
                </div>

                {/* Modal Pembayaran dipanggil di sini */}
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    orderId={orderId}
                    totalAmount={orderDetails.total}
                    onPaymentSuccess={handlePaymentComplete}
                />
            </div>
        </>
    );
};

export default COrderStatusPage;