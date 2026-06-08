-- Update admin user password to 'pms'
-- BCrypt hash of 'pms' with cost factor 12
UPDATE users SET password_hash = '$2b$12$IIBdBQFSk156PQzRVJncF.1eQtsA8doVzUCP08c.byK3J6VMgTHRq'
WHERE username = 'admin';
