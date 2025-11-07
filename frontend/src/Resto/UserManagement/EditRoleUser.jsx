import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Plus } from 'react-feather';

const EditRoleUser = ({ onClose, onUpdate }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newRole, setNewRole] = useState('');
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [newName, setNewName] = useState('');

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/roles', { credentials: 'include' });
            if (!res.ok) throw new Error('Gagal memuat role');
            const data = await res.json();
            setRoles(data || []);
        } catch (err) {
            console.error('Gagal mengambil role:', err);
            setError(err.message);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newRole.trim()) return;
        try {
            const response = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newRole.trim(), aktif: true }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal menambah role');
            }
            setNewRole('');
            fetchRoles();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menambah role: ${err.message}`);
        }
    };

    const handleStartEdit = (role) => {
        setEditingRoleId(role.id);
        setNewName(role.name);
    };

    const handleCancelEdit = () => {
        setEditingRoleId(null);
        setNewName('');
    };

    const handleSaveRename = async (id) => {
        if (!newName.trim()) {
            alert('Nama role tidak boleh kosong.');
            return;
        }
        try {
            const response = await fetch(`/api/roles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengganti nama role');
            }
            setEditingRoleId(null);
            setNewName('');
            fetchRoles();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal menyimpan perubahan: ${err.message}`);
        }
    };

    const handleToggleActive = async (role) => {
        try {
            const response = await fetch(`/api/roles/${role.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ aktif: !role.aktif }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengubah status role');
            }
            fetchRoles();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(`Gagal mengubah status: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Role Pengguna</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button>
                </div>

                {loading && <p className="text-center text-gray-500 py-4">Loading roles...</p>}
                {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}

                {!loading && !error && (
                    <>
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-500">Role Tersedia</label>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                                {roles.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada role.</p>}
                                {roles.map(role => (
                                    <div key={role.id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                        {editingRoleId === role.id ? (
                                            <input 
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-grow border border-gray-300 rounded px-2 py-1 mr-2 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-sm">{role.name}</span>
                                                <span className={`text-xs py-0.5 px-2 rounded ${role.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {role.aktif ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={role.aktif} onChange={() => handleToggleActive(role)} />
                                            </label>

                                            {editingRoleId === role.id ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveRename(role.id)} className="p-1 text-green-600 hover:text-green-800" title="Simpan">
                                                        <Save size={18} />
                                                    </button>
                                                    <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700" title="Batal">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleStartEdit(role)} className="p-1 text-blue-600 hover:text-blue-800 flex-shrink-0" title="Ganti Nama">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAdd}>
                            <label className="text-sm font-semibold text-gray-500">Tambah Role Baru</label>
                            <div className="flex gap-2 mt-1">
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Manajer" 
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
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

export default EditRoleUser;
