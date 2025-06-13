import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { tableId, rating, comment } = req.body;
    
    const result = await pool.query(
      'INSERT INTO feedback (table_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
      [tableId, rating, comment]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

// Get feedback for a table
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM feedback WHERE table_id = $1 ORDER BY created_at DESC',
      [tableId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// Get all feedback (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT f.*, t.table_number FROM feedback f JOIN tables t ON f.table_id = t.id ORDER BY f.created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

export default router; 