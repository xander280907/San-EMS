<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update any existing data to match new enum values
        DB::table('applicants')
            ->where('status', 'screening')
            ->update(['status' => 'reviewing']);
        
        DB::table('applicants')
            ->where('status', 'interviewed')
            ->update(['status' => 'reviewing']);
        
        DB::table('applicants')
            ->whereIn('status', ['offer', 'hired'])
            ->update(['status' => 'accepted']);

        // Now alter the column to use new enum values
        DB::statement("ALTER TABLE applicants MODIFY COLUMN status ENUM('applied', 'reviewing', 'accepted', 'rejected') DEFAULT 'applied'");

        // Add reviewed_at column if it doesn't exist
        if (!Schema::hasColumn('applicants', 'reviewed_at')) {
            Schema::table('applicants', function (Blueprint $table) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE applicants MODIFY COLUMN status ENUM('applied', 'screening', 'interviewed', 'offer', 'hired', 'rejected') DEFAULT 'applied'");

        // Remove reviewed_at column
        if (Schema::hasColumn('applicants', 'reviewed_at')) {
            Schema::table('applicants', function (Blueprint $table) {
                $table->dropColumn('reviewed_at');
            });
        }
    }
};
