import { Router } from 'express';
import pool from '../config/database';
import { Request, Response } from 'express';

const router = Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY table_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Error fetching tables' });
  }
});

// Get table by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'Error fetching table' });
  }
});

// Update table status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tables SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ message: 'Error updating table status' });
  }
});

// Add call waiter endpoint
router.post('/:id/call-waiter', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Update table status to indicate waiter is needed
    const result = await pool.query(
      'UPDATE tables SET needs_waiter = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Emit socket event to notify staff
    req.app.get('io').emit('waiterCalled', {
      tableId: id,
      tableNumber: result.rows[0].table_number
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error calling waiter:', error);
    res.status(500).json({ message: 'Error calling waiter' });
  }
});

export default router; 