$headers = @{"Content-Type"="application/json"; "Accept"="application/json"}

# Test with a very long document to force chunking (over 4500 characters)
$veryLongText = @"
Document Translation Service Comprehensive User Manual and Technical Documentation

Table of Contents
1. Introduction and Overview
2. System Requirements and Setup
3. User Interface Guide
4. Translation Features and Capabilities
5. Advanced Configuration Options
6. Troubleshooting and Support
7. API Documentation and Integration
8. Security and Privacy Considerations
9. Performance Optimization
10. Best Practices and Guidelines

Chapter 1: Introduction and Overview

Welcome to our state-of-the-art document translation platform! This comprehensive service has been meticulously designed to serve the diverse needs of individuals, businesses, educational institutions, and government organizations worldwide. Our platform represents the culmination of years of research and development in the field of computational linguistics and artificial intelligence.

Our mission is to break down language barriers and facilitate seamless communication across cultures and borders. We understand that in today's interconnected world, the ability to communicate effectively in multiple languages is not just an advantage—it's a necessity. Whether you're a multinational corporation looking to expand into new markets, a researcher sharing findings with international colleagues, a student studying abroad, or simply someone trying to understand a document in a foreign language, our platform is here to help.

Chapter 2: System Requirements and Technical Specifications

Our platform has been built with scalability and accessibility in mind. We support a wide range of operating systems including Windows, macOS, and various Linux distributions. The web-based interface ensures compatibility across different browsers including Chrome, Firefox, Safari, and Edge.

For optimal performance, we recommend:
- A modern web browser with JavaScript enabled
- Stable internet connection with minimum 1 Mbps bandwidth
- At least 4GB of RAM for processing large documents
- Updated security certificates for secure file transfers

Chapter 3: User Interface and Navigation Guide

Our user interface has been designed with simplicity and efficiency in mind. The main dashboard provides quick access to all essential features:

Primary Navigation Menu:
- Dashboard: Overview of recent translations and system status
- New Translation: Start a new translation project
- Document Library: Access your previously translated documents
- Account Settings: Manage your profile and preferences
- Help Center: Access documentation and support resources

Translation Workflow:
1. Document Upload: Securely upload your documents using our encrypted file transfer system
2. Language Selection: Choose from over 100 supported languages for both source and target languages
3. Quality Settings: Select translation quality level based on your requirements
4. Processing: Our advanced algorithms process your document while maintaining formatting
5. Review: Preview the translated document before final delivery
6. Download: Receive your translated document in the original format

Chapter 4: Advanced Translation Features

Our platform offers numerous advanced features to enhance translation quality and user experience:

Intelligent Context Recognition: Our AI-powered system analyzes the context of your document to provide more accurate translations. This includes understanding industry-specific terminology, cultural references, and linguistic nuances.

Format Preservation: We maintain the original formatting of your documents, including fonts, styles, images, tables, and layout structures. This ensures that your translated documents look professional and maintain their intended appearance.

Collaborative Translation: Teams can work together on translation projects with real-time collaboration features, version control, and comment systems for feedback and improvement.

Quality Assurance: Multiple quality checkpoints ensure translation accuracy through automated grammar checking, consistency verification, and human review options for critical documents.

Chapter 5: Security and Privacy Framework

We take security and privacy seriously. All documents are encrypted during transfer and storage using industry-standard AES-256 encryption. Our servers are located in secure data centers with 24/7 monitoring and regular security audits.

Privacy Protection:
- No human access to your documents without explicit permission
- Automatic deletion of files after specified retention periods
- GDPR and CCPA compliance for data protection
- SOC 2 Type II certified infrastructure
- Regular penetration testing and vulnerability assessments

Chapter 6: Performance and Optimization

Our platform is optimized for high-performance translation processing:

Processing Speed: Most documents are processed within minutes, with larger files taking proportionally longer based on size and complexity.

Scalability: Our cloud infrastructure automatically scales to handle peak demand periods without service degradation.

Reliability: 99.9% uptime guarantee with redundant systems and automatic failover capabilities.

This comprehensive platform represents the future of document translation technology, combining cutting-edge artificial intelligence with user-friendly design to deliver exceptional results for all your translation needs.
"@

$body = @{
    text = $veryLongText
    source_language = "en"
    target_language = "si"
} | ConvertTo-Json

Write-Host "Testing very long document translation to verify chunking (English to Sinhala)..."
Write-Host "Original text length: $($veryLongText.Length) characters"
Write-Host "This should trigger chunking since it's over 4500 characters..."
Write-Host "Processing..."

try {
    $result = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/translate" -Method POST -Headers $headers -Body $body
    Write-Host "Success:" $result.success
    Write-Host "Message:" $result.message
    Write-Host "Original Character Count:" $result.data.character_count
    Write-Host "Original Word Count:" $result.data.word_count
    Write-Host "Translated Character Count:" $result.data.translated_text.Length
    Write-Host ""
    Write-Host "First 300 characters of translated text:"
    Write-Host $result.data.translated_text.Substring(0, [Math]::Min(300, $result.data.translated_text.Length))
    Write-Host "..."
    Write-Host ""
    Write-Host "Translation completed successfully! Check the logs to see chunking behavior."
} catch {
    Write-Host "Error:" $_.Exception.Message
}
