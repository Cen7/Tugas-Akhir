import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';

const AddIngredient = ({ bahanBakuList, onAdd, onClose }) => {
  const [selectedBahanId, setSelectedBahanId] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('');

  useEffect(() => {
    if (selectedBahanId) {
      const selectedBahan = bahanBakuList.find(b => b.id == selectedBahanId); // Menggunakan 'id' sesuai data dari API stok
      setSatuan(selectedBahan?.unit || ''); // Menggunakan 'unit' sesuai data dari API stok
    } else {
      setSatuan('');
    }
  }, [selectedBahanId, bahanBakuList]);

  const handleConfirm = () => {
    if (!selectedBahanId || !jumlah) {
      alert('Nama bahan dan jumlah harus diisi');
      return;
    }
    const selectedBahan = bahanBakuList.find(b => b.id == selectedBahanId);
    onAdd({
      bahan_id: selectedBahan.id,
      nama_bahan: selectedBahan.name,
      jumlah_bahan: jumlah,
      satuan: satuan,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Tambahkan Bahan</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Nama Bahan</label>
            <select
              value={selectedBahanId}
              onChange={(e) => setSelectedBahanId(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-100 border rounded-lg"
            >
              <option value="" disabled>Pilih bahan...</option>
              {bahanBakuList.map(bahan => (
                // DIUBAH: Menambahkan prop 'key' yang unik
                <option key={bahan.id} value={bahan.id}>
                  {bahan.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Satuan</label>
            <input type="text" value={satuan} readOnly className="w-full mt-1 p-2 bg-gray-200 border rounded-lg cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm font-semibold">Jumlah</label>
            <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className="w-full mt-1 p-2 bg-gray-100 border rounded-lg" />
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleConfirm} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
              + Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddIngredient;