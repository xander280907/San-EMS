# Installation Guide for Philippine EMS Backend

## Prerequisites

Before you can run this Laravel application, you need to have the following software installed:

1. **PHP 8.2 or higher** - [Download PHP](https://windows.php.net/download/)
2. **Composer** - PHP dependency manager - [Download Composer](https://getcomposer.org/download/)
3. **MySQL 8.0 or higher** - [Download MySQL](https://dev.mysql.com/downloads/installer/)
4. **Node.js 18+** (for frontend assets) - [Download Node.js](https://nodejs.org/)

## Quick Installation Steps

### 1. Install Prerequisites

#### Windows Installation

**Option A: Using XAMPP/WAMP (Recommended for beginners)**
1. Download and install [XAMPP](https://www.apachefriends.org/) or [WAMP](https://www.wampserver.com/)
2. XAMPP includes PHP, MySQL, and Apache
3. Start Apache and MySQL from the control panel

**Option B: Individual Installation**
1. Install PHP 8.2+ and add to PATH
2. Install Composer globally
3. Install MySQL Server

### 2. Install Laravel Dependencies

Open terminal/command prompt in the `backend` directory and run:

```bash
composer install
```

### 3. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` file with your database credentials:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 4. Create Database

Create a MySQL database:
```sql
CREATE DATABASE ph_ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Migrations

```bash
php artisan migrate --seed
```

### 6. Generate JWT Secret

```bash
php artisan jwt:secret
```

### 7. Start Development Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Alternative: Using Laravel Sail (Docker)

If you prefer using Docker:

```bash
composer require laravel/sail --dev
php artisan sail:install
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
```

## Troubleshooting

### PHP not found
- Add PHP to your system PATH
- Or use full path: `C:\xampp\php\php.exe artisan serve`

### Composer not found
- Install Composer globally
- Or download `composer.phar` and use: `php composer.phar install`

### Database connection error
- Ensure MySQL service is running
- Check credentials in `.env` file
- Verify database `ph_ems` exists

### Permission issues (Linux/Mac)
- Run: `chmod -R 775 storage bootstrap/cache`
- Change ownership: `sudo chown -R www-data:www-data storage bootstrap/cache`

## Next Steps

After installation:
1. The API will be running on `http://localhost:8000`
2. API documentation: `http://localhost:8000/api/documentation`
3. Test the API with Postman or similar tool
4. Proceed to setup the React frontend

## Support

For issues or questions, please check the Laravel documentation: https://laravel.com/docs
