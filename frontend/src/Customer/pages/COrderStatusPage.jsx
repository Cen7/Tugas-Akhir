// frontend/src/Customer/pages/COrderStatusPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import PaymentModal from '../components/PaymentModal'; // Pastikan path ini benar

const COrderStatusPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
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
            const response = await fetch(`/api/penjualan/${id}`);

            if (response.status === 404) {
                localStorage.removeItem('activeOrderId');
                showNotification("Pesanan Anda sudah tidak aktif atau tidak ditemukan.", "warning");
                navigate('/order');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengambil detail pesanan');
            }

            const data = await response.json();
            // Jika sudah selesai atau dibatalkan, kembali ke halaman order
            if (data.orderStatus === 'Selesai' || data.orderStatus === 'Dibatalkan' || data.orderStatus === 'Cancel') {
                localStorage.removeItem('activeOrderId');
                showNotification(`Pesanan #${id} sudah ${data.orderStatus}.`, "success");
                navigate('/order');
                return;
            }

            setOrderDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, showNotification]);

    // Ambil orderId dari localStorage saat mount
    useEffect(() => {
        const activeId = localStorage.getItem('activeOrderId');
        if (!activeId) {
            navigate('/order');
        } else {
            setOrderId(activeId);
        }
    }, [navigate]);

    // Fetch detail saat orderId tersedia
    useEffect(() => {
        if (orderId) {
            fetchDetails(orderId);
            const interval = setInterval(() => fetchDetails(orderId), 60000);
            return () => clearInterval(interval);
        }
    }, [orderId, fetchDetails]);

    // Fungsi yang dipanggil setelah pembayaran berhasil
    const handlePaymentComplete = () => {
        setIsPaymentModalOpen(false);
        localStorage.removeItem('activeOrderId');
        showNotification("Pembayaran Berhasil! Terima kasih.", "success");
        navigate('/order');
    };

    // Tampilan Loading, Error, atau jika data belum siap
    if (loading) return <div className="p-6 text-center text-gray-600">Memuat status pesanan...</div>;
    if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    if (!orderDetails) return null;

    // Cek apakah tombol bayar boleh ditampilkan
    const canPay = orderDetails.paymentStatus !== 'Lunas' && orderDetails.orderStatus !== 'Dibatalkan';

    // Helper function untuk translate status ke Bahasa Indonesia
    const getOrderStatusLabel = (status) => {
        const labels = {
            'Pending': 'Pending',
            'Diproses': 'Diproses',
            'Siap': 'Siap',
            'Selesai': 'Selesai',
            'Dibatalkan': 'Dibatalkan'
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status) => {
        const labels = {
            'Lunas': 'Lunas',
            'Belum Lunas': 'Belum Lunas',
            'Pending': 'Pending',
            'Dibatalkan': 'Dibatalkan'
        };
        return labels[status] || status;
    };

    return (
        <>
            <Helmet><title>Status Pesanan #{orderId} | MiWau</title></Helmet>
            <div className="flex flex-col min-h-screen bg-gray-50 p-4">
                <h1 className="text-xl font-bold text-center mb-4 bg-gray-700 text-white py-2 rounded-lg shadow">Status Pesanan Anda</h1>

                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <p className="text-sm text-gray-600">Nomor Pesanan:</p>
                    <p className="font-bold text-2xl text-gray-800 mb-2">#{orderDetails.transaksi_id}</p>
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            { (orderDetails.customer || orderDetails.nama_pembeli) && (
                                <p className="text-sm text-gray-700">Nama Pembeli: <span className="font-semibold">{orderDetails.customer || orderDetails.nama_pembeli}</span></p>
                            )}
                            <p>Status Pesanan: <span className="font-semibold">{getOrderStatusLabel(orderDetails.orderStatus)}</span></p>
                        </div>
                        <div>
                            <span>Status Bayar: <span className="font-semibold">{getPaymentStatusLabel(orderDetails.paymentStatus)}</span></span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {orderDetails.type === 'Dine-in'
                            ? `Meja ${orderDetails.id || 'N/A'}`
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