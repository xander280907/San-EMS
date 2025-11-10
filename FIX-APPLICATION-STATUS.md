# Fix Application Status Error

## Problem
The application status update was failing with error:
```
SQLSTATE[01000]: Warning: 1265 Data truncated for column 'status' at row 1
```

## Root Cause
The database `applicants` table had different ENUM values than what the application was using:

**Old ENUM values (in database):**
- `applied`, `screening`, `interviewed`, `offer`, `hired`, `rejected`

**New ENUM values (needed by application):**
- `applied`, `reviewing`, `accepted`, `rejected`

## Solution

### Step 1: Run the Migration

**Option A: Using the batch file**
1. Open Command Prompt
2. Navigate to backend folder:
   ```cmd
   cd c:\EMS-System\backend
   ```
3. Run the batch file:
   ```cmd
   fix-applicants-migration.bat
   ```

**Option B: Manual command**
```cmd
cd c:\EMS-System\backend
php artisan migrate --path=database/migrations/2025_11_08_000001_update_applicants_status_enum.php
```

### Step 2: Verify the Migration

After running the migration:
1. Go to your recruitment dashboard
2. Try clicking the action buttons (Accept, Reject, Review)
3. They should now work without errors!

## What the Migration Does

1. **Updates existing data:**
   - `screening` → `reviewing`
   - `interviewed` → `reviewing`
   - `offer` → `accepted`
   - `hired` → `accepted`
   - `rejected` → `rejected` (stays the same)
   - `applied` → `applied` (stays the same)

2. **Changes the ENUM column:**
   - Updates `status` column to accept: `applied`, `reviewing`, `accepted`, `rejected`

3. **Adds new field:**
   - Adds `reviewed_at` timestamp field to track when application was reviewed

## Files Modified

### Database:
1. `backend/database/migrations/2025_01_01_000013_create_applicants_table.php`
   - Updated status ENUM values
   - Added `reviewed_at` field

2. `backend/database/migrations/2025_11_08_000001_update_applicants_status_enum.php` (NEW)
   - Migration to update existing database

### Model:
1. `backend/app/Models/Applicant.php`
   - Added `reviewed_at` to fillable
   - Added datetime cast for `reviewed_at`

## New Status Workflow

```
Applied (New) → Reviewing (In Progress) → Accepted/Rejected (Final)
```

- **Applied**: Initial status when someone applies
- **Reviewing**: HR is actively reviewing the application
- **Accepted**: Application approved
- **Rejected**: Application declined

## Testing After Migration

Test all three buttons:

1. **Review Button (Yellow/Clock icon)**
   - Click on "Applied" application
   - Should change status to "Reviewing"
   - ✅ Should work now

2. **Accept Button (Green/Check icon)**
   - Click on any application
   - Should change status to "Accepted"
   - ✅ Should work from both table and modal

3. **Reject Button (Red/X icon)**
   - Click on any application
   - Should change status to "Rejected"
   - ✅ Should work from both table and modal

## Rollback (If Needed)

If you need to revert the changes:
```cmd
cd c:\EMS-System\backend
php artisan migrate:rollback --step=1
```

This will:
- Revert the ENUM to old values
- Remove the `reviewed_at` field
- Convert data back to old status values

## Notes

- The migration preserves all existing application data
- Status changes are automatically mapped to new values
- The `reviewed_at` field will be NULL for old applications (until they're reviewed again)
- The `reviewed_by` field tracks which HR/Admin reviewed the application
