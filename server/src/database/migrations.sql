-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'cash')); 