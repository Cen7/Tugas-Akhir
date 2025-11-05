import React, { useState, useEffect } from 'react';
import { X, Edit2, UploadCloud, Plus } from 'react-feather';
import AddIngredient from './AddIngredient'; // Pastikan path ini benar

// Komponen InputField Helper (opsional, bisa diganti input biasa)
const InputField = ({ label, prefix, readOnly, ...props }) => (
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
        {readOnly && <p className="text-xs text-gray-500 mt-1">Nama menu tidak dapat diubah.</p>}
    </div>
);

// Komponen Utama EditMenu
const EditMenu = ({ item, bahanBakuList, kategoriList = [], onClose, onUpdate }) => {
    // State untuk form, pisahkan nama menu karena tidak diedit
    const [formData, setFormData] = useState({
        harga: 0,
        deskripsi: '',
        kategori_menu_id: '',
    });
    // State terpisah untuk resep, gambar, dan loading
    const [resep, setResep] = useState([]);
    const [loadingResep, setLoadingResep] = useState(true);
    const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);

    // useEffect untuk mengisi state form saat item berubah
    useEffect(() => {
        if (item) {
            setFormData({
                harga: parseFloat(item.harga) || 0,
                deskripsi: item.deskripsi || '',
                kategori_menu_id: item.kategori_menu_id || ''
            });
            setImagePreview(item.has_gambar ? `http://localhost:3000/api/menu/gambar/${item.menu_id}?t=${new Date().getTime()}` : null);
            setNewImageFile(null); // Reset file gambar baru setiap membuka item baru

            // Fetch resep
            const fetchResep = async () => {
                if (!item.menu_id) return;
                try {
                    setLoadingResep(true);
                    const res = await fetch(`/api/menu/resep/${item.menu_id}`);
                    if (!res.ok) throw new Error('Resep tidak ditemukan');
                    const data = await res.json();
                    setResep(data || []);
                } catch (err) {
                    console.error("Gagal mengambil resep:", err);
                    setResep([]); // Set ke array kosong jika gagal
                } finally {
                    setLoadingResep(false);
                }
            };
            fetchResep();
        }
    }, [item]); // Jalankan ulang jika item berubah

    // Handler untuk input biasa
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler untuk perubahan gambar
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Handler untuk resep
    const removeIngredient = (bahanIdToRemove) => {
        setResep(resep.filter(bahan => bahan.bahan_id !== bahanIdToRemove));
    };

    const addIngredient = (newIngredient) => {
        // Cek duplikasi sebelum menambah
        if (!resep.some(bahan => bahan.bahan_id === newIngredient.bahan_id)) {
             setResep(prevResep => [...prevResep, newIngredient]);
        } else {
            alert("Bahan ini sudah ada dalam resep.");
        }
    };

    // Handler saat tombol "Perbarui Menu" diklik
    const handleUpdate = async () => {
        if (!item || !item.menu_id) return;

        try {
            // 1. Update data menu (tanpa nama)
            const menuUpdateData = new FormData();
            // --- NAMA MENU TIDAK DIKIRIM ---
            // menuUpdateData.append('nama_menu', item.nama_menu); // Jangan kirim nama
            menuUpdateData.append('harga', formData.harga);
            menuUpdateData.append('kategori_menu_id', formData.kategori_menu_id);
            menuUpdateData.append('deskripsi', formData.deskripsi);
            if (newImageFile) {
                menuUpdateData.append('gambar', newImageFile);
            }

            const menuResponse = await fetch(`/api/menu/${item.menu_id}`, {
                method: 'PUT',
                body: menuUpdateData, // Gunakan FormData karena ada potensi file
            });
            if (!menuResponse.ok) {
                 const errData = await menuResponse.json();
                 throw new Error(errData.message || 'Gagal memperbarui detail menu');
            }

            // 2. Update data resep
            const resepResponse = await fetch(`/api/menu/resep/${item.menu_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resep: resep.map(r => ({ bahan_id: r.bahan_id, jumlah_bahan: r.jumlah_bahan, satuan: r.satuan })) }), // Kirim hanya data yg diperlukan
            });
             if (!resepResponse.ok) {
                 const errData = await resepResponse.json();
                 throw new Error(errData.message || 'Gagal memperbarui resep');
            }

            alert('Menu berhasil diperbarui!');
            onClose();
            if (onUpdate) onUpdate(); // Panggil fungsi refresh dari parent

        } catch (err) {
            console.error("Gagal update:", err);
            alert(`Gagal memperbarui menu: ${err.message}`);
        }
    };

    // Jangan render jika tidak ada item
    if (!item) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4" onClick={onClose}>
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Tombol Close */}
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-200 transition z-10">
                        <X size={24} />
                    </button>

                    {/* Upload Gambar */}
                    <label className="block w-full h-48 bg-gray-100 rounded-lg mb-6 flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-gray-400 relative overflow-hidden">
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

                    <h2 className="text-2xl font-bold mb-5">Edit Menu</h2>
                    <div className="space-y-4">
                        {/* Nama Menu (Read Only) */}
                        <InputField label="Nama Menu" name="nama_menu" value={item.nama_menu} readOnly={true} />

                        {/* Dropdown Kategori */}
                        <div>
                            <label htmlFor="kategori_menu_id" className="text-sm font-semibold text-gray-500">Kategori</label>
                            <div className="flex items-center mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D]">
                                <select
                                    id="kategori_menu_id"
                                    name="kategori_menu_id"
                                    value={formData.kategori_menu_id || ''} // Handle null value
                                    onChange={handleInputChange}
                                    className="flex-grow bg-transparent outline-none w-full"
                                    required // Pastikan kategori dipilih
                                >
                                    <option value="" disabled>Pilih Kategori...</option>
                                    {kategoriList && kategoriList.map(kat => (
                                        <option key={kat.kategori_menu_id} value={kat.kategori_menu_id}>
                                            {kat.nama_kategori}
                                        </option>
                                    ))}
                                </select>
                                <Edit2 size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Input Harga */}
                        <InputField label="Harga" name="harga" type="number" prefix="Rp" value={formData.harga} onChange={handleInputChange} required />

                        {/* Textarea Deskripsi */}
                        <div>
                            <label htmlFor="deskripsi" className="text-sm font-semibold text-gray-500">Deskripsi</label>
                            <textarea
                                id="deskripsi"
                                name="deskripsi"
                                value={formData.deskripsi}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full mt-1 p-2 bg-gray-100 border rounded-lg focus-within:ring-2 focus-within:ring-[#D4A15D] outline-none"
                                placeholder="Deskripsi singkat menu..."
                            />
                        </div>

                        {/* Bagian Resep */}
                        <div>
                            <label className="text-sm font-semibold text-gray-500">Bahan Resep</label>
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                                {loadingResep ? <p className="text-gray-500 text-sm">Memuat resep...</p> : 
                                 resep.length === 0 ? <p className="text-gray-500 text-sm text-center py-2">Belum ada bahan ditambahkan.</p> :
                                 resep.map(bahan => (
                                    <div key={bahan.bahan_id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                        <span className="text-sm">{bahan.nama_bahan} ({bahan.jumlah_bahan} {bahan.satuan})</span>
                                        <button onClick={() => removeIngredient(bahan.bahan_id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tombol Tambah Bahan */}
                        <button onClick={() => setIsAddIngredientOpen(true)} className="w-full text-center py-2 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50 transition">
                            <Plus size={18} className="inline mr-1" /> Tambahkan Bahan
                        </button>
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="flex justify-end mt-6 pt-4 border-t">
                        <button onClick={handleUpdate} className="px-6 py-2 bg-[#D4A15D] text-white font-semibold rounded-lg hover:bg-opacity-90 transition">
                            Perbarui Menu
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Bahan (jika terbuka) */}
            {isAddIngredientOpen && (
                <AddIngredient
                    bahanBakuList={bahanBakuList} // Pastikan prop ini dikirim dari parent
                    onAdd={addIngredient}
                    onClose={() => setIsAddIngredientOpen(false)}
                />
            )}
        </>
    );
};

export default EditMenu;