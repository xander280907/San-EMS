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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Sick Leave, Vacation Leave, Emergency Leave, etc.
            $table->text('description')->nullable();
            $table->integer('max_days_per_year')->default(0); // 0 = unlimited
            $table->boolean('carry_over')->default(false);
            $table->boolean('requires_approval')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
