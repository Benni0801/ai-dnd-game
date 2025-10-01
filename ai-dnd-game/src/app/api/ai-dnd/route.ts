import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, character, onDiceRoll, isInCombat } = await request.json()
    
    // FORCE our combat system for any combat-related input
    const lastUserMessage = messages[messages.length - 1]
    const userInput = lastUserMessage?.content?.trim() || ''
    
    // AGGRESSIVE OVERRIDE: If this looks like a combat scenario, use our system immediately
    if (userInput.toLowerCase().includes('goblin') || 
        userInput.toLowerCase().includes('rat') || 
        userInput.toLowerCase().includes('fight') || 
        userInput.toLowerCase().includes('attack') ||
        userInput.toLowerCase().includes('combat') ||
        userInput.toLowerCase().includes('battle') ||
        userInput.toLowerCase().includes('monster') ||
        userInput.toLowerCase().includes('enemy') ||
        isInCombat) {
      
      // IMMEDIATELY return our combat system response - don't let external AI interfere
      if (userInput.toLowerCase().includes('goblin')) {
        return NextResponse.json({ 
          message: `A sneaky goblin jumps out from behind a rock, brandishing a rusty dagger. It cackles menacingly as it prepares to strike. Combat begins! [ENEMY:{"name":"Goblin","hp":7,"ac":15,"damage":"1d4+2","description":"A small but cunning goblin","xp":50}]`
        })
      }
      
      if (userInput.toLowerCase().includes('rat')) {
        return NextResponse.json({ 
          message: `A diseased-looking rat emerges from the shadows, its eyes glowing with malevolence. It bares its yellowed teeth and prepares to attack. Combat begins! [ENEMY:{"name":"Giant Rat","hp":5,"ac":12,"damage":"1d4","description":"A large, aggressive rat with sharp teeth","xp":25}]`
        })
      }
      
      if (userInput.toLowerCase().includes('i attack') || userInput.toLowerCase().includes('attack the')) {
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const damageRoll = Math.floor(Math.random() * 8) + 1;
        const hit = attackRoll >= 15;
        const enemyDies = hit && Math.random() < 0.5;
        const xpReward = enemyDies ? Math.floor(Math.random() * 50) + 25 : 0;
        
        if (enemyDies) {
          return NextResponse.json({ 
            message: `You swing your weapon at your enemy! [DICE:1d20] (Your Attack Roll: ${attackRoll}) You hit! [DICE:1d8+1] (Your Damage: ${damageRoll}) The enemy takes ${damageRoll} damage and collapses! You feel more experienced after the victory! [XP:${xpReward}]`
          })
        } else {
          return NextResponse.json({ 
            message: `You swing your weapon at your enemy! [DICE:1d20] (Your Attack Roll: ${attackRoll}) You ${hit ? 'hit' : 'miss'}! ${hit ? `[DICE:1d8+1] (Your Damage: ${damageRoll}) The enemy takes ${damageRoll} damage!` : 'Your attack misses!'} [TURN:enemy]`
          })
        }
      }
    }
    
    // AGGRESSIVE COMBAT DETECTION - catch ALL combat scenarios
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
    ]
    
    const isCombatInput = combatKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    ) || isInCombat
    
    // If this is a combat input, immediately use our combat system
    if (isCombatInput) {
      let aiResponse = ''
      
      // Handle combat initiation
      if (userInput.toLowerCase().includes('fight') || userInput.toLowerCase().includes('battle') || userInput.toLowerCase().includes('encounter') || userInput.toLowerCase().includes('monster') || 
          userInput.toLowerCase().includes('goblin') || userInput.toLowerCase().includes('worg') || userInput.toLowerCase().includes('dragon') || userInput.toLowerCase().includes('troll') || userInput.toLowerCase().includes('orc') || userInput.toLowerCase().includes('skeleton') || userInput.toLowerCase().includes('spider') || userInput.toLowerCase().includes('wolf') || userInput.toLowerCase().includes('rat') || userInput.toLowerCase().includes('bandit') || userInput.toLowerCase().includes('zombie') || userInput.toLowerCase().includes('kobold') || userInput.toLowerCase().includes('imp') ||
          userInput.toLowerCase().includes('bear') || userInput.toLowerCase().includes('boar') || userInput.toLowerCase().includes('crocodile') || userInput.toLowerCase().includes('eagle') || userInput.toLowerCase().includes('hyena') || userInput.toLowerCase().includes('lion') || userInput.toLowerCase().includes('panther') || userInput.toLowerCase().includes('shark') || userInput.toLowerCase().includes('tiger') ||
          userInput.toLowerCase().includes('ghoul') || userInput.toLowerCase().includes('ghost') || userInput.toLowerCase().includes('lich') || userInput.toLowerCase().includes('mummy') || userInput.toLowerCase().includes('vampire') || userInput.toLowerCase().includes('wraith') ||
          userInput.toLowerCase().includes('demon') || userInput.toLowerCase().includes('devil') || userInput.toLowerCase().includes('succubus') || userInput.toLowerCase().includes('balor') ||
          userInput.toLowerCase().includes('dragon') || userInput.toLowerCase().includes('wyvern') || userInput.toLowerCase().includes('drake') ||
          userInput.toLowerCase().includes('elemental') || userInput.toLowerCase().includes('earth') || userInput.toLowerCase().includes('water') || userInput.toLowerCase().includes('air') ||
          userInput.toLowerCase().includes('giant') || userInput.toLowerCase().includes('ogre') || userInput.toLowerCase().includes('troll') ||
          userInput.toLowerCase().includes('beholder') || userInput.toLowerCase().includes('mind') || userInput.toLowerCase().includes('aboleth') ||
          userInput.toLowerCase().includes('golem') || userInput.toLowerCase().includes('animated') ||
          userInput.toLowerCase().includes('fairy') || userInput.toLowerCase().includes('dryad') || userInput.toLowerCase().includes('satyr') ||
          userInput.toLowerCase().includes('knight') || userInput.toLowerCase().includes('mage') || userInput.toLowerCase().includes('assassin') || userInput.toLowerCase().includes('cultist') || userInput.toLowerCase().includes('pirate') || userInput.toLowerCase().includes('gladiator') ||
          userInput.toLowerCase().includes('chimera') || userInput.toLowerCase().includes('griffon') || userInput.toLowerCase().includes('hydra') || userInput.toLowerCase().includes('medusa') || userInput.toLowerCase().includes('minotaur') || userInput.toLowerCase().includes('sphinx') ||
          userInput.toLowerCase().includes('ooze') || userInput.toLowerCase().includes('slime') ||
          userInput.toLowerCase().includes('treant') || userInput.toLowerCase().includes('shambler') ||
          userInput.toLowerCase().includes('angel') || userInput.toLowerCase().includes('unicorn') ||
          userInput.toLowerCase().includes('hellhound') || userInput.toLowerCase().includes('nightmare') ||
          userInput.toLowerCase().includes('worg')) {
        
        // AI creates dynamic enemies based on what the player wants to fight
        if (userInput.toLowerCase().includes('worg')) {
          aiResponse = `A massive worg emerges from the shadows, its yellow eyes gleaming with hunger. This is no ordinary wolf - it's a fearsome predator with razor-sharp claws and powerful jaws. Combat begins! [ENEMY:{"name":"Worg","hp":26,"ac":13,"damage":"2d6+3","description":"A massive wolf-like creature with supernatural intelligence","xp":200}]`
        } else if (userInput.toLowerCase().includes('dragon')) {
          aiResponse = `A massive dragon swoops down from the sky, its scales glinting in the light. Fire erupts from its maw as it roars a challenge. Combat begins! [ENEMY:{"name":"Young Red Dragon","hp":178,"ac":18,"damage":"2d10+4","description":"A young but deadly red dragon with fire breath","xp":3900}]`
        } else if (userInput.toLowerCase().includes('troll')) {
          aiResponse = `A towering troll lumbers forward, its green skin covered in warts and scars. It wields a massive club and regenerates from wounds. Combat begins! [ENEMY:{"name":"Troll","hp":84,"ac":15,"damage":"2d8+4","description":"A massive troll with regenerative abilities","xp":1800}]`
        } else if (userInput.toLowerCase().includes('orc')) {
          aiResponse = `A fierce orc warrior charges at you, brandishing a crude but deadly weapon. Its tusks gleam as it lets out a battle cry. Combat begins! [ENEMY:{"name":"Orc Warrior","hp":15,"ac":13,"damage":"1d12+3","description":"A battle-hardened orc warrior","xp":100}]`
        } else if (userInput.toLowerCase().includes('goblin')) {
          aiResponse = `A sneaky goblin jumps out from behind a rock, brandishing a rusty dagger. It cackles menacingly as it prepares to strike. Combat begins! [ENEMY:{"name":"Goblin","hp":7,"ac":15,"damage":"1d4+2","description":"A small but cunning goblin","xp":50}]`
        } else if (userInput.toLowerCase().includes('rat')) {
          aiResponse = `A diseased-looking rat emerges from the shadows, its eyes glowing with malevolence. It bares its yellowed teeth and prepares to attack. Combat begins! [ENEMY:{"name":"Giant Rat","hp":5,"ac":12,"damage":"1d4","description":"A large, aggressive rat with sharp teeth","xp":25}]`
        } else {
          // Use intelligent enemy generation
          const generateIntelligentEnemy = (userInput: string) => {
            const input = userInput.toLowerCase();
            
            if (input.includes('civilian') || input.includes('farmer') || input.includes('merchant') || input.includes('villager') || input.includes('commoner')) {
              return {name: "Civilian", hp: 4, ac: 10, damage: "1d2", desc: "A frightened civilian with no combat training", xp: 10};
            }
            if (input.includes('guard') || input.includes('soldier') || input.includes('watchman')) {
              return {name: "Town Guard", hp: 11, ac: 16, damage: "1d6+1", desc: "A trained town guard with chain mail and a spear", xp: 100};
            }
            if (input.includes('tree') || input.includes('oak') || input.includes('pine') || input.includes('willow')) {
              return {name: "Ancient Tree", hp: 59, ac: 5, damage: "2d6+3", desc: "A massive ancient tree that has gained sentience", xp: 1100};
            }
            if (input.includes('book') || input.includes('tome') || input.includes('grimoire') || input.includes('spellbook')) {
              return {name: "Animated Spellbook", hp: 15, ac: 12, damage: "1d4", desc: "A magical book that has gained sentience and attacks", xp: 200};
            }
            if (input.includes('child') || input.includes('kid') || input.includes('young') || input.includes('baby')) {
              return {name: "Child", hp: 2, ac: 8, damage: "1d2-1", desc: "A frightened child with no combat ability", xp: 5};
            }
            
            // Default to a goblin if no specific match
            return {name: "Goblin", hp: 7, ac: 15, damage: "1d4+2", desc: "A small but cunning goblin with a rusty dagger", xp: 50};
          };
          
          const selectedEnemy = generateIntelligentEnemy(userInput);
          aiResponse = `A ${selectedEnemy.name.toLowerCase()} appears before you! ${selectedEnemy.desc} Combat begins! [ENEMY:{"name":"${selectedEnemy.name}","hp":${selectedEnemy.hp},"ac":${selectedEnemy.ac},"damage":"${selectedEnemy.damage}","description":"${selectedEnemy.desc}","xp":${selectedEnemy.xp}}]`
        }
      }
      // Handle combat actions
      else if (userInput.toLowerCase().includes('i attack') || userInput.toLowerCase().includes('attack the') || userInput.toLowerCase().includes('attack with my weapon') || userInput.toLowerCase().includes('slash') || userInput.toLowerCase().includes('strike') || userInput.toLowerCase().includes('attack') || userInput.toLowerCase().includes('hit') || userInput.toLowerCase().includes('swing') || userInput.toLowerCase().includes('strike at') || userInput.toLowerCase().includes('slash at')) {
        if (!isInCombat) {
          aiResponse = `You swing your weapon, but there's no enemy to attack!`
        } else {
          const attackRoll = Math.floor(Math.random() * 20) + 1;
          const damageRoll = Math.floor(Math.random() * 8) + 1;
          const hit = attackRoll >= 15;
          
          // Simulate enemy death for XP reward (50% chance on hit)
          const enemyDies = hit && Math.random() < 0.5;
          const xpReward = enemyDies ? Math.floor(Math.random() * 50) + 25 : 0;
          
          if (enemyDies) {
            aiResponse = `You swing your weapon at your enemy! [DICE:1d20] (Your Attack Roll: ${attackRoll}) You hit! [DICE:1d8+1] (Your Damage: ${damageRoll}) The enemy takes ${damageRoll} damage and collapses! You feel more experienced after the victory! [XP:${xpReward}]`
          } else {
            aiResponse = `You swing your weapon at your enemy! [DICE:1d20] (Your Attack Roll: ${attackRoll}) You ${hit ? 'hit' : 'miss'}! ${hit ? `[DICE:1d8+1] (Your Damage: ${damageRoll}) The enemy takes ${damageRoll} damage!` : 'Your attack misses!'} [TURN:enemy]`
          }
        }
      }
      else if (userInput.toLowerCase().includes('i cast') || userInput.toLowerCase().includes('cast a spell')) {
        if (!isInCombat) {
          aiResponse = `You channel magical energy, but there's no enemy to target!`
        } else {
          const spellRoll = Math.floor(Math.random() * 20) + 1;
          const spellDamage = Math.floor(Math.random() * 6) + 1;
          const hit = spellRoll >= 15;
          aiResponse = `You channel magical energy and cast a spell! [DICE:1d20] (Your Spell Attack: ${spellRoll}) You ${hit ? 'hit' : 'miss'}! ${hit ? `[DICE:1d6] (Spell Damage: ${spellDamage}) The enemy takes ${spellDamage} magical damage!` : 'Your spell fizzles out!'} [TURN:enemy]`
        }
      }
      else if (userInput.toLowerCase().includes('i dodge') || userInput.toLowerCase().includes('dodge')) {
        if (!isInCombat) {
          aiResponse = `You dodge around, but there's no immediate threat to avoid!`
        } else {
          const dodgeRoll = Math.floor(Math.random() * 20) + 1;
          aiResponse = `You attempt to dodge and avoid your enemy's attacks. [DICE:1d20] (Your Dexterity Check: ${dodgeRoll}) You ${dodgeRoll >= 12 ? 'successfully dodge' : 'fail to dodge'}! [TURN:enemy]`
        }
      }
      else if (userInput.toLowerCase().includes('enemy turn') || userInput.toLowerCase().includes('enemy attacks') || userInput.toLowerCase().includes('the ') && userInput.toLowerCase().includes(' attacks you')) {
        if (!isInCombat) {
          aiResponse = `There's no enemy to attack you!`
        } else {
          const enemyAttackRoll = Math.floor(Math.random() * 20) + 1;
          const enemyDamage = Math.floor(Math.random() * 6) + 1;
          const hit = enemyAttackRoll >= 12;
          aiResponse = `The enemy attacks you! [DICE:1d20] (Enemy Attack Roll: ${enemyAttackRoll}) The enemy ${hit ? 'hits' : 'misses'}! ${hit ? `[DICE:1d6] (Enemy Damage: ${enemyDamage}) You take ${enemyDamage} damage!` : 'The enemy\'s attack misses!'} [TURN:player]`
        }
      }
      
      // Return our combat response immediately
      if (aiResponse) {
        return NextResponse.json({ message: aiResponse })
      }
    }
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('AI D&D Game API called')
      console.log('Messages:', messages)
      console.log('Character:', character)
      console.log('Dice rolling available:', !!onDiceRoll)
      console.log('AI Route - User Input:', userInput)
      console.log('AI Route - Is In Combat:', isInCombat)
      console.log('AI Route - Full Messages:', JSON.stringify(messages, null, 2))
    }
    
    let aiResponse = ''
    let diceRoll = null
    
    // Handle non-combat interactions
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
    } else if (userInput.toLowerCase().includes('i use an item') || userInput.toLowerCase().includes('use an item')) {
      aiResponse = `You reach into your inventory and use an item. The effect takes hold immediately.`
    } else if (userInput.toLowerCase().includes('climb') || userInput.toLowerCase().includes('jump') || userInput.toLowerCase().includes('stealth')) {
      if (userInput.toLowerCase().includes('climb')) {
        aiResponse = `You attempt to climb the rocky surface.`
      } else if (userInput.toLowerCase().includes('jump')) {
        aiResponse = `You prepare to make a daring leap.`
      } else if (userInput.toLowerCase().includes('stealth')) {
        aiResponse = `You try to move quietly and avoid detection.`
      }
    } else if (userInput.toLowerCase().includes('persuade') || userInput.toLowerCase().includes('intimidate')) {
      if (userInput.toLowerCase().includes('persuade')) {
        aiResponse = `You attempt to persuade the person with your words.`
      } else if (userInput.toLowerCase().includes('intimidate')) {
        aiResponse = `You try to intimidate the person with your presence.`
      }
    } else if (userInput.toLowerCase().includes('investigate') || userInput.toLowerCase().includes('search')) {
      aiResponse = `You carefully investigate the area, looking for clues and hidden details.`
    } else if (userInput.toLowerCase().includes('explore')) {
      aiResponse = `You set out to explore the surrounding area, keeping your eyes open for anything interesting or dangerous.`
    } else if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('what can i do')) {
      aiResponse = `You can try various actions like: look around, walk/go/move, talk/speak, ask about quests, accept or decline quests, fight/attack, climb/jump/stealth (triggers ability checks), persuade/intimidate (social checks), investigate/search (investigation), or explore. What would you like to do next?`
    } else {
      aiResponse = `You consider your options. The forest around you seems peaceful but mysterious. You could explore further, talk to the old woman, or perhaps look for other paths. What would you like to do?`
    }
    
    // Return the response (works for both API key and no API key cases)
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Route - Generated Response:', aiResponse)
    }
    
    const response: { message: string; diceRoll?: any } = {
      message: aiResponse
    };
    
    if (diceRoll) {
      response.diceRoll = diceRoll;
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('AI D&D Game API Error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
