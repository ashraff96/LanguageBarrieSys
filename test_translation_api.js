// Test the new Google Translate API endpoint
const API_BASE = 'http://127.0.0.1:8000/api';

async function testTranslation() {
    console.log('Testing Google Translate API Integration...\n');

    // Test 1: Simple text translation
    console.log('Test 1: Simple text translation (English to Tamil)');
    try {
        const response1 = await fetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                text: 'Hello, welcome to our document translation service!',
                source_language: 'en',
                target_language: 'ta'
            })
        });

        const result1 = await response1.json();
        console.log('Response:', JSON.stringify(result1, null, 2));
        console.log('---\n');
    } catch (error) {
        console.error('Test 1 Error:', error.message);
    }

    // Test 2: Document-like content (English to Sinhala)
    console.log('Test 2: Document translation (English to Sinhala)');
    try {
        const longText = `Document Translation Service

Welcome to our comprehensive document translation platform. This service is designed to help individuals and businesses translate documents across multiple languages with high accuracy.

Key Features:
- Support for multiple languages including English, Tamil, and Sinhala
- Fast and reliable translation processing
- Secure document handling
- User-friendly interface

Our translation technology uses advanced algorithms to ensure that your documents are translated accurately while maintaining the original context and meaning. Whether you're translating business documents, academic papers, or personal correspondence, our service provides professional-quality results.

Getting Started:
1. Upload your document
2. Select source and target languages  
3. Review the translation
4. Download the translated document

We are committed to providing excellent translation services that break down language barriers and enable effective communication across cultures.`;

        const response2 = await fetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                text: longText,
                source_language: 'en',
                target_language: 'si',
                file_name: 'test-document.txt',
                file_type: 'text/plain',
                file_size: longText.length
            })
        });

        const result2 = await response2.json();
        console.log('Response:', JSON.stringify(result2, null, 2));
        console.log('---\n');
    } catch (error) {
        console.error('Test 2 Error:', error.message);
    }

    // Test 3: Tamil to English
    console.log('Test 3: Reverse translation (Tamil to English)');
    try {
        const response3 = await fetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                text: 'வணக்கம்! இது ஒரு சோதனை ஆவணம். எங்கள் மொழிபெயர்ப்பு சேவை மிகவும் சிறப்பானது.',
                source_language: 'ta',
                target_language: 'en'
            })
        });

        const result3 = await response3.json();
        console.log('Response:', JSON.stringify(result3, null, 2));
        console.log('---\n');
    } catch (error) {
        console.error('Test 3 Error:', error.message);
    }

    console.log('All translation tests completed!');
}

// Run the tests
testTranslation().catch(console.error);
