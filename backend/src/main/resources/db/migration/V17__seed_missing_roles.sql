INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'SUPERVISOR', TRUE, '["APPROVALS", "VIEW_REPORTS", "VIEW_LOGS", "STOCK_MANAGEMENT", "INVENTORY"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'SUPERVISOR') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'SENIOR_MEDICAL_STAFF', TRUE, '["PRESCRIPTIONS", "CLINICAL_RECORDS", "BASIC_PRESCRIPTIONS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'SENIOR_MEDICAL_STAFF') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'MEDICAL_STAFF', TRUE, '["BASIC_PRESCRIPTIONS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'MEDICAL_STAFF') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'BILLING_STAFF', TRUE, '["BILLING", "INVOICES", "ADVANCES", "CLEARANCE"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'BILLING_STAFF') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'PHARMACY_STAFF', TRUE, '["INVENTORY", "INDENT", "RETURNS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'PHARMACY_STAFF') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'RECEPTIONIST', TRUE, '["PATIENT_REGISTRATION", "UHID"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'RECEPTIONIST') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'AUDIT_COMPLIANCE', TRUE, '["VIEW_REPORTS", "VIEW_LOGS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'AUDIT_COMPLIANCE') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'LAB_TECHNICIAN', TRUE, '["CLINICAL_RECORDS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'LAB_TECHNICIAN') LIMIT 1;

INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'STOREKEEPER', TRUE, '["STOCK_MANAGEMENT", "PURCHASE_ORDERS"]', FALSE, '') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'STOREKEEPER') LIMIT 1;
