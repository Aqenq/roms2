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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

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
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:3000');
    
    socket.on('waiterCalled', (tableNumber: number) => {
      console.log('Waiter called for table:', tableNumber);
      // Update tables state
      setTables(prevTables => 
        prevTables.map(table => 
          table.number === tableNumber 
            ? { ...table, needs_waiter: true }
            : table
        )
      );
      // Add notification
      setNotifications(prev => [...prev, `Table ${tableNumber} called for payment`]);
    });

    const interval = setInterval(fetchData, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const updateTableStatus = async (tableId: number, newStatus: string) => {
    try {
      // Update local state immediately for visual feedback
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId 
            ? { ...table, status: newStatus, needs_waiter: false }
            : table
        )
      );

      // Try to update on server in background
      await api.patch(`/tables/${tableId}`, {
        status: newStatus,
        needs_waiter: false
      });
      
      // Emit socket event for real-time updates
      const socket = io('http://localhost:3000');
      socket.emit('tableStatusUpdate', { tableId, status: newStatus });
    } catch (err) {
      console.error('Error updating table status:', err);
      // Don't show error to user in prototype
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

  const handleProcessPayment = (table: Table) => {
    setSelectedTable(table);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    if (!selectedTable) return;

    // Update server
    api.patch(`/tables/${selectedTable.id}`, {
      status: 'available',
      needs_waiter: false
    }).then(() => {
      // Update local state
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, status: 'available', needs_waiter: false }
            : table
        )
      );

      // Clear notifications
      setNotifications([]);

      // Close dialog
      setPaymentDialogOpen(false);
      setSelectedTable(null);

      // Emit payment completed event
      const socket = io('http://localhost:3000');
      socket.emit('paymentCompleted', selectedTable.number);

      // Refresh data
      fetchData();
    });
  };

  const getTableOrderAmount = (tableNumber: number) => {
    // Find the most recent order for this table
    const tableOrders = orders.filter(order => order.table_number === tableNumber);
    if (tableOrders.length === 0) return 0;
    
    // Get the most recent order
    const latestOrder = tableOrders.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });
    
    return latestOrder.total_amount;
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
                            label="Payment Requested"
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
                            onClick={() => handleProcessPayment(table)}
                          >
                            Process Payment
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
                            onClick={() => updateOrderStatus(order.id, 'served')}
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

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Table {selectedTable?.number}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Total Amount: ${getTableOrderAmount(selectedTable?.number || 0).toFixed(2)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePaymentComplete}
              variant="contained" 
              color="primary"
            >
              Complete Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default WaiterDashboard; 