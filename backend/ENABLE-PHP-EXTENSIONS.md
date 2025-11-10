# Enable PHP Extensions Required

To fix the installation, you need to enable PHP extensions in `C:\xampp\php\php.ini`:

## Steps:

1. **Open php.ini:**
   - Location: `C:\xampp\php\php.ini`
   - Right-click → Open with Notepad (as Administrator)

2. **Find and uncomment these lines** (remove the semicolon `;` at the start):

```ini
;extension=gd
;extension=zip
```

Should become:
```ini
extension=gd
extension=zip
```

3. **Save the file**

4. **Restart Apache/XAMPP** (if running)

5. **Verify extensions are loaded:**
```bash
C:\xampp\php\php.exe -m | findstr /i "gd zip"
```

You should see both `gd` and `zip` in the output.

6. **Then run composer install again:**
```bash
cd C:\EMS-System\backend
C:\xampp\php\php.exe composer.phar install --no-interaction
```








