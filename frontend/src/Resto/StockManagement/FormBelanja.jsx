import React, { useState } from 'react';
import { X } from 'react-feather';
import { useAuth } from '../../context/AuthContext';

const FormBelanja = ({ stockItems, onClose, onUpdate }) => {
  // Guard clause untuk mencegah error jika prop belum siap
  if (!stockItems) return null;

  const { currentUser } = useAuth();
  const [shoppingData, setShoppingData] = useState({});
  const [tanggal, setTanggal] = useState(new Date().toLocaleDateString('en-CA')); // Format YYYY-MM-DD
  const [keterangan, setKeterangan] = useState('');

  // Fungsi untuk handle perubahan pada input di dalam tabel
  const handleItemChange = (itemId, field, value) => {
    setShoppingData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter hanya item yang diisi jumlah dan total harganya
    const itemsToSubmit = stockItems
      .filter(item => shoppingData[item.id]?.quantity > 0 && shoppingData[item.id]?.totalPrice > 0)
      .map(item => ({
        id: item.id,
        ...shoppingData[item.id]
      }));

    if (itemsToSubmit.length === 0) {
      alert("Silakan isi Jumlah Pembelian dan Total Harga untuk minimal satu item.");
      return;
    }
    
    if (!currentUser) {
        alert("Sesi tidak valid, silakan login kembali.");
        return;
    }

    try {
        const payload = {
            user_id: currentUser.id,
            tanggal_pembelian: tanggal,
            keterangan: keterangan,
            items: itemsToSubmit
        };

        const res = await fetch('/api/pembelian', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Gagal menyimpan data pembelian');
        }
        
        alert('Data belanja berhasil disimpan!');
        if (onUpdate) onUpdate(); // Me-refresh data di halaman Stok
        onClose(); // Menutup modal

    } catch(err) {
        console.error("Gagal mengirim data belanja:", err);
        alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 font-sans" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6 relative text-gray-800 flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold">Form Belanja</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          {/* Form Atas (Tanggal dan Keterangan) */}
          <div className="flex gap-4 mb-4 flex-shrink-0">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600">Tanggal</label>
              <input 
                type="date" 
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-300 rounded-lg" 
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600">Keterangan</label>
              <input 
                type="text" 
                placeholder="Isi Keterangan Disini" 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-300 rounded-lg" 
              />
            </div>
          </div>
          
          {/* Tabel Bahan */}
          <div className="flex-grow overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  {['Nama Bahan', 'Kategori', 'Stok Saat Ini', 'Jumlah Pembelian', 'Total Harga', 'Tanggal Kadaluarsa'].map(h => 
                    <th key={h} className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                           <img 
                            className="h-10 w-10 rounded-full object-cover bg-gray-200" 
                            src={item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}` : '/images/placeholder_ayam.png'} 
                            alt={item.name} 
                          />
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.kategori}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.stock}</td>
                    <td className="px-3 py-2">
                      <input type="number" placeholder="Jumlah" className="w-24 p-2 bg-gray-50 border border-gray-300 rounded-md" onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" placeholder="Rp" className="w-32 p-2 bg-gray-50 border border-gray-300 rounded-md" onChange={(e) => handleItemChange(item.id, 'totalPrice', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input 
                        type="date" 
                        className="w-40 p-2 bg-gray-50 border border-gray-300 rounded-md"
                        onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tombol Konfirmasi */}
          <div className="mt-6 flex justify-end flex-shrink-0">
            <button type="submit" className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
              + Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBelanja;