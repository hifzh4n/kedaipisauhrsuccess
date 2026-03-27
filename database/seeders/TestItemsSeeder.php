<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Item;

class TestItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // Create 50 test items for pagination testing
        $items = [
            // Electronics
            ['Samsung Galaxy S24', 'SAMS24', '123456789001', 'Samsung', 'Pro', 'Black', 1500.00, 1800.00, 25],
            ['iPhone 15 Pro', 'IPH15P', '123456789002', 'Apple', 'Pro', 'Silver', 2000.00, 2400.00, 15],
            ['Sony WH-1000XM5', 'SONYWH5', '123456789003', 'Sony', 'Max', 'Black', 300.00, 400.00, 30],
            ['LG OLED C3 55"', 'LGOLED55', '123456789004', 'LG', 'Ultra', 'Black', 1200.00, 1500.00, 8],
            ['Canon EOS R6', 'CANR6', '123456789005', 'Canon', 'Pro', 'Black', 2500.00, 3000.00, 5],
            ['HP Pavilion 15', 'HPPAV15', '123456789006', 'HP', 'Standard', 'Silver', 800.00, 1000.00, 12],
            ['Dell XPS 13', 'DELLXPS13', '123456789007', 'Dell', 'Premium', 'Silver', 1200.00, 1500.00, 7],
            ['Lenovo ThinkPad X1', 'LENX1', '123456789008', 'Lenovo', 'Pro', 'Black', 1400.00, 1700.00, 9],
            ['Samsung 4K Monitor', 'SAM4K27', '123456789009', 'Samsung', 'Ultra', 'Black', 400.00, 500.00, 20],
            ['Apple MacBook Air M2', 'MACMA2', '123456789010', 'Apple', 'Air', 'Space Gray', 1200.00, 1500.00, 6],

            // Clothing & Accessories
            ['Nike Air Max 270', 'NIKE270', '123456789011', 'Nike', 'Max', 'White', 120.00, 150.00, 50],
            ['Adidas Ultraboost 22', 'ADIUB22', '123456789012', 'Adidas', 'Ultra', 'Black', 180.00, 220.00, 35],
            ['Nike Dri-FIT T-Shirt', 'NIKEDF', '123456789013', 'Nike', 'Standard', 'Blue', 25.00, 35.00, 100],
            ['Adidas Originals Hoodie', 'ADIORG', '123456789014', 'Adidas', 'Premium', 'Gray', 60.00, 80.00, 40],
            ['Nike Basketball Shorts', 'NIKEBB', '123456789015', 'Nike', 'Standard', 'Black', 35.00, 45.00, 60],
            ['Adidas Running Cap', 'ADICAP', '123456789016', 'Adidas', 'Basic', 'White', 20.00, 28.00, 80],
            ['Nike Sports Bra', 'NIKESB', '123456789017', 'Nike', 'Pro', 'Pink', 30.00, 40.00, 45],
            ['Adidas Training Pants', 'ADITP', '123456789018', 'Adidas', 'Premium', 'Black', 50.00, 65.00, 30],
            ['Nike Socks Pack', 'NIKESK', '123456789019', 'Nike', 'Basic', 'White', 15.00, 20.00, 120],
            ['Adidas Backpack', 'ADIBP', '123456789020', 'Adidas', 'Standard', 'Black', 40.00, 55.00, 25],

            // Home & Kitchen
            ['Kitchen Knife Set', 'KNIFSET', '123456789021', 'KitchenPro', 'Premium', 'Silver', 80.00, 120.00, 15],
            ['Coffee Maker Deluxe', 'COFFEE', '123456789022', 'BrewMaster', 'Deluxe', 'Black', 150.00, 200.00, 8],
            ['Blender Pro 1000W', 'BLEND1K', '123456789023', 'BlendTech', 'Pro', 'Red', 120.00, 160.00, 12],
            ['Air Fryer 5L', 'AIRFRY5', '123456789024', 'FryMaster', 'Standard', 'White', 100.00, 140.00, 18],
            ['Rice Cooker Smart', 'RICE1', '123456789025', 'RicePro', 'Smart', 'Black', 60.00, 85.00, 22],
            ['Toaster 4-Slice', 'TOAST4', '123456789026', 'ToastMaster', 'Standard', 'Silver', 45.00, 65.00, 30],
            ['Microwave 1000W', 'MICRO1K', '123456789027', 'MicroTech', 'Standard', 'White', 200.00, 280.00, 10],
            ['Dishwasher Tablets', 'DISHWASH', '123456789028', 'CleanPro', 'Basic', 'Blue', 25.00, 35.00, 50],
            ['Kitchen Scale Digital', 'SCALE1', '123456789029', 'ScaleTech', 'Digital', 'Black', 30.00, 45.00, 35],
            ['Cutting Board Set', 'CUTBOARD', '123456789030', 'BoardPro', 'Premium', 'Bamboo', 40.00, 60.00, 20],

            // Office Supplies
            ['Wireless Mouse', 'MOUSE1', '123456789031', 'TechMouse', 'Wireless', 'Black', 25.00, 35.00, 60],
            ['Mechanical Keyboard', 'KEYB1', '123456789032', 'KeyTech', 'Mechanical', 'Black', 80.00, 120.00, 25],
            ['USB-C Hub', 'USBHUB', '123456789033', 'HubTech', 'Multi-Port', 'Silver', 35.00, 50.00, 40],
            ['Monitor Stand', 'MONSTAND', '123456789034', 'StandPro', 'Adjustable', 'Black', 45.00, 65.00, 30],
            ['Desk Lamp LED', 'LAMPLED', '123456789035', 'LightPro', 'LED', 'White', 30.00, 45.00, 50],
            ['Notebook A4', 'NOTEBOOK', '123456789036', 'PaperPro', 'A4', 'White', 5.00, 8.00, 200],
            ['Pen Set Premium', 'PENSET', '123456789037', 'PenPro', 'Premium', 'Black', 15.00, 25.00, 80],
            ['Stapler Heavy Duty', 'STAPLER', '123456789038', 'StaplePro', 'Heavy', 'Black', 20.00, 30.00, 45],
            ['File Organizer', 'FILEORG', '123456789039', 'OrgPro', 'Multi-Compartment', 'Gray', 25.00, 40.00, 35],
            ['Whiteboard 60x40', 'WHITEBD', '123456789040', 'BoardPro', 'Magnetic', 'White', 50.00, 75.00, 15],

            // Health & Beauty
            ['Electric Toothbrush', 'TOOTHBR', '123456789041', 'DentalPro', 'Electric', 'White', 60.00, 85.00, 25],
            ['Hair Dryer 2000W', 'HAIRDRY', '123456789042', 'HairPro', '2000W', 'Pink', 45.00, 65.00, 20],
            ['Face Moisturizer', 'MOISTUR', '123456789043', 'SkinCare', 'Anti-Aging', 'White', 30.00, 45.00, 40],
            ['Shampoo Set', 'SHAMPOO', '123456789044', 'HairCare', 'Repair', 'Blue', 25.00, 35.00, 60],
            ['Vitamin C Serum', 'VITC', '123456789045', 'SkinPro', 'Vitamin C', 'Orange', 40.00, 60.00, 30],
            ['Body Lotion', 'BODYLOT', '123456789046', 'BodyCare', 'Hydrating', 'White', 20.00, 30.00, 50],
            ['Lip Balm Set', 'LIPBALM', '123456789047', 'LipCare', 'Moisturizing', 'Pink', 15.00, 25.00, 80],
            ['Nail Polish Set', 'NAILPOL', '123456789048', 'NailPro', 'Gel', 'Red', 35.00, 50.00, 25],
            ['Makeup Brush Set', 'BRUSHSET', '123456789049', 'MakeupPro', 'Professional', 'Black', 50.00, 75.00, 20],
            ['Perfume 50ml', 'PERFUME', '123456789050', 'FragrancePro', 'Eau de Parfum', 'Gold', 80.00, 120.00, 15],
        ];

        foreach ($items as $index => $itemData) {
            Item::create([
                'item_id' => 'TEST' . str_pad($index + 1, 3, '0', STR_PAD_LEFT), // Generate unique item_id
                'item_name' => $itemData[0],
                'sku_id' => $itemData[1],
                'barcode' => $itemData[2],
                'brand' => $itemData[3],
                'model' => $itemData[4],
                'color' => $itemData[5],
                'cost_price' => $itemData[6],
                'retail_price' => $itemData[7],
                'quantity' => $itemData[8],
                'picture' => null,
                'description' => 'Test item for pagination testing',
                'status' => 'ready_stock',
            ]);
        }

        $this->command->info('Created 50 test items for pagination testing!');
    }
}
