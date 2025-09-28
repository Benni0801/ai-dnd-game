import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, characterData } = await request.json()
    
    console.log('AI Character Creation API called')
    console.log('Messages:', messages)
    console.log('Character Data:', characterData)
    
    // Simple rule-based character creation
    const lastUserMessage = messages[messages.length - 1]
    const userInput = lastUserMessage?.content?.trim() || ''
    
    let aiResponse = ''
    let characterUpdate = {}
    let isComplete = false
    
    if (!characterData.name && userInput) {
      aiResponse = `Excellent! ${userInput} is a great name! Now, what race would you like ${userInput} to be? We have Humans, Elves, Dwarves, Halflings, Dragonborn, Gnomes, Half-Elves, Half-Orcs, and Tieflings to choose from.`
      characterUpdate = { name: userInput }
    } else if (characterData.name && !characterData.race && userInput) {
      const race = userInput.toLowerCase()
      aiResponse = `Perfect! A ${race} is an excellent choice! Now, what class would you like ${characterData.name} to be? We have Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Sorcerer, Warlock, Monk, and Druid.`
      characterUpdate = { race: userInput }
    } else if (characterData.name && characterData.race && !characterData.class && userInput) {
      const className = userInput.toLowerCase()
      aiResponse = `Wonderful! A ${className} is perfect for ${characterData.name}! Now, what background would you like? We have Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier, and many more.`
      characterUpdate = { class: userInput }
    } else if (characterData.name && characterData.race && characterData.class && !characterData.background && userInput) {
      aiResponse = `Great choice! Now, what alignment would you like ${characterData.name} to have? We have Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, and Chaotic Evil.`
      characterUpdate = { background: userInput }
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && !characterData.alignment && userInput) {
      aiResponse = `Perfect! Now, tell me about ${characterData.name}'s personality. What are they like? Are they brave, cautious, funny, serious?`
      characterUpdate = { alignment: userInput }
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && !characterData.personality && userInput) {
      aiResponse = `Excellent! Now, what is ${characterData.name}'s backstory? Where did they come from? What led them to become an adventurer?`
      characterUpdate = { personality: userInput }
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && !characterData.backstory && userInput) {
      aiResponse = `Amazing! Now, describe ${characterData.name}'s appearance. What do they look like?`
      characterUpdate = { backstory: userInput }
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && characterData.backstory && !characterData.appearance && userInput) {
      aiResponse = `Perfect! Finally, what are ${characterData.name}'s goals? What do they hope to achieve on their adventures?`
      characterUpdate = { appearance: userInput }
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && characterData.backstory && characterData.appearance && !characterData.goals && userInput) {
      aiResponse = `Fantastic! I have all the information I need to create ${characterData.name}! Your ${characterData.race} ${characterData.class} is ready for adventure! Let's create your character and begin your epic journey!`
      characterUpdate = { goals: userInput }
      isComplete = true
    } else {
      aiResponse = `I'm not sure what you mean. Could you please try again?`
    }
    
    return NextResponse.json({
      message: aiResponse,
      characterData: characterUpdate,
      isComplete: isComplete
    })
    
  } catch (error) {
    console.error('Error in character creation API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
