<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users
        if (DB::table('users')->count() === 0) {
            DB::table('users')->insert([
                [
                    'id' => 1,
                    'name' => 'Admin Patriot',
                    'email' => 'admin@patriot.com',
                    'password' => Hash::make('password'),
                    'role' => 'ADMIN',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id' => 2,
                    'name' => 'Dr. Jane Smith',
                    'email' => 'dokter@patriot.com',
                    'password' => Hash::make('password'),
                    'role' => 'DOKTER',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id' => 3,
                    'name' => 'Budi Santoso',
                    'email' => 'peserta@patriot.com',
                    'password' => Hash::make('password'),
                    'role' => 'PESERTA',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        }

        // 2. Call MewsSeeder
        $this->call(MewsSeeder::class);
    }
}
