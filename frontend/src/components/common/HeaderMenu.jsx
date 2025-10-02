import React from 'react';
import HeaderMenuItem from './HeaderMenuItem';
import { useLocation } from 'react-router-dom';

const HeaderMenu = () => {

  const location = useLocation();
  const menuItems = [
    { text: 'Meja', href: '/table-management' },
    { text: 'Menu', href: '/menu-management' },
    { text: 'Pesanan', href: '/order-management' },
    { text: 'Laporan', href: '/report-management' },
    { text: 'Pengguna', href: '/user-management' },
    { text: 'Stok', href: '/stock-management' },
  ];

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