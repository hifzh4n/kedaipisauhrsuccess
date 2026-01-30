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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_id')->unique(); // Custom item ID - must be unique for foreign key references
            $table->string('sku_id')->unique();
            $table->string('barcode')->unique()->nullable();
            $table->string('item_name');
            $table->string('brand');
            $table->string('model');
            $table->string('color');
            $table->text('description')->nullable();
            $table->string('picture')->nullable();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('retail_price', 10, 2);
            $table->integer('quantity')->default(0);
            $table->enum('status', ['out_of_stock', 'low_stock', 'ready_stock'])->default('out_of_stock');
            $table->timestamps();
            
            // Add index for foreign key constraints
            $table->index('item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
