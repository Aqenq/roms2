import { pool } from '../db';
import bcrypt from 'bcrypt';

async function populateDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create or update admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUpsert = await client.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, email = EXCLUDED.email, role = EXCLUDED.role
       RETURNING *`,
      ['admin', 'admin@roms.com', adminPassword, 'admin']
    );
    console.log('Admin user created/updated:', adminUpsert.rows[0]?.username);

    // Create waiter users
    const waiterPassword = await bcrypt.hash('waiter123', 10);
    const waiters = [
      { username: 'waiter1', email: 'waiter1@roms.com', name: 'John Smith' },
      { username: 'waiter2', email: 'waiter2@roms.com', name: 'Sarah Johnson' },
      { username: 'waiter3', email: 'waiter3@roms.com', name: 'Michael Brown' },
    ];

    for (const waiter of waiters) {
      const waiterResult = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING *',
        [waiter.username, waiter.email, waiterPassword, 'waiter']
      );
      console.log('Waiter user created/updated:', waiterResult.rows[0]?.username);
    }

    // Create kitchen staff users
    const kitchenPassword = await bcrypt.hash('kitchen123', 10);
    const kitchenStaff = [
      { username: 'chef1', email: 'chef1@roms.com', name: 'David Wilson' },
      { username: 'chef2', email: 'chef2@roms.com', name: 'Emily Davis' },
    ];

    for (const staff of kitchenStaff) {
      const staffResult = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING *',
        [staff.username, staff.email, kitchenPassword, 'kitchen_staff']
      );
      console.log('Kitchen staff user created/updated:', staffResult.rows[0]?.username);
    }

    // Verify users were created
    const verifyResult = await client.query('SELECT username, role FROM users');
    console.log('All users in database:', verifyResult.rows);

    await client.query('COMMIT');
    console.log('Database populated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error populating database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the population script
populateDatabase()
  .then(() => {
    console.log('Database population completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database population failed:', error);
    process.exit(1);
  }); 