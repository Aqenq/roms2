import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { io } from 'socket.io-client';

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name: string;
}

interface Order {
  id: number;
  table_id: number;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

const OrderStatus: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchOrder = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/table/${tableId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const socket = io('http://localhost:3000');

    socket.on('orderStatusChanged', (data) => {
      if (data.table_id === parseInt(tableId || '0')) {
        fetchOrder();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tableId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography>No active order found for this table.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Order Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Status:
          </Typography>
          <Chip
            label={order.status.toUpperCase()}
            color={getStatusColor(order.status) as any}
          />
        </Box>
        <Typography variant="subtitle1" gutterBottom>
          Order Details
        </Typography>
        <List>
          {order.items.map((item) => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={item.name}
                  secondary={`${item.quantity}x - $${Number(item.price).toFixed(2)} each`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="h6">
            Total: ${Number(order.total_amount).toFixed(2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderStatus; 