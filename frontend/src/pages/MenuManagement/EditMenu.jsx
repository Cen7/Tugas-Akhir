import React, { useState, useEffect } from 'react';
import { X, Edit2, UploadCloud } from 'react-feather';
import AddIngredient from './AddIngredient';

const InputField = ({ label, prefix, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500">{label}</label>
    <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
      {prefix && <span className="text-gray-500 pl-1 pr-2">{prefix}</span>}
      <input {...props} className="flex-grow bg-transparent outline-none w-full" />
      <Edit2 size={16} className="text-gray-400 ml-2" />
    </div>
  </div>
);

const EditMenu = ({ item, bahanBakuList, kategoriList = [], onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    ...item,
    harga: parseInt(item.harga) || 0,
    deskripsi: item.deskripsi || '',
    kategori_menu_id: item.kategori_menu_id || '' // Menggunakan string kosong jika null
  });

  const [resep, setResep] = useState([]);
  const [loadingResep, setLoadingResep] = useState(true);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(item.has_gambar ? `http://localhost:3000/api/menu/gambar/${item.menu_id}` : null);
  const [newImageFile, setNewImageFile] = useState(null);


  useEffect(() => {
    const fetchResep = async () => {
      if (!item?.menu_id) return;
      try {
        setLoadingResep(true);
        const res = await fetch(`/api/menu/resep/${item.menu_id}`);
        if (!res.ok) throw new Error('Resep tidak ditemukan');
        const data = await res.json();
        setResep(data);
      } catch (err) {
        console.error("Gagal mengambil resep:", err);
      } finally {
        setLoadingResep(false);
      }
    };
    fetchResep();
  }, [item]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeIngredient = (bahanIdToRemove) => {
    setResep(resep.filter(bahan => bahan.bahan_id !== bahanIdToRemove));
  };

  const addIngredient = (newIngredient) => {
    setResep(prevResep => [...prevResep, newIngredient]);
  };

  const handleUpdate = async () => {
    try {
      const menuUpdateData = new FormData();
      menuUpdateData.append('nama_menu', formData.nama_menu);
      menuUpdateData.append('harga', formData.harga);
      menuUpdateData.append('kategori_menu_id', formData.kategori_menu_id); // DIUBAH
      menuUpdateData.append('deskripsi', formData.deskripsi);
      if (newImageFile) {
        menuUpdateData.append('gambar', newImageFile);
      }

      await fetch(`/api/menu/${item.menu_id}`, {
        method: 'PUT',
        body: menuUpdateData,
      });

      await fetch(`/api/menu/resep/${item.menu_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resep }),
      });

      onClose();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Gagal update:", err);
      alert("Gagal memperbarui menu.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40" onClick={onClose}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition z-10">
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

          <h2 className="text-2xl font-bold mb-4">Edit Menu</h2>
          <div className="space-y-4">
            <InputField label="Nama" name="nama_menu" value={formData.nama_menu} onChange={handleInputChange} />

            {/* --- DIUBAH TOTAL: Dropdown Kategori sekarang dinamis --- */}
            <div>
              <label className="text-sm font-semibold text-gray-500">Kategori</label>
              <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
                <select
                  name="kategori_menu_id"
                  value={formData.kategori_menu_id}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent outline-none w-full"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {kategoriList.map(kat => (
                    <option key={kat.kategori_menu_id} value={kat.kategori_menu_id}>
                      {kat.nama_kategori}
                    </option>
                  ))}
                </select>
                <Edit2 size={16} className="text-gray-400 ml-2" />
              </div>
            </div>
            {/* -------------------------------------------------------- */}

            <InputField label="Harga" name="harga" type="number" prefix="Rp" value={formData.harga} onChange={handleInputChange} />

            <div>
              <label className="text-sm font-semibold text-gray-500">Keterangan</label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleInputChange}
                rows="3"
                className="w-full mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D] outline-none"
                placeholder="Deskripsi menu..."
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Bahan</label>
              <div className="mt-1 space-y-2">
                {loadingResep ? <p>Loading resep...</p> : resep.map(bahan => (
                  <div key={bahan.bahan_id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                    <span>{bahan.nama_bahan} ({bahan.jumlah_bahan} {bahan.satuan})</span>
                    <button onClick={() => removeIngredient(bahan.bahan_id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setIsAddIngredientOpen(true)} className="w-full text-center py-2 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50">
              + Tambahkan Bahan
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleUpdate} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
              + Perbarui Menu
            </button>
          </div>
        </div>
      </div>

      {isAddIngredientOpen && (
        <AddIngredient
          bahanBakuList={bahanBakuList}
          onAdd={addIngredient}
          onClose={() => setIsAddIngredientOpen(false)}
        />
      )}
    </>
  );
};

export default EditMenu;