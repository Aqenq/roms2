import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all menu items - public endpoint
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Error fetching menu items' });
  }
});

// Get menu item by ID - public endpoint
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Error fetching menu item' });
  }
});

// Create a new menu item - requires admin authentication
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, price, category, image_url } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    // Check if menu item with same name already exists
    const existingItem = await client.query(
      'SELECT * FROM menu_items WHERE name = $1',
      [name]
    );

    if (existingItem.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Menu item with this name already exists' });
    }

    const result = await client.query(
      'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, category, image_url]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Error creating menu item' });
  } finally {
    client.release();
  }
});

// Update a menu item - requires admin authentication
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, price, category, image_url } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    // Check if menu item exists
    const existingItem = await client.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (existingItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Check if another menu item with the same name exists
    const duplicateItem = await client.query(
      'SELECT * FROM menu_items WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (duplicateItem.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Another menu item with this name already exists' });
    }

    const result = await client.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5 WHERE id = $6 RETURNING *',
      [name, description, price, category, image_url, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Error updating menu item' });
  } finally {
    client.release();
  }
});

// Delete a menu item - requires admin authentication
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Check if menu item exists
    const existingItem = await client.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (existingItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Check if menu item is used in any active orders
    const activeOrders = await client.query(
      'SELECT COUNT(*) FROM order_items WHERE menu_item_id = $1',
      [id]
    );

    if (parseInt(activeOrders.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot delete menu item that is used in active orders' });
    }

    await client.query('DELETE FROM menu_items WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Error deleting menu item' });
  } finally {
    client.release();
  }
});

export default router; 