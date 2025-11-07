// frontend/src/Resto/TableManagement/EditMeja.jsx
import React from 'react';
import Switch from '../../components/ui/Switch';

const EditMeja = ({
    show,
    onClose,
    allTables,
    onToggleStatus,
    onAddTable
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#D4A15D] text-white p-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-bold">Kelola Meja</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Konten */}
                <div className="p-6">

                    {/* Info Singkat */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <p className="font-semibold mb-1">💡 Info Status Meja:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li><span className="font-semibold text-green-700">Tersedia:</span> Meja kosong, bisa menerima pesanan baru</li>
                            <li><span className="font-semibold text-amber-700">Terisi:</span> Ada pesanan aktif, tidak bisa diubah</li>
                            <li><span className="font-semibold text-gray-700">Nonaktif:</span> Meja disembunyikan, tidak muncul di panel</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        {allTables.map((table) => (
                            <div
                                key={table.meja_id}
                                className={`flex items-center justify-between p-3 border rounded-lg transition-all ${table.status === 'tidak tersedia'
                                        ? 'bg-gray-100 border-gray-300'
                                        : table.status === 'terisi'
                                            ? 'bg-amber-50 border-amber-300'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div>
                                    <span className="font-medium">Meja {table.nomor_meja}</span>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded ${table.status === 'tersedia'
                                                ? 'bg-green-100 text-green-700'
                                                : table.status === 'terisi'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {table.status === 'tersedia' ? 'Tersedia' : table.status === 'terisi' ? 'Terisi' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>

                                {/* Switch Toggle */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm ${table.status === 'terisi'
                                            ? 'text-gray-400'
                                            : table.status === 'tersedia'
                                                ? 'text-gray-700'
                                                : 'text-gray-500'
                                        }`}>
                                        {table.status === 'terisi'
                                            ? 'Terisi'
                                            : table.status === 'tersedia'
                                                ? 'Aktif'
                                                : 'Nonaktif'}
                                    </span>
                                    <Switch
                                        checked={table.status === 'tersedia'}
                                        onChange={() => onToggleStatus(table.meja_id, table.status)}
                                        disabled={table.status === 'terisi'}
                                        size="medium"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tombol Tambah Meja */}
                    <button
                        onClick={onAddTable}
                        className="w-full mt-4 py-2 bg-[#D4A15D] hover:bg-[#C4915D] text-white font-semibold rounded-lg transition-colors"
                    >
                        + Tambah Meja
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditMeja;
