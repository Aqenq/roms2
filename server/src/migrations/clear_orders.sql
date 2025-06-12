-- Clear all orders and order items
BEGIN;

-- First delete order items due to foreign key constraint
DELETE FROM order_items;

-- Then delete all orders
DELETE FROM orders;

-- Reset table statuses
UPDATE tables SET needs_waiter = false, status = 'available';

COMMIT; 