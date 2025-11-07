import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'react-feather';
import { useAuth } from '../../context/AuthContext';

const EditPromo = ({ show, onClose, onUpdate, menuList }) => {
  const { currentUser } = useAuth();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    menu_id: '',
    nama_promo: '',
    harga_promo: '',
    persentase_diskon: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: 'aktif'
  });

  useEffect(() => {
    if (show) {
      fetchPromos();
    }
  }, [show]);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/promo');
      if (!response.ok) throw new Error('Gagal mengambil data promo');
      const data = await response.json();
      setPromos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate discount percentage when price is changed
    if (name === 'harga_promo' && formData.menu_id) {
      const selectedMenu = menuList.find(m => m.menu_id === parseInt(formData.menu_id));
      if (selectedMenu) {
        const discount = Math.round(((selectedMenu.harga - parseFloat(value)) / selectedMenu.harga) * 100);
        setFormData(prev => ({ ...prev, persentase_diskon: discount >= 0 ? discount : 0 }));
      }
    }
  };

  const handleMenuChange = (e) => {
    const menu_id = e.target.value;
    const selectedMenu = menuList.find(m => m.menu_id === parseInt(menu_id));
    
    setFormData(prev => ({
      ...prev,
      menu_id,
      nama_promo: selectedMenu ? `Promo ${selectedMenu.nama_menu}` : '',
      harga_promo: selectedMenu ? selectedMenu.harga : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('User tidak teridentifikasi. Silakan login kembali.');
      return;
    }
    
    // Check for user_id in currentUser object - bisa berupa 'id' atau 'user_id'
    const userId = currentUser.id || currentUser.user_id;
    
    if (!userId) {
      setError('User ID tidak ditemukan. Silakan login kembali.');
      console.error('currentUser object:', currentUser);
      return;
    }
    
    try {
      const url = editingPromo 
        ? `/api/promo/${editingPromo.promo_id}` 
        : '/api/promo';
      
      const method = editingPromo ? 'PUT' : 'POST';

      const dataToSend = {
        ...formData,
        user_id: userId
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan promo');
      }

      await fetchPromos();
      resetForm();
      setShowForm(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
      console.error('Error saving promo:', err);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      menu_id: promo.menu_id,
      nama_promo: promo.nama_promo,
      harga_promo: promo.harga_promo,
      persentase_diskon: promo.persentase_diskon || '',
      tanggal_mulai: formatDateForInput(promo.tanggal_mulai),
      tanggal_selesai: formatDateForInput(promo.tanggal_selesai),
      status: promo.status
    });
    setShowForm(true);
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus promo ini?')) return;

    try {
      const response = await fetch(`/api/promo/${promoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Gagal menghapus promo');

      await fetchPromos();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (promoId, currentStatus) => {
    const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

    try {
      const response = await fetch(`/api/promo/${promoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Gagal mengubah status promo');

      await fetchPromos();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setEditingPromo(null);
    setFormData({
      menu_id: '',
      nama_promo: '',
      harga_promo: '',
      persentase_diskon: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      status: 'aktif'
    });
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const isPromoActive = (promo) => {
    const now = new Date();
    const start = new Date(promo.tanggal_mulai);
    const end = new Date(promo.tanggal_selesai);
    return promo.status === 'aktif' && now >= start && now <= end;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Promo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Add Promo Button */}
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="mb-6 px-4 py-2 bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-opacity-90 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Promo Baru
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                {editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Menu <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="menu_id"
                      value={formData.menu_id}
                      onChange={handleMenuChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                    >
                      <option value="">Pilih Menu</option>
                      {menuList.map(menu => (
                        <option key={menu.menu_id} value={menu.menu_id}>
                          {menu.nama_menu} - Rp {Number(menu.harga).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_promo"
                      value={formData.nama_promo}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                      placeholder="e.g., Promo Weekend"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="harga_promo"
                      value={formData.harga_promo}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                      placeholder="Harga setelah diskon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persentase Diskon (%)
                    </label>
                    <input
                      type="number"
                      name="persentase_diskon"
                      value={formData.persentase_diskon}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D] bg-gray-100"
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="tanggal_mulai"
                      value={formData.tanggal_mulai}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="tanggal_selesai"
                      value={formData.tanggal_selesai}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4A15D] text-white rounded-lg hover:bg-opacity-90 transition"
                  >
                    {editingPromo ? 'Update Promo' : 'Simpan Promo'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Promo List */}
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-4">
              {promos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Belum ada promo. Tambahkan promo baru!</p>
              ) : (
                promos.map(promo => (
                  <div
                    key={promo.promo_id}
                    className={`p-4 rounded-lg border-2 ${
                      isPromoActive(promo)
                        ? 'border-green-400 bg-green-50'
                        : promo.status === 'aktif'
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{promo.nama_promo}</h4>
                          {isPromoActive(promo) && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                              ACTIVE
                            </span>
                          )}
                          {promo.status === 'nonaktif' && (
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                              NONAKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Menu:</span> {promo.nama_menu}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-600 mb-2">
                          <p>
                            <span className="font-medium">Harga Normal:</span> Rp {Number(promo.harga_normal).toLocaleString('id-ID')}
                          </p>
                          <p className="text-red-600 font-semibold">
                            <span className="font-medium">Harga Promo:</span> Rp {Number(promo.harga_promo).toLocaleString('id-ID')}
                          </p>
                          {promo.persentase_diskon && (
                            <p className="text-green-600 font-semibold">
                              Diskon {promo.persentase_diskon}%
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <p>
                            {formatDate(promo.tanggal_mulai)} - {formatDate(promo.tanggal_selesai)}
                          </p>
                          {promo.created_by && (
                            <p>
                              <span className="font-medium">Dibuat oleh:</span> {promo.created_by}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(promo.promo_id, promo.status)}
                          className="p-2 text-gray-600 hover:text-gray-800 transition"
                          title={promo.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {promo.status === 'aktif' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => handleEdit(promo)}
                          className="p-2 text-blue-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.promo_id)}
                          className="p-2 text-red-600 hover:text-red-800 transition"
                          title="Hapus"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPromo;
