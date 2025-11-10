# URGENT: Fix Application Status Error

## The Problem
Error: `SQLSTATE[01000]: Warning: 1265 Data truncated for column 'status'`

This happens because the database ENUM column doesn't accept the new status values.

## Quick Fix - Choose ONE Method:

---

## METHOD 1: Using phpMyAdmin or MySQL Workbench (RECOMMENDED)

### Step 1: Open Your Database
1. Open **phpMyAdmin** or **MySQL Workbench**
2. Select your database (probably `ems` or similar)

### Step 2: Run This SQL
Copy and paste this entire SQL script:

```sql
-- Update existing data
UPDATE applicants SET status = 'reviewing' WHERE status = 'screening';
UPDATE applicants SET status = 'reviewing' WHERE status = 'interviewed';
UPDATE applicants SET status = 'accepted' WHERE status IN ('offer', 'hired');

-- Fix the ENUM column
ALTER TABLE applicants 
MODIFY COLUMN status ENUM('applied', 'reviewing', 'accepted', 'rejected') DEFAULT 'applied';

-- Add reviewed_at column (ignore error if already exists)
ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;
```

### Step 3: Test
Go to your recruitment page and try clicking the action buttons!

---

## METHOD 2: Using Command Line

### Step 1: Open Command Prompt as Administrator

### Step 2: Navigate to XAMPP MySQL
```cmd
cd C:\xampp\mysql\bin
```

### Step 3: Login to MySQL
```cmd
mysql -u root -p
```
(Press Enter if no password, or type your password)

### Step 4: Select Database
```sql
USE your_database_name;
```
(Replace `your_database_name` with your actual database name)

### Step 5: Run the Fix
```sql
UPDATE applicants SET status = 'reviewing' WHERE status = 'screening';
UPDATE applicants SET status = 'reviewing' WHERE status = 'interviewed';
UPDATE applicants SET status = 'accepted' WHERE status IN ('offer', 'hired');

ALTER TABLE applicants 
MODIFY COLUMN status ENUM('applied', 'reviewing', 'accepted', 'rejected') DEFAULT 'applied';

ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;
```

### Step 6: Verify
```sql
DESCRIBE applicants;
```

You should see:
- `status` column with type: `enum('applied','reviewing','accepted','rejected')`
- `reviewed_at` column with type: `timestamp`

### Step 7: Exit MySQL
```sql
exit;
```

---

## METHOD 3: Using SQL File (If you have the file)

### Step 1: Find the SQL file
Location: `c:\EMS-System\backend\fix_applicants_status.sql`

### Step 2: Import via phpMyAdmin
1. Open **phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Choose the file: `fix_applicants_status.sql`
5. Click **Go**

---

## After Running The Fix

### Test Each Button:

1. **Go to Recruitment Dashboard**
   - URL: `http://localhost:3000/dashboard/recruitment`
   - Click **Applications** tab

2. **Test Quick Actions (Table Row Buttons)**
   - ✅ Click **Eye icon** (View) - Should open modal
   - ✅ Click **Green Check** (Accept) - Should change to "Accepted"
   - ✅ Click **Red X** (Reject) - Should change to "Rejected"
   - ✅ Click **Yellow Clock** (Review) - Should change to "Reviewing"

3. **Test Modal Actions**
   - Click **Eye icon** to open an application
   - Try clicking buttons inside the modal
   - All should work now!

---

## Troubleshooting

### If you still get errors:

**Error: Column 'reviewed_at' already exists**
- This is okay! It means the column was already added
- Continue with the other SQL commands

**Error: Unknown column 'reviewed_at'**
- Run this SQL again:
```sql
ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;
```

**Error: Data truncated still appears**
- Make sure you ran ALL the SQL commands
- Verify with:
```sql
SHOW COLUMNS FROM applicants LIKE 'status';
```
- Should show: `enum('applied','reviewing','accepted','rejected')`

---

## What Database Name Am I Using?

Check your `.env` file:
```
c:\EMS-System\backend\.env
```

Look for this line:
```
DB_DATABASE=your_database_name
```

---

## Quick Verification SQL

Run this to check if everything is correct:

```sql
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'applicants' 
AND COLUMN_NAME IN ('status', 'reviewed_at', 'reviewed_by')
ORDER BY ORDINAL_POSITION;
```

**Expected Results:**
| COLUMN_NAME | COLUMN_TYPE | IS_NULLABLE | COLUMN_DEFAULT |
|-------------|-------------|-------------|----------------|
| status | enum('applied','reviewing','accepted','rejected') | NO | applied |
| reviewed_by | bigint(20) unsigned | YES | NULL |
| reviewed_at | timestamp | YES | NULL |

---

## Still Not Working?

If you're still having issues after running the SQL:

1. **Clear Laravel Cache**
   ```cmd
   cd c:\EMS-System\backend
   php artisan config:clear
   php artisan cache:clear
   ```

2. **Restart Apache/MySQL**
   - Open XAMPP Control Panel
   - Stop Apache and MySQL
   - Start them again

3. **Check Browser Console**
   - Press F12 in browser
   - Check for JavaScript errors
   - Check Network tab for API errors

4. **Verify API Response**
   - When you click a button, check the Network tab
   - Look for the request to `/api/recruitment/applications/{id}/status`
   - See what error message is returned

---

## Need More Help?

Share:
1. Your database name (from `.env` file)
2. Result of: `SHOW COLUMNS FROM applicants LIKE 'status';`
3. Any error messages from browser console (F12)
