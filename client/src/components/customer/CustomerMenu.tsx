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
import axios from 'axios';
import { io } from 'socket.io-client';

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
  payment_status: string;
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
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) {
      navigate('/tables');
      return;
    }
    fetchMenuItems();
    fetchOrders();

    const socket = io('http://localhost:3000');
    socket.on('orderStatusChanged', (data) => {
      if (data.table_id === parseInt(tableId)) {
        fetchOrders();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tableId, navigate]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3000/api/menu');
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
      const response = await axios.get(`http://localhost:3000/api/orders/table/${tableId}`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
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
      case 'completed':
        return 'default';
      default:
        return 'default';
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

      const response = await axios.post('http://localhost:3000/api/orders', orderData);
      setCurrentOrder(response.data);
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(true);
      fetchOrders();
    } catch (err) {
      console.error('Error placing order:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setOrderError(err.response.data.error);
      } else {
        setOrderError('Failed to place order. Please try again.');
      }
    }
  };

  const handleCallWaiter = async (tableId: number) => {
    try {
      await axios.post(`http://localhost:3000/api/tables/${tableId}/call-waiter`);
    } catch (err) {
      console.error('Error calling waiter:', err);
      setError('Failed to call waiter');
    }
  };

  const handlePayment = async () => {
    try {
      const unpaidOrder = orders.find(order => order.payment_status === 'unpaid');
      if (!unpaidOrder) {
        setError('No unpaid order found');
        return;
      }

      await axios.patch(`http://localhost:3000/api/orders/${unpaidOrder.id}/payment`, { 
        payment_method: paymentMethod 
      });
      
      setSuccess('Payment successful!');
      setPaymentDialogOpen(false);
      setOrders(orders.filter(order => order.status !== 'completed'));
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Menu</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCallWaiter(parseInt(tableId || '0'))}
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

      {orders.length > 0 && (
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
                  label={order.status.toUpperCase()}
                  color={getStatusColor(order.status)}
                />
              </Box>
              <List dense>
                {order.items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity}x - $${(item.price_at_time * item.quantity).toFixed(2)}`}
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
            {orders.find(order => order.payment_status === 'unpaid') ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Total Amount: ${(() => {
                    const unpaidOrder = orders.find(order => order.payment_status === 'unpaid');
                    return unpaidOrder?.total_amount ? Number(unpaidOrder.total_amount).toFixed(2) : '0.00';
                  })()}
                </Typography>
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <FormLabel component="legend">Payment Method</FormLabel>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
                  >
                    <FormControlLabel value="card" control={<Radio />} label="Pay with Card" />
                    <FormControlLabel value="cash" control={<Radio />} label="Pay in Person" />
                  </RadioGroup>
                </FormControl>
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
            disabled={!orders.find(order => order.payment_status === 'unpaid')}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerMenu; 