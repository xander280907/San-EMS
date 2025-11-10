-- Add profile_picture column to users table
-- Remove AFTER phone since phone column doesn't exist
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL;

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ems_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'profile_picture';
