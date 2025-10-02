import React, { useState, useEffect } from 'react';
import { X, Edit2, UploadCloud } from 'react-feather';

// Komponen InputField dipindahkan ke luar dan di-memoize
const InputField = React.memo(({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-500">{label}</label>
    <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
      <input {...props} className="flex-grow bg-transparent outline-none w-full"/>
      <Edit2 size={16} className="text-gray-400 ml-2"/>
    </div>
  </div>
));

InputField.displayName = 'InputField';

const EditBahan = ({ item, onClose, onUpdate }) => {
  const [kategoriBahanList, setKategoriBahanList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    kategori_bahan_id: '',
    unit: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        kategori_bahan_id: item.kategori_bahan_id || '',
        unit: item.unit || ''
      });
      setImagePreview(item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}` : null);
      setImageFile(null);
    }
  }, [item]);

  useEffect(() => {
    const fetchKategoriBahan = async () => {
      try {
        const res = await fetch('/api/kategori-bahan');
        const data = await res.json();
        setKategoriBahanList(data);
      } catch (err) {
        console.error("Gagal fetch kategori bahan:", err);
      }
    };
    fetchKategoriBahan();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    dataToSend.append('nama_bahan', formData.name);
    dataToSend.append('kategori_bahan_id', formData.kategori_bahan_id);
    dataToSend.append('satuan', formData.unit);
    if (imageFile) {
      dataToSend.append('gambar', imageFile);
    }
    
    try {
      const res = await fetch(`/api/bahan-baku/${item.id}`, {
        method: 'PUT',
        body: dataToSend,
      });
      if (!res.ok) throw new Error("Gagal memperbarui bahan");
      alert("Bahan baku berhasil diperbarui!");
      if (onUpdate) onUpdate();
      onClose();
    } catch(err) {
      alert(err.message);
    }
  };

  // Jangan render jika tidak ada item
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Bahan Baku</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-300">
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
          <InputField 
            label="Nama Bahan" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange}
            required
          />
          <div>
            <label className="text-sm font-semibold text-gray-500">Kategori</label>
            <select 
              name="kategori_bahan_id" 
              value={formData.kategori_bahan_id} 
              onChange={handleInputChange} 
              className="w-full mt-1 p-2 bg-gray-100 border rounded-lg"
              required
            >
              <option value="">Pilih Kategori</option>
              {kategoriBahanList.map(kat => (
                <option key={kat.kategori_bahan_id} value={kat.kategori_bahan_id}>
                  {kat.nama_kategori}
                </option>
              ))}
            </select>
          </div>
          <InputField 
            label="Satuan" 
            name="unit" 
            value={formData.unit} 
            onChange={handleInputChange}
            required
          />
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90"
            >
              Perbarui Bahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBahan;