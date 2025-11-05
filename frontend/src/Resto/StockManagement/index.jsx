import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { MoreVertical } from 'react-feather';
import Header from '../../components/common/Header';
import SearchView from '../../components/ui/SearchView';
import StockDetail from './StockDetail';
import StockDamage from './StockDamage';
import StockEdit from './StockEditNotif';
import ShoppingForm from './FormBelanja';
import StockWarning from './StockWarning';
import AddBahan from './AddBahan';
import EditBahan from './EditBahan';
import EditKategoriBahan from './EditKategoriBahan';
import { useAuth } from '../../context/AuthContext';
import EditStatusBahan from './EditStatusBahan';

const StockManagement = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [warnings, setWarnings] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stokRes, warningsRes] = await Promise.all([
        fetch('/api/stok'),
        fetch('/api/stok/warnings')
      ]);
      if (!stokRes.ok || !warningsRes.ok) throw new Error("Gagal mengambil data dari server.");

      const stokData = await stokRes.json();
      const warningsData = await warningsRes.json();
      setStockData(stokData);

      if (warningsData.stokMenipis.length > 0 || warningsData.stokKadaluwarsa.length > 0) {
        setWarnings(warningsData);
        setShowWarning(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId !== null && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const handleOpenModal = (type, item) => {
    setActiveModal({ type, data: item });
    setOpenDropdownId(null);
  };

  const handleCloseModal = () => {
    setActiveModal({ type: null, data: null });
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  const handleToggleDropdown = (itemId, event) => {
    if (openDropdownId === itemId) {
      setOpenDropdownId(null);
    } else {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 160; // Perkiraan tinggi dropdown

      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - 192; // 192px = w-48

      // Jika dropdown akan keluar dari viewport bawah, tampilkan di atas button
      if (top + dropdownHeight > viewportHeight) {
        top = buttonRect.top - dropdownHeight - 8;
      }

      setDropdownPosition({ top, left });
      setOpenDropdownId(itemId);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const stockByCategory = stockData.reduce((acc, item) => {
    const category = item.kategori || 'Tanpa Kategori';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const renderStockTable = (category, items) => {
    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredItems.length === 0) return null;

    return (
      <div key={category} className="mb-8 last:mb-0">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{category}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Nama Bahan', 'Stok', 'Stok Terbaru', 'Stok Terlama', 'Peringatan Stok', 'Peringatan Kadaluarsa', 'Action'].map(header => (
                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map(item => (
                <tr
                  key={item.id}
                  className={item.status === 'tidak tersedia' ? 'bg-gray-50 opacity-60' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover bg-gray-200"
                          src={item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}?t=${new Date().getTime()}` : '/images/placeholder_ayam.png'}
                          alt={item.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name.includes(`(${item.unit})`) ? item.name : `${item.name} (${item.unit})`}
                          {item.status === 'tidak tersedia' && (
                            <span className="ml-2 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              Nonaktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastIn ? new Date(item.lastIn).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.firstIn ? new Date(item.firstIn).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.warningAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.peringatan_kadaluarsa_hari ? `${item.peringatan_kadaluarsa_hari} Hari` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleToggleDropdown(item.id, e)}
                      className="p-2 bg-[#D4A15D] text-white rounded-md hover:bg-opacity-90 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={item.status === 'tidak tersedia'}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const allStockItems = stockData;

  return (
    <>
      <Helmet><title>Manajemen Stok | MiWau</title></Helmet>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full sm:w-1/3">
                  <SearchView placeholder="Search by ingredient name..." value={searchQuery} onChange={handleSearchChange} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenModal('addBahan', true)} className="px-4 py-2 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-opacity-90 transition">
                    Tambah Jenis Bahan
                  </button>
                  <button onClick={() => handleOpenModal('editKategoriBahan', true)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-200 transition">
                    Edit Kategori
                  </button>
                  <button onClick={() => handleOpenModal('editStatusBahan', true)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-200 transition">
                    Edit Status Bahan
                  </button>
                </div>
              </div>

              {loading && <p>Loading data stok...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              {!loading && !error && Object.keys(stockByCategory).map(category =>
                renderStockTable(category, stockByCategory[category])
              )}
            </div>
          </div>
        </main>
        <div className="fixed bottom-8 right-8 z-10">
          <button onClick={() => handleOpenModal('shoppingForm', allStockItems)} className="px-6 py-3 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-lg hover:bg-opacity-90 transition transform hover:scale-105">
            Form Belanja
          </button>
        </div>
      </div>

      {showWarning && <StockWarning warnings={warnings} onClose={handleCloseWarning} />}

      {/* Dropdown Popup */}
      {openDropdownId !== null && (
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-xl z-50 border border-gray-200 py-2 w-48"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <button
            onClick={() => {
              const item = stockData.find(s => s.id === openDropdownId);
              handleOpenModal('editBahan', item);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Edit Detail Bahan
          </button>
          <button
            onClick={() => {
              const item = stockData.find(s => s.id === openDropdownId);
              handleOpenModal('detail', item);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Detail Bahan
          </button>
          <button
            onClick={() => {
              const item = stockData.find(s => s.id === openDropdownId);
              handleOpenModal('damage', item);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Rusak/Berkurang
          </button>
          <button
            onClick={() => {
              const item = stockData.find(s => s.id === openDropdownId);
              handleOpenModal('edit', item);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Edit Notifikasi
          </button>
        </div>
      )}

      {/* Modals */}
      <EditBahan item={activeModal.type === 'editBahan' ? activeModal.data : null} onClose={handleCloseModal} onUpdate={fetchData} />
      <StockDetail item={activeModal.type === 'detail' ? activeModal.data : null} onClose={handleCloseModal} onUpdate={fetchData} />
      <StockDamage item={activeModal.type === 'damage' ? activeModal.data : null} onClose={handleCloseModal} onUpdate={fetchData} currentUser={currentUser} />
      <StockEdit item={activeModal.type === 'edit' ? activeModal.data : null} onClose={handleCloseModal} onUpdate={fetchData} />

      <ShoppingForm stockItems={activeModal.type === 'shoppingForm' ? activeModal.data : null} onClose={handleCloseModal} onUpdate={fetchData} />
      <AddBahan
        show={activeModal.type === 'addBahan'}
        onClose={handleCloseModal}
        onAdd={fetchData}
      />
      <EditKategoriBahan
        show={activeModal.type === 'editKategoriBahan'}
        onClose={handleCloseModal}
        onUpdate={fetchData}
      />
      <EditStatusBahan
        show={activeModal.type === 'editStatusBahan'}
        onClose={handleCloseModal}
        onUpdate={fetchData}
      />
    </>
  );
};

export default StockManagement;