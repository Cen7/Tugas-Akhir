import React, { useState, useEffect } from 'react';
import { X, Edit2, UploadCloud } from 'react-feather';

// Komponen InputField Helper (opsional)
const InputField = React.memo(({ label, prefix, readOnly, ...props }) => (
    <div>
        <label className="text-sm font-semibold text-gray-500">{label}</label>
        <div className={`flex items-center mt-1 p-2 border rounded-lg ${readOnly ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 focus-within:ring-2 focus-within:ring-[#D4A15D]'}`}>
            {prefix && <span className="text-gray-500 pl-1 pr-2">{prefix}</span>}
            <input
                {...props}
                readOnly={readOnly}
                className={`flex-grow bg-transparent outline-none w-full ${readOnly ? 'text-gray-600' : ''}`}
            />
            {!readOnly && <Edit2 size={16} className="text-gray-400 ml-2 flex-shrink-0" />}
        </div>
         {readOnly && <p className="text-xs text-gray-500 mt-1">Nama bahan tidak dapat diubah.</p>}
    </div>
));
InputField.displayName = 'InputField';

const EditBahan = ({ item, onClose, onUpdate }) => {
    const [kategoriBahanList, setKategoriBahanList] = useState([]);
    // --- State formData TIDAK lagi menyimpan 'name' ---
    const [formData, setFormData] = useState({
        kategori_bahan_id: '',
        unit: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingKategori, setLoadingKategori] = useState(true); // State loading untuk kategori

    // Update form data (tanpa 'name') dan image preview saat 'item' berubah
    useEffect(() => {
        if (item) {
            setFormData({
                kategori_bahan_id: item.kategori_bahan_id || '',
                unit: item.unit || ''
            });
            // Update image preview (tambahkan cache busting)
            setImagePreview(item.has_gambar ? `http://localhost:3000/api/bahan-baku/gambar/${item.id}?t=${new Date().getTime()}` : null);
            setImageFile(null); // Reset file baru
        }
    }, [item]);

    // Fetch daftar kategori bahan hanya sekali saat komponen mount
    useEffect(() => {
        const fetchKategoriBahan = async () => {
            setLoadingKategori(true);
            try {
                const res = await fetch('/api/kategori-bahan');
                if (!res.ok) throw new Error('Gagal memuat kategori bahan');
                const data = await res.json();
                setKategoriBahanList(data || []);
            } catch (err) {
                console.error("Gagal fetch kategori bahan:", err);
                setKategoriBahanList([]); // Set array kosong jika error
            } finally {
                 setLoadingKategori(false);
            }
        };
        fetchKategoriBahan();
    }, []); // Dependency kosong agar hanya jalan sekali

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
        if (!item || !item.id) return; // Guard clause

        const dataToSend = new FormData();
        // --- NAMA BAHAN TIDAK DIKIRIM ---
        // dataToSend.append('nama_bahan', item.name); // Jangan kirim nama
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
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal memperbarui bahan");
            }
            alert("Bahan baku berhasil diperbarui!");
            if (onUpdate) onUpdate();
            onClose();
        } catch(err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Jangan render jika tidak ada item prop
    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition z-10">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-5">Edit Bahan Baku</h2>
                
                {/* Upload Gambar */}
                <label className="block w-full h-48 bg-gray-100 rounded-lg mb-6 flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-300 relative overflow-hidden">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <UploadCloud size={40} className="mx-auto" />
                            <p>Klik untuk upload gambar</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama Bahan (Read Only) */}
                    <InputField 
                        label="Nama Bahan" 
                        name="name" 
                        value={item.name} // Ambil langsung dari prop 'item'
                        readOnly={true} 
                    />

                    {/* Dropdown Kategori */}
                    <div>
                        <label className="text-sm font-semibold text-gray-500">Kategori</label>
                        {loadingKategori ? <p className="text-sm text-gray-500 mt-1">Memuat kategori...</p> : (
                            <select 
                                name="kategori_bahan_id" 
                                value={formData.kategori_bahan_id || ''} 
                                onChange={handleInputChange} 
                                className="w-full mt-1 p-2 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-[#D4A15D] outline-none"
                                required
                            >
                                <option value="" disabled>Pilih Kategori</option>
                                {kategoriBahanList.map(kat => (
                                    <option key={kat.kategori_bahan_id} value={kat.kategori_bahan_id}>
                                        {kat.nama_kategori}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Input Satuan */}
                    <InputField 
                        label="Satuan" 
                        name="unit" 
                        value={formData.unit} 
                        onChange={handleInputChange}
                        required
                    />

                    {/* Tombol Submit */}
                    <div className="flex justify-end pt-4 border-t mt-6">
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition"
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