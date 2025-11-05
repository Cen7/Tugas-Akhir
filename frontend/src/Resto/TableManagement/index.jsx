import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import { CheckSquare, Square } from 'react-feather';

const TableManagement = () => {
    // State untuk data dari API
    const [tables, setTables] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]); // Semua order aktif dengan detail items
    const [activeOrdersWithItems, setActiveOrdersWithItems] = useState([]); // Order dengan items lengkap
    const [selectedOrder, setSelectedOrder] = useState(null); // Order yang dipilih untuk popup
    const [orderItems, setOrderItems] = useState([]); // Items dari order yang dipilih
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPopup, setShowPopup] = useState(false); // State untuk popup detail order
    const [showEditMejaPopup, setShowEditMejaPopup] = useState(false); // State untuk popup edit meja

    // State untuk kontrol UI view
    const [activeView, setActiveView] = useState('Meja'); // 'Meja' atau 'Detail Pesanan'

    // Function untuk fetch semua data
    const fetchData = async () => {
        // Tampilkan loading hanya saat initial load
        if (tables.length === 0) setLoading(true);
        setError(null);
        
        try {
            const [tablesRes, ordersRes] = await Promise.all([
                fetch('/api/meja/status'),
                fetch('/api/meja/active-orders')
            ]);

            if (!tablesRes.ok) throw new Error('Gagal memuat status meja');
            if (!ordersRes.ok) throw new Error('Gagal memuat order aktif');

            const tablesData = await tablesRes.json();
            const ordersData = await ordersRes.json();
            
            setTables(tablesData);
            setActiveOrders(ordersData);

            // Fetch items untuk setiap order aktif (untuk sidebar tab Meja)
            await fetchAllOrderItems(ordersData);

        } catch (err) {
            setError(err.message);
            setTables([]);
            setActiveOrders([]);
            setActiveOrdersWithItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Function untuk fetch items dari semua order aktif
    const fetchAllOrderItems = async (orders) => {
        if (orders.length === 0) {
            setActiveOrdersWithItems([]);
            return;
        }

        try {
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const response = await fetch(`/api/meja/order-items/${order.transaksi_id}`);
                        if (response.ok) {
                            const items = await response.json();
                            return { ...order, items };
                        }
                        return { ...order, items: [] };
                    } catch (err) {
                        console.error(`Error fetching items for order ${order.transaksi_id}:`, err);
                        return { ...order, items: [] };
                    }
                })
            );
            setActiveOrdersWithItems(ordersWithItems);
        } catch (err) {
            console.error('Error fetching order items:', err);
            setActiveOrdersWithItems(orders.map(order => ({ ...order, items: [] })));
        }
    };

    // Fetch data saat component mount dan setup auto-refresh
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh setiap 30 detik (mengurangi flickering)
        return () => clearInterval(interval);
    }, []);

    // Function untuk toggle status item (Menunggu <-> Disajikan)
    const handleItemStatusToggle = async (detailId, currentStatus) => {
        const newStatus = currentStatus === 'Menunggu' ? 'Disajikan' : 'Menunggu';
        
        try {
            const response = await fetch(`/api/meja/update-item-status/${detailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_item: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal update status item');
            }

            // Refresh data setelah update
            await fetchData();
        } catch (err) {
            alert(`Error: ${err.message}`);
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
            setOrderItems(items);
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

    // Function untuk kosongkan meja (complete order dan set semua item Disajikan)
    const handleKosongkanMeja = async () => {
        if (!selectedOrder) return;
        
        if (!confirm('Apakah Anda yakin ingin mengosongkan meja ini? Semua item akan ditandai selesai dan meja akan tersedia kembali.')) return;

        try {
            // Panggil endpoint kosongkan meja (otomatis set semua item Disajikan & status Completed)
            const response = await fetch(`/api/meja/kosongkan/${selectedOrder.transaksi_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengosongkan meja');
            }

            // Close popup dan refresh data
            handleClosePopup();
            await fetchData();
            alert('Meja berhasil dikosongkan');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Function untuk tambah meja baru
    const handleTambahMeja = async () => {
        try {
            const response = await fetch('/api/meja/tambah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Gagal menambah meja');
            }

            await fetchData();
            alert('Meja berhasil ditambahkan');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Function untuk hapus meja
    const handleHapusMeja = async (id_meja) => {
        if (!confirm('Apakah Anda yakin ingin menghapus meja ini?')) return;

        try {
            const response = await fetch(`/api/meja/hapus/${id_meja}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Gagal menghapus meja');
            }

            await fetchData();
            alert('Meja berhasil dihapus');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Hitung jumlah meja berdasarkan status
    const seatCounts = useMemo(() => {
        return tables.reduce((acc, table) => {
            if (!table.transaksi_id) {
                acc.free++;
            } else if (table.status_pembayaran === 'Paid') {
                acc.paid++;
            } else {
                acc.notPaid++;
            }
            return acc;
        }, { free: 0, notPaid: 0, paid: 0 });
    }, [tables]);

    // Function untuk render card meja (with useCallback to prevent re-creation)
    const renderTableCard = useCallback((table) => {
        const orderDetail = activeOrders.find(o => o.transaksi_id === table.transaksi_id);

        let statusKey = 'empty';
        let statusInfo = { badgeText: 'Kosong', color: '#a1a1aa', progress: null };

        if (table.transaksi_id) {
            const isPaid = table.status_pembayaran === 'Paid';
            
            // Hitung progress dari orderDetail
            let servedItems = 0;
            let totalItems = 0;
            
            if (orderDetail) {
                totalItems = orderDetail.total_item || 0;
                const waitingItems = orderDetail.jumlah_menunggu || 0;
                servedItems = totalItems - waitingItems;
            }

            // Tentukan status berdasarkan pembayaran dan progress item
            if (isPaid && servedItems === totalItems && totalItems > 0) {
                statusKey = 'completed';
                statusInfo = { badgeText: 'Selesai', color: '#22c55e' }; // Green
            } else if (isPaid) {
                statusKey = 'paid';
                statusInfo = { badgeText: 'Lunas', color: '#10b981' }; // Emerald
            } else if (servedItems === totalItems && totalItems > 0) {
                statusKey = 'ready';
                statusInfo = { badgeText: 'Siap Bayar', color: '#8b5cf6', progress: { served: servedItems, total: totalItems } }; // Violet
            } else if (servedItems > 0 && servedItems < totalItems) {
                statusKey = 'in_progress';
                statusInfo = { badgeText: 'Diproses', color: '#3b82f6', progress: { served: servedItems, total: totalItems } }; // Blue
            } else {
                statusKey = 'pending';
                statusInfo = { badgeText: 'Menunggu', color: '#f59e0b', progress: { served: servedItems, total: totalItems } }; // Amber
            }
        }

        return (
            <div 
                key={table.meja_id} 
                className="rounded-xl shadow-md border flex flex-col justify-between bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => handleTableClick(table)}
            >
                <div className="p-4">
                    <div className="flex justify-between items-start">
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

                    {statusKey === 'empty' ? (
                        <p className="mt-10 text-center text-lg text-gray-400">Kosong</p>
                    ) : (
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">
                                Order #{table.transaksi_id}
                            </p>
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
                                    <span className="text-sm">Belum Bayar <span className="font-bold">{seatCounts.notPaid}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded-full" />
                                    <span className="text-sm">Lunas <span className="font-bold">{seatCounts.paid}</span></span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowEditMejaPopup(true)}
                                className="px-4 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg text-sm whitespace-nowrap hover:bg-[#C4915D] transition-colors"
                            >
                                Edit Meja
                            </button>
                        </div>
                    </div>
                    
                    {/* Sidebar Kanan: Order Aktif */}
                    <aside className="w-full lg:w-96 bg-gray-800 p-6 overflow-y-auto text-white">
                        <h2 className="text-xl font-bold mb-4">
                            {activeView === 'Meja' ? 'Order Aktif' : 'Detail Pesanan'}
                        </h2>
                        
                        {activeView === 'Meja' ? (
                            /* Tab Meja: Tampilkan semua order aktif dengan SEMUA items */
                            <div className="space-y-4">
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
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-lg">{String(order.nomor_meja).padStart(2, '0')}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {order.tanggal_transaksi 
                                                                ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Dine in</p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        order.status_pembayaran === 'Paid' 
                                                            ? 'bg-green-500 text-white' 
                                                            : order.status_pesanan === 'Siap'
                                                            ? 'bg-green-500 text-white'
                                                            : order.status_pesanan === 'Diproses'
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-amber-500 text-white'
                                                    }`}>
                                                        {order.status_pembayaran === 'Paid' 
                                                            ? 'Paid' 
                                                            : order.status_pesanan === 'Siap'
                                                            ? 'Delivered'
                                                            : 'Pending'}
                                                    </span>
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
                            <div>
                                {activeOrdersWithItems.length === 0 ? (
                                    <p className="text-center text-gray-400 pt-10">
                                        Tidak ada pesanan aktif
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {activeOrdersWithItems.map(order => (
                                            <div key={order.transaksi_id}>
                                                    {/* Header Order */}
                                                    <div className="bg-gray-700 rounded-lg p-4 mb-2">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-xl">{String(order.nomor_meja).padStart(2, '0')}</p>
                                                                <p className="text-sm text-gray-400">
                                                                    {order.tanggal_transaksi 
                                                                        ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })
                                                                        : '-'}
                                                                </p>
                                                                <p className="text-sm text-gray-400">Dine in</p>
                                                            </div>
                                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                                order.items && order.items.every(item => item.status_item === 'Disajikan')
                                                                    ? 'bg-green-500 text-white' 
                                                                    : 'bg-amber-500 text-white'
                                                            }`}>
                                                                {order.items && order.items.every(item => item.status_item === 'Disajikan')
                                                                    ? 'Delivered'
                                                                    : 'Pending'}
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

                {/* Popup Modal Detail Order (ketika meja diklik) */}
                {showPopup && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            {/* Header Popup */}
                            <div className="bg-gray-100 p-4 flex justify-between items-center border-b sticky top-0">
                                <div>
                                    <h3 className="text-2xl font-bold">Meja {String(selectedOrder.nomor_meja).padStart(2, '0')}</h3>
                                    <p className="text-sm text-gray-600">
                                        {selectedOrder.tanggal_transaksi 
                                            ? new Date(selectedOrder.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : '-'}
                                    </p>
                                    <p className="text-sm text-gray-600">Dine in</p>
                                </div>
                                <button
                                    onClick={handleClosePopup}
                                    className="text-3xl text-gray-600 hover:text-gray-800 font-bold leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Status Badge */}
                            <div className="p-4 border-b">
                                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                                    selectedOrder.status_pembayaran === 'Paid' 
                                        ? 'bg-green-500 text-white' 
                                        : selectedOrder.status_pesanan === 'Siap'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-amber-500 text-white'
                                }`}>
                                    {selectedOrder.status_pembayaran === 'Paid' 
                                        ? 'Paid' 
                                        : selectedOrder.status_pesanan === 'Siap'
                                        ? 'Not paid'
                                        : 'Not paid'}
                                </span>
                            </div>

                            {/* List Items */}
                            <div className="p-4">
                                {orderItems.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">Loading items...</p>
                                ) : (
                                    <div className="space-y-3">
                                        {orderItems.map(item => (
                                            <div key={item.detail_id} className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">x {item.jumlah}</p>
                                                    <p className="text-gray-600">{item.nama_menu}</p>
                                                </div>
                                                <p className="font-semibold text-gray-800">
                                                    Rp {(item.harga_satuan || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Total & Payment Info */}
                            <div className="p-4 border-t border-b bg-gray-50">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-lg">Rp {(selectedOrder.total_harga || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {selectedOrder.tanggal_transaksi 
                                        ? new Date(selectedOrder.tanggal_transaksi).toLocaleString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '-'}
                                </p>
                                <p className="text-xs text-gray-500">by Kasir</p>
                            </div>

                            {/* Tombol Kosongkan Meja */}
                            <div className="p-4">
                                <button
                                    onClick={handleKosongkanMeja}
                                    className="w-full py-3 bg-[#D4A15D] hover:bg-[#C4915D] text-white font-semibold rounded-lg transition-colors"
                                >
                                    Kosongkan Meja
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Popup Edit Meja */}
                {showEditMejaPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-[#D4A15D] text-white p-4 flex justify-between items-center rounded-t-lg">
                                <h2 className="text-lg font-bold">Edit Meja</h2>
                                <button
                                    onClick={() => setShowEditMejaPopup(false)}
                                    className="text-white hover:text-gray-200 text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Konten */}
                            <div className="p-6">
                                <div className="space-y-3">
                                    {tables.map((table) => (
                                        <div
                                            key={table.meja_id}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <span className="font-medium">Meja {table.nomor_meja}</span>
                                            <button
                                                onClick={() => handleHapusMeja(table.meja_id)}
                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Tombol Tambah Meja */}
                                <button
                                    onClick={handleTambahMeja}
                                    className="w-full mt-4 py-2 bg-[#D4A15D] hover:bg-[#C4915D] text-white font-semibold rounded-lg transition-colors"
                                >
                                    + Tambah Meja
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default TableManagement;