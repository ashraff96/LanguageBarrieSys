<?php
// Direct test of Google Translate with chunking
require_once 'vendor/autoload.php';

use Stichoza\GoogleTranslate\GoogleTranslate;

echo "Testing Google Translate with long text and chunking...\n\n";

// Function to simulate the chunking logic from our controller
function chunkTextForTranslation($text, $maxChunkSize = 4500) {
    $chunks = [];
    
    if (strlen($text) <= $maxChunkSize) {
        return [$text];
    }

    // Split by paragraphs first (double newlines)
    $paragraphs = preg_split('/\n\s*\n/', $text);
    $currentChunk = '';
    
    foreach ($paragraphs as $paragraph) {
        if (strlen($currentChunk . "\n\n" . $paragraph) > $maxChunkSize && !empty($currentChunk)) {
            $chunks[] = $currentChunk;
            $currentChunk = $paragraph;
        } else {
            $currentChunk = empty($currentChunk) ? $paragraph : $currentChunk . "\n\n" . $paragraph;
        }
        
        if (strlen($currentChunk) > $maxChunkSize) {
            $sentences = preg_split('/(?<=[.!?])\s+/', $currentChunk);
            $tempChunk = '';
            
            foreach ($sentences as $sentence) {
                if (strlen($tempChunk . ' ' . $sentence) > $maxChunkSize && !empty($tempChunk)) {
                    $chunks[] = $tempChunk;
                    $tempChunk = $sentence;
                } else {
                    $tempChunk = empty($tempChunk) ? $sentence : $tempChunk . ' ' . $sentence;
                }
            }
            $currentChunk = $tempChunk;
        }
    }
    
    if (!empty($currentChunk)) {
        $chunks[] = $currentChunk;
    }
    
    return $chunks;
}

try {
    // Create a long text to test chunking
    $longText = str_repeat("This is a test sentence for Google Translate integration. We are testing the chunking functionality to ensure that long documents can be translated properly. ", 100);
    
    echo "Original text length: " . strlen($longText) . " characters\n";
    echo "Testing chunking function...\n";
    
    $chunks = chunkTextForTranslation($longText, 4500);
    echo "Text split into " . count($chunks) . " chunks\n";
    
    for ($i = 0; $i < count($chunks); $i++) {
        echo "Chunk " . ($i + 1) . " length: " . strlen($chunks[$i]) . " characters\n";
    }
    
    echo "\nTesting translation with Google Translate...\n";
    $translator = new GoogleTranslate('ta', 'en');
    
    $translatedChunks = [];
    for ($i = 0; $i < min(2, count($chunks)); $i++) { // Test only first 2 chunks
        echo "Translating chunk " . ($i + 1) . "...\n";
        $translated = $translator->translate($chunks[$i]);
        $translatedChunks[] = $translated;
        echo "Chunk " . ($i + 1) . " translated successfully (" . strlen($translated) . " characters)\n";
        
        if ($i < count($chunks) - 1) {
            echo "Waiting 0.5 seconds to avoid rate limiting...\n";
            usleep(500000);
        }
    }
    
    echo "\nChunking and translation test completed successfully!\n";
    echo "First translated chunk preview (first 200 chars):\n";
    echo substr($translatedChunks[0], 0, 200) . "...\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
