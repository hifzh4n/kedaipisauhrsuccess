<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::statement('ALTER TABLE `items` DROP INDEX `items_barcode_unique`');
        } catch (\Throwable $e) {
            // Index may already be removed in some environments.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement('ALTER TABLE `items` ADD UNIQUE `items_barcode_unique` (`barcode`)');
        } catch (\Throwable $e) {
            // Re-adding unique index can fail when duplicate barcodes exist.
        }
    }
};
