import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/roms_db';

console.log('Database Configuration:', {
  url: dbUrl.replace(/:[^:@]+@/, ':****@'),
});

const pool = new Pool({
  connectionString: dbUrl,
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