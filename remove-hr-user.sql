-- SQL Script to Remove HR Role and User
-- Run this in your MySQL database if you've already seeded data

-- Delete HR user from users table
DELETE FROM users WHERE email = 'hr@test.local';

-- Delete HR employee record
DELETE FROM employees WHERE employee_number = 'EMP-HR001';

-- Delete HR role from roles table
DELETE FROM roles WHERE name = 'hr';

-- Optional: Update any orphaned records
UPDATE announcements SET created_by = (SELECT id FROM users WHERE email = 'admin@test.local' LIMIT 1) 
WHERE created_by NOT IN (SELECT id FROM users);

-- Verify deletion
SELECT 'Users after deletion:' as info;
SELECT id, email, first_name, last_name FROM users;

SELECT 'Roles after deletion:' as info;
SELECT id, name, display_name FROM roles;
