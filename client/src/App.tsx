import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DashboardLayout from './components/layout/DashboardLayout';
import MenuManagement from './components/menu/MenuManagement';
import CustomerMenu from './components/customer/CustomerMenu';
import Dashboard from './components/dashboard/Dashboard';
import WaiterDashboard from './components/waiter/WaiterDashboard';
import KitchenDashboard from './components/kitchen/KitchenDashboard';
import OrderStatus from './components/customer/OrderStatus';
import StaffManagement from './components/staff/StaffManagement';
import InventoryManagement from './components/inventory/InventoryManagement';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Tables from './components/tables/Tables';

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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || '';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/customer-menu/:tableId" element={<CustomerMenu />} />
          <Route path="/order-status/:tableId" element={<OrderStatus />} />
          <Route path="/tables" element={<Tables />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin routes */}
            {userRole === 'admin' && (
              <>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="inventory" element={<InventoryManagement />} />
              </>
            )}

            {/* Waiter routes */}
            {userRole === 'waiter' && (
              <>
                <Route index element={<WaiterDashboard />} />
                <Route path="dashboard" element={<WaiterDashboard />} />
                <Route path="menu" element={<MenuManagement />} />
              </>
            )}

            {/* Kitchen staff routes */}
            {userRole === 'kitchen_staff' && (
              <>
                <Route index element={<KitchenDashboard />} />
                <Route path="dashboard" element={<KitchenDashboard />} />
              </>
            )}

            {/* Redirect to appropriate dashboard if role doesn't match any routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Redirect root to login if not authenticated, or to dashboard if authenticated */}
          <Route path="*" element={
            userRole ? <Navigate to="/" replace /> : <Navigate to="/tables" replace />
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
