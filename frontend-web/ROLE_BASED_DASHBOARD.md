# Role-Based Dashboard Implementation

## Overview
The Dashboard now displays different views based on user roles:
- **Employee View**: Personal, focused dashboard for individual employees
- **Admin/HR View**: Management dashboard with analytics and organization-wide insights

## Role Detection
Uses the following utility functions from `utils/permissions.js`:
- `isEmployee(user)` - Checks if user is an employee
- `isAdmin(user)` - Checks if user is admin
- `isHR(user)` - Checks if user is HR
- `canViewAll(user)` - Returns true for admin/HR roles

## Implementation Structure

### Main Component Logic
```javascript
// Conditional rendering at the end of Dashboard component
return isEmployee(user) ? renderEmployeeDashboard() : renderAdminDashboard()
```

---

## 👤 EMPLOYEE DASHBOARD

### Key Features
**Focused on personal information and self-service**

### Layout Structure

#### 1. **Hero Stats Cards (3 Cards)**
Gradient-styled cards with key personal metrics:

- **Attendance Status Card** (Blue Gradient)
  - Shows if checked in today
  - Displays clock-in time if available
  - Visual status indicator

- **Leave Days Balance Card** (Green Gradient)
  - Shows remaining leave days
  - Displays days used
  - Quick reference for planning

- **Announcements Card** (Purple Gradient)
  - Shows count of recent announcements
  - Indicates new updates availability

#### 2. **Personal Attendance & Leave Balance Row**
Two-column layout for detailed personal information:

- **My Attendance Today Widget**
  - Large, prominent display of clock-in/out times
  - Shows hours worked if clocked out
  - Call-to-action buttons for clocking in/out
  - Enhanced visual design with colored borders

- **My Leave Balance Chart**
  - Large doughnut chart (56x56)
  - Visual representation of used vs remaining days
  - Prominent display of remaining days count
  - Color-coded legend

#### 3. **Leave Requests & Activity Row**
Two-column layout for tracking and updates:

- **My Leave Requests Widget**
  - List of personal leave requests
  - Status badges (pending, approved, rejected)
  - Date ranges and duration
  - "Request Leave" action button
  - Enhanced card styling with hover effects

- **Recent Activity Feed**
  - Personal activity timeline
  - Icons for different activity types
  - Timestamp for each activity
  - Recent announcements, leaves, attendance

#### 4. **Announcements Section**
Full-width section for company updates:
- Larger cards with better visibility
- Urgent announcements highlighted in red
- Full date display
- Click to view all announcements

#### 5. **Quick Actions Bar**
Three prominent action buttons:
- **Attendance** - Clock in/out quickly
- **Request Leave** - Apply for time off
- **My Payslips** - View salary history

### Design Characteristics
- **Gradient cards** for visual appeal
- **Larger fonts** for better readability
- **Personal focus** - all data is about the logged-in employee
- **Action-oriented** - prominent CTA buttons
- **Simplified navigation** - direct access to employee features
- **Friendly messaging** - "Welcome to your personal workspace"

---

## 👔 ADMIN/HR DASHBOARD

### Key Features
**Focused on analytics, management, and organization-wide insights**

### Layout Structure

#### 1. **Management Stats Cards (4 Cards with Trends)**
Analytics-focused cards with trend indicators:

- **Total Employees**
  - Company-wide employee count
  - Hover effect for navigation

- **This Month Payroll**
  - Total payroll amount
  - Trend comparison with previous month
  - Percentage change indicator

- **Attendance Today**
  - Total employees who checked in
  - Day-over-day trend comparison
  - Quick link to attendance page

- **Pending Leaves**
  - Count of leave requests awaiting approval
  - Quick access to leaves management

#### 2. **Analytics Charts Row**
Data visualization for decision-making:

- **Attendance Trend Chart** (2/3 width)
  - Line chart showing 7-day attendance pattern
  - Helps identify trends and anomalies
  - Interactive with hover tooltips
  - Gradient fill for visual appeal

- **Leave Balance Overview** (1/3 width)
  - Doughnut chart for aggregate leave data
  - Organization-wide leave usage
  - Quick reference for capacity planning

#### 3. **Management Widgets Row**
Operational information:

- **Personal Attendance Status**
  - Admin/HR can also track their own attendance
  - Same functionality as employee view
  - Ensures managers set example

- **My Leave Requests**
  - Personal leave tracking for admin/HR
  - Request and manage own leaves

#### 4. **Activity & Events Row**
Organizational overview:

- **Recent Activity Feed**
  - System-wide activities
  - Announcements, leaves, attendance events
  - Timeline view with icons

- **Upcoming Events**
  - Organization calendar events
  - Upcoming approved leaves
  - Helps with resource planning

#### 5. **Announcements Management**
Full-width announcements section:
- Same as employee view but with creation/edit capabilities
- Urgent announcements prominently displayed

#### 6. **Management Quick Actions**
Three action buttons for common admin tasks:
- **Clock In/Out** - Personal attendance
- **Request Leave** - Personal leave management
- **View Announcements** - Check and create updates

### Design Characteristics
- **Analytics-focused** - charts and trends
- **Trend indicators** - percentage changes
- **Organization-wide data** - not just personal
- **Management tools** - links to admin features
- **Professional tone** - "Here's what's happening in your EMS today"
- **Data-driven** - emphasis on metrics and insights

---

## Key Differences Summary

| Feature | Employee Dashboard | Admin/HR Dashboard |
|---------|-------------------|-------------------|
| **Stats Cards** | 3 personal cards (gradient) | 4 organizational cards (with trends) |
| **Primary Focus** | Self-service & personal info | Analytics & management |
| **Charts** | Only personal leave balance | Attendance trends + Leave overview |
| **Quick Actions** | Attendance, Leave, Payslips | Same + Management options |
| **Data Scope** | Personal only | Organization-wide |
| **Visual Style** | Colorful gradients | Professional with trends |
| **Greeting** | "Welcome to your personal workspace" | "Here's what's happening in your EMS" |

---

## Technical Implementation

### Conditional Rendering
```javascript
return isEmployee(user) ? renderEmployeeDashboard() : renderAdminDashboard()
```

### Separate Render Functions
- `renderEmployeeDashboard()` - Returns employee-specific JSX
- `renderAdminDashboard()` - Returns admin/HR-specific JSX

### Shared Components & Data
Both dashboards use the same:
- Data fetching functions
- State management
- API calls
- Helper functions (formatTime, getStatusBadge, etc.)

### Role Checking
- Imported from `utils/permissions.js`
- Checks `user.role` property
- Case-insensitive comparison
- Supports: 'admin', 'hr', 'employee'

---

## Benefits

### For Employees
✅ Cleaner, more focused interface
✅ Personal information front and center
✅ Reduced cognitive load (no irrelevant data)
✅ Faster access to common actions
✅ Better visual hierarchy
✅ Mobile-friendly design

### For Admin/HR
✅ Management insights at a glance
✅ Trend analysis for decision-making
✅ Organization-wide visibility
✅ Quick access to pending items
✅ Data-driven dashboard
✅ Professional analytics view

### For the Organization
✅ Role-appropriate information display
✅ Improved user experience per role
✅ Better security (users only see relevant data)
✅ Scalable design pattern
✅ Clear separation of concerns
✅ Enhanced productivity

---

## Future Enhancements

### Potential Additions
- Manager role with team-specific dashboard
- Customizable widgets (drag & drop)
- Department-specific views
- Real-time notifications
- Export dashboard data
- Dark mode support
- Dashboard personalization settings
- More granular role permissions
- Widget preferences saved per user
