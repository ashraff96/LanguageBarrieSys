<?php
// Test Google Translate Integration
require_once 'vendor/autoload.php';

use Stichoza\GoogleTranslate\GoogleTranslate;

echo "Testing Google Translate Integration...\n\n";

try {
    // Test 1: English to Tamil
    echo "Test 1: English to Tamil\n";
    $translator = new GoogleTranslate('ta', 'en');
    $result = $translator->translate('Hello, how are you today?');
    echo "Original: Hello, how are you today?\n";
    echo "Tamil: $result\n\n";

    // Test 2: English to Sinhala
    echo "Test 2: English to Sinhala\n";
    $translator->setTarget('si');
    $result2 = $translator->translate('This is a test document for translation.');
    echo "Original: This is a test document for translation.\n";
    echo "Sinhala: $result2\n\n";

    // Test 3: Longer text (paragraph)
    echo "Test 3: Longer text\n";
    $longText = "Document translation is an important service that helps people communicate across language barriers. It enables businesses to expand globally and individuals to access information in their preferred language. Our translation service uses advanced technology to provide accurate and reliable translations.";
    $translator->setTarget('ta');
    $result3 = $translator->translate($longText);
    echo "Original: $longText\n";
    echo "Tamil: $result3\n\n";

    echo "All tests completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "This might be due to rate limiting or network issues.\n";
}
?>
