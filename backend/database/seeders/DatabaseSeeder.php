<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'test@example.com',
            'password' => Hash::make('admin1234'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $categories = ['Smartphones', 'Tablettes', 'Accessoires', 'Chargeurs', 'Coques', 'Écouteurs'];
        foreach ($categories as $name) {
            Category::create(['name' => $name]);
        }
    }
}
