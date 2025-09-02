// Test script to verify the translation API
async function testTranslationAPI() {
  const baseURL = 'http://localhost:8000/api';
  
  try {
    // First, login to get authentication token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@docutranslate.com',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.data.token;
    console.log('✅ Login successful, token received');
    
    // Now test the translation endpoint
    console.log('\n🔤 Testing translation...');
    const translationResponse = await fetch(`${baseURL}/translations/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: 'Hello, how are you?',
        source_language: 'en',
        target_language: 'ta',
        file_name: 'test.txt',
        file_type: 'text/plain',
        file_size: 100
      })
    });
    
    const translationData = await translationResponse.json();
    console.log('Translation response:', translationData);
    
    if (translationData.success) {
      console.log('✅ Translation successful!');
      console.log('📝 Original text: Hello, how are you?');
      console.log('🔤 Translated text:', translationData.data.translated_text);
    } else {
      console.error('❌ Translation failed:', translationData.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the test
testTranslationAPI();
