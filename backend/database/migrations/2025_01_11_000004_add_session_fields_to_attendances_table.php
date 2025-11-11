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
            // Add morning session fields
            $table->time('morning_clock_in')->nullable()->after('clock_out');
            $table->time('morning_clock_out')->nullable()->after('morning_clock_in');
            
            // Add afternoon session fields
            $table->time('afternoon_clock_in')->nullable()->after('morning_clock_out');
            $table->time('afternoon_clock_out')->nullable()->after('afternoon_clock_in');
            
            // Add morning/afternoon hours worked
            $table->decimal('morning_hours', 5, 2)->default(0)->after('afternoon_clock_out');
            $table->decimal('afternoon_hours', 5, 2)->default(0)->after('morning_hours');
            
            // Add session location tracking
            $table->string('morning_clock_in_location')->nullable()->after('afternoon_hours');
            $table->string('morning_clock_out_location')->nullable()->after('morning_clock_in_location');
            $table->string('afternoon_clock_in_location')->nullable()->after('morning_clock_out_location');
            $table->string('afternoon_clock_out_location')->nullable()->after('afternoon_clock_in_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'morning_clock_in',
                'morning_clock_out',
                'afternoon_clock_in',
                'afternoon_clock_out',
                'morning_hours',
                'afternoon_hours',
                'morning_clock_in_location',
                'morning_clock_out_location',
                'afternoon_clock_in_location',
                'afternoon_clock_out_location'
            ]);
        });
    }
};
