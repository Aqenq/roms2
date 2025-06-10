import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'roms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
});

async function initializeDatabase() {
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema created successfully');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin', 'admin@roms.com', adminPassword, 'admin']
    );
    console.log('Admin user created successfully');

    // Create sample menu items
    const menuItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce and mozzarella',
        price: 12.99,
        category: 'Main Course',
        image_url: 'https://example.com/margherita.jpg'
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing',
        price: 8.99,
        category: 'Starters',
        image_url: 'https://example.com/caesar.jpg'
      }
    ];

    for (const item of menuItems) {
      await pool.query(
        `INSERT INTO menu_items (name, description, price, category, image_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
        [item.name, item.description, item.price, item.category, item.image_url]
      );
    }
    console.log('Sample menu items created successfully');

    // Create sample tables
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        `INSERT INTO tables (table_number, capacity, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (table_number) DO NOTHING`,
        [i, 4, 'available']
      );
    }
    console.log('Sample tables created successfully');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initializeDatabase().catch(console.error); 