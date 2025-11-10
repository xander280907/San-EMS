# Setup Complete - Final Steps!

## ✅ What's Been Done:
1. ✅ Created `.env` file
2. ✅ Enabled PHP GD and ZIP extensions
3. ✅ Installed Composer dependencies
4. ✅ Fixed Laravel bootstrap files
5. ✅ Generated APP_KEY
6. ✅ Generated JWT_SECRET
7. ✅ Cleared cache

## ⚠️ What You Need To Do:

### Step 1: Create Database

The database `ph_ems` needs to be created. Choose one method:

**Method A - phpMyAdmin (Easiest):**
1. Open http://localhost/phpmyadmin
2. Click "New" → Database name: `ph_ems` → Collation: `utf8mb4_unicode_ci` → Create

**Method B - MySQL Command Line:**
```bash
C:\xampp\mysql\bin\mysql.exe -u root -p
```
Then run:
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 2: Update .env Database Password

If your MySQL has a password, edit `backend/.env`:
```env
DB_PASSWORD=your_password
```
(If no password, leave it empty: `DB_PASSWORD=`)

### Step 3: Run Migrations

```bash
cd C:\EMS-System\backend
C:\xampp\php\php.exe artisan migrate:fresh --seed
```

### Step 4: Restart Backend Server

Stop current server (Ctrl+C) and restart:
```bash
cd C:\EMS-System\backend
C:\xampp\php\php.exe artisan serve
```

### Step 5: Test Login

1. Go to http://localhost:3000
2. Login with:
   - Email: `admin@test.local`
   - Password: `password`

## 🎉 You're Done!

The 500 error should now be fixed. All setup is complete except for creating the database.








