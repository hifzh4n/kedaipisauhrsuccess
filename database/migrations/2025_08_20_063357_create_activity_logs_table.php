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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'item_created', 'item_deleted', 'stock_in', 'stock_out'
            $table->string('description'); // Human readable description
            $table->string('item_id')->nullable(); // Related custom item ID (e.g., "34104")
            $table->json('metadata')->nullable(); // Additional data (quantity, reason, etc.)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            // Note: No foreign key constraint on item_id since items.item_id is not unique
            // This allows flexibility while maintaining data integrity through application logic
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['created_at', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
