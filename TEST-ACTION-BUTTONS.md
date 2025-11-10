# Test Action Buttons - Quick Guide

## ✅ All Buttons Are Now Functional!

### What Was Added:

1. **Loading States** - Buttons show "Updating..." while processing
2. **Success Messages** - Green notification when status changes
3. **Error Messages** - Red notification if something fails
4. **Disabled State** - Prevents multiple clicks during update
5. **Auto-hide Success** - Success message disappears after 3 seconds

---

## How to Test:

### 1. Go to Recruitment Dashboard
```
http://localhost:3000/dashboard/recruitment
```

### 2. Click "Applications" Tab

### 3. Click "View" on Any Application

### 4. Test Each Button:

#### **🟡 Mark as Reviewing Button**
- **Appears when:** Status is "Applied"
- **Click it** → Should show "Updating..."
- **Result:** 
  - ✅ Status changes to "Reviewing"
  - ✅ Green message: "Application marked as under review"
  - ✅ Button disappears (already reviewing)
  - ✅ Status badge updates in table

#### **🟢 Accept Application Button**
- **Appears when:** Status is NOT "Accepted"
- **Click it** → Should show "Updating..."
- **Result:**
  - ✅ Status changes to "Accepted"
  - ✅ Green message: "Application accepted successfully"
  - ✅ Button disappears
  - ✅ Status badge turns green

#### **🔴 Reject Application Button**
- **Appears when:** Status is NOT "Rejected"
- **Click it** → Should show "Updating..."
- **Result:**
  - ✅ Status changes to "Rejected"
  - ✅ Green message: "Application rejected"
  - ✅ Button disappears
  - ✅ Status badge turns red

---

## Expected Behavior:

### ✅ What Should Work:

1. **Loading State**
   - Button text changes to "Updating..."
   - All buttons disabled during update
   - Cannot close modal while updating

2. **Success Notification**
   - Green banner appears at top of modal
   - Shows appropriate message
   - Auto-disappears after 3 seconds

3. **Status Update**
   - Status badge updates immediately in table
   - Status badge updates in modal
   - Changes persist after closing/reopening

4. **Smart Button Visibility**
   - Only shows relevant buttons for current status
   - If "Accepted" → Only shows Reject button
   - If "Rejected" → Only shows Accept button
   - If "Applied" → Shows all three buttons

### ❌ If Buttons Don't Work:

**Check these:**

1. **Database column exists?**
   ```sql
   DESCRIBE applicants;
   ```
   Should see `reviewed_at` with type `timestamp`

2. **Status ENUM is correct?**
   ```sql
   SHOW COLUMNS FROM applicants LIKE 'status';
   ```
   Should show: `enum('applied','reviewing','accepted','rejected')`

3. **Browser console errors?**
   - Press F12
   - Check Console tab
   - Check Network tab for API errors

4. **Backend running?**
   - Make sure Laravel is running on port 8000
   - Check: `http://localhost:8000/api/recruitment/applications`

---

## Workflow Example:

### Scenario: New Application Review

1. **Application arrives** → Status: "Applied" 🔵

2. **HR Opens View**
   - Sees applicant name, email, phone
   - Reads cover letter
   - Reviews job position

3. **HR Clicks "Mark as Reviewing"**
   - Button shows "Updating..."
   - Success message appears
   - Status badge → "Reviewing" 🟡

4. **HR Makes Decision**

   **Option A: Accept**
   - Click "Accept Application"
   - Success: "Application accepted successfully"
   - Status → "Accepted" 🟢
   - Only Reject button remains

   **Option B: Reject**
   - Click "Reject Application"  
   - Success: "Application rejected"
   - Status → "Rejected" 🔴
   - Only Accept button remains

5. **HR Closes Modal**
   - Table shows updated status
   - Badge color matches status

---

## Troubleshooting:

### Error: "Column 'reviewed_at' not found"
**Fix:** Run this SQL:
```sql
ALTER TABLE applicants 
ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;
```

### Error: "Data truncated for column 'status'"
**Fix:** Run this SQL:
```sql
ALTER TABLE applicants 
MODIFY COLUMN status ENUM('applied', 'reviewing', 'accepted', 'rejected') DEFAULT 'applied';
```

### Error: 500 Internal Server Error
**Check:**
1. Laravel logs: `backend/storage/logs/laravel.log`
2. Database connection in `.env`
3. Make sure both database fixes above are applied

### Buttons Don't Update Status
**Check:**
1. Browser console (F12) for JavaScript errors
2. Network tab - is API call successful?
3. Response from API - any error messages?

---

## Success Indicators:

✅ **Everything Works When:**
- Button shows "Updating..." briefly
- Green success message appears
- Status badge updates in table
- Button visibility changes appropriately
- Can accept/reject multiple times
- No console errors
- No 500 errors in Network tab

---

## Quick Test Script:

1. Create test application from `/careers` page
2. Login as HR/Admin
3. Go to Recruitment → Applications
4. Click "View" on test application
5. Click "Mark as Reviewing" → Should work ✅
6. Click "Accept Application" → Should work ✅
7. Refresh page
8. Status should still be "Accepted" ✅
9. Open application again
10. Click "Reject Application" → Should work ✅

If all 10 steps work → **Perfect!** 🎉
