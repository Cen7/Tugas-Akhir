import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './Routes';
import './styles/index.css'; // Pastikan path ini benar
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './Customer/contexts/CartContext'; // <-- 1. Import CartProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider> {/* <-- 2. Bungkus AppRoutes dengan CartProvider */}
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);