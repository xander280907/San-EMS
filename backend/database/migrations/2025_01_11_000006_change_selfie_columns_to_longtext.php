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
            // Change all selfie columns from TEXT to LONGTEXT to support larger base64 images
            $table->longText('clock_in_selfie')->nullable()->change();
            $table->longText('clock_out_selfie')->nullable()->change();
            $table->longText('morning_clock_in_selfie')->nullable()->change();
            $table->longText('morning_clock_out_selfie')->nullable()->change();
            $table->longText('afternoon_clock_in_selfie')->nullable()->change();
            $table->longText('afternoon_clock_out_selfie')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Revert back to TEXT (though this might truncate data)
            $table->text('clock_in_selfie')->nullable()->change();
            $table->text('clock_out_selfie')->nullable()->change();
            $table->text('morning_clock_in_selfie')->nullable()->change();
            $table->text('morning_clock_out_selfie')->nullable()->change();
            $table->text('afternoon_clock_in_selfie')->nullable()->change();
            $table->text('afternoon_clock_out_selfie')->nullable()->change();
        });
    }
};
