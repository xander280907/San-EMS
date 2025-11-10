<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Position;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define positions by department type with salary ranges
        $positionTemplates = [
            'HR' => [
                ['title' => 'HR Manager', 'min' => 45000, 'max' => 70000, 'desc' => 'Oversee all HR operations, manage recruitment, employee relations, and compliance.'],
                ['title' => 'HR Specialist', 'min' => 30000, 'max' => 45000, 'desc' => 'Handle employee benefits, payroll processing, and HR documentation.'],
                ['title' => 'Recruiter', 'min' => 25000, 'max' => 40000, 'desc' => 'Source, screen, and interview candidates for various positions.'],
                ['title' => 'HR Assistant', 'min' => 18000, 'max' => 28000, 'desc' => 'Provide administrative support to the HR department and maintain employee records.'],
            ],
            'IT' => [
                ['title' => 'IT Manager', 'min' => 60000, 'max' => 90000, 'desc' => 'Lead IT team, manage infrastructure, and oversee technology initiatives.'],
                ['title' => 'Senior Developer', 'min' => 50000, 'max' => 80000, 'desc' => 'Design and develop complex software solutions, mentor junior developers.'],
                ['title' => 'Developer', 'min' => 35000, 'max' => 55000, 'desc' => 'Write clean code, implement features, and maintain existing applications.'],
                ['title' => 'Junior Developer', 'min' => 20000, 'max' => 35000, 'desc' => 'Learn development practices and contribute to software projects under supervision.'],
                ['title' => 'System Administrator', 'min' => 30000, 'max' => 50000, 'desc' => 'Maintain servers, networks, and ensure system security and uptime.'],
                ['title' => 'QA Tester', 'min' => 25000, 'max' => 40000, 'desc' => 'Test software applications, identify bugs, and ensure quality standards.'],
            ],
            'Finance' => [
                ['title' => 'Finance Manager', 'min' => 50000, 'max' => 80000, 'desc' => 'Oversee financial operations, budgeting, and financial reporting.'],
                ['title' => 'Accountant', 'min' => 30000, 'max' => 50000, 'desc' => 'Maintain financial records, prepare statements, and ensure compliance.'],
                ['title' => 'Financial Analyst', 'min' => 35000, 'max' => 55000, 'desc' => 'Analyze financial data, create forecasts, and provide insights.'],
                ['title' => 'Payroll Specialist', 'min' => 25000, 'max' => 40000, 'desc' => 'Process payroll, manage deductions, and ensure accurate compensation.'],
            ],
            'Marketing' => [
                ['title' => 'Marketing Manager', 'min' => 45000, 'max' => 70000, 'desc' => 'Develop marketing strategies, manage campaigns, and lead marketing team.'],
                ['title' => 'Digital Marketing Specialist', 'min' => 30000, 'max' => 50000, 'desc' => 'Manage online campaigns, SEO/SEM, and social media marketing.'],
                ['title' => 'Content Writer', 'min' => 22000, 'max' => 35000, 'desc' => 'Create engaging content for various platforms and marketing materials.'],
                ['title' => 'Social Media Manager', 'min' => 25000, 'max' => 40000, 'desc' => 'Manage social media presence, create content, and engage with audience.'],
            ],
            'Sales' => [
                ['title' => 'Sales Manager', 'min' => 45000, 'max' => 75000, 'desc' => 'Lead sales team, develop strategies, and achieve revenue targets.'],
                ['title' => 'Sales Representative', 'min' => 20000, 'max' => 35000, 'desc' => 'Generate leads, close deals, and maintain client relationships.'],
                ['title' => 'Account Manager', 'min' => 30000, 'max' => 50000, 'desc' => 'Manage key accounts, ensure client satisfaction, and identify upsell opportunities.'],
                ['title' => 'Business Development Officer', 'min' => 28000, 'max' => 45000, 'desc' => 'Identify new business opportunities and develop strategic partnerships.'],
            ],
            'Operations' => [
                ['title' => 'Operations Manager', 'min' => 50000, 'max' => 75000, 'desc' => 'Oversee daily operations, optimize processes, and ensure efficiency.'],
                ['title' => 'Operations Officer', 'min' => 30000, 'max' => 45000, 'desc' => 'Coordinate operational activities and implement process improvements.'],
                ['title' => 'Logistics Coordinator', 'min' => 25000, 'max' => 38000, 'desc' => 'Manage supply chain, coordinate shipments, and track inventory.'],
            ],
            'Customer Service' => [
                ['title' => 'Customer Service Manager', 'min' => 40000, 'max' => 60000, 'desc' => 'Lead customer service team and ensure excellent customer experience.'],
                ['title' => 'Customer Service Representative', 'min' => 18000, 'max' => 28000, 'desc' => 'Handle customer inquiries, resolve issues, and provide support.'],
                ['title' => 'Support Specialist', 'min' => 22000, 'max' => 35000, 'desc' => 'Provide technical support and assist customers with product issues.'],
                ['title' => 'Technical Support', 'min' => 25000, 'max' => 40000, 'desc' => 'Troubleshoot technical problems and provide solutions to customers.'],
            ],
            'Administration' => [
                ['title' => 'Administrative Manager', 'min' => 40000, 'max' => 60000, 'desc' => 'Manage administrative staff and oversee office operations.'],
                ['title' => 'Office Manager', 'min' => 30000, 'max' => 45000, 'desc' => 'Coordinate office activities, manage supplies, and support staff.'],
                ['title' => 'Administrative Assistant', 'min' => 18000, 'max' => 28000, 'desc' => 'Provide administrative support, handle correspondence, and schedule meetings.'],
                ['title' => 'Receptionist', 'min' => 15000, 'max' => 22000, 'desc' => 'Greet visitors, answer calls, and manage front desk operations.'],
            ],
            'default' => [
                ['title' => 'Manager', 'min' => 45000, 'max' => 70000, 'desc' => 'Lead department operations and manage team members.'],
                ['title' => 'Assistant Manager', 'min' => 35000, 'max' => 55000, 'desc' => 'Support department manager and oversee daily activities.'],
                ['title' => 'Supervisor', 'min' => 30000, 'max' => 45000, 'desc' => 'Supervise team members and ensure work quality.'],
                ['title' => 'Team Leader', 'min' => 28000, 'max' => 42000, 'desc' => 'Guide team members and coordinate project activities.'],
                ['title' => 'Senior Staff', 'min' => 25000, 'max' => 40000, 'desc' => 'Perform advanced tasks and mentor junior staff.'],
                ['title' => 'Staff', 'min' => 20000, 'max' => 32000, 'desc' => 'Execute assigned tasks and contribute to team goals.'],
                ['title' => 'Junior Staff', 'min' => 16000, 'max' => 25000, 'desc' => 'Learn job responsibilities and support team operations.'],
            ],
        ];

        // Get all departments
        $departments = Department::all();

        foreach ($departments as $department) {
            $deptName = $department->name;
            
            // Find matching position template
            $positions = null;
            
            // Try exact match
            foreach ($positionTemplates as $key => $template) {
                if (stripos($deptName, $key) !== false || stripos($key, $deptName) !== false) {
                    $positions = $template;
                    break;
                }
            }
            
            // Use default if no match
            if (!$positions) {
                $positions = $positionTemplates['default'];
            }
            
            // Create positions for this department
            foreach ($positions as $posData) {
                Position::create([
                    'department_id' => $department->id,
                    'title' => $posData['title'],
                    'description' => $posData['desc'],
                    'min_salary' => $posData['min'],
                    'max_salary' => $posData['max'],
                    'available_slots' => rand(1, 5), // Random slots between 1-5
                    'status' => 'active',
                ]);
            }
            
            $this->command->info("Created positions for department: {$deptName}");
        }
        
        $this->command->info('Position seeding completed!');
    }
}
