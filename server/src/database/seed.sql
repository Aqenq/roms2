-- Insert default admin user
-- Password is 'admin123' (hashed)
INSERT INTO users (username, email, password, role)
VALUES (
  'admin',
  'admin@roms.com',
  '$2b$10$3euPcmQFCiblsZeEu5s7p.9BU8F8jQzG3gx3UqHhQz3UqHhQz3UqH',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url) VALUES
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, 'Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3'),
('Pepperoni Pizza', 'Pizza topped with pepperoni and mozzarella cheese', 14.99, 'Pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
('Caesar Salad', 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan', 8.99, 'Salads', 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9'),
('Greek Salad', 'Mixed greens with feta cheese, olives, tomatoes, and cucumber', 9.99, 'Salads', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
('Spaghetti Bolognese', 'Classic pasta with meat sauce and parmesan', 13.99, 'Pasta', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8'),
('Fettuccine Alfredo', 'Pasta in creamy parmesan sauce', 12.99, 'Pasta', 'https://images.unsplash.com/photo-1645112411346-1c6adfd7f1d9'),
('Chicken Wings', 'Crispy wings with choice of sauce', 10.99, 'Appetizers', 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7'),
('Garlic Bread', 'Toasted bread with garlic butter and herbs', 5.99, 'Appetizers', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c'),
('Chocolate Cake', 'Rich chocolate cake with ganache', 6.99, 'Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'),
('Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 7.99, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9'),
('Coca Cola', 'Classic carbonated drink', 2.99, 'Drinks', 'https://images.unsplash.com/photo-1554866585-cd94860890b7'),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 3.99, 'Drinks', 'https://images.unsplash.com/photo-16134782237194052c0c2b4d4'); 