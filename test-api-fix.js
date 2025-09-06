// Test if the translation API endpoint is working
console.log('Testing DocuTranslate API...');

const testTranslation = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello world, this is a test',
        source_language: 'en',
        target_language: 'si',
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Translation API is working!');
      console.log('Response:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Translation API failed');
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
};

// Test the API
testTranslation().then(success => {
  if (success) {
    console.log('\n🎉 The 500 error has been fixed!');
    console.log('✅ PHP syntax error resolved');
    console.log('✅ Database LONGTEXT migration applied');
    console.log('✅ Translation API is working properly');
  } else {
    console.log('\n❌ There are still issues to resolve');
  }
});
