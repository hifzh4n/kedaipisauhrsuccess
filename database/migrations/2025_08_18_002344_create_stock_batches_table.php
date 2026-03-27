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
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->string('item_id'); // Reference the custom item_id, not the auto-increment id
            $table->string('batch_number')->unique();
            $table->integer('quantity_received');
            $table->integer('quantity_remaining');
            $table->string('reason'); // purchase, return, adjustment, etc.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('item_id')->on('items')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');

            $table->index(['item_id', 'created_at']); // For FIFO queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
