import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';

const EditKategoriBahan = ({ show, onClose, onUpdate }) => {
    // SEMUA HOOKS HARUS DI TOP LEVEL
    const [kategoriList, setKategoriList] = useState([]);
    const [newKategori, setNewKategori] = useState('');
    const [loading, setLoading] = useState(true);

    // useEffect HARUS sebelum early return
    const fetchKategoriBahan = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/kategori-bahan');
            const data = await res.json();
            setKategoriList(data);
        } catch (err) {
            console.error("Gagal mengambil kategori bahan:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKategoriBahan();
    }, []);

    // Early return SETELAH semua hooks
    if (!show) {
        return null;
    }

    const handleAdd = async () => {
        if (!newKategori.trim()) return;
        try {
            await fetch('/api/kategori-bahan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_kategori: newKategori }),
            });
            setNewKategori('');
            fetchKategoriBahan(); // Refresh list
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('Gagal menambah kategori');
        }
    };

    const handleDelete = async (kategoriId) => {
        if (window.confirm('Menghapus kategori akan membuat bahan terkait tidak memiliki kategori. Lanjutkan?')) {
            try {
                await fetch(`/api/kategori-bahan/${kategoriId}`, { method: 'DELETE' });
                fetchKategoriBahan(); // Refresh list
                if (onUpdate) onUpdate();
            } catch (err) {
                alert('Gagal menghapus kategori');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Kategori Bahan</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {loading ? <p>Loading...</p> : (
                    <>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-500">Kategori Tersedia</label>
                            <div className="mt-1 space-y-2">
                                {kategoriList.map(kat => (
                                    <div key={kat.kategori_bahan_id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                                        <span className="font-medium">{kat.nama_kategori}</span>
                                        <button onClick={() => handleDelete(kat.kategori_bahan_id)} className="px-3 py-1 text-sm bg-[#D4A15D] text-white rounded-md">Hapus</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-500">Kategori Baru</label>
                            <input
                                type="text"
                                placeholder="Contoh: Daging & Unggas"
                                value={newKategori}
                                onChange={(e) => setNewKategori(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-100 border rounded-lg"
                            />
                        </div>
                    </>
                )}

                <div className="mt-6">
                    <button onClick={handleAdd} className="w-full py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
                        + Tambahkan Kategori
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditKategoriBahan;