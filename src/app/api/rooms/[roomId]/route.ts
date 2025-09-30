import { NextRequest, NextResponse } from "next/server";
// Mock room data for now - this can be replaced with Supabase calls later
const mockRooms: { [key: string]: any } = {
  '1': {
    id: '1',
    name: 'Test Room',
    players: [],
    dmId: null,
    isActive: false,
    createdAt: new Date().toISOString()
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = mockRooms[params.roomId];
    
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

    const room = mockRooms[params.roomId];
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    let success = false;
    
    if (action === 'join') {
      if (!room.players.includes(userId)) {
        room.players.push(userId);
        success = true;
      }
    } else if (action === 'leave') {
      room.players = room.players.filter((id: string) => id !== userId);
      success = true;
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
    console.error('Error updating game room:', error);
    return NextResponse.json(
      { error: 'Failed to update game room' },
      { status: 500 }
    );
  }
}
