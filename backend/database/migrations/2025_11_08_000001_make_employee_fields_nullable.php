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
        Schema::table('employees', function (Blueprint $table) {
            // Make fields nullable for admin/HR users who may not need full employee details
            $table->string('employee_number')->nullable()->change();
            $table->foreignId('department_id')->nullable()->change();
            $table->string('position')->nullable()->change();
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'probationary'])->nullable()->change();
            $table->date('hire_date')->nullable()->change();
            $table->decimal('base_salary', 12, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Revert to original constraints
            $table->string('employee_number')->nullable(false)->change();
            $table->foreignId('department_id')->nullable(false)->change();
            $table->string('position')->nullable(false)->change();
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'probationary'])->nullable(false)->change();
            $table->date('hire_date')->nullable(false)->change();
            $table->decimal('base_salary', 12, 2)->nullable(false)->change();
        });
    }
};
