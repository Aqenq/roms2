import { Router } from 'express';
import pool from '../config/database';

const router = Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    console.log('Fetching menu items...');
    const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
    console.log(`Found ${result.rows.length} menu items`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ 
      message: 'Error fetching menu items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new menu item
router.post('/', async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, category, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ 
      message: 'Error creating menu item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a menu item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5 WHERE id = $6 RETURNING *',
      [name, description, price, category, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ 
      message: 'Error updating menu item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ 
      message: 'Error deleting menu item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 