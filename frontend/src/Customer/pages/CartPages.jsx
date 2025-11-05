import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/CartItem'; // Buat komponen ini

const CartPage = () => {
    const navigate = useNavigate();
    const { cartItems, totalAmount } = useCart();

    return (
         <div className="flex flex-col h-screen bg-gray-50 p-4">
             <h1 className="text-xl font-bold text-center mb-4 bg-yellow-500 text-white py-2 rounded-lg">Pesanan Anda</h1>
             
             {cartItems.length === 0 ? (
                 <p className="text-center text-gray-500 flex-grow">Keranjang kosong.</p>
             ) : (
                 <div className="flex-grow overflow-y-auto space-y-3 mb-4">
                    {cartItems.map(item => (
                        <CartItem key={item.id} item={item} />
                    ))}
                 </div>
             )}

            {cartItems.length > 0 && (
                <div className="mt-auto border-t pt-4">
                     <div className="flex justify-between font-bold mb-4">
                         <span>Total</span>
                         <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                     </div>
                     <div className="flex gap-4">
                          <button onClick={() => navigate('/order/menu')} className="flex-1 py-3 border border-gray-300 rounded-lg">Kembali</button>
                          <button onClick={() => navigate('/order/overview')} className="flex-1 py-3 bg-yellow-600 text-white rounded-lg">Pesan</button>
                     </div>
                </div>
            )}
             {/* Footer Navigasi */}
             <div className="p-3 bg-white flex sticky bottom-0 z-10 border-t mt-4">
                <button onClick={() => navigate('/order/menu')} className="flex-1 text-center font-semibold text-gray-500">
                    Menu
                </button>
                <button onClick={() => navigate('/order/cart')} className="flex-1 text-center font-bold text-yellow-700 border-b-2 border-yellow-700 pb-1">
                    Keranjang
                </button>
            </div>
         </div>
    );
};
// Jangan lupa buat komponen CartItem.jsx
export default CartPage;