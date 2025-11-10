# Testing the Announcement Feature

## Prerequisites Check

Before testing, ensure you have:
- ✅ PHP installed (version 8.1 or higher)
- ✅ Composer installed
- ✅ Node.js installed (v22.20.0 ✓ Detected)
- ✅ MySQL/MariaDB running
- ✅ Database created (ph_ems)

## Step 1: Install PHP (If Not Installed)

### Option A: XAMPP (Recommended for Windows)
1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP to `C:\xampp`
3. Add PHP to PATH:
   - Open System Environment Variables
   - Edit PATH variable
   - Add: `C:\xampp\php`
4. Restart your terminal

### Option B: PHP Standalone
1. Download PHP from https://windows.php.net/download/
2. Extract to `C:\php`
3. Add to PATH: `C:\php`
4. Copy `php.ini-development` to `php.ini`
5. Enable required extensions in php.ini

### Verify PHP Installation
```bash
php --version
```

## Step 2: Setup Backend

### 2.1 Install Dependencies (if not done)
```bash
cd backend
php composer.phar install
```

### 2.2 Configure Environment
Check your `.env` file has these settings:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ph_ems
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

### 2.3 Generate Keys (if not done)
```bash
php artisan key:generate
php artisan jwt:secret
```

### 2.4 Run Migrations with Sample Data
```bash
php artisan migrate:fresh --seed
```

This will create:
- 3 roles (admin, hr, employee)
- 2 users (admin, hr)
- 3 departments
- 5 leave types
- 4 deduction types
- **4 sample announcements** ← New!

### 2.5 Start Backend Server
```bash
php artisan serve
```
Backend will run on: http://localhost:8000

## Step 3: Setup Frontend

### 3.1 Install Dependencies (if not done)
```bash
cd frontend-web
npm install
```

### 3.2 Start Frontend Server
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

## Step 4: Test Announcement Feature

### Test Case 1: View Announcements (All Users)

1. **Open browser**: http://localhost:5173
2. **Login as Admin**:
   - Email: `admin@test.local`
   - Password: `password`
3. **Navigate to Announcements** (click in sidebar)
4. **Verify you see 4 sample announcements**:
   - ✅ "Welcome to the EMS System" (normal, all employees)
   - ✅ "Upcoming Holiday - November 30" (urgent, all employees) - RED border
   - ✅ "IT Department: System Maintenance" (normal, IT dept only)
   - ✅ "HR: Benefits Enrollment Period" (normal, all employees)

### Test Case 2: Search Functionality

1. **In the search box**, type: "holiday"
2. **Verify**: Only the holiday announcement shows
3. **Clear search**
4. **Type**: "system"
5. **Verify**: Welcome and IT Maintenance announcements show

### Test Case 3: Filter Urgent

1. **Check the "Urgent only" checkbox**
2. **Verify**: Only "Upcoming Holiday" announcement shows (red border)
3. **Uncheck the filter**
4. **Verify**: All announcements show again

### Test Case 4: Create Announcement (Admin/HR Only)

1. **Click "New Announcement" button** (top right)
2. **Fill out the form**:
   - Title: "Test Announcement"
   - Content: "This is a test announcement to verify the feature works correctly."
   - Visibility: "All Employees"
   - Mark as urgent: ✓ (check it)
3. **Click "Create Announcement"**
4. **Verify**:
   - ✅ Modal closes
   - ✅ New announcement appears at the top
   - ✅ Has red border (urgent)
   - ✅ Shows "Urgent" badge
   - ✅ Shows "All Employees" badge
   - ✅ Shows your name as creator
   - ✅ Shows current timestamp

### Test Case 5: Create Department-Specific Announcement

1. **Click "New Announcement"**
2. **Fill out**:
   - Title: "IT Team Meeting"
   - Content: "Mandatory team meeting this Friday at 2 PM in Conference Room A."
   - Visibility: "Specific Department"
   - Department: "Information Technology"
   - Mark as urgent: (leave unchecked)
3. **Click "Create Announcement"**
4. **Verify**:
   - ✅ Shows "Information Technology" badge (blue)
   - ✅ Has blue border (not urgent)

### Test Case 6: Edit Announcement

