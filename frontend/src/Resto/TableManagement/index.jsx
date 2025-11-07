import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Users, ShoppingBag } from 'react-feather';
import Header from '../../components/common/Header';
import Switch from '../../components/ui/Switch';
import { CheckSquare, Square } from 'react-feather';
import { useAuth } from '../../context/AuthContext';

// Import komponen modular
import PopUpConfirm from './PopUpConfirm';
import PopUpNotification from './PopUpNotification';
import EditMeja from './EditMeja';
import PopUpOrderDetail from './PopUpOrderDetail';

const TableManagement = () => {
    const { currentUser } = useAuth();
    
    // State untuk data dari API
    const [tables, setTables] = useState([]);
    const [allTables, setAllTables] = useState([]); // Semua meja termasuk disabled
    const [activeOrders, setActiveOrders] = useState([]); // Semua order aktif dengan detail items
    const [activeOrdersWithItems, setActiveOrdersWithItems] = useState([]); // Order dengan items lengkap
    const [selectedOrder, setSelectedOrder] = useState(null); // Order yang dipilih untuk popup
    const [orderItems, setOrderItems] = useState([]); // Items dari order yang dipilih
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPopup, setShowPopup] = useState(false); // State untuk popup detail order
    const [showEditMejaPopup, setShowEditMejaPopup] = useState(false); // State untuk popup edit meja
    const [refreshKey, setRefreshKey] = useState(0); // State untuk force re-render

    // State untuk modal konfirmasi dan notifikasi
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const [notifModal, setNotifModal] = useState({ show: false, message: '', type: 'success' }); // type: success, error, warning

    // State untuk kontrol UI view
    const [activeView, setActiveView] = useState('Meja'); // 'Meja' atau 'Detail Pesanan'

    // Helper function untuk check apakah pesanan adalah Takeaway
    const isTakeAway = (order) => {
        if (!order) return false;
        const tipe = order.tipe_pesanan?.toLowerCase().replace(/\s/g, '').replace(/-/g, ''); // Remove spaces and hyphens
        return tipe === 'takeaway' || !order.nomor_meja;
    };

    // Function untuk fetch semua data
    const fetchData = async () => {
        // Tampilkan loading hanya saat initial load
        if (tables.length === 0) setLoading(true);
        setError(null);
        
        try {
            // Tambahkan timestamp untuk cache busting
            const timestamp = new Date().getTime();
            const [tablesRes, ordersRes] = await Promise.all([
                fetch(`/api/meja/status?_t=${timestamp}`, {
                    cache: 'no-cache'
                }),
                fetch(`/api/meja/active-orders?_t=${timestamp}`, {
                    cache: 'no-cache'
                })
            ]);

            if (!tablesRes.ok) throw new Error('Gagal memuat status meja');
            if (!ordersRes.ok) throw new Error('Gagal memuat order aktif');

            const tablesData = await tablesRes.json();
            const ordersData = await ordersRes.json();
            
            setTables(tablesData);
            setActiveOrders(ordersData);

            // Fetch items untuk setiap order aktif (untuk sidebar tab Meja)
            await fetchAllOrderItems(ordersData);
            
            // Force re-render
            setRefreshKey(prev => prev + 1);

        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(err.message);
            setTables([]);
            setActiveOrders([]);
            setActiveOrdersWithItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Function untuk fetch semua meja (termasuk disabled) untuk management
    const fetchAllTables = async () => {
        try {
            const response = await fetch('/api/meja/all', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Gagal memuat data meja');
            const data = await response.json();
            setAllTables(data);
        } catch (err) {
            console.error('Error fetching all tables:', err);
        }
    };

    // Function untuk fetch items dari semua order aktif
    const fetchAllOrderItems = async (orders) => {
        if (orders.length === 0) {
            setActiveOrdersWithItems([]);
            return;
        }

        try {
            const timestamp = new Date().getTime();
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const response = await fetch(`/api/meja/order-items/${order.transaksi_id}?_t=${timestamp}`, {
                            cache: 'no-cache'
                        });
                        if (response.ok) {
                            const items = await response.json();
                            // Sort items FIFO: item terlama (detail_id terkecil) di atas
                            const sortedItems = items.sort((a, b) => a.detail_id - b.detail_id);
                            return { ...order, items: sortedItems };
                        }
                        return { ...order, items: [] };
                    } catch (err) {
                        console.error(`Error fetching items for order ${order.transaksi_id}:`, err);
                        return { ...order, items: [] };
                    }
                })
            );
            
            // Sort FIFO: pesanan terlama (transaksi_id terkecil) di atas
            const sortedOrders = ordersWithItems.sort((a, b) => a.transaksi_id - b.transaksi_id);
            setActiveOrdersWithItems(sortedOrders);
        } catch (err) {
            console.error('Error fetching order items:', err);
            setActiveOrdersWithItems(orders.map(order => ({ ...order, items: [] })));
        }
    };

    // Fetch data saat component mount dan setup auto-refresh
    useEffect(() => {
        fetchData();
        fetchAllTables(); // Load semua meja untuk management
        const interval = setInterval(fetchData, 30000); // Refresh setiap 30 detik
        return () => clearInterval(interval);
    }, []);

    // Helper functions untuk modal
    const showConfirm = (message, onConfirm) => {
        setConfirmModal({ show: true, message, onConfirm });
    };

    const hideConfirm = () => {
        setConfirmModal({ show: false, message: '', onConfirm: null });
    };

    const showNotification = (message, type = 'success') => {
        setNotifModal({ show: true, message, type });
        setTimeout(() => {
            setNotifModal({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Function untuk handle update status item (toggle checklist)
    const handleItemStatusToggle = async (detailId, currentStatus) => {
        const newStatus = currentStatus === 'Menunggu' ? 'Disajikan' : 'Menunggu';        try {
            const response = await fetch(`/api/meja/update-item-status/${detailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_item: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal update status item');
            }

            await response.json();

            // Refresh data setelah update
            await fetchData();
        } catch (err) {
            console.error('❌ Error:', err);
            showNotification(err.message, 'error');
        }
    };

    // Function untuk handle klik meja - show popup
    const handleTableClick = async (table) => {
        if (!table.transaksi_id) return; // Jangan buka popup jika meja kosong
        
        const orderDetail = activeOrders.find(o => o.transaksi_id === table.transaksi_id);
        if (orderDetail) {
            setSelectedOrder(orderDetail);
            await fetchOrderItems(orderDetail.transaksi_id);
            setShowPopup(true);
        }
    };

    // Function untuk fetch detail items dari order tertentu
    const fetchOrderItems = async (transaksiId) => {
        try {
            const response = await fetch(`/api/meja/order-items/${transaksiId}`);
            if (!response.ok) throw new Error('Gagal memuat detail items');
            
            const items = await response.json();
            
            // Sort FIFO: item terlama (detail_id terkecil) di atas
            const sortedItems = items.sort((a, b) => a.detail_id - b.detail_id);
            setOrderItems(sortedItems);
        } catch (err) {
            console.error('Error fetching order items:', err);
            setOrderItems([]);
        }
    };

    // Function untuk tutup popup
    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedOrder(null);
        setOrderItems([]);
    };

    // Function untuk Selesaikan pesanan (complete order dan set semua item Disajikan)
    const handleKosongkanMeja = async () => {
        if (!selectedOrder) return;
        
        const isTA = isTakeAway(selectedOrder);
        
        const confirmMessage = isTA
            ? 'Apakah Anda yakin ingin menyelesaikan pesanan Take Away ini? Semua item akan ditandai Selesai.'
            : 'Apakah Anda yakin ingin mengosongkan meja ini? Semua item akan ditandai Selesai dan meja akan tersedia kembali.';
        
        showConfirm(confirmMessage, async () => {
            try {
                // Panggil endpoint kosongkan meja (otomatis set semua item Disajikan & status Selesai)
                const response = await fetch(`/api/meja/kosongkan/${selectedOrder.transaksi_id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Gagal menyelesaikan pesanan');
                }

                // Close popup dan refresh data
                handleClosePopup();
                await fetchData();
                
                const successMessage = isTA
                    ? 'Pesanan Take Away berhasil diSelesaikan'
                    : 'Meja berhasil dikosongkan';
                showNotification(successMessage, 'success');
            } catch (err) {
                showNotification(err.message, 'error');
            }
        });
    };

    // Function untuk tambah meja baru
    const handleTambahMeja = async () => {
        try {
            const response = await fetch('/api/meja/tambah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menambah meja');
            }

            await fetchData();
            await fetchAllTables(); // Refresh data semua meja
            showNotification('Meja berhasil ditambahkan', 'success');
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    // Function untuk toggle status meja (enable/disable)
    const handleToggleStatusMeja = async (meja_id, currentStatus) => {
        // Tidak bisa toggle jika meja sedang terisi
        if (currentStatus === 'terisi') {
            return; // Silently ignore, slider sudah disabled
        }

        // Langsung toggle tanpa konfirmasi karena switch lebih intuitif
        try {
            const response = await fetch(`/api/meja/toggle-status/${meja_id}`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengubah status meja');
            }

            const result = await response.json();
            await fetchData();
            await fetchAllTables(); // Refresh data semua meja
            showNotification(result.message, 'success');
        } catch (err) {
            showNotification(err.message, 'error');
            // Refresh untuk rollback UI ke state sebenarnya
            await fetchAllTables();
        }
    };

    // Hitung jumlah meja berdasarkan status
    const seatCounts = useMemo(() => {
        return tables.reduce((acc, table) => {
            if (!table.transaksi_id) {
                acc.free++;
            } else if (table.status_pembayaran === 'Lunas') {
                acc.lunas++;
            } else {
                acc.belumLunas++;
            }
            return acc;
        }, { free: 0, belumLunas: 0, lunas: 0 });
    }, [tables]);

    // Function untuk render card meja (with useCallback to prevent re-creation)
    const renderTableCard = useCallback((table) => {
        const orderDetail = activeOrders.find(o => o.transaksi_id === table.transaksi_id);

        let statusKey = 'empty';
        let statusInfo = { badgeText: 'Kosong', color: '#a1a1aa', progress: null };

        if (table.transaksi_id) {
            // Gunakan status_pesanan dari backend yang sudah diupdate secara dinamis
            const statusPesanan = table.status_pesanan || 'Pending';
            const isLunas = table.status_pembayaran === 'Lunas';
            
            // Hitung progress dari table atau orderDetail
            let servedItems = 0;
            let totalItems = 0;
            
            if (table.item_disajikan !== undefined && table.total_item !== undefined) {
                // Gunakan data dari table (endpoint /status)
                totalItems = table.total_item || 0;
                servedItems = table.item_disajikan || 0;
            } else if (orderDetail) {
                // Fallback ke orderDetail
                totalItems = orderDetail.total_item || 0;
                const waitingItems = orderDetail.jumlah_menunggu || 0;
                servedItems = totalItems - waitingItems;
            }

            // Tentukan status berdasarkan status_pesanan dari backend
            switch (statusPesanan) {
                case 'Selesai':
                    statusKey = 'Selesai';
                    statusInfo = { badgeText: 'Selesai', color: '#22c55e' }; // Green
                    break;
                case 'Dibatalkan':
                    statusKey = 'Dibatalkan';
                    statusInfo = { badgeText: 'Dibatalkan', color: '#ef4444' }; // Red
                    break;
                case 'Siap':
                    statusKey = 'ready';
                    statusInfo = { badgeText: 'Siap', color: '#3b82f6', progress: { served: servedItems, total: totalItems } }; // Blue
                    break;
                case 'Diproses':
                    statusKey = 'in_progress';
                    statusInfo = { badgeText: 'Diproses', color: '#f59e0b', progress: { served: servedItems, total: totalItems } }; // Amber
                    break;
                case 'Pending':
                default:
                    statusKey = 'pending';
                    statusInfo = { badgeText: 'Pending', color: '#9ca3af', progress: { served: servedItems, total: totalItems } }; // Gray
                    break;
            }

            // Override jika sudah bayar DAN Selesai
            if (isLunas && statusPesanan === 'Selesai') {
                statusInfo = { badgeText: 'Lunas', color: '#10b981' }; // Emerald
            }
        }

        return (
            <div 
                key={table.meja_id} 
                className="rounded-xl shadow-md border flex flex-col justify-between bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => handleTableClick(table)}
            >
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                            {table.transaksi_id ? `Meja ${table.nomor_meja}` : `Meja ${table.nomor_meja}`}
                        </h3>
                        <span 
                            className="text-xs font-bold px-2 py-1 rounded-full text-white whitespace-nowrap" 
                            style={{ backgroundColor: statusInfo.color }}
                        >
                            {statusInfo.badgeText}
                        </span>
                    </div>

                    {/* Status Pembayaran (jika ada transaksi) */}
                    {table.transaksi_id && (
                        <div className="mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                table.status_pembayaran === 'Lunas'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {table.status_pembayaran === 'Lunas' ? 'Lunas' : 'Belum Lunas'}
                            </span>
                        </div>
                    )}

                    {statusKey === 'empty' ? (
                        <p className="mt-10 text-center text-lg text-gray-400">Kosong</p>
                    ) : (
                        <div className="mt-2">
                            {orderDetail && (orderDetail.nama_pembeli || orderDetail.customer) && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Order #{table.transaksi_id} - <span className="font-semibold">{orderDetail.nama_pembeli || orderDetail.customer}</span>
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                {table.tanggal_transaksi 
                                    ? new Date(table.tanggal_transaksi).toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : '-'}
                            </p>
                            <p className="font-semibold text-xl text-gray-800 mt-2">
                                Rp {(table.total_harga || 0).toLocaleString('id-ID')}
                            </p>
                            {statusInfo.progress && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {statusInfo.progress.served}/{statusInfo.progress.total} item siap
                                </p>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Progress bar */}
                {statusInfo.progress && statusInfo.progress.total > 0 && (
                    <div className="w-full bg-gray-200 h-2">
                        <div 
                            className="h-2 rounded-bl-xl transition-all duration-300" 
                            style={{ 
                                width: `${(statusInfo.progress.served / statusInfo.progress.total) * 100}%`,
                                backgroundColor: statusInfo.color 
                            }}
                        ></div>
                    </div>
                )}
            </div>
        );
    }, [activeOrders, handleTableClick]);

    // Loading dan Error States
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-lg text-gray-600">Memuat data meja...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">Error: {error}</p>
                    <button 
                        onClick={fetchData}
                        className="px-4 py-2 bg-[#D4A15D] text-white rounded-lg hover:bg-[#C4915D]"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // Render komponen utama
    return (
        <>
            <Helmet>
                <title>Manajemen Meja | MiWau</title>
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.2s ease-out;
                    }
                    .animate-slideUp {
                        animation: slideUp 0.3s ease-out;
                    }
                    .animate-slideInRight {
                        animation: slideInRight 0.4s ease-out;
                    }
                `}</style>
            </Helmet>
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 72px)' }}>
                    {/* Panel Kiri: Grid Meja dan Legend */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Toggle View */}
                        <div className="flex items-center gap-2 mb-6 bg-white rounded-lg shadow-sm p-2 w-fit">
                            <button 
                                onClick={() => setActiveView('Meja')} 
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                    activeView === 'Meja' 
                                        ? 'bg-[#D4A15D] text-white' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Meja
                            </button>
                            <button 
                                onClick={() => setActiveView('Detail Pesanan')} 
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                    activeView === 'Detail Pesanan' 
                                        ? 'bg-[#D4A15D] text-white' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Detail Pesanan
                            </button>
                        </div>
                        
                        {/* Grid Meja */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {tables.map(renderTableCard)}
                        </div>
                        
                        {/* Legend dan Tombol Edit */}
                        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 border-2 border-zinc-400 rounded-full" />
                                    <span className="text-sm">Kosong <span className="font-bold">{seatCounts.free}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-amber-50 border-2 border-amber-500 rounded-full" />
                                    <span className="text-sm">Belum Lunas <span className="font-bold">{seatCounts.belumLunas}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded-full" />
                                    <span className="text-sm">Lunas <span className="font-bold">{seatCounts.lunas}</span></span>
                                </div>
                            </div>
                            {/* Tombol Edit Meja - Hanya untuk Manajer */}
                            {currentUser && currentUser.role === 'Manajer' && (
                                <button 
                                    onClick={() => setShowEditMejaPopup(true)}
                                    className="px-4 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg text-sm whitespace-nowrap hover:bg-[#C4915D] transition-colors"
                                >
                                    Edit Meja
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Sidebar Kanan: Order Aktif */}
                    <aside className="w-full lg:w-96 bg-gray-800 p-6 overflow-y-auto text-white">
                        <h2 className="text-xl font-bold mb-4">
                            {activeView === 'Meja' ? 'Order Aktif' : 'Detail Pesanan'}
                        </h2>
                        
                        {activeView === 'Meja' ? (
                            /* Tab Meja: Tampilkan semua order aktif dengan SEMUA items */
                            <div className="space-y-4" key={`meja-tab-${refreshKey}`}>
                                {activeOrdersWithItems.length === 0 ? (
                                    <p className="text-center text-gray-400 pt-10">Tidak ada pesanan aktif</p>
                                ) : (
                                    activeOrdersWithItems.map(order => {
                                        const progressPercentage = order.total_item > 0 
                                            ? ((order.total_item - order.jumlah_menunggu) / order.total_item) * 100 
                                            : 0;
                                        
                                        return (
                                            <div 
                                                key={order.transaksi_id} 
                                                className="bg-gray-700 rounded-lg p-4"
                                            >
                                                {/* Header Order */}
                                                <div className="mb-3">
                                                    {/* Baris 1: Nama Meja/TA dan Order ID */}
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-bold text-lg">
                                                                {isTakeAway(order)
                                                                    ? `TA-${String(order.transaksi_id).padStart(3, '0')}`
                                                                    : `Meja ${String(order.nomor_meja).padStart(2, '0')}`}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                Order ID: #{order.transaksi_id}
                                                            </p>
                                                            { (order.nama_pembeli || order.customer) && (
                                                                <p className="text-xs text-gray-300">
                                                                    Nama: <span className="font-semibold">{order.nama_pembeli || order.customer}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Baris 2: Waktu, Tipe, dan Status Badges */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs text-gray-400">
                                                                {order.tanggal_transaksi 
                                                                    ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : '-'}
                                                                {' • '}
                                                                {isTakeAway(order) ? 'Take Away' : 'Dine in'}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {/* Status Pesanan */}
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                                order.status_pesanan === 'Selesai'
                                                                    ? 'bg-green-500 text-white'
                                                                    : order.status_pesanan === 'Siap'
                                                                    ? 'bg-blue-500 text-white'
                                                                    : order.status_pesanan === 'Diproses'
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : 'bg-gray-500 text-white'
                                                            }`}>
                                                                {order.status_pesanan || 'Pending'}
                                                            </span>
                                                            {/* Status Pembayaran */}
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                                order.status_pembayaran === 'Lunas'
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-red-600 text-white'
                                                            }`}>
                                                                {order.status_pembayaran === 'Lunas' ? 'Lunas' : 'Belum Lunas'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* List Items - TAMPILKAN SEMUA MENU */}
                                                <div className="space-y-2 mb-3">
                                                    {order.items && order.items.length > 0 ? (
                                                        order.items.map(item => (
                                                            <div key={item.detail_id} className="flex items-center gap-2">
                                                                {/* Checkbox visual (bukan interaktif di tab Meja) */}
                                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                                    item.status_item === 'Disajikan' 
                                                                        ? 'bg-green-500 border-green-500' 
                                                                        : 'border-gray-400'
                                                                }`}>
                                                                    {item.status_item === 'Disajikan' && (
                                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-300 flex-1">
                                                                    {item.nama_menu}
                                                                </p>
                                                                <span className="text-sm text-gray-400">x{item.jumlah}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-gray-400">Loading items...</p>
                                                    )}
                                                </div>
                                                
                                                {/* Progress Bar jika ada yang belum ready */}
                                                {order.jumlah_menunggu > 0 && (
                                                    <div className="mb-2">
                                                        <div className="w-full bg-gray-600 rounded-full h-2">
                                                            <div 
                                                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${progressPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Total */}
                                                <div className="pt-3 border-t border-gray-600">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-400">Total</span>
                                                        <span className="font-bold">
                                                            Rp {(order.total_harga || 0).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            /* Tab Detail Pesanan: Tampilkan semua order aktif (bisa unceklis kalau miss-click) */
                            <div key={`detail-tab-${refreshKey}`}>
                                {activeOrdersWithItems.length === 0 ? (
                                    <p className="text-center text-gray-400 pt-10">
                                        Tidak ada pesanan aktif
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {activeOrdersWithItems.map(order => (
                                            <div key={`order-${order.transaksi_id}-${refreshKey}`}>
                                                {/* Header Order */}
                                                <div className="bg-gray-700 rounded-lg p-4 mb-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-xl">
                                                                {isTakeAway(order)
                                                                    ? `TA-${String(order.transaksi_id).padStart(3, '0')}`
                                                                    : `Meja ${String(order.nomor_meja).padStart(2, '0')}`}
                                                            </p>
                                                            <p className="text-sm text-gray-400">
                                                                {order.tanggal_transaksi 
                                                                    ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : '-'}
                                                            </p>
                                                            <p className="text-sm text-gray-400">
                                                                {isTakeAway(order) ? 'Take Away' : 'Dine in'}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                            order.status_pesanan === 'Selesai'
                                                                ? 'bg-green-500 text-white'
                                                                : order.status_pesanan === 'Siap'
                                                                ? 'bg-blue-500 text-white'
                                                                : order.status_pesanan === 'Diproses'
                                                                ? 'bg-yellow-500 text-white'
                                                                : 'bg-gray-500 text-white'
                                                        }`}>
                                                            {order.status_pesanan || 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* List Items dengan Checkbox INTERAKTIF */}
                                                <div className="space-y-2 mb-4">
                                                        {order.items && order.items.length > 0 ? (
                                                            order.items.map(item => (
                                                                <div 
                                                                    key={item.detail_id} 
                                                                    className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
                                                                >
                                                                    {/* Checkbox INTERAKTIF */}
                                                                    <button
                                                                        onClick={() => handleItemStatusToggle(item.detail_id, item.status_item)}
                                                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                                            item.status_item === 'Disajikan' 
                                                                                ? 'bg-green-500 border-green-500' 
                                                                                : 'border-gray-400 hover:border-white'
                                                                        }`}
                                                                    >
                                                                        {item.status_item === 'Disajikan' && (
                                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                    
                                                                    {/* Info Item */}
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-white">
                                                                            {item.nama_menu}
                                                                        </p>
                                                                        {item.catatan && (
                                                                            <p className="text-xs text-gray-400 mt-1">
                                                                                Catatan: {item.catatan}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Jumlah */}
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="text-sm font-semibold">x{item.jumlah}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-gray-400 py-4">Loading items...</p>
                                                        )}
                                                    </div>

                                                    {/* Divider antar order */}
                                                    <div className="border-t border-gray-600 my-4"></div>
                                                </div>
                                            ))}
                                        </div>
                                )}
                            </div>
                        )}
                    </aside>
                </main>

                {/* Komponen Modal/PopUp */}
                <PopUpOrderDetail
                    show={showPopup}
                    order={selectedOrder}
                    items={orderItems}
                    onClose={handleClosePopup}
                    onKosongkan={handleKosongkanMeja}
                    isTakeAway={isTakeAway(selectedOrder)}
                />

                <EditMeja
                    show={showEditMejaPopup}
                    onClose={() => setShowEditMejaPopup(false)}
                    allTables={allTables}
                    onToggleStatus={handleToggleStatusMeja}
                    onAddTable={handleTambahMeja}
                />

                <PopUpConfirm
                    show={confirmModal.show}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={hideConfirm}
                />

                <PopUpNotification
                    show={notifModal.show}
                    message={notifModal.message}
                    type={notifModal.type}
                    onClose={() => setNotifModal({ ...notifModal, show: false })}
                />
            </div>
        </>
    );
};

export default TableManagement;