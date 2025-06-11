import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  const { name, description, quantity, unit, minimum_quantity } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO inventory (name, description, quantity, unit, minimum_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, quantity, unit, minimum_quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, quantity, unit, minimum_quantity } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE inventory SET name = $1, description = $2, quantity = $3, unit = $4, minimum_quantity = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description, quantity, unit, minimum_quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM inventory WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Add ingredient to menu item
router.post('/menu-item/:menuItemId/ingredient', async (req, res) => {
  const { menuItemId } = req.params;
  const { inventory_id, quantity, unit } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO menu_item_ingredients (menu_item_id, inventory_id, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [menuItemId, inventory_id, quantity, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding ingredient to menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Remove ingredient from menu item
router.delete('/menu-item/:menuItemId/ingredient/:ingredientId', async (req, res) => {
  const { menuItemId, ingredientId } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM menu_item_ingredients WHERE menu_item_id = $1 AND inventory_id = $2 RETURNING *',
      [menuItemId, ingredientId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found in menu item' });
    }
    res.json({ message: 'Ingredient removed from menu item successfully' });
  } catch (error) {
    console.error('Error removing ingredient from menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Check if menu item can be ordered based on inventory
router.get('/check-menu-item/:menuItemId', async (req, res) => {
  const { menuItemId } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        mi.id as menu_item_id,
        mi.name as menu_item_name,
        i.id as inventory_id,
        i.name as ingredient_name,
        i.quantity as available_quantity,
        i.unit as inventory_unit,
        mii.quantity as required_quantity,
        mii.unit as required_unit,
        CASE 
          WHEN i.quantity >= mii.quantity THEN true
          ELSE false
        END as has_sufficient_quantity
      FROM menu_items mi
      JOIN menu_item_ingredients mii ON mi.id = mii.menu_item_id
      JOIN inventory i ON mii.inventory_id = i.id
      WHERE mi.id = $1`,
      [menuItemId]
    );

    if (result.rows.length === 0) {
      return res.json({ can_order: true, message: 'No ingredients required for this menu item' });
    }

    const can_order = result.rows.every(row => row.has_sufficient_quantity);
    const missing_ingredients = result.rows
      .filter(row => !row.has_sufficient_quantity)
      .map(row => ({
        name: row.ingredient_name,
        available: row.available_quantity,
        required: row.required_quantity,
        unit: row.required_unit
      }));

    res.json({
      can_order,
      menu_item_id: result.rows[0].menu_item_id,
      menu_item_name: result.rows[0].menu_item_name,
      missing_ingredients: can_order ? [] : missing_ingredients
    });
  } catch (error) {
    console.error('Error checking menu item ingredients:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router; 