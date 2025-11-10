# Fix 500 Login Error - Step by Step

## The Problem
You're getting a 500 error because the `.env` file was missing. I've created it, but you need to complete the setup.

## Steps to Fix (Run these in order):

### Step 1: Update Database Password
Edit `backend/.env` file and set your MySQL password:
```env
DB_PASSWORD=your_mysql_password
```
(If your MySQL has no password, leave it empty: `DB_PASSWORD=`)

### Step 2: Generate APP_KEY
Open terminal in `backend` folder and run:
```bash
php artisan key:generate
```

### Step 3: Generate JWT_SECRET
```bash
php artisan jwt:secret
```

### Step 4: Create Database (if not exists)
Open MySQL and run:
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 5: Run Migrations and Seed Database
```bash
php artisan migrate:fresh --seed
```

This creates all tables and seeds with:
- Admin: `admin@test.local` / `password`
- HR: `hr@test.local` / `password`

### Step 6: Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
```

### Step 7: Restart Backend Server
Stop the current server (Ctrl+C) and restart:
```bash
php artisan serve
```

### Step 8: Test Login
Go to http://localhost:3000 and login with:
- Email: `admin@test.local`
- Password: `password`

## If PHP Command Not Found

If you get "php is not recognized":
1. Use XAMPP: Navigate to `C:\xampp\php\php.exe artisan key:generate`
2. Or add PHP to your PATH
3. Or use full path to PHP executable

## Quick Command Summary
```bash
cd backend
php artisan key:generate
php artisan jwt:secret
# Edit .env - set DB_PASSWORD
php artisan migrate:fresh --seed
php artisan config:clear
php artisan cache:clear
php artisan serve
```

