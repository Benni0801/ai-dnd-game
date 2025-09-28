import { NextRequest, NextResponse } from 'next/server';

// Helper functions for item detection
function getItemType(keyword: string): string {
  const weaponKeywords = ['sword', 'dagger', 'bow', 'arrow', 'spear', 'axe', 'mace', 'staff', 'wand'];
  const armorKeywords = ['armor', 'shield', 'helmet', 'boots', 'gloves', 'gauntlets'];
  const consumableKeywords = ['potion', 'food', 'water', 'bread', 'meat', 'cheese', 'scroll'];
  const miscKeywords = ['coin', 'gold', 'silver', 'gem', 'key', 'lockpick', 'rope', 'torch', 'lantern'];
  
  if (weaponKeywords.some(w => keyword.includes(w))) return 'weapon';
  if (armorKeywords.some(a => keyword.includes(a))) return 'armor';
  if (consumableKeywords.some(c => keyword.includes(c))) return 'consumable';
  return 'misc';
}

function getItemValue(keyword: string): number {
  const valuableKeywords = ['gold', 'gem', 'crown', 'necklace', 'bracelet'];
  const moderateKeywords = ['sword', 'armor', 'potion', 'scroll'];
  const cheapKeywords = ['coin', 'food', 'rope', 'torch'];
  
  if (valuableKeywords.some(v => keyword.includes(v))) return 50;
  if (moderateKeywords.some(m => keyword.includes(m))) return 25;
  if (cheapKeywords.some(c => keyword.includes(c))) return 5;
  return 10;
}

