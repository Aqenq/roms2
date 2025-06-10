import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  ListItemButton,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Button,
  Alert,
  Chip,
  TableContainer,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  availableTables: number;
}

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name: string;
}

interface RecentOrder {
  id: number;
  table_id: number;
  table_number: number;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  is_paid: boolean;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    availableTables: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/orders');
      const activeOrders = response.data.filter((order: any) => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      );
      setRecentOrders(activeOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = io('http://localhost:3000');
    socket.on('orderStatusChanged', () => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, tablesResponse] = await Promise.all([
        axios.get('http://localhost:3000/api/orders'),
        axios.get('http://localhost:3000/api/tables'),
      ]);

      const orders = ordersResponse.data;
      const tables = tablesResponse.data;

      const activeOrders = orders.filter((order: any) => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      );

      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.status === 'completed' ? Number(order.total_amount) || 0 : 0), 0
      );

      const availableTables = tables.filter((table: any) => 
        table.status === 'available'
      ).length;

      setStats({
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        totalRevenue,
        availableTables,
      });

      setRecentOrders(activeOrders.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders(); // Refresh orders after status update
      fetchDashboardData(); // Refresh stats after status update
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const handlePayment = async (orderId: number) => {
    try {
      await axios.patch(`http://localhost:3000/api/orders/${orderId}/payment`, {
        is_paid: true
      });
      fetchOrders();
      fetchDashboardData();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment');
    }
  };

  const handleCallWaiter = async (tableId: number) => {
    try {
      await axios.post(`http://localhost:3000/api/tables/${tableId}/call-waiter`);
      // Show success message or notification
    } catch (err) {
      console.error('Error calling waiter:', err);
      setError('Failed to call waiter');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      case 'completed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) => (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => { fetchOrders(); fetchDashboardData(); }} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<RestaurantIcon color="primary" />}
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={<TableIcon color="secondary" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${Number(stats.totalRevenue).toFixed(2)}`}
          icon={<MoneyIcon color="success" />}
        />
        <StatCard
          title="Available Tables"
          value={stats.availableTables}
          icon={<InventoryIcon color="info" />}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>Table {order.table_number}</TableCell>
                    <TableCell>
                      {order.items.map((item) => (
                        <div key={item.id}>
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>${Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.toUpperCase()}
                        color={getStatusColor(order.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          sx={{ mr: 1 }}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          sx={{ mr: 1 }}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            sx={{ mr: 1 }}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleCallWaiter(order.table_id)}
                            sx={{ mr: 1 }}
                          >
                            Call Waiter
                          </Button>
                        </>
                      )}
                      {order.status === 'completed' && !order.is_paid && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handlePayment(order.id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <List>
            <ListItemButton>
              <ListItemText primary="View All Orders" />
            </ListItemButton>
            <Divider />
            <ListItemButton>
              <ListItemText primary="Manage Tables" />
            </ListItemButton>
            <Divider />
            <ListItemButton>
              <ListItemText primary="Update Inventory" />
            </ListItemButton>
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 