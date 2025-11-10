-- Fix Applicants Table Status ENUM
-- Run this SQL script in your MySQL database

-- Step 1: Update existing data to match new status values
UPDATE applicants SET status = 'reviewing' WHERE status = 'screening';
UPDATE applicants SET status = 'reviewing' WHERE status = 'interviewed';
UPDATE applicants SET status = 'accepted' WHERE status IN ('offer', 'hired');

-- Step 2: Modify the status column to use new ENUM values
ALTER TABLE applicants 
MODIFY COLUMN status ENUM('applied', 'reviewing', 'accepted', 'rejected') DEFAULT 'applied';

-- Step 3: Add reviewed_at column if it doesn't exist
-- Check if column exists first, if it does, skip this step
ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;

-- Verify the changes
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'applicants' 
AND COLUMN_NAME IN ('status', 'reviewed_at', 'reviewed_by')
ORDER BY ORDINAL_POSITION;
