# Position Management System

## Overview
The Position Management System allows you to create, edit, and manage job positions within each department with salary ranges and descriptions.

## Features

### 1. **Department-Based Positions**
Each department can have multiple positions with:
- Position Title
- Description
- Min Salary
- Max Salary
- Available Slots
- Status (Active/Inactive)

### 2. **Pre-Seeded Positions**
The system comes with pre-configured positions for common departments:

#### Information Technology (IT)
- IT Manager (₱60,000 - ₱90,000)
- Senior Developer (₱50,000 - ₱80,000)
- Developer (₱35,000 - ₱55,000)
- Junior Developer (₱20,000 - ₱35,000)
- System Administrator (₱30,000 - ₱50,000)
- QA Tester (₱25,000 - ₱40,000)

#### Human Resources (HR)
- HR Manager (₱45,000 - ₱70,000)
- HR Specialist (₱30,000 - ₱45,000)
- Recruiter (₱25,000 - ₱40,000)
- HR Assistant (₱18,000 - ₱28,000)

#### Finance
- Finance Manager (₱50,000 - ₱80,000)
- Accountant (₱30,000 - ₱50,000)
- Financial Analyst (₱35,000 - ₱55,000)
- Payroll Specialist (₱25,000 - ₱40,000)

#### Marketing
- Marketing Manager (₱45,000 - ₱70,000)
- Digital Marketing Specialist (₱30,000 - ₱50,000)
- Content Writer (₱22,000 - ₱35,000)
- Social Media Manager (₱25,000 - ₱40,000)

#### Sales
- Sales Manager (₱45,000 - ₱75,000)
- Sales Representative (₱20,000 - ₱35,000)
- Account Manager (₱30,000 - ₱50,000)
- Business Development Officer (₱28,000 - ₱45,000)

#### Operations
- Operations Manager (₱50,000 - ₱75,000)
- Operations Officer (₱30,000 - ₱45,000)
- Logistics Coordinator (₱25,000 - ₱38,000)

#### Customer Service
- Customer Service Manager (₱40,000 - ₱60,000)
- Customer Service Representative (₱18,000 - ₱28,000)
- Support Specialist (₱22,000 - ₱35,000)
- Technical Support (₱25,000 - ₱40,000)

#### Administration
- Administrative Manager (₱40,000 - ₱60,000)
- Office Manager (₱30,000 - ₱45,000)
- Administrative Assistant (₱18,000 - ₱28,000)
- Receptionist (₱15,000 - ₱22,000)

### 3. **Managing Positions**

#### In Department Form (Create/Edit):
1. Open Department Form (Create or Edit)
2. Scroll to "Positions" section
3. Click "Add Position" button
4. Fill in:
   - Position Title (required)
   - Description
   - Min Salary
   - Max Salary
   - Available Slots
   - Status
5. Click "Add" or "Update"
6. Edit/Delete existing positions as needed

#### In Employee Form:
1. Select Department
2. Positions automatically load in dropdown
3. Position shows with salary range: `Position Name (₱XX,XXX - ₱XX,XXX)`
4. Select position
5. Base Salary auto-fills with average of min/max
6. Salary field enforces min/max limits

### 4. **Salary Validation**
- **Auto-fill**: Selecting a position auto-fills base salary (average of min/max)
- **Min/Max Enforcement**: Cannot enter salary below minimum or above maximum
- **Visual Feedback**: Shows "Required range: ₱XX,XXX - ₱XX,XXX" in blue
- **Error Messages**: Red error if salary is out of range

### 5. **Seeding Positions**

#### For New Database:
```bash
php artisan migrate:fresh --seed
```

#### For Existing Departments:
```bash
php artisan positions:seed
```

This will:
- Create positions for all existing departments
- Match positions based on department name
- Use default positions if no match found
- Skip if positions already exist

### 6. **API Endpoints**
- `GET /api/positions` - List all positions
- `GET /api/positions?department_id=X` - List positions by department
- `POST /api/positions` - Create position
- `GET /api/positions/{id}` - Get single position
- `PUT /api/positions/{id}` - Update position
- `DELETE /api/positions/{id}` - Delete position

## Benefits
✅ Consistent salary ranges across organization
✅ Easy position management within departments
✅ Auto-fill reduces data entry errors
✅ Salary validation ensures compliance
✅ Editable positions for flexibility
✅ Pre-configured templates save setup time

## Notes
- All pre-seeded positions have random available slots (1-5)
- Positions are fully editable after seeding
- Only active positions show in employee form
- Inactive positions are hidden but not deleted
- Deleting a position doesn't affect existing employees
