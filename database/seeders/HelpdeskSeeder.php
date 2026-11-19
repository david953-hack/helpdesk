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

        foreach ([
            ['name' => 'Administrador', 'email' => 'admin@helpdesk.com', 'password' => 'admin123', 'role' => 'admin'],
            ['name' => 'Sofía Ramírez', 'email' => 'agente@helpdesk.com', 'password' => 'agente123', 'role' => 'tecnico'],
            ['name' => 'Laura Martín', 'email' => 'laura@helpdesk.com', 'password' => 'usuario123', 'role' => 'usuario'],
            ['name' => 'Carlos Ruiz', 'email' => 'carlos@helpdesk.com', 'password' => 'usuario123', 'role' => 'usuario'],
        ] as $account) {
            User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['password']),
                    'role' => $account['role'],
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
