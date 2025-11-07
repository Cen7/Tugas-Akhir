import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import PopUpOrderDetail from './PopUpOrderDetail';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tambah ini di sebelah state lain
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState('All');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isDateFilterActive, setIsDateFilterActive] = useState(false); // Default ke false (Show All)

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let url = '/api/penjualan';
            if (isDateFilterActive) {
                const start = startDate.toISOString().split('T')[0];
                const end = endDate.toISOString().split('T')[0];
                url += `?startDate=${start}&endDate=${end}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [startDate, endDate, isDateFilterActive]);

    const handleShowAll = () => setIsDateFilterActive(prev => !prev);
    const handleViewDetails = (order) => { setSelectedOrder(order); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedOrder(null); };
    const getPaymentBadgeStyle = (status) => {
        switch (status) {
            case 'Lunas': return 'text-green-700 bg-green-100';
            case 'Pending': return 'text-gray-700 bg-gray-100';
            case 'Belum Lunas': return 'text-red-700 bg-red-100';
            case 'Dibatalkan': return 'text-gray-700 bg-gray-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getPaymentLabel = (status) => {
        switch (status) {
            case 'Lunas': return 'Lunas';
            case 'Pending': return 'Pending';
            case 'Belum Lunas': return 'Belum Lunas';
            case 'Dibatalkan': return 'Dibatalkan';
            default: return status;
        }
    };

    const getOrderStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Pending': return 'text-gray-700 bg-gray-100';
            case 'Diproses': return 'text-orange-700 bg-orange-100';
            case 'Siap': return 'text-blue-700 bg-blue-100';
            case 'Selesai': return 'text-green-700 bg-green-100';
            case 'Dibatalkan': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getOrderStatusLabel = (status) => {
        switch (status) {
            case 'Pending': return 'Pending';
            case 'Diproses': return 'Diproses';
            case 'Siap': return 'Siap';
            case 'Selesai': return 'Selesai';
            case 'Dibatalkan': return 'Dibatalkan';
            default: return status;
        }
    };

    const filteredOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return orders.filter(o => {
            // Normalisasi tipe pesanan ke label DB: 'Dine-in' atau 'Takeaway'
            const rawType = (o.type || o.tipe_pesanan || '').toString();
            const typeLower = rawType.toLowerCase();
            let normalizedType = 'Takeaway';
            if (typeLower.includes('dine') || typeLower.includes('dine in') || typeLower.includes('dine-in') || (o.nomor_meja || o.id)) {
                normalizedType = 'Dine-in';
            } else if (typeLower.includes('take') || typeLower.includes('takeaway') || typeLower.includes('take-away')) {
                normalizedType = 'Takeaway';
            }

            // Terapkan filter tipe (All / Dine-in / Takeaway)
            if (activeTypeFilter !== 'All' && normalizedType.toLowerCase() !== activeTypeFilter.toLowerCase()) return false;

            // Jika tidak ada query pencarian, terima (setelah filter tipe)
            if (!q) return true;

            // Cari berdasarkan transaksi id, nama pembeli, atau nomor meja
            const idMatch = String(o.transaksi_id).toLowerCase().includes(q);
            const name = (o.customer || o.nama_pembeli || '').toString().toLowerCase();
            const nameMatch = name.includes(q);
            const meja = (o.id || o.nomor_meja || '').toString().toLowerCase();
            const mejaMatch = meja.includes(q);

            return idMatch || nameMatch || mejaMatch;
        });
    }, [orders, searchQuery, activeTypeFilter]);

    const newOrders = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'Pending'), [filteredOrders]);
    const inProcessOrders = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'Diproses'), [filteredOrders]);
    const readyToServeOrders = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'Siap'), [filteredOrders]);
    const SelesaiOrders = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'Selesai'), [filteredOrders]);
    const DibatalkanOrders = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'Dibatalkan' || o.orderStatus === 'Cancel'), [filteredOrders]);
    const LunasOrders = useMemo(() => filteredOrders.filter(o => o.paymentStatus === 'Lunas'), [filteredOrders]);
    const notLunasOrders = useMemo(() => filteredOrders.filter(o => o.paymentStatus === 'Belum Lunas'), [filteredOrders]);

    const OrderCard = ({ order }) => (
        <div key={order.transaksi_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 whitespace-pre-line">
                            {order.type === 'Dine In'
                                ? `Order #${order.transaksi_id}\nMeja ${order.id}`
                                : `Order #${order.transaksi_id}`
                            }
                        </h3>
                        {(order.customer || order.nama_pembeli) && (
                            <p className="text-sm text-gray-600 mt-1">Nama: <span className="font-semibold text-gray-800">{order.customer || order.nama_pembeli}</span></p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">
                            {new Date(order.date).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getOrderStatusBadgeStyle(order.orderStatus)}`}>
                        {getOrderStatusLabel(order.orderStatus)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getPaymentBadgeStyle(order.paymentStatus)}`}>
                        {getPaymentLabel(order.paymentStatus)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {(order.type || order.tipe_pesanan || (order.nomor_meja ? 'Dine In' : 'Takeaway'))}
                    </span>
                </div>

                <div className="border-t border-gray-200 my-2"></div>
                <div className="space-y-1 mb-4 min-h-[80px]">
                    {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-600">
                            <span>{item.name}</span>
                            <span>x {item.quantity}</span>
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 mt-1">{order.items.length - 3} more...</p>
                    )}
                </div>
            </div>
            <button
                onClick={() => handleViewDetails(order)}
                className="w-full py-2 bg-[#D4A15D] text-white font-semibold rounded-md hover:bg-opacity-90 transition text-sm"
            >
                + VIEW DETAILS
            </button>
        </div>
    );

    const filterButtons = ['All', 'Siap Disajikan', 'Sedang Diproses', 'Pesanan Baru', 'Selesai', 'Dibatalkan', 'Lunas', 'Belum Lunas'];

    return (
        <>
            <Helmet><title>Manajemen Pesanan | MiWau</title></Helmet>
            <div className="min-h-screen bg-gray-50 font-sans">
                <Header />
                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Filter Section - 2 Rows Layout */}
                    <div className="mb-6 space-y-4">
                        {/* Row 1: Status Filters */}
                        <div className="flex items-center flex-wrap gap-2">
                            {filterButtons.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeFilter === filter
                                        ? 'bg-[#D4A15D] text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-300 hover:border-[#D4A15D] hover:text-[#D4A15D]'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Row 2: Date Filter */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Type Filters (Dine-in / Takeaway) */}
                            <div className="flex items-center gap-2 ml-4">
                                {['All', 'Dine-in', 'Takeaway'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTypeFilter(t)}
                                        className={`px-3 py-1 text-sm rounded-md ${activeTypeFilter === t ? 'bg-[#D4A15D] text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {/* Search bar for Order ID or Customer Name */}
                            <div className="flex-1 min-w-[220px]">
                                <input
                                    type="text"
                                    placeholder="Cari Order ID, Nama Pembeli, atau No Meja"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="start-date" className="text-sm font-semibold text-gray-600">Dari:</label>
                                <input type="date" id="start-date"
                                    value={startDate.toISOString().split('T')[0]}
                                    onChange={(e) => setStartDate(new Date(e.target.value))}
                                    disabled={!isDateFilterActive}
                                    className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-100"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="end-date" className="text-sm font-semibold text-gray-600">Sampai:</label>
                                <input type="date" id="end-date"
                                    value={endDate.toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                    disabled={!isDateFilterActive}
                                    className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm disabled:bg-gray-100"
                                />
                            </div>
                            <button onClick={handleShowAll} className="px-4 py-2 text-sm font-semibold text-white bg-[#D4A15D] rounded-lg shadow-sm hover:bg-opacity-90 transition">
                                {isDateFilterActive ? 'Tampilkan Semua' : 'Gunakan Filter Tanggal'}
                            </button>
                        </div>
                    </div>

                    {loading && <p className="text-center text-gray-500">Memuat pesanan...</p>}
                    {error && <p className="text-center text-red-500">Error: {error}</p>}
                    {!loading && !error && orders.length === 0 && (
                        <p className="text-center text-gray-500 py-10">Tidak ada pesanan.</p>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="space-y-8">
                            {(activeFilter === 'All' || activeFilter === 'Siap Disajikan') && readyToServeOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Siap Disajikan</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {readyToServeOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'All' || activeFilter === 'Sedang Diproses') && inProcessOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Sedang Diproses</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {inProcessOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'All' || activeFilter === 'Pesanan Baru') && newOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Pesanan Baru</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {newOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'All' || activeFilter === 'Selesai') && SelesaiOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Selesai</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {SelesaiOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'All' || activeFilter === 'Dibatalkan') && DibatalkanOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Dibatalkan</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {DibatalkanOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'Lunas') && LunasOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Lunas</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {LunasOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'Belum Lunas') && notLunasOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Belum Lunas</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {notLunasOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                        </div>
                    )}
                </main>
            </div>

            {isModalOpen && <PopUpOrderDetail order={selectedOrder} onClose={handleCloseModal} onUpdate={fetchOrders} />}
        </>
    );
};

export default OrderManagement;