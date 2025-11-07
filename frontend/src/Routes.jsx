import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './Customer/contexts/CartContext';
import { NotificationProvider } from './Customer/contexts/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginForm from './Resto/LoginManagement/LoginForm';
import SignUpForm from './Resto/LoginManagement/SignUpForm';
import MenuManagementPage from './Resto/MenuManagement';
import TableManagementPage from './Resto/TableManagement';
import OrderManagementPage from './Resto/OrderManagement';
import ReportManagementPage from './Resto/ReportManagement';
import UserManagementPage from './Resto/UserManagement';
import StockManagementPage from './Resto/StockManagement';
import KitchenManagementPage from './Resto/KitchenManagement';
import EditOrderPage from './Resto/OrderManagement/EditOrderPage';
import CHomePage from './Customer/pages/CHomePage';
import CMenuPage from './Customer/pages/CMenuPage';
import COverviewPage from './Customer/pages/COverviewPage'
import COrderStatusPage from './Customer/pages/COrderStatusPage';

const AppRoutes = () => {
  return (
    <Router>
      <CartProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes - No authentication required */}
            <Route path="/" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />

            {/* Customer Routes - No authentication required (QR code access) */}
            <Route path="/order" element={<CHomePage />} />
            <Route path="/order/menu" element={<CMenuPage />} />
            <Route path="/order/overview" element={<COverviewPage />} />
            <Route path="/order/status" element={<COrderStatusPage />} />

            {/* Protected Routes - Require authentication */}

            {/* Manajer Only */}
            <Route
              path="/menu-management"
              element={
                <ProtectedRoute allowedRoles={['Pemilik','Manajer','Kasir','Dapur']}>
                  <MenuManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-management"
              element={
                <ProtectedRoute allowedRoles={['Manajer']}>
                  <ReportManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute allowedRoles={['Manajer']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Manajer & Kasir */}
            <Route
              path="/table-management"
              element={
                <ProtectedRoute allowedRoles={['Manajer', 'Kasir']}>
                  <TableManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-management"
              element={
                <ProtectedRoute allowedRoles={['Manajer', 'Kasir']}>
                  <OrderManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-order"
              element={
                <ProtectedRoute allowedRoles={['Manajer', 'Kasir']}>
                  <EditOrderPage />
                </ProtectedRoute>
              }
            />

            {/* Manajer & Dapur */}
            <Route
              path="/stock-management"
              element={
                <ProtectedRoute allowedRoles={['Manajer', 'Dapur']}>
                  <StockManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Dapur Only */}
            <Route
              path="/kitchen-management"
              element={
                <ProtectedRoute allowedRoles={['Dapur']}>
                  <KitchenManagementPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </CartProvider>
    </Router>
  );
};

export default AppRoutes;