// Test script to verify both translation and download APIs work
const testTranslationAndDownload = async () => {
    console.log('🧪 Testing Translation and Download APIs...\n');

    // Test 1: Translation API
    console.log('1️⃣ Testing Translation API...');
    try {
        const translationResponse = await fetch('http://127.0.0.1:8000/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                text: 'Hello world! This is a test for translation.',
                source_language: 'en',
                target_language: 'ta',
            }),
        });

        if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            console.log('✅ Translation successful!');
            console.log('Original text:', 'Hello world! This is a test for translation.');
            console.log('Translated text:', translationData.data.translated_text);
            
            // Test 2: PDF Download API
            console.log('\n2️⃣ Testing PDF Download API...');
            const downloadResponse = await fetch('http://127.0.0.1:8000/api/download-formatted', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: translationData.data.translated_text,
                    format: 'pdf',
                    filename: 'test-api-download'
                })
            });

            if (downloadResponse.ok) {
                const blob = await downloadResponse.blob();
                console.log('✅ PDF download successful!');
                console.log('PDF size:', blob.size, 'bytes');
                console.log('PDF type:', blob.type);
                
                // Trigger download
                const url = window.URL.createObjectURL(blob);
                const element = document.createElement('a');
                element.href = url;
                element.download = 'test-api-download.pdf';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                window.URL.revokeObjectURL(url);
                
                console.log('📁 PDF file downloaded to your Downloads folder!');
                
                // Test 3: TXT Download API
                console.log('\n3️⃣ Testing TXT Download API...');
                const txtResponse = await fetch('http://127.0.0.1:8000/api/download-formatted', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: translationData.data.translated_text,
                        format: 'txt',
                        filename: 'test-api-download'
                    })
                });

                if (txtResponse.ok) {
                    const txtBlob = await txtResponse.blob();
                    console.log('✅ TXT download successful!');
                    console.log('TXT size:', txtBlob.size, 'bytes');
                    
                    const txtUrl = window.URL.createObjectURL(txtBlob);
                    const txtElement = document.createElement('a');
                    txtElement.href = txtUrl;
                    txtElement.download = 'test-api-download.txt';
                    document.body.appendChild(txtElement);
                    txtElement.click();
                    document.body.removeChild(txtElement);
                    window.URL.revokeObjectURL(txtUrl);
                    
                    console.log('📄 TXT file downloaded to your Downloads folder!');
                    console.log('\n🎉 All tests passed! Both APIs are working correctly.');
                } else {
                    console.error('❌ TXT download failed:', await txtResponse.text());
                }
            } else {
                console.error('❌ PDF download failed:', await downloadResponse.text());
            }
        } else {
            console.error('❌ Translation failed:', await translationResponse.text());
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
};

// Run the test
testTranslationAndDownload();
