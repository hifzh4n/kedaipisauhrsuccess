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
        // Clear existing model_color associations first
        DB::table('model_color')->delete();

        // Clear existing colors since they don't have brand/model associations
        DB::table('colors')->delete();

        Schema::table('colors', function (Blueprint $table) {
            // First add the missing columns
            $table->foreignId('brand_id')->after('name')->constrained('brands')->onDelete('cascade');
            $table->foreignId('model_id')->after('brand_id')->constrained('models')->onDelete('cascade');

            // Add composite unique constraint (name can be same for different brand/model combinations)
            $table->unique(['name', 'brand_id', 'model_id']);
        });

        // Drop the model_color pivot table since we don't need it anymore
        Schema::dropIfExists('model_color');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate model_color table
        Schema::create('model_color', function (Blueprint $table) {
            $table->id();
            $table->foreignId('model_id')->constrained('models')->onDelete('cascade');
            $table->foreignId('color_id')->constrained('colors')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['model_id', 'color_id']);
        });

        Schema::table('colors', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['model_id']);
            $table->dropUnique(['name', 'brand_id', 'model_id']);
            $table->dropColumn(['brand_id', 'model_id']);
        });
    }
};
