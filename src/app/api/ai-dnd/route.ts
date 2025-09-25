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
      const responses = {
        explore: [
          "The dungeon master gestures toward the path ahead. 'You find yourself at a crossroads in a dense forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You can hear the distant sound of a babbling brook to the east, or you could venture deeper into the woods to the north. What path calls to you?'",
          "The dungeon master's eyes twinkle with mischief. 'As you venture forth, you discover a hidden clearing bathed in golden light. Strange runes are carved into the ancient stones that circle the area. A gentle breeze carries the scent of wildflowers. Do you investigate the runes or continue your journey?'",
          "The dungeon master leans forward eagerly. 'Your path leads you to a mysterious cave entrance, its mouth dark and foreboding. Faint whispers seem to echo from within, and you notice fresh tracks leading inside. What do you do?'"
        ],
        combat: [
          "The dungeon master's eyes gleam with excitement. 'Roll for initiative! A shadowy figure emerges from the darkness, brandishing a rusty blade. The creature's eyes glow with malevolent intent. Are you ready for battle?'",
          "The dungeon master claps their hands together. 'Suddenly, three goblins leap from behind the rocks, their crude weapons glinting in the sunlight! They snarl and advance toward you. Time for combat!'",
          "The dungeon master's voice grows tense. 'A massive troll blocks your path, its club raised high. The ground trembles with each of its steps. This will be a challenging fight!'"
        ],
        dice: [
          "The dungeon master produces a set of ornate dice. 'Ah, the roll of the dice! The fate of your adventure hangs in the balance. What would you like to roll for?'",
          "The dungeon master's eyes light up. 'Time to let the dice decide your fate! Whether it's a skill check, attack roll, or saving throw, the dice will tell the tale.'",
          "The dungeon master shakes a beautiful set of gem-encrusted dice. 'The ancient dice are ready to reveal destiny. What challenge do you face?'"
        ],
        character: [
          "The dungeon master examines your character sheet. 'I see you are " + (characterStats?.name || 'Adventurer') + ", a " + (characterStats?.race || 'brave soul') + " " + (characterStats?.class || 'hero') + ". Your current HP is " + (characterStats?.hp || 20) + ". What would you like to do with your abilities?'",
          "The dungeon master studies your character details. '" + (characterStats?.name || 'Adventurer') + ", your " + (characterStats?.race || 'heritage') + " " + (characterStats?.class || 'training') + " gives you unique advantages. With " + (characterStats?.hp || 20) + " hit points, you're ready for adventure!'",
          "The dungeon master nods approvingly. 'Your character " + (characterStats?.name || 'Adventurer') + " is a formidable " + (characterStats?.race || 'warrior') + " " + (characterStats?.class || 'adventurer') + ". Your skills and abilities are at your disposal!'"
        ],
        help: [
          "The dungeon master smiles warmly. 'Welcome, brave adventurer! You can explore the world, engage in combat, roll dice for skill checks, or ask me about your character. Try saying things like \"I want to explore the forest\" or \"Roll for initiative\" or \"Show me my character sheet\". What adventure awaits you?'",
          "The dungeon master gestures expansively. 'This is your world to explore! You can investigate mysterious locations, battle dangerous creatures, use your skills and abilities, or learn more about your character. What would you like to try first?'",
          "The dungeon master's eyes sparkle with anticipation. 'Adventure awaits at every turn! You can explore new areas, engage in thrilling combat, test your luck with dice rolls, or discover more about your character. The choice is yours!'"
        ],
        default: [
          "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'",
          "The dungeon master strokes their beard contemplatively. 'Fascinating. How do you wish to proceed?'",
          "The dungeon master's eyes twinkle with curiosity. 'Tell me more about your intentions, brave adventurer.'",
          "The dungeon master leans back in their chair. 'The adventure continues to unfold. What's your next move?'"
        ]
      };
      
      let fallbackResponse;
      
      if (userInput.includes('explore') || userInput.includes('forest') || userInput.includes('go') || userInput.includes('walk') || userInput.includes('travel')) {
        fallbackResponse = responses.explore[Math.floor(Math.random() * responses.explore.length)];
      } else if (userInput.includes('attack') || userInput.includes('fight') || userInput.includes('combat') || userInput.includes('battle') || userInput.includes('sword')) {
        fallbackResponse = responses.combat[Math.floor(Math.random() * responses.combat.length)];
      } else if (userInput.includes('roll') || userInput.includes('dice') || userInput.includes('check') || userInput.includes('skill')) {
        fallbackResponse = responses.dice[Math.floor(Math.random() * responses.dice.length)];
      } else if (userInput.includes('character') || userInput.includes('sheet') || userInput.includes('stats') || userInput.includes('abilities')) {
        fallbackResponse = responses.character[Math.floor(Math.random() * responses.character.length)];
      } else if (userInput.includes('help') || userInput.includes('what') || userInput.includes('how') || userInput.includes('start')) {
        fallbackResponse = responses.help[Math.floor(Math.random() * responses.help.length)];
      } else {
        fallbackResponse = responses.default[Math.floor(Math.random() * responses.default.length)];
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
      // Try the most common working models
      const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
      let lastError = null;
      
      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`);
          const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          console.log(`API URL: ${modelUrl}`);
          
          response = await fetch(modelUrl, {
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
          
          console.log(`Response status for ${model}:`, response.status);
          
          if (response.ok) {
            console.log(`Successfully connected to model: ${model}`);
            break;
          } else {
            const errorData = await response.text();
            console.log(`Model ${model} failed with status ${response.status}: ${errorData}`);
            lastError = { status: response.status, data: errorData };
          }
        } catch (error) {
          console.log(`Model ${model} threw error:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        console.log('All Google AI Studio models failed');
        if (lastError) {
          console.log('Last error details:', lastError);
          throw new Error(`All models failed. Last error: ${JSON.stringify(lastError)}`);
        }
      }
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
    
    if (!response || !response.ok) {
      const errorData = response ? await response.text() : 'No response received';
      console.error(`Gemini API error: ${response?.status || 'No status'} - ${errorData}`);
      
      // If all models fail, fall back to predefined responses
      console.log('API call failed, falling back to predefined responses');
      const lastUserMessage = messages?.filter((msg: any) => msg.role === 'user').pop();
      const userInput = lastUserMessage?.content?.toLowerCase() || '';
      
      console.log('User input for fallback:', userInput);
      console.log('Available messages:', messages?.length);
      
      // Use the same enhanced fallback system
      const responses = {
        explore: [
          "The dungeon master gestures toward the path ahead. 'You find yourself at a crossroads in a dense forest. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You can hear the distant sound of a babbling brook to the east, or you could venture deeper into the woods to the north. What path calls to you?'",
          "The dungeon master's eyes twinkle with mischief. 'As you venture forth, you discover a hidden clearing bathed in golden light. Strange runes are carved into the ancient stones that circle the area. A gentle breeze carries the scent of wildflowers. Do you investigate the runes or continue your journey?'",
          "The dungeon master leans forward eagerly. 'Your path leads you to a mysterious cave entrance, its mouth dark and foreboding. Faint whispers seem to echo from within, and you notice fresh tracks leading inside. What do you do?'"
        ],
        combat: [
          "The dungeon master's eyes gleam with excitement. 'Roll for initiative! A shadowy figure emerges from the darkness, brandishing a rusty blade. The creature's eyes glow with malevolent intent. Are you ready for battle?'",
          "The dungeon master claps their hands together. 'Suddenly, three goblins leap from behind the rocks, their crude weapons glinting in the sunlight! They snarl and advance toward you. Time for combat!'",
          "The dungeon master's voice grows tense. 'A massive troll blocks your path, its club raised high. The ground trembles with each of its steps. This will be a challenging fight!'"
        ],
        dice: [
          "The dungeon master produces a set of ornate dice. 'Ah, the roll of the dice! The fate of your adventure hangs in the balance. What would you like to roll for?'",
          "The dungeon master's eyes light up. 'Time to let the dice decide your fate! Whether it's a skill check, attack roll, or saving throw, the dice will tell the tale.'",
          "The dungeon master shakes a beautiful set of gem-encrusted dice. 'The ancient dice are ready to reveal destiny. What challenge do you face?'"
        ],
        character: [
          "The dungeon master examines your character sheet. 'I see you are " + (characterStats?.name || 'Adventurer') + ", a " + (characterStats?.race || 'brave soul') + " " + (characterStats?.class || 'hero') + ". Your current HP is " + (characterStats?.hp || 20) + ". What would you like to do with your abilities?'",
          "The dungeon master studies your character details. '" + (characterStats?.name || 'Adventurer') + ", your " + (characterStats?.race || 'heritage') + " " + (characterStats?.class || 'training') + " gives you unique advantages. With " + (characterStats?.hp || 20) + " hit points, you're ready for adventure!'",
          "The dungeon master nods approvingly. 'Your character " + (characterStats?.name || 'Adventurer') + " is a formidable " + (characterStats?.race || 'warrior') + " " + (characterStats?.class || 'adventurer') + ". Your skills and abilities are at your disposal!'"
        ],
        help: [
          "The dungeon master smiles warmly. 'Welcome, brave adventurer! You can explore the world, engage in combat, roll dice for skill checks, or ask me about your character. Try saying things like \"I want to explore the forest\" or \"Roll for initiative\" or \"Show me my character sheet\". What adventure awaits you?'",
          "The dungeon master gestures expansively. 'This is your world to explore! You can investigate mysterious locations, battle dangerous creatures, use your skills and abilities, or learn more about your character. What would you like to try first?'",
          "The dungeon master's eyes sparkle with anticipation. 'Adventure awaits at every turn! You can explore new areas, engage in thrilling combat, test your luck with dice rolls, or discover more about your character. The choice is yours!'"
        ],
        default: [
          "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'",
          "The dungeon master strokes their beard contemplatively. 'Fascinating. How do you wish to proceed?'",
          "The dungeon master's eyes twinkle with curiosity. 'Tell me more about your intentions, brave adventurer.'",
          "The dungeon master leans back in their chair. 'The adventure continues to unfold. What's your next move?'"
        ]
      };
      
      let fallbackResponse;
      
      if (userInput.includes('explore') || userInput.includes('forest') || userInput.includes('go') || userInput.includes('walk') || userInput.includes('travel')) {
        console.log('Matched: explore/forest/go');
        fallbackResponse = responses.explore[Math.floor(Math.random() * responses.explore.length)];
      } else if (userInput.includes('attack') || userInput.includes('fight') || userInput.includes('combat') || userInput.includes('battle') || userInput.includes('sword')) {
        console.log('Matched: attack/fight/combat');
        fallbackResponse = responses.combat[Math.floor(Math.random() * responses.combat.length)];
      } else if (userInput.includes('roll') || userInput.includes('dice') || userInput.includes('check') || userInput.includes('skill')) {
        console.log('Matched: roll/dice');
        fallbackResponse = responses.dice[Math.floor(Math.random() * responses.dice.length)];
      } else if (userInput.includes('character') || userInput.includes('sheet') || userInput.includes('stats') || userInput.includes('abilities')) {
        console.log('Matched: character/sheet/stats');
        fallbackResponse = responses.character[Math.floor(Math.random() * responses.character.length)];
      } else if (userInput.includes('help') || userInput.includes('what') || userInput.includes('how') || userInput.includes('start')) {
        console.log('Matched: help/what/how');
        fallbackResponse = responses.help[Math.floor(Math.random() * responses.help.length)];
      } else {
        console.log('No keyword match found, using default response');
        fallbackResponse = responses.default[Math.floor(Math.random() * responses.default.length)];
      }
      
      console.log('Final fallback response:', fallbackResponse.substring(0, 100) + '...');
      
      return NextResponse.json({
        message: fallbackResponse,
        usage: { total_tokens: 0 }
      });
    }

    // If we reach here, the API call was successful
    console.log('Gemini API response status:', response.status);

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