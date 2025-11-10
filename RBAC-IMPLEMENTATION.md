# Role-Based Access Control (RBAC) Implementation

## Overview
This document explains the role-based access control system implemented in the EMS application to ensure users only see and access features appropriate to their role.

## User Roles

### 1. **Employee** (Basic User)
- Can view own attendance records
- Can request and view own leaves
- Can view announcements
- **Cannot** access employee management, payroll, departments, recruitment, or reports

### 2. **HR** (Human Resources)
- All Employee permissions, plus:
- Can manage employees (view, create, edit)
- Can view and manage all attendance records
- Can approve/reject leave requests
- Can manage departments
- Can create announcements
- Can manage recruitment
- Can view reports
- **Cannot** access payroll (admin only)

### 3. **Admin** (Administrator)
- Full system access
- All HR permissions, plus:
- Can manage payroll
- Can delete employees
- Full administrative control

## Files Changed/Created

### 1. **`src/utils/permissions.js`** (New)
Central permissions utility that defines:
- Role constants (`ROLES.ADMIN`, `ROLES.HR`, `ROLES.EMPLOYEE`)
- Permission mappings for each feature
- Helper functions:
  - `hasPermission(user, permission)` - Check if user has specific permission
  - `isAdmin(user)` - Check if user is admin
  - `isHR(user)` - Check if user is HR
  - `isEmployee(user)` - Check if user is employee
  - `canViewAll(user)` - Check if user can view all data (admin or HR)

### 2. **`src/components/ProtectedRoute.jsx`** (New)
Route protection component that:
- Checks if user is authenticated
- Verifies user has required permission for the route
- Redirects to dashboard if permission denied
- Redirects to login if not authenticated

### 3. **`src/components/Layout.jsx`** (Modified)
- Imports `hasPermission` utility
- Filters navigation menu items based on user role
- Only shows menu items the user has permission to access

### 4. **`src/pages/Dashboard.jsx`** (Modified)
- Imports `hasPermission` and `canViewAll` utilities
- Filters stat cards based on user role
- Shows different stats for employees vs. admin/HR:
  - Employees see "My Leave Requests" count
  - Admin/HR see "Pending Leaves" count
  - Payroll stat only visible to admins
  - Employee count only visible to admin/HR
  - Attendance count shows different data based on role

### 5. **`src/App.jsx`** (Modified)
- Wraps all routes with `ProtectedRoute` component
- Each route specifies required permission
- Prevents unauthorized access even via direct URL navigation

## Permission Matrix

| Feature | Employee | HR | Admin |
|---------|----------|-----|-------|
| Dashboard | ✅ | ✅ | ✅ |
| View Employees | ❌ | ✅ | ✅ |
| Edit Employees | ❌ | ✅ | ✅ |
| Delete Employees | ❌ | ❌ | ✅ |
| Payroll | ❌ | ❌ | ✅ |
| Own Attendance | ✅ | ✅ | ✅ |
| All Attendance | ❌ | ✅ | ✅ |
| Request Leave | ✅ | ✅ | ✅ |
| Approve Leave | ❌ | ✅ | ✅ |
| Departments | ❌ | ✅ | ✅ |
| View Announcements | ✅ | ✅ | ✅ |
| Create Announcements | ❌ | ✅ | ✅ |
| Recruitment | ❌ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ |

## How It Works

### 1. Navigation Menu Filtering
```javascript
// In Layout.jsx
const menuItems = allMenuItems.filter(item => hasPermission(user, item.permission))
```
Only menu items matching user's role are displayed.

### 2. Route Protection
```javascript
// In App.jsx
<Route path="payroll" element={
  <ProtectedRoute permission="payroll">
    <Payroll />
  </ProtectedRoute>
} />
```
Even if someone tries to access `/payroll` directly, they'll be redirected if they don't have permission.

### 3. Dashboard Stats Filtering
```javascript
// In Dashboard.jsx
const statCards = allStatCards.filter(card => hasPermission(user, card.permission))
```
Only relevant stats are shown based on user role.

## Testing the Implementation

### Test as Employee:
1. Login with employee credentials
2. Should see:
   - Dashboard, Attendance, Leaves, Announcements in menu
   - Personal attendance widget
   - Personal leave requests
   - No payroll, employee management, or reports

### Test as HR:
1. Login with HR credentials
2. Should see:
   - All employee features plus: Employees, Departments, Recruitment, Reports
   - Can view all attendance and leaves
   - Can create announcements
   - **Cannot** see Payroll

### Test as Admin:
1. Login with admin credentials
2. Should see:
   - All menu items
   - All dashboard stats including payroll
   - Full system access

## Security Notes

1. **Frontend validation is not enough** - Backend API should also verify permissions
2. **Role is stored in user object** from authentication response
3. **Permissions are checked on every route** and component render
4. **Direct URL navigation is blocked** by ProtectedRoute component

## Future Enhancements

1. Add more granular permissions (e.g., can_edit vs can_delete)
2. Implement department-based access control
3. Add permission caching for better performance
4. Create admin panel for managing roles and permissions
5. Add audit logging for permission changes
