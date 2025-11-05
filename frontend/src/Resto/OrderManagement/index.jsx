import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import PopUpOrderDetail from './PopUpOrderDetail';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeFilter, setActiveFilter] = useState('All');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isDateFilterActive, setIsDateFilterActive] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

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
            case 'Paid': return 'text-green-700 bg-green-100';
            case 'Pending': return 'text-yellow-700 bg-yellow-100';
            case 'Not Paid': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const newOrders = useMemo(() => orders.filter(o => o.orderStatus === 'Pending'), [orders]);
    const inProcessOrders = useMemo(() => orders.filter(o => o.orderStatus === 'Diproses'), [orders]);
    const readyToServeOrders = useMemo(() => orders.filter(o => o.orderStatus === 'Siap'), [orders]);
    const completedOrders = useMemo(() => orders.filter(o => o.orderStatus === 'Completed'), [orders]);
    const cancelledOrders = useMemo(() => orders.filter(o => o.orderStatus === 'Cancelled'), [orders]);

    const OrderCard = ({ order }) => (
        <div key={order.transaksi_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 whitespace-pre-line">
                        {order.type === 'Dine In'
                            ? `Order #${order.transaksi_id}\nMeja ${order.id}`
                            : `Order #${order.transaksi_id}`
                        }
                    </h3>
                    <div className="text-right">
                        {/* --- PERUBAHAN SESUAI REKOMENDASI --- */}
                        <p className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getPaymentBadgeStyle(order.paymentStatus)}`}>
                            {order.paymentStatus}
                        </span>
                    </div>
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

    const filterButtons = ['All', 'Siap Disajikan', 'Sedang Diproses', 'Pesanan Baru', 'Selesai', 'Dibatalkan'];

    return (
        <>
            <Helmet><title>Manajemen Pesanan | MiWau</title></Helmet>
            <div className="min-h-screen bg-gray-50 font-sans">
                <Header />
                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center space-x-1 border-b border-gray-200 overflow-x-auto">
                            {filterButtons.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${activeFilter === filter
                                            ? 'border-b-2 border-yellow-500 text-gray-800'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
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

                            {(activeFilter === 'All' || activeFilter === 'Selesai') && completedOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Selesai</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {completedOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
                                    </div>
                                </section>
                            )}

                            {(activeFilter === 'All' || activeFilter === 'Dibatalkan') && cancelledOrders.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-700 mb-4">Dibatalkan</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {cancelledOrders.map(order => <OrderCard key={order.transaksi_id} order={order} />)}
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