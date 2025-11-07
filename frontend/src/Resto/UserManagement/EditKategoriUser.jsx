import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Plus } from 'react-feather';

const EditKategoriUser = ({ onClose, onUpdate }) => {
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newKategori, setNewKategori] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');

    const fetchKategori = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/kategori-user', { credentials: 'include' });
            if (!res.ok) throw new Error('Gagal memuat kategori pengguna');
            const data = await res.json();
            setKategoriList(data || []);
        } catch (err) {
            console.error('Gagal mengambil kategori user:', err);
            setError(err.message);
            setKategoriList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKategori();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newKategori.trim()) return;
        try {
            const response = await fetch('/api/kategori-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nama_kategori: newKategori, aktif: true }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal menambah kategori');
            }
            setNewKategori('');
            fetchKategori();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menambah kategori: ${err.message}`);
        }
    };

    const handleStartEdit = (kategori) => {
        setEditingId(kategori.kategori_user_id);
        setNewName(kategori.nama_kategori);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewName('');
    };

    const handleSaveRename = async (id) => {
        if (!newName.trim()) {
            alert('Nama kategori tidak boleh kosong.');
            return;
        }
        try {
            const response = await fetch(`/api/kategori-user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nama_kategori: newName }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengganti nama kategori');
            }
            setEditingId(null);
            setNewName('');
            fetchKategori();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menyimpan perubahan: ${err.message}`);
        }
    };

    const handleToggleActive = async (kategori) => {
        try {
            const response = await fetch(`/api/kategori-user/${kategori.kategori_user_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ aktif: !kategori.aktif }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengubah status kategori');
            }
            fetchKategori();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal mengubah status: ${err.message}`);
        }
    };

    if (!loading && kategoriList.length === 0 && error === null) {
        // show empty state
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Kategori Pengguna</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button>
                </div>

                {loading && <p className="text-center text-gray-500 py-4">Loading kategori...</p>}
                {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}

                {!loading && !error && (
                    <>
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-500">Kategori Tersedia</label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                                {kategoriList.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada kategori.</p>}
                                {kategoriList.map(kat => (
                                    <div key={kat.kategori_user_id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                        {editingId === kat.kategori_user_id ? (
                                            <input 
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-grow border border-gray-300 rounded px-2 py-1 mr-2 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-sm">{kat.nama_kategori}</span>
                                                <span className={`text-xs py-0.5 px-2 rounded ${kat.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {kat.aktif ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={kat.aktif} onChange={() => handleToggleActive(kat)} />
                                            </label>

                                            {editingId === kat.kategori_user_id ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveRename(kat.kategori_user_id)} className="p-1 text-green-600 hover:text-green-800" title="Simpan">
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
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAdd}>
                            <label className="text-sm font-semibold text-gray-500">Tambah Kategori Baru</label>
                            <div className="flex gap-2 mt-1">
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Admin Internal" 
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

export default EditKategoriUser;
