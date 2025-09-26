import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for room by ID API
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  return NextResponse.json({ room: null, message: 'Room API temporarily disabled' });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  return NextResponse.json({ message: 'Room API temporarily disabled' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  return NextResponse.json({ message: 'Room API temporarily disabled' });
}