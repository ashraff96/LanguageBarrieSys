<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Language;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'priority' => 100],
            ['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español', 'priority' => 90],
            ['code' => 'fr', 'name' => 'French', 'native_name' => 'Français', 'priority' => 85],
            ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch', 'priority' => 80],
            ['code' => 'it', 'name' => 'Italian', 'native_name' => 'Italiano', 'priority' => 75],
            ['code' => 'pt', 'name' => 'Portuguese', 'native_name' => 'Português', 'priority' => 70],
            ['code' => 'ru', 'name' => 'Russian', 'native_name' => 'Русский', 'priority' => 65],
            ['code' => 'ja', 'name' => 'Japanese', 'native_name' => '日本語', 'priority' => 60],
            ['code' => 'ko', 'name' => 'Korean', 'native_name' => '한국어', 'priority' => 55],
            ['code' => 'zh', 'name' => 'Chinese', 'native_name' => '中文', 'priority' => 50],
            ['code' => 'ar', 'name' => 'Arabic', 'native_name' => 'العربية', 'priority' => 45],
            ['code' => 'hi', 'name' => 'Hindi', 'native_name' => 'हिन्दी', 'priority' => 40],
            ['code' => 'bn', 'name' => 'Bengali', 'native_name' => 'বাংলা', 'priority' => 35],
            ['code' => 'tr', 'name' => 'Turkish', 'native_name' => 'Türkçe', 'priority' => 30],
            ['code' => 'nl', 'name' => 'Dutch', 'native_name' => 'Nederlands', 'priority' => 25],
            ['code' => 'pl', 'name' => 'Polish', 'native_name' => 'Polski', 'priority' => 20],
            ['code' => 'sv', 'name' => 'Swedish', 'native_name' => 'Svenska', 'priority' => 15],
            ['code' => 'da', 'name' => 'Danish', 'native_name' => 'Dansk', 'priority' => 10],
            ['code' => 'no', 'name' => 'Norwegian', 'native_name' => 'Norsk', 'priority' => 5],
            ['code' => 'fi', 'name' => 'Finnish', 'native_name' => 'Suomi', 'priority' => 0],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                $language
            );
        }
    }
} 