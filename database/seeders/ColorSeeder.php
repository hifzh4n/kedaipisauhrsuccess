<?php

namespace Database\Seeders;

use App\Models\Color;
use Illuminate\Database\Seeder;

class ColorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $colors = ['Black', 'Silver', 'Gold', 'White', 'Blue', 'Green', 'Red', 'Purple', 'Gray', 'Rose Gold'];

        foreach ($colors as $color) {
            Color::firstOrCreate(
                ['name' => $color],
                ['name' => $color]
            );
        }
    }
}
