-- medicine_stocks.quantity_available is the source of truth
-- Remove the redundant denormalized count from medicines table
ALTER TABLE medicines DROP COLUMN count;
