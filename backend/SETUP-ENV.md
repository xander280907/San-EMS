# Environment Setup Guide

## Critical: You need to run these commands after creating .env

1. **Generate APP_KEY:**
```bash
php artisan key:generate
```

2. **Generate JWT_SECRET:**
```bash
php artisan jwt:secret
```

3. **Update database credentials in .env:**
   - Edit `DB_USERNAME` if not using `root`
   - Edit `DB_PASSWORD` with your MySQL password
   - Verify `DB_DATABASE=ph_ems`

4. **Run migrations and seed:**
```bash
php artisan migrate:fresh --seed
```

5. **Clear cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

## Troubleshooting

If you get errors about missing keys, run:
```bash
php artisan key:generate
php artisan jwt:secret
```

These commands will automatically update your .env file with the generated keys.

