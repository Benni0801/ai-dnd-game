import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = database.getGameRoomById(params.roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        players: room.players,
        dmId: room.dmId,
        isActive: room.isActive,
        createdAt: room.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting game room:', error);
    return NextResponse.json(
      { error: 'Failed to get game room' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { action, userId } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Action and user ID are required' },
        { status: 400 }
      );
    }

    const room = database.getGameRoomById(params.roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    let success = false;
    
    if (action === 'join') {
      success = database.joinGameRoom(params.roomId, userId);
    } else if (action === 'leave') {
      success = database.leaveGameRoom(params.roomId, userId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "join" or "leave"' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to perform action' },
        { status: 400 }
      );
    }

    // Return updated room
    const updatedRoom = database.getGameRoomById(params.roomId);
    return NextResponse.json({
      room: {
        id: updatedRoom!.id,
        name: updatedRoom!.name,
        players: updatedRoom!.players,
        dmId: updatedRoom!.dmId,
        isActive: updatedRoom!.isActive,
        createdAt: updatedRoom!.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating game room:', error);
    return NextResponse.json(
      { error: 'Failed to update game room' },
      { status: 500 }
    );
  }
}



