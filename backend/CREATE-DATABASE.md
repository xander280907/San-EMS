# Create Database

The database `ph_ems` doesn't exist yet. You need to create it.

## Option 1: Using MySQL Command Line

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## Option 2: Using XAMPP phpMyAdmin

1. Open http://localhost/phpmyadmin
2. Click "New" on the left sidebar
3. Database name: `ph_ems`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

## Option 3: Using MySQL Workbench or Other GUI

Create a database named `ph_ems` with:
- Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

## After Creating Database

Then run:
```bash
cd C:\EMS-System\backend
C:\xampp\php\php.exe artisan migrate:fresh --seed
```

This will:
- Create all tables
- Seed with default data
- Create admin and HR users

**Login credentials after seeding:**
- Admin: `admin@test.local` / `password`
- HR: `hr@test.local` / `password`








