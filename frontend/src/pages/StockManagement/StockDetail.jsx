import React, { useState, useEffect } from 'react';
import { X, UploadCloud } from 'react-feather';

const StockDetail = ({ item, onClose, onUpdate }) => {
  const [batches, setBatches] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);

  useEffect(() => {
    if (!item) return;

    // DIUBAH: Set preview gambar dengan cache busting setiap kali modal dibuka
    setImagePreview(item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}?t=${new Date().getTime()}` : null)
    setNewImageFile(null);

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const [batchesRes, damagesRes] = await Promise.all([
          fetch(`/api/stok/batches/${item.id}`),
          fetch(`/api/stok/damages/${item.id}`)
        ]);
        if (!batchesRes.ok || !damagesRes.ok) throw new Error('Gagal memuat detail stok');
        const batchesData = await batchesRes.json();
        const damagesData = await damagesRes.json();
        setBatches(batchesData);
        setDamages(damagesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [item]);

  if (!item) return null;

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpdate = async () => {
    if (!newImageFile) {
      alert("Silakan pilih file gambar terlebih dahulu.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('gambar', newImageFile);
      const res = await fetch(`/api/bahan-baku/${item.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) throw new Error("Gagal mengupdate gambar");
      alert("Gambar berhasil diperbarui!");
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 font-sans" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative text-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition">
          <X size={24} />
        </button>

        <label className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-400">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <UploadCloud size={40} className="mx-auto" />
              <p>Klik untuk upload gambar</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        {newImageFile && (
          <div className="flex justify-end mb-4">
            <button onClick={handleImageUpdate} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              Update Gambar
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold">{item.name}</h2>
        <p className="text-sm text-gray-500 mb-6">Notification Alert : {item.warningAt} {item.unit}</p>

        {loading && <p>Loading detail...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <>
            {/* Tabel Stok Masuk */}
            <div className="mb-6">
              <table className="min-w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Tanggal Masuk</th>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Kadaluarsa</th>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Total</th>
                    {/* TAMBAHKAN HEADER BARU */}
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => (
                    <tr key={batch.stok_id}>
                      <td className="py-2 text-gray-700">{formatDate(batch.tanggalMasuk)}</td>
                      <td className="py-2 text-gray-700">{formatDate(batch.tanggal_kadaluarsa)}</td>
                      <td className="py-2 text-gray-700">{batch.total}</td>
                      {/* TAMBAHKAN DATA BARU */}
                      <td className="py-2 text-gray-700">{batch.user_nama || 'Sistem'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabel Stok Rusak */}
            <div>
              <table className="min-w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Tanggal Rusak</th>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Keterangan</th>
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Total</th>
                    {/* TAMBAHKAN HEADER BARU */}
                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {damages.map(damage => (
                    <tr key={damage.rusak_id}>
                      <td className="py-2 text-gray-700">{formatDate(damage.tanggalRusak)}</td>
                      <td className="py-2 text-gray-700">{damage.keterangan || '-'}</td>
                      <td className="py-2 text-gray-700">{damage.total}</td>
                      {/* TAMBAHKAN DATA BARU */}
                      <td className="py-2 text-gray-700">{damage.user_nama || 'Sistem'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockDetail;