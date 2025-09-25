import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Get a specific game session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = database.getGameSessionById(params.sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        id: session.id,
        characterId: session.characterId,
        userId: session.userId,
        currentLocation: session.currentLocation,
        questProgress: session.questProgress,
        npcRelations: session.npcRelations,
        gameState: session.gameState,
        lastPlayed: session.lastPlayed,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting game session:', error);
    return NextResponse.json(
      { error: 'Failed to get game session' },
      { status: 500 }
    );
  }
}

// Update a specific game session
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const updates = await request.json();
    const session = database.updateGameSession(params.sessionId, updates);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        id: session.id,
        characterId: session.characterId,
        userId: session.userId,
        currentLocation: session.currentLocation,
        questProgress: session.questProgress,
        npcRelations: session.npcRelations,
        gameState: session.gameState,
        lastPlayed: session.lastPlayed,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating game session:', error);
    return NextResponse.json(
      { error: 'Failed to update game session' },
      { status: 500 }
    );
  }
}


