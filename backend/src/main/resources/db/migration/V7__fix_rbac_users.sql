-- Clear existing users to avoid conflicts and reset passwords
-- Password for all: password
DELETE FROM users WHERE username IN ('admin_user', 'pharma_user', 'billing_user');

INSERT INTO users (username, password_hash, role, name, phone) VALUES 
('admin_user', '$2b$12$dD2IQCyuB6CN1J/MoUUaPe5Pmqa7uPXOOjtbURNANu8UYpyEpmdru', 'ADMIN', 'System Admin', '9999999999'),
('pharma_user', '$2b$12$dD2IQCyuB6CN1J/MoUUaPe5Pmqa7uPXOOjtbURNANu8UYpyEpmdru', 'MEDICINE_USER', 'Pharmacy Staff', '8888888888'),
('billing_user', '$2b$12$dD2IQCyuB6CN1J/MoUUaPe5Pmqa7uPXOOjtbURNANu8UYpyEpmdru', 'BILLING_USER', 'Billing Staff', '7777777777');
