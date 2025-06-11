import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Get all menu items with their ingredients
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', mi.id,
              'name', i.name,
              'quantity', mi.quantity,
              'unit', mi.unit
            )
          ) FILTER (WHERE mi.id IS NOT NULL),
          '[]'
        ) as ingredients
      FROM menu_items m
      LEFT JOIN menu_item_ingredients mi ON m.id = mi.menu_item_id
      LEFT JOIN inventory i ON mi.inventory_id = i.id
      GROUP BY m.id
      ORDER BY m.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new menu item
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, price, category, image_url } = req.body;
    const result = await client.query(
      'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, category, image_url]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update a menu item
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, price, category, image_url } = req.body;
    const result = await client.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, image_url = $5 WHERE id = $6 RETURNING *',
      [name, description, price, category, image_url, id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const result = await client.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router; 