// Simple test to debug the API issue
const testAPI = async () => {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/ai-dnd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: 'Hello'
        }],
        characterStats: {
          name: 'Test',
          hp: 20
        },
        selectedModel: 'llama3.2:1b'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (!response.ok) {
      console.error('API Error:', response.status, text);
    } else {
      console.log('API Success!');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

testAPI();

