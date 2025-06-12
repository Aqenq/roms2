import express from 'express';
import { pool } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Create a new order - public endpoint for customers
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { table_id, items, total_amount } = req.body;
    
    // First check if the table exists
    const tableCheck = await client.query(
      'SELECT * FROM tables WHERE id = $1',
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    await client.query('BEGIN');
    
    // Create the order with 'pending' status
    const orderResult = await client.query(
      'INSERT INTO orders (table_id, status, total_amount) VALUES ($1, $2, $3) RETURNING id',
      [table_id, 'pending', total_amount]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // Insert order items with price_at_time
    for (const item of items) {
      const menuItemResult = await client.query(
        'SELECT price FROM menu_items WHERE id = $1',
        [item.id]
      );
      const price = menuItemResult.rows[0].price;
      
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, price]
      );
    }
    
    await client.query('COMMIT');
    
    // Fetch the complete order with items
    const completeOrder = await client.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [orderId]);
    
    res.status(201).json(completeOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Get all orders - accessible by all roles
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.status NOT IN ('paid', 'completed')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order by ID - accessible by all roles
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Update order status - only kitchen staff and admins can update to 'preparing' and 'ready'
router.patch('/:id/status', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({ message: 'User role not found' });
  }

  // Check if the user has permission to update to this status
  if (['preparing', 'ready'].includes(status) && !['admin', 'kitchen_staff'].includes(userRole)) {
    return res.status(403).json({ message: 'Only kitchen staff can update order to preparing or ready status' });
  }

  // Only waiters and admins can mark orders as served
  if (status === 'served' && !['admin', 'waiter'].includes(userRole)) {
    return res.status(403).json({ message: 'Only waiters can mark orders as served' });
  }

  // Only waiters and admins can mark orders as paid
  if (status === 'paid' && !['admin', 'waiter'].includes(userRole)) {
    return res.status(403).json({ message: 'Only waiters can mark orders as paid' });
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Get orders for a specific table - public endpoint
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    console.log('Fetching orders for table:', tableId);
    
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price_at_time', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.table_id = $1 
        AND o.status != 'paid'
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [tableId]);
    
    console.log('Found orders:', result.rows.length, 'for table:', tableId);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table orders:', error);
    res.status(500).json({ message: 'Error fetching table orders' });
  }
});

// Delete all orders for a table
router.delete('/table/:tableId', async (req, res) => {
  const { tableId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete order items first due to foreign key constraint
    await client.query(
      'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE table_id = $1)',
      [tableId]
    );

    // Then delete the orders
    await client.query('DELETE FROM orders WHERE table_id = $1', [tableId]);

    await client.query('COMMIT');
    res.json({ message: 'Table orders cleared successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing table orders:', error);
    res.status(500).json({ error: 'Failed to clear table orders' });
  } finally {
    client.release();
  }
});

export default router; 