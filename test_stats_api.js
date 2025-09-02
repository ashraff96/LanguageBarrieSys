// Test script to check translation stats API
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:8000/api';

async function testStats() {
  try {
    // First, try to login to get a token
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
      console.log('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');

    // Now test the stats endpoint
    const statsResponse = await fetch(`${baseUrl}/admin/translations/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Stats Response Status:', statsResponse.status);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('Stats Data:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('Stats Error:', await statsResponse.text());
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testStats();
