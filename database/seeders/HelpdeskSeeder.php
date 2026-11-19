<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HelpdeskSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        foreach (['Hardware', 'Software', 'Redes', 'Otros'] as $name) {
            Category::firstOrCreate(['name' => $name]);
        }

        User::firstOrCreate(
            ['email' => 'admin@helpdesk.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }
}
