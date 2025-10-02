import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import { CheckSquare, Square } from 'react-feather';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('Meja');

  const fetchData = async () => {
    if (tables.length === 0) setLoading(true);
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('/api/meja/status'),
        fetch('/api/penjualan/aktif')
      ]);
      if (!tablesRes.ok || !ordersRes.ok) {
        throw new Error('Gagal mengambil data dari server');
      }
      const tablesData = await tablesRes.json();
      const ordersData = await ordersRes.json();

      setTables(tablesData);
      setActiveOrders(ordersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleItemStatusChange = async (detailId, currentStatus) => {
    const newStatus = currentStatus === 'Menunggu' ? 'Disajikan' : 'Menunggu';
    try {
      const response = await fetch(`/api/penjualan/item/${detailId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_item: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Gagal memperbarui status item');
      }
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const seatCounts = useMemo(() => {
    return tables.reduce((acc, table) => {
      // --- PERBAIKAN 1 ---
      const order = activeOrders.find(o => o.transaksi_id === table.transaksi_id);
      if (!order) {
        acc.free++;
      } else if (order.status_pembayaran === 'Paid') {
        acc.paid++;
      } else {
        acc.notPaid++;
      }
      return acc;
    }, { free: 0, notPaid: 0, paid: 0 });
  }, [tables, activeOrders]);

  const renderTableCard = (table) => {
    // --- PERBAIKAN 2 ---
    const order = activeOrders.find(o => o.transaksi_id === table.transaksi_id);

    let statusKey = 'empty';
    let statusInfo = {
      badgeText: 'Kosong',
      color: '#a1a1aa',
      progress: null
    };

    if (order) {
      const totalItems = order.items.length;
      const servedItems = order.items.filter(item => item.status_item === 'Disajikan').length;
      const isPaid = order.status_pembayaran === 'Paid';

      if (isPaid && servedItems === totalItems) {
        statusKey = 'paid_completed';
        statusInfo = { badgeText: 'Lunas', color: '#22c55e' };
      } else if (servedItems === totalItems && !isPaid) {
        statusKey = 'ready_to_pay';
        statusInfo = { badgeText: 'Siap Bayar', color: '#8b5cf6' };
      } else if (servedItems > 0 && servedItems < totalItems) {
        statusKey = 'in_progress';
        statusInfo = { badgeText: 'Diproses', color: '#3b82f6', progress: { served: servedItems, total: totalItems } };
      } else {
        statusKey = 'waiting';
        statusInfo = { badgeText: 'Belum Bayar', color: '#f59e0b' };
      }
    }

    return (
      <div key={table.meja_id} className="rounded-xl shadow-md border flex flex-col justify-between bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800">
              {table.transaksi_id ? `Meja ${table.nomor_meja} - #${table.transaksi_id}` : `Meja ${table.nomor_meja}`}
            </h3>
            <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: statusInfo.color }}>
              {statusInfo.badgeText}
            </span>
          </div>

          {statusKey === 'empty' ? (
            <p className="mt-10 text-center text-lg text-gray-400">Kosong</p>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Order: {new Date(table.tanggal_transaksi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="font-semibold text-xl text-gray-800 mt-1">
                Rp {(table.total_harga || 0).toLocaleString('id-ID')}
              </p>
            </div>
          )}
        </div>
        {statusInfo.progress && (
          <div className="w-full bg-gray-200 h-2">
            <div className="bg-blue-500 h-2 rounded-bl-xl" style={{ width: `${(statusInfo.progress.served / statusInfo.progress.total) * 100}%` }}></div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><p>Memuat data meja...</p></div>;
  if (error) return <div className="flex h-screen items-center justify-center"><p>Error: {error}</p></div>;

  return (
    <>
      <Helmet><title>Manajemen Meja | MiWau</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 72px)' }}>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6 bg-white rounded-lg shadow-sm p-2 w-fit">
              <button onClick={() => setActiveView('Meja')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === 'Meja' ? 'bg-[#D4A15D] text-white' : 'text-gray-600'}`}>
                Meja
              </button>
              <button onClick={() => setActiveView('Detail Pesanan')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === 'Detail Pesanan' ? 'bg-[#D4A15D] text-white' : 'text-gray-600'}`}>
                Detail Pesanan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {tables.map(renderTableCard)}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 border-2 border-zinc-400 rounded-full" /><span>Free <span className="font-bold">{seatCounts.free}</span></span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-50 border-2 border-amber-500 rounded-full" /><span>Not Paid <span className="font-bold">{seatCounts.notPaid}</span></span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded-full" /><span>Paid <span className="font-bold">{seatCounts.paid}</span></span></div>
              </div>
              <button className="px-4 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg text-sm">Edit Meja</button>
            </div>
          </div>

          <aside className="w-full lg:w-96 bg-gray-800 p-6 overflow-y-auto text-white">
            <h2 className="text-xl font-bold mb-4">{activeView === 'Meja' ? 'Order Aktif' : 'Detail Pesanan Aktif'}</h2>
            <div className="space-y-6">
              {activeOrders.map(order => (
                <div key={order.transaksi_id} className="border-b border-gray-700 pb-4 last:border-b-0">
                  <div className="mb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{`Order #${order.transaksi_id}`}</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status_pesanan === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                        order.status_pesanan === 'Diproses' ? 'bg-blue-200 text-blue-800' :
                          'bg-purple-200 text-purple-800'
                        }`}>
                        {order.status_pesanan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                      <p>
                        {new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {order.tipe_pesanan === 'Dine In' ? `Meja ${order.nomor_meja}` : 'Takeaway'}
                      </p>
                      <span className={`font-semibold ${order.status_pembayaran === 'Paid' ? 'text-green-400' : 'text-amber-400'}`}>
                        {order.status_pembayaran}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      (activeView !== 'Detail Pesanan' || item.status_item === 'Menunggu') && (
                        <div key={item.detail_id} className="flex justify-between items-center text-gray-300">
                          <div className="flex items-center gap-3">
                            {activeView === 'Detail Pesanan' && (
                              <button onClick={() => handleItemStatusChange(item.detail_id, item.status_item)}>
                                <Square size={18} />
                              </button>
                            )}
                            <span className={item.status_item === 'Disajikan' && activeView === 'Meja' ? 'line-through text-gray-500' : ''}>{item.nama_menu}</span>
                          </div>
                          <span>x {item.jumlah}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
              {activeOrders.length === 0 && (
                <p className="text-center text-gray-500 pt-10">Tidak ada pesanan aktif yang perlu dikerjakan.</p>
              )}
            </div>
          </aside>
        </main>
      </div>
    </>
  );
};

export default TableManagement;