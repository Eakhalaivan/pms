ALTER TABLE medicines ADD COLUMN barcode VARCHAR(255);
CREATE UNIQUE INDEX idx_medicine_barcode ON medicines(barcode);
