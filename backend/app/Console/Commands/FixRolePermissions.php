<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Role;

class FixRolePermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:role-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix existing roles that have JSON-encoded permissions instead of arrays';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing role permissions...');

        $roles = Role::all();
        $fixed = 0;

        foreach ($roles as $role) {
            // Get raw attribute value (before casting)
            $rawPermissions = $role->getAttributes()['permissions'] ?? null;
            
            // Check if raw value is a JSON string
            if ($rawPermissions !== null && is_string($rawPermissions)) {
                try {
                    $decoded = json_decode($rawPermissions, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        // Save as array - Laravel will auto-encode it
                        $role->permissions = $decoded;
                        $role->save();
                        $fixed++;
                        $this->info("Fixed role: {$role->name}");
                    }
                } catch (\Exception $e) {
                    $this->warn("Error fixing role {$role->name}: " . $e->getMessage());
                }
            } elseif ($rawPermissions === null) {
                // Set default empty array for null permissions
                $role->permissions = [];
                $role->save();
                $fixed++;
                $this->info("Fixed null permissions for role: {$role->name}");
            }
        }

        $this->info("Completed! Fixed {$fixed} role(s).");
        
        return Command::SUCCESS;
    }
}

