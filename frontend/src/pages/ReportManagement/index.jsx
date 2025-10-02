import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import Header from '../../components/common/Header';
import PopUpPengeluaranDetail from './PopUpPengeluaranDetail';
import PopUpOrderDetail from '../OrderManagement/PopUpOrderDetail';

// --- Komponen Modal untuk Filter Tanggal Custom ---
const DateRangeModal = ({ isOpen, onClose, onApply }) => {
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(start, end);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Pilih Rentang Tanggal</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm">Dari</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" />
          </div>
          <div>
            <label className="text-sm">Sampai</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleApply} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Tampilan untuk Tab "All" (Dashboard Utama) ---
const AllReportView = ({ data }) => {
  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toLocaleString('id-ID')}.000.000`;
    return tickItem.toLocaleString('id-ID');
  };

  const summary = data?.summary || { totalPendapatan: 0, totalOrder: 0, totalPengeluaran: 0 };
  const dailySelling = data?.dailySelling || [];
  const revenueByCategory = data?.revenueByCategory || [];
  const bestDishes = data?.bestDishes || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Pendapatan</p>
            <p className="text-xl font-bold text-gray-800">Rp {summary.totalPendapatan.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Order</p>
            <p className="text-xl font-bold text-gray-800">{summary.totalOrder}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Pengeluaran</p>
            <p className="text-xl font-bold text-gray-800">Rp {summary.totalPengeluaran.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Selling</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={dailySelling} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} domain={[0, 'dataMax + 100000']} />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Area type="monotone" dataKey="sales" stroke="#f97316" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div style={{ width: 150, height: 150, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={revenueByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={75} fill="#8884d8" paddingAngle={5} dataKey="value" cornerRadius={5}>
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold">Rp {summary.totalPendapatan.toLocaleString('id-ID')}</span>
                <span className="text-sm text-gray-500">Total</span>
              </div>
            </div>
            <div className="space-y-4">
              {revenueByCategory.map(entry => (
                <div key={entry.id} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                  <div>
                    <p className="text-sm text-gray-500">{entry.name}</p>
                    <p className="font-bold">Rp {entry.value.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Best Dishes</h2>
          <div className="flex justify-between mb-2 text-sm text-gray-400">
            <span>Dishes</span>
            <span>Orders</span>
          </div>
          <div className="space-y-4">
            {bestDishes.map(dish => (
              <div key={dish.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={dish.image} alt={dish.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{dish.name}</p>
                    <p className="text-sm text-orange-500">{dish.price}</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-gray-800">{dish.orders}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Tampilan untuk Tab "Pendapatan" ---
const PendapatanReportView = ({ data, onOpenDetail }) => {
  const pendapatanDetails = data?.pendapatanDetails || [];
  const bestDishes = data?.bestDishes || [];
  const revenueByCategory = data?.revenueByCategory || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Laporan Pendapatan</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="py-2 px-2">Order ID</th>
                <th className="py-2 px-2">Tanggal</th>
                <th className="py-2 px-2">Waktu</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {pendapatanDetails.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-2 font-semibold">{`#${item.id}`}</td>
                  <td className="py-3 px-2">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-3 px-2">{new Date(item.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-2">Rp {item.total.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onOpenDetail(item.id, 'pendapatan')}
                      className="bg-[#D4A15D] text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm hover:bg-opacity-80 transition"
                    >
                      . . .
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Pendapatan</p>
          <p className="text-xl font-bold text-gray-800">Rp {(data?.summary?.totalPendapatan || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Order</p>
          <p className="text-xl font-bold text-gray-800">{data?.summary?.totalOrder || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-bold mb-4">Pendapatan per Kategori</h3>
          <div className="flex items-center justify-between">
            <div style={{ width: 150, height: 150, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={revenueByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={75} fill="#8884d8" paddingAngle={5} dataKey="value" cornerRadius={5}>
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold">Rp {(data?.summary?.totalPendapatan || 0).toLocaleString('id-ID')}</span>
                <span className="text-sm text-gray-500">Total</span>
              </div>
            </div>
            <div className="space-y-4">
              {revenueByCategory.map(entry => (
                <div key={entry.id} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                  <div>
                    <p className="text-sm text-gray-500">{entry.name}</p>
                    <p className="font-bold">Rp {entry.value.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Best Dishes</h2>
          <div className="space-y-4">
            {bestDishes.map(dish => (
              <div key={dish.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={dish.image} alt={dish.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{dish.name}</p>
                    <p className="text-sm text-orange-500">{dish.price}</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-gray-800">{dish.orders}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Tampilan untuk Tab "Pengeluaran" ---
const PengeluaranReportView = ({ data, onOpenDetail }) => {
  const pengeluaranDetails = data?.pengeluaranDetails || [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Laporan Pengeluaran</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="py-2 px-2">Tanggal</th>
                <th className="py-2 px-2">Waktu</th>
                <th className="py-2 px-2">Keterangan</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {pengeluaranDetails.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-2">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-3 px-2">{new Date(item.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-2 font-semibold">{item.keterangan}</td>
                  <td className="py-3 px-2">Rp {item.total.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onOpenDetail(item.id, 'pengeluaran')}
                      className="bg-[#D4A15D] text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm hover:bg-opacity-80 transition"
                    >...</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Pengeluaran</p>
          <p className="text-xl font-bold text-gray-800">Rp {(data?.summary?.totalPengeluaran || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Transaksi</p>
          <p className="text-xl font-bold text-gray-800">{pengeluaranDetails.length}</p>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Utama ---
const ReportManagement = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [activeTimeFilter, setActiveTimeFilter] = useState('Hari ini');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, type: null, loading: false });

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      let url;
      if (activeTimeFilter === 'Custom') {
        url = `/api/laporan?periode=Custom&startDate=${customDateRange.start}&endDate=${customDateRange.end}`;
      } else {
        const period = { 'Hari ini': 'daily', 'Minggu Ini': 'weekly', 'Bulan Ini': 'monthly' }[activeTimeFilter];
        if (period) {
          url = `/api/laporan?periode=${period}`;
        } else {
          setLoading(false);
          return;
        }
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal mengambil data laporan');
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [activeTimeFilter, customDateRange]);

  const handleApplyCustomDate = (start, end) => {
    setActiveTimeFilter('Custom');
    setCustomDateRange({ start, end });
  };

  const handleCloseDetailModal = () => {
    setDetailModal({ isOpen: false, data: null, type: null, loading: false });
  };

  const handleOpenDetailModal = async (id, type) => {
    setDetailModal({ isOpen: true, data: null, type: type, loading: true });
    try {
      const url = type === 'pendapatan' ? `/api/penjualan/${id}` : `/api/pembelian/${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal mengambil detail ${type}`);
      const data = await response.json();
      setDetailModal({ isOpen: true, data: data, type: type, loading: false });
    } catch (err) {
      console.error(err);
      alert(err.message);
      setDetailModal({ isOpen: false, data: null, type: null, loading: false });
    }
  };

  const renderActiveDateFilterText = () => {
    if (activeTimeFilter === 'Custom') {
      return `Laporan untuk rentang: ${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`;
    }
    if (activeTimeFilter === 'Hari ini') {
      return `Laporan untuk tanggal: ${formatDate(new Date().toISOString())}`;
    }
    return `Laporan untuk: ${activeTimeFilter}`;
  };

  const renderContent = () => {
    if (loading) return <p className="text-center p-10">Memuat data laporan...</p>;
    if (error) return <p className="text-center p-10 text-red-500">Error: {error}</p>;
    if (!reportData) return <p className="text-center p-10">Tidak ada data untuk ditampilkan.</p>;

    switch (activeTab) {
      case 'Pendapatan':
        return <PendapatanReportView data={reportData} onOpenDetail={handleOpenDetailModal} />;
      case 'Pengeluaran':
        return <PengeluaranReportView data={reportData} onOpenDetail={handleOpenDetailModal} />;
      default:
        return <AllReportView data={reportData} />;
    }
  };

  return (
    <>
      <Helmet><title>Laporan | MiWau</title></Helmet>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center bg-white p-1 rounded-lg shadow-sm">
              {['All', 'Pendapatan', 'Pengeluaran'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-[#D4A15D] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-white p-1 rounded-lg shadow-sm">
              {['Hari ini', 'Minggu Ini', 'Bulan Ini'].map(filter => (
                <button key={filter} onClick={() => setActiveTimeFilter(filter)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTimeFilter === filter ? 'bg-[#D4A15D] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                  {filter}
                </button>
              ))}
              <button onClick={() => setIsDateModalOpen(true)} className={`px-4 py-2 text-sm font-semibold rounded-md ml-2 transition-colors ${activeTimeFilter === 'Custom' ? 'bg-[#D4A15D] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                Filter
              </button>
            </div>
          </div>

          <div className="mb-6 text-sm text-gray-600 font-semibold">
            <p>{renderActiveDateFilterText()}</p>
          </div>

          {renderContent()}
        </main>
      </div>
      <DateRangeModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onApply={handleApplyCustomDate} />
      {detailModal.isOpen && (
        <>
          {detailModal.loading && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading detail...</p></div>}
          {!detailModal.loading && detailModal.data && (
            <>
              {detailModal.type === 'pendapatan' && (
                <PopUpOrderDetail
                  order={detailModal.data}
                  onClose={handleCloseDetailModal} // PERBAIKAN 2: Gunakan nama fungsi yang benar
                />
              )}
              {detailModal.type === 'pengeluaran' && (
                <PopUpPengeluaranDetail
                  data={detailModal.data}
                  onClose={handleCloseDetailModal} // PERBAIKAN 2: Gunakan nama fungsi yang benar
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default ReportManagement;