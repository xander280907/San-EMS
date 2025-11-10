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
        Schema::table('payrolls', function (Blueprint $table) {
            // Add is_locked field to prevent accidental modifications
            $table->boolean('is_locked')->default(false)->after('status');
            
            // Add unique constraint to prevent duplicate payrolls per employee per month
            $table->unique(['employee_id', 'payroll_period'], 'unique_employee_payroll_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropUnique('unique_employee_payroll_period');
            $table->dropColumn('is_locked');
        });
    }
};
