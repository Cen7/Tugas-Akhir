import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Logo from '../../components/common/Logo';

const CHomePage = () => {
    const navigate = useNavigate();
    // --- PERBAIKAN DI SINI ---
    const { setOrderType, clearCart } = useCart(); // Tambahkan clearCart

    const handleSelectType = (type) => {
        clearCart(); // Sekarang fungsi ini sudah terdefinisi
        setOrderType(type);
        if (type === 'Dine-in') {
             navigate('/order/menu?meja=1'); 
        } else {
             navigate('/order/menu');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-4">
            <div className="mb-8"> 
                <Logo className="w-80 h-80" /> {/* Pastikan Logo.jsx bisa menerima className */}
            </div>
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">SELAMAT DATANG</h1>
            <p className="text-gray-600 mb-8">Pilih cara pemesanan</p>
            <div className="flex gap-4">
                <button
                    onClick={() => handleSelectType('Dine-in')}
                    className="px-8 py-4 border-2 border-yellow-600 text-yellow-700 font-bold rounded-lg text-xl hover:bg-yellow-100 transition"
                >
                    Dine-in
                </button>
                <button
                    onClick={() => handleSelectType('Takeaway')}
                    className="px-8 py-4 border-2 border-gray-500 text-gray-600 font-bold rounded-lg text-xl hover:bg-gray-100 transition"
                >
                    Takeaway
                </button>
            </div>
        </div>
    );
};

export default CHomePage;