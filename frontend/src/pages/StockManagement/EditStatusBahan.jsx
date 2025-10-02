import React, { useState, useEffect } from 'react';
import { X } from 'react-feather';
import Switch from '../../components/ui/Switch';

// DIUBAH: Menerima 'show' sebagai prop
const EditStatusBahan = ({ show, onClose, onUpdate }) => {
  // Guard clause sekarang berfungsi dengan benar
  

  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBahan = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bahan-baku/all');
        const data = await res.json();
        setBahanList(data);
      } catch (err) {
        console.error("Gagal mengambil daftar bahan:", err);
      } finally {
        setLoading(false);
      }
    };
    // Hanya fetch data jika popup ditampilkan
    if (show) {
      fetchAllBahan();
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const handleStatusChange = async (bahanId, isChecked) => {
    const newStatus = isChecked ? 'tersedia' : 'tidak tersedia';
    setBahanList(prevList => 
        prevList.map(b => b.id === bahanId ? { ...b, status: newStatus } : b)
    );

    try {
      await fetch(`/api/bahan-baku/${bahanId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Gagal mengubah status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Kelola Ketersediaan Bahan</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        
        {loading ? <p>Loading...</p> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bahanList.map(bahan => (
              <div key={bahan.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className={`font-medium ${bahan.status !== 'tersedia' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {bahan.name}
                </span>
                <Switch 
                    checked={bahan.status === 'tersedia'}
                    onChange={(isChecked) => handleStatusChange(bahan.id, isChecked)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStatusBahan;