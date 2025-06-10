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
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import axios from 'axios';
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
  }>;
}

interface Table {
  id: number;
  table_number: number;
  capacity: number;
  status: string;
}

const WaiterDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:3000');

    socket.on('orderStatusChanged', () => {
      fetchData();
    });

    socket.on('tableStatusChanged', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [ordersResponse, tablesResponse] = await Promise.all([
        axios.get('http://localhost:3000/api/orders'),
        axios.get('http://localhost:3000/api/tables'),
      ]);

      setOrders(ordersResponse.data);
      setTables(tablesResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/orders/${orderId}/status`, {
        status: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const updateTableStatus = async (tableId: number, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/tables/${tableId}/status`, {
        status: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating table status:', error);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Waiter Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Orders
            </Typography>
            <List>
              {orders
                .filter(order => ['pending', 'preparing', 'ready'].includes(order.status))
                .map((order) => (
                  <React.Fragment key={order.id}>
                    <ListItem>
                      <ListItemText
                        primary={`Order #${order.id} - Table ${order.table_number}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Items: {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Total: ${order.total_amount}
                            </Typography>
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                        {order.status === 'ready' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            Mark as Served
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tables
            </Typography>
            <Grid container spacing={2}>
              {tables.map((table) => (
                <Grid item xs={6} sm={4} key={table.id}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: table.status === 'available' ? 'success.light' : 'warning.light',
                      cursor: 'pointer',
                    }}
                    onClick={() => updateTableStatus(table.id, table.status === 'available' ? 'occupied' : 'available')}
                  >
                    <TableIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h6">Table {table.table_number}</Typography>
                    <Typography variant="body2">Capacity: {table.capacity}</Typography>
                    <Chip
                      label={table.status}
                      color={table.status === 'available' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WaiterDashboard; 