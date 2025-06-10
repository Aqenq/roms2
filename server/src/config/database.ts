import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('Database Configuration:', {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'roms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? '****' : 'not set'
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'roms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else if (client) {
    console.log('Successfully connected to database');
    // Test query to verify we can access the users table
    client.query('SELECT COUNT(*) FROM users', (err, result) => {
      if (err) {
        console.error('Error querying users table:', err.stack);
      } else {
        console.log('Users table accessible. Count:', result.rows[0].count);
      }
      release();
    });
  }
});

export default pool; 