import { Router } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';

const router = Router();

// Get all staff members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE role IN ($1, $2) ORDER BY username',
      ['waiter', 'kitchen_staff']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

// Create new staff member
router.post('/', async (req, res) => {
  const { username, email, password, role } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new staff member
    const result = await client.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Error creating staff member' });
  } finally {
    client.release();
  }
});

// Update staff member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let query = 'UPDATE users SET username = $1, email = $2, role = $3';
    let params = [username, email, role];

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $4';
      params.push(hashedPassword);
    }

    query += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, username, email, role';
    params.push(id);

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff member not found' });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Error updating staff member' });
  } finally {
    client.release();
  }
});

// Delete staff member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete table assignments first
    await client.query('DELETE FROM table_assignments WHERE waiter_id = $1', [id]);

    // Then delete the staff member
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff member not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Error deleting staff member' });
  } finally {
    client.release();
  }
});

export default router; 