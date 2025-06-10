import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Create a new order
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { table_id, items, total_amount } = req.body;
    
    await client.query('BEGIN');
    
    // Create the order with 'unpaid' status
    const orderResult = await client.query(
      'INSERT INTO orders (table_id, status, total_amount, payment_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [table_id, 'pending', total_amount, 'unpaid']
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
          'price', oi.price_at_time,
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

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price', oi.price_at_time,
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

// Update order status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
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

// Get orders for a specific table
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const result = await pool.query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price', oi.price_at_time,
          'name', m.name
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.table_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [tableId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    // First check if the order exists and is unpaid
    const orderCheck = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND payment_status = $2',
      [id, 'unpaid']
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'No unpaid order found with this ID' });
    }

    await client.query('BEGIN');

    // Update the order payment status
    await client.query(
      'UPDATE orders SET payment_status = $1, payment_method = $2 WHERE id = $3',
      ['paid', payment_method, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Payment processed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    client.release();
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