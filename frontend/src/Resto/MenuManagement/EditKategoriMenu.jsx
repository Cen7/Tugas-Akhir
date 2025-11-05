import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Plus } from 'react-feather'; // Tambahkan ikon Save dan Plus

// Ganti nama komponen agar lebih spesifik
const EditKategoriMenu = ({ show, onClose, onUpdate }) => { 
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Tambahkan state error

    // State untuk fungsi tambah
    const [newKategori, setNewKategori] = useState('');

    // State untuk fungsi rename
    const [editingId, setEditingId] = useState(null); // ID kategori yang sedang diedit
    const [newName, setNewName] = useState('');     // Nama baru saat edit

    // Fungsi untuk mengambil data dari API
    const fetchKategori = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error
            const res = await fetch('/api/kategori-menu'); // Pastikan endpoint benar
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setKategoriList(data || []); // Pastikan data adalah array
        } catch (err) {
            console.error("Gagal mengambil kategori menu:", err);
            setError(err.message);
            setKategoriList([]); // Kosongkan list jika error
        } finally {
            setLoading(false);
        }
    };

    // Ambil data saat modal ditampilkan
    useEffect(() => {
        if (show) {
            fetchKategori();
        }
    }, [show]);

    // Handler untuk menambah kategori baru
    const handleAdd = async (e) => {
        e.preventDefault(); // Cegah form submit default
        if (!newKategori.trim()) return;
        try {
            const response = await fetch('/api/kategori-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_kategori: newKategori }),
            });
            if (!response.ok) throw new Error('Gagal menambah kategori');
            
            setNewKategori(''); // Kosongkan input
            fetchKategori(); // Refresh list
            if (onUpdate) onUpdate(); // Beri tahu parent jika perlu
        } catch (err) {
            alert(`Gagal menambah kategori: ${err.message}`);
        }
    };

    // --- LOGIKA UNTUK RENAME ---
    const handleStartEdit = (kategori) => {
        setEditingId(kategori.kategori_menu_id);
        setNewName(kategori.nama_kategori);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewName('');
    };

    const handleSaveRename = async (id) => {
        if (!newName.trim()) {
            alert("Nama kategori tidak boleh kosong.");
            return;
        }
        try {
            // Panggil API PUT /api/kategori-menu/:id untuk rename
            const response = await fetch(`/api/kategori-menu/${id}`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_kategori: newName }),
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Gagal mengganti nama kategori');
            }
            
            setEditingId(null); // Keluar dari mode edit
            setNewName('');
            fetchKategori(); // Refresh list
            if (onUpdate) onUpdate(); // Beri tahu parent
        } catch (err) {
            alert(`Gagal menyimpan perubahan: ${err.message}`);
        }
    };
    // --- AKHIR LOGIKA RENAME ---

    // Fungsi Hapus Dihilangkan
    // const handleDelete = async (kategoriId) => { ... };

    // Jangan tampilkan modal jika prop `show` false
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Kategori Menu</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button>
                </div>
                
                {loading && <p className="text-center text-gray-500 py-4">Loading kategori...</p>}
                {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}
                
                {!loading && !error && (
                    <>
                        {/* Daftar Kategori Tersedia (dengan fitur Rename) */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-500">Kategori Tersedia</label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                                {kategoriList.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada kategori.</p>}
                                {kategoriList.map(kat => (
                                    <div key={kat.kategori_menu_id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                        {editingId === kat.kategori_menu_id ? (
                                            // Input saat mode edit
                                            <input 
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-grow border border-gray-300 rounded px-2 py-1 mr-2 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            // Tampilan nama normal
                                            <span className="font-medium text-sm">{kat.nama_kategori}</span>
                                        )}
                                        
                                        {editingId === kat.kategori_menu_id ? (
                                            // Tombol Simpan & Batal saat mode edit
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleSaveRename(kat.kategori_menu_id)} className="p-1 text-green-600 hover:text-green-800" title="Simpan">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700" title="Batal">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            // Tombol Edit (pensil)
                                            <button onClick={() => handleStartEdit(kat)} className="p-1 text-blue-600 hover:text-blue-800 flex-shrink-0" title="Ganti Nama">
                                                <Edit2 size={16} />
                                            </button>
                                            // Tombol Hapus sudah dihilangkan
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Tambah Kategori Baru */}
                        <form onSubmit={handleAdd}>
                            <label className="text-sm font-semibold text-gray-500">Tambah Kategori Baru</label>
                            <div className="flex gap-2 mt-1">
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Dessert" 
                                    value={newKategori}
                                    onChange={(e) => setNewKategori(e.target.value)}
                                    className="flex-grow p-2 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-[#D4A15D] outline-none" 
                                />
                                <button type="submit" className="p-2 bg-[#D4A15D] text-white rounded-lg hover:bg-opacity-90 transition flex-shrink-0" title="Tambah">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditKategoriMenu; // Ganti nama export juga