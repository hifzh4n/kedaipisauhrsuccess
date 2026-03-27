<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'item_id' => 'ITEM001',
                'sku_id' => 'SKU001',
                'barcode' => 'BAR001',
                'item_name' => 'MacBook Pro 16"',
                'brand' => 'Apple',
                'model' => 'MacBook Pro',
                'color' => 'Silver',
                'description' => 'High-performance laptop for professionals',
                'cost_price' => 1500.00,
                'retail_price' => 2499.00,
                'quantity' => 5,
            ],
            [
                'item_id' => 'ITEM002',
                'sku_id' => 'SKU002',
                'barcode' => 'BAR002',
                'item_name' => 'Samsung Galaxy S24',
                'brand' => 'Samsung',
                'model' => 'Galaxy S24',
                'color' => 'Black',
                'description' => 'Latest flagship smartphone',
                'cost_price' => 600.00,
                'retail_price' => 999.00,
                'quantity' => 15,
            ],
            [
                'item_id' => 'ITEM003',
                'sku_id' => 'SKU003',
                'barcode' => 'BAR003',
                'item_name' => 'Sony Bravia TV 55"',
                'brand' => 'Sony',
                'model' => 'Bravia',
                'color' => 'Black',
                'description' => '55-inch 4K OLED Television',
                'cost_price' => 800.00,
                'retail_price' => 1299.00,
                'quantity' => 3,
            ],
            [
                'item_id' => 'ITEM004',
                'sku_id' => 'SKU004',
                'barcode' => 'BAR004',
                'item_name' => 'Dell XPS 13',
                'brand' => 'Dell',
                'model' => 'XPS',
                'color' => 'Silver',
                'description' => 'Compact and powerful ultrabook',
                'cost_price' => 900.00,
                'retail_price' => 1399.00,
                'quantity' => 8,
            ],
            [
                'item_id' => 'ITEM005',
                'sku_id' => 'SKU005',
                'barcode' => 'BAR005',
                'item_name' => 'iPad Air',
                'brand' => 'Apple',
                'model' => 'iPad',
                'color' => 'Gold',
                'description' => '11-inch tablet with M1 chip',
                'cost_price' => 450.00,
                'retail_price' => 599.00,
                'quantity' => 12,
            ],
        ];

        foreach ($items as $item) {
            Item::firstOrCreate(
                ['sku_id' => $item['sku_id']],
                $item
            );
        }
    }
}
