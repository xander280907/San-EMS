-- Fix user roles - set default role for users with NULL or empty roles
-- Update all users without roles to be 'employee' by default
UPDATE users SET role = 'employee' WHERE role IS NULL OR role = '';

-- Set admin role for the first user (usually the admin account)
-- Update this based on which email is your admin
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com' LIMIT 1;

-- Verify the changes
SELECT id, employee_code, name, email, role FROM users;
