import { NextRequest, NextResponse } from 'next/server';

// Google Gemini AI Dungeon Master - For Online Deployment

// Simple system prompt for the AI Dungeon Master
const SYSTEM_PROMPT = `You are a Dungeon Master for a D&D game. Create engaging fantasy adventures with descriptive language. Ask what the player wants to do. Use [DICE_ROLL:d20+5:Description] format when dice rolls are needed. Keep responses engaging and complete.`;

// Call Google Gemini API for cloud deployment
async function generateAIResponse(messages: any[], characterStats: any): Promise<string> {
  console.log('Starting Gemini AI response generation...');
  
  try {
    // Build the conversation context
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (HP:${characterStats?.hp || 20})`;

    // Prepare the prompt for Gemini
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${characterContext}\n\nConversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nPlease respond as the Dungeon Master:`;

    // Call Google Gemini API
    console.log('Calling Gemini API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');
    
    // Extract the generated text
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text || '';
    }

    // Clean up the response
    if (aiResponse) {
      // Remove any prompt remnants
      aiResponse = aiResponse.replace(/Please respond as the Dungeon Master:/g, '').trim();
    }

    // Fallback if no good response
    if (!aiResponse || aiResponse.length < 10) {
      aiResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
    }

    return aiResponse;

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    
    // Check if it's a timeout error
    if (error?.name === 'AbortError') {
      return "The dungeon master is deep in thought. 'Give me a moment to consider your words, brave adventurer.'";
    }
    
    // Check if it's an API key error
    if (error?.message?.includes('403') || error?.message?.includes('API_KEY')) {
      throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY configuration.');
    }
    
    // Return a fallback response
    return "The dungeon master strokes their beard thoughtfully. 'An interesting turn of events. What would you like to do next?'";
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterStats } = body || {};

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Generate AI response using Gemini
    const aiResponse = await generateAIResponse(messages, characterStats);

    return NextResponse.json({
      message: aiResponse,
      usage: { total_tokens: 0 }
    });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
