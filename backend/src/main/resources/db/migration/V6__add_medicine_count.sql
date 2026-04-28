-- Add count column to medicines table
ALTER TABLE medicines ADD COLUMN count INT DEFAULT 0;

-- Initialize count with existing stock quantities
UPDATE medicines m 
SET m.count = (
    SELECT COALESCE(SUM(s.quantity_available), 0) 
    FROM medicine_stocks s 
    WHERE s.medicine_id = m.id AND s.is_deleted = false
);
