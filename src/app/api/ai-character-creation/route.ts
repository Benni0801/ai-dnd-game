import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface CharacterCreationMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface CharacterData {
  name?: string;
  race?: string;
  class?: string;
  background?: string;
  alignment?: string;
  personality?: string;
  backstory?: string;
  appearance?: string;
  goals?: string;
  fears?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Character Creation API called');
    
    if (!GOOGLE_API_KEY) {
      console.error('Google API key not configured');
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const { messages, characterData } = await request.json();
    console.log('Received request:', { messages: messages?.length, characterData });

    // Build conversation history for AI
    const conversationHistory = messages.map((msg: CharacterCreationMessage) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Create system prompt for character creation
    const systemPrompt = `You are an expert D&D Character Creator AI. Your job is to help users create detailed, interesting characters through a conversational interview process.

**CHARACTER CREATION PROCESS:**
1. Start by asking for the character's name
2. Ask about race (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling, etc.)
3. Ask about class (Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Sorcerer, Warlock, Monk, Druid)
4. Ask about background (Noble, Soldier, Criminal, Sage, Acolyte, Folk Hero, etc.)
5. Ask about alignment (Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, Chaotic Evil)
6. Ask about personality traits, ideals, bonds, and flaws
7. Ask about backstory and motivations
8. Ask about appearance and distinguishing features
9. Ask about goals and fears

**CURRENT CHARACTER DATA:**
${JSON.stringify(characterData, null, 2)}

**RULES:**
- Ask ONE question at a time
- Be engaging and creative in your questions
- Build upon previous answers
- Make the character feel unique and interesting
- When you have enough information, set isComplete to true
- Always respond in a friendly, enthusiastic tone
- Use the character data to avoid repeating questions
- Accept ANY name the user provides, even if it seems unusual

**RESPONSE FORMAT:**
You MUST respond with ONLY a valid JSON object in this exact format:
{
  "message": "Your conversational response to the user",
  "characterData": {
    "key": "value"
  },
  "isComplete": false
}

**CRITICAL:** 
- Respond with ONLY the JSON object, no other text
- The message should be conversational and engaging
- The characterData should only contain new information to add to the character
- Accept any name the user provides

**EXAMPLE RESPONSES:**

If asking for name and user says "goob":
{
  "message": "Goob! What a unique and memorable name! I love it. Now, what race would you like Goob to be? We have Humans, Elves, Dwarves, Halflings, Dragonborn, Gnomes, Half-Elves, Half-Orcs, and Tieflings to choose from.",
  "characterData": {
    "name": "Goob"
  },
  "isComplete": false
}

If character is complete:
{
  "message": "Fantastic! I've gathered all the information I need to create your character. Your character is ready for adventure! Let's create your character and begin your epic journey!",
  "characterData": {
    "finalized": true
  },
  "isComplete": true
}`;

    // Add system prompt to conversation
    const fullConversation = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory
    ];

    // For now, let's use a simple rule-based approach instead of the complex Gemini API
    // This will ensure it works reliably
    const lastUserMessage = messages[messages.length - 1];
    const userInput = lastUserMessage?.content?.trim() || '';
    
    console.log('Processing user input:', userInput);
    console.log('Current character data:', characterData);
    
    let aiResponse = '';
    let characterUpdate = {};
    let isComplete = false;
    
    // Simple rule-based character creation
    if (!characterData.name && userInput) {
      // User provided a name
      aiResponse = `Excellent! ${userInput} is a great name! Now, what race would you like ${userInput} to be? We have Humans, Elves, Dwarves, Halflings, Dragonborn, Gnomes, Half-Elves, Half-Orcs, and Tieflings to choose from.`;
      characterUpdate = { name: userInput };
    } else if (characterData.name && !characterData.race && userInput) {
      // User provided a race
      const race = userInput.toLowerCase();
      aiResponse = `Perfect! A ${race} is an excellent choice! Now, what class would you like ${characterData.name} to be? We have Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Sorcerer, Warlock, Monk, and Druid.`;
      characterUpdate = { race: userInput };
    } else if (characterData.name && characterData.race && !characterData.class && userInput) {
      // User provided a class
      aiResponse = `Wonderful! A ${characterData.race} ${userInput} sounds amazing! Now, what background would you like ${characterData.name} to have? We have Noble, Soldier, Criminal, Sage, Acolyte, Folk Hero, and many more.`;
      characterUpdate = { class: userInput };
    } else if (characterData.name && characterData.race && characterData.class && !characterData.background && userInput) {
      // User provided a background
      aiResponse = `Great choice! Now, what alignment would you like ${characterData.name} to have? We have Lawful Good, Neutral Good, Chaotic Good, Lawful Neutral, True Neutral, Chaotic Neutral, Lawful Evil, Neutral Evil, and Chaotic Evil.`;
      characterUpdate = { background: userInput };
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && !characterData.alignment && userInput) {
      // User provided an alignment
      aiResponse = `Perfect! Now let's add some personality. What are ${characterData.name}'s main personality traits?`;
      characterUpdate = { alignment: userInput };
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && !characterData.personality && userInput) {
      // User provided personality
      aiResponse = `Excellent! Now, what is ${characterData.name}'s backstory? Where do they come from and what led them to become an adventurer?`;
      characterUpdate = { personality: userInput };
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && !characterData.backstory && userInput) {
      // User provided backstory
      aiResponse = `Fantastic! Now, what does ${characterData.name} look like? Describe their appearance, clothing, and any distinguishing features.`;
      characterUpdate = { backstory: userInput };
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && characterData.backstory && !characterData.appearance && userInput) {
      // User provided appearance
      aiResponse = `Wonderful! Finally, what are ${characterData.name}'s goals and what do they fear most?`;
      characterUpdate = { appearance: userInput };
    } else if (characterData.name && characterData.race && characterData.class && characterData.background && characterData.alignment && characterData.personality && characterData.backstory && characterData.appearance && !characterData.goals && userInput) {
      // User provided goals/fears
      aiResponse = `Perfect! I have all the information I need to create ${characterData.name}! Your ${characterData.race} ${characterData.class} is ready for adventure! Let's create your character and begin your epic journey!`;
      characterUpdate = { goals: userInput };
      isComplete = true;
    } else {
      // Fallback response
      aiResponse = `I'm not sure what you mean. Could you please try again?`;
    }
    
    return NextResponse.json({
      message: aiResponse,
      characterData: characterUpdate,
      isComplete: isComplete
    });

  } catch (error) {
    console.error('Error in character creation API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
