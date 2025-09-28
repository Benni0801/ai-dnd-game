import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, character, onDiceRoll } = await request.json()
    
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
      
      if (userInput.toLowerCase().includes('look') || userInput.toLowerCase().includes('examine')) {
        aiResponse = `You look around and see a mysterious forest path ahead. Ancient trees tower above you, their branches creating a canopy that filters the sunlight. You notice a small wooden sign that reads "Adventure Awaits" pointing deeper into the woods.`
      } else if (userInput.toLowerCase().includes('walk') || userInput.toLowerCase().includes('go') || userInput.toLowerCase().includes('move')) {
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
      } else if (userInput.toLowerCase().includes('climb') || userInput.toLowerCase().includes('jump') || userInput.toLowerCase().includes('stealth')) {
        // Trigger ability checks with dice rolls
        if (userInput.toLowerCase().includes('climb')) {
          diceRoll = '1d20'
          aiResponse = `You attempt to climb the rocky surface. Let me roll for your Athletics check...`
        } else if (userInput.toLowerCase().includes('jump')) {
          diceRoll = '1d20'
          aiResponse = `You prepare to make a daring leap. Let me roll for your Athletics check...`
        } else if (userInput.toLowerCase().includes('stealth')) {
          diceRoll = '1d20'
          aiResponse = `You try to move quietly and avoid detection. Let me roll for your Stealth check...`
        }
      } else if (userInput.toLowerCase().includes('persuade') || userInput.toLowerCase().includes('convince') || userInput.toLowerCase().includes('charm')) {
        diceRoll = '1d20'
        aiResponse = `You attempt to persuade the person. Let me roll for your Persuasion check...`
      } else if (userInput.toLowerCase().includes('intimidate') || userInput.toLowerCase().includes('threaten')) {
        diceRoll = '1d20'
        aiResponse = `You try to intimidate your target. Let me roll for your Intimidation check...`
      } else if (userInput.toLowerCase().includes('investigate') || userInput.toLowerCase().includes('search') || userInput.toLowerCase().includes('examine')) {
        diceRoll = '1d20'
        aiResponse = `You carefully investigate the area. Let me roll for your Investigation check...`
      } else if (userInput.toLowerCase().includes('perception') || userInput.toLowerCase().includes('notice') || userInput.toLowerCase().includes('spot')) {
        diceRoll = '1d20'
        aiResponse = `You try to notice details around you. Let me roll for your Perception check...`
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
