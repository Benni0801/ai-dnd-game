import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const { messages, characterData } = await request.json()
    
    console.log('AI Character Creation API called')
    console.log('Messages:', messages)
    console.log('Character Data:', characterData)
    
    // Check if Google API key is available
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.log('No Google API key found, using intelligent fallback')
      
      // Intelligent fallback that interprets user input
      const lastUserMessage = messages[messages.length - 1]
      const userInput = lastUserMessage?.content?.trim() || ''
      
      // Parse the user input intelligently
      const characterUpdate: any = {}
      let aiResponse = ''
      
      // Extract name
      const nameMatch = userInput.match(/(?:named|called|name is|name's)\s+([A-Z][a-z]+)/i)
      if (nameMatch) {
        characterUpdate.name = nameMatch[1]
      }
      
      // Extract race with fuzzy matching for misspellings
      const races = ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome', 'half-elf', 'half-orc', 'tiefling']
      const raceMatch = races.find(race => {
        const lowerInput = userInput.toLowerCase()
        // Exact match
        if (lowerInput.includes(race)) return true
        // Fuzzy matching for common misspellings
        if (race === 'human' && (lowerInput.includes('hunam') || lowerInput.includes('humam') || lowerInput.includes('humn') || lowerInput.includes('hunan') || lowerInput.includes('humna') || lowerInput.includes('humon'))) return true
        if (race === 'elf' && (lowerInput.includes('elv') || lowerInput.includes('elfe'))) return true
        if (race === 'dwarf' && (lowerInput.includes('dwarv') || lowerInput.includes('dwar'))) return true
        if (race === 'halfling' && (lowerInput.includes('halfing') || lowerInput.includes('halflng'))) return true
        if (race === 'dragonborn' && (lowerInput.includes('dragon') && lowerInput.includes('born'))) return true
        if (race === 'gnome' && (lowerInput.includes('gnom') || lowerInput.includes('gnom'))) return true
        if (race === 'half-elf' && (lowerInput.includes('half elf') || lowerInput.includes('halfelf'))) return true
        if (race === 'half-orc' && (lowerInput.includes('half orc') || lowerInput.includes('halforc'))) return true
        if (race === 'tiefling' && (lowerInput.includes('tieflng') || lowerInput.includes('tiefl'))) return true
        return false
      })
      if (raceMatch) {
        characterUpdate.race = raceMatch
      }
      
      // Extract class with fuzzy matching for misspellings
      const classes = ['fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'paladin', 'barbarian', 'bard', 'sorcerer', 'warlock', 'monk', 'druid']
      const classMatch = classes.find(cls => {
        const lowerInput = userInput.toLowerCase()
        // Exact match
        if (lowerInput.includes(cls)) return true
        // Fuzzy matching for common misspellings
        if (cls === 'fighter' && (lowerInput.includes('fightr') || lowerInput.includes('fight'))) return true
        if (cls === 'wizard' && (lowerInput.includes('wizrd') || lowerInput.includes('wiz'))) return true
        if (cls === 'rogue' && (lowerInput.includes('rouge') || lowerInput.includes('rog'))) return true
        if (cls === 'cleric' && (lowerInput.includes('cleric') || lowerInput.includes('cler'))) return true
        if (cls === 'ranger' && (lowerInput.includes('rangr') || lowerInput.includes('rang'))) return true
        if (cls === 'paladin' && (lowerInput.includes('paladn') || lowerInput.includes('pala'))) return true
        if (cls === 'barbarian' && (lowerInput.includes('barbar') || lowerInput.includes('barb'))) return true
        if (cls === 'bard' && (lowerInput.includes('brd') || lowerInput.includes('bard'))) return true
        if (cls === 'sorcerer' && (lowerInput.includes('sorcer') || lowerInput.includes('sorc'))) return true
        if (cls === 'warlock' && (lowerInput.includes('warlc') || lowerInput.includes('warl'))) return true
        if (cls === 'monk' && (lowerInput.includes('mnk') || lowerInput.includes('mon'))) return true
        if (cls === 'druid' && (lowerInput.includes('dru') || lowerInput.includes('dru'))) return true
        return false
      })
      if (classMatch) {
        characterUpdate.class = classMatch
      }
      
      // Extract appearance
      if (userInput.toLowerCase().includes('tall') || userInput.toLowerCase().includes('short') || 
          userInput.toLowerCase().includes('hair') || userInput.toLowerCase().includes('eyes')) {
        characterUpdate.appearance = userInput.match(/(?:tall|short|[a-z]+-?haired?|[a-z]+ eyes?)[^.]*/i)?.[0] || 'Described in backstory'
      }
      
      // Extract backstory elements
      if (userInput.toLowerCase().includes('noble') || userInput.toLowerCase().includes('betrayed') || 
          userInput.toLowerCase().includes('revenge') || userInput.toLowerCase().includes('family')) {
        characterUpdate.backstory = userInput.match(/(?:noble|betrayed|revenge|family)[^.]*/i)?.[0] || 'Complex background mentioned'
      }
      
      // Determine if we have enough information
      const hasName = characterUpdate.name
      const hasRace = characterUpdate.race
      const hasClass = characterUpdate.class
      const hasBackstory = characterUpdate.backstory || characterUpdate.appearance
      
      if (!hasName) {
        aiResponse = `I can see you're describing an interesting character! What's their name?`
      } else if (!hasRace) {
        aiResponse = `Great! ${characterUpdate.name} sounds fascinating. What race are they? (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, or Tiefling)`
      } else if (!hasClass) {
        aiResponse = `Perfect! A ${characterUpdate.race} named ${characterUpdate.name}. What class are they? (Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Sorcerer, Warlock, Monk, or Druid)`
      } else if (!hasBackstory) {
        aiResponse = `Excellent! ${characterUpdate.name} the ${characterUpdate.race} ${characterUpdate.class} is taking shape. Tell me more about their background, appearance, or what drives them.`
      } else {
        aiResponse = `Fantastic! I've gathered some great details about ${characterUpdate.name}. Let me know if you'd like to add anything else about their personality, goals, or any other details before we finalize your character!`
      }
      
      return NextResponse.json({
        message: aiResponse,
        characterData: characterUpdate,
        isComplete: hasName && hasRace && hasClass && hasBackstory
      })
    }

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Create conversation context
    const conversationHistory = messages.map((msg: any) => 
      `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n')

    const currentCharacterData = JSON.stringify(characterData, null, 2)

    const prompt = `You are an expert Dungeon Master helping a player create their D&D character. 

Current conversation:
${conversationHistory}

Current character data:
${currentCharacterData}

Your task is to:
1. Interpret what the user is telling you about their character
2. Extract relevant information and update the character data
3. Ask thoughtful follow-up questions to gather missing information
4. When you have enough information, indicate the character is complete

Available D&D races: Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling
Available D&D classes: Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Sorcerer, Warlock, Monk, Druid
Available alignments: Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, Chaotic Evil

Respond with a JSON object in this exact format:
{
  "message": "Your response to the user",
  "characterData": {
    "name": "character name if mentioned",
    "race": "race if mentioned", 
    "class": "class if mentioned",
    "background": "background if mentioned",
    "alignment": "alignment if mentioned",
    "personality": "personality traits if mentioned",
    "backstory": "backstory if mentioned", 
    "appearance": "appearance if mentioned",
    "goals": "goals if mentioned"
  },
  "isComplete": false
}

Only include fields in characterData that are actually mentioned or can be reasonably inferred. Set isComplete to true when you have enough information to create a complete character.

Be conversational, helpful, and creative in your responses!`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI Response:', text)
    
    // Try to parse the JSON response
    let parsedResponse
    try {
      // Remove any markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedResponse = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('Raw response:', text)
      
      // Fallback: create a simple response
      parsedResponse = {
        message: text || "I'm having trouble processing that. Could you tell me more about your character?",
        characterData: {},
        isComplete: false
      }
    }
    
    return NextResponse.json(parsedResponse)
    
  } catch (error) {
    console.error('Error in character creation API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: 'I encountered an error while processing your request. Please try again.',
      details: errorMessage 
    }, { status: 500 })
  }
}
