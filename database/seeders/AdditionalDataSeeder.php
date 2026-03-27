<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Brand;
use App\Models\ItemModel;
use App\Models\Color;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\DamagedItem;
use App\Models\ActivityLog;

class AdditionalDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting additional data seeding for extensive pagination testing...');

        // Get existing data for relationships
        $existingUsers = User::all();
        $existingBrands = Brand::all();
        $existingModels = ItemModel::all();
        $existingColors = Color::all();
        $existingItems = Item::all();

        if ($existingUsers->count() === 0 || $existingBrands->count() === 0 || 
            $existingModels->count() === 0 || $existingColors->count() === 0 || 
            $existingItems->count() === 0) {
            $this->command->error('Please run the basic seeders first!');
            return;
        }

        // Add 500 more items (total 1500)
        $this->command->info('Adding 500 more items...');
        $startIndex = $existingItems->count() + 1;
        for ($i = 0; $i < 500; $i++) {
            $brand = $existingBrands->random();
            $brandModels = $existingModels->where('brand_id', $brand->id);
            $model = $brandModels->count() > 0 ? $brandModels->random() : $existingModels->random();
            $brandColors = $existingColors->where('brand_id', $brand->id)->where('model_id', $model->id);
            $color = $brandColors->count() > 0 ? $brandColors->first() : $existingColors->random();
            
            Item::create([
                'item_id' => 'ITM-' . (20000 + $i + 1),
                'sku_id' => 'SKU-' . (20000 + $i + 1),
                'barcode' => '123456789012' . str_pad($startIndex + $i, 3, '0', STR_PAD_LEFT),
                'item_name' => fake()->words(3, true),
                'brand' => $brand->name,
                'model' => $model->name,
                'color' => $color ? $color->name : 'Default Color',
                'description' => fake()->paragraph(),
                'picture' => 'https://picsum.photos/300/300?random=' . ($startIndex + $i),
                'cost_price' => fake()->randomFloat(2, 10, 1000),
                'retail_price' => fake()->randomFloat(2, 15, 1500),
                'quantity' => fake()->numberBetween(0, 100),
                'status' => fake()->randomElement(['out_of_stock', 'low_stock', 'ready_stock']),
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Additional items created successfully!');

        // Add 500 more stock movements (total 1300)
        $this->command->info('Adding 500 more stock movements...');
        for ($i = 0; $i < 500; $i++) {
            $item = $existingItems->random();
            $user = $existingUsers->random();
            $quantity = fake()->numberBetween(1, 100);
            
            StockMovement::create([
                'item_id' => $item->item_id,
                'type' => fake()->randomElement(['in', 'out']),
                'quantity' => $quantity,
                'reason' => fake()->randomElement(['sale', 'purchase', 'return', 'transfer', 'adjustment', 'damage']),
                'batch_number' => 'BATCH-' . fake()->numberBetween(20000, 29999),
                'status' => fake()->randomElement(['in_possession', 'gone']),
                'balance_after' => fake()->numberBetween(0, 1000),
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Additional stock movements created successfully!');

        // Add 1000 more activity logs (total 2500)
        $this->command->info('Adding 1000 more activity logs...');
        for ($i = 0; $i < 1000; $i++) {
            $item = $existingItems->random();
            $user = $existingUsers->random();
            
            ActivityLog::create([
                'type' => fake()->randomElement(['create', 'update', 'delete', 'view', 'export', 'import']),
                'description' => fake()->sentence(),
                'item_id' => $item->item_id,
                'metadata' => json_encode([
                    'ip_address' => fake()->ipv4(),
                    'user_agent' => fake()->userAgent(),
                    'action_details' => fake()->paragraph()
                ]),
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Additional activity logs created successfully!');

        $this->command->info('Additional data seeding completed successfully!');
        $this->command->info('Updated totals:');
        $this->command->info('- Items: ' . Item::count());
        $this->command->info('- Stock Movements: ' . StockMovement::count());
        $this->command->info('- Activity Logs: ' . ActivityLog::count());
    }
}
