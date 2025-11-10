# Login Error Fix Guide

If you're getting a 500 error when trying to login, follow these steps:

## Step 1: Reseed the Database

The database needs to be reseeded with the new email format:

```bash
cd backend
php artisan migrate:fresh --seed
```

This will:
- Drop all tables
- Recreate them
- Seed with the new credentials:
  - **Admin**: `admin@test.local` / `password`
  - **HR**: `hr@test.local` / `password`

## Step 2: Verify JWT Secret is Set

Make sure JWT secret is configured:

```bash
cd backend
php artisan jwt:secret
```

This generates a JWT secret key in your `.env` file.

## Step 3: Clear Cache

Clear application cache:

```bash
cd backend
php artisan config:clear
php artisan cache:clear
```

## Step 4: Verify Database Connection

Make sure your `.env` file has correct database settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password
```

## Step 5: Check Backend is Running

Make sure the backend server is running:

```bash
cd backend
php artisan serve
```

The API should be available at `http://localhost:8000`

## Step 6: Test Login

Try logging in with:
- Email: `admin@test.local`
- Password: `password`

## Troubleshooting

### Empty Error Response `{}`

If you get an empty error response, it usually means:
1. JWT secret is not set - run `php artisan jwt:secret`
2. Database connection failed - check `.env` database settings
3. User doesn't exist - reseed the database with `php artisan migrate:fresh --seed`

### Check Laravel Logs

```bash
cd backend
# Windows PowerShell
Get-Content storage\logs\laravel.log -Tail 100

# Or check if log file exists
Test-Path storage\logs\laravel.log
```

### Enable Debug Mode

Make sure in `.env`:
```env
APP_DEBUG=true
APP_ENV=local
```

This will show detailed error messages.

