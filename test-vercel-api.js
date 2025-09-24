// Test script for Vercel API deployment
const testAPI = async () => {
  try {
    console.log('🧪 Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/ai-dnd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, I want to start a new adventure!' }
        ],
        characterStats: {
          name: 'Test Hero',
          hp: 20
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API working! Response:', data.message);
    } else {
      console.log('❌ API error:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testAPI();
