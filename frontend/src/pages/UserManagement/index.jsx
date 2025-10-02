import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/common/Header';
import SearchView from '../../components/ui/SearchView'; // Asumsi komponen search view sudah ada

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data untuk pengguna, dikelompokkan berdasarkan peran
  const [usersByRole] = useState({
    Kasir: [
      { id: 1, name: 'Agus', initial: 'A' },
      { id: 2, name: 'Dean', initial: 'D' },
    ],
    Dapur: [
      { id: 3, name: 'Shandy', initial: 'S' },
      { id: 4, name: 'William', initial: 'W' },
      { id: 5, name: 'Keisya', initial: 'K' },
    ],
  });

  // Handle search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter users based on search query
  const filteredUsersByRole = Object.keys(usersByRole).reduce((acc, role) => {
    const filteredUsers = usersByRole[role].filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredUsers.length > 0) {
      acc[role] = filteredUsers;
    }
    return acc;
  }, {});

  return (
    <>
      <Helmet>
        <title>Manajemen Pengguna | MiWau</title>
        <meta name="description" content="Halaman untuk mengelola pengguna dan peran di sistem." />
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
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-semibold bg-[#D4A15D] text-white rounded-lg shadow-sm hover:bg-orange-600 transition">
                  Tambah Pengguna
                </button>
                <button className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition">
                  Edit Kategori
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {Object.keys(filteredUsersByRole).map(role => (
                <div key={role}>
                  <h2 className="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">{role}</h2>
                  <div className="divide-y divide-gray-200">
                    {filteredUsersByRole[role].map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-orange-400 text-white rounded-full font-bold">
                            {user.initial}
                          </div>
                          <span className="font-medium text-gray-700">{user.name}</span>
                        </div>
                        <button className="px-4 py-1.5 text-sm font-semibold text-orange-800 bg-orange-100 rounded-lg hover:bg-orange-200 transition">
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </main>
      </div>
    </>
  );
};

export default UserManagement;