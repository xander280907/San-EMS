-- Add the reviewed_at column to applicants table
ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;

-- Verify the column was added
SHOW COLUMNS FROM applicants;
