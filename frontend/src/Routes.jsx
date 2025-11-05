import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginForm from './Resto/LoginManagement/LoginForm';
import SignUpForm from './Resto/LoginManagement/SignUpForm';
import MenuManagementPage from './Resto/MenuManagement';
import TableManagementPage from './Resto/TableManagement';
import OrderManagementPage from './Resto/OrderManagement';
import ReportManagementPage from './Resto/ReportManagement';
import UserManagementPage from './Resto/UserManagement';
import StockManagementPage from './Resto/StockManagement';
import EditOrderPage from './Resto/OrderManagement/EditOrderPage';
import CHomePage from './Customer/pages/CHomePage';
import CMenuPage from './Customer/pages/CMenuPage';
import COverviewPage from './Customer/pages/COverviewPage'
import COrderStatusPage from './Customer/pages/COrderStatusPage';

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
        <Route path="/order" element={<CHomePage />} />
        <Route path="/order/menu" element={<CMenuPage />} />
        <Route path="/order/overview" element={<COverviewPage />} />
        <Route path="/order/status" element={<COrderStatusPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;