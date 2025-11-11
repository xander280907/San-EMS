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
            // Add selfie verification fields for main clock in/out
            $table->text('clock_in_selfie')->nullable()->after('clock_in_location');
            $table->text('clock_out_selfie')->nullable()->after('clock_out_location');
            
            // Add selfie verification fields for morning session
            $table->text('morning_clock_in_selfie')->nullable()->after('morning_clock_in_location');
            $table->text('morning_clock_out_selfie')->nullable()->after('morning_clock_out_location');
            
            // Add selfie verification fields for afternoon session
            $table->text('afternoon_clock_in_selfie')->nullable()->after('afternoon_clock_in_location');
            $table->text('afternoon_clock_out_selfie')->nullable()->after('afternoon_clock_out_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'clock_in_selfie',
                'clock_out_selfie',
                'morning_clock_in_selfie',
                'morning_clock_out_selfie',
                'afternoon_clock_in_selfie',
                'afternoon_clock_out_selfie'
            ]);
        });
    }
};
