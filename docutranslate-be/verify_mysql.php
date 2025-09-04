<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Translation;

echo "=== MYSQL DATABASE VERIFICATION ===\n\n";

$totalCount = Translation::count();
echo "Total Translations in MySQL: $totalCount\n\n";

echo "Recent Translations (Last 5):\n";
echo str_repeat("=", 80) . "\n";

$translations = Translation::orderBy('created_at', 'desc')->take(5)->get();

foreach ($translations as $translation) {
    echo "ID: {$translation->id}\n";
    echo "Languages: {$translation->source_language} -> {$translation->target_language}\n";
    echo "Status: {$translation->status}\n";
    echo "Created: {$translation->created_at}\n";
    echo "Original Text: " . substr($translation->original_text, 0, 50) . "...\n";
    echo str_repeat("-", 40) . "\n";
}

echo "\nYou can now run this query in MySQL Workbench:\n";
echo "SELECT * FROM docu_translate.translations;\n\n";
echo "Connection details for MySQL Workbench:\n";
echo "Host: 127.0.0.1\n";
echo "Port: 3306\n";
echo "Username: root\n";
echo "Password: 1234\n";
echo "Database: docu_translate\n";
