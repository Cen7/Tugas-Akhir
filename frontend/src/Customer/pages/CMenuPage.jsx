// frontend/src/Customer/pages/CMenuPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext'; // Ensure correct path
import MenuItemCard from '../components/MenuItemCard'; // Ensure correct path

const CMenuPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cartItems, orderType, setTable } = useCart();
    const [menuData, setMenuData] = useState({});
    const [loadingMenu, setLoadingMenu] = useState(true); // Renamed for clarity
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [existingOrderDetails, setExistingOrderDetails] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);

    // Effect to handle initial checks and data fetching
    useEffect(() => {
        const storedOrderId = localStorage.getItem('activeOrderId');
        setActiveOrderId(storedOrderId);

        // Redirect if no order type (and no active order)
        if (!storedOrderId && !orderType) {
            console.warn("CMenuPage: Tipe pesanan (orderType) belum dipilih & tidak ada order aktif. Mengarahkan ke halaman awal.");
            navigate('/order');
            return;
        }

        // Set table ID only for new Dine-in orders
        const mejaIdFromUrl = searchParams.get('meja');
        if (orderType === 'Dine-in' && mejaIdFromUrl && !storedOrderId) {
            setTable(mejaIdFromUrl);
        }

        // --- Fetch Menu Data ---
        const fetchMenu = async () => {
            setLoadingMenu(true); // Start loading menu
            setError(null);
            try {
                const response = await fetch('/api/menu');
                if (!response.ok) throw new Error('Gagal mengambil data menu');
                const data = await response.json();
                setMenuData(data);
                if (data && Object.keys(data).length > 0 && activeFilter === null) {
                    setActiveFilter('All');
                }
            } catch (err) {
                console.error('CMenuPage - Error fetching menu:', err);
                setError(err.message); // Set error state
            } finally {
                setLoadingMenu(false); // Finish loading menu
            }
        };

        // --- Fetch Existing Order Details (if activeOrderId exists) ---
        const fetchExistingOrder = async (id) => {
            setLoadingOrder(true);
            setError(null);
            try {
                const response = await fetch(`/api/penjualan/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        console.warn(`Pesanan aktif #${id} tidak ditemukan di backend. Menghapus dari localStorage.`);
                        localStorage.removeItem('activeOrderId');
                        setActiveOrderId(null);
                        setExistingOrderDetails(null);
                        // Optional: redirect or show message? For now, just clear state.
                    } else {
                        throw new Error(`Gagal mengambil detail pesanan aktif #${id}`);
                    }
                } else {
                    const data = await response.json();
                    setExistingOrderDetails(data);
                }
            } catch (err) {
                console.error("Gagal fetch order aktif:", err);
                setError(err.message); // Set error state
            } finally {
                setLoadingOrder(false);
            }
        };

        fetchMenu(); // Always fetch the menu

        if (storedOrderId) {
            fetchExistingOrder(storedOrderId); // Fetch order details if ID exists
        } else {
            setExistingOrderDetails(null); // Ensure no old order data persists
        }

    }, [orderType, navigate, searchParams, setTable]); // Dependencies

    // Memoized calculations for performance
    const allMenuItems = useMemo(() => {
        if (!menuData || Object.keys(menuData).length === 0) return [];
        return Object.values(menuData).flat().map(item => ({
            ...item,
            price: typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga
        })).filter(item => item && typeof item.price === 'number' && !isNaN(item.price) && item.price >= 0);
    }, [menuData]);

    const categories = useMemo(() => {
        if (!menuData || Object.keys(menuData).length === 0) return ['All'];
        return ['All', ...Object.keys(menuData)];
    }, [menuData]);

    const displayedMenuItems = useMemo(() => {
        if (allMenuItems.length === 0) return [];
        if (activeFilter === 'All') return allMenuItems;
        return allMenuItems.filter(item => item.kategori === activeFilter);
    }, [allMenuItems, activeFilter]);

    const totalItemsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Handler for the bottom navigation button
    const handleCartOrStatusClick = () => {
        if (activeOrderId) {
            navigate('/order/status');
        } else {
            navigate('/order/overview');
        }
    };

    // Determine read-only mode
    const isReadOnlyMode = !!activeOrderId;

    // Function to get quantity from the existing order (for read-only mode)
    const getExistingQuantity = (menuId) => {
        // --- TAMBAHKAN LOG DI SINI ---
        console.log(`Mencari kuantitas untuk menuId: ${menuId}`);
        console.log('existingOrderDetails:', existingOrderDetails);

        if (!existingOrderDetails || !existingOrderDetails.items) {
            console.log('existingOrderDetails atau items kosong, return 0');
            return 0;
        }

        // Pastikan nama properti ID (menu_id vs id) konsisten antara data order dan data menu
        const itemInOrder = existingOrderDetails.items.find(i => i.menu_id === menuId);

        if (itemInOrder) {
            console.log(`Item ditemukan di order:`, itemInOrder);
            return itemInOrder.quantity;
        } else {
            console.log(`Item TIDAK ditemukan di order, return 0`);
            return 0;
        }
    };

    // Determine overall loading state
    const isLoading = loadingMenu || loadingOrder;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Category Header */}
            <div className="p-3 bg-white flex justify-start gap-2 sticky top-0 z-10 shadow-sm overflow-x-auto whitespace-nowrap">
                {/* ^^^^^^^^^^^^^ --- GANTI DI SINI --- */}
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${activeFilter === cat ? 'bg-[#D4A15D] text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Menu Content */}
            <div className="flex-grow overflow-y-auto p-4">
                {isReadOnlyMode && !loadingOrder && !error && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded mb-4 text-sm shadow">
                        Anda sedang melihat menu untuk pesanan aktif <span className="font-bold">#{activeOrderId}</span>. Untuk menambah pesanan, silakan panggil pelayan.
                    </div>
                )}

                {isLoading && <p className="text-center text-gray-500 py-10">Loading...</p>}
                {error && <p className="text-center text-red-500 py-10">Error: {error}</p>}
                {!isLoading && !error && displayedMenuItems.length === 0 && (
                    <p className="text-center text-gray-500 py-10">Tidak ada menu dalam kategori ini.</p>
                )}
                {!isLoading && !error && (
                    <div className="grid grid-cols-2 gap-4">
                        {displayedMenuItems.map(item => (
                            <MenuItemCard
                                key={item.menu_id}
                                item={item}
                                isReadOnly={isReadOnlyMode}
                                existingQuantity={isReadOnlyMode ? getExistingQuantity(item.menu_id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="p-3 bg-white flex sticky bottom-0 z-10 border-t">
                <button
                    onClick={() => navigate('/order/menu')}
                    className="flex-1 text-center font-bold text-[#D4A15D] border-b-2 border-[#D4A15D] pb-2 text-sm sm:text-base"
                >
                    Menu
                </button>
                <button
                    onClick={handleCartOrStatusClick}
                    className={`flex-1 text-center font-semibold relative pb-2 text-sm sm:text-base ${activeOrderId ? 'text-gray-500' : (cartItems.length > 0 ? 'text-[#D4A15D] border-b-2 border-[#D4A15D]' : 'text-gray-500')
                        }`}
                >
                    {activeOrderId ? 'Pesanan Saya' : 'Keranjang'}
                    {!activeOrderId && totalItemsInCart > 0 && (
                        <span className="absolute top-0 right-1/4 -translate-y-1/2 translate-x-full transform bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{totalItemsInCart}</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CMenuPage;