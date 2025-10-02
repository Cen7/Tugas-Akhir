import React, { useState, useEffect } from 'react';
import { X, UploadCloud } from 'react-feather';

const InputField = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-semibold text-gray-500">{label}</label>
        <input {...props} className="w-full mt-1 p-2 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A15D]" />
    </div>
);

const AddBahan = ({ show, onClose, onAdd }) => {
    // SEMUA HOOKS HARUS DI TOP LEVEL
    const [kategoriBahanList, setKategoriBahanList] = useState([]);
    const [formData, setFormData] = useState({
        nama_bahan: '',
        kategori_bahan_id: '',
        satuan: '',
        stok_minimum: '0',
        peringatan_kadaluarsa_hari: '7'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // useEffect HARUS sebelum early return
    useEffect(() => {
        const fetchKategoriBahan = async () => {
            try {
                const res = await fetch('/api/kategori-bahan');
                const data = await res.json();
                setKategoriBahanList(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, kategori_bahan_id: data[0].kategori_bahan_id }));
                }
            } catch (err) {
                console.error("Gagal fetch kategori bahan:", err);
            }
        };
        fetchKategoriBahan();
    }, []);

    // Early return SETELAH semua hooks
    if (!show) {
        return null;
    }

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
        if (!imageFile || !formData.nama_bahan || !formData.kategori_bahan_id) {
            alert('Gambar, Nama, dan Kategori wajib diisi.');
            return;
        }

        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));
        dataToSend.append('gambar', imageFile);

        try {
            const res = await fetch('/api/bahan-baku', {
                method: 'POST',
                body: dataToSend,
            });
            if (!res.ok) throw new Error('Gagal menambahkan bahan baru');

            alert('Bahan baku baru berhasil ditambahkan!');
            if (onAdd) onAdd();
            onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition z-10"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-4">Tambahkan Bahan</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-300">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <UploadCloud size={40} className="mx-auto" /><p>Klik untuk upload gambar</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>

                    <InputField label="Nama Bahan" name="nama_bahan" value={formData.nama_bahan} onChange={handleInputChange} />

                    <div>
                        <label className="text-sm font-semibold text-gray-500">Kategori</label>
                        <select name="kategori_bahan_id" value={formData.kategori_bahan_id} onChange={handleInputChange} className="w-full mt-1 p-2 bg-gray-100 border rounded-lg">
                            {kategoriBahanList.map(kat => (
                                <option key={kat.kategori_bahan_id} value={kat.kategori_bahan_id}>{kat.nama_kategori}</option>
                            ))}
                        </select>
                    </div>

                    <InputField label="Satuan" name="satuan" value={formData.satuan} onChange={handleInputChange} />
                    <InputField label="Peringatan Stok" name="stok_minimum" type="number" value={formData.stok_minimum} onChange={handleInputChange} />
                    <InputField label="Peringatan Kadaluwarsa (Hari)" name="peringatan_kadaluarsa_hari" type="number" value={formData.peringatan_kadaluarsa_hari} onChange={handleInputChange} />

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90">
                            + Tambahkan Bahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBahan;