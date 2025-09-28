import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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

    const { character } = await request.json();

    // Create a detailed prompt for character image generation
    const imagePrompt = `Create a detailed fantasy character portrait for a D&D character:

**Character Details:**
- Name: ${character.name || 'Unknown'}
- Race: ${character.race || 'Human'}
- Class: ${character.class || 'Adventurer'}
- Background: ${character.background || 'Mysterious'}
- Alignment: ${character.alignment || 'Neutral'}
- Appearance: ${character.appearance || 'A heroic adventurer'}

**Style Requirements:**
- Fantasy art style, similar to D&D official artwork
- High quality, detailed character portrait
- Professional lighting and composition
- Character should look heroic and ready for adventure
- Include appropriate clothing, armor, or robes for their class
- Show distinctive features based on their race
- Portrait format (head and shoulders or full body)
- Rich, vibrant colors
- Fantasy background or simple neutral background

**Technical Requirements:**
- High resolution
- Clean, professional artwork
- No text or watermarks
- Character should be the main focus
- Appropriate for a fantasy RPG game

Create an image that captures the essence of this ${character.race} ${character.class} named ${character.name}, showing their personality and background through their appearance, clothing, and expression.`;

    // Use Gemini's image generation capabilities
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate a detailed image prompt for a D&D character portrait. The prompt should be optimized for AI image generation and include all the character details provided.

Character: ${JSON.stringify(character, null, 2)}

Create a comprehensive, detailed prompt that will generate a high-quality fantasy character portrait. Focus on visual details, style, and composition.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate image prompt');
      // Fallback to a simple image URL or placeholder
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/400x400/8b5cf6/ffffff?text=${encodeURIComponent(character.name || 'Character')}`,
        prompt: imagePrompt
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response from Gemini API for image generation');
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/400x400/8b5cf6/ffffff?text=${encodeURIComponent(character.name || 'Character')}`,
        prompt: imagePrompt
      });
    }

    const generatedPrompt = data.candidates[0].content.parts[0].text;
    
    // For now, we'll use a placeholder service or return a generated image URL
    // In a real implementation, you might use DALL-E, Midjourney, or another image generation service
    
    // Create a unique identifier for the character
    const characterId = `${character.name || 'character'}-${character.race || 'human'}-${character.class || 'adventurer'}`.toLowerCase().replace(/\s+/g, '-');
    
    // Use a placeholder service that can generate images based on text
    // You could replace this with actual image generation API calls
    const imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(characterId)}&backgroundColor=8b5cf6&clothingColor=262e33&skinColor=edb98a&hairColor=8b5cf6`;

    return NextResponse.json({
      imageUrl: imageUrl,
      prompt: generatedPrompt || imagePrompt,
      characterId: characterId
    });

  } catch (error) {
    console.error('Error generating character image:', error);
    
    // Fallback response
    const character = await request.json().then(data => data.character).catch(() => ({}));
    return NextResponse.json({
      imageUrl: `https://via.placeholder.com/400x400/8b5cf6/ffffff?text=${encodeURIComponent(character.name || 'Character')}`,
      prompt: 'Fallback image due to generation error',
      error: 'Image generation failed, using placeholder'
    });
  }
}

