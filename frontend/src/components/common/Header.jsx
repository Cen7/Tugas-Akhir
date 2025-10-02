import React, { useState } from 'react';
import Logo from './Logo';
import HeaderMenu from './HeaderMenu';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
                  May 1, 2022
                </span>
                <span className="text-sm sm:text-base text-gray-800 font-normal leading-relaxed">
                  Fri 19:05
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 ml-4 sm:ml-8">
                <span className="text-sm sm:text-base text-gray-800 font-normal leading-relaxed text-right hidden sm:block">
                  Vincent
                </span>
                <div 
                  className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#cda172' }}
                >
                  <span className="text-sm text-white font-normal leading-normal">
                    V
                  </span>
                </div>
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