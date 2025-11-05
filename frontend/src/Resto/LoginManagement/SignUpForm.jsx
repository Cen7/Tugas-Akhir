import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { User, AtSign, Lock } from 'react-feather';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    password: '',
    retypePassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { retypePassword, ...apiData } = formData;
      const dataToSend = {
        ...apiData,
        role: 'admin' 
      };

      // DIUBAH: Path API disesuaikan menjadi /api/users/signup
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Sign up failed');
      }
      console.log(data.message);
      alert('Registrasi berhasil! Silakan login.');
      navigate('/'); // DIUBAH: Arahkan ke halaman login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Create Account | Mi-Wau</title></Helmet>
      <div className="min-h-screen flex font-sans">
        <div className="w-1/2 bg-[#FEFBF0] flex items-center justify-center p-12 relative">
          <div className="w-full h-full border-2 border-[#D4A15D] flex items-center justify-center">
            <img src="/images/img_header_logo.png" alt="Mi-Wau Logo" className="w-auto h-auto max-w-xs" />
          </div>
        </div>
        <div className="w-1/2 bg-white flex items-center justify-center p-12">
          <div className="max-w-sm w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Create Account</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="nama_lengkap"
                  placeholder="Nama Lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                />
              </div>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AtSign size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                />
              </div>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  name="retypePassword"
                  placeholder="Re-Type Password"
                  value={formData.retypePassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A15D]"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/" className="font-semibold text-[#D4A15D] hover:underline">
                  Login
                </Link>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FEFBF0] text-gray-800 font-bold border-2 border-black rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpForm;