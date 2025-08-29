<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full system access and control'
            ],
            [
                'name' => 'translator',
                'display_name' => 'Translator',
                'description' => 'Professional translator with enhanced features'
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Standard user with basic translation features'
            ]
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
} 