import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'roms_db',
  password: 'postgres',
  port: 5432,
});

// Test the connection
pool.connect()
  .then(client => {
    client.query('SELECT NOW()')
      .then(() => {
        console.log('Connected to Database');
        client.release();
      })
      .catch(err => {
        console.error('Error executing query', err.stack);
        client.release();
      });
  })
  .catch(err => {
    console.error('Error acquiring client', err.stack);
  });

export { pool }; 