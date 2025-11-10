@echo off
echo Running database migration to fix applicants status enum...
php artisan migrate --path=database/migrations/2025_11_08_000001_update_applicants_status_enum.php
echo.
echo Migration completed!
echo.
pause
