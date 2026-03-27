<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'MSI', 'Intel'];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(
                ['name' => $brand],
                ['name' => $brand]
            );
        }
    }
}
