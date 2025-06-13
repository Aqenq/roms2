import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { pool } from './db';
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import tableRoutes from './routes/tables';
import staffRoutes from './routes/staff';
import inventoryRoutes from './routes/inventory';
import menuItemIngredientsRoutes from './routes/menuItemIngredients';
import feedbackRoutes from './routes/feedback';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/menu-item-ingredients', menuItemIngredientsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ROMS API' });
});

// Delete all orders
app.delete('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete order items first due to foreign key constraint
    await client.query('DELETE FROM order_items');
    
    // Then delete all orders
    await client.query('DELETE FROM orders');
    
    await client.query('COMMIT');
    res.json({ message: 'All orders deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting orders:', err);
    res.status(500).json({ error: 'Failed to delete orders' });
  } finally {
    client.release();
  }
});

// Clear all current orders
app.post('/api/clear-orders', async (req, res) => {
  try {
    await pool.query(
      `UPDATE orders SET payment_status = 'paid', status = 'completed';`
    );
    res.json({ message: 'All orders cleared' });
  } catch (err) {
    console.error('Error clearing orders:', err);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle order status updates
  socket.on('orderStatusUpdate', (data) => {
    io.emit('orderStatusChanged', data);
  });

  // Handle table status updates
  socket.on('tableStatusUpdate', (data) => {
    io.emit('tableStatusChanged', data);
  });

  // Handle waiter calls
  socket.on('callWaiter', (data) => {
    const { tableNumber, type } = data;
    console.log(`Waiter called for table: ${tableNumber}, type: ${type}`);

    pool.query(
      'UPDATE tables SET needs_waiter = true WHERE table_number = $1',
      [tableNumber]
    ).then(() => {
      io.emit('waiterCalled', {
        tableNumber: parseInt(tableNumber),
        type,
        timestamp: new Date().toISOString()
      });
      console.log('Waiter called event emitted for table:', tableNumber, 'type:', type);
    }).catch((err: Error) => {
      console.error('Error updating table status:', err);
    });
  });

  // Handle payment completion
  socket.on('paymentCompleted', async (tableNumber) => {
    console.log('Payment completed for table:', tableNumber);
    
    try {
      // Update all orders for this table in a single transaction
      await pool.query(`
        WITH table_info AS (
          SELECT id FROM tables WHERE table_number = $1
        )
        UPDATE orders 
        SET status = 'paid' 
        WHERE table_id = (SELECT id FROM table_info)
        AND status != 'paid';
      `, [tableNumber]);

      // Update table status
      await pool.query(
        'UPDATE tables SET needs_waiter = false, status = $1 WHERE table_number = $2',
        ['available', tableNumber]
      );
      
      console.log('Successfully updated orders and table status for table:', tableNumber);
      
      // Broadcast to all clients
      io.emit('paymentCompleted', { 
        tableNumber: parseInt(tableNumber),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating orders:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 