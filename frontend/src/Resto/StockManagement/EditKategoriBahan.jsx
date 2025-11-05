import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Plus } from 'react-feather';

const EditKategoriBahan = ({ show, onClose, onUpdate }) => {
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newKategori, setNewKategori] = useState(''); // Untuk tambah baru
    const [editingId, setEditingId] = useState(null);   // ID yg diedit
    const [newName, setNewName] = useState('');         // Nama baru saat edit

    const fetchKategoriBahan = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/kategori-bahan');
            if (!res.ok) throw new Error('Gagal memuat kategori bahan');
            const data = await res.json();
            setKategoriList(data || []);
        } catch (err) {
            console.error("Gagal mengambil kategori bahan:", err);
            setError(err.message);
            setKategoriList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Hanya fetch jika modal ditampilkan
        if (show) {
            fetchKategoriBahan();
        }
    }, [show]);

    // Handler Tambah
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newKategori.trim()) return;
        try {
            const response = await fetch('/api/kategori-bahan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_kategori: newKategori }),
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Gagal menambah kategori');
            }
            setNewKategori('');
            fetchKategoriBahan();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menambah kategori: ${err.message}`);
        }
    };

    // Handler Rename
    const handleStartEdit = (kategori) => {
        setEditingId(kategori.kategori_bahan_id);
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
            const response = await fetch(`/api/kategori-bahan/${id}`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_kategori: newName }),
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Gagal mengganti nama kategori');
            }
            setEditingId(null);
            setNewName('');
            fetchKategoriBahan();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menyimpan perubahan: ${err.message}`);
        }
    };

    // Handler Hapus (Dihilangkan)
    // const handleDelete = async (kategoriId) => { ... };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Kategori Bahan</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button>
                </div>

                {loading && <p className="text-center text-gray-500 py-4">Loading kategori...</p>}
                {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}

                {!loading && !error && (
                    <>
                        {/* Daftar Kategori Tersedia */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-500">Kategori Tersedia</label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                                {kategoriList.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada kategori.</p>}
                                {kategoriList.map(kat => (
                                    <div key={kat.kategori_bahan_id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                        {editingId === kat.kategori_bahan_id ? (
                                            <input 
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-grow border border-gray-300 rounded px-2 py-1 mr-2 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-sm">{kat.nama_kategori}</span>
                                        )}
                                        
                                        {editingId === kat.kategori_bahan_id ? (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleSaveRename(kat.kategori_bahan_id)} className="p-1 text-green-600 hover:text-green-800" title="Simpan">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700" title="Batal">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleStartEdit(kat)} className="p-1 text-blue-600 hover:text-blue-800 flex-shrink-0" title="Ganti Nama">
                                                <Edit2 size={16} />
                                            </button>
                                            // Tombol Hapus Dihilangkan
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
                                    placeholder="Contoh: Daging & Unggas" 
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

export default EditKategoriBahan;