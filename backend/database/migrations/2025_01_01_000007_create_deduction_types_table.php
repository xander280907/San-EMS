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
        Schema::create('deduction_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // PhilHealth, SSS, Pag-IBIG, Withholding Tax, etc.
            $table->string('code')->unique(); // PH, SSS, PAGIBIG, TAX
            $table->enum('type', ['standard', 'custom'])->default('standard');
            $table->decimal('rate', 5, 2)->default(0); // Percentage
            $table->decimal('fixed_amount', 10, 2)->nullable();
            $table->boolean('is_mandatory')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_types');
    }
};
