import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Create a new game session
export async function POST(request: NextRequest) {
  try {
    const { characterId, userId, initialLocation } = await request.json();

    if (!characterId || !userId) {
      return NextResponse.json(
        { error: 'Character ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if character exists
    const character = database.getCharacterById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Create game session
    const session = database.createGameSession(characterId, userId, initialLocation);
    
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
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { error: 'Failed to create game session' },
      { status: 500 }
    );
  }
}

// Get game sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');

    if (!userId && !characterId) {
      return NextResponse.json(
        { error: 'User ID or Character ID parameter is required' },
        { status: 400 }
      );
    }

    let sessions;
    if (userId) {
      sessions = database.getGameSessionsByUserId(userId);
    } else {
      sessions = database.getGameSessionsByCharacterId(characterId!);
    }
    
    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        characterId: session.characterId,
        userId: session.userId,
        currentLocation: session.currentLocation,
        questProgress: session.questProgress,
        npcRelations: session.npcRelations,
        gameState: session.gameState,
        lastPlayed: session.lastPlayed,
        createdAt: session.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting game sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get game sessions' },
      { status: 500 }
    );
  }
}

// Update a game session
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, updates } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = database.updateGameSession(sessionId, updates);
    
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

