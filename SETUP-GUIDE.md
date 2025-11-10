# Philippine EMS - Complete Setup Guide

This guide will help you set up the entire Philippine Employee Management System on your local machine.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] PHP 8.2 or higher installed
- [ ] Composer installed globally
- [ ] MySQL 8.0 or higher installed and running
- [ ] Node.js 18+ and npm/yarn installed
- [ ] Git installed (optional)
- [ ] Code editor (VS Code recommended)

## Quick Start (Step-by-Step)

### Step 1: Install PHP and Composer

**Windows:**
- Download PHP from https://windows.php.net/download/
- Download Composer from https://getcomposer.org/download/
- Or install XAMPP/WAMP which includes both

**After installation:**
```bash
php --version  # Should show PHP 8.2+
composer --version  # Should show Composer version
```

### Step 2: Install MySQL

**Windows:**
- Download MySQL from https://dev.mysql.com/downloads/installer/
- Install MySQL Server
- Note your MySQL root password

**Verify installation:**
```bash
mysql --version
```

### Step 3: Clone/Download the Project

```bash
# If using Git
git clone <repository-url>
cd EMS-System

# Or download and extract the ZIP file
```

### Step 4: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
composer install
```

If Composer is not in PATH, use:
```bash
php composer.phar install
```

3. **Configure environment:**
```bash
# Copy .env.example to .env
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret
```

4. **Edit .env file** with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
APP_TIMEZONE=Asia/Manila
```

5. **Create database:**
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

6. **Run migrations:**
```bash
php artisan migrate --seed
```

This will create all database tables and seed initial data including:
- Default roles (Admin, HR, Employee)
- Test users
- Departments
- Leave types
- Philippine deduction types

7. **Start backend server:**
```bash
php artisan serve
```

Backend API will be running at `http://localhost:8000`

### Step 5: Frontend Setup

1. **Open a new terminal and navigate to frontend:**
```bash
cd frontend-web
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

Frontend will be running at `http://localhost:3000`

### Step 6: Access the Application

1. Open browser and go to: `http://localhost:3000`
2. Login with default credentials:

**Admin Account:**
- Email: `admin@ph-ems.local`
- Password: `password`

**HR Account:**
- Email: `hr@ph-ems.local`
- Password: `password`

## Troubleshooting

### PHP Not Found
**Problem:** Command `php` is not recognized

**Solution:**
- Add PHP to your system PATH
- Or use full path: `C:\xampp\php\php.exe artisan serve`

### Composer Not Found
**Problem:** Command `composer` is not recognized

**Solution:**
- Install Composer globally
- Or download `composer.phar` and use: `php composer.phar install`

### Database Connection Error
**Problem:** Could not connect to database

**Solutions:**
1. Check if MySQL service is running
2. Verify credentials in `.env` file
3. Ensure database `ph_ems` exists
4. Check MySQL port (default: 3306)

### Migration Errors
**Problem:** Error running migrations

**Solutions:**
1. Check database credentials in `.env`
2. Ensure database exists
3. Check MySQL user has proper permissions
4. Try dropping and recreating database

### Port Already in Use
**Problem:** Port 8000 or 3000 already in use

**Solutions:**
- Backend: `php artisan serve --port=8001`
- Frontend: Edit `vite.config.js` and change port

### JWT Token Errors
**Problem:** JWT authentication not working

**Solution:**
```bash
php artisan jwt:secret
```

### Node Modules Issues
**Problem:** Frontend dependencies not installing

**Solutions:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear npm cache: `npm cache clean --force`

## Project Structure

```
EMS-System/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/    # API Controllers (8 modules)
│   │   ├── Models/              # Eloquent Models
│   │   ├── Services/            # Business Logic
│   │   └── Middleware/          # Auth & Role Middleware
│   ├── database/
│   │   ├── migrations/          # 13 database migrations
│   │   └── seeders/            # Database seeders
│   ├── routes/
│   │   └── api.php             # All API routes
│   └── config/                 # Configuration files
│
├── frontend-web/               # React Application
│   ├── src/
│   │   ├── components/          # React Components
│   │   ├── pages/               # 8 Module Pages
│   │   ├── services/            # API Services
│   │   └── context/             # React Context (Auth)
│   ├── package.json
│   └── vite.config.js
│
└── README.md                   # Main documentation
```

## API Documentation

Once the backend is running, you can access:
- API Base URL: `http://localhost:8000/api`
- API Documentation: See `backend/README.md`

### Key Endpoints:

**Authentication:**
- POST `/api/login` - Login
- POST `/api/logout` - Logout
- GET `/api/me` - Get current user

**Employee Management:**
- GET `/api/employees` - List all employees
- POST `/api/employees` - Create employee
- GET `/api/employees/{id}` - Get employee
- PUT `/api/employees/{id}` - Update employee

**Payroll Management:**
- POST `/api/payroll/process` - Process payroll
- GET `/api/payroll/{id}` - Get payroll
- GET `/api/payroll/{id}/payslip` - Generate payslip

**Attendance:**
- POST `/api/attendance/clock-in` - Clock in
- POST `/api/attendance/clock-out` - Clock out

**Leaves:**
- POST `/api/leaves` - Request leave
- PUT `/api/leaves/{id}/approve` - Approve leave

**Departments, Announcements, Recruitment, Reports:**
See `backend/README.md` for complete API documentation.

## Next Steps

After successful installation:

1. **Login and Explore:**
   - Login as Admin
   - Explore all 8 modules
   - Create test employees

2. **Test Payroll:**
   - Create employees
   - Process a payroll
   - View calculated PhilHealth, SSS, Pag-IBIG, and tax

3. **Customize:**
   - Update company information
   - Add departments
   - Configure leave types
   - Customize announcements

4. **Mobile App:**
   - React Native app can be added later
   - Uses same backend API

## Production Deployment

For production deployment:

1. **Backend:**
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Use proper database credentials
   - Configure HTTPS
   - Run: `php artisan config:cache`
   - Run: `php artisan route:cache`

2. **Frontend:**
   - Run: `npm run build`
   - Deploy `dist` folder to web server
   - Configure API URL

3. **Security:**
   - Change all default passwords
   - Use strong JWT secret
   - Enable HTTPS
   - Configure CORS properly
   - Regular backups

## Support

If you encounter issues:
1. Check this guide first
2. Review error messages
3. Check Laravel logs: `backend/storage/logs/laravel.log`
4. Verify all services are running
5. Check network/firewall settings

## Resources

- Laravel Documentation: https://laravel.com/docs
- React Documentation: https://react.dev/
- Philippine BIR: https://www.bir.gov.ph/
- SSS: https://www.sss.gov.ph/
- PhilHealth: https://www.philhealth.gov.ph/
- Pag-IBIG: https://www.pagibigfund.gov.ph/

---

**Congratulations!** You now have a fully functional Philippine Employee Management System running on your machine! 🎉
