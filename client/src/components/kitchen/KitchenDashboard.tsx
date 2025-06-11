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
  TextField,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
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

const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitchenNotes, setKitchenNotes] = useState<{ [key: number]: string }>({});

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      }
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

    const interval = setInterval(fetchOrders, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const addKitchenNote = async (orderId: number, note: string) => {
    try {
      await api.post(`/orders/${orderId}/notes`, {
        note,
        type: 'kitchen'
      });
      setKitchenNotes(prev => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err: any) {
      console.error('Error adding kitchen note:', err);
      setError(err.response?.data?.message || 'Failed to add kitchen note');
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

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minutes ago`;
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
        <Button onClick={fetchOrders} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  const activeOrders = orders.filter(order => 
    ['pending', 'preparing'].includes(order.status)
  );

  const urgentOrders = activeOrders.filter(order => {
    const created = new Date(order.created_at);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return diff > 15 * 60000; // Orders older than 15 minutes
  });

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Urgent Orders Section */}
        {urgentOrders.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} /> Urgent Orders
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Table</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {urgentOrders.map((order) => (
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
                        <TableCell>{getTimeElapsed(order.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                            >
                              Mark Ready
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
        )}

        {/* Active Orders Section */}
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
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
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
                      <TableCell>{getTimeElapsed(order.created_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Add kitchen note..."
                          value={kitchenNotes[order.id] || ''}
                          onChange={(e) => setKitchenNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && kitchenNotes[order.id]) {
                              addKitchenNote(order.id, kitchenNotes[order.id]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
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

export default KitchenDashboard; 