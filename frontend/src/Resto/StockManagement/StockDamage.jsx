import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';

// Menerima prop 'currentUser' dari StockManagement
const StockDamage = ({ item, onClose, onUpdate, currentUser }) => {
  const [batches, setBatches] = useState([]);
  const [damageData, setDamageData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;
    const fetchBatches = async () => {
      setLoading(true);
      try {
          const res = await fetch(`/api/stok/batches/${item.id}`);
          if (!res.ok) throw new Error("Gagal memuat data batch.");
          const data = await res.json();
          setBatches(data);
      } catch(err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
    };
    fetchBatches();
  }, [item]);
  
  if (!item) return null;

  const handleInputChange = (stok_id, field, value) => {
    setDamageData(prev => {
      const updated = { ...prev };
      
      if (field === 'rusak') {
        // Cari batch yang sesuai untuk mendapatkan maksimal stok tersedia
        const batch = batches.find(b => b.stok_id === stok_id);
        const maxStock = batch ? batch.total : 0;
        
        // Parse value sebagai number
        let numValue = parseInt(value) || 0;
        
        // Batasi maksimal sesuai stok tersedia
        if (numValue > maxStock) {
          numValue = maxStock;
        }
        
        // Pastikan tidak negatif
        if (numValue < 0) {
          numValue = 0;
        }
        
        updated[stok_id] = { ...updated[stok_id], [field]: numValue };
      } else {
        // Untuk field selain 'rusak' (seperti 'alasan')
        updated[stok_id] = { ...updated[stok_id], [field]: value };
      }
      
      return updated;
    });
  };

  // --- FUNGSI handleSubmit YANG DIPERBAIKI ---
  const handleSubmit = async () => {
    // 1. Filter hanya item yang diisi jumlah rusaknya
    const itemsToSubmit = Object.keys(damageData)
      .filter(stok_id => damageData[stok_id]?.rusak > 0)
      .map(stok_id => {
        // Cari batch yang sesuai untuk mendapatkan bahan_id
        const correspondingBatch = batches.find(b => b.stok_id == stok_id);
        return {
          stok_id: stok_id,
          bahan_id: correspondingBatch?.bahan_id || item.id,
          rusak: damageData[stok_id].rusak,
          alasan: damageData[stok_id].alasan || 'Tidak ada keterangan'
        }
      });

    if (itemsToSubmit.length === 0) {
      alert("Silakan isi jumlah bahan yang rusak.");
      return;
    }
    
    // Pastikan currentUser ada sebelum mengirim
    if (!currentUser || !currentUser.id) {
        alert("Sesi pengguna tidak valid. Silakan login kembali.");
        return;
    }

    try {
      // 2. Kirim request dan simpan responsnya
      const res = await fetch('/api/stok/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pastikan properti user_id sesuai dengan yang diharapkan backend
        // dan gunakan 'currentUser.id' dari AuthContext
        body: JSON.stringify({ user_id: currentUser.id, items: itemsToSubmit })
      });

      // 3. Periksa apakah respons dari server OK (status 2xx)
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan data');
      }

      // 4. Jika berhasil, baru tampilkan pesan sukses
      alert("Data kerusakan berhasil disimpan.");
      if (onUpdate) onUpdate(); // Refresh data di halaman utama
      onClose(); // Tutup modal

    } catch (err) {
      // Jika gagal, tampilkan pesan error yang diterima dari backend
      console.error("Error saat mencatat kerusakan:", err);
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 font-sans" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative text-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition">
          <X size={24} />
        </button>
        
        <img src={item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}` : '/images/placeholder_ayam.png'} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4"/>
        
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <p className="text-sm text-gray-500 mb-6">Notification Alert: {item.warningAt} {item.unit}</p>

        <div className="overflow-x-auto">
          {loading ? <p>Loading batches...</p> : (
            <table className="min-w-full">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">Tanggal Masuk</th>
                  <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">Kadaluarsa</th>
                  <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">Rusak</th>
                  <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.stok_id}>
                    <td className="py-2 px-3 text-gray-700">{new Date(batch.tanggalMasuk).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 px-3 text-gray-700">{new Date(batch.tanggal_kadaluarsa).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 px-3 text-gray-700 font-semibold">{batch.total}</td>
                    <td className="py-2 px-3">
                      <input 
                        type="number" 
                        placeholder="0"
                        min="0"
                        max={batch.total}
                        value={damageData[batch.stok_id]?.rusak || ''}
                        onChange={(e) => handleInputChange(batch.stok_id, 'rusak', e.target.value)} 
                        className="w-24 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input 
                        type="text" 
                        placeholder="Keterangan (opsional)"
                        value={damageData[batch.stok_id]?.alasan || ''}
                        onChange={(e) => handleInputChange(batch.stok_id, 'alasan', e.target.value)} 
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSubmit} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
            + Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockDamage;