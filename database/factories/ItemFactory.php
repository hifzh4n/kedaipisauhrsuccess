<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Item>
 */
class ItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        return [
            'item_id' => 'ITM-' . (10000 + $counter),
            'sku_id' => 'SKU-' . (10000 + $counter),
            'barcode' => '123456789012' . str_pad($counter, 3, '0', STR_PAD_LEFT),
            'item_name' => fake()->words(3, true),
            'brand' => fake()->words(1, true) . ' ' . fake()->company(),
            'model' => fake()->words(2, true),
            'color' => fake()->words(1, true) . ' ' . fake()->colorName(),
            'description' => fake()->paragraph(),
            'picture' => 'https://picsum.photos/300/300?random=' . $counter,
            'cost_price' => fake()->randomFloat(2, 10, 1000),
            'retail_price' => fake()->randomFloat(2, 15, 1500),
            'quantity' => fake()->numberBetween(0, 100),
            'status' => fake()->randomElement(['out_of_stock', 'low_stock', 'ready_stock']),
            'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
