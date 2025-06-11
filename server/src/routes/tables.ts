import express from 'express';
import { pool } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all tables - public endpoint
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY table_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Error fetching tables' });
  }
});

// Call waiter for a table - public endpoint
router.post('/:id/call-waiter', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE tables SET needs_waiter = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error calling waiter:', error);
    res.status(500).json({ message: 'Error calling waiter' });
  }
});

// Update table status - requires authentication
router.patch('/:id', authenticate, authorize('admin', 'waiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, needs_waiter } = req.body;
    const result = await pool.query(
      'UPDATE tables SET status = $1, needs_waiter = $2 WHERE id = $3 RETURNING *',
      [status, needs_waiter, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Error updating table' });
  }
});

export default router; 