import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('AI API: Request received');
    const body = await request.json();
    console.log('AI API: Body parsed:', { messages: body.messages?.length, characterStats: !!body.characterStats });
    const { messages, characterStats } = body || {};

    // Check for API key - if not available, use fallback responses
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');
    
    if (!apiKey || apiKey === 'placeholder-key') {
      console.log('ERROR: No API key found or using placeholder');
      
      return NextResponse.json({
        response: 'Hello! I am your AI Dungeon Master. I see you\'re in a multiplayer session! What adventure shall we embark on today?',
        debug: 'Using fallback response - API key not configured'
      });
    }

    // Build the conversation context
    const conversationHistory = messages.slice(-10).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

    // Create simple game state without complex dependencies
    const gameState = {
      character: {
        name: characterStats?.name || 'Adventurer',
        race: characterStats?.race || 'Human',
        class: characterStats?.class || 'Fighter',
        level: characterStats?.level || 1,
        experience: { current: characterStats?.xp || 0, needed: 1000 },
        abilityScores: {
          strength: characterStats?.str || 10,
          dexterity: characterStats?.dex || 10,
          constitution: characterStats?.con || 10,
          intelligence: characterStats?.int || 10,
          wisdom: characterStats?.wis || 10,
          charisma: characterStats?.cha || 10
        }
      }
    };

        // Check if player is requesting a game sheet
        const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
        const sheetRequest = lastMessage.includes('show') || lastMessage.includes('display') || lastMessage.includes('sheet');
        
        if (sheetRequest) {
          let sheetType = 'character';
          if (lastMessage.includes('party')) sheetType = 'party';
          else if (lastMessage.includes('inventory')) sheetType = 'inventory';
          else if (lastMessage.includes('spell')) sheetType = 'spells';
          else if (lastMessage.includes('skill')) sheetType = 'skills';
          else if (lastMessage.includes('quest')) sheetType = 'quests';
          else if (lastMessage.includes('lore')) sheetType = 'lore';
          else if (lastMessage.includes('rule')) sheetType = 'rules';
          
          const sheetContent = `Here's your ${sheetType} information:\n\nCharacter: ${gameState.character.name}\nRace: ${gameState.character.race}\nClass: ${gameState.character.class}\nLevel: ${gameState.character.level}`;
          return NextResponse.json({
            response: `**${sheetType.toUpperCase()} SHEET**\n\n${sheetContent}`,
            usage: { total_tokens: 0 },
            debug: 'Game sheet displayed'
          });
        }

        // Create the character context with simple game state
        const characterContext = `
**CURRENT GAME STATE**
Character: ${gameState.character.name || 'Unnamed'} (${gameState.character.race || 'Unknown'} ${gameState.character.class || 'Adventurer'})
Level: ${gameState.character.level} | XP: ${gameState.character.experience.current}/${gameState.character.experience.needed}
Ability Scores: STR ${gameState.character.abilityScores.strength}, DEX ${gameState.character.abilityScores.dexterity}, CON ${gameState.character.abilityScores.constitution}, INT ${gameState.character.abilityScores.intelligence}, WIS ${gameState.character.abilityScores.wisdom}, CHA ${gameState.character.abilityScores.charisma}
`;

        // Comprehensive D&D System Prompt
        const systemPrompt = `You are GAL (Game AI Liaison), an advanced Dungeon Master for an immersive text-based D&D role-playing game. Follow these rules strictly:

**CORE IDENTITY:**
- Respond as "GAL" for out-of-game communication
- Act as NPCs in character for in-game interactions
- Never repeat player statements - respond directly to their input
- Drive narrative forward through player choices

**CHARACTER CREATION REQUIREMENTS:**
- Must start with character creation if not completed
- Guide through: Genre Selection → Character Naming → Race → Class → Attributes → Backstory → Starting Spells/Skills
- Ask if player wants scores chosen or buy system for attributes
- Create detailed character sheets with all required information

**GAME SHEETS TO MAINTAIN:**
- Rule Sheet: Core rules and mechanics
- Character Sheet: Name, Race, Class, Level, XP (Current/Needed), Ability Scores, Inventory
- Party Sheet: All party members with full details
- Inventory Sheet: Equipped items + all carried items
- Spell Sheet: Available spell slots + known spells/cantrips
- Skill Sheet: All character skills and abilities
- Quest Sheets: Main Quest, Current Mission, Current Location
- Lore Sheets: Characters, World, Races

**CRITICAL ITEM MANAGEMENT RULES:**
When giving players ANY items (loot, purchases, rewards, starting equipment), you MUST use this EXACT format:

[ITEM:{"name":"Item Name","type":"weapon|armor|consumable|tool|misc","rarity":"common|uncommon|rare","value":10,"weight":2,"quantity":1}]

**MANDATORY EXAMPLES:**
- [ITEM:{"name":"Health Potion","type":"consumable","rarity":"common","value":25,"weight":0.5,"quantity":1}]
- [ITEM:{"name":"Iron Sword","type":"weapon","rarity":"common","value":10,"weight":3,"quantity":1}]
- [ITEM:{"name":"Gold Coins","type":"misc","rarity":"common","value":1,"weight":0.02,"quantity":50}]

**NEVER mention items in text without using [ITEM:] format!**
**If you say "You receive a sword" - you MUST include [ITEM:{"name":"Sword",...}] in the same message!**

**CORE GAME MECHANICS:**
- Use d20 + modifiers for all checks (GM rolls internally)
- Set appropriate DCs for challenges
- Turn-based combat with initiative order
- Limited resources (HP, spell slots, inventory)
- Day/night cycle affects gameplay
- Player choices have real consequences

**WORLDBUILDING:**
- Rich, detailed world with consistent lore
- Diverse NPCs with unique personalities and motivations
- Multiple quest lines (main story + side quests)
- NPCs react to player actions and build relationships
- Mature themes handled appropriately

**NARRATIVE STRUCTURE:**
- Main Overarching Story as backbone
- Player-driven narrative with meaningful choices
- Open-ended prompts to initiate new scenarios
- Immersive conversations with NPCs
- Character development and progression

**RESPONSE GUIDELINES:**
- Provide detailed descriptions of settings and events
- Create engaging challenges and moral dilemmas
- Track all character progression and world state
- Show updated sheets when requested
- Maintain consistency with established rules

**CURRENT GAME STATE:**
Character: ${gameState.character.name || 'Unnamed'} (${gameState.character.race || 'Unknown'} ${gameState.character.class || 'Adventurer'})
Level: ${gameState.character.level} | XP: ${gameState.character.experience.current}/${gameState.character.experience.needed}
Ability Scores: STR ${gameState.character.abilityScores.strength}, DEX ${gameState.character.abilityScores.dexterity}, CON ${gameState.character.abilityScores.constitution}, INT ${gameState.character.abilityScores.intelligence}, WIS ${gameState.character.abilityScores.wisdom}, CHA ${gameState.character.abilityScores.charisma}

**IMPORTANT INSTRUCTIONS:**
- If character creation is incomplete, guide through the full process
- Always maintain game state consistency
- Use internal dice rolls for all checks (announce results)
- Track all character progression and world changes
- Provide detailed descriptions and immersive roleplay
- Respond as GAL for meta-game communication, as NPCs for in-game interactions

**FINAL REMINDER - ITEM FORMAT IS MANDATORY:**
When you mention ANY item being given to the player, you MUST include the [ITEM:{"name":"Item Name","type":"weapon","rarity":"common","value":10,"weight":1,"quantity":1}] format in your response. Do not just describe items in text - use the structured format!`;

    // Prepare the prompt for Gemini
    const fullPrompt = `${systemPrompt}\n\n${characterContext}\n\nConversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\nPlease respond as the Dungeon Master:`;

    // Call Google Gemini API using the correct endpoint
    console.log('PATH: Using Google Gemini API');
    console.log('Calling Google Gemini API...');
    
    // Try different API endpoints based on the API key type
    let response;
    
    // Check if it's a Google AI Studio key (starts with AIza)
    if (apiKey?.startsWith('AIza')) {
      console.log('Using Google AI Studio API endpoint');
      // Try different model formats that might work
      const models = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-pro',
        'gemini-1.5-pro-001',
        'gemini-pro',
        'gemini-pro-001',
        'gemini-1.0-pro',
        'gemini-1.0-pro-001'
      ];
      let lastError = null;
      
      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`);
          // Use the correct Google AI Studio endpoint format
          const endpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`
          ];
          
          let modelResponse = null;
          for (const endpoint of endpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              modelResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
                  'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

              if (modelResponse.ok) {
                response = modelResponse;
                console.log(`Successfully connected to model: ${model} with endpoint: ${endpoint}`);
                break;
              } else {
                const errorData = await modelResponse.clone().text();
                console.log(`Endpoint ${endpoint} failed with status ${modelResponse.status}: ${errorData}`);
              }
            } catch (endpointError) {
              console.log(`Endpoint ${endpoint} threw error:`, endpointError);
            }
          }
          
          if (!modelResponse || !modelResponse.ok) {
            try {
              const errorData = modelResponse ? await modelResponse.clone().text() : 'No response';
              console.log(`Model ${model} failed with status ${modelResponse?.status || 'No status'}: ${errorData}`);
              lastError = { status: modelResponse?.status || 'No status', data: errorData };
            } catch (readError) {
              console.log(`Model ${model} failed: Could not read error body`);
              lastError = { status: 'Unknown', data: 'Could not read error body' };
            }
          }
        } catch (error) {
          console.log(`Model ${model} threw error:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        console.log('All Google AI Studio models failed - falling back to enhanced responses');
        // Don't throw error, just fall through to the enhanced fallback system
      }
    } else {
      console.log('Using alternative API endpoint');
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 40
          }
        }),
        signal: AbortSignal.timeout(30000)
      });
    }
    
        if (!response || !response.ok) {
          let errorData = 'No response received';
          if (response) {
            try {
              errorData = await response.clone().text();
            } catch (readError) {
              errorData = 'Could not read error body';
            }
          }
          console.error(`Gemini API error: ${response?.status || 'No status'} - ${errorData}`);
          
          // Return actual error instead of fallback
          return NextResponse.json({
            error: `Google Gemini API failed. Status: ${response?.status || 'No status'}. Error: ${errorData}`,
            message: 'AI service unavailable - please check your API key and try again'
          }, { status: 500 });
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
      console.log('AI response contains [ITEM: markers:', aiResponse.includes('[ITEM:'));
    }

    // Parse items from the response
    const items: any[] = [];
    if (aiResponse) {
      // Look for complete [ITEM:...] blocks
      const itemMatches = aiResponse.match(/\[ITEM:([^\]]+)\]/g);
      if (itemMatches) {
        console.log('Found item matches:', itemMatches);
        for (const match of itemMatches) {
          try {
            const itemJson = match.replace(/\[ITEM:(.+)\]/, '$1');
            console.log('Attempting to parse item JSON:', itemJson);
            const item = JSON.parse(itemJson);
            
            // Validate required fields
            if (!item.name || !item.type) {
              console.error('Item missing required fields:', item);
              continue;
            }
            
            // Set defaults for missing fields
            const completeItem = {
              name: item.name,
              type: item.type,
              rarity: item.rarity || 'common',
              value: item.value || 1,
              weight: item.weight || 1,
              quantity: item.quantity || 1,
              description: item.description || `A ${item.type} item.`
            };
            
            items.push(completeItem);
            console.log('Successfully parsed item:', completeItem);
          } catch (error) {
            console.error('Failed to parse item:', match, 'Error:', error);
            console.error('Item JSON was:', match.replace(/\[ITEM:(.+)\]/, '$1'));
            
            // Try to extract basic info from malformed JSON
            const itemJson = match.replace(/\[ITEM:(.+)\]/, '$1');
            if (itemJson.includes('"name"')) {
              try {
                const nameMatch = itemJson.match(/"name":"([^"]+)"/);
                if (nameMatch) {
                  const fallbackItem = {
                    name: nameMatch[1],
                    type: 'misc',
                    rarity: 'common',
                    value: 1,
                    weight: 1,
                    quantity: 1,
                    description: 'An item found during your adventure.'
                  };
                  items.push(fallbackItem);
                  console.log('Created fallback item from partial JSON:', fallbackItem);
                }
              } catch (fallbackError) {
                console.error('Fallback parsing also failed:', fallbackError);
              }
            }
          }
        }
      } else {
        console.log('No item matches found in response');
      }
      
      // Remove item markers from the response text
      aiResponse = aiResponse.replace(/\[ITEM:[^\]]+\]/g, '').trim();
    }

        // Check if response is valid
    if (!aiResponse || aiResponse.length < 10) {
          console.log('AI response too short or empty');
          return NextResponse.json({
            error: 'AI response was empty or too short',
            message: 'AI service returned invalid response'
          }, { status: 500 });
    }

    return NextResponse.json({
      message: aiResponse,
      items: items,
      usage: { total_tokens: 0 },
      debug: 'Successfully connected to Gemini API'
    });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
    // Check if it's a timeout error
    if (error?.name === 'AbortError') {
      return NextResponse.json({
            error: 'Request timeout - AI service took too long to respond',
            message: 'AI service timeout - please try again'
          }, { status: 500 });
    }
    
    // Check if it's an API key error
    if (error?.message?.includes('403') || error?.message?.includes('API_KEY')) {
          return NextResponse.json({
            error: 'Invalid Google API key. Please check your GOOGLE_API_KEY configuration.',
            message: 'API key authentication failed'
          }, { status: 500 });
        }
        
        // Return actual error
        console.error('AI API: Unexpected error:', error);
        return NextResponse.json({
          error: `Unexpected error: ${error.message}`,
          message: 'AI service error - please check configuration'
        }, { status: 500 });
  }
}