<?php

namespace Database\Seeders;

use App\Models\ItemModel;
use Illuminate\Database\Seeder;

class ItemModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            'MacBook Pro', 'iPhone 15', 'iPad', 'Galaxy S24', 'Galaxy Tab',
            'Bravia', 'OLED TV', 'ThinkPad', 'Pavilion', 'ROG Gaming',
            'RTX 4090', 'Ryzen 9'
        ];

        foreach ($models as $model) {
            ItemModel::firstOrCreate(
                ['name' => $model],
                ['name' => $model]
            );
        }
    }
}
