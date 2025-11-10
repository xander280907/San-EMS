# Application Action Buttons Feature

## Overview
Added action buttons to the recruitment application management system, allowing HR/Admin to quickly manage application statuses.

## Features Added

### 1. **Quick Action Buttons in Applications Table**
In the "Applications" tab of the Recruitment page, each application row now has quick action buttons:

- **👁️ View** (Blue) - View full application details
- **✅ Accept** (Green) - Accept the application
- **❌ Reject** (Red) - Reject the application  
- **🕐 Review** (Yellow) - Mark as "Under Review" (only shows for "Applied" status)

**Smart Button Display:**
- Buttons only appear when relevant (e.g., "Accept" button hides if already accepted)
- Hover tooltips for clarity
- Icon-only design for compact table layout

### 2. **Action Buttons in Application Details Modal**
When HR clicks "View" to see full application details, the modal includes action buttons at the bottom:

- **Accept Button** (Green with icon) - Changes status to "accepted"
- **Reject Button** (Red with icon) - Changes status to "rejected"  
- **Review Button** (Yellow with icon) - Changes status to "reviewing"

**Smart Visibility:**
- Only shows relevant buttons based on current status
- Buttons automatically update after clicking
- Close button remains on the right

### 3. **Application Status Flow**

```
Applied → Reviewing → Accepted/Rejected
   ↓         ↓             ↓
 (New)   (In Review)   (Final)
```

**Status Options:**
- **Applied** - Initial status when application is submitted
- **Reviewing** - HR is actively reviewing the application
- **Accepted** - Application approved, candidate to be hired
- **Rejected** - Application declined

### 4. **Status Badges**
Color-coded badges throughout the system:
- 🔵 **Applied** - Blue badge with clock icon
- 🟡 **Reviewing** - Yellow badge with users icon
- 🟢 **Accepted** - Green badge with check icon
- 🔴 **Rejected** - Red badge with X icon

## Files Modified

### Frontend:
1. **`frontend-web/src/pages/Recruitment.jsx`**
   - Added `handleUpdateApplicationStatus()` function
   - Added action buttons in applications table
   - Added action buttons in application details modal
   - Smart button visibility logic

2. **`frontend-web/src/services/api.js`**
   - Added `updateApplicationStatus()` API call

### Backend:
1. **`backend/routes/api.php`**
   - Added route: `PUT /api/recruitment/applications/{id}/status`

2. **`backend/app/Http/Controllers/RecruitmentController.php`**
   - Added `updateApplicationStatus()` method
   - Validates status values (applied, reviewing, accepted, rejected)
   - Records who reviewed and when (reviewed_by, reviewed_at)

## How to Use

### As HR/Admin:

#### Quick Actions from Table:
1. Go to `/dashboard/recruitment`
2. Click **"Applications"** tab
3. See all applications with action buttons
4. Click any action button to update status immediately
5. Status updates in real-time

#### Detailed Review:
1. Click **👁️ View** button on any application
2. Review applicant information, cover letter, and job details
3. Click action button at bottom:
   - **Accept** - Approve the candidate
   - **Reject** - Decline the candidate
   - **Review** - Mark for further review
4. Status updates immediately
5. Modal can be closed or kept open

### Workflow Example:

**Scenario: New Application Received**

1. **Application Arrives** - Status: "Applied" 🔵
   ```
   John Doe applies for "Software Developer"
   Status: Applied
   ```

2. **HR Starts Review** - Click "Review" button
   ```
   Status: Reviewing 🟡
   (HR can take time to review resume, portfolio, etc.)
   ```

3. **Make Final Decision**:
   - **Option A:** Click "Accept" ✅
     ```
     Status: Accepted 🟢
     (Proceed with hiring process)
     ```
   
   - **Option B:** Click "Reject" ❌
     ```
     Status: Rejected 🔴
     (Candidate not selected)
     ```

## Database Updates

When status is updated, the system records:
- **status** - New status value
- **reviewed_by** - ID of HR/Admin who made the change
- **reviewed_at** - Timestamp of the change

This creates an audit trail for recruitment decisions.

## API Endpoint

### Update Application Status
```
PUT /api/recruitment/applications/{id}/status
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Valid Status Values:**
- `"applied"`
- `"reviewing"`
- `"accepted"`
- `"rejected"`

**Response:**
```json
{
  "message": "Application status updated successfully",
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "status": "accepted",
    "reviewed_by": 2,
    "reviewed_at": "2025-11-08T08:30:00.000000Z"
  }
}
```

## User Experience Improvements

### Before:
- ❌ Could only view applications
- ❌ No way to update status from UI
- ❌ Had to manually track application progress

### After:
- ✅ One-click status updates
- ✅ Quick actions directly in table
- ✅ Detailed actions in view modal
- ✅ Visual status badges
- ✅ Real-time updates
- ✅ Smart button visibility
- ✅ Audit trail (who reviewed, when)

## Security

- ✅ Requires authentication (only logged-in HR/Admin can update)
- ✅ Input validation on status values
- ✅ Authorization check via Laravel middleware
- ✅ Audit trail with reviewer ID and timestamp

## Future Enhancements (Optional)

1. **Email Notifications**: Send emails to applicants when status changes
2. **Bulk Actions**: Select multiple applications and update status at once
3. **Notes/Comments**: Add internal notes about each application
4. **Interview Scheduling**: Schedule interviews directly from application
5. **Document Upload**: Request or receive additional documents
6. **Status History**: Show full history of status changes
7. **Custom Statuses**: Allow companies to define their own workflow stages
8. **Applicant Portal**: Let applicants check their application status

## Testing Checklist

- [x] Accept button changes status to "accepted"
- [x] Reject button changes status to "rejected"
- [x] Review button changes status to "reviewing"
- [x] Status badge updates in table after action
- [x] Buttons hide when status matches (e.g., hide Accept if already accepted)
- [x] Error handling for failed API calls
- [x] Real-time updates without page refresh
- [x] Modal stays open after status update
- [x] Quick actions work from table
- [x] Detailed actions work from modal
