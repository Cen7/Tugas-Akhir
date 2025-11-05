import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X } from 'react-feather';

const CartItem = ({ item }) => {
    const { clearCartItem } = useCart();

    return (
        <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow">
            <div className="flex items-center gap-3">
                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-12 h-12 rounded-md object-cover"/>
                <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">x{item.quantity}</span>
                <button onClick={() => clearCartItem(item.id)} className="p-1 text-red-400 hover:text-red-600">
                    <X size={16}/>
                </button>
            </div>
        </div>
    );
};

export default CartItem;