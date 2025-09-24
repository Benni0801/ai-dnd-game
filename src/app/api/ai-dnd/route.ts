import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body || {};

    // Check for API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Simple response for now
    const aiResponse = "Welcome to your AI D&D adventure! The dungeon master is ready to guide you through an epic quest. What would you like to do first?";

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