1. **Find any announcement**
2. **Click the Edit button** (blue pencil icon)
3. **Modify the title**: Add " - UPDATED" to the end
4. **Click "Update Announcement"**
5. **Verify**:
   - ✅ Modal closes
   - ✅ Title shows the update
   - ✅ Other fields remain unchanged

### Test Case 7: Delete Announcement

1. **Find the test announcement you created**
2. **Click the Delete button** (red trash icon)
3. **Confirm deletion** in the dialog
4. **Verify**:
   - ✅ Announcement disappears from list
   - ✅ No error messages

### Test Case 8: Employee View (Read-Only)

1. **Logout** (if there's a logout button, or clear localStorage)
2. **Create an employee user** (you'll need to do this via database or create a registration)
   
   OR use SQL:
   ```sql
   INSERT INTO users (email, password, first_name, last_name, role_id, email_verified_at, created_at, updated_at)
   VALUES ('employee@test.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'Employee', 3, NOW(), NOW(), NOW());
   ```
   Password: `password`

3. **Login as employee**: `employee@test.local` / `password`
4. **Navigate to Announcements**
5. **Verify**:
   - ✅ Can see announcements
   - ❌ NO "New Announcement" button
   - ❌ NO Edit buttons on announcements
   - ❌ NO Delete buttons on announcements
   - ✅ Can use search
   - ✅ Can use urgent filter

### Test Case 9: API Testing (Optional - Using Browser DevTools)

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Refresh Announcements page**
4. **Find the request**: `GET /api/announcements`
5. **Verify response**:
   - Status: 200 OK
   - Response includes array of announcements
   - Each announcement has: id, title, content, visibility, is_urgent, creator, etc.

6. **Create an announcement**
7. **Find the request**: `POST /api/announcements`
8. **Verify**:
   - Status: 201 Created
   - Response includes the new announcement with ID

### Test Case 10: Permission Testing

1. **Logout and login as employee** (if you created one)
2. **Open DevTools Console**
3. **Try to create announcement via API**:
   ```javascript
   fetch('http://localhost:8000/api/announcements', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     },
     body: JSON.stringify({
       title: 'Unauthorized Test',
       content: 'This should fail',
       visibility: 'all'
     })
   }).then(r => r.json()).then(console.log)
   ```
4. **Verify**: Response is 403 Forbidden with error message

## Expected Results Summary

### ✅ All Tests Should Pass:
- [x] View announcements list
- [x] See 4 sample announcements
- [x] Search works correctly
- [x] Urgent filter works
- [x] Create new announcement (admin/hr)
- [x] Create department-specific announcement
- [x] Edit existing announcement
- [x] Delete announcement
- [x] Employee can view but not manage
- [x] API returns correct responses
- [x] Permissions enforced (403 for employees trying to create)

## Troubleshooting

### Issue: "Failed to load announcements"
**Solution**: 
- Check backend is running on port 8000
- Check database connection in `.env`
- Check browser console for CORS errors

### Issue: "403 Forbidden" when creating
**Solution**:
- Verify you're logged in as admin or hr
- Check token is valid in localStorage
- Check role middleware in `routes/api.php`

### Issue: No announcements showing
**Solution**:
- Run `php artisan migrate:fresh --seed` again
- Check database has announcements table with data
- Check API response in Network tab

### Issue: Edit/Delete buttons not showing
**Solution**:
- Verify you're logged in as admin or hr
- Check user object has role property
- Check `canManage` logic in Announcements.jsx

### Issue: Department dropdown empty
**Solution**:
- Verify departments exist in database
- Check departmentAPI.getAll() is working
- Check Network tab for API errors

## Success Criteria

The announcement feature is working correctly if:
1. ✅ Admin/HR can create, edit, and delete announcements
2. ✅ Employees can view but not manage announcements
3. ✅ Search and filter work correctly
4. ✅ Urgent announcements are highlighted in red
5. ✅ Department-specific announcements show correct badge
6. ✅ All CRUD operations work without errors
7. ✅ Role-based permissions are enforced
8. ✅ UI is responsive and user-friendly

---

## Quick Test Commands

If PHP is installed, run these in order:

```bash
# Terminal 1 - Backend
cd backend
php artisan migrate:fresh --seed
php artisan serve

# Terminal 2 - Frontend
cd frontend-web
npm run dev
```

Then open: http://localhost:5173

Login: `admin@test.local` / `password`

Navigate to: Announcements

**That's it! Start testing! 🚀**
