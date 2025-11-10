@echo off
echo ========================================
echo Philippine EMS - Quick Setup Script
echo ========================================
echo.

echo Step 1: Generating APP_KEY...
php artisan key:generate
if %errorlevel% neq 0 (
    echo ERROR: PHP not found in PATH
    echo Please run: C:\xampp\php\php.exe artisan key:generate
    pause
    exit /b 1
)

echo.
echo Step 2: Generating JWT_SECRET...
php artisan jwt:secret

echo.
echo Step 3: Clearing cache...
php artisan config:clear
php artisan cache:clear

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before running migrations:
echo 1. Edit .env file and set DB_PASSWORD
echo 2. Make sure database 'ph_ems' exists
echo.
echo Then run:
echo   php artisan migrate:fresh --seed
echo.
echo Login credentials:
echo   Admin: admin@test.local / password
echo   HR: hr@test.local / password
echo.
pause

