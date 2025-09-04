<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Translation;

echo "=== TRANSLATION DATABASE CONTENT ===\n\n";

$totalCount = Translation::count();
echo "Total Translations: $totalCount\n\n";

echo "Status Breakdown:\n";
echo "- Completed: " . Translation::where('status', 'completed')->count() . "\n";
echo "- Processing: " . Translation::where('status', 'processing')->count() . "\n";
echo "- Failed: " . Translation::where('status', 'failed')->count() . "\n\n";

echo "Recent Translations (Last 10):\n";
echo str_repeat("=", 80) . "\n";

$translations = Translation::orderBy('created_at', 'desc')->take(10)->get();

foreach ($translations as $translation) {
    echo "ID: {$translation->id}\n";
    echo "Languages: {$translation->source_language} -> {$translation->target_language}\n";
    echo "Status: {$translation->status}\n";
    echo "Created: {$translation->created_at}\n";
    echo "Original Text: " . substr($translation->original_text, 0, 100) . "...\n";
    echo "Translated Text: " . substr($translation->translated_text, 0, 100) . "...\n";
    echo str_repeat("-", 40) . "\n";
}

echo "\nLanguage Pairs Usage:\n";
$languagePairs = Translation::selectRaw('source_language, target_language, COUNT(*) as count')
    ->groupBy('source_language', 'target_language')
    ->orderBy('count', 'desc')
    ->get();

foreach ($languagePairs as $pair) {
    echo "{$pair->source_language} -> {$pair->target_language}: {$pair->count} translations\n";
}
