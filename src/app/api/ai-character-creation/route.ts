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
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const { messages, characterData } = await request.json();

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

**RESPONSE FORMAT:**
Respond with a JSON object containing:
{
  "message": "Your conversational response to the user",
  "characterData": {
    "key": "value" // Only include new/updated character data
  },
  "isComplete": false // Set to true when character creation is finished
}

**EXAMPLE RESPONSES:**

If asking for name:
{
  "message": "Excellent! Now, what would you like your character to be called? This name will be remembered throughout your adventures!",
  "characterData": {},
  "isComplete": false
}

If character is complete:
{
  "message": "Fantastic! I've gathered all the information I need to create your character. Your ${characterData.race} ${characterData.class} named ${characterData.name} is ready for adventure! Let's create your character and begin your epic journey!",
  "characterData": {
    "finalized": true
  },
  "isComplete": true
}

**IMPORTANT:** Always respond with valid JSON. The message should be conversational and engaging, while the characterData should only contain new information to add to the character.`;

    // Add system prompt to conversation
    const fullConversation = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: fullConversation,
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to generate character creation response' }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response from Gemini API:', data);
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      // Fallback response
      parsedResponse = {
        message: aiResponse,
        characterData: {},
        isComplete: false
      };
    }

    return NextResponse.json({
      message: parsedResponse.message || aiResponse,
      characterData: parsedResponse.characterData || {},
      isComplete: parsedResponse.isComplete || false,
      usage: data.usageMetadata || { total_tokens: 0 }
    });

  } catch (error) {
    console.error('Error in character creation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
