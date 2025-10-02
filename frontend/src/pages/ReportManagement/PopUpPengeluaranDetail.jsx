import React from 'react';
import { X } from 'react-feather';

const PopUpPengeluaranDetail = ({ data, onClose }) => {
    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Detail Pengeluaran</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                    <p>Pengeluaran {new Date(data.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                    <p>{new Date(data.tanggal_pembelian).toLocaleDateString('id-ID', {dateStyle: 'long'})} | by {data.nama_lengkap}</p>
                </div>

                <div className="space-y-2 border-t border-b py-4">
                    {data.items.map(item => (
                        <div key={item.detail_pembelian_id} className="flex justify-between">
                            <span>x {item.jumlah} {item.nama_bahan} ({item.satuan})</span>
                            <span>Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <p className="text-sm text-gray-500">Keterangan</p>
                    <p className="font-semibold">{data.keterangan}</p>
                </div>

                <div className="flex justify-between font-bold text-lg mt-4 border-t pt-4">
                    <span>Total</span>
                    <span>Rp {parseFloat(data.total_harga).toLocaleString('id-ID')}</span>
                </div>

                <div className="mt-6">
                    <button onClick={onClose} className="w-full py-2 bg-[#D4A15D] text-white font-semibold rounded-lg">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopUpPengeluaranDetail;