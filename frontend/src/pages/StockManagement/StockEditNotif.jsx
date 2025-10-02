import React, { useState } from 'react';
import { X, Edit2 } from 'react-feather';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500">{label}</label>
    <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
      <input {...props} className="flex-grow bg-transparent outline-none w-full" />
      <Edit2 size={16} className="text-gray-400 ml-2" />
    </div>
  </div>
);

// Nama komponen disesuaikan
const StockEdit = ({ item, onClose, onUpdate }) => {
  if (!item) return null;

  // 1. Gunakan state untuk semua field yang bisa diubah
  const [formData, setFormData] = useState({
    stok_minimum: item.warningAt || 0,
    peringatan_kadaluarsa_hari: item.peringatan_kadaluarsa_hari || 7,
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/bahan-baku/${item.id}/notifikasi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // 2. Kirim kedua nilai ke backend
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Gagal memperbarui notifikasi");

      alert("Notifikasi berhasil diperbarui!");
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 font-sans" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative text-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition">
          <X size={24} />
        </button>

        <img
          src={item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}` : '/images/placeholder_ayam.png'}
          alt={item.name}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />

        <h2 className="text-2xl font-bold mb-6">Edit Notifikasi</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field yang tidak bisa diubah (read-only) */}
          <div>
            <label className="text-sm text-gray-500">Nama</label>
            <input type="text" readOnly value={item.name} className="w-full mt-1 p-2 bg-gray-200 border rounded-lg cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Kategori</label>
            <input type="text" readOnly value={item.kategori} className="w-full mt-1 p-2 bg-gray-200 border rounded-lg cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Satuan</label>
            <input type="text" readOnly value={item.unit} className="w-full mt-1 p-2 bg-gray-200 border rounded-lg cursor-not-allowed" />
          </div>

          {/* 3. Field yang bisa diubah sekarang menjadi komponen terkontrol */}
          <InputField
            label="Peringatan Stok"
            name="stok_minimum"
            value={formData.stok_minimum}
            onChange={handleInputChange}
            type="number"
          />
          <InputField
            label="Peringatan Kadaluwarsa (Hari)"
            name="peringatan_kadaluarsa_hari"
            value={formData.peringatan_kadaluarsa_hari}
            onChange={handleInputChange}
            type="number"
          />

          <div className="pt-4 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
              + Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockEdit;