import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginForm from './pages/LoginManagement/LoginForm';
import SignUpForm from './pages/LoginManagement/SignUpForm';
import MenuManagementPage from './pages/MenuManagement';
import TableManagementPage from './pages/TableManagement';
import OrderManagementPage from './pages/OrderManagement';
import ReportManagementPage from './pages/ReportManagement';
import UserManagementPage from './pages/UserManagement';
import StockManagementPage from './pages/StockManagement';
import EditOrderPage from './pages/OrderManagement/EditOrderPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/menu-management" element={<MenuManagementPage />} />
        <Route path="/table-management" element={<TableManagementPage />} />
        <Route path="/order-management" element={<OrderManagementPage />} />
        <Route path="/report-management" element={<ReportManagementPage />} />
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/stock-management" element={<StockManagementPage />} />
        <Route path="/edit-order" element={<EditOrderPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;