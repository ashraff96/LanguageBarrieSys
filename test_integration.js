// Test script to verify the file-translation integration
async function testFileTranslationIntegration() {
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
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.data.token;
    console.log('✅ Login successful');
    
    // Test translation with file information
    console.log('\n📄 Testing document translation with file integration...');
    const translationResponse = await fetch(`${baseURL}/translations/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: 'Welcome to our document translation service. This is a test document.',
        source_language: 'en',
        target_language: 'ta',
        file_name: 'test_document.pdf',
        file_type: 'application/pdf',
        file_size: 1024
      })
    });
    
    const translationData = await translationResponse.json();
    console.log('Translation response:', translationData);
    
    if (translationData.success) {
      console.log('✅ Translation successful!');
      console.log('📄 File ID:', translationData.data.file_id);
      console.log('🔤 Translation ID:', translationData.data.translation_id);
      
      // Fetch files to verify file record was created
      console.log('\n📁 Fetching files to verify file creation...');
      const filesResponse = await fetch(`${baseURL}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const filesData = await filesResponse.json();
      if (filesData.success) {
        console.log('✅ Files fetched successfully');
        const recentFile = filesData.data.data.find(f => f.id === translationData.data.file_id);
        if (recentFile) {
          console.log('📄 File record found:', {
            id: recentFile.id,
            name: recentFile.original_name,
            status: recentFile.status,
            translations_count: recentFile.translations?.length || 0
          });
        }
      }
      
      // Fetch translations to verify translation record
      console.log('\n🔤 Fetching translations to verify integration...');
      const translationsResponse = await fetch(`${baseURL}/translations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const translationsDataResponse = await translationsResponse.json();
      if (translationsDataResponse.success) {
        console.log('✅ Translations fetched successfully');
        const recentTranslation = translationsDataResponse.data.data.find(t => t.id === translationData.data.translation_id);
        if (recentTranslation) {
          console.log('🔤 Translation record found:', {
            id: recentTranslation.id,
            file_id: recentTranslation.file_id,
            file_name: recentTranslation.file_name,
            file_info: recentTranslation.file ? 'File relationship loaded' : 'No file relationship'
          });
        }
      }
    } else {
      console.error('❌ Translation failed:', translationData.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the test
testFileTranslationIntegration();
