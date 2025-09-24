// Test the full API request exactly as the frontend sends it
const testFullAPI = async () => {
  try {
    console.log('Testing full API request...');
    
    // Build the conversation context exactly like the API does
    const messages = [
      {
        role: 'user',
        content: 'Hello'
      }
    ];
    
    const characterStats = {
      name: 'Test',
      hp: 20
    };
    
    const selectedModel = 'llama3.2:1b';
    
    // Create the conversation history
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (HP:${characterStats?.hp || 20})`;

    // Simplified system prompt
    const SYSTEM_PROMPT = `You are a Dungeon Master for a D&D game. You create engaging fantasy adventures.

PERSONALITY:
- Enthusiastic storyteller
- Fair but challenging
- Descriptive and atmospheric
- Creative and adaptive

COMMUNICATION:
- Use descriptive language
- Ask engaging questions
- Provide clear options
- Use "you" to address the player

DICE ROLLS:
- Use format: [DICE_ROLL:d20+5:Stealth Check]
- Explain why a roll is needed
- Describe results dramatically

RESPONSE STRUCTURE:
1. Set the scene (1-2 sentences)
2. Present situation (1-2 sentences)  
3. Ask what player wants to do
4. Keep responses concise (3-5 sentences)

You are a master storyteller creating an unforgettable adventure.`;

    // Prepare the messages for Ollama
    const ollamaMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + '\n\n' + characterContext
      },
      ...conversationHistory
    ];

    console.log('Sending to Ollama:', JSON.stringify(ollamaMessages, null, 2));

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100,
          num_ctx: 1024,
          num_thread: 2,
          repeat_penalty: 1.1
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    console.log('Ollama response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
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

testFullAPI();

