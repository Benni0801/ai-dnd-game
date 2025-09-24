import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Create a new game note
export async function POST(request: NextRequest) {
  try {
    const { sessionId, content, category } = await request.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'Session ID and content are required' },
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

    // Create game note
    const note = database.createGameNote(sessionId, content, category || 'general');
    
    return NextResponse.json({
      note: {
        id: note.id,
        sessionId: note.sessionId,
        content: note.content,
        category: note.category,
        createdAt: note.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating game note:', error);
    return NextResponse.json(
      { error: 'Failed to create game note' },
      { status: 500 }
    );
  }
}

// Get notes for a session
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

    const notes = database.getGameNotesBySessionId(sessionId);
    
    return NextResponse.json({
      notes: notes.map(note => ({
        id: note.id,
        sessionId: note.sessionId,
        content: note.content,
        category: note.category,
        createdAt: note.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting game notes:', error);
    return NextResponse.json(
      { error: 'Failed to get game notes' },
      { status: 500 }
    );
  }
}

// Update a game note
export async function PUT(request: NextRequest) {
  try {
    const { noteId, content, category } = await request.json();

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;

    const note = database.updateGameNote(noteId, updates);
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      note: {
        id: note.id,
        sessionId: note.sessionId,
        content: note.content,
        category: note.category,
        createdAt: note.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating game note:', error);
    return NextResponse.json(
      { error: 'Failed to update game note' },
      { status: 500 }
    );
  }
}

// Delete a game note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID parameter is required' },
        { status: 400 }
      );
    }

    const success = database.deleteGameNote(noteId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting game note:', error);
    return NextResponse.json(
      { error: 'Failed to delete game note' },
      { status: 500 }
    );
  }
}

