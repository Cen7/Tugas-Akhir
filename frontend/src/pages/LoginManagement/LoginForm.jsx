import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext'; // <-- TAMBAHKAN BARIS INI
import { AtSign, Lock } from 'react-feather';

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Baris ini sekarang akan berfungsi karena useAuth sudah diimpor

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login gagal');
      
      login(data.user);
      
      navigate('/table-management'); // Arahkan ke halaman meja setelah login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Login | Mi-Wau</title></Helmet>
      <div className="min-h-screen flex font-sans">
        {/* Kolom Kiri - Logo */}
        <div className="w-1/2 bg-[#FEFBF0] flex items-center justify-center p-12 relative">
          <div className="w-full h-full border-2 border-[#D4A15D] flex items-center justify-center">
            <img src="/images/img_header_logo.png" alt="Mi-Wau Logo" className="w-auto h-auto max-w-xs" />
          </div>
        </div>

        {/* Kolom Kanan - Form */}
        <div className="w-1/2 bg-white flex items-center justify-center p-12">
          <div className="max-w-sm w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome Back!</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AtSign size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                />
              </div>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-sm text-gray-600">
                Don’t have an account?{' '}
                <Link to="/signup" className="font-semibold text-[#D4A15D] hover:underline">
                  Sign Up
                </Link>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FEFBF0] text-gray-800 font-bold border-2 border-black rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;