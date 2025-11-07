import React from 'react';
import HeaderMenuItem from './HeaderMenuItem';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HeaderMenu = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  // Definisi menu dengan role access dan urutan per role
  const getMenuItems = (role) => {
    switch (role) {
      case 'Manajer':
        return [
          { text: 'Meja', href: '/table-management' },
          { text: 'Menu', href: '/menu-management' },
          { text: 'Pesanan', href: '/order-management' },
          { text: 'Laporan', href: '/report-management' },
          { text: 'Pengguna', href: '/user-management' },
          { text: 'Stok', href: '/stock-management' },
          // Dapur dihapus untuk Manajer (sudah dirangkup di Pesanan & Meja)
        ];
      case 'Kasir':
        return [
          { text: 'Meja', href: '/table-management' },
          { text: 'Menu', href: '/menu-management' },
          { text: 'Pesanan', href: '/order-management' },
        ];
      case 'Dapur':
        return [
          { text: 'Dapur', href: '/kitchen-management' },
          { text: 'Stok', href: '/stock-management' },
          { text: 'Menu', href: '/menu-management' },
        ];
      default:
        return [];
    }
  };

  // Filter menu berdasarkan role user
  const menuItems = currentUser ? getMenuItems(currentUser.role) : [];

  return (
    <nav className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
      {menuItems.map((item, index) => (
        <HeaderMenuItem
          key={index}
          text={item.text}
          href={item.href}
          active={location.pathname === item.href}
          onClick={() => { }} 
        />
      ))}
    </nav>
  );
};

export default HeaderMenu;