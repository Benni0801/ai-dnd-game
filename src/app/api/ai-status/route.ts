import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Ollama is running by trying to list models
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        status: 'offline',
        message: 'Ollama service not responding',
        models: [],
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    const models = data.models || [];

    // Check if we have the required model
    const hasModel = models.some((model: any) => 
      model.name === 'llama3.2' || model.name === 'llama3.2:1b'
    );

    return NextResponse.json({
      status: 'online',
      message: hasModel ? 'AI ready' : 'AI service running but no model loaded',
      models: models.map((model: any) => ({
        name: model.name,
        size: model.size,
        modified: model.modified_at
      })),
      hasModel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking AI status:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Cannot connect to Ollama service',
      models: [],
      hasModel: false,
      timestamp: new Date().toISOString()
    });
  }
}


