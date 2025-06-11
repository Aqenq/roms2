import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DashboardLayout from './components/layout/DashboardLayout';
import MenuManagement from './components/menu/MenuManagement';
import CustomerMenu from './components/customer/CustomerMenu';
import Dashboard from './components/dashboard/Dashboard';
import WaiterDashboard from './components/waiter/WaiterDashboard';
import OrderStatus from './components/customer/OrderStatus';
import StaffManagement from './components/staff/StaffManagement';
import InventoryManagement from './components/inventory/InventoryManagement';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/customer-menu/:tableId" element={<CustomerMenu />} />
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
          <Route path="/order-status/:tableId" element={<OrderStatus />} />
          <Route
            path="/waiter/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WaiterDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MenuManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InventoryManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StaffManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
