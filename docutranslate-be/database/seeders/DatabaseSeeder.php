<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            LanguageSeeder::class,
        ]);

        // Create a default admin user
        \App\Models\User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@docutranslate.com',
            'password' => bcrypt('password'),
            'status' => 'active'
        ])->roles()->attach(\App\Models\Role::where('name', 'admin')->first()->id);
    }
}
