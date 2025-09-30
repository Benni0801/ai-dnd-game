import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, character, onDiceRoll, isInCombat } = await request.json()
    
    console.log('AI D&D Game API called')
    console.log('Messages:', messages)
    console.log('Character:', character)
    console.log('Dice rolling available:', !!onDiceRoll)
    
    // Intelligent fallback for D&D game responses (works with or without API key)
    const lastUserMessage = messages[messages.length - 1]
    const userInput = lastUserMessage?.content?.trim() || ''
    
    console.log('AI Route - User Input:', userInput)
    console.log('AI Route - Is In Combat:', isInCombat)
    
    let aiResponse = ''
    let diceRoll = null
    
    // Handle combat actions properly instead of blocking them
    if (isInCombat) {
      // Let combat actions be processed normally - don't block them
      // The combat handling logic below will take care of the responses
    }
      
      if (userInput.toLowerCase().includes('look') || userInput.toLowerCase().includes('examine')) {
        aiResponse = `You look around and see a mysterious forest path ahead. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You notice a small wooden sign that reads "Adventure Awaits" pointing deeper into the woods.`
      } else if (userInput.toLowerCase().includes('walk') || userInput.toLowerCase().includes('go') || userInput.toLowerCase().includes('move') || userInput.toLowerCase().includes('find') || userInput.toLowerCase().includes('search for') || userInput.toLowerCase().includes('look for')) {
        aiResponse = `You begin walking down the forest path. The air is filled with the sounds of birds chirping and leaves rustling. After a few minutes, you come across a clearing where you see a small cottage with smoke rising from its chimney. An old woman waves at you from the window.`
      } else if (userInput.toLowerCase().includes('talk') || userInput.toLowerCase().includes('speak')) {
        aiResponse = `You approach the cottage and knock on the door. The old woman opens it with a warm smile. "Welcome, ${character.name || 'traveler'}! I've been expecting you. I have a quest that might interest a ${character.race || 'brave soul'} like yourself."`
      } else if (userInput.toLowerCase().includes('quest') || userInput.toLowerCase().includes('mission')) {
        aiResponse = `"There's a dragon terrorizing the nearby village," the old woman explains. "The villagers are too afraid to leave their homes. As a ${character.class || 'skilled adventurer'}, you might be just the person to help them. Will you accept this quest?"`
      } else if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('accept') || userInput.toLowerCase().includes('agree')) {
        aiResponse = `"Excellent!" the old woman claps her hands. "The dragon's lair is in the mountains to the north. But be careful - the path is treacherous and filled with dangers. You'll need all your ${character.class || 'skills'} to survive. Good luck, ${character.name || 'brave adventurer'}!"`
      } else if (userInput.toLowerCase().includes('no') || userInput.toLowerCase().includes('decline') || userInput.toLowerCase().includes('refuse')) {
        aiResponse = `The old woman's smile fades slightly. "I understand. Not everyone is ready for such a dangerous quest. Perhaps you'd like to explore the area first and gain some experience? There are always smaller tasks that need doing."`
      } else if (userInput.toLowerCase().includes('fight') || userInput.toLowerCase().includes('attack') || userInput.toLowerCase().includes('battle') || userInput.toLowerCase().includes('worg') || userInput.toLowerCase().includes('encounter') || userInput.toLowerCase().includes('monster')) {
        // AI creates dynamic enemies based on what the player wants to fight
        if (userInput.toLowerCase().includes('worg')) {
          aiResponse = `A massive worg emerges from the shadows, its yellow eyes gleaming with hunger. This is no ordinary wolf - it's a fearsome predator with razor-sharp claws and powerful jaws. Combat begins! [ENEMY:{"name":"Worg","hp":26,"ac":13,"damage":"2d6+3","description":"A massive wolf-like creature with supernatural intelligence"}]`
        } else if (userInput.toLowerCase().includes('dragon')) {
          aiResponse = `A massive dragon swoops down from the sky, its scales glinting in the light. Fire erupts from its maw as it roars a challenge. Combat begins! [ENEMY:{"name":"Young Red Dragon","hp":178,"ac":18,"damage":"2d10+4","description":"A young but deadly red dragon with fire breath"}]`
        } else if (userInput.toLowerCase().includes('troll')) {
          aiResponse = `A towering troll lumbers forward, its green skin covered in warts and scars. It wields a massive club and regenerates from wounds. Combat begins! [ENEMY:{"name":"Troll","hp":84,"ac":15,"damage":"2d8+4","description":"A massive troll with regenerative abilities"}]`
        } else if (userInput.toLowerCase().includes('orc')) {
          aiResponse = `A fierce orc warrior charges at you, brandishing a crude but deadly weapon. Its tusks gleam as it lets out a battle cry. Combat begins! [ENEMY:{"name":"Orc Warrior","hp":15,"ac":13,"damage":"1d12+3","description":"A battle-hardened orc warrior"}]`
        } else if (userInput.toLowerCase().includes('goblin')) {
          aiResponse = `A sneaky goblin jumps out from behind a rock, brandishing a rusty dagger. It cackles menacingly as it prepares to strike. Combat begins! [ENEMY:{"name":"Goblin","hp":7,"ac":15,"damage":"1d4+2","description":"A small but cunning goblin"}]`
        } else {
          // Generic combat encounter - AI creates a random enemy
          const enemies = [
            {name: "Giant Rat", hp: 5, ac: 12, damage: "1d4", desc: "A large, aggressive rat with sharp teeth"},
            {name: "Giant Spider", hp: 8, ac: 13, damage: "1d6", desc: "A large spider with venomous fangs"},
            {name: "Wolf", hp: 11, ac: 13, damage: "2d4", desc: "A fierce wolf with sharp claws and teeth"},
            {name: "Skeleton Warrior", hp: 13, ac: 13, damage: "1d6+1", desc: "An animated skeleton with a rusty sword"}
          ];
          const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
          aiResponse = `A ${randomEnemy.name.toLowerCase()} appears before you! ${randomEnemy.desc} Combat begins! [ENEMY:{"name":"${randomEnemy.name}","hp":${randomEnemy.hp},"ac":${randomEnemy.ac},"damage":"${randomEnemy.damage}","description":"${randomEnemy.desc}"}]`
        }
      } else if (userInput.toLowerCase().includes('i attack') || userInput.toLowerCase().includes('attack the') || userInput.toLowerCase().includes('attack with my weapon') || userInput.toLowerCase().includes('slash') || userInput.toLowerCase().includes('strike')) {
        // Handle combat attacks with automatic dice rolls
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const damageRoll = Math.floor(Math.random() * 8) + 1;
        aiResponse = `You swing your weapon at your enemy! [DICE:1d20] (Your Attack Roll: ${attackRoll}) You ${attackRoll >= 15 ? 'hit' : 'miss'}! ${attackRoll >= 15 ? `[DICE:1d8+1] (Your Damage: ${damageRoll}) The enemy takes ${damageRoll} damage!` : 'Your attack misses!'}`
      } else if (userInput.toLowerCase().includes('i cast') || userInput.toLowerCase().includes('cast a spell')) {
        // Handle spell casting with automatic dice rolls
        const spellRoll = Math.floor(Math.random() * 20) + 1;
        const spellDamage = Math.floor(Math.random() * 6) + 1;
        aiResponse = `You channel magical energy and cast a spell! [DICE:1d20] (Your Spell Attack: ${spellRoll}) You ${spellRoll >= 15 ? 'hit' : 'miss'}! ${spellRoll >= 15 ? `[DICE:1d6] (Spell Damage: ${spellDamage}) The enemy takes ${spellDamage} magical damage!` : 'Your spell fizzles out!'}`
      } else if (userInput.toLowerCase().includes('i use an item') || userInput.toLowerCase().includes('use an item')) {
        // Handle item usage
        aiResponse = `You reach into your inventory and use an item. The effect takes hold immediately.`
      } else if (userInput.toLowerCase().includes('i dodge') || userInput.toLowerCase().includes('dodge')) {
        // Handle dodging with automatic dice rolls
        const dodgeRoll = Math.floor(Math.random() * 20) + 1;
        aiResponse = `You attempt to dodge and avoid your enemy's attacks. [DICE:1d20] (Your Dexterity Check: ${dodgeRoll}) You ${dodgeRoll >= 12 ? 'successfully dodge' : 'fail to dodge'}!`
      } else if (userInput.toLowerCase().includes('enemy turn') || userInput.toLowerCase().includes('enemy attacks')) {
        // Handle enemy turn with automatic dice rolls
        const enemyAttackRoll = Math.floor(Math.random() * 20) + 1;
        const enemyDamage = Math.floor(Math.random() * 6) + 1;
        aiResponse = `The enemy attacks you! [DICE:1d20] (Enemy Attack Roll: ${enemyAttackRoll}) The enemy ${enemyAttackRoll >= 12 ? 'hits' : 'misses'}! ${enemyAttackRoll >= 12 ? `[DICE:1d6] (Enemy Damage: ${enemyDamage}) You take ${enemyDamage} damage!` : 'The enemy\'s attack misses!'}`
      } else if (isInCombat && (userInput.toLowerCase().includes('sneak attack') || userInput.toLowerCase().includes('hide'))) {
        // Handle rogue abilities in combat - AI will handle dice rolls in response
        if (userInput.toLowerCase().includes('sneak attack')) {
          aiResponse = `You attempt a sneak attack! Let me roll for your attack...`
        } else {
          aiResponse = `You try to hide from your enemy. Let me roll for your Stealth check...`
        }
      } else if (userInput.toLowerCase().includes('climb') || userInput.toLowerCase().includes('jump') || userInput.toLowerCase().includes('stealth')) {
        // Only roll dice for specific skill checks when explicitly requested
        if (userInput.toLowerCase().includes('climb')) {
          aiResponse = `You attempt to climb the rocky surface.`
        } else if (userInput.toLowerCase().includes('jump')) {
          aiResponse = `You prepare to make a daring leap.`
        } else if (userInput.toLowerCase().includes('stealth')) {
          aiResponse = `You try to move quietly and avoid detection.`
        }
      } else if (userInput.toLowerCase().includes('persuade') || userInput.toLowerCase().includes('convince') || userInput.toLowerCase().includes('charm')) {
        aiResponse = `You attempt to persuade the person.`
      } else if (userInput.toLowerCase().includes('intimidate') || userInput.toLowerCase().includes('threaten')) {
        aiResponse = `You try to intimidate your target.`
      } else if (userInput.toLowerCase().includes('investigate') || userInput.toLowerCase().includes('search') || userInput.toLowerCase().includes('examine')) {
        aiResponse = `You carefully investigate the area.`
      } else if (userInput.toLowerCase().includes('perception') || userInput.toLowerCase().includes('notice') || userInput.toLowerCase().includes('spot')) {
        aiResponse = `You try to notice details around you.`
      } else if (userInput.toLowerCase().includes('i have completed the quest') || userInput.toLowerCase().includes('completed the quest')) {
        // Handle quest completion
        aiResponse = `Excellent work! You have successfully completed your quest. The quest giver is pleased with your efforts and thanks you for your service. You feel more experienced and confident in your abilities. What would you like to do next?`
      } else if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('what')) {
        aiResponse = `You can try various actions like: look around, walk/go/move, talk/speak, ask about quests, accept or decline quests, fight/attack, climb/jump/stealth (triggers ability checks), persuade/intimidate (social checks), investigate/search (investigation), or explore. What would you like to do next?`
      } else {
        aiResponse = `You consider your options. The forest around you seems peaceful but mysterious. You could explore further, talk to the old woman, or perhaps look for other paths. What would you like to do?`
      }
      
    // Return the response (works for both API key and no API key cases)
    const response: any = {
      message: aiResponse
    };
    
    if (diceRoll) {
      response.diceRoll = diceRoll;
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in AI D&D API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: 'I encountered an error while processing your request. Please try again.',
      details: errorMessage 
    }, { status: 500 })
  }
}
