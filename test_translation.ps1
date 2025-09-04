$headers = @{"Content-Type"="application/json"; "Accept"="application/json"}

# Test 1: Simple document translation
$body1 = @{
    text = "Document Translation Service. Welcome to our comprehensive document translation platform. This service is designed to help individuals and businesses translate documents across multiple languages with high accuracy."
    source_language = "en"
    target_language = "ta"
} | ConvertTo-Json

Write-Host "Testing simple document translation (English to Tamil)..."
try {
    $result1 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/translate" -Method POST -Headers $headers -Body $body1
    Write-Host "Success:" $result1.success
    Write-Host "Message:" $result1.message
    Write-Host "Translated Text:" $result1.data.translated_text
    Write-Host "Character Count:" $result1.data.character_count
    Write-Host "Word Count:" $result1.data.word_count
    Write-Host "---"
} catch {
    Write-Host "Error:" $_.Exception.Message
}

# Test 2: Another language pair  
$body2 = @{
    text = "Hello everyone! This is a test to verify that our Google Translate integration is working properly. We are testing the translation from English to Sinhala language."
    source_language = "en"
    target_language = "si"
} | ConvertTo-Json

Write-Host "Testing English to Sinhala translation..."
try {
    $result2 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/translate" -Method POST -Headers $headers -Body $body2
    Write-Host "Success:" $result2.success
    Write-Host "Message:" $result2.message  
    Write-Host "Translated Text:" $result2.data.translated_text
    Write-Host "---"
} catch {
    Write-Host "Error:" $_.Exception.Message
}
