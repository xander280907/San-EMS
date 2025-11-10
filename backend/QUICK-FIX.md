# Quick Fix for Login 500 Error

## Step 1: Check Browser Console

Open your browser's developer console (F12) and look for the error message. You should now see:
- Full error data logged to console
- Detailed error message on the login form

## Step 2: Most Common Fixes

### Option A: Re-seed the Database (Recommended)

This will reset everything and ensure it's set up correctly:

```bash
cd backend
php artisan migrate:fresh --seed
php artisan jwt:secret
```

### Option B: Fix Permissions Only

If you want to keep existing data:

```bash
cd backend
php artisan fix:role-permissions
```

### Option C: Manual Database Check

1. Make sure database exists and is accessible
2. Check if roles table has data:
   ```sql
   SELECT * FROM roles;
   ```
3. Check if users table has data:
   ```sql
   SELECT * FROM users;
   ```
4. Verify user has role_id:
   ```sql
   SELECT u.*, r.name as role_name 
   FROM users u 
   LEFT JOIN roles r ON u.role_id = r.id;
   ```

## Step 3: Check Backend Logs

```bash
# Windows PowerShell
Get-Content storage\logs\laravel.log -Tail 100

# Or check if logs directory exists
Test-Path storage\logs
```

## Step 4: Verify Environment

Make sure `.env` file has:
```env
APP_DEBUG=true
APP_ENV=local
JWT_SECRET=<should be set after running jwt:secret>
DB_CONNECTION=mysql
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password
```

## Step 5: Restart Backend Server

After making changes:
```bash
php artisan config:clear
php artisan cache:clear
php artisan serve
```

## Step 6: Check Console Output

After trying to login, check:
1. Browser console (F12) - should show "Full error data"
2. The error message on the login form
3. Share the exact error message you see

The improved error handling should now show you the exact problem!








