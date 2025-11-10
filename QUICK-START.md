# Philippine EMS - Quick Start Guide

Get your Employee Management System up and running in 5 minutes!

## Pre-flight Checklist

Before you begin, make sure you have:
- [ ] PHP 8.2+ installed
- [ ] Composer installed
- [ ] MySQL running
- [ ] Node.js 18+ installed

## Installation (3 Steps)

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
composer install

# Configure environment
copy .env.example .env

# Edit .env file with your database credentials:
# DB_DATABASE=ph_ems
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Generate keys
php artisan key:generate
php artisan jwt:secret

# Create database
mysql -u root -p
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run migrations
php artisan migrate --seed

# Start server
php artisan serve
```

✅ Backend API running on http://localhost:8000
⚠️ **Note:** This is the API only - no login page here!

### Step 2: Frontend Setup (2 minutes)

```bash
# Navigate to frontend
cd frontend-web

# Install dependencies
npm install

# Start server
npm run dev
```

✅ Frontend running on http://localhost:3000
🎯 **This is where the login page is!**

### Step 3: Login (1 minute)

1. **Open http://localhost:3000** (NOT 8000 - that's just the API!)
2. Login with:
   - Email: `admin@test.local`
   - Password: `password`

🎉 **You're done!** Your Philippine EMS is ready to use!

## Default Credentials

**Admin Account:**
- Email: admin@test.local
- Password: password
- Access: Everything

**HR Account:**
- Email: hr@test.local
- Password: password
- Access: Employee & Payroll Management

## ⚠️ Important: Where to Access the Login Page

- **✅ Login Page (Frontend):** http://localhost:3000
- **❌ Backend API Only:** http://localhost:8000 (no UI, just API endpoints)

## What You Can Do Now

1. **Explore Modules:** Click through all 8 modules
2. **Create Employees:** Add your first employee
3. **Process Payroll:** See Philippine deductions in action
4. **Test Attendance:** Clock in/out functionality
5. **Manage Leaves:** Create leave requests
6. **View Reports:** Check analytics

## Troubleshooting

**PHP not found?**
- Add PHP to PATH or use XAMPP

**Composer not found?**
- Download from https://getcomposer.org

**Database error?**
- Check MySQL is running
- Verify .env credentials
- Ensure database exists

**Port already in use?**
- Backend: php artisan serve --port=8001
- Frontend: Edit vite.config.js

## Need Help?

📖 Full documentation: README.md
📖 Detailed setup: SETUP-GUIDE.md
📖 Project summary: PROJECT-SUMMARY.md

## Next Steps

1. Customize company settings
2. Add your departments
3. Configure leave types
4. Add employees
5. Process first payroll
6. Test all modules

---

**Happy managing! 🇵🇭**
