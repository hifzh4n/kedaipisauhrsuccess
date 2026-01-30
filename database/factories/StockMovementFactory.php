<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Item;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockMovement>
 */
class StockMovementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 100);

        return [
            'item_id' => Item::factory(),
            'type' => fake()->randomElement(['in', 'out']),
            'quantity' => $quantity,
            'reason' => fake()->randomElement(['sale', 'purchase', 'return', 'transfer', 'adjustment', 'damage']),
            'batch_number' => 'BATCH-' . fake()->numberBetween(10000, 99999),
            'status' => fake()->randomElement(['in_possession', 'gone']),
            'balance_after' => fake()->numberBetween(0, 1000),
            'user_id' => User::factory(),
            'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
