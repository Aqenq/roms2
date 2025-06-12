import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  TableRestaurant as TableIcon,
} from '@mui/icons-material';
import api from '../../utils/axios';
import { io } from 'socket.io-client';

interface Order {
  id: number;
  table_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: number;
    menu_item_id: number;
    quantity: number;
    price: number;
    name: string;
    notes?: string;
  }>;
}

interface Table {
  id: number;
  number: number;
  status: string;
  needs_waiter: boolean;
  current_order_id?: number;
}

const WaiterDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [ordersResponse, tablesResponse] = await Promise.all([
        api.get('/orders'),
        api.get('/tables')
      ]);

      setOrders(ordersResponse.data);
      setTables(tablesResponse.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:3000');
    socket.on('orderStatusChanged', () => {
      fetchData();
    });

    socket.on('tableNeedsWaiter', (tableNumber: number) => {
      setNotifications(prev => [...prev, `Table ${tableNumber} needs attention`]);
    });

    const interval = setInterval(fetchData, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const updateTableStatus = async (tableId: number, newStatus: string) => {
    try {
      await api.patch(`/tables/${tableId}`, {
        status: newStatus,
        needs_waiter: false
      });
      fetchData();
    } catch (err: any) {
      console.error('Error updating table status:', err);
      setError(err.response?.data?.message || 'Failed to update table status');
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
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
        return 'default';
      default:
        return 'default';
    }
  };

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
        <Button onClick={fetchData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  const activeOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Notifications Section */}
        <Grid item xs={12}>
          {notifications.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} /> Notifications
              </Typography>
              <List>
                {notifications.map((notification, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={notification} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Tables Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TableIcon sx={{ mr: 1 }} /> Tables Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Table Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Current Order</TableCell>
                    <TableCell>Attention Needed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow 
                      key={table.id}
                      sx={{ 
                        bgcolor: table.needs_waiter ? '#fff3e0' : 'inherit',
                        '&:hover': { bgcolor: table.needs_waiter ? '#ffe0b2' : '#f5f5f5' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">Table {table.number}</Typography>
                          {table.needs_waiter && (
                            <Tooltip title="Needs attention">
                              <WarningIcon color="warning" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={table.status}
                          color={table.status === 'available' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {table.current_order_id ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {/* View order details */}}
                          >
                            View Order #{table.current_order_id}
                          </Button>
                        ) : (
                          'No active order'
                        )}
                      </TableCell>
                      <TableCell>
                        {table.needs_waiter ? (
                          <Chip
                            icon={<WarningIcon />}
                            label="Needs Attention"
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="All Good"
                            color="success"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {table.needs_waiter ? (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => updateTableStatus(table.id, 'available')}
                          >
                            Attend
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {/* Create new order */}}
                          >
                            New Order
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Active Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Orders
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>Table {order.table_number}</TableCell>
                      <TableCell>
                        {order.items.map((item) => (
                          <div key={item.id}>
                            {item.quantity}x {item.name}
                            {item.notes && (
                              <Typography variant="caption" display="block" color="textSecondary">
                                Note: {item.notes}
                              </Typography>
                            )}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {order.status === 'ready' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            Mark as Served
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WaiterDashboard; 