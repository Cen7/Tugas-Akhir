import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './Routes';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);