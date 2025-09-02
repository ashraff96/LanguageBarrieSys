const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:8000/api';

async function testFileUpload() {
  try {
    console.log('1. Logging in...');
    // First, login to get a token
    const loginResponse = await fetch(`${baseUrl}/login`, {
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

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    const token = loginData.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    console.log('\n2. Testing file upload...');
    
    // Create a test file
    const testContent = 'This is a test document for translation.\nHello world!';
    const testFileName = 'test_document.txt';
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', testContent, {
      filename: testFileName,
      contentType: 'text/plain'
    });
    formData.append('source_language', 'en');
    formData.append('target_language', 'es');
    formData.append('original_name', testFileName);
    formData.append('file_type', 'text/plain');
    formData.append('file_size', Buffer.byteLength(testContent, 'utf8').toString());

    console.log('FormData contents:');
    console.log('- source_language:', 'en');
    console.log('- target_language:', 'es');
    console.log('- original_name:', testFileName);
    console.log('- file_type:', 'text/plain');
    console.log('- file_size:', Buffer.byteLength(testContent, 'utf8'));

    // Upload file
    const uploadResponse = await fetch(`${baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadData);
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Upload failed:', errorText);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testFileUpload();
