<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Brand;
use App\Models\ItemModel;
use App\Models\Color;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\DamagedItem;
use App\Models\ActivityLog;

class SeedPaginationData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pagination {--count=1000 : Number of items to create} {--type=items : Type of data to seed (items, movements, logs, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed data for pagination testing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = (int) $this->option('count');
        $type = $this->option('type');

        $this->info("Starting pagination data seeding...");
        $this->info("Type: {$type}, Count: {$count}");

        switch ($type) {
            case 'items':
                $this->seedItems($count);
                break;
            case 'movements':
                $this->seedStockMovements($count);
                break;
            case 'logs':
                $this->seedActivityLogs($count);
                break;
            case 'all':
                $this->seedItems($count);
                $this->seedStockMovements($count);
                $this->seedActivityLogs($count);
                break;
            default:
                $this->error("Invalid type. Use: items, movements, logs, or all");
                return 1;
        }

        $this->info("Pagination data seeding completed!");
        return 0;
    }

    private function seedItems(int $count): void
    {
        $this->info("Creating {$count} items...");
        
        $brands = Brand::all();
        $models = ItemModel::all();
        $colors = Color::all();
        
        if ($brands->count() === 0 || $models->count() === 0 || $colors->count() === 0) {
            $this->error("Please run basic seeders first (UserSeeder, AttributeSeeder)");
            return;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
            $brand = $brands->random();
            $brandModels = $models->where('brand_id', $brand->id);
            $model = $brandModels->count() > 0 ? $brandModels->random() : $models->random();
            $brandColors = $colors->where('brand_id', $brand->id)->where('model_id', $model->id);
            $color = $brandColors->count() > 0 ? $brandColors->first() : $colors->random();
            
            $startId = Item::max('id') ?? 0;
            
            Item::create([
                'item_id' => 'ITM-' . (30000 + $startId + $i + 1),
                'sku_id' => 'SKU-' . (30000 + $startId + $i + 1),
                'barcode' => '123456789012' . str_pad($startId + $i + 1, 3, '0', STR_PAD_LEFT),
                'item_name' => fake()->words(3, true),
                'brand' => $brand->name,
                'model' => $model->name,
                'color' => $color ? $color->name : 'Default Color',
                'description' => fake()->paragraph(),
                'picture' => 'https://picsum.photos/300/300?random=' . ($startId + $i + 1),
                'cost_price' => fake()->randomFloat(2, 10, 1000),
                'retail_price' => fake()->randomFloat(2, 15, 1500),
                'quantity' => fake()->numberBetween(0, 100),
                'status' => fake()->randomElement(['out_of_stock', 'low_stock', 'ready_stock']),
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Items created successfully! Total: " . Item::count());
    }

    private function seedStockMovements(int $count): void
    {
        $this->info("Creating {$count} stock movements...");
        
        $items = Item::all();
        $users = User::all();
        
        if ($items->count() === 0 || $users->count() === 0) {
            $this->error("No items or users found. Please seed basic data first.");
            return;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
            $item = $items->random();
            $user = $users->random();
            $quantity = fake()->numberBetween(1, 100);
            
            StockMovement::create([
                'item_id' => $item->item_id,
                'type' => fake()->randomElement(['in', 'out']),
                'quantity' => $quantity,
                'reason' => fake()->randomElement(['sale', 'purchase', 'return', 'transfer', 'adjustment', 'damage']),
                'batch_number' => 'BATCH-' . fake()->numberBetween(30000, 39999),
                'status' => fake()->randomElement(['in_possession', 'gone']),
                'balance_after' => fake()->numberBetween(0, 1000),
                'user_id' => $user->id,
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
                'updated_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Stock movements created successfully! Total: " . StockMovement::count());
    }

    private function seedActivityLogs(int $count): void
    {
        $this->info("Creating {$count} activity logs...");
        
        $items = Item::all();
        $users = User::all();
        
        if ($items->count() === 0 || $users->count() === 0) {
            $this->error("No items or users found. Please seed basic data first.");
            return;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
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

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Activity logs created successfully! Total: " . ActivityLog::count());
    }
}
