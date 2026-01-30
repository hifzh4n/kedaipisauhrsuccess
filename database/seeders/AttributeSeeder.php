<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\ItemModel;
use App\Models\Color;

class AttributeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create brands
        $apple = Brand::firstOrCreate(['name' => 'Apple']);
        $samsung = Brand::firstOrCreate(['name' => 'Samsung']);
        $sony = Brand::firstOrCreate(['name' => 'Sony']);

        // Create models for Apple
        $iphone15Pro = ItemModel::firstOrCreate(['name' => 'iPhone 15 Pro', 'brand_id' => $apple->id]);
        $macbookAir = ItemModel::firstOrCreate(['name' => 'MacBook Air', 'brand_id' => $apple->id]);

        // Create models for Samsung
        $galaxyS24 = ItemModel::firstOrCreate(['name' => 'Galaxy S24', 'brand_id' => $samsung->id]);

        // Create models for Sony
        $ps5 = ItemModel::firstOrCreate(['name' => 'PlayStation 5', 'brand_id' => $sony->id]);

        // Create colors for iPhone 15 Pro
        $iphoneColors = ['Space Black', 'White Titanium', 'Blue Titanium', 'Natural Titanium'];
        foreach ($iphoneColors as $colorName) {
            Color::firstOrCreate([
                'name' => $colorName,
                'brand_id' => $apple->id,
                'model_id' => $iphone15Pro->id,
            ]);
        }

        // Create colors for MacBook Air
        $macbookColors = ['Space Gray', 'Silver', 'Starlight', 'Midnight'];
        foreach ($macbookColors as $colorName) {
            Color::firstOrCreate([
                'name' => $colorName,
                'brand_id' => $apple->id,
                'model_id' => $macbookAir->id,
            ]);
        }

        // Create colors for Galaxy S24
        $galaxyColors = ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'];
        foreach ($galaxyColors as $colorName) {
            Color::firstOrCreate([
                'name' => $colorName,
                'brand_id' => $samsung->id,
                'model_id' => $galaxyS24->id,
            ]);
        }

        // Create colors for PlayStation 5
        $psColors = ['White', 'Black'];
        foreach ($psColors as $colorName) {
            Color::firstOrCreate([
                'name' => $colorName,
                'brand_id' => $sony->id,
                'model_id' => $ps5->id,
            ]);
        }


    }
}
