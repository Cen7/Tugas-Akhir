// frontend/src/Customer/pages/COverviewPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import SuccessPopup from '../components/SuccessPopup';
// Hapus import PaymentModal

const COverviewPage = () => {
    const navigate = useNavigate();
    const { cartItems, totalAmount, orderType, clearCart , tableId} = useCart();
    const { showNotification } = useNotification();
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [searchParams] = useSearchParams();
    const [mejaId, setMejaId] = useState(null);
    const [customerName, setCustomerName] = useState('');

    useEffect(() => {
        const idMejaDariUrl = searchParams.get('meja');
        if (idMejaDariUrl) {
            setMejaId(idMejaDariUrl);
        }
        // Cek jika ada order aktif, arahkan ke status
        if (localStorage.getItem('activeOrderId')) {
            navigate('/order/status');
        }
    }, [searchParams, navigate]);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) return;
        if (!orderType) {
            showNotification("Tipe pesanan belum dipilih.", "warning");
            navigate('/order');
            return;
        }

        try {
            const orderData = {
                tipe_pesanan: orderType,
                items: cartItems.map(item => ({
                    menu_id: item.menu_id,
                    jumlah: item.quantity,
                    harga_satuan: item.price || item.harga
                })),
                total_harga: totalAmount,
                meja_id: orderType === 'Dine-in' ? tableId : null
            };
                // include customer name
            orderData.nama_pembeli = customerName;
            console.log("Mengirim data pesanan:", orderData);

            const response = await fetch('/api/penjualan/customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal membuat pesanan');
            }

            const result = await response.json();
            setOrderId(result.transaksi_id);
            // Simpan ID ke localStorage
            localStorage.setItem('activeOrderId', result.transaksi_id);
            setIsSuccessPopupOpen(true); // Tampilkan popup sukses

        } catch (error) {
            console.error("Error saat place order:", error);
            showNotification(`Gagal membuat pesanan: ${error.message}`, "error");
        }
    };

    const handleSuccessPopupClose = () => {
        setIsSuccessPopupOpen(false);
        clearCart();
        // Arahkan ke halaman status setelah popup ditutup
        navigate(`/order/status`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold text-center mb-4 bg-[#D4A15D] text-white py-2 rounded-lg shadow">Overview Pesanan</h1>

            <div className="flex-grow overflow-y-auto space-y-2 mb-4 border-b pb-4">
                {cartItems.map(item => (
                    <div key={item.menu_id} className="flex justify-between items-center text-sm py-1">
                        <span className="flex-1 mr-2">{item.nama_menu || item.name} <span className="text-gray-500">x {item.quantity}</span></span>
                        <span className="w-24 text-right">Rp {((item.price || item.harga || 0) * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                ))}
            </div>

            <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700">Nama Pembeli</label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masukkan nama pembeli"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>

            <div className="mt-auto">
                <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={handlePlaceOrder}
                        className="flex-1 py-3 bg-[#D4A15D] text-white rounded-lg font-bold"
                        disabled={cartItems.length === 0 || !orderType || customerName.trim() === ''} // Disable juga jika orderType null atau nama pembeli kosong
                    >
                        Pesan Sekarang ›
                    </button>
                </div>
            </div>

            <SuccessPopup
                show={isSuccessPopupOpen}
                onClose={handleSuccessPopupClose}
                message="Pesanan berhasil dibuat!"
                orderId={orderId}
            />
            {/* PaymentModal tidak dipanggil di sini lagi */}
        </div>
    );
};

export default COverviewPage;