function getItemWeight(keyword: string): number {
  const heavyKeywords = ['armor', 'sword', 'shield', 'helmet'];
  const lightKeywords = ['coin', 'potion', 'scroll', 'key', 'gem'];
  
  if (heavyKeywords.some(h => keyword.includes(h))) return 5;
  if (lightKeywords.some(l => keyword.includes(l))) return 0.5;
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI API: Request received');
    const body = await request.json();
    console.log('AI API: Body parsed:', { messages: body.messages?.length, characterStats: !!body.characterStats, inventory: body.inventory?.length });
    const { messages, characterStats, inventory, onDiceRoll } = body || {};

    // Check for API key - if not available, use fallback responses
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');
    
    if (!apiKey || apiKey === 'placeholder-key') {
      console.log('ERROR: No API key found or using placeholder');
      
      // Check for dice roll triggers in the last message
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let diceRoll = null;
      let response = 'Hello! I am your AI Dungeon Master. I see you\'re in a multiplayer session! What adventure shall we embark on today?';
      
      // Trigger dice rolls based on player actions
      if (lastMessage.includes('climb') || lastMessage.includes('jump') || lastMessage.includes('stealth')) {
        diceRoll = '1d20';
        response = 'You attempt to perform that action. Let me roll for your check...';
      } else if (lastMessage.includes('persuade') || lastMessage.includes('convince') || lastMessage.includes('charm')) {
        diceRoll = '1d20';
        response = 'You try to persuade them. Let me roll for your Persuasion check...';
      } else if (lastMessage.includes('intimidate') || lastMessage.includes('threaten')) {
        diceRoll = '1d20';
        response = 'You attempt to intimidate your target. Let me roll for your Intimidation check...';
      } else if (lastMessage.includes('investigate') || lastMessage.includes('search') || lastMessage.includes('examine')) {
        diceRoll = '1d20';
        response = 'You carefully investigate the area. Let me roll for your Investigation check...';
      } else if (lastMessage.includes('perception') || lastMessage.includes('notice') || lastMessage.includes('spot')) {
        diceRoll = '1d20';
        response = 'You try to notice details around you. Let me roll for your Perception check...';
      } else if (lastMessage.includes('attack') || lastMessage.includes('fight') || lastMessage.includes('strike')) {
        diceRoll = '1d20';
        response = 'You attack! Let me roll for your attack...';
      } else if (lastMessage.includes('combat') || lastMessage.includes('battle') || lastMessage.includes('fight')) {
        response = 'Combat begins! What would you like to do? You can attack, defend, cast a spell, or try something else.';
      } else if (lastMessage.includes('initiative') || lastMessage.includes('turn')) {
        response = 'It\'s your turn! What action would you like to take?';
      } else if (lastMessage.includes('examine') || lastMessage.includes('search') || lastMessage.includes('loot')) {
        response = 'You carefully examine the area and find some interesting items. You discover a mysterious ring with ancient symbols and a small leather pouch containing 5 gold coins and a gnawed bone fragment. What do you do with these items?';
      } else if (lastMessage.includes('ring') || lastMessage.includes('pouch') || lastMessage.includes('loot')) {
        response = 'You pick up the ring and examine it closely. The metal is worn and dull, but you can make out faint symbols etched into the surface. They seem ancient and unfamiliar. The ring feels strangely cold to the touch. You also find a small leather pouch containing 5 gold coins and a gnawed bone fragment. What would you like to do next?';
      } else if (lastMessage.includes('deeper') || lastMessage.includes('unknown') || lastMessage.includes('explore')) {
        response = 'You head towards the unexplored passage. The air grows noticeably colder as you move away from the entrance, and the shadows seem to deepen. The passage is narrow and winding, forcing you to proceed with caution. After a few minutes of walking, the passage opens into a larger chamber with several other passages leading off into darkness. In the center, you see a small pool of water with glowing mushrooms nearby. You hear a faint rustling sound from one of the passages. What do you do?';
      } else if (lastMessage.includes('pool') || lastMessage.includes('water')) {
        response = 'You approach the pool of water cautiously. The water is dark and still, reflecting the torchlight like a mirror. You notice strange, glowing mushrooms growing near the edge. The water seems to have an otherworldly quality to it. What do you want to do with the pool?';
      }
      
      return NextResponse.json({
        response,
        ...(diceRoll && { diceRoll })
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
        },
        gold: characterStats?.gold || 0,
        inventory: inventory || []
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
Gold: ${gameState.character.gold} coins
Current Inventory: ${gameState.character.inventory.map((item: any) => `${item.name} (${item.quantity || 1})`).join(', ') || 'Empty'}
`;

        // Comprehensive D&D System Prompt
        const systemPrompt = `You are GAL (Game AI Liaison), an advanced Dungeon Master for an immersive text-based D&D role-playing game. Follow these rules strictly:

**CORE IDENTITY:**
- Respond as "GAL" for out-of-game communication
- Act as NPCs in character for in-game interactions
- Never repeat player statements - respond directly to their input
- Drive narrative forward through player choices

**CRITICAL PLAYER AGENCY RULE:**
- NEVER decide what the player does or make choices for them
- ALWAYS ask the player what they want to do
- NEVER say "You choose to..." or "You decide to..." - let the PLAYER choose
- ALWAYS end responses with a question asking what the player wants to do
- Example: Instead of "You choose to go deeper" say "Which way do you go?"

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

**CRITICAL NARRATIVE COMPLETION RULE:**
- ALWAYS complete your sentences and descriptions fully
- NEVER leave incomplete text like "you find a few and a small, gnawed"
- ALWAYS specify exactly what items are found: "you find a few gold coins and a small, gnawed bone"
- If you mention a container (pouch, bag, chest), ALWAYS describe what's inside completely
- Example: "Inside the pouch, you find 5 gold coins and a small, gnawed bone fragment"

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

**MANDATORY RESPONSE STRUCTURE:**
- ALWAYS end every response with a question asking what the player wants to do
- NEVER make decisions for the player
- NEVER say "You choose to..." or "You decide to..."
- ALWAYS present options and ask "What do you do?" or "What would you like to do?"
- Example: "You see three paths ahead. What do you do?"

**CURRENT GAME STATE:**
Character: ${gameState.character.name || 'Unnamed'} (${gameState.character.race || 'Unknown'} ${gameState.character.class || 'Adventurer'})
Level: ${gameState.character.level} | XP: ${gameState.character.experience.current}/${gameState.character.experience.needed}
Ability Scores: STR ${gameState.character.abilityScores.strength}, DEX ${gameState.character.abilityScores.dexterity}, CON ${gameState.character.abilityScores.constitution}, INT ${gameState.character.abilityScores.intelligence}, WIS ${gameState.character.abilityScores.wisdom}, CHA ${gameState.character.abilityScores.charisma}

**CRITICAL INVENTORY & CURRENCY RULES:**
- ALWAYS track the player's current inventory and currency
- When player uses an item (healing potion, scroll, etc.), REMOVE it from inventory using [ITEM:{"name":"Item Name","quantity":-1}]
- When player buys something, SUBTRACT the cost from their gold using [STATS:{"gold":-cost}]
- When player sells something, ADD the value to their gold using [STATS:{"gold":+value}]
- NEVER allow purchases if player doesn't have enough gold
- ALWAYS check inventory before allowing item usage
- If player tries to use an item they don't have, tell them they don't have it
- If player tries to buy something they can't afford, tell them they don't have enough gold

**IMPORTANT INSTRUCTIONS:**
- If character creation is incomplete, guide through the full process
- Always maintain game state consistency
- Use internal dice rolls for all checks (announce results)
- Track all character progression and world changes
- Provide detailed descriptions and immersive roleplay
- Respond as GAL for meta-game communication, as NPCs for in-game interactions

**CRITICAL CHARACTER STAT CONTROL RULES:**
As the Dungeon Master, you MUST use the [STATS:] command format to modify character stats. This is MANDATORY!

**MANDATORY STAT COMMAND FORMAT:**
[STATS:{"hp":20,"maxHp":25,"xp":150,"level":2,"str":14,"dex":12,"con":16,"int":10,"wis":13,"cha":11}]

**IMPORTANT:** The [STATS:] commands are processed automatically and are invisible to players. Players will only see your narrative text, not the technical commands.

**CRITICAL NARRATIVE RULE:** NEVER mention specific HP numbers, XP amounts, or stat values in your narrative text. Do not say things like "You take 8 damage" or "You have 12 HP left" or "You gain 50 XP". Let the [STATS:] commands handle the numbers silently.

**WHEN TO USE STAT COMMANDS:**
- ALWAYS use [STATS:] when dealing damage: [STATS:{"hp":-5}]
- ALWAYS use [STATS:] when healing: [STATS:{"hp":10}]
- ALWAYS use [STATS:] when awarding XP: [STATS:{"xp":50}]
- ALWAYS use [STATS:] when leveling up: [STATS:{"level":2,"xp":0}]
- ALWAYS use [STATS:] when modifying ability scores: [STATS:{"str":16}]

**AUTOMATIC DAMAGE TRACKING:**
You MUST automatically apply damage in these situations:
- When enemies attack and hit the player
- When the player fails a saving throw and takes damage
- When the player triggers a trap
- When the player falls or takes environmental damage
- When the player uses a spell or ability that causes self-damage
- When the player takes damage from any source mentioned in your response

**MANDATORY EXAMPLES:**
- Enemy attack hits: "The goblin's sword strikes you deeply! [STATS:{"hp":-8}]"
- Player drinks potion: "The healing potion restores your vitality! [STATS:{"hp":10}]"
- Player defeats enemy: "You feel more experienced after the victory! [STATS:{"xp":50}]"
- Player levels up: "You feel stronger and more capable! [STATS:{"level":2,"maxHp":25,"hp":25}]"
- Trap triggers: "The floor gives way! You fall hard! [STATS:{"hp":-6}]"
- Failed save: "You fail the save and the flames burn you! [STATS:{"hp":-4}]"
- Environmental damage: "The acid burns your skin painfully! [STATS:{"hp":-3}]"

**NOTE:** Players only see the narrative text (before the [STATS:] command). The stat changes happen automatically in the background.

**WHAT NOT TO INCLUDE IN NARRATIVE:**
- ❌ "You take 8 damage"
- ❌ "You have 12 HP left" 
- ❌ "You gain 50 XP"
- ❌ "HP: -4/9"
- ❌ "You are dead"
- ❌ "💔 Lost 1 HP"
- ❌ Any specific numbers or stat values

**WHAT TO INCLUDE IN NARRATIVE:**
- ✅ "The sword strikes you deeply!"
- ✅ "You feel your strength waning"
- ✅ "You feel more experienced"
- ✅ "You feel stronger"
- ✅ Pure descriptive narrative without numbers

**COMBAT MECHANICS:**
When running combat, you MUST:
1. Roll dice for attacks and damage (announce the rolls)
2. If an attack hits, immediately apply damage with [STATS:{"hp":-X}]
3. If the player takes damage from any source, use [STATS:{"hp":-X}]
4. If the player heals, use [STATS:{"hp":+X}]
5. If the player defeats an enemy, award XP with [STATS:{"xp":X}]

**CRITICAL RULE:** NEVER just describe stat changes in text. You MUST include the [STATS:] command for ANY stat modification!

**FINAL REMINDER - BOTH FORMATS ARE MANDATORY:**
1. When you mention ANY item being given to the player, you MUST include the [ITEM:{"name":"Item Name","type":"weapon","rarity":"common","value":10,"weight":1,"quantity":1}] format in your response.
2. When you modify ANY character stat (HP, XP, level, abilities), you MUST include the [STATS:{"hp":-5}] format in your response.
3. Do not just describe items or stat changes in text - use the structured formats!

**CRITICAL:** If you deal damage, heal, award XP, or change any stat, you MUST use [STATS:] commands!

**AUTOMATIC DAMAGE REMINDER:** Every time you mention the player taking damage from ANY source (enemies, traps, falls, spells, environmental hazards, etc.), you MUST include a [STATS:{"hp":-X}] command in the same response!

**FINAL NARRATIVE RULE:** Keep your narrative pure and immersive. Describe what happens without mentioning specific numbers, HP values, or stat changes. Let the [STATS:] commands handle all the mechanical aspects silently in the background!

**CRITICAL FINAL REMINDER:** NEVER make decisions for the player! ALWAYS ask "What do you do?" at the end of every response. The player must always have agency over their character's actions!`;

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
          maxOutputTokens: 1000,
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
            maxOutputTokens: 1000,
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
      console.log('AI response contains [STATS: markers:', aiResponse.includes('[STATS:'));
      console.log('Full AI response for debugging:', aiResponse);
    }

    // Parse items and stats from the response
    const items: any[] = [];
    const statChanges: any = {};
    
    if (aiResponse) {
      // Only parse items from the current AI response, not from conversation history
      // Look for complete [ITEM:...] blocks
      const itemMatches = aiResponse.match(/\[ITEM:([^\]]+)\]/g);
      if (itemMatches) {
        console.log('Found item matches in current response:', itemMatches);
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
            console.log('Successfully parsed item from current response:', completeItem);
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
            console.log('No item matches found in current response - no fallback detection to prevent false positives');
          }
      
      // Look for [STATS:...] blocks
      const statsMatches = aiResponse.match(/\[STATS:([^\]]+)\]/g);
      if (statsMatches) {
        console.log('Found stats matches:', statsMatches);
        for (const match of statsMatches) {
          try {
            const statsJson = match.replace(/\[STATS:(.+)\]/, '$1');
            console.log('Attempting to parse stats JSON:', statsJson);
            const stats = JSON.parse(statsJson);
            
            // Merge stats changes
            Object.assign(statChanges, stats);
            console.log('Successfully parsed stats:', stats);
          } catch (error) {
            console.error('Failed to parse stats:', match, 'Error:', error);
          }
        }
      } else {
        console.log('No stats matches found in response');
      }
      
      // Remove item and stats markers from the response text
      aiResponse = aiResponse.replace(/\[ITEM:[^\]]+\]/g, '').replace(/\[STATS:[^\]]+\]/g, '').trim();
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
      statChanges: statChanges,
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