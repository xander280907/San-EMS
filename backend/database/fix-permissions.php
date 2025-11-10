<?php

/**
 * Quick script to fix permissions in roles table
 * Run with: php database/fix-permissions.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Role;
use Illuminate\Support\Facades\DB;

echo "Fixing role permissions...\n\n";

$roles = Role::all();
$fixed = 0;

foreach ($roles as $role) {
    // Get raw value from database
    $raw = DB::table('roles')->where('id', $role->id)->value('permissions');
    
    if ($raw !== null && is_string($raw)) {
        try {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $role->permissions = $decoded;
                $role->save();
                echo "✓ Fixed role: {$role->name}\n";
                $fixed++;
            }
        } catch (\Exception $e) {
            echo "✗ Error fixing role {$role->name}: " . $e->getMessage() . "\n";
        }
    } elseif ($raw === null) {
        $role->permissions = [];
        $role->save();
        echo "✓ Fixed null permissions for role: {$role->name}\n";
        $fixed++;
    } else {
        echo "○ Role {$role->name} already has correct format\n";
    }
}

echo "\nCompleted! Fixed {$fixed} role(s).\n";

