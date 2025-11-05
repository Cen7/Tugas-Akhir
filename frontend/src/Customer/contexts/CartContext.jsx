import React, { createContext, useState, useContext, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [orderType, setOrderType] = useState(null);
    const [tableId, setTableId] = useState(null); // <-- STATE BARU

    const addToCart = (item) => {
        setCartItems(prevItems => {
            // --- UBAH DISINI ---
            const existingItem = prevItems.find(i => i.menu_id === item.menu_id); 
            if (existingItem) {
                return prevItems.map(i =>
                    // --- UBAH DISINI ---
                    i.menu_id === item.menu_id ? { ...i, quantity: i.quantity + 1 } : i 
                );
            }
            // Pastikan item yang ditambahkan memiliki menu_id
            return [...prevItems, { ...item, quantity: 1 }]; 
        });
    };

    const removeFromCart = (itemId) => { // Parameter di sini adalah menu_id
        setCartItems(prevItems => {
            // --- UBAH DISINI ---
            const existingItem = prevItems.find(i => i.menu_id === itemId); 
            if (existingItem && existingItem.quantity > 1) {
                return prevItems.map(i =>
                    // --- UBAH DISINI ---
                    i.menu_id === itemId ? { ...i, quantity: i.quantity - 1 } : i 
                );
            }
            // --- UBAH DISINI ---
            return prevItems.filter(i => i.menu_id !== itemId); 
        });
    };

    const clearCartItem = (itemId) => { // Parameter di sini adalah menu_id
         // --- UBAH DISINI ---
         setCartItems(prevItems => prevItems.filter(i => i.menu_id !== itemId)); 
    };

    const clearCart = () => {
        setCartItems([]);
    };

    // Fungsi baru untuk set tableId
    const setTable = (id) => {
        setTableId(id);
    };

    const getQuantityInCart = (itemId) => { // Parameter di sini adalah menu_id
        // --- UBAH DISINI ---
        const item = cartItems.find(i => i.menu_id === itemId); 
        return item ? item.quantity : 0;
    };

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cartItems]);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        clearCartItem,
        clearCart,
        getQuantityInCart,
        totalAmount,
        orderType,
        setOrderType,
        tableId,      // <-- EXPORT STATE BARU
        setTable,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);