# Quick Test Checklist for Announcements

## ⚠️ Prerequisites

**You need PHP installed to test the backend!**

### Check if PHP is installed:
```bash
php --version
```

If you see an error, install PHP first:
- **Option 1**: Install XAMPP from https://www.apachefriends.org/
- **Option 2**: Install PHP from https://windows.php.net/download/

After installing, add PHP to your PATH and restart your terminal.

---

## 🚀 Quick Start (Once PHP is installed)

### Terminal 1 - Backend
```bash
cd backend
php artisan migrate:fresh --seed
php artisan serve
```
✅ Backend running on: http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend-web
npm run dev
```
✅ Frontend running on: http://localhost:5173

---

## ✅ Test Checklist

### 1. Basic Viewing
- [ ] Open http://localhost:5173
- [ ] Login: `admin@test.local` / `password`
- [ ] Click "Announcements" in sidebar
- [ ] See 4 sample announcements
- [ ] One announcement has RED border (urgent)

### 2. Search & Filter
- [ ] Type "holiday" in search box → See 1 result
- [ ] Clear search
- [ ] Check "Urgent only" → See 1 result (red border)
- [ ] Uncheck filter → See all announcements

### 3. Create Announcement
- [ ] Click "New Announcement" button (top right)
- [ ] Fill form:
  - Title: "Test Announcement"
  - Content: "Testing the feature"
  - Visibility: "All Employees"
  - Check "Mark as urgent"
- [ ] Click "Create Announcement"
- [ ] New announcement appears with RED border

### 4. Edit Announcement
- [ ] Click blue Edit icon on any announcement
- [ ] Change title to add " - EDITED"
- [ ] Click "Update Announcement"
- [ ] See updated title

### 5. Delete Announcement
- [ ] Click red Delete icon on test announcement
- [ ] Confirm deletion
- [ ] Announcement disappears

### 6. Department-Specific
- [ ] Click "New Announcement"
- [ ] Title: "IT Only"
- [ ] Visibility: "Specific Department"
- [ ] Department: "Information Technology"
- [ ] Create
- [ ] See blue "Information Technology" badge

### 7. Employee View (Optional)
- [ ] Logout
- [ ] Login as: `hr@test.local` / `password`
- [ ] Go to Announcements
- [ ] Verify you can still create/edit/delete (HR has permission)

---

## 🎯 Success Indicators

✅ **Working Correctly If:**
- You see the "New Announcement" button (as admin/hr)
- You can create announcements
- You can edit announcements
- You can delete announcements
- Search works
- Filter works
- Urgent announcements have red border
- Department badges show correctly

❌ **Not Working If:**
- No announcements show up
- "New Announcement" button missing
- Edit/Delete buttons missing
- Getting 403 or 500 errors
- Modal doesn't open

---

## 🐛 Common Issues

### "PHP not found"
→ Install PHP and add to PATH

### "Failed to load announcements"
→ Check backend is running on port 8000

### "No announcements showing"
→ Run `php artisan migrate:fresh --seed` again

### "Can't create announcement"
→ Make sure you're logged in as admin or hr

---

## 📸 What You Should See

### Announcements List:
- White cards with colored left border
- Red border = Urgent
- Blue border = Normal
- Search bar at top
- "Urgent only" checkbox
- Edit/Delete buttons (admin/hr only)

### Create Modal:
- Title field
- Content textarea
- Visibility dropdown
- Department dropdown (if department selected)
- Urgent checkbox
- Cancel and Create buttons

---

**Need detailed instructions?** See `TEST-ANNOUNCEMENT.md`

**Ready to test?** Just run the commands above! 🚀
