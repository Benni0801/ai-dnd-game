import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Get game turns for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID parameter is required' },
        { status: 400 }
      );
    }

    const turns = database.getGameTurnsBySessionId(sessionId);
    
    return NextResponse.json({
      turns: turns.map(turn => ({
        id: turn.id,
        sessionId: turn.sessionId,
        turnNumber: turn.turnNumber,
        playerInput: turn.playerInput,
        aiResponse: turn.aiResponse,
        diceRolls: turn.diceRolls,
        timestamp: turn.timestamp
      }))
    });

  } catch (error) {
    console.error('Error getting game turns:', error);
    return NextResponse.json(
      { error: 'Failed to get game turns' },
      { status: 500 }
    );
  }
}

// Create a new game turn
export async function POST(request: NextRequest) {
  try {
    const { sessionId, turnNumber, playerInput, aiResponse, diceRolls } = await request.json();

    if (!sessionId || !turnNumber || !playerInput || !aiResponse) {
      return NextResponse.json(
        { error: 'Session ID, turn number, player input, and AI response are required' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = database.getGameSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create game turn
    const turn = database.createGameTurn(sessionId, turnNumber, playerInput, aiResponse, diceRolls || []);
    
    return NextResponse.json({
      turn: {
        id: turn.id,
        sessionId: turn.sessionId,
        turnNumber: turn.turnNumber,
        playerInput: turn.playerInput,
        aiResponse: turn.aiResponse,
        diceRolls: turn.diceRolls,
        timestamp: turn.timestamp
      }
    });

  } catch (error) {
    console.error('Error creating game turn:', error);
    return NextResponse.json(
      { error: 'Failed to create game turn' },
      { status: 500 }
    );
  }
}
