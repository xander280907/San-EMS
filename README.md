# Philippine Employee Management System (EMS)

A comprehensive, full-stack Employee Management System designed specifically for Philippine businesses with automated payroll processing including PhilHealth, SSS, Pag-IBIG, and BIR Withholding Tax calculations.

## 🚀 Features

### Core Modules (8 Complete Modules)
1. **Employee Management** - Comprehensive employee profiles and records
2. **Payroll Management** - Automated Philippine payroll with statutory deductions
3. **Leave Management** - Leave requests, approvals, and balance tracking
4. **Attendance/Time Tracking** - Clock in/out, timesheet management
5. **Department Management** - Department structure and organization
6. **Announcements** - Company-wide and department announcements
7. **Recruitment** - Job postings and applicant tracking
8. **Reports & Analytics** - Comprehensive reporting and analytics dashboards

### Philippine Payroll Compliance
- ✅ **PhilHealth** - Automatic contribution calculation (2024 rates)
- ✅ **SSS** - Social Security System contribution (graded rates table)
- ✅ **Pag-IBIG** - Pag-IBIG Fund contribution (HDMF)
- ✅ **BIR Withholding Tax** - TRAIN Law graduated tax brackets
- ✅ **13th Month Pay** - Automatic computation
- ✅ **Holiday Pay** - Regular and special holiday rates
- ✅ **Overtime Pay** - 125% of hourly rate
- ✅ **Custom Deductions** - Flexible deduction system

### User Roles & Permissions
- **Admin** - Full system access and configuration, employee management, payroll processing
- **Employee** - Self-service portal for attendance, leaves, and payslips

### Technology Stack
- **Backend**: Laravel 10.x (PHP 8.2+)
- **Database**: MySQL 8.0+
- **Web Frontend**: React 18 with Vite
- **Mobile**: React Native (iOS & Android ready)
- **Authentication**: JWT with role-based access control
- **PDF Generation**: DomPDF
- **Excel Export**: Maatwebsite Excel

## 📋 Prerequisites

- PHP 8.2 or higher
- Composer
- MySQL 8.0 or higher
- Node.js 18+ (for frontend)
- XAMPP/WAMP (Windows) or individual installations

## 🛠️ Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
```

4. Update `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password
APP_TIMEZONE=Asia/Manila
```

5. Create database:
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. Run migrations:
```bash
php artisan migrate --seed
```

7. Start backend server:
```bash
php artisan serve
```

Backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend-web
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🔐 Default Login Credentials

After running database seeders:

**Admin**
- Email: `admin@test.local`
- Password: `password`

**Employee**
- Email: `employee@test.local`
- Password: `password`

## 📁 Project Structure

```
EMS-System/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/    # API Controllers
│   │   ├── Models/              # Eloquent Models
│   │   ├── Services/            # Business Logic
│   │   └── Middleware/          # Custom Middleware
│   ├── database/
│   │   ├── migrations/          # Database Migrations
│   │   └── seeders/            # Database Seeders
│   └── routes/api.php          # API Routes
│
├── frontend-web/            # React Web Application
│   ├── src/
│   │   ├── components/         # Reusable Components
│   │   ├── pages/              # Page Components
│   │   ├── services/           # API Services
│   │   └── context/            # React Context
│   └── package.json
│
└── mobile-app/              # React Native (To be implemented)
    └── src/
```

## 🎯 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Payroll
- `GET /api/payroll` - List payrolls
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll/{id}` - Get payroll details
- `GET /api/payroll/{id}/payslip` - Generate payslip
- `GET /api/payroll/employee/{id}` - Get employee payrolls

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/employee/{id}` - Get employee attendance

### Leaves
- `GET /api/leaves` - List leaves
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/{id}/approve` - Approve leave
- `PUT /api/leaves/{id}/reject` - Reject leave

### Departments, Announcements, Recruitment, Reports
See individual README files for detailed API documentation.

## 📊 Philippine Payroll Configuration

The system automatically calculates deductions based on current Philippine regulations:

### PhilHealth (2024)
- 1% for income up to ₱10,000/month
- 2% for income ₱10,001 - ₱80,000/month
- Fixed ₱1,600 for income above ₱80,000/month

### SSS Contribution
- Graded monthly contribution (₱170 - ₱500)
- Based on salary bracket

### Pag-IBIG
- 1% for salary up to ₱1,500
- 2% for salary above ₱1,500

### Withholding Tax (TRAIN Law)
- Progressive rates: 0%, 20%, 25%, 30%, 32%, 35%
- Based on annual income brackets

## 🧪 Testing

Backend tests:
```bash
cd backend
php artisan test
```

Frontend tests:
```bash
cd frontend-web
npm test
```

## 📝 Documentation

- Backend API: See `backend/README.md`
- Frontend Setup: See `frontend-web/README.md`
- Installation Guide: See `backend/INSTALL.md`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🆘 Support

For issues or questions:
1. Check the documentation in each module's README
2. Review the API endpoints
3. Check the database seeders for sample data

## 🗺️ Roadmap

- [ ] React Native mobile app
- [ ] PDF payslip generation
- [ ] Excel report exports
- [ ] Email notifications
- [ ] SMS integration
- [ ] Advanced analytics dashboard
- [ ] Performance management module
- [ ] Training management module

## 🙏 Acknowledgments

Built with Laravel, React, and love for Philippine businesses.

---

**Note**: This system is designed for Philippine businesses and complies with BIR, SSS, PhilHealth, and Pag-IBIG regulations. Always verify calculations against official rates.
