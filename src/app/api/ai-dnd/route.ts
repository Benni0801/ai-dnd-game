import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterStats } = body || {};

    // Check for API key - if not available, use fallback responses
    console.log('API Key check:', process.env.GOOGLE_API_KEY ? 'Found' : 'Not found');
    if (!process.env.GOOGLE_API_KEY) {
      console.log('PATH: Using fallback responses (no API key)');
      
      // Get the last user message
      const lastUserMessage = messages?.filter((msg: any) => msg.role === 'user').pop();
      const userInput = lastUserMessage?.content?.toLowerCase() || '';
      
      // Generate contextual fallback responses
      let fallbackResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
      
      if (userInput.includes('explore') || userInput.includes('forest') || userInput.includes('go')) {
        fallbackResponse = "The dungeon master gestures toward the path ahead. 'You find yourself at a crossroads in a dense forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You can hear the distant sound of a babbling brook to the east, or you could venture deeper into the woods to the north. What path calls to you?'";
      } else if (userInput.includes('attack') || userInput.includes('fight') || userInput.includes('combat')) {
        fallbackResponse = "The dungeon master's eyes gleam with excitement. 'Roll for initiative! A shadowy figure emerges from the darkness, brandishing a rusty blade. The creature's eyes glow with malevolent intent. Are you ready for battle?'";
      } else if (userInput.includes('roll') || userInput.includes('dice')) {
        fallbackResponse = "The dungeon master produces a set of ornate dice. 'Ah, the roll of the dice! The fate of your adventure hangs in the balance. What would you like to roll for?'";
      } else if (userInput.includes('character') || userInput.includes('sheet') || userInput.includes('stats')) {
        fallbackResponse = "The dungeon master examines your character sheet. 'I see you are " + (characterStats?.name || 'Adventurer') + ", a " + (characterStats?.race || 'brave soul') + " " + (characterStats?.class || 'hero') + ". Your current HP is " + (characterStats?.hp || 20) + ". What would you like to do with your abilities?'";
      } else if (userInput.includes('help') || userInput.includes('what') || userInput.includes('how')) {
        fallbackResponse = "The dungeon master smiles warmly. 'Welcome, brave adventurer! You can explore the world, engage in combat, roll dice for skill checks, or ask me about your character. Try saying things like \"I want to explore the forest\" or \"Roll for initiative\" or \"Show me my character sheet\". What adventure awaits you?'";
      }
      
      return NextResponse.json({
        message: fallbackResponse,
        usage: { total_tokens: 0 }
      });
    }

    // Build the conversation context
    const conversationHistory = messages.slice(-5).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (${characterStats?.race || 'Unknown'} ${characterStats?.class || 'Hero'}, HP:${characterStats?.hp || 20})`;

    // Simple system prompt
    const systemPrompt = `You are a Dungeon Master for a D&D game. Create engaging fantasy adventures with descriptive language. Ask what the player wants to do. Keep responses engaging and complete.`;

    // Prepare the prompt for Gemini
    const fullPrompt = `${systemPrompt}\n\n${characterContext}\n\nConversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\nPlease respond as the Dungeon Master:`;

    // Call Google Gemini API using the correct endpoint
    console.log('PATH: Using Google Gemini API');
    console.log('Calling Google Gemini API...');
    
    // Try different API endpoints based on the API key type
    let response;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Check if it's a Google AI Studio key (starts with AIza)
    if (apiKey?.startsWith('AIza')) {
      console.log('Using Google AI Studio API endpoint');
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
          }
        }),
        signal: AbortSignal.timeout(30000)
      });
    } else {
      console.log('Using alternative API endpoint');
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
          }
        }),
        signal: AbortSignal.timeout(30000)
      });
    }
    
    console.log('Gemini API response status:', response.status);
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorData}`);
      
      // If all models fail, fall back to predefined responses
      console.log('API call failed, falling back to predefined responses');
      const lastUserMessage = messages?.filter((msg: any) => msg.role === 'user').pop();
      const userInput = lastUserMessage?.content?.toLowerCase() || '';
      
      let fallbackResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
      
      if (userInput.includes('explore') || userInput.includes('forest') || userInput.includes('go')) {
        fallbackResponse = "The dungeon master gestures toward the path ahead. 'You find yourself at a crossroads in a dense forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You can hear the distant sound of a babbling brook to the east, or you could venture deeper into the woods to the north. What path calls to you?'";
      } else if (userInput.includes('attack') || userInput.includes('fight') || userInput.includes('combat')) {
        fallbackResponse = "The dungeon master's eyes gleam with excitement. 'Roll for initiative! A shadowy figure emerges from the darkness, brandishing a rusty blade. The creature's eyes glow with malevolent intent. Are you ready for battle?'";
      } else if (userInput.includes('roll') || userInput.includes('dice')) {
        fallbackResponse = "The dungeon master produces a set of ornate dice. 'Ah, the roll of the dice! The fate of your adventure hangs in the balance. What would you like to roll for?'";
      } else if (userInput.includes('character') || userInput.includes('sheet') || userInput.includes('stats')) {
        fallbackResponse = "The dungeon master examines your character sheet. 'I see you are " + (characterStats?.name || 'Adventurer') + ", a " + (characterStats?.race || 'brave soul') + " " + (characterStats?.class || 'hero') + ". Your current HP is " + (characterStats?.hp || 20) + ". What would you like to do with your abilities?'";
      } else if (userInput.includes('help') || userInput.includes('what') || userInput.includes('how')) {
        fallbackResponse = "The dungeon master smiles warmly. 'Welcome, brave adventurer! You can explore the world, engage in combat, roll dice for skill checks, or ask me about your character. Try saying things like \"I want to explore the forest\" or \"Roll for initiative\" or \"Show me my character sheet\". What adventure awaits you?'";
      }
      
      return NextResponse.json({
        message: fallbackResponse,
        usage: { total_tokens: 0 }
      });
    }

    console.log('Gemini API response status:', response.status);
    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      
      // If API key is invalid, fall back to predefined responses
      if (response.status === 403 || response.status === 401) {
        console.log('API key appears to be invalid, falling back to predefined responses');
        const lastUserMessage = messages?.filter((msg: any) => msg.role === 'user').pop();
        const userInput = lastUserMessage?.content?.toLowerCase() || '';
        
        let fallbackResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
        
        if (userInput.includes('explore') || userInput.includes('forest') || userInput.includes('go')) {
          fallbackResponse = "The dungeon master gestures toward the path ahead. 'You find yourself at a crossroads in a dense forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You can hear the distant sound of a babbling brook to the east, or you could venture deeper into the woods to the north. What path calls to you?'";
        } else if (userInput.includes('attack') || userInput.includes('fight') || userInput.includes('combat')) {
          fallbackResponse = "The dungeon master's eyes gleam with excitement. 'Roll for initiative! A shadowy figure emerges from the darkness, brandishing a rusty blade. The creature's eyes glow with malevolent intent. Are you ready for battle?'";
        } else if (userInput.includes('roll') || userInput.includes('dice')) {
          fallbackResponse = "The dungeon master produces a set of ornate dice. 'Ah, the roll of the dice! The fate of your adventure hangs in the balance. What would you like to roll for?'";
        } else if (userInput.includes('character') || userInput.includes('sheet') || userInput.includes('stats')) {
          fallbackResponse = "The dungeon master examines your character sheet. 'I see you are " + (characterStats?.name || 'Adventurer') + ", a " + (characterStats?.race || 'brave soul') + " " + (characterStats?.class || 'hero') + ". Your current HP is " + (characterStats?.hp || 20) + ". What would you like to do with your abilities?'";
        } else if (userInput.includes('help') || userInput.includes('what') || userInput.includes('how')) {
          fallbackResponse = "The dungeon master smiles warmly. 'Welcome, brave adventurer! You can explore the world, engage in combat, roll dice for skill checks, or ask me about your character. Try saying things like \"I want to explore the forest\" or \"Roll for initiative\" or \"Show me my character sheet\". What adventure awaits you?'";
        }
        
        return NextResponse.json({
          message: fallbackResponse,
          usage: { total_tokens: 0 }
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    
    // Extract the generated text
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text || '';
      console.log('Extracted AI response:', aiResponse);
    } else {
      console.log('No valid response structure found in data:', data);
    }

    // Clean up the response
    if (aiResponse) {
      aiResponse = aiResponse.replace(/Please respond as the Dungeon Master:/g, '').trim();
      console.log('Cleaned AI response:', aiResponse);
    }

    // Fallback if no good response
    if (!aiResponse || aiResponse.length < 10) {
      console.log('AI response too short or empty, using fallback');
      aiResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
    }

    return NextResponse.json({
      message: aiResponse,
      usage: { total_tokens: 0 }
    });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
    // Check if it's a timeout error
    if (error?.name === 'AbortError') {
      return NextResponse.json({
        message: "The dungeon master is deep in thought. 'Give me a moment to consider your words, brave adventurer.'",
        usage: { total_tokens: 0 }
      });
    }
    
    // Check if it's an API key error
    if (error?.message?.includes('403') || error?.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Invalid Google API key. Please check your GOOGLE_API_KEY configuration.' },
        { status: 500 }
      );
    }
    
    // Return a fallback response
    return NextResponse.json({
      message: "The dungeon master strokes their beard thoughtfully. 'An interesting turn of events. What would you like to do next?'",
      usage: { total_tokens: 0 }
    });
  }
}