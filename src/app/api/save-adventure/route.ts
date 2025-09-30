import { NextRequest, NextResponse } from 'next/server';
import { adventureService } from '@/lib/adventure-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, characterId, sessionData } = body;

    if (!userId || !characterId || !sessionData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await adventureService.saveAdventureSession(userId, characterId, sessionData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving adventure via API:', error);
    return NextResponse.json({ error: 'Failed to save adventure' }, { status: 500 });
  }
}

