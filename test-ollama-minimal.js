// Test with minimal Ollama request
const testMinimalOllama = async () => {
  try {
    console.log('Testing minimal Ollama request...');
    
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          {
            role: 'user',
            content: 'Hi'
          }
        ],
        stream: false
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', data.message.content);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.name === 'AbortError') {
      console.error('Request timed out after 60 seconds');
    }
  }
};

testMinimalOllama();

