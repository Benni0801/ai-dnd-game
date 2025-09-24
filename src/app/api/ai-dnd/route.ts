import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterStats } = body || {};

    // Check for API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Build the conversation context
    const conversationHistory = messages.slice(-5).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (${characterStats?.race || 'Unknown'} ${characterStats?.class || 'Hero'}, HP:${characterStats?.hp || 20})`;

    // Simple system prompt
    const systemPrompt = `You are a Dungeon Master for a D&D game. Create engaging fantasy adventures with descriptive language. Ask what the player wants to do. Keep responses engaging and complete.`;

    // Prepare the prompt for Gemini
    const fullPrompt = `${systemPrompt}\n\n${characterContext}\n\nConversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\nPlease respond as the Dungeon Master:`;

    // Call Google Gemini API
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
    
    // Extract the generated text
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text || '';
    }

    // Clean up the response
    if (aiResponse) {
      aiResponse = aiResponse.replace(/Please respond as the Dungeon Master:/g, '').trim();
    }

    // Fallback if no good response
    if (!aiResponse || aiResponse.length < 10) {
      aiResponse = "The dungeon master nods thoughtfully. 'An interesting turn of events. What would you like to do next?'";
    }

    return NextResponse.json({
      message: aiResponse,
      usage: { total_tokens: 0 }
    });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
    // Check if it's a timeout error
    if (error?.name === 'AbortError') {
      return NextResponse.json({
        message: "The dungeon master is deep in thought. 'Give me a moment to consider your words, brave adventurer.'",
        usage: { total_tokens: 0 }
      });
    }
    
    // Check if it's an API key error
    if (error?.message?.includes('403') || error?.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Invalid Google API key. Please check your GOOGLE_API_KEY configuration.' },
        { status: 500 }
      );
    }
    
    // Return a fallback response
    return NextResponse.json({
      message: "The dungeon master strokes their beard thoughtfully. 'An interesting turn of events. What would you like to do next?'",
      usage: { total_tokens: 0 }
    });
  }
}