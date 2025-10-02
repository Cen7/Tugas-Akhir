import React, { useState } from 'react';
import { X, UploadCloud } from 'react-feather';
import AddIngredient from './AddIngredient';

const InputField = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-semibold text-gray-500">{label}</label>
        <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
            <input {...props} className="flex-grow bg-transparent outline-none w-full"/>
        </div>
    </div>
);

// Menerima prop 'kategoriList'
const AddMenu = ({ bahanBakuList, kategoriList = [], onClose, onAdd }) => {
  const [formData, setFormData] = useState({ 
    nama_menu: '', 
    kategori_menu_id: kategoriList[0]?.kategori_menu_id || '', 
    harga: '', 
    deskripsi: '' 
  });
  const [resep, setResep] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);

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

  const handleAddMenu = async () => {
    if (!newImageFile || !formData.nama_menu || !formData.harga || !formData.kategori_menu_id) {
        alert('Gambar, Nama Menu, Kategori, dan Harga wajib diisi.');
        return;
    }
    try {
      const dataToSend = new FormData();
      dataToSend.append('nama_menu', formData.nama_menu);
      dataToSend.append('harga', formData.harga);
      dataToSend.append('kategori_menu_id', formData.kategori_menu_id); // DIUBAH
      dataToSend.append('deskripsi', formData.deskripsi);
      dataToSend.append('gambar', newImageFile);
      dataToSend.append('resep', JSON.stringify(resep));

      const res = await fetch('/api/menu', {
        method: 'POST',
        body: dataToSend,
      });

      if (!res.ok) throw new Error('Gagal menambahkan menu');

      onClose();
      if (onAdd) onAdd(); 
    } catch(err) {
      console.error("Gagal tambah menu:", err);
      alert("Gagal menambahkan menu.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40" onClick={onClose}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition z-10"><X size={24} /></button>
          <h2 className="text-2xl font-bold mb-4">Tambahkan Menu</h2>
          <label className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-400">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center text-gray-500">
                <UploadCloud size={40} className="mx-auto"/><p>Klik atau drag file ke area ini</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <div className="space-y-4">
            <InputField label="Nama" name="nama_menu" value={formData.nama_menu} onChange={handleInputChange} />
            <div>
              <label className="text-sm font-semibold text-gray-500">Kategori</label>
              <select name="kategori_menu_id" value={formData.kategori_menu_id} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-100 border rounded-lg outline-none">
                <option value="" disabled>Pilih Kategori</option>
                {kategoriList.map(kat => (
                  <option key={kat.kategori_menu_id} value={kat.kategori_menu_id}>{kat.nama_kategori}</option>
                ))}
              </select>
            </div>
            <InputField label="Harga" name="harga" type="number" value={formData.harga} onChange={handleInputChange} />
            <div>
              <label className="text-sm font-semibold text-gray-500">Keterangan</label>
              <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} rows="3" className="w-full mt-1 p-2 bg-gray-100 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-semibold">Bahan</label>
              <div className="mt-1 space-y-2">
                {resep.map(bahan => (
                  <div key={bahan.bahan_id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                    <span>{bahan.nama_bahan} ({bahan.jumlah_bahan} {bahan.satuan})</span>
                    <button onClick={() => removeIngredient(bahan.bahan_id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setIsAddIngredientOpen(true)} className="w-full text-center py-2 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50">
              + Tambahkan Bahan
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleAddMenu} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
              + Tambahkan Menu
            </button>
          </div>
        </div>
      </div>
      {isAddIngredientOpen && <AddIngredient bahanBakuList={bahanBakuList} onAdd={addIngredient} onClose={() => setIsAddIngredientOpen(false)} />}
    </>
  );
};

export default AddMenu;