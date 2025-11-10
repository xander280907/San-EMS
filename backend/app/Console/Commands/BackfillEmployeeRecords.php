<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Console\Command;

class BackfillEmployeeRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:backfill
                            {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create employee records for users who don\'t have one';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('Running in DRY RUN mode - no changes will be made');
        }

        // Find users without employee records
        $usersWithoutEmployee = User::whereDoesntHave('employee')->get();

        if ($usersWithoutEmployee->isEmpty()) {
            $this->info('All users already have employee records!');
            return 0;
        }

        $this->info("Found {$usersWithoutEmployee->count()} users without employee records:");
        
        $created = 0;
        $failed = 0;

        foreach ($usersWithoutEmployee as $user) {
            $this->line("  - {$user->email} (ID: {$user->id}, Role: {$user->role?->name})");
            
            if (!$dryRun) {
                try {
                    Employee::create([
                        'user_id' => $user->id,
                        'employee_number' => 'EMP-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
                        'department_id' => null, // To be assigned later by admin/HR
                        'position' => null, // To be assigned later
                        'employment_type' => null,
                        'hire_date' => $user->created_at ?? now(),
                        'base_salary' => null,
                        'status' => 'active',
                    ]);
                    $created++;
                    $this->info("    ✓ Created employee record for {$user->email}");
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("    ✗ Failed to create employee record for {$user->email}: {$e->getMessage()}");
                }
            }
        }

        if ($dryRun) {
            $this->info("\nDry run complete. Run without --dry-run to create the records.");
        } else {
            $this->info("\n✓ Successfully created {$created} employee record(s)");
            if ($failed > 0) {
                $this->warn("✗ Failed to create {$failed} employee record(s)");
            }
        }

        return 0;
    }
}
