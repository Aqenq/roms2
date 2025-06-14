import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ShoppingCart as CartIcon, Person as PersonIcon, Payment as PaymentIcon } from '@mui/icons-material';
import api from '../../utils/axios';
import { io } from 'socket.io-client';
import FeedbackDialog from './FeedbackDialog';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: number;
  table_id: number;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
}

const CustomerMenu: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  // Force clear everything
  const forceClearOrders = () => {
    console.log('Clearing orders for table:', tableId);
    setOrders([]);
    setCurrentOrder(null);
    setCart([]);
    setPaymentDialogOpen(false);
    setPaymentSuccess(true);
  };

  useEffect(() => {
    if (!tableId) {
      navigate('/tables');
      return;
    }

    const socket = io('http://localhost:3000');
    
    fetchMenuItems();
    if (!paymentSuccess) {
      fetchOrders();
    }

    socket.on('orderStatusChanged', (data) => {
      console.log('Order status changed:', data);
      if (data.table_id === parseInt(tableId) && !paymentSuccess) {
        fetchOrders();
      }
    });

    socket.on('paymentCompleted', (data) => {
      console.log('Payment completed event received:', data);
      if (data.tableNumber === parseInt(tableId)) {
        forceClearOrders();
        setSuccess('Payment completed successfully');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tableId, navigate, paymentSuccess]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/orders/table/${tableId}`);
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
      setError(null);
    } catch (err: unknown) {
      const error = err as ApiError;
      if (error.response?.status === 404) {
        setOrders([]);
        setError(null);
      } else {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
      }
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.id !== itemId);
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      case 'served':
        return 'success';
      case 'paid':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'served':
        return 'Served';
      case 'paid':
        return 'Paid';
      default:
        return status;
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    try {
      const orderData = {
        table_id: parseInt(tableId || '0'),
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        total_amount: getTotalPrice()
      };

      if (!orderData.table_id) {
        setError('Invalid table number');
        return;
      }

      const response = await api.post('/orders', orderData);
      setCurrentOrder(response.data);
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(true);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Error placing order:', err);
      if (error.response?.data?.error) {
        setOrderError(error.response.data.error);
      } else {
        setOrderError('Failed to place order. Please try again.');
      }
    }
  };

  const handleCallWaiter = () => {
    if (!tableId) return;
    const socket = io('http://localhost:3000');
    socket.emit('callWaiter', { tableNumber: parseInt(tableId), type: 'attention' });
    setSuccess('Waiter has been called');
  };

  const handlePayment = () => {
    if (!tableId) return;
    
    if (paymentMethod === 'cash') {
      const socket = io('http://localhost:3000');
      socket.emit('callWaiter', { tableNumber: parseInt(tableId), type: 'payment' });
      socket.emit('paymentCompleted', parseInt(tableId));
      setSuccess('Payment request sent to waiter');
      setPaymentDialogOpen(false);
      // Do NOT clear orders or show feedback here; wait for paymentCompleted event
    } else {
      // For card payment, mark all orders as paid
      const socket = io('http://localhost:3000');
      console.log('Emitting paymentCompleted for table:', tableId);
      socket.emit('paymentCompleted', parseInt(tableId));
      setSuccess('Payment completed successfully');
      setPaymentDialogOpen(false);
      // Do NOT clear orders or show feedback here; wait for paymentCompleted event
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading menu items...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchMenuItems} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  // If payment is completed, show a different view
  if (paymentSuccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Menu</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCallWaiter}
              startIcon={<PersonIcon />}
            >
              Call Waiter
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setPaymentDialogOpen(true)}
              startIcon={<PaymentIcon />}
            >
              Make Payment
            </Button>
            <IconButton color="primary" onClick={() => setCartOpen(true)}>
              <Badge badgeContent={getTotalItems()} color="secondary">
                <CartIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom>
            Payment Completed
          </Typography>
          <Typography>
            Thank you for your payment. Your orders have been cleared.
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Our Menu</Typography>
        </Box>

        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {categories.map(category => (
            <Tab
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            />
          ))}
        </Tabs>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardMedia
                component="img"
                height="140"
                image={item.image_url || '/placeholder-food.jpg'}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {item.category}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${item.price}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Normal view with orders
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Menu</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCallWaiter}
            startIcon={<PersonIcon />}
          >
            Call Waiter
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => setPaymentDialogOpen(true)}
            startIcon={<PaymentIcon />}
          >
            Make Payment
          </Button>
          <IconButton color="primary" onClick={() => setCartOpen(true)}>
            <Badge badgeContent={getTotalItems()} color="secondary">
              <CartIcon />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      {orders.length > 0 && !paymentSuccess && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Orders
          </Typography>
          {orders.map((order) => (
            <Box key={order.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                  Order #{order.id} - {new Date(order.created_at).toLocaleString()}
                </Typography>
                <Chip
                  label={getStatusText(order.status)}
                  color={getStatusColor(order.status)}
                />
              </Box>
              <List dense>
                {order.items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity}x - $${Number(item.price_at_time).toFixed(2)} each`}
                    />
                  </ListItem>
                ))}
              </List>
              <Typography variant="subtitle1" align="right">
                Total: ${Number(order.total_amount).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Our Menu</Typography>
      </Box>

      <Tabs
        value={selectedCategory}
        onChange={(_, newValue) => setSelectedCategory(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {categories.map(category => (
          <Tab
            key={category}
            label={category.charAt(0).toUpperCase() + category.slice(1)}
            value={category}
          />
        ))}
      </Tabs>

      {filteredItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No items found in this category
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardMedia
                component="img"
                height="140"
                image={item.image_url || '/placeholder-food.jpg'}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {item.category}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${item.price}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Order
          </Typography>
          <List>
            {cart.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemText
                    primary={item.name}
                    secondary={`$${item.price} x ${item.quantity}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                    <IconButton
                      edge="end"
                      onClick={() => addToCart(item)}
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">
              Total: ${getTotalPrice().toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={cart.length === 0}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={!!success}
        autoHideDuration={2000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!orderError}
        autoHideDuration={6000}
        onClose={() => setOrderError(null)}
      >
        <Alert severity="error" onClose={() => setOrderError(null)}>
          {orderError}
        </Alert>
      </Snackbar>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {orders.length > 0 ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Total Amount: ${(() => {
                    const total = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
                    return total.toFixed(2);
                  })()}
                </Typography>
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <FormLabel component="legend">Payment Method</FormLabel>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
                  >
                    <FormControlLabel value="card" control={<Radio />} label="Pay with Card" />
                    <FormControlLabel value="cash" control={<Radio />} label="Pay in Person (Call Waiter)" />
                  </RadioGroup>
                </FormControl>
                {paymentMethod === 'cash' && (
                  <Typography color="info" sx={{ mt: 2 }}>
                    A waiter will be notified to come to your table for payment
                  </Typography>
                )}
              </>
            ) : (
              <Typography color="error">
                No unpaid orders found
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePayment} 
            variant="contained" 
            color="primary"
            disabled={orders.length === 0}
          >
            {paymentMethod === 'cash' ? 'Call Waiter for Payment' : 'Request Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        tableId={tableId || ''}
      />
    </Box>
  );
};

export default CustomerMenu; 