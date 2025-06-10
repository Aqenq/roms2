import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DashboardLayout from './components/layout/DashboardLayout';
import MenuManagement from './components/menu/MenuManagement';
import CustomerMenu from './components/customer/CustomerMenu';
import Dashboard from './components/dashboard/Dashboard';
import WaiterDashboard from './components/waiter/WaiterDashboard';
import Tables from './components/tables/Tables';
import OrderStatus from './components/customer/OrderStatus';

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/tables" element={<DashboardLayout><Tables /></DashboardLayout>} />
          <Route path="/customer-menu/:tableId" element={<CustomerMenu />} />
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
          <Route path="/order-status/:tableId" element={<OrderStatus />} />
          <Route path="/waiter/*" element={<DashboardLayout><WaiterDashboard /></DashboardLayout>} />
          <Route
            path="/menu"
            element={
              <DashboardLayout>
                <MenuManagement />
              </DashboardLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <DashboardLayout>
                <div>Inventory Management (Coming Soon)</div>
              </DashboardLayout>
            }
          />
          <Route
            path="/staff"
            element={
              <DashboardLayout>
                <div>Staff Management (Coming Soon)</div>
              </DashboardLayout>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
