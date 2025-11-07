// frontend/src/Customer/components/MenuItemCard.jsx
import React from 'react';
import { useCart } from '../contexts/CartContext';

const MenuItemCard = ({ item, isReadOnly, existingQuantity }) => { 
    const { addToCart, removeFromCart, getQuantityInCart } = useCart();
    
    if (!item) return null;

    // Kuantitas yang ditampilkan (sudah benar: ambil dari existing jika readOnly)
    const quantity = isReadOnly ? (existingQuantity || 0) : getQuantityInCart(item.menu_id); 
    
    const isAvailable = item.status === 'tersedia';

    // Check if there's an active promo
    const hasPromo = item.promo_id && item.harga_promo;
    const price = hasPromo ? parseFloat(item.harga_promo) : (typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga);
    const originalPrice = typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga;
    const isValidPrice = !isNaN(price) && price >= 0;

    return (
        // --- HAPUS STYLE DISABLE DARI DIV INI ---
        <div className={`bg-white rounded-lg shadow overflow-hidden flex flex-col relative ${
            !isAvailable ? 'opacity-50 pointer-events-none grayscale' : '' // Hanya disable jika item TIDAK TERSEDIA
        }`}>
            {/* Overlay "Tidak Tersedia" (hanya jika item memang tidak tersedia) */}
            {!isAvailable && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                    <span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded">
                        Tidak Tersedia
                    </span>
                </div>
            )}

            <img 
                src={
                    item.has_gambar 
                        ? `http://localhost:3000/api/menu/gambar/${item.menu_id}?t=${new Date().getTime()}` 
                        : '/images/placeholder_food.png'
                } 
                alt={item.nama_menu || 'Menu item'} 
                className="w-full h-24 object-cover bg-gray-200"
                onError={(e) => { e.target.onerror = null; e.target.src='/images/placeholder_food.png'; }}
            />
            <div className="p-3 flex flex-col flex-grow">
                <p className="font-semibold text-sm">{item.nama_menu || 'Nama Menu'}</p>
                
                {/* Display promo badge if active */}
                {hasPromo && (
                    <div className="flex items-center gap-1 mb-1">
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            PROMO {item.persentase_diskon}%
                        </span>
                    </div>
                )}
                
                {/* Display price with strikethrough if promo */}
                <div className="mb-2">
                    {hasPromo ? (
                        <>
                            <p className="text-xs text-gray-400 line-through">
                                Rp {originalPrice.toLocaleString('id-ID')}
                            </p>
                            <p className="text-sm font-bold text-red-600">
                                Rp {price.toLocaleString('id-ID')}
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Rp {isValidPrice ? price.toLocaleString('id-ID') : 'N/A'}
                        </p>
                    )}
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                     <span className="text-xs text-gray-400">{item.kategori || 'Kategori'}</span>
                     <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1 py-1">
                         {/* Tombol di-disable jika readOnly ATAU item tidak tersedia */}
                         <button 
                            onClick={() => removeFromCart(item.menu_id)} 
                            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            // Disable jika readOnly, ATAU item tdk tersedia, ATAU quantity 0
                            disabled={isReadOnly || !isAvailable || quantity === 0} 
                         >-</button>
                         {/* Tampilkan kuantitas */}
                         <span className={`font-semibold text-sm w-4 text-center ${isReadOnly ? 'text-gray-500' : 'text-gray-800'}`}>
                             {quantity} 
                         </span>
                         <button 
                            onClick={() => addToCart(item)} 
                            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            // Disable jika readOnly ATAU item tdk tersedia
                            disabled={isReadOnly || !isAvailable} 
                         >+</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default MenuItemCard;