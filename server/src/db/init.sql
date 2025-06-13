-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    needs_waiter BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO users (email, password, role) VALUES
    ('admin@roms.com', '$2b$10$YourHashedPasswordHere', 'admin'),
    ('waiter@roms.com', '$2b$10$YourHashedPasswordHere', 'waiter')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tables
INSERT INTO tables (table_number, status) VALUES
    (1, 'available'),
    (2, 'available'),
    (3, 'available'),
    (4, 'available'),
    (5, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url) VALUES
    ('Margherita Pizza', 'Classic tomato sauce, mozzarella, and basil', 12.99, 'Pizza', ''),
    ('Caesar Salad', 'Romaine lettuce, croutons, parmesan, and Caesar dressing', 8.99, 'Salad', 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80'),
    ('Spaghetti Carbonara', 'Pasta with eggs, cheese, pancetta, and black pepper', 14.99, 'Pasta', 'https://images.unsplash.com/photo-1523987355523-c7b5b0723c6b?auto=format&fit=crop&w=400&q=80'),
    ('Garlic Bread', 'Toasted bread with garlic and herbs', 5.99, 'Appetizer', '')
ON CONFLICT (id) DO NOTHING; 