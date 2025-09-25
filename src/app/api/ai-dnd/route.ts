import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterStats } = body || {};

        // Check for API key - if not available, use fallback responses
        const apiKey = process.env.GOOGLE_API_KEY;
        console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');
        
        if (!apiKey) {
          console.log('ERROR: No API key found');
          
          return NextResponse.json({
            error: 'No Google API key configured. Please add GOOGLE_API_KEY to your environment variables.',
            message: 'API key missing - cannot generate AI response'
          }, { status: 500 });
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

    // Call Google Gemini API using the correct endpoint
    console.log('PATH: Using Google Gemini API');
    console.log('Calling Google Gemini API...');
    
    // Try different API endpoints based on the API key type
    let response;
    
    // Check if it's a Google AI Studio key (starts with AIza)
    if (apiKey?.startsWith('AIza')) {
      console.log('Using Google AI Studio API endpoint');
      // Try different model formats that might work
      const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-pro',
        'gemini-1.5-pro-001',
        'gemini-pro',
        'gemini-pro-001',
        'gemini-1.0-pro',
        'gemini-1.0-pro-001'
      ];
      let lastError = null;
      
      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`);
          // Try different endpoint formats - focus on working ones
          const endpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            `https://ai.google.dev/api/v1beta/models/${model}:generateContent?key=${apiKey}`,
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
            `https://ai.google.dev/api/v1/models/${model}:generateContent?key=${apiKey}`
          ];
          
          let modelResponse = null;
          for (const endpoint of endpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              modelResponse = await fetch(endpoint, {
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
              
              if (modelResponse.ok) {
                response = modelResponse;
                console.log(`Successfully connected to model: ${model} with endpoint: ${endpoint}`);
                break;
              } else {
                const errorData = await modelResponse.clone().text();
                console.log(`Endpoint ${endpoint} failed with status ${modelResponse.status}: ${errorData}`);
              }
            } catch (endpointError) {
              console.log(`Endpoint ${endpoint} threw error:`, endpointError);
            }
          }
          
          if (!modelResponse || !modelResponse.ok) {
            try {
              const errorData = modelResponse ? await modelResponse.clone().text() : 'No response';
              console.log(`Model ${model} failed with status ${modelResponse?.status || 'No status'}: ${errorData}`);
              lastError = { status: modelResponse?.status || 'No status', data: errorData };
            } catch (readError) {
              console.log(`Model ${model} failed: Could not read error body`);
              lastError = { status: 'Unknown', data: 'Could not read error body' };
            }
          }
        } catch (error) {
          console.log(`Model ${model} threw error:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        console.log('All Google AI Studio models failed - falling back to enhanced responses');
        // Don't throw error, just fall through to the enhanced fallback system
      }
    } else {
      console.log('Using alternative API endpoint');
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
    }
    
        if (!response || !response.ok) {
          let errorData = 'No response received';
          if (response) {
            try {
              errorData = await response.clone().text();
            } catch (readError) {
              errorData = 'Could not read error body';
            }
          }
          console.error(`Gemini API error: ${response?.status || 'No status'} - ${errorData}`);
          
          // Return actual error instead of fallback
          return NextResponse.json({
            error: `Google Gemini API failed. Status: ${response?.status || 'No status'}. Error: ${errorData}`,
            message: 'AI service unavailable - please check your API key and try again'
          }, { status: 500 });
        }

    // If we reach here, the API call was successful
    console.log('Gemini API response status:', response.status);

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    
    // Extract the generated text
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text || '';
      console.log('Extracted AI response:', aiResponse);
    } else {
      console.log('No valid response structure found in data:', data);
    }

    // Clean up the response
    if (aiResponse) {
      aiResponse = aiResponse.replace(/Please respond as the Dungeon Master:/g, '').trim();
      console.log('Cleaned AI response:', aiResponse);
    }

        // Check if response is valid
        if (!aiResponse || aiResponse.length < 10) {
          console.log('AI response too short or empty');
          return NextResponse.json({
            error: 'AI response was empty or too short',
            message: 'AI service returned invalid response'
          }, { status: 500 });
        }

        return NextResponse.json({
          message: aiResponse,
          usage: { total_tokens: 0 },
          debug: 'Successfully connected to Gemini API'
        });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
        // Check if it's a timeout error
        if (error?.name === 'AbortError') {
          return NextResponse.json({
            error: 'Request timeout - AI service took too long to respond',
            message: 'AI service timeout - please try again'
          }, { status: 500 });
        }
        
        // Check if it's an API key error
        if (error?.message?.includes('403') || error?.message?.includes('API_KEY')) {
          return NextResponse.json({
            error: 'Invalid Google API key. Please check your GOOGLE_API_KEY configuration.',
            message: 'API key authentication failed'
          }, { status: 500 });
        }
        
        // Return actual error
        return NextResponse.json({
          error: `Unexpected error: ${error.message}`,
          message: 'AI service error - please check configuration'
        }, { status: 500 });
  }
}