<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Main clock in/out selfie approval
            $table->enum('clock_in_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('clock_in_selfie');
            $table->text('clock_in_selfie_reason')->nullable()->after('clock_in_selfie_status');
            $table->enum('clock_out_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('clock_out_selfie');
            $table->text('clock_out_selfie_reason')->nullable()->after('clock_out_selfie_status');
            
            // Morning session selfie approval
            $table->enum('morning_clock_in_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('morning_clock_in_selfie');
            $table->text('morning_clock_in_selfie_reason')->nullable()->after('morning_clock_in_selfie_status');
            $table->enum('morning_clock_out_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('morning_clock_out_selfie');
            $table->text('morning_clock_out_selfie_reason')->nullable()->after('morning_clock_out_selfie_status');
            
            // Afternoon session selfie approval
            $table->enum('afternoon_clock_in_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('afternoon_clock_in_selfie');
            $table->text('afternoon_clock_in_selfie_reason')->nullable()->after('afternoon_clock_in_selfie_status');
            $table->enum('afternoon_clock_out_selfie_status', ['pending', 'approved', 'rejected'])->default('pending')->after('afternoon_clock_out_selfie');
            $table->text('afternoon_clock_out_selfie_reason')->nullable()->after('afternoon_clock_out_selfie_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'clock_in_selfie_status',
                'clock_in_selfie_reason',
                'clock_out_selfie_status',
                'clock_out_selfie_reason',
                'morning_clock_in_selfie_status',
                'morning_clock_in_selfie_reason',
                'morning_clock_out_selfie_status',
                'morning_clock_out_selfie_reason',
                'afternoon_clock_in_selfie_status',
                'afternoon_clock_in_selfie_reason',
                'afternoon_clock_out_selfie_status',
                'afternoon_clock_out_selfie_reason'
            ]);
        });
    }
};
