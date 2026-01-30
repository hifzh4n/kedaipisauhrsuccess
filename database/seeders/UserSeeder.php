<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'first_name' => 'HR',
            'last_name' => 'Knives',
            'email' => 'hrknivesofficial@gmail.com',
            'password' => Hash::make('Hr01012019@'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->command->info('Admin user seeded successfully!');
        $this->command->info('Email: hrknivesofficial@gmail.com');
        $this->command->info('Password: Hr01012019@');
        $this->command->info('Role: admin');
    }
}
