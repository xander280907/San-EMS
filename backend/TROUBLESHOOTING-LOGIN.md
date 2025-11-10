# Troubleshooting Login 500 Error

If you're getting a 500 error when trying to log in, follow these steps:

## Step 1: Enable Debug Mode

Make sure `APP_DEBUG=true` in your `.env` file so you can see detailed error messages:

```env
APP_DEBUG=true
APP_ENV=local
```

Then clear config cache:
```bash
php artisan config:clear
```

## Step 2: Check Database Setup

1. **Verify database connection:**
   ```bash
   php artisan migrate:status
   ```

2. **Ensure database is seeded:**
   ```bash
   php artisan db:seed --class=DatabaseSeeder
   ```

3. **Fix permissions format:**
   ```bash
   php artisan fix:role-permissions
   ```
   
   Or use the quick script:
   ```bash
   php database/fix-permissions.php
   ```

## Step 3: Verify JWT Secret

```bash
php artisan jwt:secret
```

## Step 4: Check Required Data

Make sure you have:
- Roles in the database (admin, hr, employee)
- At least one user (admin@ph-ems.local)
- User has a valid role_id

## Step 5: Check Logs

View Laravel logs:
```bash
# Windows PowerShell
Get-Content storage\logs\laravel.log -Tail 50

# Linux/Mac
tail -f storage/logs/laravel.log
```

## Step 6: Test Login Again

After making changes, try logging in with:
- Email: `admin@ph-ems.local`
- Password: `password`

The error message should now show more details about what's failing.

## Common Issues

### Issue: "User role not found"
- Solution: Ensure user has a valid `role_id` and the role exists in database

### Issue: "Could not create token"
- Solution: Run `php artisan jwt:secret`

### Issue: Database connection error
- Solution: Check `.env` file has correct DB credentials

### Issue: Permissions error
- Solution: Run `php artisan fix:role-permissions`

## Still Having Issues?

1. Try a fresh database:
   ```bash
   php artisan migrate:fresh --seed
   ```

2. Clear all caches:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

3. Check if backend server is running:
   ```bash
   php artisan serve
   ```

4. Verify the API endpoint:
   - Backend should be at `http://localhost:8000`
   - Frontend proxy should forward `/api/*` to backend

