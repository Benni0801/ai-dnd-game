import { NextRequest, NextResponse } from 'next/server';

// Cloud AI Dungeon Master - For Online Deployment

// Simple system prompt for the AI Dungeon Master
const SYSTEM_PROMPT = `You are a Dungeon Master for a D&D game. Create engaging fantasy adventures with descriptive language. Ask what the player wants to do. Use [DICE_ROLL:d20+5:Description] format when dice rolls are needed. Keep responses short and engaging.`;

// Call OpenAI API for cloud deployment
async function generateAIResponse(messages: any[], characterStats: any, selectedModel: string = 'gpt-3.5-turbo'): Promise<string> {
  console.log('Starting AI response generation...');
  console.log('Selected model:', selectedModel);
  
  try {
    // Build the conversation context
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (HP:${characterStats?.hp || 20})`;

    // Prepare the messages for OpenAI
    const openaiMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + '\n\n' + characterContext
      },
      ...conversationHistory
    ];

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: openaiMessages,
        max_tokens: 150,
        temperature: 0.7,
        stream: false
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', data.choices[0].message.content.substring(0, 100) + '...');
    return data.choices[0].message.content;

  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    
    // Check if it's a timeout error
    if (error?.name === 'AbortError') {
      throw new Error('AI response timed out. Please try again.');
    }
    
    // Check if it's an API key error
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
    }
    
    // Re-throw other errors with more context
    throw new Error(`AI service error: ${error?.message}. Please check your API configuration.`);
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterStats, selectedModel } = body || {};

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate AI response using OpenAI
    const aiResponse = await generateAIResponse(messages, characterStats, selectedModel);

    return NextResponse.json({
      message: aiResponse,
      usage: { total_tokens: 0 }
    });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
