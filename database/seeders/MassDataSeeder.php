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
use Illuminate\Support\Facades\Hash;

class MassDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting mass data seeding for pagination testing...');

        // Create users first (50 users)
        $this->command->info('Creating 50 users...');
        User::factory(50)->create();
        $this->command->info('Users created successfully!');

        // Create brands (100 brands)
        $this->command->info('Creating 100 brands...');
        Brand::factory(100)->create();
        $this->command->info('Brands created successfully!');

        // Create item models (200 models)
        $this->command->info('Creating 200 item models...');
        $brands = Brand::all();
        for ($i = 0; $i < 200; $i++) {
            ItemModel::factory()->create([
                'brand_id' => $brands->random()->id,
            ]);
        }
        $this->command->info('Item models created successfully!');

        // Create colors (300 colors)
        $this->command->info('Creating 300 colors...');
        $models = ItemModel::all();
        for ($i = 0; $i < 300; $i++) {
            $model = $models->random();
            Color::factory()->create([
                'brand_id' => $model->brand_id,
                'model_id' => $model->id,
            ]);
        }
        $this->command->info('Colors created successfully!');

        // Create items (1000 items)
        $this->command->info('Creating 1000 items...');
        $brands = Brand::all();
        $models = ItemModel::all();
        $colors = Color::all();

        for ($i = 0; $i < 1000; $i++) {
            $brand = $brands->random();
            $brandModels = $models->where('brand_id', $brand->id);
            $model = $brandModels->count() > 0 ? $brandModels->random() : $models->random();
            $brandColors = $colors->where('brand_id', $brand->id)->where('model_id', $model->id);
            $color = $brandColors->count() > 0 ? $brandColors->first() : $colors->random();

            Item::create([
                'item_id' => 'ITM-' . (10000 + $i + 1),
                'sku_id' => 'SKU-' . (10000 + $i + 1),
                'barcode' => '123456789012' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'item_name' => fake()->words(3, true),
                'brand' => $brand->name,
                'model' => $model->name,
                'color' => $color ? $color->name : 'Default Color',
                'description' => fake()->paragraph(),
                'picture' => 'https://picsum.photos/300/300?random=' . ($i + 1),
                'cost_price' => fake()->randomFloat(2, 10, 1000),
                'retail_price' => fake()->randomFloat(2, 15, 1500),
                'quantity' => fake()->numberBetween(0, 100),
                'status' => fake()->randomElement(['out_of_stock', 'low_stock', 'ready_stock']),
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Items created successfully!');

        // Create stock batches (500 batches)
        $this->command->info('Creating 500 stock batches...');
        $items = Item::all();
        $users = User::all();

        for ($i = 0; $i < 500; $i++) {
            $item = $items->random();
            $user = $users->random();
            $quantityReceived = fake()->numberBetween(50, 500);
            $quantityRemaining = fake()->numberBetween(0, $quantityReceived);

            StockBatch::create([
                'item_id' => $item->item_id,
                'batch_number' => 'BATCH-' . (10000 + $i + 1),
                'quantity_received' => $quantityReceived,
                'quantity_remaining' => $quantityRemaining,
                'reason' => fake()->randomElement(['purchase', 'return', 'transfer', 'adjustment']),
                'manufacture_date' => fake()->dateTimeBetween('-1 year', '-1 month'),
                'status' => fake()->randomElement(['active', 'empty', 'expired']),
                'expiry_date' => fake()->dateTimeBetween('now', '+2 years'),
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Stock batches created successfully!');

        // Create stock movements (800 movements)
        $this->command->info('Creating 800 stock movements...');
        for ($i = 0; $i < 800; $i++) {
            $item = $items->random();
            $user = $users->random();
            $quantity = fake()->numberBetween(1, 100);

            StockMovement::create([
                'item_id' => $item->item_id,
                'type' => fake()->randomElement(['in', 'out']),
                'quantity' => $quantity,
                'reason' => fake()->randomElement(['sale', 'purchase', 'return', 'transfer', 'adjustment', 'damage']),
                'batch_number' => 'BATCH-' . fake()->numberBetween(10000, 99999),
                'status' => fake()->randomElement(['in_possession', 'gone']),
                'balance_after' => fake()->numberBetween(0, 1000),
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Stock movements created successfully!');

        // Create damaged items (200 damaged items)
        $this->command->info('Creating 200 damaged items...');
        for ($i = 0; $i < 200; $i++) {
            $item = $items->random();
            $user = $users->random();

            DamagedItem::create([
                'item_id' => $item->item_id,
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
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
        $this->command->info('Damaged items created successfully!');

        // Create activity logs (1500 activity logs)
        $this->command->info('Creating 1500 activity logs...');
        for ($i = 0; $i < 1500; $i++) {
            $item = $items->random();
            $user = $users->random();
            
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
        $this->command->info('Activity logs created successfully!');

        $this->command->info('Mass data seeding completed successfully!');
        $this->command->info('Total records created:');
        $this->command->info('- Users: ' . User::count());
        $this->command->info('- Brands: ' . Brand::count());
        $this->command->info('- Item Models: ' . ItemModel::count());
        $this->command->info('- Colors: ' . Color::count());
        $this->command->info('- Items: ' . Item::count());
        $this->command->info('- Stock Batches: ' . StockBatch::count());
        $this->command->info('- Stock Movements: ' . StockMovement::count());
        $this->command->info('- Damaged Items: ' . DamagedItem::count());
        $this->command->info('- Activity Logs: ' . ActivityLog::count());
    }
}
