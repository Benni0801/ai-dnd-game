// Debug Ollama API call
const testOllamaDirect = async () => {
  try {
    console.log('Testing Ollama API directly...');
    
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
          top_p: 0.8,
          max_tokens: 150,
          num_ctx: 1024,
          num_predict: 100,
          num_thread: 2,
          repeat_penalty: 1.1
        }
      }),
      signal: AbortSignal.timeout(10000)
    });

    console.log('Ollama response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('Ollama response:', data);
    console.log('Message content:', data.message.content);
    
  } catch (error) {
    console.error('Ollama test error:', error);
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    }
  }
};

testOllamaDirect();
