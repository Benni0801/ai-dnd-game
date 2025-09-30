import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key found',
        message: 'Please add GOOGLE_API_KEY to your environment variables'
      });
    }

    console.log('Testing API key access...');
    
    // Try to list available models
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(listModelsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      models: data.models || [],
      error: data.error || null,
      message: response.ok ? 'Successfully connected to Google AI Studio' : 'Failed to connect'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      message: 'Failed to test API connection'
    });
  }
}




