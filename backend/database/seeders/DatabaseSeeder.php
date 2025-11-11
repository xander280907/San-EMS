<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use App\Models\LeaveType;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\Announcement;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Roles
        $adminRole = Role::create([
            'name' => 'admin',
            'display_name' => 'Administrator',
            'description' => 'Full system access',
            'permissions' => ['*'],
        ]);


        $employeeRole = Role::create([
            'name' => 'employee',
            'display_name' => 'Employee',
            'description' => 'Employee access',
            'permissions' => [
                'leaves.create', 'attendance.create', 'announcements.view'
            ],
        ]);

        // Seed Admin User
        $admin = User::create([
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'first_name' => 'Admin',
            'last_name' => 'User',
            'role_id' => $adminRole->id,
            'email_verified_at' => now(),
        ]);


        // Seed Employee User
        $employeeUser = User::create([
            'email' => 'employee@test.local',
            'password' => Hash::make('password'),
            'first_name' => 'John',
            'last_name' => 'Employee',
            'role_id' => $employeeRole->id,
            'email_verified_at' => now(),
        ]);

        // Seed Departments
        $deptIT = Department::create([
            'name' => 'Information Technology',
            'description' => 'IT Department',
            'manager_id' => $admin->id,
        ]);

        $deptHR = Department::create([
            'name' => 'Human Resources',
            'description' => 'HR Department',
            'manager_id' => $admin->id,
        ]);

        $deptFinance = Department::create([
            'name' => 'Finance',
            'description' => 'Finance Department',
        ]);

        // Seed Positions for all departments
        $this->call(PositionSeeder::class);

        // Create Employee records for all users
        // Admin employee record (minimal info)
        Employee::create([
            'user_id' => $admin->id,
            'employee_number' => 'EMP-ADMIN',
            'department_id' => $deptIT->id,
            'position' => 'System Administrator',
            'employment_type' => 'full-time',
            'hire_date' => now()->subYears(3),
            'base_salary' => 50000.00,
            'status' => 'active',
        ]);


        // Regular employee record
        Employee::create([
            'user_id' => $employeeUser->id,
            'employee_number' => 'EMP-001',
            'department_id' => $deptIT->id,
            'position' => 'Software Developer',
            'employment_type' => 'full-time',
            'hire_date' => now()->subYears(2),
            'base_salary' => 30000.00,
            'status' => 'active',
        ]);

        // Seed Leave Types
        LeaveType::create([
            'name' => 'Sick Leave',
            'description' => 'Medical leave',
            'max_days_per_year' => 15,
            'carry_over' => true,
            'requires_approval' => true,
        ]);

        LeaveType::create([
            'name' => 'Vacation Leave',
            'description' => 'Annual vacation leave',
            'max_days_per_year' => 15,
            'carry_over' => true,
            'requires_approval' => true,
        ]);

        LeaveType::create([
            'name' => 'Emergency Leave',
            'description' => 'Emergency personal leave',
            'max_days_per_year' => 5,
            'carry_over' => false,
            'requires_approval' => true,
        ]);

        LeaveType::create([
            'name' => 'Maternity Leave',
            'description' => 'Maternity leave for female employees',
            'max_days_per_year' => 60,
            'carry_over' => false,
            'requires_approval' => true,
        ]);

        LeaveType::create([
            'name' => 'Paternity Leave',
            'description' => 'Paternity leave',
            'max_days_per_year' => 7,
            'carry_over' => false,
            'requires_approval' => true,
        ]);

        // Seed Deduction Types (Philippine Standard)
        DeductionType::create([
            'name' => 'PhilHealth',
            'code' => 'PH',
            'type' => 'standard',
            'rate' => 2.0,
            'is_mandatory' => true,
            'description' => 'PhilHealth contribution',
        ]);

        DeductionType::create([
            'name' => 'SSS',
            'code' => 'SSS',
            'type' => 'standard',
            'rate' => 11.0,
            'is_mandatory' => true,
            'description' => 'Social Security System contribution',
        ]);

        DeductionType::create([
            'name' => 'Pag-IBIG',
            'code' => 'PAGIBIG',
            'type' => 'standard',
            'rate' => 2.0,
            'is_mandatory' => true,
            'description' => 'Pag-IBIG (HDMF) contribution',
        ]);

        DeductionType::create([
            'name' => 'Withholding Tax',
            'code' => 'TAX',
            'type' => 'standard',
            'rate' => 0, // Graduated rates based on BIR tables
            'is_mandatory' => true,
            'description' => 'BIR Withholding Tax',
        ]);

        // Seed Sample Announcements
        Announcement::create([
            'title' => 'Welcome to the EMS System',
            'content' => 'We are excited to announce the launch of our new Employee Management System. This platform will help streamline HR processes, payroll management, and employee communications.',
            'visibility' => 'all',
            'created_by' => $admin->id,
            'is_urgent' => false,
            'is_active' => true,
            'published_at' => now(),
        ]);

        Announcement::create([
            'title' => 'Upcoming Holiday - November 30',
            'content' => 'Please be informed that November 30 (Bonifacio Day) is a regular holiday. All offices will be closed. Enjoy your day off!',
            'visibility' => 'all',
            'created_by' => $admin->id,
            'is_urgent' => true,
            'is_active' => true,
            'published_at' => now()->subDays(2),
        ]);

        Announcement::create([
            'title' => 'IT Department: System Maintenance',
            'content' => 'The IT systems will undergo scheduled maintenance this Saturday from 2:00 AM to 6:00 AM. Please save your work before logging off on Friday.',
            'visibility' => 'department',
            'department_id' => $deptIT->id,
            'created_by' => $admin->id,
            'is_urgent' => false,
            'is_active' => true,
            'published_at' => now()->subDays(1),
        ]);

        Announcement::create([
            'title' => 'HR: Benefits Enrollment Period',
            'content' => 'The annual benefits enrollment period is now open. Please review your benefits options and submit your selections by the end of the month. Contact HR for assistance.',
            'visibility' => 'all',
            'created_by' => $admin->id,
            'is_urgent' => false,
            'is_active' => true,
            'published_at' => now()->subDays(5),
        ]);

        if ($this->command) {
            $this->command->info('Database seeded successfully!');
            $this->command->info('Admin: admin@test.local / password');
            $this->command->info('Employee: employee@test.local / password');
        }
    }
}
