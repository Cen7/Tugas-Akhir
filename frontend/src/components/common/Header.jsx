import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'react-feather';
import Logo from './Logo';
import HeaderMenu from './HeaderMenu';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const logoutMenuRef = useRef(null);

  // Close logout menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };

    if (showLogoutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutMenu]);

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin logout?')) {
      await logout();
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-2">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <Logo />
            
            {/* Hamburger Menu Icon (Mobile only) */}
            <button 
              className="block lg:hidden p-2" 
              aria-label="Open menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <HeaderMenu />
            </div>
          </div>

          {/* Right Section - Date, Time, and User Info */}
          <div className="flex items-center justify-center px-2 py-2">
            <div className="flex items-center justify-between w-full mx-2">
              {/* Date and Time */}
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-gray-400 font-normal leading-tight hidden sm:block">
                  {new Date().toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="text-sm sm:text-base text-gray-800 font-normal leading-relaxed">
                  {new Date().toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 ml-4 sm:ml-8 relative" ref={logoutMenuRef}>
                <div className="text-right hidden sm:block">
                  <span className="text-sm sm:text-base text-gray-800 font-normal leading-relaxed block">
                    {currentUser?.nama || 'User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentUser?.role || 'Guest'}
                  </span>
                </div>
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center hover:opacity-80 transition"
                  style={{ backgroundColor: '#cda172' }}
                >
                  <span className="text-sm text-white font-normal leading-normal">
                    {currentUser?.nama ? currentUser.nama.charAt(0).toUpperCase() : 'U'}
                  </span>
                </button>

                {/* Logout Dropdown Menu */}
                {showLogoutMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{currentUser?.nama}</p>
                      <p className="text-xs text-gray-500">{currentUser?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`${menuOpen ? 'block' : 'hidden'} lg:hidden border-t border-gray-200`}>
          <div className="px-4 py-4">
            <HeaderMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;