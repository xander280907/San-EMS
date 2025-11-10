# Profile Picture Feature - Setup & Testing Guide

## What Was Fixed

### Backend Changes
1. **EmployeeController.php** - Added file upload handling in update method
2. **Created uploads directory** - `backend/public/uploads/profiles/`
3. **File validation** - Max 5MB, accepts JPEG, JPG, PNG, GIF

### Frontend Changes
1. **Employee Table** - Now displays profile pictures in the NAME column
2. **Sidebar User Section** - Shows profile picture with improved layout
3. **API Service** - Updated to handle FormData file uploads
4. **Error Handling** - Graceful fallback to initials if image fails to load

## Directory Structure
```
backend/
  public/
    uploads/
      profiles/       <- Profile pictures stored here
        .gitignore    <- Prevents committing uploaded files
```

## How to Test

### Step 1: Restart Backend Server
```bash
cd backend
php artisan serve
```

### Step 2: Restart Frontend Server
```bash
cd frontend-web
npm run dev
```

### Step 3: Upload Profile Picture
1. Login to the system
2. Click "My Profile" in the sidebar
3. Click "Edit Profile" button
4. Click the camera icon on the profile picture
5. Select an image (JPEG, PNG, GIF - max 5MB)
6. Preview will appear immediately
7. Click "Save Changes"

### Step 4: Verify Display
After uploading:
1. **Sidebar** - Your profile picture should appear at the bottom
2. **Employee Table** - Navigate to Employees page, your picture should appear in the NAME column
3. **My Profile** - The picture should be displayed

## File Upload URL Format
- Uploaded files are stored at: `/uploads/profiles/profile_{employee_id}_{timestamp}.{ext}`
- Example: `/uploads/profiles/profile_1_1699234567.jpg`

## Troubleshooting

### Image Not Displaying?
1. Check browser console for errors
2. Verify the uploads folder has write permissions:
   ```bash
   chmod -R 775 backend/public/uploads
   ```
3. Check if the file was actually uploaded to `backend/public/uploads/profiles/`

### Upload Fails?
1. Check file size (max 5MB)
2. Check file type (only JPEG, JPG, PNG, GIF)
3. Check backend logs for errors

### Fallback Display
- If image fails to load, colored initials will display
- Sidebar shows user icon
- Table shows colored circle with initials

## Features
✅ Drag & drop or click to upload
✅ Live preview before saving
✅ Circular crop display
✅ Automatic fallback to initials
✅ Error handling for broken images
✅ Mobile responsive
✅ 5MB size limit
✅ Multiple format support

## Technical Details
- Uses FormData for file upload
- Laravel handles file storage
- React displays images with error handling
- CSS object-fit ensures proper image scaling
