<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Item;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(['create', 'update', 'delete', 'view', 'export', 'import']),
            'description' => fake()->sentence(),
            'item_id' => Item::factory(),
            'metadata' => json_encode([
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
                'action_details' => fake()->paragraph()
            ]),
            'user_id' => User::factory(),
            'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
