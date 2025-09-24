import { NextRequest, NextResponse } from 'next/server';

// Hugging Face Inference API - Completely FREE!

// Simple system prompt for the AI Dungeon Master
const SYSTEM_PROMPT = `You are a Dungeon Master for a D&D game. Create engaging fantasy adventures with descriptive language. Ask what the player wants to do. Use [DICE_ROLL:d20+5:Description] format when dice rolls are needed. Keep responses short and engaging.`;

// Call Hugging Face Inference API (FREE!)
async function generateAIResponse(messages: any[], characterStats: any): Promise<string> {
  console.log('Starting AI response generation with Hugging Face...');
  
  try {
    // Build the conversation context
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Create the character context
    const characterContext = `Player: ${characterStats?.name || 'Adventurer'} (HP:${characterStats?.hp || 20})`;

    // Prepare the prompt for Hugging Face
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${characterContext}\n\nConversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nassistant:`;

    // Call Hugging Face Inference API (FREE!)
    console.log('Calling Hugging Face API...');
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}` // Free tier works without key
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          do_sample: true
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`Hugging Face API error: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      
      // Fallback to a simple response if API fails
      return "The dungeon master ponders your words carefully. 'Interesting choice, adventurer. What would you like to do next?'";
    }

    const data = await response.json();
    console.log('Hugging Face response received');
    
    // Extract the generated text
    let aiResponse = '';
    if (Array.isArray(data) && data.length > 0) {
      aiResponse = data[0].generated_text || data[0].text || '';
    } else if (data.generated_text) {
      aiResponse = data.generated_text;
    } else if (data.text) {
      aiResponse = data.text;
    }

    // Clean up the response
    if (aiResponse) {
      // Remove the original prompt from the response
      const lines = aiResponse.split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine.startsWith('assistant:')) {
        aiResponse = lastLine.replace('assistant:', '').trim();
      }
    }

    // Fallback if no good response
    if (!aiResponse || aiResponse.length < 10) {
      aiResponse = "The dungeon master nods thoughtfully. 'A wise decision, adventurer. How shall you proceed?'";
    }

    return aiResponse;

  } catch (error) {
    console.error('Error calling Hugging Face API:', error);
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return "The dungeon master is deep in thought. 'Give me a moment to consider your words, brave adventurer.'";
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

    // Generate AI response using Hugging Face (FREE!)
    const aiResponse = await generateAIResponse(messages, characterStats);

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
