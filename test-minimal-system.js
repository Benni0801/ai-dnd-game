// Test with minimal system prompt
const testMinimalSystem = async () => {
  try {
    console.log('Testing with minimal system prompt...');
    
    const ollamaMessages = [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello'
      }
    ];

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50,
          num_ctx: 512,
          num_thread: 2,
          repeat_penalty: 1.1
        }
      }),
      signal: AbortSignal.timeout(30000)
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
      console.error('Request timed out after 30 seconds');
    }
  }
};

testMinimalSystem();
