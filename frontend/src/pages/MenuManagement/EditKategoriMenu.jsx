import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';

const EditKategori = ({ onClose, onUpdate }) => {
  const [kategoriList, setKategoriList] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data dari API
  const fetchKategori = async () => {
    try {
      setLoading(true);
      // DIUBAH: Mengambil data dari endpoint kategori menu
      const res = await fetch('/api/kategori-menu');
      const data = await res.json();
      setKategoriList(data);
    } catch (err) {
      console.error("Gagal mengambil kategori menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKategori();
  }, []);

  const handleAdd = async () => {
    if (!newKategori.trim()) return;
    try {
      // DIUBAH: Mengirim data ke endpoint kategori menu
      await fetch('/api/kategori-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori: newKategori }),
      });
      setNewKategori('');
      fetchKategori(); // Refresh list
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Gagal menambah kategori');
    }
  };

  const handleDelete = async (kategoriId) => {
    if (window.confirm('Menghapus kategori akan membuat menu terkait tidak memiliki kategori. Lanjutkan?')) {
      try {
        // DIUBAH: Menghapus data dari endpoint kategori menu
        await fetch(`/api/kategori-menu/${kategoriId}`, { method: 'DELETE' });
        fetchKategori(); // Refresh list
        if (onUpdate) onUpdate();
      } catch (err) {
        alert('Gagal menghapus kategori');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Kategori Menu</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        
        {loading ? <p>Loading...</p> : (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-500">Kategori Tersedia</label>
              <div className="mt-1 space-y-2">
                {kategoriList.map(kat => (
                  <div key={kat.kategori_menu_id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                    <span className="font-medium">{kat.nama_kategori}</span>
                    <button onClick={() => handleDelete(kat.kategori_menu_id)} className="px-3 py-1 text-sm bg-[#D4A15D] text-white rounded-md">Hapus</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500">Kategori Baru</label>
              <input 
                type="text" 
                placeholder="Contoh: Dessert" 
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-100 border rounded-lg" 
              />
            </div>
          </>
        )}

        <div className="mt-6">
          <button onClick={handleAdd} className="w-full py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
            + Tambahkan Kategori
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditKategori;