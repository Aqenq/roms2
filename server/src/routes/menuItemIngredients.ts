import express from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get ingredients for a menu item
router.get('/:menuItemId', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const result = await pool.query(`
      SELECT mi.*, i.name, i.unit
      FROM menu_item_ingredients mi
      JOIN inventory i ON mi.inventory_id = i.id
      WHERE mi.menu_item_id = $1
      ORDER BY i.name
    `, [menuItemId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu item ingredients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add ingredient to menu item
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { menu_item_id, inventory_id, quantity, unit } = req.body;
    const result = await client.query(
      'INSERT INTO menu_item_ingredients (menu_item_id, inventory_id, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [menu_item_id, inventory_id, quantity, unit]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding ingredient to menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update ingredient quantity and unit
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { quantity, unit } = req.body;
    const result = await client.query(
      'UPDATE menu_item_ingredients SET quantity = $1, unit = $2 WHERE id = $3 RETURNING *',
      [quantity, unit, id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating menu item ingredient:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Remove ingredient from menu item
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const result = await client.query('DELETE FROM menu_item_ingredients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Ingredient removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing ingredient from menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router; 