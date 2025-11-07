import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import SearchView from '../../components/ui/SearchView';
import AddUser from './AddUser';
import EditUser from './EditUser';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // removed role/category modal - roles are fixed
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Gagal memuat data pengguna');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus pengguna');
      }

      alert('Pengguna berhasil dihapus');
      fetchUsers(); // Refresh data
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group users by role
  const usersByRole = filteredUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {});

  // Get avatar color based on index
  const getAvatarColor = (index) => {
    const colors = [
      'bg-orange-400',
      'bg-red-400',
      'bg-yellow-400',
      'bg-green-400',
      'bg-blue-400',
      'bg-indigo-400',
      'bg-purple-400',
      'bg-pink-400'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Manajemen Pengguna | MiWau</title></Helmet>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="p-8">
            <div className="text-center py-10">
              <p className="text-gray-500">Memuat data pengguna...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet><title>Manajemen Pengguna | MiWau</title></Helmet>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="p-8">
            <div className="text-center py-10">
              <p className="text-red-500">Error: {error}</p>
              <button 
                onClick={fetchUsers}
                className="mt-4 px-6 py-2 bg-[#D4A15D] text-white rounded-lg hover:bg-opacity-90"
              >
                Coba Lagi
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manajemen Pengguna | MiWau</title>
      </Helmet>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="w-full sm:w-1/3">
                <SearchView
                  placeholder="Search by user name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-opacity-90 transition"
                >
                  Tambah Pengguna
                </button>
                {/* Role editing removed - roles are fixed */}
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {Object.keys(usersByRole).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Tidak ada pengguna ditemukan</p>
                </div>
              ) : (
                Object.keys(usersByRole).sort().map(role => (
                  <div key={role}>
                    <h2 className="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">
                      {role}
                    </h2>
                    <div className="divide-y divide-gray-200">
                      {usersByRole[role].map((user, index) => (
                        <div 
                          key={user.user_id} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className={`w-10 h-10 flex items-center justify-center ${getAvatarColor(index)} text-white rounded-full font-bold text-sm`}
                            >
                              {user.nama_lengkap.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">{user.nama_lengkap}</p>
                              <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="px-4 py-1.5 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.user_id, user.nama_lengkap)}
                              className="px-4 py-1.5 text-sm font-semibold text-orange-800 bg-orange-100 rounded-lg hover:bg-orange-200 transition"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Modals */}
        {showAddModal && (
          <AddUser
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchUsers}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUser
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSuccess={fetchUsers}
          />
        )}

        {/* role editing UI removed */}
      </div>
    </>
  );
};

export default UserManagement;