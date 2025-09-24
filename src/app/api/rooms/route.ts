import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { name, dmId } = await request.json();

    if (!name || !dmId) {
      return NextResponse.json(
        { error: 'Room name and DM ID are required' },
        { status: 400 }
      );
    }

    // Check if DM exists
    const dm = database.getUserById(dmId);
    if (!dm) {
      return NextResponse.json(
        { error: 'DM not found' },
        { status: 404 }
      );
    }

    // Create game room
    const room = database.createGameRoom(name, dmId);
    
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
    console.error('Error creating game room:', error);
    return NextResponse.json(
      { error: 'Failed to create game room' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rooms = database.getActiveGameRooms();
    
    return NextResponse.json({
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        players: room.players,
        dmId: room.dmId,
        isActive: room.isActive,
        createdAt: room.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting game rooms:', error);
    return NextResponse.json(
      { error: 'Failed to get game rooms' },
      { status: 500 }
    );
  }
}



