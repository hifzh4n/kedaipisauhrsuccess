<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Item;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockBatch>
 */
class StockBatchFactory extends Factory
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

        $quantityReceived = fake()->numberBetween(50, 500);
        $quantityRemaining = fake()->numberBetween(0, $quantityReceived);

        return [
            'item_id' => Item::factory(),
            'batch_number' => 'BATCH-' . (10000 + $counter),
            'quantity_received' => $quantityReceived,
            'quantity_remaining' => $quantityRemaining,
            'reason' => fake()->randomElement(['purchase', 'return', 'transfer', 'adjustment']),
            'manufacture_date' => fake()->dateTimeBetween('-1 year', '-1 month'),
            'status' => fake()->randomElement(['active', 'empty', 'expired']),
            'expiry_date' => fake()->dateTimeBetween('now', '+2 years'),
            'user_id' => User::factory(),
            'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
