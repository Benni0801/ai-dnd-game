import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, character, onDiceRoll, isInCombat } = await request.json()
    
    console.log('AI D&D Game API called')
    console.log('Messages:', messages)
    console.log('Character:', character)
    console.log('Dice rolling available:', !!onDiceRoll)
    
    // Check if Google API key is available
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.log('No Google API key found, using intelligent fallback for game')
      
      // Intelligent fallback for D&D game responses
      const lastUserMessage = messages[messages.length - 1]
      const userInput = lastUserMessage?.content?.trim() || ''
      
      let aiResponse = ''
      
      // Simple game responses based on user input
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
      } else if (userInput.toLowerCase().includes('fight') || userInput.toLowerCase().includes('attack') || userInput.toLowerCase().includes('battle')) {
        aiResponse = `You prepare for combat! As a ${character.class || 'warrior'}, you draw your weapon and assume a fighting stance. The old woman looks concerned. "Please, there's no need for violence here. I mean you no harm!"`
      } else if (userInput.toLowerCase().includes('rat') || userInput.toLowerCase().includes('encounter a rat')) {
        aiResponse = `A large, aggressive rat emerges from the shadows! Its beady eyes gleam with malice as it bares its sharp teeth. Combat begins! [ENEMY:{"name":"Giant Rat","hp":5,"ac":12,"damage":"1d4","description":"A large, aggressive rat with sharp teeth"}]`
      } else if (userInput.toLowerCase().includes('spider') || userInput.toLowerCase().includes('encounter a spider')) {
        aiResponse = `A massive spider drops down from the ceiling! Its eight eyes fix on you as venom drips from its fangs. Combat begins! [ENEMY:{"name":"Giant Spider","hp":8,"ac":13,"damage":"1d6","description":"A large spider with venomous fangs"}]`
      } else if (userInput.toLowerCase().includes('wolf') || userInput.toLowerCase().includes('encounter a wolf')) {
        aiResponse = `A fierce wolf emerges from the underbrush, growling menacingly. Its yellow eyes lock onto you as it prepares to attack. Combat begins! [ENEMY:{"name":"Wolf","hp":11,"ac":13,"damage":"2d4","description":"A fierce wolf with sharp claws and teeth"}]`
      } else if (userInput.toLowerCase().includes('skeleton') || userInput.toLowerCase().includes('encounter a skeleton')) {
        aiResponse = `A skeletal warrior rises from the ground, its bones clattering as it draws a rusty sword. Combat begins! [ENEMY:{"name":"Skeleton Warrior","hp":13,"ac":13,"damage":"1d6+1","description":"An animated skeleton with a rusty sword"}]`
      } else if (userInput.toLowerCase().includes('i attack') || userInput.toLowerCase().includes('attack the') || userInput.toLowerCase().includes('attack the goblin') || userInput.toLowerCase().includes('attack the rat') || userInput.toLowerCase().includes('attack the spider') || userInput.toLowerCase().includes('attack the wolf') || userInput.toLowerCase().includes('attack the skeleton')) {
        // Handle combat attacks with dice rolls
        diceRoll = '1d20'
        aiResponse = `You swing your weapon at your enemy! Let me roll for your attack...`
      } else if (userInput.toLowerCase().includes('i cast') || userInput.toLowerCase().includes('cast a spell')) {
        // Handle spell casting with dice rolls
        diceRoll = '1d20'
        aiResponse = `You channel magical energy and cast a spell! Let me roll for your spell attack...`
      } else if (userInput.toLowerCase().includes('i use an item') || userInput.toLowerCase().includes('use an item')) {
        // Handle item usage
        aiResponse = `You reach into your inventory and use an item. The effect takes hold immediately.`
      } else if (userInput.toLowerCase().includes('i dodge') || userInput.toLowerCase().includes('dodge')) {
        // Handle dodging
        diceRoll = '1d20'
        aiResponse = `You attempt to dodge and avoid your enemy's attacks. Let me roll for your Dexterity check...`
      } else if (userInput.toLowerCase().includes('enemy turn') || userInput.toLowerCase().includes('enemy attacks')) {
        // Handle enemy turn with dice rolls
        diceRoll = '1d20'
        aiResponse = `The enemy attacks you! Let me roll for the enemy's attack...`
      } else if (isInCombat && (userInput.toLowerCase().includes('sneak attack') || userInput.toLowerCase().includes('hide'))) {
        // Handle rogue abilities in combat
        if (userInput.toLowerCase().includes('sneak attack')) {
          diceRoll = '1d20'
          aiResponse = `You attempt a sneak attack! Let me roll for your attack...`
        } else {
          diceRoll = '1d20'
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
      
      return NextResponse.json({
        message: aiResponse,
        ...(diceRoll && { diceRoll })
      })
    }

    // If Google API key is available, use it for more sophisticated responses
    // This would be the full AI implementation
    return NextResponse.json({
      message: "AI service is configured but not fully implemented yet. Using fallback responses."
    })
    
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
