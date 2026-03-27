<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Item;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DamagedItem>
 */
class DamagedItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'item_id' => Item::factory(),
            'quantity' => fake()->numberBetween(1, 50),
            'damage_reason' => fake()->randomElement([
                'Transport damage',
                'Manufacturing defect',
                'Water damage',
                'Physical impact',
                'Electrical failure',
                'Packaging damage'
            ]),
            'batch_number' => 'BATCH-' . fake()->numberBetween(10000, 99999),
            'user_id' => User::factory(),
            'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
