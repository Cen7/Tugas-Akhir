import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import { X } from 'react-feather';

const EditOrderPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [menuData, setMenuData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [cart, setCart] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/menu');
                if (!response.ok) throw new Error('Gagal mengambil data menu');
                const data = await response.json();
                setMenuData(data);
            } catch (err) {
                console.error('Error fetching menu:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    useEffect(() => {
        const orderToEdit = location.state?.currentOrder;

        if (orderToEdit && orderToEdit.items && Object.keys(menuData).length > 0) {
            const allMenuItemsList = Object.values(menuData).flat().map(item => ({
                ...item,
                harga: typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga
            }));

            const initialCart = orderToEdit.items.map((orderItem, index) => {
                const menuItem = allMenuItemsList.find(m => m.nama_menu === orderItem.name);

                if (menuItem) {
                    return {
                        ...menuItem,
                        quantity: orderItem.quantity
                    };
                } else {
                    return {
                        menu_id: `fallback-${orderItem.name}-${index}`,
                        nama_menu: orderItem.name,
                        harga: orderItem.price,
                        quantity: orderItem.quantity,
                        kategori: 'Unknown',
                        has_gambar: false
                    };
                }
            }).filter(item => item && !isNaN(item.harga) && item.harga > 0);

            setCart(initialCart);
        }
    }, [location.state, menuData]);

    const handleAddItem = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.menu_id === item.menu_id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.menu_id === item.menu_id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const handleRemoveItem = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.menu_id === item.menu_id);
            if (existingItem && existingItem.quantity > 1) {
                return prevCart.map(cartItem =>
                    cartItem.menu_id === item.menu_id
                        ? { ...cartItem, quantity: cartItem.quantity - 1 }
                        : cartItem
                );
            }
            return prevCart.filter(cartItem => cartItem.menu_id !== item.menu_id);
        });
    };

    const handleClearItem = (itemId) => {
        setCart(prevCart => prevCart.filter(cartItem => cartItem.menu_id !== itemId));
    };

    const getQuantityInCart = (itemId) => {
        const item = cart.find(cartItem => cartItem.menu_id === itemId);
        return item ? item.quantity : 0;
    };

    const handleUpdateOrder = async () => {
        const orderToEdit = location.state?.currentOrder;
        if (!orderToEdit) {
            alert('Data pesanan tidak ditemukan');
            return;
        }

        if (cart.length === 0) {
            alert('Keranjang tidak boleh kosong');
            return;
        }

        const updatedItems = cart.map(item => ({
            id: item.menu_id,
            price: item.harga,
            quantity: item.quantity
        }));

        try {
            const response = await fetch(`/api/penjualan/${orderToEdit.transaksi_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updatedItems })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal memperbarui pesanan');
            }

            alert('Pesanan berhasil diperbarui!');
            navigate('/order-management');
        } catch (err) {
            console.error('Error updating order:', err);
            alert(err.message);
        }
    };

    const allMenuItems = useMemo(() => {
        if (!menuData || Object.keys(menuData).length === 0) {
            console.log('No menu data available');
            return [];
        }

        const items = Object.values(menuData).flat();
        console.log('All menu items:', items);

        // Convert harga dari string ke number dan filter yang valid
        const validItems = items.map(item => ({
            ...item,
            harga: typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga
        })).filter(item => {
            const isValid = !isNaN(item.harga) && item.harga > 0;
            if (!isValid) {
                console.log('Invalid item (no valid price):', item);
            }
            return isValid;
        });

        console.log('Valid items count:', validItems.length);
        return validItems;
    }, [menuData]);

    const categories = useMemo(() => {
        if (!menuData || Object.keys(menuData).length === 0) return ['All'];
        return ['All', ...Object.keys(menuData)];
    }, [menuData]);

    const displayedMenuItems = useMemo(() => {
        if (allMenuItems.length === 0) {
            return [];
        }

        // Jika All, return semua
        if (activeFilter === 'All') {
            return allMenuItems;
        }

        // Filter by category
        return allMenuItems.filter(item => item.kategori === activeFilter);
    }, [allMenuItems, activeFilter]);

    const totalCart = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    }, [cart]);

    return (
        <>
            <Helmet><title>Ubah Pesanan | MiWau</title></Helmet>
            <div className="min-h-screen bg-gray-100 font-sans">
                <Header />
                <main className="flex" style={{ height: 'calc(100vh - 72px)' }}>
                    {/* Kolom Kiri: Daftar Menu */}
                    <div className="w-2/3 p-6 overflow-y-auto">
                        <div className="flex justify-start items-center bg-white p-1 rounded-lg shadow-sm w-fit mb-6">
                            {categories.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter
                                        ? 'bg-[#D4A15D] text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {loading && <p className="text-gray-600">Memuat menu...</p>}
                        {error && <p className="text-red-500">Error: {error}</p>}

                        {!loading && !error && displayedMenuItems.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Tidak ada menu tersedia untuk kategori ini</p>
                            </div>
                        )}

                        {!loading && !error && displayedMenuItems.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedMenuItems.map(item => {
                                    // --- TAMBAHKAN LOGIKA STATUS DI SINI ---
                                    const isAvailable = item.status === 'tersedia';
                                    const quantity = getQuantityInCart(item.menu_id);

                                    return (
                                        // Terapkan style disable ke div terluar
                                        <div
                                            key={item.menu_id}
                                            className={`bg-white rounded-lg shadow-sm overflow-hidden relative ${!isAvailable ? 'opacity-50 pointer-events-none grayscale' : ''
                                                }`}
                                        >
                                            {/* Tampilkan overlay jika tidak tersedia */}
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
                                                alt={item.nama_menu}
                                                className="w-full h-32 object-cover bg-gray-200"
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder_food.png';
                                                }}
                                            />
                                            <div className="p-4">
                                                <p className="font-bold text-gray-800">{item.nama_menu}</p>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Rp {(item.harga && typeof item.harga === 'number') ? item.harga.toLocaleString('id-ID') : '0'}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">{item.kategori}</span>
                                                    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                                                        {/* Tambahkan disabled ke tombol */}
                                                        <button
                                                            onClick={() => handleRemoveItem(item)}
                                                            className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!isAvailable || quantity === 0} // Disable jika !tersedia atau quantity 0
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-semibold w-6 text-center text-gray-800">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleAddItem(item)}
                                                            className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!isAvailable} // Disable jika !tersedia
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Kolom Kanan: Keranjang */}
                    <div className="w-1/3 bg-white p-6 flex flex-col shadow-lg">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-[#D4A15D] pb-2 w-fit">
                            Your Cart
                        </h2>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {cart.length === 0 ? (
                                <p className="text-gray-400 text-center mt-8">Keranjang kosong</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.menu_id} className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    item.has_gambar
                                                        ? `http://localhost:3000/api/menu/gambar/${item.menu_id}?t=${new Date().getTime()}`
                                                        : '/images/placeholder_food.png'
                                                }
                                                alt={item.nama_menu}
                                                className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder_food.png';
                                                }}
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-800">{item.nama_menu}</p>
                                                <p className="text-sm text-gray-500">
                                                    Rp {Number(item.harga).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-800">x{item.quantity}</span>
                                            <button
                                                onClick={() => handleClearItem(item.menu_id)}
                                                className="p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100 transition"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 font-medium">Total</span>
                                    <span className="font-bold text-lg text-gray-800">
                                        Rp {totalCart.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto flex gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateOrder}
                                disabled={cart.length === 0}
                                className={`flex-1 py-3 font-semibold rounded-lg transition ${cart.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#D4A15D] text-white hover:bg-opacity-90'
                                    }`}
                            >
                                Update Pesanan
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default EditOrderPage;