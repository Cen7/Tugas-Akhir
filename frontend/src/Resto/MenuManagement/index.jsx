import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import SearchView from '../../components/ui/SearchView';
import Switch from '../../components/ui/Switch';
import EditMenu from './EditMenu';
import AddMenu from './AddMenu';
import EditKategoriMenu from './EditKategoriMenu';
import EditPromo from './EditPromo';
import { useAuth } from '../../context/AuthContext';

const MenuManagement = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuData, setMenuData] = useState({});
  const [bahanBaku, setBahanBaku] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, data: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // DIUBAH: Fetch sekarang ke /api/kategori-menu
      const [menuRes, bahanRes, kategoriRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/bahan-baku'),
        fetch('/api/kategori-menu'),
      ]);
      if (!menuRes.ok || !bahanRes.ok || !kategoriRes.ok) {
        throw new Error('Gagal mengambil data dari server');
      }
      const menu = await menuRes.json();
      const bahan = await bahanRes.json();
      const kategori = await kategoriRes.json();

      setMenuData(menu);
      setBahanBaku(bahan);
      setKategoriList(kategori);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { currentUser } = useAuth();
  const isManagerOrOwner = currentUser && (currentUser.role === 'Manajer' || currentUser.role === 'Pemilik');



  const handleAvailabilityChange = async (id, category, newAvailability) => {
    const originalMenuData = JSON.parse(JSON.stringify(menuData));
    setMenuData(prevData => {
      const updatedCategory = prevData[category].map(item =>
        item.menu_id === id ? { ...item, available: newAvailability } : item
      );
      return { ...prevData, [category]: updatedCategory };
    });

    try {
      const res = await fetch(`/api/menu/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newAvailability }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui status di server');
    } catch (err) {
      setError(err.message);
      setMenuData(originalMenuData);
    }
  };

  const handleOpenModal = (type, item) => {
    setActiveModal({ type, data: item });
  };

  const handleCloseModal = () => {
    setActiveModal({ type: null, data: null });
  };

  const handleMenuUpdate = () => {
    fetchData();
  };

  const renderMenuItem = (item, category) => (
    <div key={item.menu_id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src={item.has_gambar ? `http://localhost:3000/api/menu/gambar/${item.menu_id}?t=${new Date().getTime()}` : '/images/placeholder_food.png'} alt={item.nama_menu} className="w-14 h-14 rounded-md object-cover bg-gray-200" />
        <div>
          <p className="font-semibold text-gray-800">{item.nama_menu}</p>
          <p className="text-sm text-gray-500">Rp {Number(item.harga).toLocaleString('id-ID')}</p>
        </div>
      </div>
      {activeFilter === 'Edit Menu' ? (
        <button onClick={() => handleOpenModal('editMenu', item)} className="px-4 py-2 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-opacity-90 transition">
          Edit
        </button>
      ) : (
        <Switch checked={item.available} onChange={newAvailability => handleAvailabilityChange(item.menu_id, category, newAvailability)} />
      )}
    </div>
  );
  const filterButtons = [
    'All',
    ...kategoriList.map(k => k.nama_kategori),
    ...(isManagerOrOwner ? ['Edit Menu'] : [])
  ];

  return (
    <>
      <Helmet>
        <title>Manajemen Menu | MiWau</title>
        <meta name="description" content="Halaman untuk mengelola ketersediaan menu makanan dan minuman." />
      </Helmet>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="w-full flex justify-center mb-6">
              <div className="w-full max-w-lg">
                <SearchView placeholder="Search by menu name or tag" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between items-center mb-8">
              <div className="flex justify-start items-center bg-white p-1 rounded-lg shadow-sm w-fit">
                {/* DIUBAH: Menggunakan array dinamis untuk merender tombol filter */}
                {filterButtons.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-[#B28C63] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {isManagerOrOwner && (
                  <>
                    <button onClick={() => handleOpenModal('addMenu', null)} className="px-4 py-2 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-opacity-90 transition">
                      Tambah Menu
                    </button>
                    <button onClick={() => handleOpenModal('editKategoriMenu', null)} className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition">
                      Edit Kategori
                    </button>
                    <button onClick={() => handleOpenModal('editPromo', null)} className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition">
                      Edit Promo
                    </button>
                  </>
                )}
              </div>
            </div>
            {loading && <p>Loading menu...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!loading && !error && (
              <div className="space-y-6">
                {/* DIUBAH: Blok render section menu yang sekarang sepenuhnya dinamis */}
                {Object.keys(menuData).map(categoryName => {
                  // Tampilkan section jika filter = 'All', atau filter = nama kategori, atau filter = 'Edit Menu'
                  if (activeFilter === 'All' || activeFilter === categoryName || activeFilter === 'Edit Menu') {
                    const filteredItems = menuData[categoryName].filter(item =>
                      item.nama_menu.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (filteredItems.length === 0) return null;

                    return (
                      <section key={categoryName}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{categoryName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredItems.map(item => renderMenuItem(item, categoryName))}
                        </div>
                      </section>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      {activeModal.type === 'editMenu' && (
        <EditMenu
          item={activeModal.data}
          bahanBakuList={bahanBaku}
          kategoriList={kategoriList} // 3. KIRIM LIST KATEGORI SEBAGAI PROP
          onClose={handleCloseModal}
          onUpdate={handleMenuUpdate}
        />
      )}
      {activeModal.type === 'addMenu' && (
        <AddMenu
          bahanBakuList={bahanBaku}
          kategoriList={kategoriList} // <-- PASTIKAN BARIS INI ADA
          onClose={handleCloseModal}
          onAdd={handleMenuUpdate}
        />
      )}
      // Di dalam MenuManagement.jsx (bagian return)
      {activeModal.type === 'editKategoriMenu' && (
        <EditKategoriMenu
          show={true} // <-- TAMBAHKAN BARIS INI
          onClose={handleCloseModal}
          onUpdate={fetchData} // Panggil fetchData agar list menu ter-refresh jika kategori berubah
        />
      )}
      {activeModal.type === 'editPromo' && (
        <EditPromo
          show={true}
          onClose={handleCloseModal}
          onUpdate={fetchData}
          menuList={Object.values(menuData).flat()}
        />
      )}
    </>
  );
};

export default MenuManagement;