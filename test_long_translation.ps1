$headers = @{"Content-Type"="application/json"; "Accept"="application/json"}

# Test with a longer document to verify chunking
$longText = @"
Document Translation Service User Manual

Welcome to our comprehensive document translation platform! This advanced service is specifically designed to help individuals and businesses translate documents across multiple languages with exceptional accuracy and speed.

Chapter 1: Introduction
Our translation technology leverages cutting-edge algorithms and machine learning capabilities to ensure that your documents are translated accurately while maintaining the original context, tone, and meaning. Whether you're translating business documents, academic papers, legal contracts, technical manuals, or personal correspondence, our service provides professional-quality results that meet international standards.

Chapter 2: Key Features
- Support for multiple languages including English, Tamil, Sinhala, and many others
- Fast and reliable translation processing with real-time results
- Secure document handling with enterprise-grade encryption
- User-friendly interface designed for both beginners and professionals
- Batch processing capabilities for multiple documents
- Quality assurance mechanisms to ensure translation accuracy
- Export options in various formats including PDF, Word, and plain text

Chapter 3: Getting Started
1. Create your account and verify your email address
2. Upload your document using our secure file transfer system
3. Select the source language (the language your document is currently in)
4. Choose the target language (the language you want to translate to)
5. Review translation options and quality settings
6. Submit your translation request and wait for processing
7. Review the translated document in our online preview
8. Download the final translated document to your device

Chapter 4: Best Practices
To achieve the best translation results, we recommend following these guidelines:
- Ensure your source document is clear and well-formatted
- Use standard fonts and avoid excessive styling
- Proofread your document before translation
- Provide context information for technical terms
- Review the translated output and make necessary adjustments

We are committed to providing excellent translation services that break down language barriers and enable effective communication across cultures, helping you reach a global audience with confidence.
"@

$body = @{
    text = $longText
    source_language = "en"
    target_language = "ta"
} | ConvertTo-Json

Write-Host "Testing long document translation with chunking (English to Tamil)..."
Write-Host "Original text length: $($longText.Length) characters"
Write-Host "Processing..."

try {
    $result = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/translate" -Method POST -Headers $headers -Body $body
    Write-Host "Success:" $result.success
    Write-Host "Message:" $result.message
    Write-Host "Original Character Count:" $result.data.character_count
    Write-Host "Original Word Count:" $result.data.word_count
    Write-Host "Translated Character Count:" $result.data.translated_text.Length
    Write-Host ""
    Write-Host "First 500 characters of translated text:"
    Write-Host $result.data.translated_text.Substring(0, [Math]::Min(500, $result.data.translated_text.Length))
    Write-Host "..."
    Write-Host ""
    Write-Host "Last 200 characters of translated text:"
    $startIndex = [Math]::Max(0, $result.data.translated_text.Length - 200)
    Write-Host $result.data.translated_text.Substring($startIndex)
} catch {
    Write-Host "Error:" $_.Exception.Message
}
