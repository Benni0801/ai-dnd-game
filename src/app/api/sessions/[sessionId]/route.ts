import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for session by ID API
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  return NextResponse.json({ session: null, message: 'Session API temporarily disabled' });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  return NextResponse.json({ message: 'Session API temporarily disabled' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  return NextResponse.json({ message: 'Session API temporarily disabled' });
}