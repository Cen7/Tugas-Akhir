// frontend/src/Resto/TableManagement/PopUpOrderDetail.jsx
import React from 'react';

const PopUpOrderDetail = ({ 
    show, 
    order, 
    items, 
    onClose, 
    onKosongkan,
    isTakeAway 
}) => {
    if (!show || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header Popup */}
                <div className="bg-gray-100 p-4 flex justify-between items-center border-b sticky top-0">
                    <div>
                        <h3 className="text-2xl font-bold">
                            {isTakeAway
                                ? `TA-${String(order.transaksi_id).padStart(3, '0')}`
                                : `Meja ${String(order.nomor_meja).padStart(2, '0')}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {order.tanggal_transaksi 
                                ? new Date(order.tanggal_transaksi).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {isTakeAway ? 'Take Away' : 'Dine in'}
                        </p>
                        { (order.nama_pembeli || order.customer) && (
                            <p className="text-sm text-gray-700 mt-2">Nama Pembeli: <span className="font-semibold">{order.nama_pembeli || order.customer}</span></p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-3xl text-gray-600 hover:text-gray-800 font-bold leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Status Badge: show order status; only show 'Lunas' badge when paid */}
                <div className="p-4 border-b flex items-center gap-3">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                        order.status_pesanan === 'Selesai' ? 'bg-green-500 text-white' : order.status_pesanan === 'Siap' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                        {order.status_pesanan || 'Pending'}
                    </span>
                    {order.status_pembayaran === 'Lunas' && (
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-green-500 text-white">Lunas</span>
                    )}
                </div>

                {/* List Items */}
                <div className="p-4">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Loading items...</p>
                    ) : (
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item.detail_id} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">x {item.jumlah}</p>
                                        <p className="text-gray-600">{item.nama_menu}</p>
                                    </div>
                                    <p className="font-semibold text-gray-800">
                                        Rp {(item.harga_satuan || 0).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total & Payment Info */}
                <div className="p-4 border-t border-b bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg">Rp {(order.total_harga || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {order.tanggal_transaksi 
                            ? new Date(order.tanggal_transaksi).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                            : '-'}
                    </p>
                    {order.status_pembayaran === 'Lunas' && (
                        <p className="text-sm text-gray-700 mt-2">Pembayaran: <span className="font-semibold">{order.metode_pembayaran === 'Tunai' || order.paymentMethod === 'Tunai' ? 'Cash' : (order.metode_pembayaran === 'QRIS' || order.paymentMethod === 'QRIS' ? 'Online Payment' : (order.metode_pembayaran || order.paymentMethod))}</span>{(order.metode_pembayaran === 'Tunai' || order.paymentMethod === 'Tunai') && order.cashier ? ` oleh ${order.cashier}` : ''}</p>
                    )}
                </div>

                {/* Tombol Selesaikan/Kosongkan */}
                <div className="p-4">
                    <button
                        onClick={onKosongkan}
                        className="w-full py-3 bg-[#D4A15D] hover:bg-[#C4915D] text-white font-semibold rounded-lg transition-colors"
                    >
                        {isTakeAway ? 'Selesaikan Pesanan' : 'Kosongkan Meja'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopUpOrderDetail;
