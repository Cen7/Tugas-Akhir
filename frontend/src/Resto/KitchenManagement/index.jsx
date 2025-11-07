import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';

const KitchenManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    // Track checklist status per order
    const [checkedItems, setCheckedItems] = useState({});

    // Fetch orders yang masih punya item "Menunggu"
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/penjualan/aktif-detail', {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) throw new Error('Gagal memuat data pesanan');
            
            const data = await response.json();
            setOrders(data);
            
            // Initialize checklist state for each order
            const initialChecked = {};
            data.forEach(order => {
                initialChecked[order.transaksi_id] = {};
                order.items?.forEach(item => {
                    initialChecked[order.transaksi_id][item.detail_id] = item.status_item === 'Disajikan';
                });
            });
            setCheckedItems(initialChecked);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Auto-refresh setiap 30 detik
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Helper function untuk check apakah pesanan adalah Takeaway (sama dengan TableManagement)
    const isTakeAway = (order) => {
        if (!order) return false;
        const tipe = order.tipe_pesanan?.toLowerCase().replace(/\s/g, '').replace(/-/g, ''); // Remove spaces and hyphens
        return tipe === 'takeaway' || !order.nomor_meja;
    };

    // Toggle checklist (local state only, tidak langsung update database)
    const handleToggleCheckbox = (transaksiId, detailId) => {
        setCheckedItems(prev => ({
            ...prev,
            [transaksiId]: {
                ...prev[transaksiId],
                [detailId]: !prev[transaksiId]?.[detailId]
            }
        }));
    };

    // Tandai pesanan sebagai "Siap" - baru update database
    const handleMarkAsReady = async (transaksiId) => {
        try {
            const response = await fetch(`/api/penjualan/${transaksiId}/siap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menandai pesanan siap');
            }

            alert('Pesanan berhasil ditandai siap!');
            await fetchOrders();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const OrderCard = ({ order }) => {
        const totalItems = order.items?.length || 0;
        const checkedCount = Object.values(checkedItems[order.transaksi_id] || {}).filter(Boolean).length;
        const allItemsChecked = totalItems > 0 && checkedCount === totalItems;

        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-3">
                {/* Header - Smaller */}
                <div className="flex justify-between items-start mb-3 pb-2 border-b">
                    <div>
                        {isTakeAway(order) ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                                        TAKE AWAY
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {`TA-${String(order.transaksi_id).padStart(3, '0')}`}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {order.tanggal_transaksi 
                                        ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '-'
                                    }
                                </p>
                                { (order.nama_pembeli || order.customer) && (
                                    <p className="text-xs text-gray-600 mt-1">Nama: <span className="font-semibold">{order.nama_pembeli || order.customer}</span></p>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                        DINE IN
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Meja {String(order.nomor_meja).padStart(2, '0')}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Order #{order.transaksi_id}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {order.tanggal_transaksi 
                                        ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '-'
                                    }
                                </p>
                            </>
                        )}
                    </div>
                    <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status_pesanan === 'Pending' 
                                ? 'bg-gray-100 text-gray-700'
                                : order.status_pesanan === 'Diproses'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}>
                            {order.status_pesanan}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                            {checkedCount}/{totalItems} ✓
                        </p>
                    </div>
                </div>

                {/* Items List - Compact */}
                <div className="space-y-2 mb-3">
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item) => {
                            const isChecked = checkedItems[order.transaksi_id]?.[item.detail_id] || false;
                            
                            return (
                                <div 
                                    key={item.detail_id} 
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                        isChecked 
                                            ? 'bg-green-50 border-l-4 border-green-500' 
                                            : 'bg-gray-50 border-l-4 border-orange-400'
                                    }`}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleToggleCheckbox(order.transaksi_id, item.detail_id)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            isChecked
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-white border-gray-400 hover:border-green-500'
                                        }`}
                                    >
                                        {isChecked && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Item Info - Compact */}
                                    <div className="flex-grow min-w-0">
                                        <p className={`text-sm font-semibold truncate ${
                                            isChecked 
                                                ? 'text-green-800 line-through' 
                                                : 'text-gray-800'
                                        }`}>
                                            {item.nama_menu}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            x{item.jumlah}
                                        </p>
                                    </div>

                                    {/* Status Badge - Smaller */}
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                                        isChecked
                                            ? 'bg-green-200 text-green-800'
                                            : 'bg-orange-200 text-orange-800'
                                    }`}>
                                        {isChecked ? '✓' : '○'}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-400 py-2 text-sm">Tidak ada item</p>
                    )}
                </div>

                {/* Tombol Siap - Compact */}
                <button
                    onClick={() => handleMarkAsReady(order.transaksi_id)}
                    disabled={!allItemsChecked}
                    className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                        allItemsChecked
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {allItemsChecked ? '✓ Tandai Siap' : '✓ Tandai Siap'}
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <>
                <Helmet><title>Dapur | MiWau</title></Helmet>
                <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="p-8 max-w-7xl mx-auto">
                        <div className="text-center py-10">
                            <p className="text-gray-500">Memuat data pesanan...</p>
                        </div>
                    </main>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Helmet><title>Dapur | MiWau</title></Helmet>
                <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="p-8 max-w-7xl mx-auto">
                        <div className="text-center py-10">
                            <p className="text-red-500">Error: {error}</p>
                            <button 
                                onClick={fetchOrders}
                                className="mt-4 px-6 py-2 bg-[#D4A15D] text-white rounded-lg hover:bg-opacity-90"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    </main>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet><title>Dapur | MiWau</title></Helmet>
            <div className="min-h-screen bg-gray-50 font-sans">
                <Header />
                
                <main className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Header Section - Compact */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Dapur</h1>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Pesanan aktif: <span className="font-semibold">{orders.length}</span>
                            </p>
                            <button
                                onClick={fetchOrders}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                            >
                                ↻ Refresh
                            </button>
                        </div>
                    </div>

                    {/* Orders Grid - More columns */}
                    {orders.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">👨‍🍳</div>
                            <p className="text-lg text-gray-500">Tidak ada pesanan yang perlu disiapkan</p>
                            <p className="text-xs text-gray-400 mt-1">Semua pesanan sudah selesai!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {orders.map(order => (
                                <OrderCard key={order.transaksi_id} order={order} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default KitchenManagement;
