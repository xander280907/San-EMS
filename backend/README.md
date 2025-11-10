# Philippine Employee Management System - Backend API

A comprehensive Laravel-based Employee Management System designed for Philippine businesses with automated payroll processing including PhilHealth, SSS, Pag-IBIG, and BIR Withholding Tax.

## Features

### Core Modules
1. **Employee Management** - Complete employee profiles and information
2. **Payroll Management** - Automated Philippine payroll with statutory deductions
3. **Leave Management** - Leave requests and approvals workflow
4. **Attendance/Time Tracking** - Clock in/out and timesheet management
5. **Department Management** - Department structure and organization
6. **Announcements** - Company-wide and department announcements
7. **Recruitment** - Job postings and applicant tracking
8. **Reports & Analytics** - Comprehensive reporting and analytics

### Philippine Payroll Features
- **PhilHealth** - Automatic contribution calculation (2024 rates)
- **SSS** - Social Security System contribution (graded rates)
- **Pag-IBIG** - Pag-IBIG Fund contribution (HDMF)
- **BIR Withholding Tax** - TRAIN Law graduated tax brackets
- **13th Month Pay** - Automatic computation
- **Holiday Pay** - Regular and special holiday rates
- **Overtime Pay** - 125% of hourly rate
- **Custom Deductions** - Flexible deduction system

### User Roles
- **Admin** - Full system access
- **HR** - Employee and payroll management
- **Employee** - Self-service portal

## Technology Stack

- **Framework**: Laravel 10.x (PHP 8.2+)
- **Database**: MySQL 8.0+
- **Authentication**: JWT (tymon/jwt-auth)
- **PDF Generation**: DomPDF
- **Excel Export**: Maatwebsite Excel
- **API**: RESTful

## Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- MySQL 8.0 or higher
- Node.js 18+ (optional, for frontend assets)

### Setup Steps

1. **Install Dependencies**
```bash
composer install
```

2. **Configure Environment**
```bash
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
```

3. **Update .env File**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password
APP_TIMEZONE=Asia/Manila
```

4. **Create Database**
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Run Migrations**
```bash
php artisan migrate --seed
```

6. **Start Server**
```bash
php artisan serve
```

API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/register` - Register
- `POST /api/logout` - Logout
- `GET /api/me` - Get current user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Payroll
- `GET /api/payroll` - List payrolls
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll/{id}` - Get payroll
- `GET /api/payroll/{id}/payslip` - Generate payslip
- `GET /api/payroll/employee/{id}` - Get employee payrolls

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance` - List attendances
- `GET /api/attendance/employee/{id}` - Get employee attendance

### Leaves
- `GET /api/leaves` - List leaves
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/{id}` - Get leave
- `PUT /api/leaves/{id}/approve` - Approve leave
- `PUT /api/leaves/{id}/reject` - Reject leave

### Departments
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/departments/{id}` - Get department
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Announcements
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements/{id}` - Get announcement
- `PUT /api/announcements/{id}` - Update announcement
- `DELETE /api/announcements/{id}` - Delete announcement

### Recruitment
- `GET /api/recruitment/jobs` - List job postings
- `POST /api/recruitment/jobs` - Create job posting
- `GET /api/recruitment/jobs/{id}` - Get job posting
- `POST /api/recruitment/apply` - Submit application
- `GET /api/recruitment/applications` - List applications

### Reports
- `GET /api/reports/payroll` - Payroll report
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/leaves` - Leave report
- `GET /api/reports/department` - Department report

## Default Login Credentials

After running seeders:

**Admin**
- Email: `admin@ph-ems.local`
- Password: `password`

**HR**
- Email: `hr@ph-ems.local`
- Password: `password`

## Philippine Payroll Configuration

The system automatically calculates:

### PhilHealth (2024 Rates)
- 1% for income up to ₱10,000
- 2% for income ₱10,001 - ₱80,000
- Fixed ₱1,600 for income above ₱80,000

### SSS Contribution
- Graded monthly contribution based on salary range
- Maximum ₱500.00

### Pag-IBIG
- 1% for salary up to ₱1,500
- 2% for salary above ₱1,500

### Withholding Tax (TRAIN Law)
- Progressive tax rates from 0% to 35%
- Based on annual income brackets

## File Structure

```
backend/
├── app/
│   ├── Http/Controllers/    # API Controllers
│   ├── Models/              # Eloquent Models
│   ├── Services/            # Business Logic Services
│   └── Middleware/          # Custom Middleware
├── database/
│   ├── migrations/          # Database Migrations
│   └── seeders/            # Database Seeders
├── routes/
│   └── api.php             # API Routes
└── config/                 # Configuration Files
```

## License

MIT License

## Support

For issues or questions, please refer to the documentation or contact the development team.
