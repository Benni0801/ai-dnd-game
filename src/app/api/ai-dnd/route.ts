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
    console.log('AI API: Body parsed:', { 
      messages: body.messages?.length, 
      characterStats: !!body.characterStats, 
      inventory: body.inventory?.length,
      inventoryItems: body.inventory?.map((item: any) => item.name) || []
    });
    const { messages, characterStats, inventory, onDiceRoll } = body || {};

    // MODULAR COMBAT SYSTEM - Enhance AI responses with combat data
    const lastUserMessage = messages?.[messages.length - 1];
    const userInput = lastUserMessage?.content?.trim() || '';
    
    // Check if this is a combat scenario that needs enhancement
    const combatKeywords = [
      'fight', 'attack', 'battle', 'encounter', 'monster', 'enemy', 'combat',
      'goblin', 'worg', 'dragon', 'troll', 'orc', 'skeleton', 'spider', 'wolf', 'rat', 'bandit', 'zombie', 'kobold', 'imp',
      'bear', 'boar', 'crocodile', 'eagle', 'hyena', 'lion', 'panther', 'shark', 'tiger',
      'ghoul', 'ghost', 'lich', 'mummy', 'vampire', 'wraith',
      'demon', 'devil', 'succubus', 'balor',
      'wyvern', 'drake', 'elemental', 'earth', 'water', 'air',
      'giant', 'ogre', 'beholder', 'mind', 'aboleth',
      'golem', 'animated', 'fairy', 'dryad', 'satyr',
      'knight', 'mage', 'assassin', 'cultist', 'pirate', 'gladiator',
      'chimera', 'griffon', 'hydra', 'medusa', 'minotaur', 'sphinx',
      'ooze', 'slime', 'treant', 'shambler', 'angel', 'unicorn',
      'hellhound', 'nightmare', 'i attack', 'i cast', 'i dodge',
      'enemy turn', 'enemy attacks', 'slash', 'strike', 'hit', 'swing',
      'cast spell', 'dodge', 'flee', 'run away'
    ];
    
    const isCombatInput = combatKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
    
    // Combat enhancement data to append to AI response
    let combatEnhancement = '';
    
    if (isCombatInput) {
      // Generate enemy data for combat scenarios
      if (userInput.toLowerCase().includes('goblin')) {
        combatEnhancement = ` [ENEMY:{"name":"Goblin","hp":7,"ac":15,"damage":"1d4+2","description":"A small but cunning goblin","xp":50}]`;
      } else if (userInput.toLowerCase().includes('rat')) {
        combatEnhancement = ` [ENEMY:{"name":"Giant Rat","hp":5,"ac":12,"damage":"1d4","description":"A large, aggressive rat with sharp teeth","xp":25}]`;
      } else if (userInput.toLowerCase().includes('worg')) {
        combatEnhancement = ` [ENEMY:{"name":"Worg","hp":26,"ac":13,"damage":"2d6+3","description":"A massive wolf-like creature with supernatural intelligence","xp":200}]`;
      } else if (userInput.toLowerCase().includes('dragon')) {
        combatEnhancement = ` [ENEMY:{"name":"Young Red Dragon","hp":178,"ac":18,"damage":"2d10+4","description":"A young but deadly red dragon with fire breath","xp":3900}]`;
      } else if (userInput.toLowerCase().includes('troll')) {
        combatEnhancement = ` [ENEMY:{"name":"Troll","hp":84,"ac":15,"damage":"2d8+4","description":"A massive troll with regenerative abilities","xp":1800}]`;
      } else if (userInput.toLowerCase().includes('orc')) {
        combatEnhancement = ` [ENEMY:{"name":"Orc Warrior","hp":15,"ac":13,"damage":"1d12+3","description":"A battle-hardened orc warrior","xp":100}]`;
      } else if (userInput.toLowerCase().includes('skeleton')) {
        combatEnhancement = ` [ENEMY:{"name":"Skeleton Warrior","hp":13,"ac":13,"damage":"1d6+1","description":"An animated skeleton with a rusty sword","xp":50}]`;
      } else if (userInput.toLowerCase().includes('spider')) {
        combatEnhancement = ` [ENEMY:{"name":"Giant Spider","hp":8,"ac":13,"damage":"1d6","description":"A large spider with venomous fangs","xp":25}]`;
      } else if (userInput.toLowerCase().includes('wolf')) {
        combatEnhancement = ` [ENEMY:{"name":"Dire Wolf","hp":37,"ac":14,"damage":"2d6+3","description":"A massive dire wolf with glowing eyes","xp":200}]`;
      } else if (userInput.toLowerCase().includes('bandit')) {
        combatEnhancement = ` [ENEMY:{"name":"Bandit","hp":11,"ac":12,"damage":"1d6+1","description":"A desperate bandit with a shortsword","xp":50}]`;
      } else if (userInput.toLowerCase().includes('zombie')) {
        combatEnhancement = ` [ENEMY:{"name":"Zombie","hp":22,"ac":8,"damage":"1d6+1","description":"A shambling undead creature","xp":50}]`;
      } else if (userInput.toLowerCase().includes('kobold')) {
        combatEnhancement = ` [ENEMY:{"name":"Kobold","hp":5,"ac":12,"damage":"1d4","description":"A small reptilian humanoid with a spear","xp":25}]`;
      } else if (userInput.toLowerCase().includes('bear')) {
        combatEnhancement = ` [ENEMY:{"name":"Black Bear","hp":19,"ac":11,"damage":"2d4+2","description":"A massive black bear with powerful claws","xp":100}]`;
      } else if (userInput.toLowerCase().includes('lion')) {
        combatEnhancement = ` [ENEMY:{"name":"Lion","hp":26,"ac":12,"damage":"1d8+2","description":"A fierce lion with sharp claws and teeth","xp":150}]`;
      } else if (userInput.toLowerCase().includes('tiger')) {
        combatEnhancement = ` [ENEMY:{"name":"Tiger","hp":37,"ac":12,"damage":"1d10+2","description":"A powerful tiger with striped fur and claws","xp":200}]`;
      } else if (userInput.toLowerCase().includes('ghoul')) {
        combatEnhancement = ` [ENEMY:{"name":"Ghoul","hp":22,"ac":12,"damage":"2d4+2","description":"A ravenous undead creature with paralyzing claws","xp":100}]`;
      } else if (userInput.toLowerCase().includes('ghost')) {
        combatEnhancement = ` [ENEMY:{"name":"Ghost","hp":45,"ac":11,"damage":"4d6","description":"A spectral undead spirit that can phase through walls","xp":300}]`;
      } else if (userInput.toLowerCase().includes('demon')) {
        combatEnhancement = ` [ENEMY:{"name":"Demon","hp":45,"ac":15,"damage":"2d6+3","description":"A chaotic demon from the Abyss with infernal powers","xp":200}]`;
      } else if (userInput.toLowerCase().includes('devil')) {
        combatEnhancement = ` [ENEMY:{"name":"Devil","hp":52,"ac":16,"damage":"2d6+4","description":"A lawful evil devil from the Nine Hells","xp":250}]`;
      } else if (userInput.toLowerCase().includes('elemental')) {
        combatEnhancement = ` [ENEMY:{"name":"Fire Elemental","hp":102,"ac":13,"damage":"2d6+3","description":"A living flame that burns everything it touches","xp":500}]`;
      } else if (userInput.toLowerCase().includes('giant')) {
        combatEnhancement = ` [ENEMY:{"name":"Hill Giant","hp":105,"ac":13,"damage":"3d8+4","description":"A massive hill giant with a huge club","xp":800}]`;
      } else if (userInput.toLowerCase().includes('ogre')) {
        combatEnhancement = ` [ENEMY:{"name":"Ogre","hp":59,"ac":11,"damage":"2d8+4","description":"A large, brutish ogre with a greatclub","xp":400}]`;
      } else if (userInput.toLowerCase().includes('beholder')) {
        combatEnhancement = ` [ENEMY:{"name":"Beholder","hp":180,"ac":18,"damage":"3d6","description":"A floating eye with multiple eye stalks and deadly rays","xp":1000}]`;
      } else if (userInput.toLowerCase().includes('golem')) {
        combatEnhancement = ` [ENEMY:{"name":"Iron Golem","hp":210,"ac":20,"damage":"3d8+7","description":"A massive iron construct immune to most magic","xp":1200}]`;
      } else if (userInput.toLowerCase().includes('knight')) {
        combatEnhancement = ` [ENEMY:{"name":"Knight","hp":52,"ac":18,"damage":"1d8+3","description":"A heavily armored knight with a longsword","xp":300}]`;
      } else if (userInput.toLowerCase().includes('mage')) {
        combatEnhancement = ` [ENEMY:{"name":"Evil Mage","hp":40,"ac":12,"damage":"1d4+1","description":"A spellcasting wizard with arcane powers","xp":250}]`;
      } else if (userInput.toLowerCase().includes('assassin')) {
        combatEnhancement = ` [ENEMY:{"name":"Assassin","hp":78,"ac":15,"damage":"1d6+3","description":"A deadly assassin with poison and stealth","xp":400}]`;
      } else if (userInput.toLowerCase().includes('cultist')) {
        combatEnhancement = ` [ENEMY:{"name":"Cultist","hp":9,"ac":12,"damage":"1d6","description":"A fanatical cultist serving dark powers","xp":50}]`;
      } else if (userInput.toLowerCase().includes('pirate')) {
        combatEnhancement = ` [ENEMY:{"name":"Pirate","hp":11,"ac":12,"damage":"1d6+1","description":"A swashbuckling pirate with a cutlass","xp":75}]`;
      } else if (userInput.toLowerCase().includes('gladiator')) {
        combatEnhancement = ` [ENEMY:{"name":"Gladiator","hp":112,"ac":16,"damage":"2d6+3","description":"A skilled gladiator with combat experience","xp":600}]`;
      } else if (userInput.toLowerCase().includes('chimera')) {
        combatEnhancement = ` [ENEMY:{"name":"Chimera","hp":114,"ac":14,"damage":"2d6+4","description":"A creature with the head of a lion, goat, and dragon","xp":700}]`;
      } else if (userInput.toLowerCase().includes('griffon')) {
        combatEnhancement = ` [ENEMY:{"name":"Griffon","hp":59,"ac":12,"damage":"2d6+3","description":"A majestic creature with the body of a lion and head of an eagle","xp":400}]`;
      } else if (userInput.toLowerCase().includes('hydra')) {
        combatEnhancement = ` [ENEMY:{"name":"Hydra","hp":172,"ac":15,"damage":"1d10+5","description":"A multi-headed serpent that regrows heads when cut off","xp":900}]`;
      } else if (userInput.toLowerCase().includes('medusa')) {
        combatEnhancement = ` [ENEMY:{"name":"Medusa","hp":127,"ac":15,"damage":"2d6+3","description":"A creature with snakes for hair that can turn people to stone","xp":800}]`;
      } else if (userInput.toLowerCase().includes('minotaur')) {
        combatEnhancement = ` [ENEMY:{"name":"Minotaur","hp":76,"ac":14,"damage":"2d8+4","description":"A bull-headed humanoid with a massive axe","xp":500}]`;
      } else if (userInput.toLowerCase().includes('sphinx')) {
        combatEnhancement = ` [ENEMY:{"name":"Sphinx","hp":136,"ac":17,"damage":"2d8+4","description":"A mystical creature with the body of a lion and head of a human","xp":900}]`;
      } else if (userInput.toLowerCase().includes('ooze')) {
        combatEnhancement = ` [ENEMY:{"name":"Gelatinous Cube","hp":84,"ac":6,"damage":"2d6+2","description":"A transparent cube of acidic jelly","xp":400}]`;
      } else if (userInput.toLowerCase().includes('slime')) {
        combatEnhancement = ` [ENEMY:{"name":"Black Pudding","hp":85,"ac":7,"damage":"2d6+2","description":"A corrosive black ooze that dissolves metal","xp":400}]`;
      } else if (userInput.toLowerCase().includes('treant')) {
        combatEnhancement = ` [ENEMY:{"name":"Treant","hp":138,"ac":16,"damage":"3d6+6","description":"A massive tree that has gained sentience and mobility","xp":900}]`;
      } else if (userInput.toLowerCase().includes('angel')) {
        combatEnhancement = ` [ENEMY:{"name":"Angel","hp":114,"ac":17,"damage":"2d8+4","description":"A celestial being with divine powers and healing abilities","xp":800}]`;
      } else if (userInput.toLowerCase().includes('unicorn')) {
        combatEnhancement = ` [ENEMY:{"name":"Unicorn","hp":67,"ac":12,"damage":"2d6+3","description":"A pure white horse with a magical horn","xp":500}]`;
      } else if (userInput.toLowerCase().includes('hellhound')) {
        combatEnhancement = ` [ENEMY:{"name":"Hell Hound","hp":45,"ac":15,"damage":"1d8+2","description":"A demonic dog with fire breath and glowing red eyes","xp":300}]`;
      } else if (userInput.toLowerCase().includes('nightmare')) {
        combatEnhancement = ` [ENEMY:{"name":"Nightmare","hp":68,"ac":13,"damage":"2d6+3","description":"A demonic horse that can travel through shadows","xp":400}]`;
      } else {
        // Default combat enhancement for any other combat scenario
        combatEnhancement = ` [ENEMY:{"name":"Mysterious Creature","hp":25,"ac":12,"damage":"1d8+2","description":"A strange creature whose nature is unclear","xp":100}]`;
      }
    }

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

    // Check for API key - if not available, use fallback responses
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 20) : 'None');
    
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
        
        // Check for health potion usage
        const healthPotionUsage = lastMessage.includes('drink') || lastMessage.includes('use') || lastMessage.includes('heal');
        const hasHealthPotion = gameState.character.inventory.some((item: any) => 
          item.name.toLowerCase().includes('health') && item.name.toLowerCase().includes('potion')
        );
        
        console.log('Health potion check:', { 
          healthPotionUsage, 
          hasHealthPotion, 
          lastMessage, 
          inventory: gameState.character.inventory 
        });
        
        if (healthPotionUsage && hasHealthPotion) {
          response = 'You drink the health potion and feel its healing energy flow through your body! [STATS:{"hp":+10}] [ITEM:{"name":"Health Potion","quantity":-1}] The warmth spreads through your veins, mending your wounds. What do you do next?';
          console.log('Health potion fallback triggered with response:', response);
        } else if (healthPotionUsage && !hasHealthPotion) {
          response = 'You reach for a health potion, but your pack is empty. You don\'t have any health potions to use. What would you like to do instead?';
          console.log('No health potion available, response:', response);
        } else if (lastMessage.includes('loot') || lastMessage.includes('found') || lastMessage.includes('inventory')) {
          const inventoryList = gameState.character.inventory.length > 0 
            ? gameState.character.inventory.map((item: any) => `${item.name} (${item.quantity})`).join(', ')
            : 'nothing';
          response = `You have ${inventoryList} in your inventory. What would you like to do next?`;
        } else if (lastMessage.includes('pouch') || lastMessage.includes('bag') || lastMessage.includes('chest')) {
          response = 'You search through the container and find some interesting items. You discover 5 gold coins and a small red gem. [ITEM:{"name":"Gold Coins","type":"misc","rarity":"common","value":1,"weight":0.02,"quantity":5}] [ITEM:{"name":"Red Gem","type":"misc","rarity":"uncommon","value":25,"weight":0.1,"quantity":1}] What do you do with these items?';
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
        console.log('Creating character context with inventory:', gameState.character.inventory);
        const inventoryList = gameState.character.inventory && gameState.character.inventory.length > 0 
          ? gameState.character.inventory.map((item: any) => `${item.name} (${item.quantity || 1})`).join(', ')
          : 'Empty';
        
        const characterContext = `
**CURRENT GAME STATE**
Character: ${gameState.character.name || 'Unnamed'} (${gameState.character.race || 'Unknown'} ${gameState.character.class || 'Adventurer'})
Level: ${gameState.character.level} | XP: ${gameState.character.experience.current}/${gameState.character.experience.needed}
Ability Scores: STR ${gameState.character.abilityScores.strength}, DEX ${gameState.character.abilityScores.dexterity}, CON ${gameState.character.abilityScores.constitution}, INT ${gameState.character.abilityScores.intelligence}, WIS ${gameState.character.abilityScores.wisdom}, CHA ${gameState.character.abilityScores.charisma}
Gold: ${gameState.character.gold} coins
Current Inventory: ${inventoryList}
`;
        
        console.log('Final character context being sent to AI:', characterContext);

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

**CLASS-SPECIFIC ABILITIES & EQUIPMENT:**
- Fighter: Proficient with all weapons and armor, can use Action Surge, Second Wind. Starts with Longsword, Shield, Chain Mail, Crossbow
- Wizard: Can cast spells from spellbook, uses Intelligence for spellcasting, Arcane Recovery. Starts with Quarterstaff, Component Pouch, Spellbook
- Rogue: Sneak Attack damage, Thieves' Cant, Cunning Action, Expertise. Starts with Rapier, Shortbow, Leather Armor, Thieves' Tools
- Cleric: Divine magic, Channel Divinity, Turn Undead, uses Wisdom for spellcasting. Starts with Mace, Shield, Scale Mail, Holy Symbol
- Ranger: Favored Enemy, Natural Explorer, Spellcasting (Wisdom), Hunter's Mark. Starts with Longsword, Longbow, Leather Armor
- Paladin: Divine magic, Lay on Hands, Divine Smite, uses Charisma for spellcasting. Starts with Longsword, Shield, Chain Mail, Holy Symbol
- Barbarian: Rage, Unarmored Defense, Reckless Attack, Danger Sense. Starts with Greataxe, Handaxes, Javelins
- Bard: Bardic Inspiration, Spellcasting (Charisma), Jack of All Trades, Song of Rest. Starts with Rapier, Lute, Leather Armor
- Sorcerer: Sorcery Points, Metamagic, Spellcasting (Charisma), Font of Magic. Starts with Daggers, Component Pouch
- Warlock: Pact Magic, Eldritch Invocations, Patron abilities, uses Charisma for spellcasting. Starts with Light Crossbow, Component Pouch
- Druid: Wild Shape, Spellcasting (Wisdom), Druidic language, Nature magic. Starts with Scimitar, Leather Armor, Shield, Druidic Focus
- Monk: Martial Arts, Ki points, Unarmored Defense, Flurry of Blows. Starts with Shortsword, Darts
- Artificer: Infusions, Spellcasting (Intelligence), Magical Tinkering, Tool Expertise. Starts with Light Crossbow, Scale Mail, Thieves' Tools

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

**CRITICAL: ONLY use [ITEM:] tags when the PLAYER actually finds, receives, or purchases items!**
**DO NOT use [ITEM:] tags when:**
- Describing what NPCs have or what was stolen from others
- Mentioning items in the environment that aren't given to the player
- Talking about items that exist in the world but aren't looted
- Using words like "stolen", "taken", "had", "possessed" in narrative context

**NEVER mention items in text without using [ITEM:] format!**
**If you say "You receive a sword" - you MUST include [ITEM:{"name":"Sword",...}] in the same message!**

**CRITICAL NARRATIVE COMPLETION RULE:**
- ALWAYS complete your sentences and descriptions fully
- NEVER leave incomplete text like "you find a few and a small, gnawed"
- ALWAYS specify exactly what items are found: "you find a few gold coins and a small, gnawed bone"
- If you mention a container (pouch, bag, chest), ALWAYS describe what's inside completely
- Example: "Inside the pouch, you find 5 gold coins and a small, gnawed bone fragment"

**CRITICAL ITEM DESCRIPTION RULE:**
- When giving items to the player, ALWAYS describe them in narrative text BEFORE using [ITEM:] tags
- Format: "You find [description] and [description]. [ITEM:{"name":"Item Name"...}] [ITEM:{"name":"Item Name"...}]"
- NEVER use [ITEM:] tags without describing what the items are in the narrative text
- Example: "Inside the pouch, you find 5 gold coins and a small red gem. [ITEM:{"name":"Gold Coins","type":"misc","quantity":5}] [ITEM:{"name":"Red Gem","type":"misc","quantity":1}]"

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

**HEALTH POTION USAGE RULES:**
- When player says "drink health potion", "use health potion", or "heal", ALWAYS:
  1. Check if they have Health Potion in inventory
  2. If yes: Remove 1 Health Potion using [ITEM:{"name":"Health Potion","quantity":-1}]
  3. Restore HP using [STATS:{"hp":+10}] (ADD 10 HP, do NOT set HP to 10)
  4. Say "The healing potion restores your vitality!"
- If no health potion available, say "You don't have any health potions"

**INVENTORY AWARENESS:**
- ONLY reference inventory items when the player specifically asks about them
- When player asks "what did I loot?", "what's in my inventory?", or similar questions, list the relevant items
- When mentioning what the player has equipped or in their pack, use the EXACT item names from the Current Inventory list
- NEVER use placeholder text like "your,, and have in your pack,, and" - always use actual item names
- Don't constantly mention inventory unless specifically asked
- Be selective about when to reference inventory - focus on the narrative flow

**IMPORTANT INSTRUCTIONS:**
- If character creation is incomplete, guide through the full process
- Always maintain game state consistency
- Use internal dice rolls for all checks (announce results) - NEVER ask player to roll dice!
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
- Player drinks potion: "The healing potion restores your vitality! [STATS:{"hp":+10}]"
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

**DICE ROLLING - CRITICAL:**
- You MUST automatically roll dice when appropriate - NEVER ask the player to roll!
- Use the format: [DICE:1d20] or [DICE:2d6+3] for dice rolls
- ALWAYS roll initiative when combat starts
- ALWAYS roll attack rolls when players attack
- ALWAYS roll damage dice when attacks hit
- ALWAYS roll skill checks when players attempt actions (stealth, perception, investigation, etc.)
- ALWAYS roll saving throws when players are affected by spells or effects
- NEVER say "roll a d20" or "make a roll" - just roll the dice automatically
- Always describe what you're rolling for and show the result

**COMBAT MECHANICS:**
When running combat, you MUST:
1. ALWAYS roll dice for attacks and damage automatically - NEVER ask player to roll!
2. If an attack hits, immediately apply damage with [STATS:{"hp":-X}]
3. If the player takes damage from any source, use [STATS:{"hp":-X}]
4. If the player heals, use [STATS:{"hp":+X}]
5. If the player defeats an enemy, award XP with [STATS:{"xp":X}]
6. Examples: "You attack! [DICE:1d20] You roll a 15, hitting for [DICE:1d8+2] damage!"

**TURN-BASED COMBAT SYSTEM:**
- When combat begins, use phrases like "Combat begins!" or "A fight breaks out!"
- The game will automatically switch to turn-based combat mode
- Players can only use specific combat actions during combat
- Each class has unique combat abilities (Fighter: Attack, Second Wind, Action Surge; Wizard: Attack, Cast Spell, Use Item; etc.)
- Combat continues until one side is defeated
- After combat, return to normal exploration mode

**CRITICAL RULE:** NEVER just describe stat changes in text. You MUST include the [STATS:] command for ANY stat modification!

**FINAL REMINDER - BOTH FORMATS ARE MANDATORY:**
1. When you mention ANY item being given to the player, you MUST include the [ITEM:{"name":"Item Name","type":"weapon","rarity":"common","value":10,"weight":1,"quantity":1}] format in your response.
2. When you modify ANY character stat (HP, XP, level, abilities), you MUST include the [STATS:{"hp":-5}] format in your response.
3. Do not just describe items or stat changes in text - use the structured formats!

**NARRATIVE CONTEXT RULE:**
- ONLY use [ITEM:] tags when the PLAYER directly receives, finds, or purchases items
- DO NOT use [ITEM:] tags when describing what NPCs have, what was stolen from others, or environmental items
- If you say "They stole livestock" or "The goblins took our sheep", do NOT add [ITEM:] tags
- [ITEM:] tags are ONLY for items the PLAYER character receives, not narrative descriptions

**CRITICAL:** If you deal damage, heal, award XP, or change any stat, you MUST use [STATS:] commands!

**AUTOMATIC DAMAGE REMINDER:** Every time you mention the player taking damage from ANY source (enemies, traps, falls, spells, environmental hazards, etc.), you MUST include a [STATS:{"hp":-X}] command in the same response!

**FINAL NARRATIVE RULE:** Keep your narrative pure and immersive. Describe what happens without mentioning specific numbers, HP values, or stat changes. Let the [STATS:] commands handle all the mechanical aspects silently in the background!

**INVENTORY REFERENCE RULE:** Only mention inventory items when the player specifically asks about them. When they do ask, use the exact item names from the "Current Inventory" section above. NEVER use placeholder text or empty commas. Focus on narrative flow rather than constantly mentioning inventory.

**INVENTORY REFERENCE RULES:** Only mention inventory when specifically asked:
- If player asks "what did I loot?" → List recently found items
- If player asks "what's in my pack?" → List current inventory
- If player asks "what equipment do I have?" → List equipped/important items
- Don't mention inventory unless the player specifically asks about it
- Focus on narrative flow rather than constant inventory updates
        
**QUEST SYSTEM - CRITICAL JSON FORMAT:**
- You can offer quests to players when they encounter NPCs or explore areas
- ALWAYS use the EXACT format: [QUEST:{"title":"Quest Name","description":"Quest description","questGiver":"NPC Name","xpReward":100,"goldReward":50,"type":"side","objectives":["Objective 1","Objective 2"]}]
- CRITICAL JSON RULES:
  * Use ONLY double quotes (") never single quotes (')
  * NO trailing commas after the last element in objects or arrays
  * ALL keys must be in double quotes
  * ALL string values must be in double quotes
  * NO line breaks inside the JSON
- Quest types: "main" (story quests), "side" (optional), "daily" (repeatable)
- XP rewards: 50-200 for side quests, 100-500 for main quests
- Gold rewards: 10-100 gold depending on quest difficulty
- Always include clear objectives for the quest
- Only offer quests when it makes narrative sense (NPCs asking for help, finding quest boards, etc.)
- CRITICAL: The [QUEST:] tag must be on the SAME LINE as your narrative text, not on a separate line!
- Example: "The village elder approaches you with a worried expression. 'Adventurer, we need your help! Our crops are being stolen by goblins. Will you help us?' [QUEST:{\"title\":\"Goblin Thieves\",\"description\":\"Investigate and stop the goblins stealing crops from the village\",\"questGiver\":\"Village Elder\",\"xpReward\":150,\"goldReward\":75,\"type\":\"side\",\"objectives\":[\"Find the goblin camp\",\"Defeat the goblin leader\",\"Return to the village elder\"]}]"
- When offering a quest, make it natural and part of the conversation flow
        
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
          maxOutputTokens: 2048,
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
      console.log('Making Gemini API call with prompt length:', fullPrompt.length);
      console.log('API Key length:', apiKey.length);
      
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
      
      console.log('Gemini API response status:', response.status);
      console.log('Gemini API response ok:', response.ok);
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
    console.log('Response data structure check:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      firstCandidate: data.candidates?.[0] ? 'exists' : 'missing',
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts,
      partsLength: data.candidates?.[0]?.content?.parts?.length || 0,
      firstPartText: data.candidates?.[0]?.content?.parts?.[0]?.text || 'no text'
    });
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text || '';
      console.log('Extracted AI response:', aiResponse);
      console.log('AI response type:', typeof aiResponse);
      console.log('AI response length:', aiResponse?.length || 0);
    } else {
      console.log('No valid response structure found in data:', data);
    }

    // Clean up the response
    if (aiResponse) {
      console.log('Raw AI response before cleaning:', aiResponse);
      aiResponse = aiResponse.replace(/Please respond as the Dungeon Master:/g, '').trim();
      console.log('Cleaned AI response:', aiResponse);
      console.log('AI response length:', aiResponse.length);
      console.log('AI response contains [ITEM: markers:', aiResponse.includes('[ITEM:'));
      console.log('AI response contains [STATS: markers:', aiResponse.includes('[STATS:'));
      console.log('Full AI response for debugging:', aiResponse);
    } else {
      console.log('AI response is null or undefined!');
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
            console.log('Final statChanges object:', statChanges);
          } catch (error) {
            console.error('Failed to parse stats:', match, 'Error:', error);
            console.error('Raw match:', match);
            console.error('Stats JSON string:', match.replace(/\[STATS:(.+)\]/, '$1'));
          }
        }
      } else {
        console.log('No stats matches found in response');
        console.log('AI response for stats debugging:', aiResponse);
        console.log('Looking for patterns in response:', {
          hasStatsBracket: aiResponse.includes('[STATS:'),
          hasHpPlus: aiResponse.includes('"hp":+'),
          hasHpMinus: aiResponse.includes('"hp":-'),
          hasHpNumber: aiResponse.includes('"hp":'),
          fullResponse: aiResponse
        });
      }
      
      // Remove item and stats markers from the response text
      aiResponse = aiResponse.replace(/\[ITEM:[^\]]+\]/g, '').replace(/\[STATS:[^\]]+\]/g, '').trim();
      
      // Clean up incomplete sentences that might result from tag removal
      aiResponse = aiResponse.replace(/,\s*and\s*\./g, '.'); // Fix "find and ."
      aiResponse = aiResponse.replace(/,\s*and\s*$/g, '.'); // Fix "find and" at end
      aiResponse = aiResponse.replace(/,\s*$/g, '.'); // Fix trailing commas
      aiResponse = aiResponse.replace(/\s+/g, ' ').trim(); // Clean up extra spaces
    }

        // Check if response is valid
    if (!aiResponse || aiResponse.length < 10) {
          console.log('AI response too short or empty');
          return NextResponse.json({
            error: 'AI response was empty or too short',
            message: 'AI service returned invalid response'
          }, { status: 500 });
    }

    // Check for automatic dice rolling based on AI response content
    let diceRoll = null;
    const responseLower = aiResponse.toLowerCase();
    
    // Combat and attack scenarios
    if (responseLower.includes('attack') && (responseLower.includes('roll') || responseLower.includes('d20'))) {
      diceRoll = '1d20';
    } else if (responseLower.includes('initiative') || responseLower.includes('combat begins')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('damage') && (responseLower.includes('roll') || responseLower.includes('d'))) {
      // Extract damage dice from response (e.g., "1d8+2 damage")
      const damageMatch = responseLower.match(/(\d+d\d+(?:\+\d+)?)/);
      if (damageMatch) {
        diceRoll = damageMatch[1];
      }
    }
    
    // Skill checks
    else if (responseLower.includes('stealth') || responseLower.includes('sneak')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('perception') || responseLower.includes('notice')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('investigation') || responseLower.includes('search')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('persuasion') || responseLower.includes('persuade')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('intimidation') || responseLower.includes('intimidate')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('athletics') || responseLower.includes('climb') || responseLower.includes('jump')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('acrobatics') || responseLower.includes('balance')) {
      diceRoll = '1d20';
    } else if (responseLower.includes('saving throw') || responseLower.includes('save against')) {
      diceRoll = '1d20';
    }

    console.log('Final API response:', {
      response: aiResponse,
      items: items.length,
      statChanges: Object.keys(statChanges).length > 0 ? statChanges : 'none',
      diceRoll: diceRoll || 'none'
    });

    // Append combat enhancement to AI response if combat scenario detected
    const enhancedResponse = aiResponse + combatEnhancement;
    
    return NextResponse.json({
      response: enhancedResponse,
      items: items,
      statChanges: statChanges,
      ...(diceRoll && { diceRoll }),
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