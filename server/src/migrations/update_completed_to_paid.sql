-- Update all completed orders to paid status
UPDATE orders SET status = 'paid' WHERE status = 'completed'; 